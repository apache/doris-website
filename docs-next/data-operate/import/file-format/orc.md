---
{
    "title": "ORC | File Format",
    "language": "en",
    "description": "How to import ORC format data files into Apache Doris using Stream Load, Broker Load, and TVFs, with complete examples.",
    "sidebar_label": "ORC",
    "keywords": [
        "Doris ORC import",
        "ORC format",
        "Stream Load ORC",
        "Broker Load ORC",
        "S3 TVF ORC",
        "HDFS TVF ORC",
        "Apache Doris file format"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters -->
<!-- Applicable scenario: Data import / File format selection -->

This document describes how to import ORC format data files into Apache Doris, including the supported import methods and typical usage examples.

## Supported import methods

The following table lists the import methods available in Doris for ORC format and their applicable scenarios:

| Import method | Applicable scenario | Documentation link |
| --- | --- | --- |
| Stream Load | Push ORC files from a local machine or client over HTTP | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | Asynchronously batch import ORC files from object storage or HDFS | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | Read ORC files on S3 through a table-valued function | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | Read ORC files on HDFS through a table-valued function | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## Usage examples

This section shows typical usage of the ORC format by import method. In every example, replace placeholders such as `<user>`, `<fe_host>`, and `bucket` with the actual values for your environment.

### Stream Load import

Use this method to push a local ORC file to Doris over HTTP:

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: orc" \
    -T example.orc \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

Key points:

- Specify the data format as ORC through the request header `-H "format: orc"`.
- Use `-T` to specify the path of the local ORC file to import.
- The URL must specify the target database and target table.

### Broker Load import

Use this method to batch import ORC files from object storage (such as S3) or HDFS:

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.orc")
    INTO TABLE example_table
    FORMAT AS "orc"
)
WITH S3 
(
    ...
);
```

Key points:

- Use `FORMAT AS "orc"` to explicitly declare the data file format.
- Fill in the storage path of the ORC file in `DATA INFILE`.
- Provide the access credentials and other connection information for the object storage in `WITH S3 (...)`.

### TVF import

Use this method to query a remote ORC file directly through a table-valued function (TVF) and write the result into a table:

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.orc",
    "format" = "orc",
    ...
);
```

Key points:

- Specify the data format with `"format" = "orc"` in the TVF parameters.
- Use `"uri"` to specify the path of the ORC file in object storage or HDFS.
- You can add column pruning, filtering, or transformation logic in the `SELECT` clause before writing to the target table.

## FAQ

**Q1: Is it required to explicitly specify the `format` parameter when importing ORC files?**

Yes. Whether you use Stream Load, Broker Load, or a TVF, you must explicitly declare `format` as `orc`. Otherwise, the data is parsed in the default format (such as CSV), which causes the import to fail.

**Q2: How do you choose between Stream Load, Broker Load, and TVF when importing ORC files?**

- For local or client-side files with a small data volume, prefer Stream Load.
- For large batches of files on remote object storage or HDFS, prefer Broker Load.
- When you need to perform column pruning, filtering, or transformation during the import, prefer TVF (`INSERT INTO ... SELECT FROM S3/HDFS`).

**Q3: What does `...` mean in the examples?**

The `...` in the examples is a placeholder. Replace it with the connection parameters required by your environment (such as `AK/SK`, `endpoint`, and `region` for S3) or other optional parameters. For the full list of parameters, refer to the official documentation of each import method.
