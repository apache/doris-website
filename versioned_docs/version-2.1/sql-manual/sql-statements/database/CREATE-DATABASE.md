---
{
    "title": "CREATE DATABASE",
    "language": "en",
    "description": "This statement is used to create a new database"
}
---

## Description

This statement is used to create a new database

## Syntax

```sql
CREATE DATABASE [IF NOT EXISTS] <db_name>
    [PROPERTIES ("<key>"="<value>"[, ... ])];
```

## Required parameters

** 1. `<db_name>`**
>  Database Name

## Optional parameters

** 1. `<PROPERTIES>`**
>  Additional information about this database

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| CREATE_PRIV | Corresponding database | You need to have the create permission for the corresponding database |


## Precautions

If you want to specify the default replica distribution strategy for the table under db, you need to specify `<replication_allocation>` (the `<replication_allocation>` attribute of table has a higher priority than db):

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

## Example

- Create a new database db_test

   ```sql
   CREATE DATABASE db_test;
   ```

- Create a new database and set the default replica distribution:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"replication_allocation" = "tag.location.group_1:3"
   );
   ```
