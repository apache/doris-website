---
{
    "title": "PARTITIONS",
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

## `partitions`

### Name

partitions

### Description

The table function generates a temporary partition TABLE, which allows you to view the PARTITION list of a certain TABLE.

This function is used in the from clause.

**This function is supported since 2.1.5**

#### Syntax

`partitions("catalog"="","database"="","table"="")`

partitions() Table structure:
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

* PartitionId:partition id
* PartitionName:partition name
* VisibleVersion:visible version
* VisibleVersionTime:visible version time
* State:state
* PartitionKey:partition key
* Range:range
* DistributionKey:distribution key
* Buckets:bucket num
* ReplicationNum:replication num
* StorageMedium:storage medium
* CooldownTime:cooldown time
* RemoteStoragePolicy:remote storage policy
* LastConsistencyCheckTime:last consistency check time
* DataSize:data size
* IsInMemory:is in memory
* ReplicaAllocation:replica allocation
* IsMutable:is mutable
* SyncWithBaseTables:Is it synchronized with the base table data (for partitioning asynchronous materialized views)
* UnsyncTables:Which base table data is not synchronized with (for partitions of asynchronous materialized views)

```sql
mysql> desc function partitions("catalog"="hive","database"="zdtest","table"="com2");
+-----------+------+------+-------+---------+-------+
| Field     | Type | Null | Key   | Default | Extra |
+-----------+------+------+-------+---------+-------+
| Partition | TEXT | No   | false | NULL    | NONE  |
+-----------+------+------+-------+---------+-------+
1 row in set (0.11 sec)
```

* Partition:partition name

### Example

1. View the partition list of table1 under db1 in the internal catalog

```sql
mysql> select * from partitions("catalog"="internal","database"="db1","table"="table1");
```

2. View the partition information with partition name partition1 under table1

```sql
mysql> select * from partitions("catalog"="internal","database"="db1","table"="table1") where PartitionName = "partition1";
```

3. View the partition ID with the partition name 'partition1' under Table 1

```sql
mysql> select PartitionId from partitions("catalog"="internal","database"="db1","table"="table1") where PartitionName = "partition1";
```

### Keywords

    partitions
