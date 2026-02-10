---
{
    "title": "DROP FILE",
    "language": "en",
    "description": "This statement is used to delete an uploaded file."
}
---

## Description

This statement is used to delete an uploaded file.

## grammar:

```sql
DROP FILE "<file_name>" [ { FROM | IN } <database>] PROPERTIES ("<key>"="<value>" [ , ... ])
```

## Required Parameters

**1. `<file_name>`**

> Custom file name.

**2. `<key>`**

> File attribute key.
> - **catalog**: Required. Classification category of the file.

**3. `<value>`**

> File attribute value.

## Optional Parameters

**1. `<database>`**

> Specifies the database to which the file belongs. Uses the current session's database if not specified.

## Access Control Requirements

The user executing this SQL command must possess the following minimum privileges:

| Privilege    | Object      | Notes                                                                           |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | The user or role must hold the `ADMIN_PRIV` privilege to execute this operation |

## Example

- Delete the file ca.pem

    ```sql
    DROP FILE "ca.pem" properties("catalog" = "kafka");
    ```
- Delete file `client.key` categorized under `my_catalog`

  ```sql
  DROP FILE "client.key"
  IN my_database
  ```

- Delete file `client_1.key` categorized under `my_catalog`

  ```sql
  DROP FILE "client_1.key"
  FROM my_database
  ```
