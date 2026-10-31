---
{
    "title": "SHOW-CREATE-DATABASE",
    "language": "en"
}
---

## SHOW-CREATE-DATABASE

### Name

SHOW CREATE DATABASE

### Description

This statement checks the creation of the doris database.

grammar:

```sql
SHOW CREATE DATABASE db_name;
```

illustrate:

- `db_name`: The name of the database where doris exists.

### Example

1. View the creation of the test database in doris

    ```sql
    mysql> SHOW CREATE DATABASE test;
    +----------+----------------------------+
    | Database | Create Database |
    +----------+----------------------------+
    | test | CREATE DATABASE `test` |
    +----------+----------------------------+
    1 row in set (0.00 sec)
    ```

### Keywords

     SHOW, CREATE, DATABASE

### Best Practice