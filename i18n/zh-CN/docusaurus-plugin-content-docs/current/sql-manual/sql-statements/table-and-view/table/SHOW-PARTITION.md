---
{
    "title": "SHOW PARTITION",
    "language": "zh-CN",
    "description": "SHOW PARTITION 用于展示指定分区的详细信息。包括所属数据库名字和 ID，所属表名字和 ID 以及分区名字。"
}
---

## 描述

SHOW PARTITION 用于展示指定分区的详细信息。包括所属数据库名字和 ID，所属表名字和 ID 以及分区名字。

## 语法

```sql
SHOW PARTITION <partition_id>
```

## 必选参数

`<partition_id>`

> 分区的 ID。分区 ID 可以通过 SHOW PARTITIONS 等方式获得。更多信息请参阅“SHOW PARTITIONS”章节

## 权限控制

执行此 SQL 命令的用户至少具有`ADMIN_PRIV`权限

## 示例

查询分区 ID 为 13004 的分区信息：

```sql
SHOW PARTITION 13004;
```

结果如下：

```sql
+--------+-----------+---------------+-------+---------+
| DbName | TableName | PartitionName | DbId  | TableId |
+--------+-----------+---------------+-------+---------+
| ods    | sales     | sales         | 13003 | 13005   |
+--------+-----------+---------------+-------+---------+
```