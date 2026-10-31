---
{
    "title": "CREATE-VIEW",
    "language": "en"
}
---

## CREATE-VIEW

### Name

CREATE VIEW

### Description

This statement is used to create a logical view
grammar:

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt
```


illustrate:

- Views are logical views and have no physical storage. All queries on the view are equivalent to the sub-queries corresponding to the view.
- query_stmt is any supported SQL

### Example

1. Create the view example_view on example_db

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```
    
2. Create a view with a comment

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

### Keywords

    CREATE, VIEW

### Best Practice
