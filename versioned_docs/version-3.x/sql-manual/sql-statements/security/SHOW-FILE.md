---
{
   "title": "SHOW FILE",
   "language": "en"
}
---

## Description

This statement is used to display a file created in a database.

## Syntax

```sql
SHOW FILE { [ FROM | IN ] <database_name>}
```

## Optional Parameters

**1. `<database_name>`**

> Specifies the database to which the file belongs. Uses the current session's database if not specified.

## Return Value

| Column      | Description                     |
|:------------|:--------------------------------|
| `FileId`    | Globally unique file identifier |
| `DbName`    | Name of the owning database     |
| `Catalog`   | User-defined classification     |
| `FileName`  | Name of the file                |
| `FileSize`  | File size in bytes              |
| `IsContent` | Content existence flag          |
| `MD5`       | MD5 checksum of the file        |

## Access Control Requirements

The user executing this SQL command must possess the following minimum privileges:

| Privilege    | Object      | Notes                                                                                                       |
|:-------------|:------------|:------------------------------------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | The user or role must have access privileges to the database where the file resides to execute this command |

## Example

- View uploaded files in the current session database

   ```sql
   SHOW FILE;
   ```
   ```text
   +-------+--------+----------+--------------------------+----------+-----------+----------------------------------+
   | Id    | DbName | Catalog  | FileName                 | FileSize | IsContent | MD5                              |
   +-------+--------+----------+--------------------------+----------+-----------+----------------------------------+
   | 12006 | testdb | doris_be | doris_be_metadata_layout | 89349    | true      | 9a3f68160b4106b0e923a0aa2fc05599 |
   +-------+--------+----------+--------------------------+----------+-----------+----------------------------------+
   ```

- View uploaded files in specified database

   ```sql
   SHOW FILE FROM example_db;
   ```
   ```text
   +-------+------------+----------+--------------------------+----------+-----------+----------------------------------+
   | Id    | DbName     | Catalog  | FileName                 | FileSize | IsContent | MD5                              |
   +-------+------------+----------+--------------------------+----------+-----------+----------------------------------+
   | 12007 | example_db | doris_fe | doris_fe_metadata_layout | 569373   | true      | 10385505d3c0d03f085fea6f8d51adfa |
   | 12008 | example_db | doris_be | doris_be_metadata_layout | 89349    | true      | 9a3f68160b4106b0e923a0aa2fc05599 |
   +-------+------------+----------+--------------------------+----------+-----------+----------------------------------+
   ```