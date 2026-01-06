---
{
    "title": "DROP DATABASE",
    "language": "en",
    "description": "This statement is used to delete a database."
}
---

## Description

This statement is used to delete a database.

## Syntax

```sql
DROP DATABASE [IF EXISTS] <db_name> [FORCE];
```

## Required parameters

** 1. `<db_name>`**
>  Database Name

## Optional parameters

** 1. `FORCE`**
>  Force deletion without going to the Recycle Bin

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| DROP_PRIV | Corresponding database | You need to have delete permission on the corresponding database |


## Precautions

If you execute DROP DATABASE FORCE, the system will not check whether there are any unfinished transactions in the database. The database will be deleted directly and cannot be restored. This operation is generally not recommended.

## Example

- Deleting a Database db_test

    ```sql
    DROP DATABASE db_test;
    ```
