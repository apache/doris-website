---
{
    "title": "SHOW ANALYZE",
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

This statement is used to view the status of the statistics collection job.

## Syntax

```SQL
SHOW [AUTO] ANALYZE [ <table_name> | <job_id> ]
    [ WHERE STATE = {"PENDING" | "RUNNING" | "FINISHED" | "FAILED"} ];
```

## Required Parameters

**None**

## Optional Parameters

**1. `AUTO`**

> Show information about automatic jobs. If not specified, information about manual jobs will be displayed by default.

**2. `<table_name>`**

> Table name. After specifying it, you can view the job information corresponding to this table. When not specified, the job information of all tables will be returned by default.

**3. `<job_id>`**

> Statistics Job ID，Obtained when performing asynchronous collection with ANALYZE. When the ID is not specified, this command returns information about all jobs.

**4. `WHERE STATE = {"PENDING" | "RUNNING" | "FINISHED" | "FAILED"}`**

> Filter conditions of job state. If not specified, information about jobs in all states will be displayed by default.

## Return Value

| Column | Note           |
| -- |--------------|
| job_id | Unique statistics job id           |
| catalog_name |   Catalog name         |
| db_name | database name           |
| tbl_name | table name         |
| col_name | column name list           |
| job_type |   job type           |
| analysis_type |  analysis type           |
| message | error message         |
| last_exec_time_in_ms | last analyze time           |
| state |   job state          |
| progress | job progress           |
| schedule_type | schedule type         |
| start_time | job start time          |
| end_time |   job end time           |
| priority | job priority           |
| enable_partition | enable partition collection flag         |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | When executing SHOW, the SELECT_PRIV privilege for the queried table is required. |

## Examples

1. Show jobs by table name.

```sql
SHOW ANALYZE test1 WHERE STATE="FINISHED";
```

```text
+---------------+--------------+---------+----------+-----------------------+----------+---------------+---------+----------------------+----------+-------------------------------------------------------+---------------+---------------------+---------------------+----------+------------------+
| job_id        | catalog_name | db_name | tbl_name | col_name              | job_type | analysis_type | message | last_exec_time_in_ms | state    | progress                                              | schedule_type | start_time          | end_time            | priority | enable_partition |
+---------------+--------------+---------+----------+-----------------------+----------+---------------+---------+----------------------+----------+-------------------------------------------------------+---------------+---------------------+---------------------+----------+------------------+
| 1737454119144 | internal     | test    | test1    | [test1:name,test1:id] | MANUAL   | FUNDAMENTALS  |         | 2025-01-21 18:10:11  | FINISHED | 2 Finished  |  0 Failed  |  0 In Progress  |  2 Total | ONCE          | 2025-01-21 18:10:10 | 2025-01-21 18:10:11 | MANUAL   | false            |
| 1738725887879 | internal     | test    | test1    | [test1:name,test1:id] | MANUAL   | FUNDAMENTALS  |         | 2025-02-05 11:26:15  | FINISHED | 2 Finished  |  0 Failed  |  0 In Progress  |  2 Total | ONCE          | 2025-02-05 11:26:15 | 2025-02-05 11:26:15 | MANUAL   | false            |
| 1738725887890 | internal     | test    | test1    | [test1:name,test1:id] | MANUAL   | FUNDAMENTALS  |         | 2025-02-05 12:17:09  | FINISHED | 2 Finished  |  0 Failed  |  0 In Progress  |  2 Total | ONCE          | 2025-02-05 12:17:08 | 2025-02-05 12:17:09 | MANUAL   | false            |
| 1738725887895 | internal     | test    | test1    | [test1:id]            | MANUAL   | FUNDAMENTALS  |         | 2025-02-05 12:17:24  | FINISHED | 1 Finished  |  0 Failed  |  0 In Progress  |  1 Total | ONCE          | 2025-02-05 12:17:23 | 2025-02-05 12:17:24 | MANUAL   | false            |
| 1738725887903 | internal     | test    | test1    | [test1:id]            | MANUAL   | FUNDAMENTALS  |         | 2025-02-05 12:17:42  | FINISHED | 1 Finished  |  0 Failed  |  0 In Progress  |  1 Total | ONCE          | 2025-02-05 12:17:41 | 2025-02-05 12:17:42 | MANUAL   | false            |
+---------------+--------------+---------+----------+-----------------------+----------+---------------+---------+----------------------+----------+-------------------------------------------------------+---------------+---------------------+---------------------+----------+------------------+
```

2. Show job by job id.

```sql
show analyze 1738725887903;
```

```text
+---------------+--------------+---------+----------+------------+----------+---------------+---------+----------------------+----------+-------------------------------------------------------+---------------+---------------------+---------------------+----------+------------------+
| job_id        | catalog_name | db_name | tbl_name | col_name   | job_type | analysis_type | message | last_exec_time_in_ms | state    | progress                                              | schedule_type | start_time          | end_time            | priority | enable_partition |
+---------------+--------------+---------+----------+------------+----------+---------------+---------+----------------------+----------+-------------------------------------------------------+---------------+---------------------+---------------------+----------+------------------+
| 1738725887903 | internal     | test    | test1    | [test1:id] | MANUAL   | FUNDAMENTALS  |         | 2025-02-05 12:17:42  | FINISHED | 1 Finished  |  0 Failed  |  0 In Progress  |  1 Total | ONCE          | 2025-02-05 12:17:41 | 2025-02-05 12:17:42 | MANUAL   | false            |
+---------------+--------------+---------+----------+------------+----------+---------------+---------+----------------------+----------+-------------------------------------------------------+---------------+---------------------+---------------------+----------+------------------+
```

