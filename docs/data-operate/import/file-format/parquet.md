---
{
    "title": "Parquet | File Format",
    "language": "en",
    "description": "How do you import Parquet files into Apache Doris? Stream Load, Broker Load, and S3/HDFS TVF are all supported. This document provides complete examples.",
    "keywords": [
        "Doris Parquet import",
        "Parquet file format",
        "Stream Load Parquet",
        "Broker Load Parquet",
        "S3 TVF",
        "HDFS TVF",
        "columnar storage import"
    ],
    "sidebar_label": "Parquet"
}
---

<!-- Knowledge type: Operating procedure / File format reference -->
<!-- Applicable scenarios: Data import / File format adaptation -->

This document describes how to import Parquet-formatted data files into Apache Doris and provides ready-to-use examples for each import entry point.

## Applicable Scenarios

Parquet is a columnar storage format commonly used for offline data warehouses and bulk data persisted in object storage. The following scenarios are well suited to using Parquet as the import source:

- Bulk imports of historical data from object storage or distributed file systems such as S3 or HDFS.
- Pushing locally generated or server-generated Parquet files via Stream Load.
- Bulk loading of Parquet files stored remotely via Broker Load.
- On-demand queries against Parquet data in object storage or HDFS using table-valued functions (TVF), with the results written back into Doris.

## Supported Import Methods

The following table summarizes the import methods that support the Parquet format and their typical uses:

| Import method | Applicable scenarios | Documentation link |
| --- | --- | --- |
| Stream Load | Real-time or batch push of local or server-side files | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | Bulk imports from remote storage (HDFS, object storage) | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | Directly query Parquet files on S3 and write to the target table | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | Directly query Parquet files on HDFS and write to the target table | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## Usage Examples

This section gives a minimal runnable example for each import method. Replace the placeholders in the examples (such as `<user>`, `<fe_host>`, and `bucket`) with values from your actual environment.

### 1. Importing Parquet with Stream Load

To push a local Parquet file directly to a Doris table over the HTTP interface, declare `format: parquet` explicitly in the request header.

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

Notes:

- `-H "format: parquet"`: declares that the imported file is in Parquet format.
- `-T example.parquet`: specifies the local Parquet file to upload.
- `example_db` and `example_table` in the URL are the target database and target table, respectively.

### 2. Importing Parquet with Broker Load

This method is suited to bulk loading of Parquet files from object storage or HDFS. Use `FORMAT AS "parquet"` to specify the file format.

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.parquet")
    INTO TABLE example_table
    FORMAT AS "parquet"
)
WITH S3 
(
    ...
);
```

Notes:

- `DATA INFILE`: specifies the remote path of the Parquet file. Protocols such as `s3://` and `hdfs://` are supported.
- `FORMAT AS "parquet"`: declares that the source file is in Parquet format.
- `WITH S3 (...)`: provides the credentials required to access object storage, such as `endpoint`, `access_key`, and `secret_key`.

### 3. Importing Parquet with TVF

Use a table-valued function (TVF) together with `INSERT INTO ... SELECT` to read remote Parquet files directly and write them into the target table. This method is suitable for on-demand imports and for persisting the results of ad hoc analysis.

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.parquet",
    "format" = "parquet",
    ...
);
```

Notes:

- `S3(...)`: a table-valued function. The parameters must include `uri` and `format`. Add other parameters (such as authentication information) as needed.
- Replace `S3` with `HDFS` to read Parquet files on HDFS.
- `SELECT *` can be replaced with a column list or a query with filter conditions to import only the data you need.

## FAQ

**Q1: Do you need to specify the file format explicitly when importing Parquet?**

Yes. Stream Load specifies it via the `format: parquet` request header; Broker Load specifies it via `FORMAT AS "parquet"`; TVF specifies it via the `"format" = "parquet"` parameter.

**Q2: Is importing Parquet from HDFS supported?**

Yes. You can use Broker Load (with an `hdfs://` path in `DATA INFILE`) or the HDFS TVF.

**Q3: What is the difference between TVF imports and Broker Load?**

Broker Load is an asynchronous bulk import job, suitable for large batches and scheduled tasks. A TVF runs synchronously through `INSERT INTO ... SELECT`, which is suitable for on-demand imports and for scenarios that require filtering, aggregation, or other processing before the data is loaded.
