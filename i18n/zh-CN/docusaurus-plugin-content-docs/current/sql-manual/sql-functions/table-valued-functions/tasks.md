---
{
    "title": "TASKS",
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

表函数，生成 tasks 临时表，可以查看当前 doris 集群中的 job 产生的 tasks 信息。

## 语法
```sql
TASKS(
    "type"="<type>"
)
```

## 必填参数 (Required Parameters)
| 字段名          | 描述                                                            |
|--------------|---------------------------------------------------------------|
| **`<type>`** | 任务的类型：<br/> `insert`：insert into 类型的任务。 <br/> `mv`：物化视图类型的任务。 |


## 返回值

- **`tasks("type"="insert")`** insert 类型的 tasks 返回值

  | 字段名       | 描述                      |
  |--------------|---------------------------|
  | **TaskId**   | task id                   |
  | **JobId**    | job id                    |
  | **JobName**  | job 名称                   |
  | **Label**    | label                     |
  | **Status**   | task 状态                  |
  | **ErrorMsg** | task 失败信息              |
  | **CreateTime**| task 创建时间             |
  | **FinishTime**| task 结束时间             |
  | **TrackingUrl**| task tracking url        |
  | **LoadStatistic**| task 统计信息           |
  | **User**     | 执行用户                   |



- **`tasks("type"="mv")`** MV 类型的 tasks 返回值

  | 字段名                | 描述                           |
  |-----------------------|--------------------------------|
  | **TaskId**            | task id                        |
  | **JobId**             | job id                         |
  | **JobName**           | job 名称                        |
  | **MvId**              | 物化视图 id                     |
  | **MvName**            | 物化视图名称                    |
  | **MvDatabaseId**      | 物化视图所属 db id              |
  | **MvDatabaseName**    | 物化视图所属 db 名称            |
  | **Status**            | task 状态                       |
  | **ErrorMsg**          | task 失败信息                   |
  | **CreateTime**        | task 创建时间                   |
  | **StartTime**         | task 开始运行时间               |
  | **FinishTime**        | task 结束运行时间               |
  | **DurationMs**        | task 运行时间                   |
  | **TaskContext**       | task 运行参数                   |
  | **RefreshMode**       | 刷新模式                        |
  | **NeedRefreshPartitions** | 本次 task 需要刷新的分区信息   |
  | **CompletedPartitions** | 本次 task 刷新完成的分区信息   |
  | **Progress**          | task 运行进度                   |


## 示例

查看所有物化视图的 tasks

```sql
select * from tasks("type"="mv");
```
```text
+-----------------+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+---------+----------+---------------------+---------------------+---------------------+------------+-------------------------------------------------------------+-------------+-----------------------------------------------+-----------------------------------------------+---------------+-----------------------------------+
| TaskId          | JobId | JobName          | MvId  | MvName                   | MvDatabaseId | MvDatabaseName                                         | Status  | ErrorMsg | CreateTime          | StartTime           | FinishTime          | DurationMs | TaskContext                                                 | RefreshMode | NeedRefreshPartitions                         | CompletedPartitions                           | Progress      | LastQueryId                       |
+-----------------+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+---------+----------+---------------------+---------------------+---------------------+------------+-------------------------------------------------------------+-------------+-----------------------------------------------+-----------------------------------------------+---------------+-----------------------------------+
| 509478985247053 | 23369 | inner_mtmv_23363 | 23363 | range_date_up_union_mv1  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | SUCCESS |          | 2025-01-08 18:19:10 | 2025-01-08 18:19:10 | 2025-01-08 18:19:10 | 233        | {"triggerMode":"SYSTEM","isComplete":false}                 | COMPLETE    | ["p_20231001_20231101"]                       | ["p_20231001_20231101"]                       | 100.00% (1/1) | 71897c47d0d94fd2-9ca52a0e6eb3bff5 |
| 509486915704885 | 23369 | inner_mtmv_23363 | 23363 | range_date_up_union_mv1  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | SUCCESS |          | 2025-01-08 18:19:17 | 2025-01-08 18:19:17 | 2025-01-08 18:19:17 | 227        | {"triggerMode":"MANUAL","partitions":[],"isComplete":false} | PARTIAL     | ["p_20231101_20231201"]                       | ["p_20231101_20231201"]                       | 100.00% (1/1) | 9bf5ff69d4cc4c78-b50505436c8410c4 |
| 509487197275880 | 23369 | inner_mtmv_23363 | 23363 | range_date_up_union_mv1  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | SUCCESS |          | 2025-01-08 18:19:18 | 2025-01-08 18:19:18 | 2025-01-08 18:19:18 | 191        | {"triggerMode":"MANUAL","partitions":[],"isComplete":false} | PARTIAL     | ["p_20231101_20231201"]                       | ["p_20231101_20231201"]                       | 100.00% (1/1) | 5b3b4525b6774b5b-89b070042cdcbcd5 |
| 509478131194211 | 23377 | inner_mtmv_23371 | 23371 | range_date_up_union_mv2  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | SUCCESS |          | 2025-01-08 18:19:10 | 2025-01-08 18:19:10 | 2025-01-08 18:19:10 | 156        | {"triggerMode":"SYSTEM","isComplete":false}                 | COMPLETE    | ["p_20231001_20231101"]                       | ["p_20231001_20231101"]                       | 100.00% (1/1) | 6d0a0782819b446e-b9da5d5de513ce00 |
| 509486057129101 | 23377 | inner_mtmv_23371 | 23371 | range_date_up_union_mv2  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | SUCCESS |          | 2025-01-08 18:19:17 | 2025-01-08 18:19:17 | 2025-01-08 18:19:18 | 213        | {"triggerMode":"MANUAL","partitions":[],"isComplete":false} | PARTIAL     | ["p_20231101_20231201"]                       | ["p_20231101_20231201"]                       | 100.00% (1/1) | f1303483e3db43e7-aa424acc32dc39ca |
| 509486143784554 | 23377 | inner_mtmv_23371 | 23371 | range_date_up_union_mv2  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | SUCCESS |          | 2025-01-08 18:19:18 | 2025-01-08 18:19:18 | 2025-01-08 18:19:18 | 151        | {"triggerMode":"MANUAL","partitions":[],"isComplete":false} | PARTIAL     | ["p_20231101_20231201"]                       | ["p_20231101_20231201"]                       | 100.00% (1/1) | 8d29b11ac41f4fe0-9d7c86372707310b |
| 488317385772600 | 21794 | inner_mtmv_21788 | 21788 | test_tablet_type_mtmv_mv | 16016        | zd                                                     | SUCCESS |          | 2025-01-08 12:26:29 | 2025-01-08 12:26:29 | 2025-01-08 12:26:29 | 1          | {"triggerMode":"MANUAL","partitions":[],"isComplete":true}  | NOT_REFRESH | []                                            | \N                                            | \N            |                                   |
| 437156301250803 | 19508 | inner_mtmv_19494 | 19494 | mv1                      | 16016        | zd                                                     | SUCCESS |          | 2025-01-07 22:13:48 | 2025-01-07 22:13:48 | 2025-01-07 22:17:45 | 236985     | {"triggerMode":"MANUAL","partitions":[],"isComplete":false} | COMPLETE    | ["p_20210101_MAXVALUE","p_20200101_20210101"] | ["p_20210101_MAXVALUE","p_20200101_20210101"] | 100.00% (2/2) | 7965b4ddce8a4480-8884e9701679c1c4 |
| 439689059641969 | 19508 | inner_mtmv_19494 | 19494 | mv1                      | 16016        | zd                                                     | SUCCESS |          | 2025-01-07 22:55:59 | 2025-01-07 22:55:59 | 2025-01-07 22:55:59 | 35         | {"triggerMode":"MANUAL","partitions":[],"isComplete":false} | NOT_REFRESH | []                                            | \N                                            | \N            |                                   |
+-----------------+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+---------+----------+---------------------+---------------------+---------------------+------------+-------------------------------------------------------------+-------------+-----------------------------------------------+-----------------------------------------------+---------------+-----------------------------------+
```

查看所有 insert 任务的 tasks
```sql
select * from tasks("type"="insert");
```
```text
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| TaskId         | JobId          | JobName        | Label                         | Status  | ErrorMsg | CreateTime          | StartTime           | FinishTime          | TrackingUrl | LoadStatistic | User |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| 79133848479750 | 78533940810334 | insert_tab_job | 78533940810334_79133848479750 | SUCCESS |          | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 |             |               | root |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
```