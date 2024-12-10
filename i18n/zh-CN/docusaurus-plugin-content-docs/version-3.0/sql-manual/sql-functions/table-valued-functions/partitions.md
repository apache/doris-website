---
{
    "title": "PARTITIONS",
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

## `partitions`

### Name

partitions

### Description

表函数，生成分区临时表，可以查看某个 TABLE 的分区列表。

该函数用于 From 子句中。

#### Syntax

`partitions("catalog"="","database"="","table"="")`

partitions()表结构：
```sql
mysql> desc function partitions("catalog"="internal","database"="zd","table"="user");
+--------------------------+---------+------+-------+---------+-------+
| Field                    | Type    | Null | Key   | Default | Extra |
+--------------------------+---------+------+-------+---------+-------+
| PartitionId              | BIGINT  | No   | false | NULL    | NONE  |
| PartitionName            | TEXT    | No   | false | NULL    | NONE  |
| VisibleVersion           | BIGINT  | No   | false | NULL    | NONE  |
| VisibleVersionTime       | TEXT    | No   | false | NULL    | NONE  |
| State                    | TEXT    | No   | false | NULL    | NONE  |
| PartitionKey             | TEXT    | No   | false | NULL    | NONE  |
| Range                    | TEXT    | No   | false | NULL    | NONE  |
| DistributionKey          | TEXT    | No   | false | NULL    | NONE  |
| Buckets                  | INT     | No   | false | NULL    | NONE  |
| ReplicationNum           | INT     | No   | false | NULL    | NONE  |
| StorageMedium            | TEXT    | No   | false | NULL    | NONE  |
| CooldownTime             | TEXT    | No   | false | NULL    | NONE  |
| RemoteStoragePolicy      | TEXT    | No   | false | NULL    | NONE  |
| LastConsistencyCheckTime | TEXT    | No   | false | NULL    | NONE  |
| DataSize                 | TEXT    | No   | false | NULL    | NONE  |
| IsInMemory               | BOOLEAN | No   | false | NULL    | NONE  |
| ReplicaAllocation        | TEXT    | No   | false | NULL    | NONE  |
| IsMutable                | BOOLEAN | No   | false | NULL    | NONE  |
| SyncWithBaseTables       | BOOLEAN | No   | false | NULL    | NONE  |
| UnsyncTables             | TEXT    | No   | false | NULL    | NONE  |
+--------------------------+---------+------+-------+---------+-------+
20 rows in set (0.02 sec)
```

* PartitionId：分区id
* PartitionName：分区名字
* VisibleVersion：分区版本
* VisibleVersionTime：分区版本提交时间
* State：分区状态
* PartitionKey：分区key
* Range：分区范围
* DistributionKey：分布key
* Buckets：分桶数量
* ReplicationNum：副本数
* StorageMedium：存储介质
* CooldownTime：cooldown时间
* RemoteStoragePolicy：远程存储策略
* LastConsistencyCheckTime：上次一致性检查时间
* DataSize：数据大小
* IsInMemory：是否存在内存
* ReplicaAllocation：分布策略
* IsMutable：是否可变
* SyncWithBaseTables：是否和基表数据同步（针对异步物化视图的分区）
* UnsyncTables：和哪个基表数据不同步（针对异步物化视图的分区）

```sql
mysql> desc function partitions("catalog"="hive","database"="zdtest","table"="com2");
+-----------+------+------+-------+---------+-------+
| Field     | Type | Null | Key   | Default | Extra |
+-----------+------+------+-------+---------+-------+
| Partition | TEXT | No   | false | NULL    | NONE  |
+-----------+------+------+-------+---------+-------+
1 row in set (0.11 sec)
```

* Partition：分区名字

### Example

1. 查看 internal CATALOG 下 db1 的 table1 的分区列表

```sql
mysql> select * from partitions("catalog"="internal","database"="db1","table"="table1");
```

2. 查看 table1 下的分区名称为 partition1 的分区信息

```sql
mysql> select * from partitions("catalog"="internal","database"="db1","table"="table1") where PartitionName = "partition1";
```

3. 查看 table1 下的分区名称为 partition1 的分区 id

```sql
mysql> select PartitionId from partitions("catalog"="internal","database"="db1","table"="table1") where PartitionName = "partition1";
```

### Keywords

    partitions
