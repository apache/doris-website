---
{
    "title": "Internal RPC Encryption with Mutual TLS",
    "language": "en",
    "description": "Configure mutual TLS for Doris internal RPC: prepare node certificates, enable FE/BE encryption, verify connections, and rotate certificates safely.",
    "keywords": ["Doris internal RPC", "mutual TLS", "mTLS", "FE BE encryption", "TLS certificates"],
    "doc_type": "feature"
}
---

<!-- Knowledge type: Deployment guide / Configuration reference -->
<!-- Applicable scenarios: Internal RPC encryption / Node certificate authentication -->

## Overview

Use mutual TLS (mTLS) to encrypt supported internal RPC connections and require both peers to present certificates signed by the cluster's trusted certificate authority (CA). The open-source private RPC provider covers gRPC/BRPC and blocking Thrift connections. It does not fall back to plaintext after a TLS connection fails.

:::note Availability
Internal RPC mutual TLS is supported starting from Apache Doris 5.0. This guide applies to 5.0 and later versions.
:::

### Protocol coverage

| Connection | Behavior with the configuration in this guide |
| --- | --- |
| FE gRPC to BE BRPC, including fragment dispatch | mTLS. FE verifies the server certificate chain and target hostname/IP. |
| Internal native BRPC, including BE-to-BE connections | mTLS. Native BRPC verifies the CA chain, without a per-node hostname or role allowlist. |
| Blocking Thrift between Doris nodes, including backend/heartbeat RPC and BE-to-FE lazy split fetching | mTLS. Clients verify the server certificate chain and target hostname/IP. |
| MySQL, HTTP/HTTPS, Arrow Flight, FE BDBJE replication | Excluded by this guide's configuration. Their security must be configured separately. |
| Broker RPC, RPC functions, and remote Doris endpoints | Keep their existing external connection policy. Local private RPC TLS does not enable encryption for these endpoints. |
| Cloud Meta Service/Recycler and other control-plane transports | Not comprehensively covered by this provider. |

Server listeners admit peers belonging to the configured CA trust domain. Use a **dedicated cluster CA**: any certificate issued by that CA is a cluster RPC credential. TLS protects data in transit; it does not encrypt stored data or process memory. Encrypted Iceberg reads additionally require their own reader support and capability checks.

## Quick Start

### Prerequisites

- Install Apache Doris 5.0 or later FE and BE packages on every participating node.
- Reserve a maintenance window. Plaintext nodes cannot communicate with TLS listeners; this provider does not support a mixed plaintext/TLS rolling transition.
- Obtain a PEM CA certificate and a separate PEM certificate/private key for each node. Certificates must support both `serverAuth` and `clientAuth`, and contain DNS/IP Subject Alternative Names (SANs) matching the addresses peers actually use. If Doris registers or connects to a node by IP, include that IP as an IP SAN.
- Keep the CA private key on the signing system, outside Doris nodes. Give the Doris service account read access to its own identity files, and restrict private-key access to that account.
- Use blocking FE Thrift, preferably the default `THREAD_POOL`. `THREADED_SELECTOR` is unsupported for this TLS implementation.

### 1. Prepare node certificates

Use your organization's certificate issuance process. The following example creates a private key and certificate signing request (CSR) for one example BE. Run it in a new, protected directory on that node, and replace the example DNS name and IP with the node's actual identity. Repeat with distinct keys and names for every FE and BE.

```bash
umask 077
cat > node.cnf <<'EOF'
[req]
prompt = no
distinguished_name = dn
req_extensions = node_cert
[dn]
CN = be1.example.com
[node_cert]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth,clientAuth
subjectAltName = @names
[names]
DNS.1 = be1.example.com
IP.1 = 192.0.2.10
EOF
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out node-key.pem
openssl req -new -key node-key.pem -out node.csr -config node.cnf
```

Expected result: an unencrypted PKCS#8 PEM private key `node-key.pem` and a CSR `node.csr`. Send only the CSR and requested certificate extensions to the CA operator. Do not send the node private key.

If the CA operator uses OpenSSL, an example signing command on the **CA system** is:

```bash
openssl x509 -req -in node.csr -CA cluster-ca.pem -CAkey cluster-ca-key.pem \
    -CAcreateserial -out node-cert.pem -days 365 -sha256 \
    -extfile node.cnf -extensions node_cert
```

Use your PKI's validity and serial-number policies. Expected result: `node-cert.pem` signed by the dedicated cluster CA, with the requested SANs and both extended key usages. Return that certificate and the public CA certificate to the node. If intermediate CAs are used, supply the required certificate chain and trust bundle. The CA private key stays on the CA system.

### 2. Configure FE

On each FE, add the following to `conf/fe.conf`. Replace the placeholder paths with absolute paths readable by that FE's service account, pointing to that FE's own certificate and key.

