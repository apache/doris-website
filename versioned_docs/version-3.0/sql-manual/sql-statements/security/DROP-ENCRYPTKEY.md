---
{
  "title": "DROP ENCRYPTKEY",
  "language": "en"
}
---

## Description

Delete a custom key. The name of the key is exactly the same to be deleted.

## Syntax

```sql
DROP ENCRYPTKEY [IF EXISTS] <key_name>
```

## Required Parameters

**1. `<key_name>`**

> Specifies the name of the key to be deleted, which may include a database identifier.
> Example: `db1.my_key`

## Optional Parameters

**1. `[IF EXISTS]`**

> If specified, no error will be thrown when attempting to delete a non-existent key.

## Access Control Requirements

The user executing this SQL command must possess the following minimum privileges:

| Privilege    | Object      | Notes                                                                                   |
|:-------------|:------------|:----------------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | The user or role must hold the`ADMIN_PRIV` privilege to perform key deletion operations |

## Example

- Delete a key

  ```sql
  DROP ENCRYPTKEY my_key;
  ```
- Drop a key without throwing errors if it doesn't exist

  ```sql
  DROP ENCRYPTKEY IF EXISTS testdb.my_key;
  ```
