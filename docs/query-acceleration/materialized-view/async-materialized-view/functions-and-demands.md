---
{
  "title": "Creating, Querying, and Maintaining Asynchronous Materialized Views",
  "language": "en-US"
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

This document provides detailed information about materialized view creation, direct querying of materialized views, query rewriting, and common maintenance operations.

## Creating Materialized Views

### Permission Requirements

- Creating Materialized Views: Requires both materialized view creation permission (same as table creation permission) and query permission for the materialized view creation statement (same as SELECT permission).

### Creation Syntax

```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
[ (<columns_definition>) ]
[ BUILD <build_mode> ]
[ REFRESH <refresh_method> [refresh_trigger]]
[ [DUPLICATE] KEY (<key_cols>) ]
[ COMMENT '<table_comment>' ]
[ PARTITION BY (
{ <partition_col>
| DATE_TRUNC(<partition_col>, <partition_unit>) }
)]
[ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
[ BUCKETS { <bucket_count> | AUTO } ]
]
[ PROPERTIES (
-- Table property
<table_property>
-- Additional table properties
[ , ... ])
]
AS <query>
```

### Refresh Configuration

#### build_mode Refresh Timing
Determines whether to refresh immediately after materialized view creation.
1. IMMEDIATE: Refresh immediately (default mode)
2. DEFERRED: Delayed refresh

#### refresh_method Refresh Method
1. COMPLETE: Refresh all partitions
2. AUTO: Attempt incremental refresh, only refreshing partitions with data changes since the last materialization. Falls back to full refresh of all partitions if data changes cannot be detected.

#### refresh_trigger Trigger Methods
1. ON MANUAL Manual Trigger

Users can trigger materialized view refreshes using SQL statements with the following strategies:

Check for base table partition data changes since last refresh and refresh only changed partitions:

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

Refresh all materialized view partitions without checking for base table changes:

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

Refresh only specified partitions:

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1,partitionName2);
```


:::tip
`partitionName` can be obtained using `SHOW PARTITIONS FROM mvName`.
Starting from version 2.1.3, Hive supports detecting base table partition changes since last refresh. Other external tables don't support this yet. Internal tables have always supported this feature.
:::

2. ON SCHEDULE Scheduled Trigger

Specify refresh intervals in the materialized view creation statement.

Example of full refresh (`REFRESH COMPLETE`) every 10 hours, refreshing all partitions:

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT FROM lineitem;
```

Example of incremental refresh (`REFRESH AUTO`) every 10 hours, 
only refreshing changed partitions or falling back to full refresh if needed 
(automatic Hive partition calculation supported from version 2.1.3):

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION by(l_shipdate)
AS
SELECT FROM lineitem;
```


3. ON COMMIT Automatic Trigger

:::tip
This feature is available from Apache Doris version 2.1.4 onwards.
:::

Automatically triggers materialized view refresh when base table data changes, with refresh partition scope matching "scheduled trigger".

Example: When partition `t1` data changes in base table `lineitem`, it automatically triggers corresponding materialized view partition refresh:

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION by(l_shipdate)
AS
SELECT FROM lineitem;
```


:::caution
Not recommended for frequently changing base tables as it creates frequent materialized refresh tasks, consuming excessive resources.
:::

For more details, see [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/Utility-Statements/REFRESH-MATERIALIZED-VIEW/)

#### Examples
Table Creation Statements

```sql
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
    (FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
    DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
(2, 4, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
(3, 2, 4, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-19', '2023-10-19', '2023-10-19', 'a', 'b', 'yyyyyyyyy');

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
FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;

INSERT INTO orders VALUES
(1, 1, 'o', 9.5, '2023-10-17', 'a', 'b', 1, 'yy'),
(1, 1, 'o', 10.5, '2023-10-18', 'a', 'b', 1, 'yy'),
(2, 1, 'o', 11.5, '2023-10-19', 'a', 'b', 1, 'yy'),
(3, 1, 'o', 12.5, '2023-10-19', 'a', 'b', 1, 'yy');
    
CREATE TABLE IF NOT EXISTS partsupp (
      ps_partkey     INTEGER NOT NULL,
      ps_suppkey     INTEGER NOT NULL,
      ps_availqty    INTEGER NOT NULL,
      ps_supplycost  DECIMALV3(15,2)  NOT NULL,
      ps_comment     VARCHAR(199) NOT NULL 
    )
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES
(2, 3, 9, 10.01, 'supply1'),
(4, 3, 10, 11.01, 'supply2'),
(2, 3, 10, 11.01, 'supply3');
```


#### Example 1

In the following example, the refresh timing is set to `BUILD IMMEDIATE` (refresh immediately after creation), the refresh method is set to `REFRESH AUTO` (attempt incremental refresh), which only refreshes partitions that have changed since the last materialization. If incremental refresh is not possible, it will perform a full refresh of all partitions.
The trigger method is set to `ON MANUAL`. For non-partitioned full materialized views that have only one partition, if the base table data changes, a full refresh will be required.

```sql
CREATE MATERIALIZED VIEW mv_1_0
BUILD IMMEDIATE 
REFRESH AUTO
ON MANUAL    
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,   
  to_date(o_orderdate) as date_alias,   
  o_shippriority   
FROM   
  orders   
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### Example 2
In the following example, the refresh timing is set to delayed refresh (`BUILD DEFERRED`), the refresh method is set to full refresh (`REFRESH COMPLETE`), and the trigger timing is set to scheduled refresh (`ON SCHEDULE`). The first refresh time is `2024-12-01 20:30:00`, and it will refresh every day thereafter. If `BUILD DEFERRED` is specified as `BUILD IMMEDIATE`, the materialized view will refresh immediately upon creation. After that, it will refresh every day starting from `2024-12-01 20:30:00`.

:::tip
The time specified in STARTS must be later than the current time.
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'  
PROPERTIES ('replication_num' = '1')   
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```


