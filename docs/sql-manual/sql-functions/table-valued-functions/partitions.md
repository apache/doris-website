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

## Description

The table function generates a temporary partition TABLE, which allows you to view the PARTITION list of a certain TABLE.

This function is used in the from clause.

## Syntax

```sql
PARTITIONS(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## Required Parameters
**`<catalog>`**
> Specify the cluster catalog name to be queried

**`<database>`**
> Specify the cluster database name to be queried

**`<table>`**
> Specify the cluster table name to be queried

## Return Value

partitions() Table structure:
```sql
 desc function partitions("catalog"="internal","database"="test","table"="user");
```
```text
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
```

The meaning of the fields is as follows:

| Field                     | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| PartitionId               | Partition ID                                                                 |
| PartitionName             | Name of the partition                                                         |
| VisibleVersion            | Partition version                                                              |
| VisibleVersionTime        | Time when the partition version was committed                                 |
| State                     | State of the partition                                                         |
| PartitionKey              | Partition key                                                                 |
| Range                     | Range of the partition                                                         |
| DistributionKey           | Distribution key for partitioning                                             |
| Buckets                   | Number of buckets in the partition                                            |
| ReplicationNum            | Number of replicas in the partition                                           |
| StorageMedium             | Storage medium used for the partition                                         |
| CooldownTime              | Cooldown time for the partition                                               |
| RemoteStoragePolicy       | Remote storage policy for the partition                                       |
| LastConsistencyCheckTime  | Time of the last consistency check for the partition                          |
| DataSize                  | Size of the data in the partition                                             |
| IsInMemory                | Whether the partition is stored in memory                                    |
| ReplicaAllocation         | Replication strategy for the partition                                        |
| IsMutable                 | Whether the partition is mutable                                             |
| SyncWithBaseTables        | Whether the partition is synchronized with the base table (for async materialized views) |
| UnsyncTables              | Which base table is unsynchronized (for async materialized view partitions)   |
  


```sql
desc function partitions("catalog"="hive","database"="zdtest","table"="com2");
```
```text
+-----------+------+------+-------+---------+-------+
| Field     | Type | Null | Key   | Default | Extra |
+-----------+------+------+-------+---------+-------+
| Partition | TEXT | No   | false | NULL    | NONE  |
+-----------+------+------+-------+---------+-------+
```

The meaning of the fields is as follows:

| Field        | Description     |
|--------------|-----------------|
| Partition    | Partition Name  |


## Examples
- View the partition list of user_tab under test in the internal catalog
    
    ```sql
     select * from partitions("catalog"="internal","database"="test","table"="user_tab");
    ```

- View the partition information with partition name partition1 under user_tab

    ```sql
    select * from partitions("catalog"="internal","database"="test","table"="user_tab") where PartitionName = "partition1";
    ```

- View the partition ID with the partition name 'partition1' under user_tab

  ```sql
  mysql> select PartitionId from partitions("catalog"="internal","database"="test","table"="user_tab") where PartitionName = "partition1";
  ```

