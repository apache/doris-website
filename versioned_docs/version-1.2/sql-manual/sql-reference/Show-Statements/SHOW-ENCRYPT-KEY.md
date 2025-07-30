---
{
    "title": "SHOW-ENCRYPT-KEY",
    "language": "en"
}
---

## SHOW-ENCRYPT-KEY

### Name

SHOW ENCRYPTKEYS

### Description

View all custom keys under the database. If the user specifies a database, check the corresponding database, otherwise directly query the database where the current session is located.

Requires `ADMIN` privilege on this database

grammar:

```sql
SHOW ENCRYPTKEYS [IN|FROM db] [LIKE 'key_pattern']
```

parameter

>`db`: database name to query
>`key_pattern`: parameter used to filter key names

### Example

 ```sql
    mysql> SHOW ENCRYPTKEYS;
    +-------------------+-------------------+
    | EncryptKey Name   | EncryptKey String |
    +-------------------+-------------------+
    | example_db.my_key | ABCD123456789     |
    +-------------------+-------------------+
    1 row in set (0.00 sec)

    mysql> SHOW ENCRYPTKEYS FROM example_db LIKE "%my%";
    +-------------------+-------------------+
    | EncryptKey Name   | EncryptKey String |
    +-------------------+-------------------+
    | example_db.my_key | ABCD123456789     |
    +-------------------+-------------------+
    1 row in set (0.00 sec)
 ```

### Keywords

    SHOW, ENCRYPT, KEY

### Best Practice