```properties
enable_tls=true
tls_verify_mode=verify_fail_if_no_peer_cert
tls_certificate_path=/path/to/fe-cert.pem
tls_private_key_path=/path/to/fe-key.pem
tls_ca_certificate_path=/path/to/cluster-ca.pem
tls_cert_refresh_interval_seconds=0
tls_excluded_protocols=http,mysql,arrowflight,bdbje
thrift_server_type=THREAD_POOL
thrift_rpc_connect_timeout_ms=10000
```

Leave `tls_peer_cert_required_san_dns` empty. This example uses an unencrypted private key; FE also supports its existing `tls_private_key_password` setting for a supported encrypted PEM key.

### 3. Configure BE

On each BE, add the following to `conf/be.conf`, using that BE's own certificate and key:

```properties
enable_tls=true
tls_verify_mode=verify_fail_if_no_peer_cert
tls_certificate_path=/path/to/be-cert.pem
tls_private_key_path=/path/to/be-key.pem
tls_ca_certificate_path=/path/to/cluster-ca.pem
tls_cert_refresh_interval_seconds=0
tls_excluded_protocols=http,arrowflight
thrift_server_type_of_fe=THREAD_POOL
thrift_connect_timeout_seconds=3
```

BE requires an **unencrypted PEM private key**. Leave both `tls_private_key_password` and `tls_peer_cert_required_san_dns` empty. The BE's `thrift_server_type_of_fe` must match the FE Thrift server mode.

The excluded-protocol lists are necessary for this private-RPC-only deployment: enabling the unified framework also selects protocols not explicitly excluded. Do not remove exclusions unless you have a working TLS implementation and deployment plan for those protocols.

### 4. Activate and validate

