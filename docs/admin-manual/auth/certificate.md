---
{
    "title": "MySQL Secure Transport",
    "language": "en",
    "description": "Apache Doris SSL/TLS encrypted connection configuration guide: MySQL client secure transport, one-way authentication and mTLS mutual authentication, certificate generation and configuration details."
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data transport encryption / Client identity authentication / Security compliance -->

This document describes how to enable SSL/TLS encryption for communication between Apache Doris and MySQL clients, including quick enablement, client connection methods, mTLS mutual authentication, custom certificate configuration, and certificate generation.

## Applicable Scenarios

| Scenario | Recommended Approach |
|------|----------|
| Data transport encryption for general business | Enable one-way authentication (default) |
| Compliance scenarios such as finance, government, and enterprises | Enable mTLS mutual authentication |
| Use certificates issued by an internal enterprise CA | Configure custom certificates |
| Quick verification in PoC or development environments only | Use the Doris built-in default certificates |

## Prerequisites

- The Apache Doris cluster is deployed and running normally
- MySQL client version >= 5.7.11 (older client versions use different SSL parameter syntax)
- Currently supported TLS protocol versions: TLS 1.2 and TLS 1.3
- You have permission to modify `conf/fe.conf` on FE nodes and operational permission to restart FE

## Process Overview

1. Enable SSL in the FE configuration (enable mTLS as well if a higher security level is required)
2. Restart FE to apply the configuration
3. Use the MySQL client to initiate an encrypted connection with the specified `--ssl-mode` parameter
4. (Optional) Replace the default certificates with custom certificates

## SSL Authentication Mode Comparison

<!-- Knowledge type: Architecture selection decision -->

Doris provides two SSL authentication modes. Choose based on security requirements:

| Authentication Mode | Description | Applicable Scenario |
|----------|------|----------|
| One-way authentication (default) | Verifies only the server certificate | General security scenarios |
| Mutual authentication (mTLS) | Verifies both server and client certificates | High-security scenarios |

## Quick Start: Enable SSL Encrypted Connection

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: First-time SSL enablement / Quick verification with default certificates -->

Doris ships with default key and certificate files, so you can enable SSL without generating additional certificates. The full process takes only two steps:

### Step 1: Enable SSL on FE

Modify the FE configuration file `conf/fe.conf`, add the following configuration, and restart FE:

```properties
enable_ssl = true
```

### Step 2: Connect Using the MySQL Client

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

## Client SSL Connection Modes

<!-- Knowledge type: Configuration parameters -->

The MySQL client controls connection behavior through the `--ssl-mode` parameter. The available modes are as follows:

| SSL Mode | Description | Command Example |
|----------|------|----------|
| PREFERRED (default) | Attempts an SSL connection first, and falls back to a plain connection on failure | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | Disables SSL and uses a plain connection | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | Forces an SSL connection | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |
| VERIFY_CA | Forces SSL and verifies the CA of the server certificate (used in mTLS scenarios) | See [Configure Mutual Authentication (mTLS)](#configure-mutual-authentication-mtls) |

:::note Note
The `--ssl-mode` parameter was introduced in MySQL 5.7.11. For MySQL clients older than this version, refer to the [MySQL official documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html).
:::

## Configure Mutual Authentication (mTLS)

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: High security requirements / Strong client identity verification -->

In mTLS, while the server verifies the client identity, the client also verifies the server certificate. This applies to scenarios with strict identity requirements for the connecting party.

### Step 1: Enable mTLS

Modify the FE configuration file `conf/fe.conf`, add the following configuration, and restart FE:

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### Step 2: Connect from the Client Using Certificates

When connecting with mTLS, the client must specify the CA certificate, client certificate, and private key:

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```

### Default Client Certificates

Doris provides default client certificate files under the `Doris/conf/mysql_ssl_default_certificate/client_certificate/` directory:

| File Name | Description |
|--------|------|
| `ca.pem` | CA certificate |
| `client-cert.pem` | Client certificate |
| `client-key.pem` | Client private key |

## Certificate Configuration Details

<!-- Knowledge type: Configuration parameters -->

To enable SSL in Doris, you must configure the CA key and certificate and the server-side key and certificate. To enable mutual authentication, you must also configure the client-side key and certificate.

### Default Certificates

Doris ships with default certificate files that can be used directly:

| Certificate Type | Default Path | Default Password |
|----------|----------|----------|
| CA certificate | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| Server-side certificate | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| Client-side certificate | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### Custom Certificates

To use custom certificates, add the following configuration to the FE configuration file `conf/fe.conf`.

**CA certificate configuration**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**Server-side certificate configuration**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

:::tip Tip
You can specify other certificate formats by modifying the `ssl_trust_store_type` parameter in `conf/fe.conf`. The default is `PKCS12`.
:::

## Generate Custom Certificates

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Use enterprise CA / Replace default certificates with self-signed certificates -->

If you need to use your own certificates, you can generate them with OpenSSL. For the complete commands, refer to [MySQL official documentation: Creating SSL Certificates](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html).

### Step 1: Generate Keys and Certificates for CA, Server, and Client

```shell
# Generate the CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
    -key ca-key.pem -out ca.pem

# Generate the server-side certificate and sign it with the CA above
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate the client-side certificate and sign it with the CA above
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

### Step 2: Verify the Certificates

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

### Step 3: Package as PKCS#12 Format

Combine the CA key and certificate, and the server-side key and certificate, into PKCS#12 (P12) format respectively, so that Doris can use them:

```shell
# Package the CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package the server-side key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::info More Information
For more information about generating self-signed certificates with OpenSSL, refer to the [IBM official documentation](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl).
:::

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: SSL connection failure / Certificate configuration errors -->

### Q: The client reports that the `--ssl-mode` parameter is not recognized.

The MySQL client version is older than 5.7.11. Upgrade the MySQL client, or refer to the MySQL Connector/J documentation for the corresponding connection parameters.

### Q: After enabling `enable_ssl=true`, the client still connects with a plain connection.

The client uses `PREFERRED` mode by default, which does not enforce SSL. Use `--ssl-mode=REQUIRED` or `VERIFY_CA` on the client.

### Q: Connection fails in mTLS mode.

The client certificate, CA certificate, or private key is not provided, or the path is incorrect. Verify that `--ssl-ca`, `--ssl-cert`, and `--ssl-key` all point to the correct certificate files.

### Q: Custom certificate fails to load.

The certificate format does not match `ssl_trust_store_type`, or the password is incorrect. Check whether the certificate is in PKCS12 format, or explicitly set `ssl_trust_store_type` and verify the password.
