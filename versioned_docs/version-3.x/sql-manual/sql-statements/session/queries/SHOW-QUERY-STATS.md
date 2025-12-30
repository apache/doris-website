---
{
    "title": "SHOW QUERY STATS",
    "language": "en",
    "description": "This statement is used to display the database table columns hit by the historical query"
}
---

## Description

This statement is used to display the database table columns hit by the historical query

## Syntax

```sql
SHOW QUERY STATS [ { [FOR <db_name>] | [FROM <table_name>] } ] [ALL] [VERBOSE]];
```

## Optional Parameters

**1. `<db_name>`**

> If this parameter is set, the matching information of the database is displayed

**2. `<table_name>`**

> If this parameter is set, the matching status of a table is queried

**3. `ALL`**

> ALL Specifies whether to display the matching information of all indexes

**4. `VERBOSE`**

> VERBOSE displays detailed matching information

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege          | Object    | Notes              |
|:-------------------|:----------|:-------------------|
| SELECT_PRIV        | DATABASE  | You must have the SELECT permission on the queried database |

## Usage Notes

- Query the historical query matching status of databases and tables. Data is reset after fe is restarted, and statistics are collected for each fe.

- You can use FOR DATABASE and FROM TABLE to specify the matching information of the database or table to be queried, followed by the database name or table name.

- The ALL and VERBOSE parameters can be used alone or together, but they must be used last and only for table queries.

- If no databases are being used, then simply executing 'SHOW QUERY STATS' will show the hits of all databases.

- There may be two columns in the hit result: QueryCount indicates the number of times the column has been queried, and FilterCount indicates the number of times the column has been queried as the where condition.

## Examples

```sql
show query stats from baseall
```

```text
 +-------+------------+-------------+
 | Field | QueryCount | FilterCount |
 +-------+------------+-------------+
 | k0    | 0          | 0           |
 | k1    | 0          | 0           |
 | k2    | 0          | 0           |
 | k3    | 0          | 0           |
 | k4    | 0          | 0           |
 | k5    | 0          | 0           |
 | k6    | 0          | 0           |
 | k10   | 0          | 0           |
 | k11   | 0          | 0           |
 | k7    | 0          | 0           |
 | k8    | 0          | 0           |
 | k9    | 0          | 0           |
 | k12   | 0          | 0           |
 | k13   | 0          | 0           |
 +-------+------------+-------------+
```

```sql
select k0, k1,k2, sum(k3) from baseall  where k9 > 1 group by k0,k1,k2
```

```text
 +------+------+--------+-------------+
 | k0   | k1   | k2     | sum(`k3`)   |
 +------+------+--------+-------------+
 |    0 |    6 |  32767 |        3021 |
 |    1 |   12 |  32767 | -2147483647 |
 |    0 |    3 |   1989 |        1002 |
 |    0 |    7 | -32767 |        1002 |
 |    1 |    8 |    255 |  2147483647 |
 |    1 |    9 |   1991 | -2147483647 |
 |    1 |   11 |   1989 |       25699 |
 |    1 |   13 | -32767 |  2147483647 |
 |    1 |   14 |    255 |         103 |
 |    0 |    1 |   1989 |        1001 |
 |    0 |    2 |   1986 |        1001 |
 |    1 |   15 |   1992 |        3021 |
 +------+------+--------+-------------+
```

 ```sql
show query stats from baseall;
```

```text
 +-------+------------+-------------+
 | Field | QueryCount | FilterCount |
 +-------+------------+-------------+
 | k0    | 1          | 0           |
 | k1    | 1          | 0           |
 | k2    | 1          | 0           |
 | k3    | 1          | 0           |
 | k4    | 0          | 0           |
 | k5    | 0          | 0           |
 | k6    | 0          | 0           |
 | k10   | 0          | 0           |
 | k11   | 0          | 0           |
 | k7    | 0          | 0           |
 | k8    | 0          | 0           |
 | k9    | 1          | 1           |
 | k12   | 0          | 0           |
 | k13   | 0          | 0           |
 +-------+------------+-------------+
```

```sql
show query stats from baseall all
```

```text
 +-----------+------------+
 | IndexName | QueryCount |
 +-----------+------------+
 | baseall   | 1          |
 +-----------+------------+
```

```sql
show query stats from baseall all verbose
```

```text
 +-----------+-------+------------+-------------+
 | IndexName | Field | QueryCount | FilterCount |
 +-----------+-------+------------+-------------+
 | baseall   | k0    | 1          | 0           |
 |           | k1    | 1          | 0           |
 |           | k2    | 1          | 0           |
 |           | k3    | 1          | 0           |
 |           | k4    | 0          | 0           |
 |           | k5    | 0          | 0           |
 |           | k6    | 0          | 0           |
 |           | k10   | 0          | 0           |
 |           | k11   | 0          | 0           |
 |           | k7    | 0          | 0           |
 |           | k8    | 0          | 0           |
 |           | k9    | 1          | 1           |
 |           | k12   | 0          | 0           |
 |           | k13   | 0          | 0           |
 +-----------+-------+------------+-------------+
```

```sql
show query stats for test_query_db
```

```text
 +----------------------------+------------+
 | TableName                  | QueryCount |
 +----------------------------+------------+
 | compaction_tbl             | 0          |
 | bigtable                   | 0          |
 | empty                      | 0          |
 | tempbaseall                | 0          |
 | test                       | 0          |
 | test_data_type             | 0          |
 | test_string_function_field | 0          |
 | baseall                    | 1          |
 | nullable                   | 0          |
 +----------------------------+------------+
```

```sql
show query stats
```

```text
 +-----------------+------------+
 | Database        | QueryCount |
 +-----------------+------------+
 | test_query_db   | 1          |
 +-----------------+------------+
```
