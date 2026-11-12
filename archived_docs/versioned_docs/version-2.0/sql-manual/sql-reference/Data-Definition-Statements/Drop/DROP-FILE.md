---
{
    "title": "DROP-FILE",
    "language": "en"
}
---

## DROP-FILE

### Name

DROP FILE

### Description

This statement is used to delete an uploaded file.

grammar:

```sql
DROP FILE "file_name" [FROM database]
[properties]
```

illustrate:

- file_name: file name.
- database: a db to which the file belongs, if not specified, the db of the current session is used.
- properties supports the following parameters:
   - `catalog`: Required. The category the file belongs to.

### Example

1. Delete the file ca.pem

     ```sql
     DROP FILE "ca.pem" properties("catalog" = "kafka");
     ```

### Keywords

     DROP, FILE

### Best Practice
