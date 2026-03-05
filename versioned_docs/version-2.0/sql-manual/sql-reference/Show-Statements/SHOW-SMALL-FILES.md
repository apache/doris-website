---
{
    "title": "SHOW-SMALL-FILES",
    "language": "en"
}
---

## SHOW-SMALL-FILES

### Name

SHOW FILE

### Description

This statement is used to display files created by the CREATE FILE command within a database.

```sql
SHOW FILE [FROM database];
```

Return result description:

- FileId: file ID, globally unique
- DbName: the name of the database to which it belongs
- Catalog: Custom Category
- FileName: file name
- FileSize: file size in bytes
- MD5: MD5 of the file

### Example

1. View the uploaded files in the database my_database

    ```sql
    SHOW FILE FROM my_database;
    ```

### Keywords

    SHOW, SMALL, FILES

### Best Practice

