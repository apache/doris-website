---
{
"title": "ICEBERG_META",
"language": "en"
}
---

## iceberg_meta

### Name

iceberg_meta

### description

iceberg_meta table-valued-function(tvf), Use for read iceberg metadata, operation history, snapshots of table, file metadata etc.

#### syntax

```sql
iceberg_meta(
  "table" = "ctl.db.tbl", 
  "query_type" = "snapshots"
  ...
  );
```

**parameter description**

Each parameter in iceberg_meta tvf is a pair of `"key"="value"`.

Related parameters:
- `table`： (required) Use iceberg table name the format `catlog.database.table`.
- `query_type`： (required) The type of iceberg metadata. Only `snapshots` is currently supported.

### Example

Read and access the iceberg tabular metadata for snapshots.

```sql
select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");

```

Can be used with `desc function` :

```sql
desc function iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
```

### Keywords

    iceberg_meta, table-valued-function, tvf

### Best Prac

Inspect the iceberg table snapshots :

```sql
select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
|      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
|  2022-09-20 11:14:29   |  64123452344   |       -1      |  append   | hdfs:/path/to/m1  | {"flink.job-id":"xxm1", ...} |
|  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
|  2022-09-21 21:44:11   |  51232845315   |  98865735822  | overwrite | hdfs:/path/to/m3  | {"flink.job-id":"xxm3", ...} |
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
```

Filtered by snapshot_id :

```sql
select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots") 
where snapshot_id = 98865735822;
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
|      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
|  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
```
