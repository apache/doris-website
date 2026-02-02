---
{
    "title": "ICEBERG_META",
    "language": "en",
    "description": "icebergmeta table-valued-function(tvf), Use for read iceberg metadata, operation history, snapshots of table, file metadata etc."
}
---

## Description

iceberg_meta table-valued-function(tvf), Use for read iceberg metadata, operation history, snapshots of table, file metadata etc.

## Syntax

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## Required Parameters
Each parameter in the `iceberg_meta` table function (tvf) is a `"key"="value"` pair.

| Field          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`      | The full table name, which must be specified in the format of `database_name.table_name` for the Iceberg table that you want to view.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `<query_type>` | The type of metadata you want to view. Supported types:<br/>`snapshots`: Snapshot information<br/>`manifests`: Manifest files of current snapshot<br/>`all_manifests`: Manifest files of all valid snapshots (supported from version 4.0.4)<br/>`files`: File information of current snapshot<br/>`data_files`: Data files of current snapshot<br/>`delete_files`: Delete files of current snapshot<br/>`partitions`: Partition information<br/>`refs`: Reference information (branches and tags)<br/>`history`: History records<br/>`metadata_log_entries`: Metadata log entries |


## Examples

- Read and access the iceberg tabular metadata for snapshots.

    ```sql
    select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```

- Can be used with `desc function` :

    ```sql
    desc function iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```

- Inspect the iceberg table snapshots :
    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-20 11:14:29   |  64123452344   |       -1      |  append   | hdfs:/path/to/m1  | {"flink.job-id":"xxm1", ...} |
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    |  2022-09-21 21:44:11   |  51232845315   |  98865735822  | overwrite | hdfs:/path/to/m3  | {"flink.job-id":"xxm3", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- Filtered by snapshot_id :

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots") where snapshot_id = 98865735822;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- View manifests of the iceberg table (manifest files of current snapshot)

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "manifests");
    ```

- View all_manifests of the iceberg table (manifest files of all valid snapshots, supported from version 4.0.4)

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "all_manifests");
    ```

- View files of the iceberg table (file information of current snapshot)

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "files");
    ```

- View data_files of the iceberg table (data files of current snapshot)

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "data_files");
    ```

- View delete_files of the iceberg table (delete files of current snapshot)

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "delete_files");
    ```

- View partitions of the iceberg table

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "partitions");
    ```

- View refs of the iceberg table (reference information)

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "refs");
    ```

- View history of the iceberg table

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "history");
    ```

- View metadata_log_entries of the iceberg table

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "metadata_log_entries");
    ```

## Related

For more detailed information about Iceberg system tables, please refer to [Iceberg Catalog System Tables](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables).
