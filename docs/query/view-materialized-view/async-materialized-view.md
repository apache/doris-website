---
{
    "title": "Asynchronous materialized view",
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

# Asynchronous materialized view

## Construction and maintenance of materialized views

### Create materialized views

Prepare two tables and data
```sql
use tpch;

CREATE TABLE IF NOT EXISTS orders  (
    o_orderkey       integer not null,
    o_custkey        integer not null,
    o_orderstatus    char(1) not null,
    o_totalprice     decimalv3(15,2) not null,
    o_orderdate      date not null,
    o_orderpriority  char(15) not null,
    o_clerk          char(15) not null,
    o_shippriority   integer not null,
    o_comment        varchar(79) not null
    )
    DUPLICATE KEY(o_orderkey, o_custkey)
    PARTITION BY RANGE(o_orderdate)(
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
    DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
    PROPERTIES ("replication_num" = "1");

insert into orders values
   (1, 1, 'ok', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
   (2, 2, 'ok', 109.2, '2023-10-18', 'c','d',2, 'mm'),
   (3, 3, 'ok', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey    integer not null,
    l_partkey     integer not null,
    l_suppkey     integer not null,
    l_linenumber  integer not null,
    l_quantity    decimalv3(15,2) not null,
    l_extendedprice  decimalv3(15,2) not null,
    l_discount    decimalv3(15,2) not null,
    l_tax         decimalv3(15,2) not null,
    l_returnflag  char(1) not null,
    l_linestatus  char(1) not null,
    l_shipdate    date not null,
    l_commitdate  date not null,
    l_receiptdate date not null,
    l_shipinstruct char(25) not null,
    l_shipmode     char(10) not null,
    l_comment      varchar(44) not null
    )
    DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
    PARTITION BY RANGE(l_shipdate)
    (FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
    DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
    PROPERTIES ("replication_num" = "1");

insert into lineitem values
 (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
 (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
 (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```
Create materialized views
```sql
CREATE MATERIALIZED VIEW mv1 
        BUILD DEFERRED REFRESH AUTO ON MANUAL
        partition by(l_shipdate)
        DISTRIBUTED BY RANDOM BUCKETS 2
        PROPERTIES ('replication_num' = '1') 
        AS 
        select l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) as sum_total
            from lineitem
            left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
            group by
            l_shipdate,
            o_orderdate,
            l_partkey,
            l_suppkey;
```

Specific syntax can be viewed [CREATE ASYNC MATERIALIZED VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

### View materialized view meta information

```sql
select * from mv_infos("database"="tpch") where Name="mv1";
```

The unique features of materialized views can be viewed through [mv_infos()](../../sql-manual/sql-functions/table-functions/mv_infos.md)

Properties related to table, still viewed through [SHOW TABLES](../../sql-manual/sql-statements/Show-Statements/SHOW-TABLES.md)

### Refresh materialized view

The materialized view supports different refresh strategies, such as scheduled refresh and manual refresh. It also supports different refresh granularity, such as full refresh, incremental refresh of partition granularity, etc. Here we take manually refreshing partial partitions of the materialized view as an example.

First, check the list of materialized view partitions
```sql
SHOW PARTITIONS FROM mv1;
```

Refresh partition named `p_20231017_20231018`
```sql
REFRESH MATERIALIZED VIEW mv1 partitions(p_20231017_20231018);
```

Specific syntax can be viewed [REFRESH MATERIALIZED VIEW](../../sql-manual/sql-statements/Utility-Statements/REFRESH-MATERIALIZED-VIEW.md)

### task management

Each materialized view defaults to a job responsible for refreshing data, which is used to describe the refresh strategy and other information of the materialized view. Each time a refresh is triggered, a task is generated,
Task is used to describe specific refresh information, such as the time used for refreshing, which partitions were refreshed, etc

#### View jobs in materialized views

```sql
select * from jobs("type"="mv") order by CreateTime;
```

Specific syntax can be viewed [jobs("type"="mv")](../../sql-manual/sql-functions/table-functions/jobs.md)

#### Pause materialized view job scheduled scheduling

```sql
PAUSE MATERIALIZED VIEW JOB ON mv1;
```

Can pause the scheduled scheduling of materialized views

Specific syntax can be viewed [PAUSE MATERIALIZED VIEW JOB](../../sql-manual/sql-statements/Utility-Statements/PAUSE-MATERIALIZED-VIEW.md)

#### RESUME materialized view job scheduling

```sql
RESUME MATERIALIZED VIEW JOB ON mv1;
```

Can RESUME scheduled scheduling of materialized views

Specific syntax can be viewed [RESUME MATERIALIZED VIEW JOB](../../sql-manual/sql-statements/Utility-Statements/RESUME-MATERIALIZED-VIEW.md)

#### Viewing tasks in materialized views

```sql
select * from tasks("type"="mv");
```

Specific syntax can be viewed [tasks("type"="mv")](../../sql-manual/sql-functions/table-functions/tasks.md)

#### Cancel the task of objectifying the view

```sql
CANCEL MATERIALIZED VIEW TASK realTaskId on mv1;
```

Can cancel the operation of this task

Specific syntax can be viewed [CANCEL MATERIALIZED VIEW TASK](../../sql-manual/sql-statements/Utility-Statements/CANCEL-MATERIALIZED-VIEW-TASK.md)

### Modifying materialized views

Modify the properties of materialized views
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3333");
```

Modify the name of the materialized view, the refresh method of the materialized view, and the unique properties of the materialized view can be viewed through [ALTER ASYNC MATERIALIZED VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-ASYNC-MATERIALIZED-VIEW.md)

The materialized view itself is also a Table, so Table related properties, such as the number of copies, are still modified through the syntax related to `ALTER TABLE`.

### Delete materialized view

```sql
DROP MATERIALIZED VIEW mv1;
```

The materialized view has a dedicated deletion syntax and cannot be deleted through the drop table,

Specific syntax can be viewed [DROP ASYNC MATERIALIZED VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-ASYNC-MATERIALIZED-VIEW.md)

## Partition Description
There are two ways to partition materialized views:

1. Custom Partitioning

2. Automatically Create Partitions Based on Dependent Base Table Partitions

### Custom Partitioning
When creating a materialized view without specifying partition information, the materialized view will default to creating a single partition where all data will be stored.

### Partitioning Based on Dependent Base Table
A materialized view can be created by joining multiple base tables.

A materialized view can be partitioned to follow one of the base tables (it is recommended to choose the fact table).

For example

The table creation statement for t1 is as follows:

```sql
CREATE TABLE `t1` (
  `user_id` LARGEINT NOT NULL,
  `o_date` DATE NOT NULL,
  `num` SMALLINT NOT NULL
) ENGINE=OLAP
COMMENT 'OLAP'
PARTITION BY RANGE(`o_date`)
(
PARTITION p20170101 VALUES [('2017-01-01'), ('2017-01-02')),
PARTITION p20170102 VALUES [('2017-01-02'), ('2017-01-03')),
PARTITION p20170201 VALUES [('2017-02-01'), ('2017-02-02'))
)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```

The table creation statement for t2 is as follows:

```sql
CREATE TABLE `t2` (
  `user_id` LARGEINT NOT NULL,
  `age` SMALLINT NOT NULL
) ENGINE=OLAP
PARTITION BY LIST(`age`)
(
    PARTITION `p1` VALUES IN ('1'),
    PARTITION `p2` VALUES IN ('2')
)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```

If the materialized view creation statement is as follows, then the materialized view mv1 will have the same three partitions as t1:
- [('2017-01-01'), ('2017-01-02'))
- [('2017-01-02'), ('2017-01-03'))
- [('2017-02-01'), ('2017-02-02'))

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`order_date`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'replication_num' = '1'
)
AS
SELECT t1.o_date as order_date, t1.user_id as user_id, t1.num, t2.age FROM t1 join t2 on t1.user_id=t2.user_id;
```

If the materialized view creation statement is as follows, then the materialized view mv2 will have the same three partitions as t2:
- ('1')
- ('2')

```sql
CREATE MATERIALIZED VIEW mv2
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`age`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'replication_num' = '1'
)
AS
SELECT t1.o_date as order_date, t1.user_id as user_id, t1.num, t2.age FROM t1 join t2 on t1.user_id=t2.user_id;
```
#### The base table has multiple partition columns
Currently, only Hive external tables support multiple partition columns.

Hive external tables often have multi-level partitions. For example, the first-level partition is by date, and the second-level partition is by region.

A materialized view can choose one of the partition columns from a Hive table as the partition column for the materialized view.

For example, the Hive table creation statement is as follows:
```sql
CREATE TABLE hive1 (
`k1` int)
PARTITIONED BY (
`year` int,
`region` string)
STORED AS ORC;

alter table hive1 add if not exists
partition(year=2020,region="bj")
partition(year=2020,region="sh")
partition(year=2021,region="bj")
partition(year=2021,region="sh")
partition(year=2022,region="bj")
partition(year=2022,region="sh")
```
If the materialized view creation statement is as follows, then the materialized view mv_hive will have the following three partitions:
- ('2020')
- ('2021')
- ('2022')
```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT k1,year,region FROM hive1;
```

If the materialized view creation statement is as follows, then the materialized view mv_hive2 will have the following two partitions:
- ('bj')
- ('sh')
```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT k1,year,region FROM hive1;
```

#### Only using a subset of the base table partitions.
Note: Supported from version 2.1.1

If some base tables have many partitions, but the materialized view only focuses on the recent "hot" data, this feature can be used.

If the base table creation statement is as follows:
```sql
CREATE TABLE t1 (
    `k1` INT,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2
PROPERTIES (
'replication_num' = '1'
);
```
If the creation statement of the materialized view is as follows, it means that the materialized view only focuses on the data of the most recent day. If the current time is 2024-03-28 xx: xx: xx, then the materialized view will only have one partition [("2024-03-28"), ("2024-03-29")]
```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'replication_num' = '1',
'partition_sync_limit'='1',
'partition_sync_time_unit'='DAY'
)
AS
SELECT * FROM t1;
```
If another day has passed and the current time is 2024-03-29 xx: xx: xx, t1 adds a partition [("2024-03-29"), ("2024-03-30")]. If the materialized view is refreshed at this time, after the refresh is completed, the materialized view will only have one partition [("2024-03-29"), ("2024-03-30")]

If the partition field is of string type, you can set the materialized view property 'partition_date_format', for example, '%Y-%m-%d'.

#### Partition rolling up
Note: Supported from version 2.1.3

Partition rolling up can be used when the data in each partition of the base table becomes very small after aggregation. This can reduce the number of partitions in the materialized view.

##### List partition
Note: Hive partitions correspond to Doris list partitions.

If the base table creation statement is as follows
```sql
CREATE TABLE `t1` (
  `k1` INT NOT NULL,
  `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY list(`k2`)
(
PARTITION p_20200101 VALUES IN ("2020-01-01"),
PARTITION p_20200102 VALUES IN ("2020-01-02"),
PARTITION p_20200201 VALUES IN ("2020-02-01")
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```
If the materialized view creation statement is as follows, then the materialized view will have two partitions:
- ("2020-01-01","2020-01-02")
- ("2020-02-01")
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'month'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
If the materialized view creation statement is as follows, then the materialized view will have one partition:
- ("2020-01-01","2020-01-02","2020-02-01")
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'year'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
##### Range partition
If the base table creation statement is as follows:
```sql
CREATE TABLE `t1` (
  `k1` LARGEINT NOT NULL,
  `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```
If the materialized view creation statement is as follows, then the materialized view will have two partitions:
- [("2020-01-01","2020-02-01"))
- [("2020-02-01","2020-03-01"))
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'month'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
If the materialized view creation statement is as follows, then the materialized view will have one partition:
- [("2020-01-01","2021-01-01"))
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'year'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
Note: When the partition is a string, the way it is rolled up is still being designed. The current behavior may change, it is best not to use it

## Data refreshing
### Refresh principle
The materialized view is refreshed on a per-partition basis. If the materialized view does not specify partitions, then each refresh will refresh the default partition of the materialized view, effectively refreshing all the data in the materialized view.
### Trigger mechanism
There are three trigger refresh mechanisms for materialized views:
#### Manual trigger
Users trigger the refresh of the materialized view through SQL statements. Currently, there are three strategies:
1. Not concerned with which partitions are refreshed, but requires that after the refresh is complete, the data in the materialized view is synchronized with the base table.
```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```
2. Regardless of the existing data in the materialized view, refresh all partitions of the materialized view.
```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```
3. Regardless of the existing data in the materialized view, only refresh the specified partitions.
```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1,partitionName2);
```
`partitionName` can be obtained through `show partitions from mvName`.
#### Scheduled trigger
Specify how often to refresh the data through the creation statement of the materialized view.
1. If the materialized view creation statement is as follows, and it requires a full refresh (refresh complete), then the materialized view is refreshed every 10 hours, and all partitions of the materialized view are refreshed.
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
partition by(`xxx`)
AS
select ...;
```
2. If the materialized view creation statement is as follows, and it requires an automatic full refresh (refresh auto), then the materialized view is refreshed every 10 hours, and the partitions to be refreshed are automatically calculated (starting from version 2.1.3, automatic calculation of partitions to be refreshed is supported for Hive)
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH AUTO ON SCHEDULE EVERY 10 hour
partition by(`xxx`)
AS
select ...;
```
#### Automatic trigger
Note: Supported from version 2.1.4

After changes occur in the base table data, automatically trigger the refresh of related materialized views, with the same partition range as specified for `scheduled trigger`.

If the materialized view creation statement is as follows, then when there are changes in the data of t1, the materialized view will be automatically refreshed:
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH ON COMMIT
partition by(`xxx`)
AS
select ... from t1;
```

## Problem localization
### Localization means
The commonly used commands for `olapTable` are also applicable to materialized views, such as `show partitions`, `desc table`, `show data`, etc.

The unique commands for materialized views mainly include the following:
#### Viewing materialized view metadata
[mv_infos()](../../sql-manual/sql-functions/table-functions/mv_infos)

Focus on the following fields:
- State: If the state changes to SCHEMA_CHANGE, it means the schema of the base table has changed. In this case, the materialized view cannot be used for transparent rewriting (but direct querying of the materialized view is not affected). If the next refresh task is successful, the state will be restored to NORMAL.
- SchemaChangeDetail: The reason for the SCHEMA_CHANGE.
- RefreshState: The status of the last refresh task of the materialized view. If it is FAIL, it means the execution failed, and further localization can be done through tasks().
- SyncWithBaseTables: Whether the materialized view is synchronized with the base table data. If not synchronized, further determination can be made by using show partitions to identify which partition is not synchronized.
#### Viewing tasks for the materialized view
[tasks("type"="mv")](../../sql-manual/sql-functions/table-functions/tasks.md)

Focus on the following fields:
- Status: If it is FAILED, it means the task execution failed. You can check the reason for failure through ErrorMsg. You can also search Doris logs using LastQueryId to get more detailed error information.
- ErrorMsg: The reason for the failure.
- DurationMs: The duration of the task execution.
- TaskContext: The context of the task, where you can see the trigger information for the task.
- RefreshMode: `complete` indicates that all partitions were refreshed, `PARTIAL` indicates that some partitions were refreshed, and `NOT_REFRESH` indicates that no partitions needed to be refreshed.

### Common issues
1. How does the materialized view determine which partitions need to be refreshed?

   Doris internally calculates the correspondence between the partitions of the materialized view and the base table, and records the version of the base table partitions used by the materialized view since the last successful refresh. For example, if the materialized view `mv1` is created from base tables `t1` and `t2`, and it is partitioned based on `t1`, the mapping between the partitions of `t1` and `mv1` is maintained.

   Assuming partition `p202003` of `mv1` corresponds to partitions `p20200301` and `p20200302` of `t1`, after refreshing `p202003`, Doris will record partitions `p20200301` and `p20200302`, as well as the current version of table `t2`.

   When refreshing next time, Doris will check if `p20200301`, `p20200302`, or the version of `t2` has changed. If any of them has changed, it means that `p202003` needs to be refreshed.

   Of course, if it is acceptable for the business that `t2` changes do not trigger a refresh of `mv1`, you can set this through the materialized view's property `excluded_trigger_tables`.

2. What to do if the materialized view consumes too many resources and affects other business operations?

   You can control the resources used by materialized view refresh tasks by specifying the `workload_group` property of the materialized view.

   It's important to note that if the memory is set too low and a single partition refresh requires a significant amount of memory, the task may fail. It's necessary to balance these considerations based on the business requirements.

3. Can new materialized views be created based on existing materialized views?

   Yes, it's possible. Support for this feature started from version 2.1.3. However, when refreshing data, each materialized view has its own separate refresh logic.

   For example, `mv2` is created based on `mv1`, and `mv1` is based on `t1`.

   Then when `mv2` is refreshed, it will not consider whether `mv1` is synchronized with `t1`.

4. What external tables are supported?

   All external tables supported by Doris can be used to create materialized views. However, currently only Hive supports partitioned refresh, with support for other types expected to be added gradually.

5. The materialized view appears to be consistent with the data in Hive, but in reality, it is not consistent.

   The materialized view can only guarantee that its data is consistent with the results queried through the catalog.

   The catalog has certain metadata and data caching.

   If you want the materialized view to be consistent with the data in Hive, you need to ensure that the catalog's data is consistent with Hive's data by using methods like `refresh catalog`.

6. Does the materialized view support schema changes?

   It does not support modification because the column properties of the materialized view are derived from the SQL definition of the materialized view. Explicit customization is not currently supported.

7. Can the base table used by a materialized view allow schema changes?

   Yes, it is allowed. However, after the change, the `State` of the materialized views that use the base table will change from `NORMAL` to `SCHEMA_CHANGE`. In this state, the materialized view cannot be used for transparent rewriting, but direct queries to the materialized view are not affected.

   If the next refresh task of the materialized view is successful, the `State` will change back from `SCHEMA_CHANGE` to `NORMAL`.

8. Can tables with a primary key model be used to create materialized views?

   Materialized views do not have specific requirements regarding the data model of the base table. However, the materialized view itself can only have a detailed model.

9. Can indexes be created on materialized views?

   Yes, you can create indexes on materialized views.

10. Does the table get locked when refreshing a materialized view?

    At a very small stage, the table will be locked and will not continuously occupy the table lock (almost equivalent to the lock time of importing data)

11. Is materialized views suitable for near real-time scenarios?

    Not very suitable. The minimum unit for refreshing materialized views is the partition. If the data volume is large, it will occupy more resources and not be real-time enough. Consider synchronizing materialized views or other means.

## Usage scenarios
### Query acceleration
For BI report scenarios and other acceleration scenarios, queries are usually performed by joining multiple tables and then aggregating them. Users are sensitive to the response time of queries and generally need to return multiple query results at the second level, which consumes a lot of computing resources and sometimes makes it difficult to ensure the expected response time. In this case, multi table materialized views can solve this problem.

Materialized views are effective in accelerating repetitive and regular queries. The materialized view supports both direct querying and transparent rewriting. Transparent rewriting refers to the use of a set of materialized views, and the optimizer automatically selects the optimal materialized view available to respond to queries based on the rewriting algorithm and cost model.

Use the pre computed results of materialized views to respond to queries. Greatly reduces the resources used for table connections and aggregation operations, and reduces query response time.

### Data Lake Acceleration
#### Background of demand
Many users have a need for federated data queries based on Doris. Doris's Multi Catalog feature makes this task very convenient. As long as a catalog is created, there is no need to migrate data to Doris, and external data can be queried through Doris
#### Pain points
But this can also cause some problems, as the speed of querying external data may be affected by the network and third-party services, and may be slow. For scenarios with high response speed requirements, it is difficult to meet the requirements
#### How to achieve appearance query acceleration
Asynchronous materialized views can be created based on external catalogs, but the data of the materialized view itself is stored within Doris, so querying the materialized view will be fast. Therefore, for scenarios with high response speed requirements, we can create a materialized view based on an external catalog

### Data modeling
In some scenarios, users may use fact tables and dimension tables to create a summary table, which can then be used for Ad hoc queries. This summary table can also serve as a basic indicator table for subsequent modeling.

At this point, the materialized view can be used to model the data of the base table. Afterwards, the created materialized views can be used to create higher-level materialized views (supported by 2.1.3), flexibly meeting different needs.

Different levels of materialized views can have their own refresh methods set, for example:
- The first layer's materialized view can be set to timed refresh, while the second layer is set to trigger refresh. After the first layer's materialized view refresh is completed, it will automatically trigger the refresh of the second layer's materialized view.
- The materialized views of each layer are set to be refreshed on a scheduled basis. Therefore, when the materialized views of the second layer are refreshed, it will not consider whether the materialized view data of the first layer is synchronized with the base table. Instead, the materialized view data of the first layer will be processed and synchronized to the second layer.

## The relationship between materialized views and olap
Note: Starting support in 2.1.4

The underlying layer of the materialized view is an OLAP table of a duplicate model.

In theory, all functionalities of the Duplicate model are supported, but in order to efficiently refresh data in a materialized view, some limitations are placed on the functionalities:
1. The partitioning of materialized views is automatically created and maintained based on the base table, so partitioning operations cannot be performed on materialized views
2. Due to the related job processing behind the materialized view, the command to delete or rename the table cannot be used to manipulate the materialized view. Instead, the command of the materialized view itself needs to be used
3. The column of the materialized view is derived from the query statement, so it cannot be modified, otherwise it will cause the refresh task of the materialized view to fail
4. The materialized view has some properties that are not available in the duplicate table, which need to be modified through the commands in the materialized view. Other common properties need to be modified using the alter table
5. Currently, it is not possible to create a Rollup for asynchronous materialized views, but indexes can be created
6. The commands such as `desc` and `show partitions` are also applicable to materialized views

## The use of materialized views

can be viewed [Query async materialized view](./query-async-materialized-view.md)

## Notice

- Asynchronous materialized views are only supported for use in the [Nereids optimizer](../nereids/nereids.md)
- Currently, determining the synchronization between materialized views and base tables is only supported for `OlapTable`. For other types of external tables, they are directly considered to be synchronized. For instance, if the base tables of a materialized view are all external tables, they are assumed to be synchronized. When querying `mv_infos()`, the SyncWithBaseTables flag will always return 1 (true) for these external tables. When refreshing a materialized view, it is necessary to manually refresh specific partitions or specify `complete` to refresh all partitions.
