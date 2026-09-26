---
{
    "title": "Integration with Alibaba Cloud OSS Tables",
    "language": "en",
    "description": "Connect Doris to Alibaba Cloud OSS Tables with Iceberg REST Catalog and S3FileIO for managed Iceberg reads and writes.",
    "keywords": [
        "Alibaba Cloud OSS Tables",
        "Apache Doris OSS Tables",
        "Iceberg REST Catalog",
        "S3FileIO",
        "OSS Table Bucket",
        "OSS Tables Catalog",
        "managed Iceberg tables",
        "SigV4 osstables",
        "OSS Tables 403 Forbidden",
        "OSS STS credentials",
        "Doris lakehouse"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Integration Guide -->
<!-- Applicable Scenarios: Alibaba Cloud OSS Tables integration / Managed Iceberg table queries and writes -->

[Alibaba Cloud OSS Tables](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables/) is a managed storage service for Apache Iceberg tables. OSS Tables uses Table Buckets as storage units, exposes a metadata interface compatible with Apache Iceberg REST Catalog, and provides access to table data through the OSS S3-compatible interface.

Compared with managing Iceberg tables in a regular OSS Bucket, OSS Tables provides the following capabilities:

- A built-in Iceberg REST Catalog, eliminating the need to deploy an external metadata service such as Hive Metastore.
- Automatic small-file compaction, snapshot expiration, and orphan-file cleanup.
- Standard Iceberg interfaces that allow multiple compute engines to access the same table data.

Apache Doris connects to OSS Tables through Iceberg REST Catalog: REST Catalog manages namespaces and table metadata, while `S3FileIO` reads and writes data files. This guide explains how to create an OSS Tables Catalog in Doris and query and write Iceberg tables.

:::caution
This feature is experimental and will be released in Doris 5.0.0.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Creating an OSS Tables Catalog / Querying and writing Iceberg tables -->

## Usage Guide

### 01 Create an OSS Table Bucket

Create a Table Bucket in the Alibaba Cloud OSS console. After it is created, record the Table Bucket ARN, region, and name. The ARN has the following format:

```text
acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>
```

Create a RAM user AccessKey that has access to the target Table Bucket, or obtain temporary STS credentials. Ensure that FE nodes can access the OSS Tables REST Catalog endpoint, and that FE and BE nodes can access the OSS data access endpoint.

For the permissions required by each OSS Tables operation, see [Alibaba Cloud OSS Tables permissions and access control](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control).

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Configuring REST Catalog authentication and S3FileIO data access -->

### 02 Create an Iceberg Catalog

Replace the region, account ID, Table Bucket name, and access credentials with actual values:

```sql
CREATE CATALOG oss_tables PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<region>.oss-tables.aliyuncs.com/iceberg',
    'warehouse' = 'acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>',

    'iceberg.rest.sigv4-enabled' = 'true',
    'iceberg.rest.signing-name' = 'osstables',
    'iceberg.rest.signing-region' = '<region>',
    'iceberg.rest.view-enabled' = 'false',

    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'oss.endpoint' = 'https://oss-<region>.aliyuncs.com',
    'oss.region' = '<region>',
    'oss.access_key' = '<access_key_id>',
    'oss.secret_key' = '<access_key_secret>',
    'oss.use_path_style' = 'false',

    'test_connection' = 'true'
);
```

To access Alibaba Cloud over its internal network, replace `iceberg.rest.uri` and `oss.endpoint` with `https://<region>-internal.oss-tables.aliyuncs.com/iceberg` and `https://oss-<region>-internal.aliyuncs.com`, respectively.

When using temporary STS credentials, add `oss.session_token` after `oss.secret_key`:

```sql
'oss.session_token' = '<sts_token>',
```

Doris uses `oss.access_key`, `oss.secret_key`, and the optional `oss.session_token` for both REST Catalog SigV4 signing and `S3FileIO` data access. You do not need to configure `iceberg.rest.access-key-id` and `iceberg.rest.secret-access-key` separately.

#### Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `type` | Yes | Must be `iceberg`. |
| `iceberg.catalog.type` | Yes | Must be `rest` to access OSS Tables through Iceberg REST Catalog. |
| `iceberg.rest.uri` | Yes | OSS Tables REST Catalog endpoint. |
| `warehouse` | Yes | Table Bucket ARN. |
| `iceberg.rest.sigv4-enabled` | Yes | Must be `true`. |
| `iceberg.rest.signing-name` | Yes | Must be the lowercase value `osstables`. This value is case-sensitive. |
| `iceberg.rest.signing-region` | Yes | SigV4 signing region. It must match the Table Bucket region. |
| `iceberg.rest.view-enabled` | Yes | Set to `false`. OSS Tables currently does not support the Iceberg View interface. |
| `io-impl` | Yes | Must be `org.apache.iceberg.aws.s3.S3FileIO`. Do not use `HadoopFileIO`. |
| `oss.endpoint` | Yes | Endpoint used by `S3FileIO` to access OSS data files. |
| `oss.region` | Yes | OSS data access region. It must match the Table Bucket region. |
| `oss.access_key` | Yes | Alibaba Cloud AccessKey ID. |
| `oss.secret_key` | Yes | Alibaba Cloud AccessKey Secret. |
| `oss.session_token` | No | Set this parameter when using temporary STS credentials. |
| `oss.use_path_style` | No | Whether to use path-style access. The default is `false`. |
| `test_connection` | No | When set to `true`, Doris checks the REST Catalog connection and authentication while creating the Catalog. |

`test_connection=true` does not replace data access verification. After the Catalog is created, run an actual query or write operation to verify network connectivity and permissions from FE and BE nodes to the OSS data access endpoint.

### 03 Access OSS Tables

```sql
SWITCH oss_tables;

SHOW DATABASES;

USE <namespace_name>;

SHOW TABLES;

SELECT * FROM <table_name> LIMIT 10;
```

<!-- Knowledge Type: Operational Example -->
<!-- Applicable Scenarios: Creating an Iceberg table and writing data to OSS Tables -->

### 04 Create an OSS Tables Table and Write Data

```sql
SWITCH oss_tables;

CREATE DATABASE IF NOT EXISTS doris_demo;
USE doris_demo;

CREATE TABLE orders (
    order_id BIGINT,
    customer STRING,
    amount DECIMAL(10, 2),
    created_at DATETIME
)
PROPERTIES (
    'format-version' = '2',
    'write-format' = 'parquet',
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd'
);

INSERT INTO orders VALUES
    (1, 'Alice', 99.50, '2026-08-11 10:00:00'),
    (2, 'Bob', 120.00, '2026-08-11 10:01:00');

SELECT order_id, customer, amount, created_at
FROM orders
ORDER BY order_id;
```

You can query the Iceberg `$files` metadata table to verify that data files have been written to OSS Tables:

```sql
SELECT file_path, file_format, record_count
FROM `orders$files`
ORDER BY file_path;
```

<!-- Knowledge Type: Limitations + Usage Guidance -->

## Usage Notes

- OSS Tables supports only the Iceberg table format.
- `iceberg.rest.signing-name` must be set to the lowercase value `osstables`. You must also set the correct `iceberg.rest.signing-region` and set `iceberg.rest.sigv4-enabled` to `true`.
- When using temporary STS credentials, update the AK, SK, and token in the Catalog before the credentials expire.

<!-- Knowledge Type: Troubleshooting -->
<!-- Applicable Scenarios: 403 authentication errors / Metadata access succeeds but data queries fail -->

## FAQ

### Creating the Catalog Returns 403 Forbidden

Check the following configurations:

- Verify that `oss.access_key` and `oss.secret_key` are valid. When using temporary STS credentials, also verify that `oss.session_token` is correct and has not expired.
- Verify that the RAM user or STS identity has the `oss:GetTableBucket` and `oss:ListNamespaces` permissions on the target Table Bucket.
- Verify that the account ID, region, and Table Bucket name in `warehouse` are correct.
- Verify that `iceberg.rest.signing-name` is `osstables` and that `iceberg.rest.signing-region` is the region of the Table Bucket.

### Namespaces and Tables Are Visible, but Data Queries Fail

Verify that FE and all BE nodes can access `oss.endpoint`, and that the RAM user or STS identity has the `oss:GetTableMetadataLocation` and `oss:GetTableData` permissions.

For the complete list of permissions required by OSS Tables operations, see [Alibaba Cloud OSS Tables permissions and access control](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control).
