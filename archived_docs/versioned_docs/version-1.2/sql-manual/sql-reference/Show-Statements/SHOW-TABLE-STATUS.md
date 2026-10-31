---
{
    "title": "SHOW-TABLE-STATUS",
    "language": "en"
}
---

## SHOW-TABLE-STATUS

### Name

SHOW TABLE STATUS

### Description

This statement is used to view some information about the Table.

grammar:

```sql
SHOW TABLE STATUS
[FROM db] [LIKE "pattern"]
```

illustrate:

1. This statement is mainly used to be compatible with MySQL syntax, currently only a small amount of information such as Comment is displayed

### Example

  1. View the information of all tables under the current database

     ```sql
     SHOW TABLE STATUS;
     ```

  2. View the information of the table whose name contains example under the specified database

     ```sql
     SHOW TABLE STATUS FROM db LIKE "%example%";
     ```

### Keywords

    SHOW, TABLE, STATUS

### Best Practice

