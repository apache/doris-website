---
{
    "title": "基本概念",
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


本文档主要介绍 Doris 的建表和数据划分，以及建表操作中可能遇到的问题和解决方法。


## Row & Column

在 Doris 中，数据都以表（Table）的形式进行逻辑上的描述。

一张表包括行（Row）和列（Column）：

-   Row：即用户的一行数据；

-   Column：用于描述一行数据中不同的字段；

-   Column 可以分为两大类：Key 和 Value。从业务角度看，Key 和 Value 可以分别对应维度列和指标列。Doris 的 key 列是建表语句中指定的列，建表语句中的关键字'unique key'或'aggregate key'或'duplicate key'后面的列就是 key 列，除了 key 列剩下的就是 value 列。从聚合模型的角度来说，Key 列相同的行，会聚合成一行。其中 Value 列的聚合方式由用户在建表时指定。关于更多聚合模型的介绍，可以参阅 [Doris 数据模型](../../table-design/data-model/overview)。

## 分区和分桶（Partition & Bucket） 

Doris 使用分区和分桶的两层划分方式来组织和管理数据。

### 分区

分区是指根据表中特定列的值进行分段，将表中的数据划分为更小，更易于管理的不相交的子集，每一个数据子集称为一个分区。每一行数据属于且只属于一个特定的分区。分区可以视为最小的逻辑管理单元。

目前 Doris 支持 Range 和 List 的分区划分方式。建表时如果不指定分区，此时 Doris 会生成一个默认的分区包含表中的所有数据，这个分区对用户是透明的。

合理地根据数据分布特征和查询模式进行分区有许多好处：

- 查询性能提升：通过分区，系统可以根据查询的条件裁剪不相关的分区，减少了数据扫描量，显著提高了查询效率。特别是在处理大规模数据集时，分区策略能大幅度降低I/O负担。

- 管理灵活性：分区使得数据可以按时间、地域等逻辑进行分割，方便数据的归档、清理和备份。例如，按时间分区可以有效地管理历史数据和新增数据，支持基于时间的高效数据维护策略。

### 分桶

分桶是指将一个分区中的数据进一步按照某种规则被划分更小的不相交的数据单元。每一行数据属于且只属于一个特定的分桶。与根据特定列值对数据进行分段的分区不同，分桶尝试将数据均匀分布在预定义的桶中，从而减少数据倾斜的问题。分桶通过确保数据分布均匀并提高数据局部性以提升查询执行的性能。

目前 Doris 支持 Hash 和 Random 的分桶划分方式。

一个分桶在物理上对应一个数据分片（Tablet），数据分片在物理上是独立存储的，它是数据移动、复制等操作的最小物理存储单元。

合理地分桶能够带来许多收益：

- 均匀数据分布：分桶可以将数据均匀地分布在各个桶中，减少了数据集中或倾斜的风险，从而避免了部分节点或存储设备的资源过载问题。

- 减少热点：通过均匀分布数据，分桶有助于减少某些特定节点或分区过度负载的现象，避免热点问题，提升系统的稳定性和处理能力。

- 提高并发性能：分桶帮助提高并发查询的性能，特别是当多个查询请求需要访问相同分区中的不同数据时，分桶的粒度使得系统能够有效地并行处理多个请求，从而提升吞吐量。

## 建表举例

Doris 的建表是一个同步命令，SQL 执行完成即返回结果，命令返回成功即表示建表成功。具体建表语法可以参考[CREATE TABLE](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE)，也可以通过 `HELP CREATE TABLE` 查看更多帮助。

这里给出了一个采用了 Range 分区 和 Hash 分桶的建表举例。

```sql
-- Range Partition
CREATE TABLE IF NOT EXISTS example_range_tbl
(
    `user_id` LARGEINT NOT NULL COMMENT "用户id",
    `date` DATE NOT NULL COMMENT "数据灌入日期时间",
    `timestamp` DATETIME NOT NULL COMMENT "数据灌入的时间戳",
    `city` VARCHAR(20) COMMENT "用户所在城市",
    `age` SMALLINT COMMENT "用户年龄",
    `sex` TINYINT COMMENT "用户性别",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "用户最后一次访问时间",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "用户总消费",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "用户最大停留时间",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "用户最小停留时间"
)
ENGINE=OLAP
AGGREGATE KEY(`user_id`, `date`, `timestamp`, `city`, `age`, `sex`)
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"),  ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

这里以 AGGREGATE KEY 数据模型为例进行说明。AGGREGATE KEY 数据模型中，所有没有指定聚合方式（SUM、REPLACE、MAX、MIN）的列视为 Key 列。而其余则为 Value 列。

在建表语句的最后 PROPERTIES 中，关于 PROPERTIES 中可以设置的相关参数，可以查看[CREATE TABLE](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE)中的详细介绍。

ENGINE 的类型是 OLAP，即默认的 ENGINE 类型。在 Doris 中，只有这个 ENGINE 类型是由 Doris 负责数据管理和存储的。其他 ENGINE 类型，如 MySQL、 Broker、ES 等等，本质上只是对外部其他数据库或系统中的表的映射，以保证 Doris 可以读取这些数据。而 Doris 本身并不创建、管理和存储任何非 OLAP ENGINE 类型的表和数据。

`IF NOT EXISTS`表示如果没有创建过该表，则创建。注意这里只判断表名是否存在，而不会判断新建表 Schema 是否与已存在的表 Schema 相同。所以如果存在一个同名但不同 Schema 的表，该命令也会返回成功，但并不代表已经创建了新的表和新的 Schema。。

## 查看分区信息

可以通过 show create table 来查看表的分区信息。

```sql
> show create table  example_range_tbl 
+-------------------+---------------------------------------------------------------------------------------------------------+                                                                                                            
| Table             | Create Table                                                                                            |                                                                                                            
+-------------------+---------------------------------------------------------------------------------------------------------+                                                                                                            
| example_range_tbl | CREATE TABLE `example_range_tbl` (                                                                      |                                                                                                            
|                   |   `user_id` largeint(40) NOT NULL COMMENT '用户id',                                                     |                                                                                                            
|                   |   `date` date NOT NULL COMMENT '数据灌入日期时间',                                                      |                                                                                                            
|                   |   `timestamp` datetime NOT NULL COMMENT '数据灌入的时间戳',                                             |                                                                                                            
|                   |   `city` varchar(20) NULL COMMENT '用户所在城市',                                                       |                                                                                                            
|                   |   `age` smallint(6) NULL COMMENT '用户年龄',                                                            |                                                                                                            
|                   |   `sex` tinyint(4) NULL COMMENT '用户性别',                                                             |                                                                                                            
|                   |   `last_visit_date` datetime REPLACE NULL DEFAULT "1970-01-01 00:00:00" COMMENT '用户最后一次访问时间', |                                                                                                            
|                   |   `cost` bigint(20) SUM NULL DEFAULT "0" COMMENT '用户总消费',                                          |                                                                                                            
|                   |   `max_dwell_time` int(11) MAX NULL DEFAULT "0" COMMENT '用户最大停留时间',                             |                                                                                                            
|                   |   `min_dwell_time` int(11) MIN NULL DEFAULT "99999" COMMENT '用户最小停留时间'                          |                                                                                                            
|                   | ) ENGINE=OLAP                                                                                           |                                                                                                            
|                   | AGGREGATE KEY(`user_id`, `date`, `timestamp`, `city`, `age`, `sex`)                                     |                                                                                                            
|                   | COMMENT 'OLAP'                                                                                          |                                                                                                            
|                   | PARTITION BY RANGE(`date`)                                                                              |                                                                                                            
|                   | (PARTITION p201701 VALUES [('0000-01-01'), ('2017-02-01')),                                             |                                                                                                            
|                   | PARTITION p201702 VALUES [('2017-02-01'), ('2017-03-01')),                                              |                                                                                                            
|                   | PARTITION p201703 VALUES [('2017-03-01'), ('2017-04-01')))                                              |                                                                                                            
|                   | DISTRIBUTED BY HASH(`user_id`) BUCKETS 16                                                               |                                                                                                            
|                   | PROPERTIES (                                                                                            |                                                                                                            
|                   | "replication_allocation" = "tag.location.default: 1",                                                   |                                                                                                            
|                   | "is_being_synced" = "false",                                                                            |                                                                                                            
|                   | "storage_format" = "V2",                                                                                |                                                                                                            
|                   | "light_schema_change" = "true",                                                                         |                                                                                                            
|                   | "disable_auto_compaction" = "false",                                                                    |                                                                                                            
|                   | "enable_single_replica_compaction" = "false"                                                            |                                                                                                            
|                   | );                                                                                                      |                                                                                                            
+-------------------+---------------------------------------------------------------------------------------------------------+   
```

可以通过 show partitions from your_table 来查看表的分区信息。

```sql
> show partitions from example_range_tbl
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------
+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+                                                                                                     
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium 
| CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |                                                                                                     
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------
+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+                                                                                                     
| 28731       | p201701       | 1              | 2024-01-25 10:50:51 | NORMAL | date         | [types: [DATEV2]; keys: [0000-01-01]; ..types: [DATEV2]; keys: [2017-02-01]; ) | user_id         | 16      | 1              | HDD           
| 9999-12-31 23:59:59 |                     |                    | 0.000    | false      | tag.location.default: 1 | true      |                                                                                                     
| 28732       | p201702       | 1              | 2024-01-25 10:50:51 | NORMAL | date         | [types: [DATEV2]; keys: [2017-02-01]; ..types: [DATEV2]; keys: [2017-03-01]; ) | user_id         | 16      | 1              | HDD           
| 9999-12-31 23:59:59 |                     |                    | 0.000    | false      | tag.location.default: 1 | true      |                                                                                                     
| 28733       | p201703       | 1              | 2024-01-25 10:50:51 | NORMAL | date         | [types: [DATEV2]; keys: [2017-03-01]; ..types: [DATEV2]; keys: [2017-04-01]; ) | user_id         | 16      | 1              | HDD           
| 9999-12-31 23:59:59 |                     |                    | 0.000    | false      | tag.location.default: 1 | true      |                                                                                                     
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------
+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+                  
```

## 修改分区信息

通过 alter table add partition 来增加新的分区

```sql
ALTER TABLE example_range_tbl ADD  PARTITION p201704 VALUES LESS THAN("2020-05-01") DISTRIBUTED BY HASH(`user_id`) BUCKETS 5;
```

其它更多分区修改操作，参见 SQL 手册 [ALTER-TABLE-PARTITION](../../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-PARTITION)。