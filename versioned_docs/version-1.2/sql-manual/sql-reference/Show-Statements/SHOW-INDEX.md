---
{
    "title": "SHOW-INDEX",
    "language": "en"
}
---

## SHOW-INDEX

### Name

SHOW INDEX

### Description

  This statement is used to display information about indexes in a table. Currently, only bitmap indexes are supported.

grammar:

```SQL
SHOW INDEX[ES] FROM [db_name.]table_name [FROM database];
or
SHOW KEY[S] FROM [db_name.]table_name [FROM database];
```

### Example

  1. Display the lower index of the specified table_name

     ```SQL
      SHOW INDEX FROM example_db.table_name;
     ```

### Keywords

    SHOW, INDEX

### Best Practice

