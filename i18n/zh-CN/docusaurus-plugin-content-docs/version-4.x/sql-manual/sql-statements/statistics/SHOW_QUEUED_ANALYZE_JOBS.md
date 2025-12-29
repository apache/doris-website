---
{
    "title": "SHOW QUEUED ANALYZE JOBS",
    "language": "zh-CN",
    "description": "该语句用来查看等待执行的统计信息作业队列。"
}
---

## 描述

该语句用来查看等待执行的统计信息作业队列。

## 语法

```SQL
SHOW QUEUED ANALYZE JOBS [ <table_name> ]
    [ WHERE PRIORITY = {"HIGH" | "MID" | "LOW" | "VERY_LOW"} ];
```

## 可选参数

**1. `<table_name>`**

> 表名。指定后可查看该表对应的作业队列信息。不指定时默认返回所有表的作业队列信息。

**2. `WHERE PRIORITY = {"HIGH" | "MID" | "LOW" | "VERY_LOW"}`**

> 作业优先级过滤条件。如不指定，默认显示所有优先级的作业信息。

## 返回值

| 列名 | 说明           |
| -- |--------------|
| catalog_name |   Catalog名           |
| db_name | 数据库名           |
| tbl_name | 表名         |
| col_list | 收集的列列表           |
| priority | 作业优先级           |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 SHOW 时，需要拥有被查询的表的 SELECT_PRIV 权限 |

## 举例

1. 通过表名展示作业队列

```sql
SHOW QUEUED ANALYZE JOBS REGION;
```

```text
+--------------+---------+----------+---------------------------------------------------+----------+
| catalog_name | db_name | tbl_name | col_list                                          | priority |
+--------------+---------+----------+---------------------------------------------------+----------+
| internal     | test    | region   | region:r_regionkey                                | HIGH     |
| internal     | test    | region   | region:r_name                                     | MID      |
| internal     | test    | region   | region:r_comment,region:r_name,region:r_regionkey | LOW      |
+--------------+---------+----------+---------------------------------------------------+----------+
```

2. 通过作业优先级过滤作业

```sql
SHOW QUEUED ANALYZE JOBS WHERE PRIORITY="HIGH";
```

```text
+--------------+---------+----------+--------------------+----------+
| catalog_name | db_name | tbl_name | col_list           | priority |
+--------------+---------+----------+--------------------+----------+
| internal     | test    | region   | region:r_regionkey | HIGH     |
+--------------+---------+----------+--------------------+----------+
```


