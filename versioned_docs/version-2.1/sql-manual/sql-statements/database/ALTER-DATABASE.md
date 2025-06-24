---
{
    "title": "ALTER DATABASE",
    "language": "en"
}
---

## Description

This statement is used to set the properties of a specified db, change the db name, and set various quotas for the db.

## Syntax

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## Required parameters

** 1. `<db_name>`**
>  Specifies the identifier for the database to alter.

** 2. `<new_db_name>`**
>  Specifies the new identifier for the database

** 3. `<quota>`**
>  Database data volume quota or database replica number quota

** 4. `<PROPERTIES>`**
>  Additional information about this database

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | Corresponding database | You need to have the permission to change the corresponding database. |

## Precautions

After renaming the database, use the REVOKE and GRANT commands to modify the corresponding user permissions if necessary. The default data volume quota for a database is 1024 GB, and the default replica number quota is 1073741824.

## Example

- Set the data volume quota for the specified database

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```

- Rename the database example_db to example_db2

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```

- Set a quota for the number of copies of a specified database

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```

- Modify the default replica distribution strategy of the table under db (this operation is only effective for newly created tables and will not modify existing tables under db)

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- Cancel the default replica distribution policy of the table under db (this operation is only effective for newly created tables and will not modify existing tables under db)

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```
