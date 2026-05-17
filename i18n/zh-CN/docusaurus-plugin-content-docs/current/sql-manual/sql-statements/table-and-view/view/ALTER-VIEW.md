---
{
    "title": "ALTER VIEW",
    "language": "zh-CN",
    "description": "该语句用于修改一个逻辑视图的定义。"
}
---

## 描述

该语句用于修改一个逻辑视图的定义。

## 语法

```sql
ALTER VIEW [<db_name>.]<view_name> 
 [(<column_definition>)]
AS <query_stmt>
```

其中：
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## 必选参数

**1. `<view_name>`**
> 要修改的视图的标识符（即名称）。

**2. `<query_stmt>`**
> 定义视图的 SELECT 查询语句。

## 可选参数

**1. `<db_name>`**
> 视图所在的数据库名称。如果未指定，则默认为当前数据库。

**2. `<column_definition>`**
> 视图的列定义。  
> 其中：  
> **1. `<column_name>`**  
> 列名。  
> **2. `<comment>`**  
> 列的注释。


## 权限控制

| 权限          | 对象   | 说明                                 |
|-------------|------|------------------------------------|
| ALTER_PRIV  | 视图  | 需要所修改视图的 SELECT_PRIV 权限。           |
| SELECT_PRIV | 表、视图 | 需要拥有被查询的表、视图、物化视图的 SELECT_PRIV 权限。 |

## 示例

1、修改 example_db 上的视图 example_view

  ```sql
  ALTER VIEW example_db.example_view
  (
    c1 COMMENT "column 1",
    c2 COMMENT "column 2",
    c3 COMMENT "column 3"
  )
  AS SELECT k1, k2, SUM(v1) FROM example_table 
  GROUP BY k1, k2
  ```

