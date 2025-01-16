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

## 描述

表函数，生成分区临时表，可以查看某个 TABLE 的分区列表。

该函数用于 From 子句中。

## 语法

```sql
PARTITIONS(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## 必填参数 (Required Parameters)
**`<catalog>`**
> 指定需要查询的集群 catalog 名

**`<database>`**
> 指定需要查询的集群数据库名

**`<table>`**
> 指定需要查询的集群表名


## 返回值

partitions() 表结构：
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

字段含义如下：

| 字段名                   | 描述                      |
|---------------------------|-------------------------|
| PartitionId               | 分区ID                    |
| PartitionName             | 分区名称                    |
| VisibleVersion            | 分区版本                    |
| VisibleVersionTime        | 分区版本提交时间                |
| State                     | 分区状态                    |
| PartitionKey              | 分区键                     |
| Range                     | 分区范围                    |
| DistributionKey           | 分布键                     |
| Buckets                   | 分桶数量                    |
| ReplicationNum            | 副本数                     |
| StorageMedium             | 存储介质                    |
| CooldownTime              | 冷却时间                    |
| RemoteStoragePolicy       | 远程存储策略                  |
| LastConsistencyCheckTime  | 上次一致性检查时间               |
| DataSize                  | 数据大小                    |
| IsInMemory                | 是否存在内存                  |
| ReplicaAllocation         | 分布策略                    |
| IsMutable                 | 是否可变                    |
| SyncWithBaseTables        | 是否和基表数据同步（针对异步物化视图的分区）  |
| UnsyncTables              | 和哪个基表数据不同步（针对异步物化视图的分区） |

```sql
 desc function partitions("catalog"="hive","database"="test","table"="com");
```
```text
+-----------+------+------+-------+---------+-------+
| Field     | Type | Null | Key   | Default | Extra |
+-----------+------+------+-------+---------+-------+
| Partition | TEXT | No   | false | NULL    | NONE  |
+-----------+------+------+-------+---------+-------+
```

字段含义如下：

| 字段名       | 描述     |
|--------------|--------|
| Partition    | 分区名称   |
    

## 示例

- 查看 internal CATALOG 下 test 的 user_tab 的分区列表
    
    ```sql
    select * from partitions("catalog"="internal","database"="test","table"="user_tab");
    ```

- 查看 user_tab 下的分区名称为 partition1 的分区信息

    ```sql
    select * from partitions("catalog"="internal","database"="test","table"="user_tab") where PartitionName = "partition1";
    ```

- 查看 user_tab 下的分区名称为 partition1 的分区 id

    ```sql
    select PartitionId from partitions("catalog"="internal","database"="test","table"="user_tab") where PartitionName = "partition1";
    ```