#### Example 3
In this example, the refresh timing is set to immediate refresh upon creation (`BUILD IMMEDIATE`), the refresh method is set to full refresh (`REFRESH COMPLETE`), and the trigger method is set to trigger refresh (`ON COMMIT`). When data in the `orders` or `lineitem` tables changes, it will automatically trigger the refresh of the materialized view.

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
PROPERTIES ('replication_num' = '1')   
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```


### Partition Configuration
In the following example, when creating a partitioned materialized view, it is necessary to specify `PARTITION BY`. For expressions referencing partition fields, only the `date_trunc` function and identifiers are allowed. The following statement meets the requirements: the partition field references only the `date_trunc` function. The refresh method for partitioned materialized views is generally set to `AUTO`, which attempts incremental refresh, refreshing only the partitions that have changed since the last materialized refresh. If incremental refresh is not possible, it will refresh all partitions.

```sql
CREATE MATERIALIZED VIEW mv_2_0 
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL   
PARTITION BY (order_date_month)   
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,
  date_trunc(o_orderdate, 'month') as order_date_month,   
  o_shippriority   
FROM   
  orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

The following statement will fail to create a partitioned materialized view because the partition field `order_date_month` uses the `date_add()` function, resulting in the error `because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`.

```sql
CREATE MATERIALIZED VIEW mv_2_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL   
PARTITION BY (order_date_month)   
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,
  date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,   
  o_shippriority   
FROM   
  orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```


#### Base Table with Multiple Partition Columns
:::tip
Support for multiple partition columns has been available since Doris version 2.1.0.
:::

Currently, only Hive external tables support multiple partition columns. Hive external tables often have many multi-level partitions, such as a first-level partition by date and a second-level partition by region. Materialized views can choose one of Hive's partition columns as the partition column for the materialized view.

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

When the materialized view creation statement is as follows, the materialized view `mv_hive` will have three partitions: `('2020')`, `('2021')`, and `('2022')`.

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (year)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

When the materialized view creation statement is as follows, the materialized view `mv_hive2` will have the following two partitions: `('bj')` and `('sh')`:

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (region)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```


#### Using Partial Partitions from the Base Table
:::tip
Support for this feature has been available since Doris version 2.1.1.
:::

Some base tables have many partitions, but the materialized view only focuses on the "hot" data from a recent period. This feature allows for that.

The base table creation statement is as follows:


```sql
CREATE TABLE t1 (
k1 INT,
k2 DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(k1)
COMMENT 'OLAP'
PARTITION BY range(k2)
(
PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(k1) BUCKETS 2;
```


The materialized view creation statement is as follows, indicating that the materialized view only focuses on the data from the most recent day. If the current time is `2024-03-28 xx:xx:xx`, the materialized view will only have one partition `[("2024-03-28"),("2024-03-29")]`:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (k2)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'partition_sync_limit'='1',
'partition_sync_time_unit'='DAY'
)
AS
SELECT FROM t1;
```


If the time passes another day, and the current time is `2024-03-29 xx:xx:xx`, `t1` will add a new partition `[("2024-03-29"),("2024-03-30")]`. If the materialized view is refreshed at this time, after the refresh is complete, the materialized view will only have one partition `[("2024-03-29"),("2024-03-30")]`.

Additionally, when the partition field is of string type, the materialized view property `partition_date_format` can be set, for example, `%Y-%m-%d`.

#### Partition Aggregation
:::tip
Support for this feature has been available since Doris version 2.1.5.
:::

When the data in the base table is aggregated, the amount of data in each partition may significantly decrease. In this case, a partition aggregation strategy can be adopted to reduce the number of partitions in the materialized view.

**Range Partitioning**

Assuming the base table creation statement is as follows:


```sql
CREATE TABLE t1 (
k1 LARGEINT NOT NULL,
k2 DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(k1)
COMMENT 'OLAP'
PARTITION BY range(k2)
(
PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(k1) BUCKETS 2;
```


If the materialized view creation statement is as follows, the materialized view will contain two partitions: `[("2020-01-01","2020-02-01")]` and `[("2020-02-01","2020-03-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (date_trunc(k2,'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT FROM t1;
```


If the materialized view creation statement is as follows, the materialized view will only contain one partition: `[("2020-01-01","2021-01-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (date_trunc(k2,'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT FROM t1;
```

Additionally, if the partition field is of string type, the date format can be specified by setting the materialized view's `partition_date_format` property, for example, `'%Y-%m-%d'`.

For more details, refer to [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW).

### SQL Definition
There are no restrictions on the SQL definition of asynchronous materialized views.

## Direct Querying of Materialized Views

Materialized views can be treated like tables, allowing for the addition of filtering conditions and aggregations for direct querying.

**Definition of Materialized View:**

```sql
CREATE MATERIALIZED VIEW mv_5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
o_custkey,
o_orderdate
FROM (SELECT FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

**Original Query:**

```sql
SELECT t1.l_linenumber,
o_custkey,
o_orderdate
FROM (SELECT FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**Equivalent Direct Query on Materialized View:**
Users need to manually modify the query.





