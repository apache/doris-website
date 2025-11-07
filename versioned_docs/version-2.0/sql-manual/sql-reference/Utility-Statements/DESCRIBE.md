---
{
    "title": "DESCRIBE",
    "language": "en"
}
---

## DESCRIBE

### Name

DESCRIBE

### Description

This statement is used to display the schema information of the specified table

grammar:

```sql
DESC[RIBE] [db_name.]table_name [ALL];
```

illustrate:

1. If ALL is specified, the schemas of all indexes (rollup) of the table will be displayed

### Example

1. Display the Base table schema

    ```sql
    DESC table_name;
    ```

2. Display the schema of all indexes of the table

    ```sql
    DESC db1.table_name ALL;
    ```

### Keywords

    DESCRIBE

### Best Practice

