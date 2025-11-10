---
{
  "title": "CREATE ENCRYPTKEY",
  "language": "en"
}
---

## Description

This statement creates a custom key.

## Syntax

```sql
CREATE ENCRYPTKEY <key_name> AS "<key_string>"
```

## Required Parameters

**1. `<key_name>`**

> Specifies the name of the key to be created, which may include a database identifier.  
> Example: `db1.my_key`

**2. `<key_string>`**

> Defines the key material string for cryptographic operations.
>
> **Behavior Notes**:
> - When the `<key_name>` contains a database identifier, the key will be created in the specified database
> - If no database is specified in `<key_name>`, the current session's database will be used
> - Key creation will fail if duplicate key names exist in the target database

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege    | Object      | Notes                                                                                 |
|:-------------|:------------|:--------------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | Must hold the `ADMIN_PRIV` privilege on the target user or role to create custom keys |

## Example

- Create a custom key

   ```sql
   CREATE ENCRYPTKEY my_key AS "ABCD123456789";
   ```

- Create a custom key in the testdb database

   ```sql
   CREATE ENCRYPTKEY testdb.test_key AS "ABCD123456789";
   ```

- Use a custom key to encrypt data

  :::tip
  When using custom keys, you must prefix the key name with `KEY`/`key` followed by a space.
  :::

   ```sql
   SELECT HEX(AES_ENCRYPT("Doris is Great", KEY my_key));
   ```
   ```text
   +------------------------------------------------+
   | hex(aes_encrypt('Doris is Great', key my_key)) |
   +------------------------------------------------+
   | D26DB38579D6A343350EDDC6F2AD47C6               |
   +------------------------------------------------+
   ```

- Use a custom key to decrypt data

   ```sql
   SELECT AES_DECRYPT(UNHEX('D26DB38579D6A343350EDDC6F2AD47C6'), KEY my_key);
   ```
   ```text
   +------------------------------------------------- -------------------+
   | aes_decrypt(unhex('D26DB38579D6A343350EDDC6F2AD47C6'), key my_key)  |
   +------------------------------------------------- -------------------+
   | Doris is Great                                                      |
   +------------------------------------------------- -------------------+
   ```
