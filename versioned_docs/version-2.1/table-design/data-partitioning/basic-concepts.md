---
{
    "title": "Basic concepts",
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document mainly introduces table creation and data partitioning in Doris, as well as potential problems and solutions encountered during table creation operations.

## Row & Column

In Doris, data is logically described in the form of tables.

A table consists of rows and columns:

- Row: Represents a single line of user data;

- Column: Used to describe different fields in a row of data;

- Columns can be divided into two types: Key and Value. From a business perspective, Key and Value can correspond to dimension columns and metric columns respectively. The key columns in Apache Doris are those specified in the table creation statement, which are the columns following the keywords  `unique key`, `aggregate key`, or `duplicate key`. The remaining columns are value columns. From the perspective of the aggregation model, rows with the same Key columns will be aggregated into a single row. The aggregation method for value columns is specified by the user during table creation. For more information on aggregation models, refer to the Doris [Data Model](../../table-design/data-model/overview).

## Partition & Bucket

Doris uses a two-level partitioning and bucketing method to organize and manage data.

### Partition

Partition refers to dividing the table into smaller, more manageable, non-overlapping subsets based on specific column values in the table. Each subset of data is called a partition. Each row of data belongs to exactly one specific partition. Partitions can be seen as the smallest logical management unit.

Currently, Doris supports two types of partitioning: Range and List. If no partition is specified during table creation, Doris will generate a default partition containing all the data in the table, which is transparent to the user.

Partitioning based on data distribution and query patterns offers several benefits:

- **Improved Query Performance**: Partitioning allows the system to prune irrelevant partitions based on the query conditions, reducing the amount of data scanned and significantly improving query efficiency. This is especially beneficial when handling large datasets, as the partition strategy can greatly reduce I/O overhead.

- **Flexible Management**: Partitioning allows data to be split based on logic such as time or geography, facilitating data archiving, cleaning, and backup. For example, partitioning by time can effectively manage historical and newly added data, supporting efficient time-based data maintenance strategies.

### Bucket

Bucketing refers to further dividing the data within a partition into smaller, non-overlapping units according to some rule. Each row of data belongs to exactly one specific bucket. Unlike partitioning, which divides data based on specific column values, bucketing attempts to evenly distribute the data across predefined buckets, thereby reducing data skew. Bucketing improves query performance by ensuring even data distribution and enhancing data locality.

Currently, Doris supports two types of bucketing: Hash and Random.

A bucket corresponds to a data shard (Tablet) at the physical level, and data shards are physically stored independently. They are the smallest physical storage units for operations like data movement and replication.

Proper bucketing offers several advantages:

- **Even Data Distribution**: Bucketing evenly distributes data across buckets, reducing the risk of data concentration or skew, and preventing resource overload on specific nodes or storage devices.

- **Reduced Hotspots**: By distributing data evenly, bucketing helps to reduce the risk of overloading specific nodes or partitions, preventing hotspots, and improving system stability and processing capability.

- **Improved Concurrency Performance**: Bucketing enhances the performance of concurrent queries, especially when multiple query requests need to access different data within the same partition. The granularity of bucketing allows the system to efficiently process multiple requests in parallel, thereby improving throughput.

## Example of creating a table

`CREATE TABLE` in Apache Doris is a synchronous command which returns the result once the SQL is executed. Successful returns indicate successful table creation. For more information, refer to [CREATE-TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE) or input  the `HELP CREATE TABLE` command.

The following code sample introduces how to create tables in Apache Doris by RANGE partitioning and Hash buckets.

```sql
-- Range Partition
CREATE TABLE IF NOT EXISTS example_range_tbl
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `date` DATE NOT NULL COMMENT "Date when the data are imported",
    `timestamp` DATETIME NOT NULL COMMENT "Timestamp when the data are imported",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "User last visit time",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "Total user consumption",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Maximum user dwell time",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Minimum user dwell time"   
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

Here use Aggregate Key Model as an example. In Aggregate Key Model, all columns that are specified with an aggregation type (SUM, REPLACE, MAX, or MIN) are Value columns. The rest are the Key columns.

For more information about what fields can be set in the `PROPERTIES` section of  `CREATE TABLE`, refer to [CREATE-TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md).

The default type of `ENGINE` is `OLAP`. Only OLAP is responsible for data management and storage by Apache Doris itself. Other engine types, such as MySQL, Broker and ES, are essentially just mappings to tables in other external databases or systems, allowing Apache Doris to read this data. However, Apache Doris itself does not create, manage, or store any tables or data for engine types except OLAP.

`IF NOT EXISTS`  indicates that if the table has not been created before, it will be created. Note that this only checks if the table name exists and does not check if the schema of the new table is the same as the schema of an existing table. Therefore, if there is a table with the same name but a different schema, this command will also return successfully, but it does not mean that a new table with a new schema has been created.

### Advanced Features and Examples 

Doris supports advanced data partitioning methods, including Dynamic Partition, Auto Partition, and Auto Bucket, which enable more flexible data management. The following are examples of implementations:

<Tabs>
<TabItem value="Auto Partition" label="Auto Partition" default>
<p>

[Auto Partition](./auto-partitioning) supports automatic creation of corresponding partitions according to user-defined rules during data import, which is more convenient. Rewrite the above example with Auto Range Partition as follows:

```sql
CREATE TABLE IF NOT EXISTS example_range_tbl
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `date` DATE NOT NULL COMMENT "Date when the data are imported",
    `timestamp` DATETIME NOT NULL COMMENT "Timestamp when the data are imported",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "User last visit time",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "Total user consumption",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Maximum user dwell time",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Minimum user dwell time"   
)
ENGINE=OLAP
AGGREGATE KEY(`user_id`, `date`, `timestamp`, `city`, `age`, `sex`)
AUTO PARTITION BY RANGE(date_trunc(`date`, 'month')) --- Using months as partition granularity
()
DISTRIBUTED BY HASH(`user_id`) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