1. Stop new workload submissions and drain or stop active work for the maintenance window. Back up the original node configurations.
2. Deploy the identity files and TLS settings to all participating FE and BE nodes. Stop the old processes and start the cluster with the new settings using your normal cluster lifecycle procedure. Do not leave plaintext peers running against TLS listeners.
3. Connect through the existing SQL endpoint and run `SHOW FRONTENDS;` and `SHOW BACKENDS;`. Expected result: the intended nodes become alive and heartbeats recover.
4. Run a representative query that dispatches to BEs, a query with a cross-BE exchange, and a load operation. Expected result: they complete successfully without TLS/authentication errors. A client-only `SELECT 1` does not exercise these internal paths.
5. Perform the certificate and connection checks in [Examples](#examples). Certificate rejection tests should use separate probe clients, without replacing a running node's identity.

## Parameters

The [TLS framework reference](./tls-framework.md) describes the shared configuration contract. The following table gives the additional constraints of this open-source private RPC implementation. `Empty` means an empty string. TLS identity settings are startup settings; changing files or configuration requires a restart.

| Configuration | Type / component | Default | Required value or effect for this deployment |
| --- | --- | --- | --- |
| `enable_tls` | Boolean / FE, BE | `false` | Set to `true` on all participating nodes. |
| `tls_verify_mode` | String / FE, BE | `verify_peer` | Must be `verify_fail_if_no_peer_cert`; optional client certificates and verification bypasses are rejected. |
| `tls_certificate_path` | String / FE, BE | Empty | Required PEM node certificate, with the necessary chain. |
| `tls_private_key_path` | String / FE, BE | Empty | Required matching PEM private key. |
| `tls_ca_certificate_path` | String / FE, BE | Empty | Required PEM cluster CA certificate or trust bundle; do not rely on system/JDK default trust stores. |
| `tls_private_key_password` | String / FE, BE | Empty | BE requires empty. FE supports its existing password setting for supported encrypted PEM keys. |
| `tls_cert_refresh_interval_seconds` | Integer / FE, BE | `3600` | Must explicitly be `0`. Automatic certificate reload is unsupported. |
| `tls_excluded_protocols` | String / FE, BE | Empty | FE: `http,mysql,arrowflight,bdbje`. BE: `http,arrowflight`. Keep `brpc` and `thrift` included for the internal channels covered here. |
| `tls_peer_cert_required_san_dns` | String / FE, BE | Empty | Must remain empty. This provider does not implement the framework's DNS SAN admission allowlist. |
| `thrift_server_type` | String / FE | `THREAD_POOL` | Use blocking `THREAD_POOL` or `SIMPLE`; do not use `THREADED_SELECTOR`. |
| `thrift_server_type_of_fe` | String / BE | `THREAD_POOL` | Match the FE Thrift mode. |
| `thrift_rpc_connect_timeout_ms` | Integer / FE | `10000` | Must be positive. Bounds Thrift TLS authentication even when ordinary RPC reads have no timeout. |
| `thrift_connect_timeout_seconds` | Integer / BE | `3` | Must be positive and representable in milliseconds. Bounds Thrift TLS authentication. |

`tls_cert_based_auth_ignore_password` is unrelated to node RPC authentication. Keep its default `false`; enabling internal mTLS does not change SQL user authentication.

## Examples

### Validate an issued certificate

Before deployment, validate the CA chain, both usages, and the address used to reach the node:

```bash
openssl verify -CAfile cluster-ca.pem -purpose sslserver node-cert.pem
openssl verify -CAfile cluster-ca.pem -purpose sslclient node-cert.pem
openssl x509 -in node-cert.pem -noout -checkhost be1.example.com
openssl x509 -in node-cert.pem -noout -checkip 192.0.2.10
```

Expected result: both verification commands report `node-cert.pem: OK`, and the hostname/IP checks report a match. Adapt the checks to the SANs you requested. For intermediate CAs, provide the intermediate chain as required by your PKI.

### Probe a Thrift TLS listener

From an authorized node or diagnostic host holding its own cluster-issued identity, probe the FE Thrift endpoint. The example uses the default FE `rpc_port` of `9020`; substitute the configured hostname and port.

```bash
openssl s_client -connect fe1.example.com:9020 -servername fe1.example.com \
    -CAfile cluster-ca.pem -cert node-cert.pem -key node-key.pem \
    -verify_hostname fe1.example.com -verify_return_error -brief < /dev/null
```

Expected result: TLS negotiation succeeds and certificate verification reports `OK`. This checks TLS authentication, not a Thrift application request. Repeat against the BE backend and heartbeat Thrift listeners (default ports `9060` and `9050`) with their corresponding names.

For a target addressed by IP, replace `-verify_hostname fe1.example.com` with `-verify_ip` followed by that IP. The certificate must have the matching IP SAN.

A separate probe without a client certificate, or with a certificate signed by an unrelated CA, must fail authentication. A trusted certificate with the wrong target hostname/IP must be rejected by hostname-verifying clients. Native BRPC authenticates the CA trust domain and does not perform the latter hostname check.

### Retain remote Doris reads

When using a remote Doris Catalog, keep the catalog property `use_arrow_flight=true` (the default). Remote results then enter local workers, keeping query exchanges and execution-status reports within the local TLS cluster. With private BRPC or Thrift TLS enabled, `use_arrow_flight=false` execution graphs that assign workers to the remote cluster are rejected before dispatch, including remote-only graphs with reverse callbacks.

Remote metadata access and tablet writes executed by local workers retain their external connection policy. File-key descriptors cannot be sent over those remote plaintext channels. Local private TLS does not establish trust with, or configure TLS on, an independent remote cluster.

## Error Handling

| Symptom | Check and action |
| --- | --- |
| Startup reports that a TLS module is required | Confirm that FE and BE both contain the private RPC implementation. Check the excluded-protocol lists: the built-in provider does not supply every public protocol. |
| Configuration is rejected for mutual authentication | Set `tls_verify_mode=verify_fail_if_no_peer_cert` and provide readable certificate, matching key, and CA files. |
| Configuration is rejected for static identities or CA-scoped trust | Set the refresh interval to `0`, clear `tls_peer_cert_required_san_dns`, and clear the BE private-key password. |
| Thrift cannot start | Use a supported blocking server mode, match FE/BE Thrift mode settings, and keep connection timeouts positive. |
| Heartbeats, dispatch, or queries fail after activation | Check for plaintext peers, inconsistent CA bundles, expired certificates, missing client/server usages, hostname/IP SAN mismatches, unreadable files, or certificate/key mismatches. |
| A connection attempt times out | Check reachability and the peer's TLS configuration. Thrift authentication uses a bounded timeout; an open TCP port alone does not prove successful authentication. |
| Replacing certificate files has no effect | Restart affected processes. The provider has no automatic reload. |
| Remote Doris direct execution is rejected | Retain the default Arrow Flight catalog mode; local TLS identities cannot authenticate independently scheduled remote workers. |

## Best Practices

- Generate a distinct private key on each node and have its certificate signed by a dedicated cluster CA. Never share that CA with unrelated services. The CA trust domain defines the cluster membership boundary; it does not provide per-node role policies.
- Restrict private-key files to the Doris service account. Distribute only public CA certificates to nodes; never copy the CA private key there.
- Monitor certificate expiration. For certificate renewal under the same trusted CA, install the new node identity and restart the affected process through your established availability procedure. Revalidate internal RPC after the restart.
- For CA replacement, first deploy a trust bundle containing both old and new CAs and restart the relevant nodes. Then replace node identities and restart them, validate connectivity, and finally remove the old CA and restart again. Keep every communication path mutually trusted throughout the change.
- To return to plaintext, coordinate another maintenance window and disable TLS consistently across participating nodes. There is no automatic plaintext fallback.
- Protect process memory and crash artifacts separately. Internal transport encryption does not remove plaintext secrets from the processes that use them.
