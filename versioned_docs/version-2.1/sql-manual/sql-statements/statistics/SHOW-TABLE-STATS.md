---
{
    "title": "SHOW TABLE STATS",
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

This statement is used to view the overview statistics of a table.

## Syntax

```SQL
SHOW TABLE STATS <table_name>;
```

## Required Parameters

**1. `<table_name>`**

> Table name

## Optional Parameters

**None**

## Return Value

| Column | Note           |
| -- |--------------|
| updated_rows | table updated row count           |
| query_times |   table query times           |
| row_count | table row count           |
| updated_time | table last modified time        |
| columns | analyzed column list           |
| trigger |   last analyze trigger method           |
| new_partition |  flag of new partition first loaded           |
| user_inject | flag of user inject statistics         |
| enable_auto_analyze | flag of auto analyzed enabled         |
| last_analyze_time |   last analyze time          |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | When executing SHOW, the SELECT_PRIV privilege for the queried table is required. |

## Examples

1. Show the overview statistics of table test1.

```sql
SHOW TABLE STATS test1;
```

```text
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
| updated_rows | query_times | row_count | updated_time        | columns                | trigger | new_partition | user_inject | enable_auto_analyze | last_analyze_time   |
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
| 0            | 0           | 100000    | 2025-01-17 16:46:31 | [test1:name, test1:id] | MANUAL  | false         | false       | true                | 2025-02-05 12:17:41 |
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
```
