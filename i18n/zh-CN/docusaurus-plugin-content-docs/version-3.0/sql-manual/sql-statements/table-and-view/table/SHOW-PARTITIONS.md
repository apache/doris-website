---
{
    "title": "SHOW PARTITIONS",
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

该语句用于展示分区信息。支持 Internal catalog 和 Hive Catalog。

对于 `Hive Catalog:`

支持返回所有分区，包括多级分区

## 语法

```sql
SHOW [ TEMPORARY ] PARTITIONS
    FROM [ <db_name>. ] <table_name>
    [ <where_clause> ]
    [ ORDER BY <order_by_key> ]
    [ LIMIT <limit_rows> ];
```

## 必选参数
**1. `<table_name>`**

需要指定查看分区信息的表名称。


## 可选参数
**1. `TEMPORARY`**

是否需要列出临时分区

**2. `<db_name>`**

需要指定查看分区信息的数据库名称。

**3. `<where_clause>`**

过滤条件，支持 `PartitionId`,`PartitionName`,`State`,`Buckets`,`ReplicationNum`,`LastConsistencyCheckTime` 等列的过滤。

需要注意的是：
1. 目前 `where`子句只支持 `=` 操作符，不支持 `>`、`<`、`>=`、`<=` 等操作符。
2. `where`子句使用 `=` 操作符时，列名需要在左侧。


**4. `<order_by_key>`**

排序条件，支持 `PartitionId`,`PartitionName`,`State`,`Buckets`,`ReplicationNum`,`LastConsistencyCheckTime` 等列的排序。

**5. `<limit_rows>`**

返回的最大行数。

## 返回值
| 列名                              | 类型       | 说明                                                         |
|---------------------------------|----------|------------------------------------------------------------|
| PartitionId | bigint   | 分区 ID                                                      |
| PartitionName | varchar  | 分区名称                                                       |
| VisibleVersion | int      | 该分区下，最大的 tablet 的 VisibleVersion                           |
| VisibleVersionTime | datetime | 该分区下，最近一次的 VisibleVersionde 时间                             |
| State | varchar  | 分区状态                                                       |
| PartitionKey | datetime | 分区键                                                        |
| Range | datetime | 该分区的分区区间                                                   |
| DistributionKey | varchar  | 该分区的分布键                                                    |
| Buckets | int      | 该分区的分桶数                                                    |
| ReplicationNum | int      | 该分区的副本书                                                    |
| StorageMedium | varchar  | 该分区的存储介质                                                   |
| CooldownTime | datetime | 该分区的降冷时间，如果没有冷热分离，该字段的值为 `[9999-12-31 23:59:59]` ，即一直为热数据。 |
| RemoteStoragePolicy | varchar  | 该分区的远端存储策略                                                 |
| LastConsistencyCheckTime | datetime | 该分区的上一次的分区一致性检查的时间                                         |
| DataSize | int      | 该分区下的数据大小                                                  |
| IsInMemory | boolean  | 是否为内存分区，默认为 `false`                                        |
| ReplicaAllocation | varchar  | 该分区的副本分布策略                                                 |
| IsMutable | boolean  | 该分区是否为可变分区，默认为 `true`                                      |
| SyncWithBaseTables | boolean  | 该分区是否和基表的数据同步保持一致                                          |
| UnsyncTables | varchar  | 该分区是否是非同步表的分区                                              |


## 权限控制
需要具备要查看的表的 `SHOW` 权限。



## 示例

1. 展示指定 db 下指定表的所有非临时分区信息

```sql
SHOW PARTITIONS FROM t_agg;
```
```text
+-------------+---------------+----------------+---------------------+--------+--------------+-------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+--------------+-------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 170307      | t_agg         | 4              | 2024-11-05 16:13:40 | NORMAL |              |       | k1              | 1       | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 806.000 B | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+--------------+-------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```
2. 展示指定 db 下指定表的所有临时分区信息

```sql
SHOW TEMPORARY PARTITIONS FROM t_temp;
```
```text
+-------------+---------------+----------------+---------------------+--------+--------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                                                    | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+--------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| 828863      | tp2020        | 1              | 2025-01-22 16:19:50 | NORMAL | create_time  | [types: [DATETIMEV2]; keys: [2020-01-01 00:00:00]; ..types: [DATETIMEV2]; keys: [2021-01-01 00:00:00]; ) | reference_no    | 1       | 1              | SSD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+--------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
```

3. 展示指定 db 下指定表的指定非临时分区的信息，并对结果进行过滤

```sql
SHOW PARTITIONS FROM t_agg WHERE PartitionName = "p2024";
```
```text
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey    | Range                                                                                                    | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 169851      | p2024         | 2              | 2024-11-05 14:14:29 | NORMAL | idp_create_time | [types: [DATETIMEV2]; keys: [2024-01-01 00:00:00]; ..types: [DATETIMEV2]; keys: [2025-01-01 00:00:00]; ) | idp_es_id       | 3       | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 27.396 KB | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

4. 展示指定 db 下指定表的最新非临时分区的信息

```sql
SHOW PARTITIONS FROM t_agg ORDER BY PartitionId DESC LIMIT 1;
```
```text
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey    | Range                                                                                                    | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| 169866      | p2025         | 1              | 2024-11-05 14:13:56 | NORMAL | idp_create_time | [types: [DATETIMEV2]; keys: [2025-01-01 00:00:00]; ..types: [DATETIMEV2]; keys: [2026-01-01 00:00:00]; ) | idp_es_id       | 3       | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
```

