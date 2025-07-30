---
{
"title": "SHOW CREATE ASYNC MATERIALIZED VIEW",
"language": "zh-CN"
}
---

## 描述

查看异步物化视图创建语句。

## 语法

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name>
```

## 必选参数

**1. `<materialized_view_new_name>`**

> 物化视图名称

## 返回值

| 列名 | 说明   |
| -- |------|
| Materialized View | 物化视图名   |
| Create Materialized View | 物化视图创建语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象  | 说明                                                           |
| :---------------- | :------------- |:-------------------------------------------------------------|
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV         | 表     |  |

## 示例（Examples）

1. 查看异步物化视图创建语句

    ```sql
    SHOW CREATE MATERIALIZED VIEW partition_mv;
    ```
