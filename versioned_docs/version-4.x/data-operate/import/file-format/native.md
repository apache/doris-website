---
{
    "title": "Native",
    "language": "en",
    "description": "How to load Native format data in Apache Doris, suitable for Doris internal data exchange and backup scenarios, providing the highest load efficiency.",
    "keywords": [
        "Doris Native format",
        "Native load",
        "Stream Load Native",
        "Broker Load Native",
        "Doris internal data exchange",
        "Doris backup format"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Doris internal data flow / Backup and restore -->

This document describes how to load **Native** format data files in Apache Doris. Native is a binary data format dedicated to Doris, suitable as an **internal data exchange and backup format** rather than a general-purpose file exchange format. When data flows only within Doris, prefer the Native format to achieve the highest load efficiency.

> This feature is supported since version 4.1.0.

## Applicable Scenarios

The Native format mainly targets the following scenarios:

- **Data migration between Doris clusters**: Efficiently transfer data between different Doris clusters.
- **Data backup and restore**: Export Doris table data to Native files for archival, then load them back when needed.
- **Bulk data exchange**: Move large volumes of data with the highest efficiency within Doris internal pipelines.

> Tip: If you need to exchange data with external systems, use general-purpose formats such as CSV, JSON, Parquet, or ORC instead of Native.

## Supported Load Methods

The following table lists the load methods that support the Native format and their typical uses:

| Load Method | Typical Use | Documentation Link |
| --- | --- | --- |
| Stream Load | Push local Native files over HTTP | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | Asynchronously load Native files from object storage / HDFS | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | Read Native files directly from S3 via SQL | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | Read Native files directly from HDFS via SQL | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## Usage Examples

The following examples show how to use the Native format with different load methods. Choose the appropriate method based on the data source (local file / object storage / HDFS) and load mode (synchronous / asynchronous).

### Load Local Native Files via Stream Load

Applicable scenario: A Native file resides on the local machine or on a server that can access the FE HTTP port, and you need a fast synchronous load.

Steps:

1. Prepare the Native file `example.native`.
2. Use `curl` to push the file through the Stream Load interface, and specify the format with the request header `format: native`.

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: native" \
    -T example.native \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Load from Object Storage via Broker Load

Applicable scenario: The Native file is stored in remote storage such as S3 (or an S3-compatible object store), and you need an asynchronous batch load.

Key points:

- Specify the Native file path in `DATA INFILE`.
- Explicitly declare the format with `FORMAT AS "native"`.
- Provide the authentication and connection information required to access the object storage in `WITH S3`.

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.native")
    INTO TABLE example_table
    FORMAT AS "native"
)
WITH S3 
(
    ...
);
```

### Load via INSERT INTO with TVF

Applicable scenario: You want to read remote Native files directly with SQL and write them into a target table, making it easy to combine with query, filter, and transformation logic.

Key points:

- Specify `uri` and `format = "native"` in the TVF parameters.
- Use `INSERT INTO ... SELECT` to write the read result into the target table.

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.native",
    "format" = "native",
    ...
);
```

## FAQ

**Q1: Can the Native format be used to exchange data with external systems?**

Not recommended. Native is a binary format dedicated to Doris and is not compatible with external systems. For cross-system data exchange, prefer general-purpose formats such as CSV, JSON, Parquet, or ORC.

**Q2: Why is the Native format recommended for data flow within Doris?**

The Native format aligns with Doris internal data structures, so serialization and deserialization overhead is minimal. As a result, it delivers the highest load efficiency between Doris clusters or in backup scenarios.

**Q3: Which load methods support the Native format?**

Stream Load, Broker Load, and `INSERT INTO ... FROM S3 / HDFS` TVF are currently supported. See the "Supported Load Methods" section above for details.
