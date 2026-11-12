---
{
    "title": "SHOW CREATE DATABASE",
    "language": "zh-CN",
    "description": "该语句查看 doris 内置数据库或者 catalog 数据库的创建信息。"
}
---

## 描述

该语句查看 doris 内置数据库或者 catalog 数据库的创建信息。

## 语法

```sql
SHOW CREATE DATABASE [<catalog>.]<db_name>;
```

## 必选参数

** 1. `<db_name>`**
>  数据库名称

## 可选参数

** 1. `<catalog>`**
>  表示内部表还是外部表

## 返回结果

| 列 | 描述 |
|:---------|:-----------|
| Database | 数据库名称 |
| Create Database | 对应数据库创建语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 对应数据库 | 需要对对应数据库具有读取权限 |

## 示例

- 查看 doris 中 test 数据库的创建情况

   ```sql
   SHOW CREATE DATABASE test;
   ```

   ```text
   +----------+------------------------+
   | Database | Create Database        |
   +----------+------------------------+
   | test     | CREATE DATABASE `test` |
   +----------+------------------------+
   ```

- 查看 hive catalog 中数据库 hdfs_text 的创建信息

   ```sql
   SHOW CREATE DATABASE hdfs_text;
   ```

   ```text
   +-----------+------------------------------------------------------------------------------------+                         
   | Database  | Create Database                                                                    |                         
   +-----------+------------------------------------------------------------------------------------+                         
   | hdfs_text | CREATE DATABASE `hdfs_text` LOCATION 'hdfs://HDFS1009138/hive/warehouse/hdfs_text' |                         
   +-----------+------------------------------------------------------------------------------------+  
   ```
