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
- Columns can be divided into two types: Key and Value. From a business perspective, Key and Value can correspond to dimension columns and metric columns, respectively. The key columns in Doris are those specified in the table creation statement, which are the columns following the keywords `unique key`, `aggregate key`, or `duplicate key`. The remaining columns are value columns. From the perspective of the aggregation model, rows with the same Key columns will be aggregated into a single row. The aggregation method for value columns is specified by the user during table creation. For more information on aggregation models, refer to the Doris [Data Model](../../table-design/data-model/overview).

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

CREATE TABLE in Doris is a synchronous command. It returns results after the SQL execution is completed. Successful returns indicate successful table creation. For more information, please refer to [CREATE TABLE](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE), or input  the `HELP CREATE TABLE;` command. 

This section introduces how to create tables in Doris by range partiton and hash buckets.

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

Here use the AGGREGATE KEY data model as an example. In the AGGREGATE KEY data model, all columns that are specified with an aggregation type (SUM, REPLACE, MAX, or MIN) are Value columns. The rest are the Key columns.

In the PROPERTIES at the end of the CREATE TABLE statement, you can find detailed information about the relevant parameters that can be set in PROPERTIES by referring to the documentation on [CREATE TABLE](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE).

The default type of ENGINE is OLAP. In Doris, only this OLAP ENGINE type is responsible for data management and storage by Doris itself. Other ENGINE types, such as mysql, broker, es, etc., are essentially just mappings to tables in other external databases or systems, allowing Doris to read this data. However, Doris itself does not create, manage, or store any tables or data for non-OLAP ENGINE types.

`IF NOT EXISTS` indicates that if the table has not been created before, it will be created. Note that this only checks if the table name exists and does not check if the schema of the new table is the same as the schema of an existing table. Therefore, if there is a table with the same name but a different schema, this command will also return successfully, but it does not mean that a new table and a new schema have been created.

## View partitions

You can use the `show create table` command to view the partition information of a table.

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

You can use `show partitions from your_table` command to view the partition information of a table.

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

You can add a new partition by using the `alter table add partition` command.

```sql
ALTER TABLE example_range_tbl ADD  PARTITION p201704 VALUES LESS THAN("2020-05-01") DISTRIBUTED BY HASH(`user_id`) BUCKETS 5;
```

For more partition modification operations, please refer to the SQL manual on [ALTER-TABLE-PARTITION](../../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-PARTITION).
