---
{
    "title": "DROP-INDEX",
    "language": "en"
}
---

## DROP-INDEX

### Name

DROP INDEX

### Description

This statement is used to delete the index of the specified name from a table.
grammar:

```sql
DROP INDEX [IF EXISTS] index_name ON [db_name.]table_name;
```

### Example

1. Delete the index

    ```sql
    DROP INDEX [IF NOT EXISTS] index_name ON table1 ;
    ```

### Keywords

     DROP, INDEX

### Best Practice
