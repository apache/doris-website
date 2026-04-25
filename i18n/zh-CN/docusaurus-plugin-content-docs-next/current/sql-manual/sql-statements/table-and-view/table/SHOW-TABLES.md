---
{
    "title": "SHOW TABLES",
    "language": "zh-CN",
    "description": "该语句用于展示当前 db 下所有的 table 以及 view。"
}
---

## 描述

该语句用于展示当前 db 下所有的 table 以及 view。

## 语法

```sql
SHOW [ FULL ] TABLES [ FROM [ <catalog_name>.]<db_name> ][ LIKE <like_condition> ]
```

## 可选参数

**1. `FULL`**
> 语句中加了此参数，返回结果会多三列值，分别为 Table_type（表类型）、Storage_format（存储格式）、Inverted_index_storage_format（倒排索引存储格式）。

**2. `FROM [ <catalog_name>.]<db_name>`**
> FROM 子句中可以指定查询的 catalog 名称以及 database 的名称。

**2. `LIKE <like_condition>`**
> LIKE 子句中可以按照表名进行模糊查询。

## 返回值

| 列名（Column）                    | 类型（DataType） | 说明（Notes）                   |
|:------------------------------|:-------------|:----------------------------|
| Tables_in_<db_name>           | 字符串          | `<db_name>`所在数据库下面所有的表以及视图。 |
| Table_type                    | 字符串          | 表以及视图类型。                    |
| Storage_format                | 字符串          | 表以及视图存储格式。           |
| Inverted_index_storage_format | 字符串          | 表以及视图倒排索引存储格式。           |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）         |
|:--------------|:-----------|:------------------|
| SELECT_PRIV    | 表（Table）, 视图（View）    | 只能展示具有查询权限的表以及视图。 |

## 注意事项

- 语句中不指定 FROM 子句需要 use 到对应的 database 下面执行。

## 示例

- 查看 DB 下所有表
    
     ```sql
     SHOW TABLES;
     ```
  
     ```text
     +---------------------------------+
     | Tables_in_demo                  |
     +---------------------------------+
     | ads_client_biz_aggr_di_20220419 |
     | cmy1                            |
     | cmy2                            |
     | intern_theme                    |
     | left_table                      |
     +---------------------------------+
     ```

- 按照表名进行模糊查询

     ```sql
     SHOW TABLES LIKE '%cm%'
     ```
  
     ```text
     +----------------+
     | Tables_in_demo |
     +----------------+
     | cmy1           |
     | cmy2           |
     +----------------+
     ```
  
- 使用 FULL 按照查询 db 下的表以及视图

     ```sql
     SHOW FULL TABLES
     ```

     ```text
     +----------------+------------+----------------+-------------------------------+
     | Tables_in_demo | Table_type | Storage_format | Inverted_index_storage_format |
     +----------------+------------+----------------+-------------------------------+
     | test_table     | BASE TABLE | V2             | V1                            |
     | test_view      | VIEW       | NONE           | NONE                          |
     +----------------+------------+----------------+-------------------------------+
     ```
