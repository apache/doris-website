---
{
    "title": "SHOW-DATABASES",
    "language": "zh-CN"
}
---

## SHOW-DATABASES

### Name

SHOW DATABASES

## 描述

该语句用于展示当前可见的 db

语法：

```sql
SHOW DATABASES [FROM catalog] [filter expr];
```

说明:
1. `SHOW DATABASES` 会展示当前所有的数据库名称.
2. `SHOW DATABASES FROM catalog` 会展示`catalog`中所有的数据库名称.
3. `SHOW DATABASES filter_expr` 会展示当前所有经过过滤后的数据库名称.
4. `SHOW DATABASES FROM catalog filter_expr` 这种语法不支持.

## 举例
1. 展示当前所有的数据库名称.

   ```sql
   SHOW DATABASES;
   ```

   ```
  +--------------------+
  | Database           |
  +--------------------+
  | test               |
  | information_schema |
  +--------------------+
   ```

2. 会展示`hms_catalog`中所有的数据库名称.

   ```sql
   SHOW DATABASES from hms_catalog;
   ```

   ```
  +---------------+
  | Database      |
  +---------------+
  | default       |
  | tpch          |
  +---------------+
   ```

3. 展示当前所有经过表示式`like 'infor%'`过滤后的数据库名称.

   ```sql
   SHOW DATABASES like 'infor%';
   ```

   ```
  +--------------------+
  | Database           |
  +--------------------+
  | information_schema |
  +--------------------+
   ```

### Keywords

    SHOW, DATABASES

### Best Practice

