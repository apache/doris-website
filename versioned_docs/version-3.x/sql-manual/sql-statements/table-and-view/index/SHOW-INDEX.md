---
{
    "title": "SHOW INDEX",
    "language": "en",
    "description": "This statement is used to display information about indexes in a table. Currently, only bitmap indexes are supported."
}
---

## Description

This statement is used to display information about indexes in a table. Currently, only bitmap indexes are supported.

## Syntax

```SQL
SHOW INDEX [ ES ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```

## Varaint Syntax

```SQL
SHOW KEY[ S ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```
## Required Parameters

**1. `<table_name>`**: The name of the table to which the index belongs.

## Optional Parameters

**1. `<db_name>`**: The database name, optional. If not specified, the current database is used by default.

## Return Value

| Column Name    | Type   | Description                                                                                                    |
|----------------|--------|----------------------------------------------------------------------------------------------------------------|
| Table          | string | The name of the table where the index is located.                                                              |
| Non_unique     | int    | Indicates whether the index is unique: <br> - `0`: Unique index <br> - `1`: Non-unique index                   |
| Key_name       | string | The name of the index.                                                                                          |
| Seq_in_index   | int    | The position of the column in the index. This column shows the order of the column in the index, used when multiple columns form a composite index. |
| Column_name    | string | The name of the indexed column.                                                                                 |
| Collation      | string | The sorting order of the index column: <br> - `A`: Ascending <br> - `D`: Descending.                          |
| Cardinality    | int    | The number of unique values in the index. This value is used to estimate query efficiency; the higher the value, the higher the index selectivity and query efficiency. |
| Sub_part       | int    | The prefix length used by the index. If the index column is a string type, `Sub_part` represents the length of the first few characters of the index. |
| Packed         | string | Whether the index is compressed.                                                                                 |
| Null           | string | Whether `NULL` values are allowed: <br> - `YES`: NULL values allowed <br> - `NO`: NULL values not allowed       |
| Index_type     | string | The type of index: <br> - `BTREE`: B+ tree index (default type in MySQL) <br> - `HASH`: Hash index <br> - `RTREE`: R-tree index <br> - `INVERTED`: Inverted index (e.g., full-text index) |
| Comment        | string | The comment or description of the index, typically custom remarks.                                               |
| Properties     | string | Additional properties of the index.                                                                             |


## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object    | Notes |
|:-----------|:----------|:------|
| SHOW_PRIV  | Database  |       |

## Examples

- Display indexes for a specified `table_name`

     ```SQL
      SHOW INDEX FROM example_db.table_name;
     ```

