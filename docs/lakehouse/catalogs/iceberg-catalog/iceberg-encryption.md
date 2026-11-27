---
{
    "title": "Iceberg Encrypted Reads (PME)",
    "language": "en",
    "description": "Read encrypted Iceberg v3 Parquet tables through HMS or REST catalogs with KMS and private mutual TLS in Apache Doris 5.0."
}
---

## Overview

Iceberg encrypted reads are planned for Apache Doris **5.0.0**. Doris reads Iceberg v3 tables through **Hive Metastore (HMS) or REST Catalog**, using the Iceberg standard encryption manager and native Parquet Modular Encryption (PME), `AES_GCM_V1`.

Doris decrypts existing encrypted tables; it does not create encrypted data files. This capability is disabled by default and requires matching FE, BE and connector plugins, a configured KMS, and authenticated private RPC between Doris nodes.

| Component or operation | Support |
| --- | --- |
| Catalog and table version | HMS or REST; Iceberg v3 |
| Encrypted data files | Native Parquet `AES_GCM_V1` |
| Encrypted delete files | Parquet position deletes and equality deletes, with independent keys |
| Manifests and manifest lists | Decryption through the Iceberg SDK |
| Mixed files | Plaintext and encrypted Parquet data/delete files can coexist; each file retains its own encryption metadata |
| Queries | Projection, filtering, aggregation, joins, time travel and physical COUNT |
| Native position-delete metadata | Supported through the native `$position_deletes` path |
| Encrypted writes and maintenance | Unsupported |
| Encrypted Iceberg v4, ORC or Puffin files | Unsupported |
| JNI metadata tables and SQL result caching | See [Limitations](#limitations) |

The FE loads trusted catalog metadata, calls KMS and prepares each file's key and AAD. The BE receives those values over protected private RPC and decrypts the data and delete files. Data, position-delete and equality-delete files do not share keys implicitly.

The Iceberg scheme encrypts data/delete files, manifests and manifest lists. Its metadata JSON is not encrypted by this scheme; catalog and metadata integrity remain part of the deployment requirements. For external table creation, see the [Iceberg encryption guide](https://github.com/apache/iceberg/blob/apache-iceberg-1.12.0/docs/docs/encryption.md).

## Quick Start

### Prerequisites

Prepare the following before querying:

- An externally created Iceberg v3 table using the SDK standard encryption manager, a configured KMS and `encryption.key-id`. Setting a property alone is not a conversion of existing plaintext files. Keep the table's encryption metadata and retained historical keys intact.
- Access from the FE to the catalog, KMS and object storage, and from the BE to the physical data/delete objects. Reading requires permission to unwrap the relevant table keys, such as AWS KMS `Decrypt` permission.
- Matching Doris 5.0 FE, BE and Iceberg connector packages containing the native encrypted Parquet reader and private RPC provider.
- A cluster CA and a separate certificate/private key for each node. Certificates must be trusted by the configured cluster CA.

The examples assume an existing table `analytics.encrypted_events` containing an `id` column with values `1, 2, 3, 4`. Replace the endpoints, identities, credentials and table names with your deployment values. A catalog administrator performs the configuration; query users need the corresponding table privileges.

### 1. Configure private mutual TLS

Configure these values on every participating FE and BE:

```properties
enable_tls=true
tls_verify_mode=verify_fail_if_no_peer_cert
tls_ca_certificate_path=<cluster-ca-certificate-path>
tls_cert_refresh_interval_seconds=0
```

Add the FE-specific settings to `fe.conf`:

```properties
tls_certificate_path=<fe-certificate-path>
tls_private_key_path=<fe-private-key-path>
tls_excluded_protocols=http,mysql,arrowflight,bdbje
thrift_server_type=THREAD_POOL
```

Add the BE-specific settings to `be.conf`:

```properties
tls_certificate_path=<be-certificate-path>
tls_private_key_path=<be-private-key-path>
tls_private_key_password=
tls_excluded_protocols=http,arrowflight
thrift_server_type_of_fe=THREAD_POOL
```

This configuration enables the built-in private RPC provider. FE-to-BE fragment dispatch and BE-to-FE split RPC must both be protected. HTTPS on REST Catalog, KMS or object storage does not configure either internal connection. SQL, HTTP and other excluded protocols retain their separately managed configuration.

The provider uses static certificates: leave `tls_cert_refresh_interval_seconds` at `0`, and leave `tls_peer_cert_required_san_dns` empty. BE private keys must be unencrypted PEM files. Coordinate TLS activation across participating nodes, and restart them after changing certificates or trust files. See [TLS Framework](../../../admin-manual/auth/tls-framework.md) for the configuration framework.

### 2. Enable encrypted reads in the Iceberg plugin

In every FE installation, edit `plugins/connector/iceberg/iceberg.conf`:

```properties
enable_encryption_read=true
```

Restart the FEs after changing this file. This is a plugin deployment setting, **not** a catalog property, session variable or `fe.conf` option. Its default is `false`.

Complete the TLS and plugin configuration before restarting the participating nodes. All live backends that the external-scan scheduler may select must advertise fresh native encrypted-read capability. The plugin switch cannot override a missing reader, transport or capability proof.

### 3. Create a catalog

REST authentication, KMS authentication and object-storage authentication serve different purposes. The following REST example uses OAuth2 for the catalog and separate static credentials for KMS and S3:

```sql
CREATE CATALOG encrypted_lake PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://catalog.example.com',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<client-id>:<client-secret>',
    'iceberg.rest.oauth2.server-uri' = 'https://auth.example.com/oauth/token',
    'iceberg.rest.oauth2.scope' = '<catalog-scope>',
    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'encryption.kms-type' = 'aws',
    'client.region' = 'us-east-1',
    'client.credentials-provider' = 'org.apache.doris.connector.iceberg.glue.ConfigurationAWSCredentialsProvider2x',
    'client.credentials-provider.glue.access_key' = '<kms-access-key>',
    'client.credentials-provider.glue.secret_key' = '<kms-secret-key>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = '<storage-access-key>',
    's3.secret_key' = '<storage-secret-key>'
);
```

The `glue` segment in the credentials-provider property names belongs to that provider's existing interface. In this example it supplies the SDK client used for KMS; it does not change the catalog type to Glue. Use the REST service's actual authentication parameters and scope. For other authentication modes, see [Iceberg Catalog](../iceberg-catalog.mdx).

For HMS, use the same encryption and storage configuration with the HMS connection:

```sql
CREATE CATALOG encrypted_hms PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://metastore.example.com:9083',
    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'encryption.kms-type' = 'aws',
    'client.region' = 'us-east-1',
    'client.credentials-provider' = 'org.apache.doris.connector.iceberg.glue.ConfigurationAWSCredentialsProvider2x',
    'client.credentials-provider.glue.access_key' = '<kms-access-key>',
    'client.credentials-provider.glue.secret_key' = '<kms-secret-key>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = '<storage-access-key>',
    's3.secret_key' = '<storage-secret-key>'
);
```

These examples use AWS KMS-compatible clients. Other KMS implementations need the corresponding SDK-compatible client and operator-installed local dependencies; they are not established by these examples. Protect and manage credentials using your deployment's credential policy.

### 4. Query the table

```sql
SELECT id
FROM encrypted_lake.analytics.encrypted_events
ORDER BY id;
```

```text
1
2
3
4
```

The same queries work through `encrypted_hms` when that catalog exposes the table. A successful native encrypted query verifies the reader/capability admission path; merely loading REST metadata does not establish native execution.

## Parameters

| Parameter | Location and type | Default / required | Effect |
| --- | --- | --- | --- |
| `enable_encryption_read` | FE Iceberg plugin; boolean | `false`; required for encrypted reads | Enables admission intent; requires an FE restart and does not bypass execution checks |
| `enable_tls` | FE and BE; boolean | `false`; required here | Enables configured TLS providers |
| `tls_verify_mode` | FE and BE; string | Set to `verify_fail_if_no_peer_cert` | Requires trusted peer certificates for private RPC |
| `tls_certificate_path`, `tls_private_key_path`, `tls_ca_certificate_path` | Node configuration; paths | Required here | Node identity, private key and cluster trust; use a different identity per node |
| `tls_excluded_protocols` | Node configuration; protocol list | Set as shown above | Keeps protocols outside the built-in private provider's scope separate |
| `tls_cert_refresh_interval_seconds` | FE and BE; integer | `0` for this provider | Static identity/trust configuration; restart after replacement |
| `thrift_server_type`, `thrift_server_type_of_fe` | FE and BE respectively; string | Set to `THREAD_POOL` | Selects the Thrift server mode supported by this private RPC provider |
| `encryption.kms-type` | Catalog; string | Required unless using `encryption.kms-impl` | Selects a standard SDK KMS client; examples use `aws` |
| `encryption.kms-impl` | Catalog; class name | Alternative to a predefined KMS type | Uses an SDK-compatible KMS client already installed by the operator |
| `client.region` | Catalog; string | Supply the KMS region when not resolved by the SDK environment | Selects the AWS client's region |
| `client.credentials-provider` and its properties | Catalog; class name and strings | Depend on the deployment's KMS authentication | Supplies SDK credentials; the examples use the bundled static provider |
| `kms.endpoint` | Catalog; URI | Optional; SDK service endpoint by default | Overrides the KMS endpoint for a compatible service |
| `s3.*` | Catalog/storage configuration | Depend on storage authentication | Controls physical object access; independent of catalog and KMS credentials |
| `encryption.key-id` | Existing external table metadata | Set by the external writer | Identifies the wrapping key; do not remove or edit it to bypass encryption |

A custom **KMS client** is different from a custom **encryption manager**. This read path requires the SDK standard encryption manager. A locally installed KMS implementation does not grant support for a different file-encryption scheme.

## Examples

### Filtering and aggregation

```sql
SELECT COUNT(*), SUM(id)
FROM encrypted_lake.analytics.encrypted_events
WHERE id >= 2;
```

```text
3  9
```

For declared encrypted tables, COUNT uses physical scan ranges rather than a metadata-only answer. Authorization and file/deletion handling remain part of execution even when external COUNT pushdown is enabled.

### Time travel

```sql
SELECT id
FROM encrypted_lake.analytics.encrypted_events
FOR VERSION AS OF <snapshot-id>
ORDER BY id;
```

Obtain the snapshot ID from the external catalog or an Iceberg client; encrypted JNI `$snapshots` queries are not available. The result contains the rows visible in the selected snapshot. FE must be able to unwrap all keys required by that snapshot. Retained keys remain necessary even when the current writer has moved to another key.

### Position-delete rows

```sql
SELECT file_path, pos
FROM encrypted_lake.analytics.`encrypted_events$position_deletes`;
```

The result contains the position-delete records associated with the table. This uses the native reader and does not imply that JNI metadata tables such as `$files` support encrypted reads.

### Reader privileges

```sql
CREATE USER pme_reader IDENTIFIED BY '<reader-password>';
GRANT SELECT_PRIV ON encrypted_lake.analytics.* TO pme_reader;
```

A query as this user still requires the deployment's catalog, KMS and storage access. Doris table privileges do not grant KMS permissions, and KMS access does not grant Doris table privileges.

## Error Handling

| Error classification | Action |
| --- | --- |
| `READ_DISABLED` | Set the plugin deployment option on every FE and restart the FEs |
| `BACKEND_CAPABILITY_UNAVAILABLE` | Check matching packages, private mutual TLS, a running FE split listener and fresh capable backends in the selected compute group |
| `UNSUPPORTED_CATALOG` | Use HMS or REST for this read path |
| `UNSUPPORTED_TABLE_FORMAT` | Use an encrypted Iceberg v3 table; V4 encryption is outside this capability |
| `UNSUPPORTED_ENCRYPTION_MANAGER` | Check that the table uses the SDK standard encryption scheme |
| `UNSUPPORTED_FILE_FORMAT` | Check the actual encrypted data/delete files; changing the default write format does not convert existing files |
| `UNSUPPORTED_METADATA_TABLE` | Use supported native queries; encrypted JNI metadata-table scans are not available |
| `WRITE_UNAVAILABLE` | Write or maintain encrypted tables using a compatible external writer |
| KMS access or authentication failure | Correct KMS credentials, permissions and availability; a warm query must not provide a plaintext fallback |

Key metadata or ciphertext authentication failures require checking the external table's keys and physical files. Preserve the original metadata/key chain when diagnosing them.

## Limitations

- Read-only support: encrypted `INSERT`, `INSERT OVERWRITE`, `UPDATE`, `DELETE`, `MERGE INTO` and maintenance are not enabled by the read switch.
- Encrypted Iceberg v4 tables, encrypted ORC/Puffin files and alternative native encryption algorithms are outside the supported matrix.
- Encrypted JNI metadata-table scans are unavailable. Native `$position_deletes` is the supported exception described above.
- Encrypted query results are not admitted to the SQL result cache, even when `enable_sql_cache` and `enable_hive_sql_cache` are enabled. Queries continue through physical execution. Do not rely on a prior plaintext cache entry after a table adopts encryption.
- A successful query does not authorize future queries. Later statements that need protected keys must reauthorize; shared caches do not bypass that check. Revocation does not forcibly cancel I/O that has already acquired keys; statements that need no protected keys may make no KMS request.
- V3 planning remains synchronous. Changing the external batch setting does not enable encrypted V3 lazy SQL execution.

## Best Practices

- Use a dedicated cluster CA and restrict issuance of node identities. Keep static identity and trust files consistent with the configured provider and coordinate replacement across nodes.
- Retain access to wrapping keys needed by historical snapshots. Test permission revocation and recovery with the same catalog and warm caches.
- Plan capacity for KMS and object-storage access. Encrypted COUNT and private metadata reads have different costs from plaintext metadata-only COUNT.
- Validate native queries with representative independent data/delete keys before enabling the feature for a workload. Validate the intended KMS provider separately from SDK-compatible mock-service tests.
