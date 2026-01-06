---
{
    "title": "SHOW COLUMN STATS",
    "language": "en",
    "description": "This statement is used to show the column statistics of a table."
}
---

## Description

This statement is used to show the column statistics of a table.

## Syntax

```SQL
SHOW COLUMN [CACHED] STATS <table_name> [ (<column_name> [, ...]) ];
```

## Required Parameters

**1. `<table_name>`**

> The name of the table for which column statistics needs to be displayed.

## Optional Parameters

**1. `CACHED`**

> Show the column statistics in FE cache. When not specified, the information persisted in the statistics table is displayed by default.

**2. `<column_name>`**

> Specify the column names that need to be displayed. The column names must exist in the table, and multiple column names are separated by commas. If not specified, the information of all columns will be displayed by default.

## Return Value

| Column | Note           |
| -- |--------------|
| column_name | column name           |
| index_name |   index name           |
| count | column row count           |
| ndv | column distinct value         |
| num_null | column null count           |
| data_size |   column total data size           |
| avg_size_byte |  column average size           |
| min | min value         |
| max | max value           |
| method |   collect method          |
| type | collect type           |
| trigger | job trigger method         |
| query_times | query times          |
| updated_time |   update time           |
| update_rows | update rows when last analyze           |
| last_analyze_row_count | table row count when last analyze         |
| last_analyze_version | table version when last analyze         |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | When executing SHOW, the SELECT_PRIV privilege for the queried table is required. |

## Examples

1. Show the statistics of all columns in table test1.

```sql
SHOW COLUMN STATS test1;
```

```text
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| column_name | index_name | count    | ndv     | num_null | data_size | avg_size_byte | min    | max    | method | type         | trigger | query_times | updated_time        | update_rows | last_analyze_row_count | last_analyze_version |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| name        | test1      | 87775.0  | 48824.0 | 0.0      | 351100.0  | 4.0           | '0001' | 'ffff' | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:08 | 0           | 100000                 | 3                    |
| id          | test1      | 100000.0 | 8965.0  | 0.0      | 351400.0  | 3.514         | 1000   | 9999   | SAMPLE | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:41 | 0           | 100000                 | 3                    |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
```

2. Show the statistics of all columns in the test1 in the current FE cache.

```sql
SHOW COLUMN CACHED STATS test1;
```

```text
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| column_name | index_name | count    | ndv     | num_null | data_size | avg_size_byte | min    | max    | method | type         | trigger | query_times | updated_time        | update_rows | last_analyze_row_count | last_analyze_version |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| name        | test1      | 87775.0  | 48824.0 | 0.0      | 351100.0  | 4.0           | '0001' | 'ffff' | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:08 | 0           | 100000                 | 3                    |
| id          | test1      | 100000.0 | 8965.0  | 0.0      | 351400.0  | 3.514         | 1000   | 9999   | SAMPLE | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:41 | 0           | 100000                 | 3                    |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
```
