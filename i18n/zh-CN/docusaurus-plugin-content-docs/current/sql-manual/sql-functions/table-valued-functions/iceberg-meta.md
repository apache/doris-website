---
{
    "title": "ICEBERG_META",
    "language": "zh-CN",
    "description": "icebergmeta 表函数（table-valued-function,tvf），可以用于读取 iceberg 表的各类元数据信息，如操作历史、生成的快照、文件元数据等。"
}
---

## 描述

iceberg_meta 表函数（table-valued-function,tvf），可以用于读取 iceberg 表的各类元数据信息，如操作历史、生成的快照、文件元数据等。

## 语法
```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## 必填参数
iceberg_meta 表函数 tvf 中的每一个参数都是一个 `"key"="value"` 对

| Field          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`      | 完整的表名，需要按照目录名。库名.表名的格式，填写需要查看的 iceberg 表名。                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `<query_type>` | 元数据类型，支持以下类型：<br/>`snapshots`：快照信息<br/>`manifests`：当前快照的清单文件<br/>`all_manifests`：所有有效快照的清单文件（从 4.0.4 版本开始支持）<br/>`files`：当前快照的文件信息<br/>`data_files`：当前快照的数据文件<br/>`delete_files`：当前快照的删除文件<br/>`partitions`：分区信息<br/>`refs`：引用信息（分支和标签）<br/>`history`：历史记录<br/>`metadata_log_entries`：元数据日志条目 |


## 示例（Examples）

- 读取并访问 iceberg 表格式的 snapshots 元数据。

    ```sql
    select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```

- 可以配合`desc function`使用

    ```sql
    desc function iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```

- 查看 iceberg 表的 snapshots

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

- 根据 snapshot_id 字段筛选

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

- 查看 iceberg 表的 manifests（当前快照的清单文件）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "manifests");
    ```

- 查看 iceberg 表的 all_manifests（所有有效快照的清单文件，从 4.0.4 版本开始支持）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "all_manifests");
    ```

- 查看 iceberg 表的 files（当前快照的文件信息）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "files");
    ```

- 查看 iceberg 表的 data_files（当前快照的数据文件）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "data_files");
    ```

- 查看 iceberg 表的 delete_files（当前快照的删除文件）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "delete_files");
    ```

- 查看 iceberg 表的 partitions（分区信息）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "partitions");
    ```

- 查看 iceberg 表的 refs（引用信息）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "refs");
    ```

- 查看 iceberg 表的 history（历史记录）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "history");
    ```

- 查看 iceberg 表的 metadata_log_entries（元数据日志条目）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "metadata_log_entries");
    ```

## 相关说明

更多关于 Iceberg 系统表的详细信息，请参阅 [Iceberg Catalog 系统表](../../../lakehouse/catalogs/iceberg-catalog.mdx#系统表)。
