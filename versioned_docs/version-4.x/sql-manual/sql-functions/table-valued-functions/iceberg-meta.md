---
{
    "title": "ICEBERG_META",
    "language": "en",
    "description": "iceberg_meta table-valued-function(tvf), used to read various metadata of an iceberg table. This table function was removed in 4.1.4; use Iceberg system tables instead."
}
---

:::caution Behavior change (4.1.4)

The `iceberg_meta()` table function was removed in **4.1.4**. Running it reports:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Could not find table function iceberg_meta
```

Query the same metadata through Iceberg system tables instead. System tables are supported since 3.1.0, cover every `query_type` of `iceberg_meta()`, and expose more metadata types. See [Iceberg Catalog System Tables](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables).

Versions earlier than 4.1.4 can still use `iceberg_meta()`, so its usage is kept in this document for reference.

:::

## Description

iceberg_meta table-valued-function(tvf), Use for read iceberg metadata, operation history, snapshots of table, file metadata etc.

## Replacement: Iceberg System Tables

A system table is accessed by appending `$` and the system table name to the table name:

```sql
SELECT * FROM <catalog>.<database>.<table>$<system_table_name>;
```

Each `query_type` of `iceberg_meta()` maps to a system table as follows:

| `query_type` of `iceberg_meta()` | Equivalent system table   |
|----------------------------------|---------------------------|
| `snapshots`                      | `<table>$snapshots`       |
| `manifests`                      | `<table>$manifests`       |
| `all_manifests`                  | `<table>$all_manifests`   |
| `files`                          | `<table>$files`           |
| `data_files`                     | `<table>$data_files`      |
| `delete_files`                   | `<table>$delete_files`    |
| `partitions`                     | `<table>$partitions`      |
| `refs`                           | `<table>$refs`            |
| `history`                        | `<table>$history`         |
| `metadata_log_entries`           | `<table>$metadata_log_entries` |

Rewrite examples:

```sql
-- Before 4.1.4
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots;
```

```sql
-- Before 4.1.4: filtered by the snapshot_id column
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots")
WHERE snapshot_id = 98865735822;

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots WHERE snapshot_id = 98865735822;
```

## Syntax (Before 4.1.4)

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## Required Parameters (Before 4.1.4)

Each parameter in the `iceberg_meta` table function (tvf) is a `"key"="value"` pair.

| Field          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`      | The full table name, which must be specified in the format of `database_name.table_name` for the Iceberg table that you want to view.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `<query_type>` | The type of metadata you want to view. Supported types:<br/>`snapshots`: Snapshot information<br/>`manifests`: Manifest files of current snapshot<br/>`all_manifests`: Manifest files of all valid snapshots (supported from version 4.0.4)<br/>`files`: File information of current snapshot<br/>`data_files`: Data files of current snapshot<br/>`delete_files`: Delete files of current snapshot<br/>`partitions`: Partition information<br/>`refs`: Reference information (branches and tags)<br/>`history`: History records<br/>`metadata_log_entries`: Metadata log entries |

## Examples

- Read and access the iceberg tabular metadata for snapshots.

    ```sql
    select * from iceberg_ctl.db.tbl$snapshots;
    ```

- Inspect the iceberg table snapshots :

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots;
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
    select * from iceberg_ctl.test_db.test_tbl$snapshots where snapshot_id = 98865735822;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- View other metadata of the iceberg table

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$manifests;
    select * from iceberg_ctl.test_db.test_tbl$all_manifests;
    select * from iceberg_ctl.test_db.test_tbl$files;
    select * from iceberg_ctl.test_db.test_tbl$data_files;
    select * from iceberg_ctl.test_db.test_tbl$delete_files;
    select * from iceberg_ctl.test_db.test_tbl$partitions;
    select * from iceberg_ctl.test_db.test_tbl$refs;
    select * from iceberg_ctl.test_db.test_tbl$history;
    select * from iceberg_ctl.test_db.test_tbl$metadata_log_entries;
    ```

## Related

For more detailed information about Iceberg system tables, please refer to [Iceberg Catalog System Tables](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables).
