---
{
    "title": "DROP STATS",
    "language": "en",
    "description": "Delete statistics information for the specified table and columns. If no column names are specified,"
}
---

## Description

Delete statistics information for the specified table and columns. If no column names are specified, the statistics information for all columns will be deleted.

## Syntax

```sql
DROP STATS <table_name> [ <column_names> ]
```

Where:

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```

## ## Required Parameters

**<table_name>**

> The identifier (name) of the table.

## Optional Parameters

**<column_names>**

> List of column identifiers (names).

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| DROP_PRIV | Table  |       |

## Examples

- Delete statistics information for all columns in table1

  ```sql
  DROP STATS table1
  ```
- Delete statistics information for col1 and col2 in table1

  ```sql
  DROP STATS table1 (col1, col2)
  ```