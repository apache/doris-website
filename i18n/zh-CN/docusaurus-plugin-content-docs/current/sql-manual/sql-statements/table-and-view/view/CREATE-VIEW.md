---
{
    "title": "CREATE VIEW",
    "language": "zh-CN",
    "description": "该语句用于通过指定的查询语句创建一个逻辑视图。"
}
---

## 描述

该语句用于通过指定的查询语句创建一个逻辑视图。

## 语法

```sql
CREATE VIEW [IF NOT EXISTS] [<db_name>.]<view_name>
   [(<column_definition>)]
[AS] <query_stmt>
```

其中：
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## 必选参数

**1. `<view_name>`**
> 视图的标识符（即名称）；在创建视图的数据库中必须唯一。  
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My View`）。  
> 标识符不能使用保留关键字。  
> 有关更多详细信息，请参阅标识符要求和保留关键字。

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
| CREATE_PRIV | 数据库  |                                    |
| SELECT_PRIV | 表、视图 | 需要拥有被查询的表、视图、物化视图的 SELECT_PRIV 权限。 |


## 注意事项

- 视图为逻辑视图，没有物理存储。所有在视图上的查询相当于在视图对应的子查询上进行。  
- 视图的创建和删除不会影响底层表的数据。

## 示例

1. 在 example_db 上创建视图 example_view

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```
    
2. 创建一个包含列定义的视图

    ```sql
    CREATE VIEW example_db.example_view
    (
        k1 COMMENT "first key",
        k2 COMMENT "second key",
        k3 COMMENT "third key",
        v1 COMMENT "first value"
    )
    COMMENT "my first view"
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```


