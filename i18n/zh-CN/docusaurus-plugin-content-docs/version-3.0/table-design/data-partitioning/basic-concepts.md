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

-   Column 可以分为两大类：Key 和 Value。从业务角度看，Key 和 Value 可以分别对应维度列和指标列。Doris 的 key 列是建表语句中指定的列，建表语句中的关键字'unique key'或'aggregate key'或'duplicate key'后面的列就是 key 列，除了 key 列剩下的就是 value 列。从聚合模型的角度来说，Key 列相同的行，会聚合成一行。其中 Value 列的聚合方式由用户在建表时指定。关于更多聚合模型的介绍，可以参阅 [Doris 数据模型](../table-design/data-model/overview.md)。

## 分区和分桶（Partition & Tablet）

Doris 支持两层的数据划分。第一层是分区（Partition），支持 Range 和 List 的划分方式。第二层是 Bucket（Tablet），支持 Hash 和 Random 的划分方式。建表时如果不建立分区，此时 Doris 会生成一个默认的分区，对用户是透明的。使用默认分区时，只支持 Bucket 划分。

在 Doris 的存储引擎中，用户数据被水平划分为若干个数据分片（Tablet，也称作数据分桶）。每个 Tablet 包含若干数据行。各个 Tablet 之间的数据没有交集，并且在物理上是独立存储的。

多个 Tablet 在逻辑上归属于不同的分区（Partition）。一个 Tablet 只属于一个分区。而一个分区包含若干个 Tablet。因为 Tablet 在物理上是独立存储的，所以可以视为分区在物理上也是独立。Tablet 是数据移动、复制等操作的最小物理存储单元。

若干个分区组成一个 Table。分区可以视为是逻辑上最小的管理单元。

采用两层数据划分的好处：

-   有时间维度或类似带有有序值的维度，可以以这类维度列作为分区列。分区粒度可以根据导入频次、分区数据量等进行评估。

-   历史数据删除需求：如有删除历史数据的需求（比如仅保留最近 N 天的数据）。使用复合分区，可以通过删除历史分区来达到目的。也可以通过在指定分区内发送 DELETE 语句进行数据删除。

-   解决数据倾斜问题：每个分区可以单独指定分桶数量。如按天分区，当每天的数据量差异很大时，可以通过指定分区的分桶数，合理划分不同分区的数据，分桶列建议选择区分度大的列。

## 建表举例

Doris 的建表是一个同步命令，SQL 执行完成即返回结果，命令返回成功即表示建表成功。具体建表语法可以参考[CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)，也可以通过 `HELP CREATE TABLE` 查看更多帮助。

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
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01"),
    PARTITION `p2018` VALUES [("2018-01-01"), ("2019-01-01"))
)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

这里以 AGGREGATE KEY 数据模型为例进行说明。AGGREGATE KEY 数据模型中，所有没有指定聚合方式（SUM、REPLACE、MAX、MIN）的列视为 Key 列。而其余则为 Value 列。

在建表语句的最后 PROPERTIES 中，关于 PROPERTIES 中可以设置的相关参数，可以查看[CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)中的详细介绍。

ENGINE 的类型是 OLAP，即默认的 ENGINE 类型。在 Doris 中，只有这个 ENGINE 类型是由 Doris 负责数据管理和存储的。其他 ENGINE 类型，如 MySQL、 Broker、ES 等等，本质上只是对外部其他数据库或系统中的表的映射，以保证 Doris 可以读取这些数据。而 Doris 本身并不创建、管理和存储任何非 OLAP ENGINE 类型的表和数据。

`IF NOT EXISTS`表示如果没有创建过该表，则创建。注意这里只判断表名是否存在，而不会判断新建表 Schema 是否与已存在的表 Schema 相同。所以如果存在一个同名但不同 Schema 的表，该命令也会返回成功，但并不代表已经创建了新的表和新的 Schema。。

## 查看分区信息

可以通过 show create table 来查看表的分区信息。

```Plain
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

```Plain
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

```Plain
ALTER TABLE example_range_tbl ADD  PARTITION p201704 VALUES LESS THAN("2020-05-01") DISTRIBUTED BY HASH(`user_id`) BUCKETS 5;
```

其它更多分区修改操作，参见 SQL 手册 ALTER-TABLE-PARTITION。
