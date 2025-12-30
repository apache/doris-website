---
{
    "title": "DROP MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "删除同步物化视图。"
}
---

## 描述

删除同步物化视图。

## 语法

```sql
DROP MATERIALIZED VIEW 
[ IF EXISTS ] <materialized_view_name>
ON <table_name>
```

## 必选参数

**1. `<materialized_view_new_name>`**

> 目标要删除的物化视图名称

**2. `<table_name>`**

> 物化视图所属的表

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象 | 说明                                     |
| :---------------- | :------------- | :--------------------------------------------------- |
| ALTER_PRIV        | 表    | 需要拥有当前被删除的物化视图所属表的 ALTER_PRIV 权限 |

## 示例

删除 lineitem 表上的 sync_agg_mv 同步物化视图

```sql
DROP MATERIALIZED VIEW sync_agg_mv on lineitem;
```