---
{
    "title": "DROP-TABLE",
    "language": "en"
}
---

## DROP-TABLE

### Name

DROP TABLE

### Description

This statement is used to drop a table.
grammar:

```sql
DROP TABLE [IF EXISTS] [db_name.]table_name [FORCE];
```


illustrate:

- After executing DROP TABLE for a period of time, the dropped table can be recovered through the RECOVER statement. See [RECOVER](../../../../sql-manual/sql-reference/Database-Administration-Statements/RECOVER.md) statement for details
- If you execute DROP TABLE FORCE, the system will not check whether there are unfinished transactions in the table, the table will be deleted directly and cannot be recovered, this operation is generally not recommended

### Example

1. Delete a table
   
     ```sql
     DROP TABLE my_table;
     ```
    
2. If it exists, delete the table of the specified database
   
     ```sql
     DROP TABLE IF EXISTS example_db.my_table;
     ```

### Keywords

     DROP, TABLE

### Best Practice
