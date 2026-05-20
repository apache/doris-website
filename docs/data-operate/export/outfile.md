---
{
    "title": "SELECT INTO OUTFILE",
    "language": "en",
    "description": "How to use SELECT INTO OUTFILE to synchronously export Doris query results to S3, HDFS, and other storage, with Parquet/ORC/CSV examples.",
    "keywords": [
        "SELECT INTO OUTFILE",
        "Doris export",
        "query result export",
        "export to S3",
        "export to HDFS",
        "Parquet export",
        "ORC export",
        "CSV export",
        "parallel export",
        "enable_parallel_outfile",
        "max_file_size",
        "success_file_name"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data export / Query result persistence / Offline analysis data delivery -->

This document describes how to use the `SELECT INTO OUTFILE` command to synchronously export Doris query results to object storage or HDFS in a specified file format.

`SELECT INTO OUTFILE` is a **synchronous export command** provided by Doris. It writes the result of a `SELECT` query to object storage (S3/COS/OSS/OBS/GCS) or HDFS in formats such as Parquet, ORC, or CSV. When the command returns, the export is complete.

- On success: returns information such as the number of exported files, their size, and their paths.
- On failure: returns an error message.

> For guidance on choosing between `SELECT INTO OUTFILE` and `EXPORT`, see [Export Overview](./export-overview.md).
> For the complete command reference, see [SELECT INTO OUTFILE syntax](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE).

## Applicable Scenarios

<!-- Knowledge type: Architecture selection decision -->

`SELECT INTO OUTFILE` is suitable for the following data export scenarios:

| Scenario type     | Description                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Complex computation export | The exported data must go through complex computation logic, such as filtering, aggregation, or joins (JOIN). |
| Synchronous task  | The business workflow must wait for the export to complete before performing subsequent operations. |

### Limitations

- Export in compressed text formats is not supported.
- The pipeline engine in version 2.1 does not support parallel export.

## Capability Overview

<!-- Knowledge type: Configuration parameters -->

### Supported storage locations

| Storage type           | Specific support                                          |
| ---------------------- | --------------------------------------------------------- |
| Object storage         | Amazon S3, Tencent Cloud COS, Alibaba Cloud OSS, Huawei Cloud OBS, Google GCS |
| Distributed file system | HDFS                                                     |
| Local file system      | For debugging only, must be enabled manually (see Appendix) |

### Supported file formats

- Parquet
- ORC
- csv
- csv\_with\_names
- csv\_with\_names\_and\_types

## Quick Start

<!-- Knowledge type: Operation steps -->

### Step 1: Create a table and load data

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```

### Step 2: Export to HDFS

Export the query result to the `hdfs://path/to/` directory in Parquet format:

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

### Step 3: Export to object storage

Export the query result to the `s3://bucket/export/` directory in ORC format. You must provide access credentials such as `ak` and `sk`:

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

## Advanced Capabilities

### Enable parallel export (improve export efficiency)

<!-- Applicable scenarios: Large data volume export / Performance tuning -->

Enable parallel export through the session variable `enable_parallel_outfile`:

```sql
SET enable_parallel_outfile=true;
```

| Dimension          | Description                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| Working mechanism  | Uses multiple BE nodes and multiple threads to export result data concurrently. |
| Advantage          | Significantly improves overall export efficiency.                            |
| Side effect        | May produce more files.                                                      |
| When it does not apply | For queries that include a global sort, parallel export does not take effect even if this parameter is enabled. |
| How to verify it took effect | If the export command returns more than one row, parallel export has taken effect. |

## Typical Scenario Examples

### Scenario 1: Export to an HDFS cluster with high availability enabled

<!-- Applicable scenarios: HA HDFS environment -->

If HDFS has HA enabled, you must additionally provide configurations related to nameservices and NameNodes:

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://HDFS8000871/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### Scenario 2: Export to an HDFS cluster with HA and Kerberos authentication enabled

<!-- Applicable scenarios: Kerberos secure authentication environment -->

If the HDFS cluster has both high availability and Kerberos authentication enabled, refer to the following SQL:

```sql
SELECT * FROM tbl
INTO OUTFILE "hdfs://path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM"
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

### Scenario 3: Generate an export-success marker file

<!-- Applicable scenarios: Synchronous task integrity verification / Avoiding unknown status caused by network disconnection -->

**Background**: `SELECT INTO OUTFILE` is a synchronous command. If the connection is interrupted while the SQL is executing, you cannot tell whether the export completed.

**Solution**: Use the `success_file_name` parameter. After a successful export, a marker file (similar to Hive's `_SUCCESS`) is generated in the directory. You can confirm the integrity of the export by checking whether this file exists.

The following example exports the query result to S3 in CSV format and generates a marker file named `SUCCESS` after completion:

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```

### Scenario 4: Clear the target directory before export

<!-- Applicable scenarios: Overwrite-style export / Periodic full replacement -->

Use the `delete_existing_files` parameter to clear existing files in the target directory before exporting:

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```

**Conditions and risks**:

| Item               | Description                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Behavior           | First deletes all files and subdirectories under `s3://bucket/export/`, then exports the data.       |
| Enable conditions  | You must add the configuration `enable_delete_existing_files = true` in `fe.conf` and restart the FE. |
| Risk warning       | This operation deletes data in an external system. It is a high-risk operation, so you must ensure the permissions and data security of the external system on your own. |

### Scenario 5: Control the size of a single exported file

Use the `max_file_size` parameter to control the maximum size of each exported file:

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "max_file_size" = "2048MB"
);
```

**Notes**:

- If the final generated data is no larger than 2 GB, only one file is produced.
- If it is larger than 2 GB, the data is split into multiple files.
- File splitting guarantees that one row of data is stored entirely within a single file, so the actual file size is not strictly equal to `max_file_size`.

## Notes

<!-- Knowledge type: Configuration parameters / Troubleshooting -->

### Performance and timeout

| Topic                | Description                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Composition of export time | `SELECT INTO OUTFILE` is essentially a SQL query, so the total time = query time + result-set write-out time.        |
| Single-thread bottleneck | When parallel export is not enabled, the query result is written out by a single BE node in a single thread.           |
| Performance optimization | Enable `enable_parallel_outfile` to use parallel export, which can significantly reduce the time consumed.             |
| Export timeout       | The timeout of the export command is the same as the query timeout. If the data volume is large, you can set `query_timeout` to extend it appropriately. |

### File management

- **Doris does not manage exported files**: Whether the export succeeds or files are left behind after a failure, you must clean them up yourself.
- **No path or file checking**: `SELECT INTO OUTFILE` does not check whether the file or path exists. Whether the path is created automatically and whether existing files are overwritten is entirely determined by the semantics of the remote storage system.

### Data and format

- **Empty result set**: Even if the query result set is empty, an empty file is still produced.
- **File splitting rule**: One row of data is guaranteed to be stored entirely within a single file, so the file size is not strictly equal to `max_file_size`.
- **Functions that produce non-printable characters**: Functions such as `BITMAP` and `HLL` that output non-printable characters are written as `\N` when exported to CSV.

## Appendix

### Export to the local file system (debugging only)

<!-- Applicable scenarios: Local debugging / Development verification -->
<!-- Knowledge type: Configuration parameters -->

:::caution
This feature is only for local debugging and development. **Do not use it in production environments**, and you must ensure the permissions and data security of the export directory yourself.
:::

**How to enable**: Add `enable_outfile_to_local=true` to `fe.conf` and restart the FE.

**Example**: Export all data from the `tbl` table to the local file system in CSV format (the default format), with `,` as the column separator:

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

**Behavior notes**:

- Data is written to the local disk of the BE node.
- In a multi-BE node environment, data is distributed to different BE nodes according to the concurrency of the export task.
- Files such as `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` are generated under the `/path/to/` directory on the BE nodes.
- The specific BE node IPs are shown in the returned result.

**Example return result**:

```text
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```
