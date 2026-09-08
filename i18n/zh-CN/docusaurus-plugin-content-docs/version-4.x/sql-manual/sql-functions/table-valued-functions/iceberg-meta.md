---
{
    "title": "ICEBERG_META",
    "language": "zh-CN",
    "description": "iceberg_meta 表函数（table-valued-function,tvf）用于读取 Iceberg 表的各类元数据信息。该表函数自 4.1.4 版本起已移除，请改用 Iceberg 系统表。"
}
---

:::caution 版本行为变更（4.1.4）

`iceberg_meta()` 表函数自 **4.1.4** 版本起已移除。执行该表函数会报错：

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Could not find table function iceberg_meta
```

请改用 Iceberg 系统表查询同样的元数据信息。系统表自 3.1.0 版本开始支持，功能覆盖 `iceberg_meta()` 的全部 `query_type`，并且支持更完整的元数据类型。详见 [Iceberg Catalog 系统表](../../../lakehouse/catalogs/iceberg-catalog.mdx#系统表)。

4.1.4 之前的版本仍可以使用 `iceberg_meta()`，本文保留其用法说明以供参考。

:::

## 描述

iceberg_meta 表函数（table-valued-function,tvf），可以用于读取 iceberg 表的各类元数据信息，如操作历史、生成的快照、文件元数据等。

## 替代用法：Iceberg 系统表

系统表的访问方式是在表名后添加 `$` 符号，后跟系统表名称：

```sql
SELECT * FROM <catalog>.<database>.<table>$<system_table_name>;
```

`iceberg_meta()` 的 `query_type` 与系统表的对应关系如下：

| `iceberg_meta()` 的 `query_type` | 等价的系统表              |
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

改写示例：

```sql
-- 4.1.4 之前
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");

-- 4.1.4 及之后
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots;
```

```sql
-- 4.1.4 之前：根据 snapshot_id 字段筛选
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots")
WHERE snapshot_id = 98865735822;

-- 4.1.4 及之后
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots WHERE snapshot_id = 98865735822;
```

## 语法（4.1.4 之前）

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## 必填参数（4.1.4 之前）

iceberg_meta 表函数 tvf 中的每一个参数都是一个 `"key"="value"` 对

| Field          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`      | 完整的表名，需要按照目录名。库名.表名的格式，填写需要查看的 iceberg 表名。                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `<query_type>` | 元数据类型，支持以下类型：<br/>`snapshots`：快照信息<br/>`manifests`：当前快照的清单文件<br/>`all_manifests`：所有有效快照的清单文件（从 4.0.4 版本开始支持）<br/>`files`：当前快照的文件信息<br/>`data_files`：当前快照的数据文件<br/>`delete_files`：当前快照的删除文件<br/>`partitions`：分区信息<br/>`refs`：引用信息（分支和标签）<br/>`history`：历史记录<br/>`metadata_log_entries`：元数据日志条目 |

## 示例（Examples）

- 读取并访问 iceberg 表格式的 snapshots 元数据。

    ```sql
    select * from iceberg_ctl.db.tbl$snapshots;
    ```

- 查看 iceberg 表的 snapshots

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

- 根据 snapshot_id 字段筛选

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

- 查看 iceberg 表的其他元数据

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

## 相关说明

更多关于 Iceberg 系统表的详细信息，请参阅 [Iceberg Catalog 系统表](../../../lakehouse/catalogs/iceberg-catalog.mdx#系统表)。