As above, when the data is imported, Doris will automatically create the corresponding partitions as `date` with a granularity of month level. `2018-12-01` and `2018-12-31` will fall into the same partition, while `2018-11-12` will fall into the leading partition. Auto Partition also supports List partition, please check Auto Partition's documentation for more usage.

</p>
</TabItem>

<TabItem value="Dynamic Partition" label="Dynamic Partition">
<p>

[Dynamic Partition](./dynamic-partitioning) is an automatic partition creation and recovery management method based on the real time, rewrite the above example with dynamic partitioning as follows:

```sql
CREATE TABLE IF NOT EXISTS example_range_tbl
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `date` DATE NOT NULL COMMENT "Date when the data are imported",
    `timestamp` DATETIME NOT NULL COMMENT "Timestamp when the data are imported",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "User last visit time",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "Total user consumption",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Maximum user dwell time",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Minimum user dwell time"   
)
ENGINE=OLAP
AGGREGATE KEY(`user_id`, `date`, `timestamp`, `city`, `age`, `sex`)
PARTITION BY RANGE(`date`)
()
DISTRIBUTED BY HASH(`user_id`) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "WEEK", --- Partition granularity is week
    "dynamic_partition.start" = "-2", --- Retain two weeks forward
    "dynamic_partition.end" = "2", --- Two weeks after creation in advance
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8"
);
```

Dynamic partition supports tiered storage, customised copy number and other features, see the dynamic partition documentation for details.

</p>
</TabItem>

<TabItem value="Auto&Dynamic Partition" label="Auto&Dynamic Partition">
<p>

:::tip
Supported since Doris 2.1.7
:::

Auto Partition and Dynamic Partition each have their own advantages, and combining the two enables flexible on-demand partition creation and automatic reclamation:

```sql
CREATE TABLE IF NOT EXISTS example_range_tbl
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `date` DATE NOT NULL COMMENT "Date when the data are imported",
    `timestamp` DATETIME NOT NULL COMMENT "Timestamp when the data are imported",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "User last visit time",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "Total user consumption",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Maximum user dwell time",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Minimum user dwell time"   
)
ENGINE=OLAP
AGGREGATE KEY(`user_id`, `date`, `timestamp`, `city`, `age`, `sex`)
AUTO PARTITION BY RANGE(date_trunc(`date`, 'month')) --- Using months as partition granularity
()
DISTRIBUTED BY HASH(`user_id`) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "month", --- Both must have the same granularity
    "dynamic_partition.start" = "-2", --- Dynamic Partition automatically cleans up partitions that are more than two weeks old
    "dynamic_partition.end" = "0", --- Dynamic Partition does not create future partitions. it is left entirely to Auto Partition.
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8"
);
```

