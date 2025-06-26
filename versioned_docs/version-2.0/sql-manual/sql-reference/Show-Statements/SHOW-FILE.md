---
{
    "title": "SHOW-FILE",
    "language": "en"
}
---

## SHOW-FILE

### Name

SHOW FILE

### Description

This statement is used to display a file created in a database

grammar:

```sql
SHOW FILE [FROM database];
```

illustrate:

```text
FileId: file ID, globally unique
DbName: the name of the database to which it belongs
Catalog: Custom Category
FileName: file name
FileSize: file size, in bytes
MD5: MD5 of the file
```

### Example

1. View the uploaded files in the database my_database

     ```sql
     SHOW FILE FROM my_database;
     ```

### Keywords

     SHOW, FILE

### Best Practice