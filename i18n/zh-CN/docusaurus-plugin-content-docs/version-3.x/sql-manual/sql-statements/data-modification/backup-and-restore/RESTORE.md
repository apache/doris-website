---
{
    "title": "RESTORE",
    "language": "zh-CN",
    "description": "该语句用于将之前通过 BACKUP 命令备份的数据，恢复到指定数据库下。该命令为异步操作。提交成功后，需通过 SHOW RESTORE命令查看进度。"
}
---

## 描述

该语句用于将之前通过 BACKUP 命令备份的数据，恢复到指定数据库下。该命令为异步操作。提交成功后，需通过 [SHOW RESTORE](./SHOW-RESTORE.md)命令查看进度。

## 语法

```sql
RESTORE SNAPSHOT [<db_name>.]<snapshot_name>
FROM `<repository_name>`
[ { ON | EXCLUDE } ] (
    `<table_name>` [PARTITION (`<partition_name>`, ...)] [AS `<table_alias>`]
    [, ...] ) ]
)
[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```

## 必选参数

**1.`<db_name>`**

需要恢复的数据所属的数据库名

**2.`<snapshot_name>`**

数据快照名

**3.`<repository_name>`**

仓库名。您可以通过 [CREATE REPOSITORY](./CREATE-REPOSITORY.md) 创建仓库

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

恢复操作属性，格式为 `<key>` = `<value>`，目前支持以下属性：

- "backup_timestamp" = "2018-05-04-16-45-08"：指定了恢复对应备份的哪个时间版本，必填。该信息可以通过 `SHOW SNAPSHOT ON repo;` 语句获得。
- "replication_num" = "3"：指定恢复的表或分区的副本数。默认为 3。若恢复已存在的表或分区，则副本数必须和已存在表或分区的副本数相同。同时，必须有足够的 host 容纳多个副本。
- "reserve_replica" = "true"：默认为 false。当该属性为 true 时，会忽略 replication_num 属性，恢复的表或分区的副本数将与备份之前一样。支持多个表或表内多个分区有不同的副本数。
- "reserve_dynamic_partition_enable" = "true"：默认为 false。当该属性为 true 时，恢复的表会保留该表备份之前的'dynamic_partition_enable'属性值。该值不为 true 时，则恢复出来的表的'dynamic_partition_enable'属性值会设置为 false。
- "timeout" = "3600"：任务超时时间，默认为一天。单位秒。
- "meta_version" = 40：使用指定的 meta_version 来读取之前备份的元数据。注意，该参数作为临时方案，仅用于恢复老版本 Doris 备份的数据。最新版本的备份数据中已经包含 meta version，无需再指定。
- "clean_tables": 表示是否清理不属于恢复目标的表。例如，如果恢复之前的目标数据库有备份中不存在的表，指定 `clean_tables` 就可以在恢复期间删除这些额外的表并将其移入回收站。该功能自 Apache Doris  2.1.6 版本起支持。
- "clean_partitions"：表示是否清理不属于恢复目标的分区。例如，如果恢复之前的目标表有备份中不存在的分区，指定 `clean_partitions` 就可以在恢复期间删除这些额外的分区并将其移入回收站。该功能自 Apache Doris  2.1.6 版本起支持。
- "atomic_restore"：先将数据加载到临时表中，再以原子方式替换原表，确保恢复过程中不影响目标表的读写。
- "force_replace"：当表存在且架构与备份表不同时，强制替换。
  - 注意，要启用 "force_replace"，必须启用 "atomic_restore"

## 可选参数

**1.`<table_name>`**

需要恢复的表名。如不指定则恢复整个数据库

- ON 子句中标识需要恢复的表和分区。如果不指定分区，则默认恢复该表的所有分区。所指定的表和分区必须已存在于仓库备份中
- EXCLUDE 子句中标识不需要恢复的表和分区。除了所指定的表或分区之外仓库中所有其他表的所有分区将被恢复

**2.`<partition_name>`**

需要恢复的分区名。如不指定则恢复对应表的所有分区

**3.`<table_alias>`**

表别名

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：
| 权限         | 对象         | 说明          |
|:------------|:------------|:--------------|
| LOAD_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 LOAD_PRIV 权限才能进行此操作 |

## 注意事项：

- 仅支持恢复 OLAP 类型的表。
- 同一数据库下只能有一个正在执行的 BACKUP 或 RESTORE 任务。
- 可以将仓库中备份的表恢复替换数据库中已有的同名表，但须保证两张表的表结构完全一致。表结构包括：表名、列、分区、Rollup 等等。
- 可以指定恢复表的部分分区，系统会检查分区 Range 或者 List 是否能够匹配。
- 可以通过 AS 语句将仓库中备份的表名恢复为新的表。但新表名不能已存在于数据库中。分区名称不能修改。
- 恢复操作的效率：在集群规模相同的情况下，恢复操作的耗时基本等同于备份操作的耗时。如果想加速恢复操作，可以先通过设置 `replication_num` 参数，仅恢复一个副本，之后在通过调整副本数 [ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY.md)，将副本补齐。

## 示例

1. 从 example_repo 中恢复备份 snapshot_1 中的表 backup_tbl 到数据库 example_db1，时间版本为 "2018-05-04-16-45-08"。恢复为 1 个副本：

```sql
RESTORE SNAPSHOT example_db1.`snapshot_1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-16-45-08",
    "replication_num" = "1"
);
```

2. 从 example_repo 中恢复备份 snapshot_2 中的表 backup_tbl 的分区 p1,p2，以及表 backup_tbl2 到数据库 example_db1，并重命名为 new_tbl，时间版本为 "2018-05-04-17-11-01"。默认恢复为 3 个副本：

```sql
RESTORE SNAPSHOT example_db1.`snapshot_2`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2018-05-04-17-11-01"
);
```

3. 从 example_repo 中恢复备份 snapshot_3 中除了表 backup_tbl 的其他所有表到数据库 example_db1，时间版本为 "2018-05-04-18-12-18"。

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```

