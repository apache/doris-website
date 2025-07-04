---
{
    "title": "CREATE-ENCRYPT-KEY",
    "language": "en"
}
---

## CREATE-ENCRYPT-KEY

### Name

CREATE ENCRYPTKEY

### Description

This statement creates a custom key. Executing this command requires the user to have `ADMIN` privileges.

grammar:

```sql
CREATE ENCRYPTKEY key_name AS "key_string"
```

illustrate:

`key_name`: The name of the key to be created, may contain the name of the database. For example: `db1.my_key`.

`key_string`: The string to create the key with.

If `key_name` contains the database name, then the custom key will be created in the corresponding database, otherwise this function will create the database in the current session. The name of the new key cannot be the same as the existing key in the corresponding database, otherwise the creation will fail.

### Example

1. Create a custom key

   ```sql
   CREATE ENCRYPTKEY my_key AS "ABCD123456789";
   ```

2. Use a custom key

   To use a custom key, you need to add the keyword `KEY`/`key` before the key, separated from the `key_name` space.

   ```sql
   mysql> SELECT HEX(AES_ENCRYPT("Doris is Great", KEY my_key));
   +------------------------------------------------+
   | hex(aes_encrypt('Doris is Great', key my_key)) |
   +------------------------------------------------+
   | D26DB38579D6A343350EDDC6F2AD47C6 |
   +------------------------------------------------+
   1 row in set (0.02 sec)
   
   mysql> SELECT AES_DECRYPT(UNHEX('D26DB38579D6A343350EDDC6F2AD47C6'), KEY my_key);
   +------------------------------------------------- -------------------+
   | aes_decrypt(unhex('D26DB38579D6A343350EDDC6F2AD47C6'), key my_key) |
   +------------------------------------------------- -------------------+
   | Doris is Great |
   +------------------------------------------------- -------------------+
   1 row in set (0.01 sec)
   ```

### Keywords

    CREATE, ENCRYPTKEY

### Best Practice
