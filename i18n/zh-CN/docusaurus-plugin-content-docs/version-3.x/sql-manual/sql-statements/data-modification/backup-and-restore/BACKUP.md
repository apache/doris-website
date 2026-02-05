---
{
    "title": "BACKUP",
    "language": "zh-CN",
    "description": "该语句用于备份指定数据库下的数据。该命令为异步操作，提交成功后，需通过 SHOW BACKUP 命令查看进度。"
}
---

## 描述

该语句用于备份指定数据库下的数据。该命令为异步操作，提交成功后，需通过 [SHOW BACKUP](./SHOW-BACKUP.md) 命令查看进度。

## 语法

```sql
BACKUP SNAPSHOT [<db_name>.]<snapshot_name>
TO `<repository_name>`
[ { ON | EXCLUDE } ]
    ( <table_name> [ PARTITION ( <partition_name> [, ...] ) ]
    [, ...] ) ]

[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```

## 必选参数

**1.`<db_name>`**

需要备份的数据所属的数据库名

**2.`<snapshot_name>`**

指定数据快照名。快照名不可重复，全局唯一

**3.`<repository_name>`**

仓库名。您可以通过 [CREATE REPOSITORY](./CREATE-REPOSITORY.md) 创建仓库

## 可选参数

**1.`<table_name>`**

需要备份的表名。如不指定则备份整个数据库。

- ON 子句中标识需要备份的表和分区。如果不指定分区，则默认备份该表的所有分区
- EXCLUDE 子句中标识不需要备份的表和分区。备份除了指定的表或分区之外这个数据库中所有表的所有分区数据。

**2.`<partition_name>`**

需要备份的分区名。如不指定则备份对应表的所有分区。

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

数据快照属性，格式为 `<key>` = `<value>`，目前支持以下属性：

- "type" = "full"：表示这是一次全量更新（默认）
- "timeout" = "3600"：任务超时时间，默认为一天。单位秒。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：
| 权限         | 对象         | 说明          |
|:------------|:------------|:--------------|
| LOAD_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 LOAD_PRIV 权限才能进行此操作 |

## 注意事项：

- 仅支持备份 OLAP 类型的表。
- 同一数据库下只能有一个正在执行的 BACKUP 或 RESTORE 任务。
- 备份操作会备份指定表或分区的基础表及 [物化视图](../../../../query-acceleration/materialized-view/sync-materialized-view.md)，并且仅备份一副本。[异步物化视图](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md)还不支持。
- 备份操作的效率取决于数据量、Compute Node 节点数量以及文件数量。备份数据分片所在的每个 Compute Node 都会参与备份操作的上传阶段。节点数量越多，上传的效率越高，文件数据量只涉及到的分片数，以及每个分片中文件的数量。如果分片非常多，或者分片内的小文件较多，都可能增加备份操作的时间。

## 示例

1. 全量备份 example_db 下的表 example_tbl 到仓库 example_repo 中：

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```

2. 全量备份 example_db 下，表 example_tbl 的 p1, p2 分区，以及表 example_tbl2 到仓库 example_repo 中：

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON 
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```

3. 全量备份 example_db 下除了表 example_tbl 的其他所有表到仓库 example_repo 中：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```

4. 全量备份 example_db 下的表到仓库 example_repo 中：

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```

