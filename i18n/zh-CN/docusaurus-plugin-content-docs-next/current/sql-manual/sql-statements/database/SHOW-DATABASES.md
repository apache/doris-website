---
{
    "title": "SHOW DATABASES",
    "language": "zh-CN",
    "description": "该语句用于展示当前可见的数据库"
}
---

## 描述

该语句用于展示当前可见的数据库

## 语法

```sql
SHOW DATABASES [FROM <catalog>] [<filter_expr>];
```

## 可选参数

** 1. `<catalog>`**
>  对应 catalog

** 2. `<filter_expr>`**
>  进行指定条件的过滤

## 返回结果

|  列 | 描述    |
|:--|:------|
| Database |  数据库名称|

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 对应数据库 | 需要对对应数据库具有读取权限 |

## 示例

- 展示当前所有的数据库名称。

   ```sql
   SHOW DATABASES;
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | test               |
   | information_schema |
   +--------------------+
   ```

- 会展示`hms_catalog`中所有的数据库名称。

   ```sql
   SHOW DATABASES FROM hms_catalog;
   ```

   ```text
   +---------------+
   | Database      |
   +---------------+
   | default       |
   | tpch          |
   +---------------+
   ```

- 展示当前所有经过表示式`like 'infor%'`过滤后的数据库名称。

   ```sql
   SHOW DATABASES like 'infor%';
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | information_schema |
   +--------------------+
   ```
