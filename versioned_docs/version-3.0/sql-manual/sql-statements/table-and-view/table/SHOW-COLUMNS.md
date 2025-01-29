---
{
    "title": "SHOW COLUMNS",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->



## Description

This statement is used to specify the column information of a table.

## Syntax

```sql
SHOW [<FULL>] COLUMNS FROM <tbl>;
```

## Required Parameters
**1. `<tbl>`**

The name of the table for which column information needs to be viewed must be specified.

## Optional Parameters
**1. `<FULL>`**

If the `FULL` keyword is specified, detailed information about the columns will be returned, including the aggregation type, permissions, comments, etc. of the columns.

## Return Value
| Column                              | DataType       | Note                    |
|-|-|-------------------------|
| Field | varchar  | Column Name             |
| Type | varchar  | Column Data Type        |
| Collation | varchar  | Column Collation        |
| Null | varchar  | Whether NULL is Allowed |
| Key | varchar  | Table's  Primary Key    |
| Default | varchar  | Default Value           |
| Extra | varchar  | Extra Info              |
|Privileges| varchar  | Column Privileges       |
| Comment | varchar  | Column Comment          |

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

