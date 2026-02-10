---
{
    "title": "SHOW CREATE SYNC MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "查看同步物化视图创建语句。"
}
---

## 描述

查看同步物化视图创建语句。

## 语法

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name> ON <table_name>
```

## 必选参数

**1. `<materialized_view_new_name>`**

> 物化视图名称

**2. `<table_name>`**

> 物化视图所属的表

## 返回值

| 列名 | 说明   |
| -- |------|
| TableName | 表名   |
| ViewName | 物化视图名 |
| CreateStmt | 物化视图创建语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象  | 说明                        |
| :---------------- | :------------- |:--------------------------|
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV         | 表     | 需要拥有当前物化视图所属表的权限          |

## 示例（Examples）

1. 查看同步物化视图创建语句

    ```sql
    SHOW CREATE MATERIALIZED VIEW sync_agg_mv on lineitem;
    ```