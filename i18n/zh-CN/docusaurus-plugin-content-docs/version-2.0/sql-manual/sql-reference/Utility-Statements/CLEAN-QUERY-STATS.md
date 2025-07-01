---
{
    "title": "CLEAN-QUERY-STATS",
    "language": "zh-CN"
}
---

## CLEAN-QUERY-STATS

### Name


CLEAN QUERY STATS


## 描述

该语句用请空查询统计信息

语法：

```sql
CLEAN [ALL| DATABASE | TABLE] QUERY STATS [[FOR db_name]|[FROM|IN] table_name]];
```

说明：

1. 如果指定 ALL，则清空所有查询统计信息，包括数据库和表的统计信息，需要 admin 权限
2. 如果指定 DATABASE，则清空指定数据库的查询统计信息，需要对应 database 的 alter 权限
3. 如果指定 TABLE，则清空指定表的查询统计信息，需要对应表的 alter 权限

## 举例

1. 清空所有统计信息

    ```sql
    clean all query stats;
    ```

2. 清空指定数据库的统计信息

    ```sql
    clean database query stats for test_query_db;
    ```
3. 清空指定表的统计信息

    ```sql
    clean table query stats from test_query_db.baseall;
    ```

### Keywords

    CLEAN, QUERY, STATS

### Best Practice

