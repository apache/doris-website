---
{
    "title": "SHOW CREATE DATABASE",
    "language": "en"
}
---

## Description

This statement checks the creation information of the doris built-in database or catalog database.

## Syntax

```sql
SHOW CREATE DATABASE [<catalog>.]<db_name>;
```

## Required parameters

** 1. `<db_name>`**
>  Database Name

## Optional parameters

** 1. `<catalog>`**
>  Indicates whether the table is internal or external

## Return Value

| Column | Description |
|:---------|:-----------|
| Database | Database Name |
| Create Database | Corresponding database creation statement |

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| SELECT_PRIV | Corresponding database | Requires read permission on the corresponding database |

## Example

- View the creation of the test database in doris

   ```sql
   SHOW CREATE DATABASE test;
   ```

   ```text
   +----------+------------------------+
   | Database | Create Database        |
   +----------+------------------------+
   | test     | CREATE DATABASE `test` |
   +----------+------------------------+
   ```

- View the creation information of the database hdfs_text in the hive catalog

   ```sql
   SHOW CREATE DATABASE hdfs_text;
   ```

   ```text
   +-----------+------------------------------------------------------------------------------------+                         
   | Database  | Create Database                                                                    |                         
   +-----------+------------------------------------------------------------------------------------+                         
   | hdfs_text | CREATE DATABASE `hdfs_text` LOCATION 'hdfs://HDFS1009138/hive/warehouse/hdfs_text' |                         
   +-----------+------------------------------------------------------------------------------------+  
   ```