For detailed suggestions on this feature, see [Auto Partition Conjunct with Dynamic Partition](./auto-partitioning#conjunct-with-dynamic-partition)。

</p>
</TabItem>

<TabItem value="Auto Bucket" label="Auto Bucket">
<p>

When the user is not sure of a reasonable number of buckets, [Auto Bucket](./auto-bucket) for Doris to complete the estimation, and the user only needs to provide the estimated amount of table data:

```sql
CREATE TABLE IF NOT EXISTS example_range_tbl
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `date` DATE NOT NULL COMMENT "Date when the data are imported",
    `timestamp` DATETIME NOT NULL COMMENT "Timestamp when the data are imported",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "User last visit time",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "Total user consumption",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Maximum user dwell time",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Minimum user dwell time"   
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
DISTRIBUTED BY HASH(`user_id`) BUCKETS AUTO
PROPERTIES
(
    "replication_num" = "1",
    "estimate_partition_size" = "2G" --- User estimate of the amount of data a partition will have, defaults to 10G if not provided 
);
```

Note that this approach does not apply to cases where the amount of table data is particularly large. 

</p>
</TabItem>

</Tabs>

## View partitions

View the partiton information of a table by running the `show create table` command.

```sql
> show create table  example_range_tbl 
+-------------------+---------------------------------------------------------------------------------------------------------+                                                                                                            
| Table             | Create Table                                                                                            |                                                                                                            
+-------------------+---------------------------------------------------------------------------------------------------------+                                                                                                            
| example_range_tbl | CREATE TABLE `example_range_tbl` (                                                                      |                                                                                                            
|                   |   `user_id` largeint(40) NOT NULL COMMENT 'User ID',                                                     |                                                                                                            
|                   |   `date` date NOT NULL COMMENT 'Date when the data are imported',                                                      |                                                                                                            
|                   |   `timestamp` datetime NOT NULL COMMENT 'Timestamp when the data are imported',                                             |                                                                                                            
|                   |   `city` varchar(20) NULL COMMENT 'User location city',                                                       |                                                                                                            
|                   |   `age` smallint(6) NULL COMMENT 'User age',                                                            |                                                                                                            
|                   |   `sex` tinyint(4) NULL COMMENT 'User gender',                                                             |                                                                                                            
|                   |   `last_visit_date` datetime REPLACE NULL DEFAULT "1970-01-01 00:00:00" COMMENT 'User last visit time', |                                                                                                            
|                   |   `cost` bigint(20) SUM NULL DEFAULT "0" COMMENT 'Total user consumption',                                          |                                                                                                            
|                   |   `max_dwell_time` int(11) MAX NULL DEFAULT "0" COMMENT 'Maximum user dwell time',                             |                                                                                                            
|                   |   `min_dwell_time` int(11) MIN NULL DEFAULT "99999" COMMENT 'Minimum user dwell time'                          |                                                                                                            
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

Or run the `show partitions from your_table` command.

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

## Alter partitions

You can add a new partition by running the  `alter table add partition ` command.

```sql
ALTER TABLE example_range_tbl ADD PARTITION p201704 VALUES LESS THAN("2020-05-01") DISTRIBUTED BY HASH(`user_id`) BUCKETS 5;
```

For more information about how to alter partitions, refer to [ALTER-TABLE-PARTITION](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-PARTITION.md).

## Partition Retrieval

The `partitions` table function( supported since 2.1.5) and the `information_schema.partitions` system table( supported since 2.1.7) record partition information for the cluster. The partition information can be extracted from the corresponding table for use when automatically managing partitions:

```sql
--- Find the partition with the corresponding value in the Auto Partition table.
mysql> select * from partitions("catalog"="internal", "database"="optest", "table"="DAILY_TRADE_VALUE") where PartitionName = auto_partition_name('range', 'year', '2008-02-03');
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
|      127095 | p20080101000000 |              2 | 2024-11-14 17:29:02 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 985.000 B |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
1 row in set (0.30 sec)

mysql> select * from information_schema.partitions where TABLE_SCHEMA='optest' and TABLE_NAME='list_table1' and PARTITION_NAME=auto_partition_name('list', null);
+---------------+--------------+-------------+----------------+-------------------+----------------------------+-------------------------------+------------------+---------------------+----------------------+-------------------------+-----------------------+------------+----------------+-------------+-----------------+--------------+-----------+-------------+---------------------+---------------------+----------+-------------------+-----------+-----------------+
| TABLE_CATALOG | TABLE_SCHEMA | TABLE_NAME  | PARTITION_NAME | SUBPARTITION_NAME | PARTITION_ORDINAL_POSITION | SUBPARTITION_ORDINAL_POSITION | PARTITION_METHOD | SUBPARTITION_METHOD | PARTITION_EXPRESSION | SUBPARTITION_EXPRESSION | PARTITION_DESCRIPTION | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH | MAX_DATA_LENGTH | INDEX_LENGTH | DATA_FREE | CREATE_TIME | UPDATE_TIME         | CHECK_TIME          | CHECKSUM | PARTITION_COMMENT | NODEGROUP | TABLESPACE_NAME |
+---------------+--------------+-------------+----------------+-------------------+----------------------------+-------------------------------+------------------+---------------------+----------------------+-------------------------+-----------------------+------------+----------------+-------------+-----------------+--------------+-----------+-------------+---------------------+---------------------+----------+-------------------+-----------+-----------------+
| internal      | optest       | list_table1 | pX             | NULL              |                          0 |                             0 | LIST             | NULL                | str                  | NULL                    | (NULL)                |          1 |           1266 |        1266 |               0 |            0 |         0 |           0 | 2024-11-14 19:58:45 | 0000-00-00 00:00:00 |        0 |                   |           |                 |
+---------------+--------------+-------------+----------------+-------------------+----------------------------+-------------------------------+------------------+---------------------+----------------------+-------------------------+-----------------------+------------+----------------+-------------+-----------------+--------------+-----------+-------------+---------------------+---------------------+----------+-------------------+-----------+-----------------+
1 row in set (0.24 sec)

--- Find the partition that corresponds to the starting point
mysql> select * from information_schema.partitions where TABLE_NAME='DAILY_TRADE_VALUE' and PARTITION_DESCRIPTION like "[('2012-01-01'),%";
+---------------+--------------+-------------------+-----------------+-------------------+----------------------------+-------------------------------+------------------+---------------------+----------------------+-------------------------+----------------------------------+------------+----------------+-------------+-----------------+--------------+-----------+-------------+---------------------+---------------------+----------+-------------------+-----------+-----------------+
| TABLE_CATALOG | TABLE_SCHEMA | TABLE_NAME        | PARTITION_NAME  | SUBPARTITION_NAME | PARTITION_ORDINAL_POSITION | SUBPARTITION_ORDINAL_POSITION | PARTITION_METHOD | SUBPARTITION_METHOD | PARTITION_EXPRESSION | SUBPARTITION_EXPRESSION | PARTITION_DESCRIPTION            | TABLE_ROWS | AVG_ROW_LENGTH | DATA_LENGTH | MAX_DATA_LENGTH | INDEX_LENGTH | DATA_FREE | CREATE_TIME | UPDATE_TIME         | CHECK_TIME          | CHECKSUM | PARTITION_COMMENT | NODEGROUP | TABLESPACE_NAME |
+---------------+--------------+-------------------+-----------------+-------------------+----------------------------+-------------------------------+------------------+---------------------+----------------------+-------------------------+----------------------------------+------------+----------------+-------------+-----------------+--------------+-----------+-------------+---------------------+---------------------+----------+-------------------+-----------+-----------------+
| internal      | optest       | DAILY_TRADE_VALUE | p20120101000000 | NULL              |                          0 |                             0 | RANGE            | NULL                | TRADE_DATE           | NULL                    | [('2012-01-01'), ('2013-01-01')) |          1 |            985 |         985 |               0 |            0 |         0 |           0 | 2024-11-14 17:29:02 | 0000-00-00 00:00:00 |        0 |                   |           |                 |
+---------------+--------------+-------------------+-----------------+-------------------+----------------------------+-------------------------------+------------------+---------------------+----------------------+-------------------------+----------------------------------+------------+----------------+-------------+-----------------+--------------+-----------+-------------+---------------------+---------------------+----------+-------------------+-----------+-----------------+
1 row in set (0.65 sec)
```
