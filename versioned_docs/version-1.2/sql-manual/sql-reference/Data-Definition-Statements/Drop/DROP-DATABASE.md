---
{
    "title": "DROP-DATABASE",
    "language": "en"
}
---

## DROP-DATABASE

### Name

DOPR DATABASE

### Description

This statement is used to delete the database (database)
grammar:    

```sql
DROP DATABASE [IF EXISTS] db_name [FORCE];
```

illustrate:

- During the execution of DROP DATABASE, the deleted database can be recovered through the RECOVER statement. See the [RECOVER](../../Database-Administration-Statements/RECOVER.md) statement for details
- If you execute DROP DATABASE FORCE, the system will not check the database for unfinished transactions, the database will be deleted directly and cannot be recovered, this operation is generally not recommended

### Example

1. Delete the database db_test
   
     ```sql
     DROP DATABASE db_test;
     ```

### Keywords

     DROP, DATABASE

### Best Practice
