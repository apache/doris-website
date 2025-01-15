---
{
    "title": "JOBS",
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

## `jobs`

### Name

jobs

### description

Table function, generating a temporary task table, which can view job information in a certain task type.

This function is used in the from clause.

This function is supported since 2.1.0.

#### syntax

`jobs("type"="")`

**parameter description**

| parameter | description | type   | required |
|:----------|:------------|:-------|:---------|
| type      | job type    | string | yes      |

the **type** supported types
- insert: insert into type job
- mv: materialized view job

##### insert job
jobs("type"="insert")Table structure:
```
mysql> desc  function jobs("type"="insert");
+-------------------+------+------+-------+---------+-------+
| Field             | Type | Null | Key   | Default | Extra |
+-------------------+------+------+-------+---------+-------+
| Id                | TEXT | No   | false | NULL    | NONE  |
| Name              | TEXT | No   | false | NULL    | NONE  |
| Definer           | TEXT | No   | false | NULL    | NONE  |
| ExecuteType       | TEXT | No   | false | NULL    | NONE  |
| RecurringStrategy | TEXT | No   | false | NULL    | NONE  |
| Status            | TEXT | No   | false | NULL    | NONE  |
| ExecuteSql        | TEXT | No   | false | NULL    | NONE  |
| CreateTime        | TEXT | No   | false | NULL    | NONE  |
| SucceedTaskCount  | TEXT | No   | false | NULL    | NONE  |
| FailedTaskCount   | TEXT | No   | false | NULL    | NONE  |
| CanceledTaskCount | TEXT | No   | false | NULL    | NONE  |
| Comment           | TEXT | No   | false | NULL    | NONE  |
+-------------------+------+------+-------+---------+-------+
12 rows in set (0.01 sec)
```
* Id: job ID.
* Name: job name.
* Definer: job definer.
* ExecuteType: Execution type
* RecurringStrategy: recurring strategy
* Status: Job status
* ExecuteSql: Execution SQL
* CreateTime: Job creation time
* SucceedTaskCount: Number of successful tasks
* FailedTaskCount: Number of failed tasks
* CanceledTaskCount: Number of canceled tasks
* Comment: job comment

##### matterialized view job

jobs("type"="mv")Table structure:
```sql
mysql> desc function jobs("type"="mv");
+-------------------+------+------+-------+---------+-------+
| Field             | Type | Null | Key   | Default | Extra |
+-------------------+------+------+-------+---------+-------+
| Id                | TEXT | No   | false | NULL    | NONE  |
| Name              | TEXT | No   | false | NULL    | NONE  |
| MvId              | TEXT | No   | false | NULL    | NONE  |
| MvName            | TEXT | No   | false | NULL    | NONE  |
| MvDatabaseId      | TEXT | No   | false | NULL    | NONE  |
| MvDatabaseName    | TEXT | No   | false | NULL    | NONE  |
| ExecuteType       | TEXT | No   | false | NULL    | NONE  |
| RecurringStrategy | TEXT | No   | false | NULL    | NONE  |
| Status            | TEXT | No   | false | NULL    | NONE  |
| CreateTime        | TEXT | No   | false | NULL    | NONE  |
+-------------------+------+------+-------+---------+-------+
10 rows in set (0.00 sec)
```

* Id: job ID.
* Name: job name.
* MvId: Materialized View ID
* MvName: Materialized View Name
* MvDatabaseId: DB ID of the materialized view
* MvDatabaseName: Name of the database to which the materialized view belongs
* ExecuteType: Execution type
* RecurringStrategy: Loop strategy
* Status: Job status
* CreateTime: Task creation time

### example

1. View jobs in all materialized views

```sql
mysql> select * from jobs("type"="mv");
```

2. View job with name `inner_mtmv_75043`

```sql
mysql> select * from jobs("type"="mv") where Name="inner_mtmv_75043";
```

3. View all insert jobs

```sql
mysql> select * from jobs("type"="insert");
```
4. View job with name `one_insert_job`

```sql
mysql> select * from jobs("type"="insert") where Name='one_insert_job';
```

### keywords

    jobs, job, insert, mv, materialized view, schedule
