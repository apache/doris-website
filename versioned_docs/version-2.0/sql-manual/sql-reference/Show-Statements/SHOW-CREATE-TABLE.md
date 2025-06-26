---
{
    "title": "SHOW-CREATE-TABLE",
    "language": "en"
}
---

## SHOW-CREATE-TABLE

### Name

SHOW CREATE TABLE

### Description

This statement is used to display the creation statement of the data table.

grammar:

```sql
SHOW [BRIEF] CREATE TABLE [DBNAME.]TABLE_NAME
```

illustrate:



1. `BRIEF` : will not show partitions info



2. `DBNAMNE` : database name
3. `TABLE_NAME` : table name

### Example

1. View the table creation statement of a table

    ```sql
    SHOW CREATE TABLE demo.tb1
    ```

### Keywords

    SHOW, CREATE, TABLE

### Best Practice

