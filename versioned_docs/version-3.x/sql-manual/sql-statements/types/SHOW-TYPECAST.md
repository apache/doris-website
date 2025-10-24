---
{
  "title": "SHOW TYPECAST",
  "language": "zh-CN"
}
---

## Description

View all type cast under the database. If the user specifies a database, then view the corresponding database, otherwise
directly query the database where the current session is located

## Syntax

```sql
SHOW TYPE_CAST [ { IN | FROM } <db>]
```

## Required Parameters

**1. `<db>`**

The name of the database to query.

## Return Value

| Column Name | Description     |
|-------------|-----------------|
| Origin Type | Original Type   |
| Cast Type   | Conversion Type |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege   | Object        | Notes                                                                                            |
|-------------|---------------|--------------------------------------------------------------------------------------------------|
| `Select_priv` | Database (DB) | The user or role must have `Select_priv` on the DB to view all type conversions under the database |

## Usage Notes

If a database is specified by the user, the system will query the specified database; otherwise, it will query the
database associated with the current session by default.

## Example

- View all type casts in database TESTDB

    ```sql
    SHOW TYPE_CAST IN TESTDB;
    ```
    ```text
    +----------------+----------------+
    | Origin Type    | Cast Type      |
    +----------------+----------------+
    | DATETIMEV2     | BOOLEAN        |
    | DATETIMEV2     | TINYINT        |
    | DATETIMEV2     | SMALLINT       |
    | DATETIMEV2     | INT            |
    | DATETIMEV2     | BIGINT         |
    | DATETIMEV2     | LARGEINT       |
    | DATETIMEV2     | FLOAT          |
    | DATETIMEV2     | DOUBLE         |
    | DATETIMEV2     | DATE           |
    | DATETIMEV2     | DATETIME       |
    | DATETIMEV2     | DATEV2         |
    | DATETIMEV2     | DATETIMEV2     |
    | DATETIMEV2     | DECIMALV2      |
    | DATETIMEV2     | DECIMAL32      |
    | DATETIMEV2     | DECIMAL64      |
    | DATETIMEV2     | DECIMAL128     |
    | DATETIMEV2     | DECIMAL256     |
    | DATETIMEV2     | VARCHAR        |
    | DATETIMEV2     | STRING         |
    | DECIMAL256     | DECIMAL128     |
    | DECIMAL256     | DECIMAL256     |
    | DECIMAL256     | VARCHAR        |
    | DECIMAL256     | STRING         |
    +----------------+----------------+
    ```


