---
{
"title": "ICEBERG_META",
"language": "zh-CN"
}
---

## iceberg_meta

### Name

iceberg_meta

## 描述

iceberg_meta 表函数（table-valued-function,tvf），可以用于读取 iceberg 表的各类元数据信息，如操作历史、生成的快照、文件元数据等。

## 语法
```sql
iceberg_meta(
  "table" = "ctl.db.tbl", 
  "query_type" = "snapshots"
  ...
  );
```

**参数说明**

iceberg_meta 表函数 tvf 中的每一个参数都是一个 `"key"="value"` 对。
相关参数：
- `table`： (必填) 完整的表名，需要按照目录名。库名。表名的格式，填写需要查看的 iceberg 表名。
- `query_type`： (必填) 想要查看的元数据类型，目前仅支持 snapshots。

## 举例

读取并访问 iceberg 表格式的 snapshots 元数据。

```sql
select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");

```

可以配合`desc function`使用

```sql
desc function iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
```

### Keywords

    iceberg_meta, table-valued-function, tvf

### Best Prac

查看 iceberg 表的 snapshots

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

根据 snapshot_id 字段筛选

```sql
select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots") 
where snapshot_id = 98865735822;
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
|      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
|  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
+------------------------+----------------+---------------+-----------+-------------------+------------------------------+
```
