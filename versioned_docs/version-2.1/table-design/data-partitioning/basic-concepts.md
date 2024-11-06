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


This document mainly introduces table creation and data partitioning in Doris, as well as potential problems and solutions encountered during table creation operations.

## Row & Column

In Doris, data is logically described in the form of tables.

A table consists of rows and columns:

- Row: Represents a single line of user data;

- Column: Used to describe different fields in a row of data;

- Columns can be divided into two types: Key and Value. From a business perspective, Key and Value can correspond to dimension columns and metric columns respectively. The key columns in Apache Doris are those specified in the table creation statement, which are the columns following the keywords  `unique key`, `aggregate key`, or `duplicate key`. The remaining columns are value columns. From the perspective of the aggregation model, rows with the same Key columns will be aggregated into a single row. The aggregation method for value columns is specified by the user during table creation. For more information on aggregation models, refer to the Doris [Data Model](../table-design/data-model/overview).

## Partition & Tablet

Apache Doris supports two levels of data partitioning. The first level is partition, which supports RANGE partitioning and LIST partitioning. The second level is tablet (also called bucket), which supports Hash bucket and Random bucket. If no partition is established during table creation, Apache Doris generates a default partition that is transparent to the user. When using the default partition, only bucket is supported.

In the Apache Doris storage engine, data is horizontally partitioned into several tablets. Each tablet contains several rows of data. There is no overlap between the data in different tablets, and they are stored physically independently.

Multiple tablets logically belong to different partitions. A single tablet belongs to only one partition, while a partition contains several tablets. Because tablets are stored physically independently, partitions can also be considered physically independent. The tablet is the smallest physical storage unit for operations such as data movement and replication.

Several partitions compose a table. The partition can be considered the smallest logical management unit.

The benefits of Apache Doris's two-level data partitioning are as follows:

- Columns with ordered values can be used as partitioning columns. The partition granularity can be evaluated based on import frequency and partition data volume.

- If there is a need to delete historical data (such as retaining only the data for the most recent several days), composite partition can be used to achieve this goal by deleting historical partitions. Alternatively, `DELETE` statements can be sent within specified partitions to delete data.

- Each partition can specify the number of buckets independently. For example, when data is partitioned by day and there are significant differences in data volume between days, the number of buckets for each partition can be specified to reasonably distribute data across different partitions. It is recommended to choose a column with high distinctiveness as the bucketing column.

## Example of creating a table

`CREATE TABLE` in Apache Doris is a synchronous command which returns the result once the SQL is executed. Successful returns indicate successful table creation. For more information, refer to [CREATE-TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE) or input  the `HELP CREATE TABLE` command.

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

For more information about what fields can be set in the `PROPERTIES` section of  `CREATE TABLE`, refer to [CREATE-TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md).

The default type of `ENGINE` is `OLAP`. Only OLAP is responsible for data management and storage by Apache Doris itself. Other engine types, such as MySQL, Broker and ES, are essentially just mappings to tables in other external databases or systems, allowing Apache Doris to read this data. However, Apache Doris itself does not create, manage, or store any tables or data for engine types except OLAP.

`IF NOT EXISTS`  indicates that if the table has not been created before, it will be created. Note that this only checks if the table name exists and does not check if the schema of the new table is the same as the schema of an existing table. Therefore, if there is a table with the same name but a different schema, this command will also return successfully, but it does not mean that a new table with a new schema has been created.

## View partitions

View the partiton information of a table by running the  `show create table` command.

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

Or run the  `show partitions from your_table` command.

```
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
ALTER TABLE example_range_tbl ADD  PARTITION p201704 VALUES LESS THAN("2020-05-01") DISTRIBUTED BY HASH(`user_id`) BUCKETS 5;
```

For more information about how to alter partitions, refer to [ALTER-TABLE-PARTITION](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-PARTITION.md).
