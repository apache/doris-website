---
{
    "title": "SHOW ANALYZE",
    "language": "zh-CN"
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

## 描述

该语句用来查看统计信息收集作业的状态。

## 语法

```SQL
SHOW [AUTO] ANALYZE [ <table_name> | <job_id> ]
    [ WHERE STATE = {"PENDING" | "RUNNING" | "FINISHED" | "FAILED"} ];
```

## 必选参数

**无**

## 可选参数

**1. `AUTO `**

> 展示自动作业信息。如不指定，默认显示手动作业信息。

**2. `<table_name>`**

> 表名。指定后可查看该表对应的作业信息。不指定时默认返回所有表的作业信息。

**3. `<job_id>`**

> 统计信息作业 ID，执行 `ANALYZE` 异步收集时得到。不指定 id 时此命令返回所有作业信息。

**4. `WHERE STATE = {"PENDING" | "RUNNING" | "FINISHED" | "FAILED"}`**

> 作业状态过滤条件。如不指定，默认显示所有状态的作业信息。

## 返回值

| 列名 | 说明           |
| -- |--------------|
| job_id | 收集作业的唯一ID           |
| catalog_name |   Catalog名           |
| db_name | 数据库名           |
| tbl_name | 表名         |
| col_name | 收集的列列表           |
| job_type |   作业类型           |
| analysis_type |  分析类型           |
| message | 错误信息         |
| last_exec_time_in_ms | 上次收集完成时间           |
| state |   作业状态          |
| progress | 作业进度           |
| schedule_type | 调度类型         |
| start_time | 作业开始时间          |
| end_time |   作业结束时间           |
| priority | 作业优先级           |
| enable_partition | 是否开启分区收集         |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 SHOW 时，需要拥有被查询的表的 SELECT_PRIV 权限 |

## 举例

1. 通过表名展示作业

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

2. 通过作业 ID 展示作业

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

