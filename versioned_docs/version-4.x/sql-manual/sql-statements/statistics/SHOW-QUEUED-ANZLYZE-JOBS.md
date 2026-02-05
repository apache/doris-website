---
{
    "title": "SHOW QUEUED ANALYZE JOBS",
    "language": "en",
    "description": "This statement is used to view the queue of statistics collection jobs waiting to be executed."
}
---

## Description

This statement is used to view the queue of statistics collection jobs waiting to be executed.

## Syntax

```SQL
SHOW QUEUED ANALYZE JOBS [ <table_name> ]
    [ WHERE PRIORITY = {"HIGH" | "MID" | "LOW" | "VERY_LOW"} ];
```

## Optional Parameters

**1. `<table_name>`**

> Table name. If specified, you can view the job queue information corresponding to the table. If not specified, the job queue information of all tables will be returned by default.

**2. `WHERE PRIORITY = {"HIGH" | "MID" | "LOW" | "VERY_LOW"}`**

> Filter conditions of job priority. If not specified, information about jobs of all priority will be displayed by default.

## Return Value

| Column | Note           |
| -- |--------------|
| catalog_name |   Catalog name         |
| db_name | database name           |
| tbl_name | table name         |
| col_list | column name list           |
| priority | job priority           |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | When executing SHOW, the SELECT_PRIV privilege for the queried table is required. |

## Examples

1. Show jobs by table name.

```sql
SHOW QUEUED ANALYZE JOBS REGION;
```

```text
+--------------+---------+----------+---------------------------------------------------+----------+
| catalog_name | db_name | tbl_name | col_list                                          | priority |
+--------------+---------+----------+---------------------------------------------------+----------+
| internal     | test    | region   | region:r_regionkey                                | HIGH     |
| internal     | test    | region   | region:r_name                                     | MID      |
| internal     | test    | region   | region:r_comment,region:r_name,region:r_regionkey | LOW      |
+--------------+---------+----------+---------------------------------------------------+----------+
```

2. Show job by job priority.

```sql
SHOW QUEUED ANALYZE JOBS WHERE PRIORITY="HIGH";
```

```text
+--------------+---------+----------+--------------------+----------+
| catalog_name | db_name | tbl_name | col_list           | priority |
+--------------+---------+----------+--------------------+----------+
| internal     | test    | region   | region:r_regionkey | HIGH     |
+--------------+---------+----------+--------------------+----------+
```

