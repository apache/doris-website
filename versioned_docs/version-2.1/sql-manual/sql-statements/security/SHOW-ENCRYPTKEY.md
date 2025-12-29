---
{
    "title": "SHOW ENCRYPTKEY",
    "language": "en",
    "description": "View all custom keys under the database. If the user specifies a database, check the corresponding database,"
}
---

## Description

View all custom keys under the database. If the user specifies a database, check the corresponding database, otherwise
directly query the database where the current session is located.

## Syntax

```sql
SHOW ENCRYPTKEYS [ { IN | FROM } <db> ] [ LIKE '<key_pattern>']
```

## Optional Parameters

**1. `<db>`**

> Name of the target database.  
> Example: `db1` (in key names like `db1.my_key`).

**2. `<key_pattern>`**

> Pattern parameter for filtering key names (supports wildcard matching).

## Return Value

| Column              | Description      |
|:--------------------|:-----------------|
| `EncryptKey Name`   | Name of the key  |
| `EncryptKey String` | Value of the key |

## Access Control Requirements

The user executing this SQL command must have the following minimum privileges:

| Privilege    | Object      | Notes                                                                                |
|:-------------|:------------|:-------------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | Must hold the `ADMIN_PRIV` privilege on the target user/role to view encryption keys |

## Usage Notes

If a database is explicitly specified, the system will query encryption keys within the designated database. Otherwise,
it automatically queries keys in the current session's database.

## Example

- List all custom keys in the current session's database.

    ```sql
    SHOW ENCRYPTKEYS;
    ```
    ```text
    +-----------------+-------------------+
    | EncryptKey Name | EncryptKey String |
    +-----------------+-------------------+
    | testdb.test_key | ABCD123456789     |
    +-----------------+-------------------+
    ```
- List all custom keys in a specified database.

    ```sql
    SHOW ENCRYPTKEYS FROM example_db ;
    ```
    ```text
    +---------------------+-------------------+
    | EncryptKey Name     | EncryptKey String |
    +---------------------+-------------------+
    | example_db.my_key   | ABCD123456789     |
    | example_db.test_key | ABCD123456789     |
    +---------------------+-------------------+
    ```

- Filter keys by name pattern in a specified database.

    ```sql
    SHOW ENCRYPTKEYS FROM example_db LIKE "%my%";
    ```
    ```text
    +-------------------+-------------------+
    | EncryptKey Name   | EncryptKey String |
    +-------------------+-------------------+
    | example_db.my_key | ABCD123456789     |
    +-------------------+-------------------+
    ```