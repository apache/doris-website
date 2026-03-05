---
{
    "title": "CLEAN-QUERY-STATS",
    "language": "en"
}
---

## CLEAN-QUERY-STATS

### Name


CLEAN QUERY STATS


### Description

This statement is used to clear query statistics

grammar：

```sql
CLEAN [ALL| DATABASE | TABLE] QUERY STATS [[FOR db_name]|[FROM|IN] table_name]];
```

Remarks：

1. If ALL is specified, all query statistics are cleared, including database and table, admin privilege is needed
2. If DATABASE is specified, the query statistics of the specified database are cleared, alter privilege for this database is needed
3. If TABLE is specified, the query statistics of the specified table are cleared, alter privilege for this table is needed

### Example

1. Clear all statistics
2. 
    ```sql
    clean all query stats;
    ```

2. Clear the specified database statistics

    ```sql
    clean database query stats for test_query_db;
    ```
3. Clear the specified table statistics

    ```sql
    clean table query stats from test_query_db.baseall;
    ```

### Keywords

    CLEAN, QUERY, STATS

### Best Practice

