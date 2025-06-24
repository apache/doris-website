---
{
    "title": "CREATE DATABASE",
    "language": "en"
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

If you want to specify the default Storage Vault for the table under db, you need to specify `<storage_vault_name>` (the `<storage_vault_name>` attribute of table has a higher priority than db):

  ```sql
  PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
  )
  ```

:::info Note

Setting db's `storage_vault_name` is supported since version 3.0.5

:::

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

- Create a new database and set the default Storage Vault:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"storage_vault_name" = "hdfs_demo_vault"
   );
   ```
