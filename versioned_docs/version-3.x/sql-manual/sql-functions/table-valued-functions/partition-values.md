---
{
    "title": "PARTITION_VALUES",
    "language": "en",
    "description": "Table function that generates a temporary table of partition values, allowing you to view the list of partition values for a specific TABLE."
}
---

## Description

Table function that generates a temporary table of partition values, allowing you to view the list of partition values for a specific TABLE.

This function is used in the FROM clause and only supports hive tables.

## Syntax

```sql
PARTITION_VALUES(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## Required Parameters
| Field               | Description                                       |
|------------------|------------------------------------------|
| `<catalog>`  | Specifies the catalog name of the cluster to query.                     |
| `<database>` | Specifies the database name of the cluster to query.                           |
| `<table>`    | Specifies the table name of the cluster to query.                             |

## Return Value

The table to be queried has several partition fields, and the table will have several columns accordingly.

## Example

The table creation statement for `text_partitioned_columns` in the hive3 CATALOG under multi_catalog is as follows:

```sql
CREATE TABLE `text_partitioned_columns`(
  `t_timestamp` timestamp)
PARTITIONED BY (
 `t_int` int,
 `t_float` float,
 `t_string` string)
```

Data is as follows:

```text
mysql> select * from text_partitioned_columns;
+----------------------------+-------+---------+----------+
| t_timestamp                | t_int | t_float | t_string |
+----------------------------+-------+---------+----------+
| 2023-01-01 00:00:00.000000 |  NULL |     0.1 | test1    |
| 2023-01-02 00:00:00.000000 |  NULL |     0.2 | test2    |
| 2023-01-03 00:00:00.000000 |   100 |     0.3 | test3    |
+----------------------------+-------+---------+----------+
```

View the list of partition values for `text_partitioned_columns` in the hive3 CATALOG under multi_catalog:

```sql
select * from partition_values("catalog"="hive3", "database" = "multi_catalog","table" = "text_partitioned_columns");
```
```text
+-------+---------+----------+
| t_int | t_float | t_string |
+-------+---------+----------+
|   100 |     0.3 | test3    |
|  NULL |     0.2 | test2    |
|  NULL |     0.1 | test1    |
+-------+---------+----------+
```
