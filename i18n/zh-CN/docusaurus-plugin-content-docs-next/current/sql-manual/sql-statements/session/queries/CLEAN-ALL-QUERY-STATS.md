---
{
    "title": "CLEAN QUERY STATS",
    "language": "zh-CN",
    "description": "该语句用清空查询统计信息"
}
---

## 描述

该语句用清空查询统计信息

## 语法

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```

## 必选参数

**1. `ALL`**

> ALL 可以清空所有统计信息

**2. `DATABASE`**

> DATABASE 表示清空某个数据库的统计信息

**3. `TABLE`**

> TABLE 表示清空某个表的统计信息

## 可选参数

**1. `<db_name>`**

> 若填写表示清空对应数据库的统计信息

**2. `<table_name>`**

> 若填写表示清空对应表的统计信息


## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
|:--------------|:-----------|:--------------------------|
| ADMIN_PRIV         | ALL        | 如果指定 ALL 则需要 ADMIN 权限     |
| ALTER_PRIV         | 数据库          | 如果指定数据库则需要对应数据库的 ALTER 权限 |
| ADMIN_PRIV         | 表          | 如果指定表则需要对应表的 alter 权限     |


## 示例

```sql
clean all query stats
```

```sql
clean database query stats for test_query_db
```

```sql
clean table query stats from test_query_db.baseall
```


