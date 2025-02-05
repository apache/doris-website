---
{
    "title": "SHOW DYNAMIC PARTITION TABLES",
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

该语句用于展示当前 db 下所有的动态分区表状态

## 语法：

```sql
SHOW DYNAMIC PARTITION TABLES [ FROM <db_name> ];
```

## 可选参数
**1. `<db_name>`**

指定展示动态分区表状态的 `DB` 名称，如果不指定，则默认展示当前 `DB` 下的所有动态分区表状态。

## 返回值

 | 列名                              | 类型       | 说明                                                                                                                                                                         |
|---------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
 | TableName | varchar  | 当前 `DB` 或指定 `DB` 的表名称                                                                                                                                                      |
 | Enable | varchar  | 是否开启了表的动态分区属性                                                                                                                                                              |
 | TimeUnit | varchar  | 动态分区表的分区粒度，有 `HOUR`，`DAY`,`WEEK`,`MONTH`,`YEAR`                                                                                                                            |
 | Start | varchar  | 动态分区的起始偏移，为负数。默认值为 -2147483648，即不删除历史分区。根据 time_unit 属性的不同，以当天（星期/月）为基准，分区范围在此偏移之前的分区将会被删除。                                                                                |
 | End | varchar  | 动态分区的结束偏移，为正数。根据 time_unit 属性的不同，以当天（星期/月）为基准，提前创建对应范围的分区。                                                                                                                 |
 | Prefix | varchar  | 动态创建的分区名前缀。                                                                                                                                                                |
 | Buckets | varchar  | 动态创建的分区所对应的分桶数量。                                                                                                                                                           |
 | ReplicationNum | varchar  | 动态创建的分区所对应的副本数量，如果不填写，则默认为该表创建时指定的副本数量。                                                                                                                                    |
 | ReplicaAllocation | varchar  | 动态创建的分区所对应的副本分布策略，如果不填写，则默认为该表创建时指定的副本分布策略。                                                                                                                                |
 | StartOf | varchar  | 动态分区每个分区粒度的起始点。当 `time_unit` 为 `WEEK` 时，该字段表示每周的起始点，取值为 `MONDAY` 到 `SUNDAY`；当 `time_unit` 为 `MONTH` 时，表示每月的起始日期，取值为 `1rd` 至 `28rd`；当 `time_unit` 为 `MONTH` 时，该值默认为 `NULL`。 |
 | LastUpdateTime | varchar  | 动态分区的上一次更新时间，默认为 `NULL`。                                                                                                                                                   |
 | LastSchedulerTime | datetime | 动态分区的上一次调度时间。                                                                                                                                                              |
 | State | varchar  | 动态分区的创建状态。                                                                                                                                                                 |
 | LastCreatePartitionMsg | varchar  | 最后一次执行动态添加分区调度的错误信息。                                                                                                                                                          |
 | LastDropPartitionMsg | varchar  | 最后一次执行动态删除分区调度的错误信息。                                                                                                                                                          |
 | ReservedHistoryPeriods | varchar  | 动态分区保留的历史分区的分区区间，它表示在动态分区表中，哪些历史分区应该被保留，而不是被自动删除。                                                                                                                          |

## 权限控制
1. 如果没有指定参数 `db_name`，展示的是当前 `DB` 下的所有动态分区表状态，默认用户具备当前 DB 的`SHOW_PRIV`权限。
2. 如果指定了参数 `db_name`，展示的是指定 `DB` 下的所有动态分区表状态，用户需要具备该 `DB` 的 `SHOW_PRIV` 权限。

## 示例

 1. 查看当前数据库下的所有动态分区表状态：
    
 ```sql
SHOW DYNAMIC PARTITION TABLES;
 ```
```text
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| d3        | true   | WEEK     | -3          | 3    | p      | 1       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| d5        | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d4        | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
| d6        | true   | MONTH    | -2147483648 | 2    | p      | 8       | 3rd       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d2        | true   | DAY      | -3          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d7        | true   | MONTH    | -2147483648 | 5    | p      | 8       | 24th      | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
```

2. 查看指定数据库下的所有动态分区表状态：

```sql
SHOW DYNAMIC PARTITION TABLES FROM test;
```
```text
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| test1     | true   | WEEK     | -30          | 3    | p      | 8       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| test2     | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| test3     | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
```
