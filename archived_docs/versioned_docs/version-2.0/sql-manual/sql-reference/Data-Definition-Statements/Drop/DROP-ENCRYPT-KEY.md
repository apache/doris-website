---
{
    "title": "DROP-ENCRYPT-KEY",
    "language": "en"
}
---

## DROP-ENCRYPT-KEY

### Name

DROP ENCRYPTKEY

### Description

grammar:

```sql
DROP ENCRYPTKEY key_name
```

Parameter Description:

- `key_name`: The name of the key to delete, can include the name of the database. For example: `db1.my_key`.

Delete a custom key. The name of the key is exactly the same to be deleted.

Executing this command requires the user to have `ADMIN` privileges.

### Example

1. Delete a key

    ```sql
    DROP ENCRYPTKEY my_key;
    ```

### Keywords

     DROP, ENCRYPT, KEY

### Best Practice
