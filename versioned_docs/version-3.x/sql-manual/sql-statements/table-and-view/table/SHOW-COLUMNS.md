---
{
    "title": "SHOW COLUMNS",
    "language": "en"
}
---

## Description

This statement is used to specify the column information of a table.

## Syntax

```sql
SHOW [ FULL ] COLUMNS FROM <tbl>;
```

## Required Parameters
**1. `<tbl>`**

The name of the table for which column information needs to be viewed must be specified.

## Optional Parameters
**1. `FULL`**

If the `FULL` keyword is specified, detailed information about the columns will be returned, including the aggregation type, permissions, comments, etc. of the columns.

## Return Value
| Column     | DataType | Note                    |
|------------|----------|-------------------------|
| Field      | varchar  | Column Name             |
| Type       | varchar  | Column Data Type        |
| Collation  | varchar  | Column Collation        |
| Null       | varchar  | Whether NULL is Allowed |
| Key        | varchar  | Table's  Primary Key    |
| Default    | varchar  | Default Value           |
| Extra      | varchar  | Extra Info              |
| Privileges | varchar  | Column Privileges       |
| Comment    | varchar  | Column Comment          |

## Access Control Requirements
Requires the `SHOW` privilege for the table to be viewed.

## Examples

1. View detailed column information of the specified table

```sql
SHOW FULL COLUMNS FROM t_agg;
```
```text
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| Field | Type            | Collation | Null | Key  | Default | Extra   | Privileges | Comment |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| k1    | tinyint         |           | YES  | YES  | NULL    |         |            |         |
| k2    | decimalv3(10,2) |           | YES  | YES  | 10.5    |         |            |         |
| v1    | char(10)        |           | YES  | NO   | NULL    | REPLACE |            |         |
| v2    | int             |           | YES  | NO   | NULL    | SUM     |            |         |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
```

2. View the normal column information of the specified table

```sql
SHOW COLUMNS FROM t_agg;
```
```text
+-------+-----------------+------+------+---------+---------+
| Field | Type            | Null | Key  | Default | Extra   |
+-------+-----------------+------+------+---------+---------+
| k1    | tinyint         | YES  | YES  | NULL    |         |
| k2    | decimalv3(10,2) | YES  | YES  | 10.5    |         |
| v1    | char(10)        | YES  | NO   | NULL    | REPLACE |
| v2    | int             | YES  | NO   | NULL    | SUM     |
+-------+-----------------+------+------+---------+---------+
```

