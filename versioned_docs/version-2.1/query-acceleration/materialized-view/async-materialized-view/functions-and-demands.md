---
{
  "title": "Creating, Querying, and Maintaining Asynchronous Materialized Views",
  "language": "en"
}
---

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
- IMMEDIATE: Refresh immediately (default mode)
- DEFERRED: Delayed refresh

#### refresh_method Refresh Method
- COMPLETE: Refresh all partitions
- AUTO: Attempt incremental refresh, only refreshing partitions with data changes since the last materialization. Falls back to full refresh of all partitions if data changes cannot be detected.

#### refresh_trigger Trigger Methods
- **`ON MANUAL` Manual Trigger**

  Users can trigger materialized view refreshes using SQL statements with the following strategies:

  Check for base table partition data changes since last refresh and refresh only changed partitions:

  ```sql
  REFRESH MATERIALIZED VIEW mvName AUTO;
  ```

  :::tip
  If the base table used in the SQL definition of the materialized view is a JDBC table,
  Doris cannot perceive changes in the table data. When refreshing the materialized view,
  it is necessary to specify COMPLETE. If AUTO is specified, it may result in the base table
  having data, but the materialized view being empty after the refresh. Currently,
  when refreshing the materialized view, Doris can only perceive data changes in internal
  tables and Hive data source tables; support for other data sources is being gradually implemented.
  :::

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

- **`ON SCHEDULE` Scheduled Trigger**

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


- **`ON COMMIT` Automatic Trigger**

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

    For more details, see [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)

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


#### Refresh mechanism example 1

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

#### Refresh mechanism example 2
In the following example, the refresh timing is set to delayed refresh (`BUILD DEFERRED`), the refresh method is set to full refresh (`REFRESH COMPLETE`), and the trigger timing is set to scheduled refresh (`ON SCHEDULE`). The first refresh time is `2024-12-01 20:30:00`, and it will refresh every day thereafter. If `BUILD DEFERRED` is specified as `BUILD IMMEDIATE`, the materialized view will refresh immediately upon creation. After that, it will refresh every day starting from `2024-12-01 20:30:00`.

:::tip
The time specified in STARTS must be later than the current time.
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'  
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```


#### Refresh mechanism example 3
In this example, the refresh timing is set to immediate refresh upon creation (`BUILD IMMEDIATE`), the refresh method is set to full refresh (`REFRESH COMPLETE`), and the trigger method is set to trigger refresh (`ON COMMIT`). When data in the `orders` or `lineitem` tables changes, it will automatically trigger the refresh of the materialized view.

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
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

The following statement will fail to create a partitioned materialized view because the partition field `order_date_month` uses the `date_add()` function, resulting in the error `because column to check use invalid implicit expression, invalid expression is date_add(o_orderdate#4, 2)`.

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
Range partitioning is supported since Doris 2.1.5
:::

When the data in the base table is aggregated, the amount of data in each partition may significantly decrease. In this case, a partition aggregation strategy can be adopted to reduce the number of partitions in the materialized view.

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

For more details, refer to [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW).

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

```sql
SELECT l_linenumber,
o_custkey,
o_orderdate
FROM mv_5
WHERE o_orderdate = '2023-10-18';

```

## Transparent Query Rewriting

Transparent rewriting means that when processing queries, users do not need to manually modify queries, as the system will automatically optimize and rewrite them.
Doris asynchronous materialized views use a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern.
This algorithm can analyze SQL structure information, automatically find suitable materialized views for transparent rewriting, and select the optimal materialized view to respond to query SQL.
Doris provides rich and comprehensive transparent rewriting capabilities. For example, the following capabilities:

### Condition Compensation

Query and materialized view conditions do not need to be exactly the same. By compensating conditions on materialized views to express queries, materialized views can be reused to the maximum extent, avoiding the need to repeatedly build materialized views.

When the `where` conditions in the materialized view and query are expressions connected by `and`:

1. **When the query's expressions contain the materialized view's expressions:**

   Condition compensation can be performed.

   For example, if the query condition is `a > 5 and b > 10 and c = 7`, and the materialized view condition is `a > 5 and b > 10`, the materialized view condition is a subset of the query condition, so only the `c = 7` condition needs to be compensated.

2. **When the query's expressions do not completely contain the materialized view's expressions:**

   When the query conditions can be derived from the materialized view conditions (common for comparison and range expressions like `>`, `<`, `=`, `in`, etc.), condition compensation can also be performed. The compensation result is the query condition itself.

   For example, if the query condition is `a > 5 and b = 10`, and the materialized view condition is `a > 1 and b > 8`, it can be seen that the materialized view condition contains the query condition, and the query condition can be derived from the materialized view condition, so compensation can be performed, with the compensation result being `a > 5 and b = 10`.

   Condition compensation usage restrictions:

  1. For expressions connected by `or`, condition compensation cannot be performed; they must be exactly the same for successful rewriting.

  2. For non-comparison and non-range expressions like `like`, condition compensation cannot be performed; they must be exactly the same for successful rewriting.

   For example:

   **Materialized View Definition:**

    ```sql
    CREATE MATERIALIZED VIEW mv1
    BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
    DISTRIBUTED BY RANDOM BUCKETS 3
    AS
    SELECT t1.l_linenumber,
           o_custkey,
           o_orderdate
    FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
    LEFT OUTER JOIN orders
    ON l_orderkey = o_orderkey;
    ```

   The following queries can all hit the materialized view. Multiple queries can reuse one materialized view through transparent rewriting,
   reducing query rewriting time and saving materialized view construction costs.

    ```sql
    SELECT l_linenumber,
           o_custkey,
           o_orderdate
    FROM lineitem
    LEFT OUTER JOIN orders
    ON l_orderkey = o_orderkey
    WHERE l_linenumber > 2;
    ```

    ```sql
    SELECT l_linenumber,
           o_custkey,
           o_orderdate
    FROM lineitem
    LEFT OUTER JOIN orders
    ON l_orderkey = o_orderkey
    WHERE l_linenumber > 2 and o_orderdate = '2023-10-19';
    
    ```

### JOIN Rewriting

JOIN rewriting refers to when the query and materialized view use the same tables, and conditions can be written in the materialized view, JOIN inputs, or outside the JOIN. The optimizer will attempt transparent rewriting for queries in this pattern.

Multiple table JOINs are supported, with the following supported JOIN types:

- INNER JOIN
- LEFT OUTER JOIN
- RIGHT OUTER JOIN
- FULL OUTER JOIN
- LEFT SEMI JOIN
- RIGHT SEMI JOIN
- LEFT ANTI JOIN
- RIGHT ANTI JOIN

For example:

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderkey,
       o_orderstatus,
       l_partkey,
       l_suppkey,
       l_orderkey
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
INNER JOIN orders ON t1.l_orderkey = orders.o_orderkey;
```

The following query can be transparently rewritten. The condition `l_linenumber > 1` can be lifted up, enabling transparent rewriting to use the materialized view's pre-computed results to express the query.
After hitting the materialized view, JOIN computation can be saved.

**Query Statement:**

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

### JOIN Derivation

When the JOIN types in the query and materialized view are inconsistent, if the materialized view can provide all the data needed by the query, transparent rewriting can still be performed by compensating predicates outside the JOIN.

For example:

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
l_suppkey,
o_orderdate;
```

**Query Statement:**

```sql
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_suppkey = 3
GROUP BY
l_shipdate,
l_suppkey,
o_orderdate;

```

### Aggregate Rewriting

When the group dimensions in the query and materialized view definition are consistent, if the materialized view uses the same group by dimensions as the query, and the aggregate functions used in the query can be expressed using the materialized view's aggregate functions, transparent rewriting can be performed.

For example:

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv4
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
GROUP BY
o_shippriority,
o_comment;
```

The following query can hit the materialized view, as it uses the same aggregation dimensions as the materialized view. The query can filter results using the materialized view's `o_shippriority` field. The query's group by dimensions and aggregate functions can be rewritten using the materialized view's group by dimensions and aggregate functions.
After hitting the aggregate materialized view, aggregation computation can be reduced.

**Query Statement:**

```sql
SELECT 
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
WHERE o_shippriority in (1, 2)
GROUP BY
o_shippriority,
o_comment;
```

### Aggregate Rewriting (Roll-up)

Even when the aggregation dimensions in the query and materialized view definition are inconsistent, rewriting can still be performed. The materialized view's `group by` dimensions need to include the query's `group by` dimensions, and the query may not have any `group by`. Additionally, the aggregate functions used in the query must be expressible using the materialized view's aggregate functions.

For example:

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, o_orderdate, l_partkey, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    bitmap_union(to_bitmap(CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END)) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
o_orderdate,
l_partkey,
l_suppkey;
```

The following query can be transparently rewritten. The query and materialized view use different aggregation dimensions, but the materialized view's dimensions include the query's dimensions. The query can use fields from the dimensions to filter results. The query will attempt to roll up using the functions after the materialized view's `SELECT`,
for example, the materialized view's `bitmap_union` will eventually roll up to `bitmap_union_count`, which maintains the same semantics as the query's `count(distinct)`.

Through aggregate roll-up, the same materialized view can be reused by multiple queries, saving materialized view construction costs.

**Query Statement:**

```sql
SELECT
    l_shipdate, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_partkey = 3
GROUP BY
l_shipdate,
l_suppkey;
```

Currently supported aggregate roll-up functions are listed below:

| Query Function | Materialized View Function | Function After Roll-up |
|----------------|---------------------------|----------------------|
| max | max | max |
| min | min | min |
| sum | sum | sum |
| count | count | sum |
| count(distinct) | bitmap_union | bitmap_union_count |
| bitmap_union | bitmap_union | bitmap_union |
| bitmap_union_count | bitmap_union | bitmap_union_count |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union or hll_raw_agg | hll_union_agg |
| any_value | any_value or column used after any_value in select | any_value |

### Multi-dimensional Aggregate Rewriting

Multi-dimensional aggregate transparent rewriting is supported, meaning that if the materialized view does not use `GROUPING SETS`, `CUBE`, or `ROLLUP`, but the query has multi-dimensional aggregation, and the materialized view's `group by` fields include all fields in the query's multi-dimensional aggregation, transparent rewriting can still be performed.

For example:

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
select o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) as sum_total,
       max(o_totalprice) as max_total,
       min(o_totalprice) as min_total,
       count(*) as count_all
from orders
group by
o_orderstatus, o_orderdate, o_orderpriority;
```

The following query can hit the materialized view, reusing the materialized view's aggregate results and saving computation:

**Query Statement:**

```sql
select o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
from orders
group by
GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

### Partition Compensation Rewriting

When a partitioned materialized view cannot provide all the data needed by the query, a `union all` approach can be used, combining data from the original table and the materialized view as the final result.

For example:

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
as
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

When the base table adds a partition `2023-10-21` and the materialized view hasn't been refreshed yet, results can be returned by using `union all` between the materialized view and the original table.

```sql
insert into lineitem values
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

**Query Statement:**

```sql
select l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

The query can partially use the materialized view's pre-computed results, saving this portion of computation.

**Rewrite Result Illustration:**

```sql
SELECT *
FROM mv7
union all
select t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) as sum_total
from (select * from lineitem where l_shipdate = '2023-10-21') t1
left join orders on t1.l_orderkey = orders.o_orderkey and t1.l_shipdate = o_orderdate
group by
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;

```

### Nested Materialized View Rewriting

The SQL definition of a materialized view can use another materialized view; this is called a nested materialized view.
There is theoretically no limit to the nesting depth, and this materialized view can be both directly queried and transparently rewritten. Nested materialized views can also participate in transparent rewriting.

For example:

**Create inner materialized view `mv8_0_inner_mv`:**

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
select
l_linenumber,
o_custkey,
o_orderkey,
o_orderstatus,
l_partkey,
l_suppkey,
l_orderkey
from lineitem
inner join orders on lineitem.l_orderkey = orders.o_orderkey;
```

**Create outer materialized view `mv8_0`:**

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
select
l_linenumber,
o_custkey,
o_orderkey,
o_orderstatus,
l_partkey,
l_suppkey,
l_orderkey,
ps_availqty
from mv8_0_inner_mv
inner join partsupp on l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

For the following query, both `mv8_0_inner_mv` and `mv8_0` will be successfully rewritten, and the cost model will ultimately choose `mv8_0`.

Nested materialized views are commonly used in data modeling and particularly complex queries. If a single materialized
view cannot be transparently rewritten, you can split the complex query and build nested materialized views.
The transparent rewriting process will attempt to use nested materialized views for rewriting. If the rewrite is successful,
it will save computation and improve query performance.

```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```

Note:

1. The more layers of nested materialized views, the longer transparent rewriting will take. It is recommended that nested materialized views do not exceed 3 layers.

2. Nested materialized view transparent rewriting is disabled by default. See the related settings below for how to enable it.


### Aggregate Query Using Non-Aggregate Materialized View Rewrite
If the query is an aggregate query and the materialized view does not contain aggregates,
but the materialized view can provide all the columns used in the query, then it can also be rewritten.
For example, if the query first performs a join and then a group by aggregation,
hitting a materialized view that includes the join will also yield benefits.

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate;
```

The following query can hit the mv10_0 materialized view, saving the computation of the
lineitem join orders join:

```sql
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

### Explain Query Transparent Rewriting Status

To view materialized view transparent rewriting hits, used for viewing and debugging.

1. **To view materialized view transparent rewriting hit status, this statement will show brief process information about query transparent rewriting.**

    ```sql
    explain <query_sql> 
    ```

   The returned information is as follows, with materialized view-related information excerpted here:

    ```sql
    | MaterializedView                                                                                                                                                                                                                                      |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                                                                                                               |
    |   Names: mv5                                                                                                                                                                                                                                          |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                                                                                                                            |
    |                                                                                                                                                                                                                                                       |
    | MaterializedViewRewriteFail:                                                                                                                                                                                                                          |
    |   Name: mv4                                                                                                                                                                                                                                           |
    |   FailSummary: Match mode is invalid, View struct info is invalid                                                                                                                                                                                     |
    |   Name: mv3                                                                                                                                                                                                                                           |
    |   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid                                                                                                                                          |
    |   Name: mv1                                                                                                                                                                                                                                           |
    |   FailSummary: The columns used by query are not in view, View struct info is invalid                                                                                                                                                                 |
    |   Name: mv2                                                                                                                                                                                                                                           |
    |   FailSummary: The columns used by query are not in view, View struct info is invalid
    ```

  - MaterializedViewRewriteSuccessAndChose: Indicates the list of materialized view names that were successfully transparently rewritten and chosen by CBO (Cost-Based Optimizer).
  - MaterializedViewRewriteSuccessButNotChose: Indicates the list of materialized view names that were successfully transparently rewritten but ultimately not chosen by CBO.
  - MaterializedViewRewriteFail: Lists the failed cases and summary reasons.

2. **To understand the detailed process information about materialized view candidacy, rewriting, and final selection, execute the following statement:**

    ```sql
    explain memo plan <query_sql>
    ```



## Maintaining Materialized Views

### Permission Requirements

- Dropping materialized views: Requires materialized view deletion permission (same as table deletion permission)
- Modifying materialized views: Requires materialized view modification permission (same as table modification permission)
- Pausing/resuming/canceling/refreshing materialized views: Requires materialized view creation permission

### Modifying Materialized Views

#### Modifying Materialized View Properties

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
  "grace_period" = "10"
);
```
For more details, see [ALTER ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW)

#### Materialized View Renaming, i.e., Atomic Replacement of Materialized Views
```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1') 
AS
select
  l_linenumber,
  o_custkey,
  o_orderkey,
  o_orderstatus,
  l_partkey,
  l_suppkey,
  l_orderkey
from lineitem
inner join orders on lineitem.l_orderkey = orders.o_orderkey;
```
Replace the materialized view mv7 with mv9_0 and delete mv7:

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```


### Dropping Materialized Views
```sql
DROP MATERIALIZED VIEW mv_1;
```

For more details, see [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW)

### Viewing Materialized View Creation Statement
```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

For more details, see [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW)

### Pausing Materialized Views

For more details, see [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB)

### Resuming Materialized Views

For more details, see [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB)

### Canceling Materialized View Refresh Tasks

For more details, see [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK)


### Querying Materialized View Information

```sql
SELECT * 
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G 
```

Example output:
```sql
*************************** 1. row ***************************
                Id: 139570
              Name: mv11
           JobName: inner_mtmv_139570
             State: NORMAL
SchemaChangeDetail: 
      RefreshState: SUCCESS
       RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON MANUAL
          QuerySql: SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=lineitem, relatedCol='l_shipdate', partitionCol='l_shipdate'}
SyncWithBaseTables: 1
```

- **SyncWithBaseTables:** Indicates whether the materialized view is synchronized with base tables.
  - For fully built materialized views, a value of 1 indicates the view is available for transparent rewriting.
  - For incrementally partitioned materialized views, availability is determined at the partition level. Even if some partitions are unavailable, the view can still be used for transparent rewriting if the queried partitions are valid. The ability to use transparent rewriting depends on the `SyncWithBaseTables` value of the queried partitions - 1 means available, 0 means unavailable.

- **JobName:** Name of the materialized view's build job. Each materialized view has one Job, and each refresh creates a new Task, with a 1:n relationship between Jobs and Tasks.

- **State:** If changed to SCHEMA_CHANGE, indicates the base table's schema has changed. The materialized view cannot be used for transparent rewriting (but can still be queried directly). Will return to NORMAL after the next successful refresh task.

- **SchemaChangeDetail:** Explains the reason for SCHEMA_CHANGE.

- **RefreshState:** Status of the last refresh task. If FAIL, indicates execution failed - use the `tasks()` command to identify the cause. See [Viewing Materialized View Task Status](### Querying Refresh Task Information) section.

- **SyncWithBaseTables:** Whether synchronized with base tables. 1 means synchronized, 0 means not synchronized. If not synchronized, use `show partitions` to check which partitions are out of sync. See the section below on checking SyncWithBaseTables status for partitioned materialized views.

For transparent rewriting, materialized views typically have two states:

- **Normal:** The materialized view is available for transparent rewriting.
- **Unavailable/Abnormal:** The materialized view cannot be used for transparent rewriting. However, it can still be queried directly.

For more details, see [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)

### Querying Refresh Task Information

Each materialized view has one Job, and each refresh creates a new Task, with a 1:n relationship between Jobs and Tasks.
To view a materialized view's Task status by name, run the following query to check refresh task status and progress:

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
  MvDatabaseName = 'mv_db_name' and
  mvName = 'mv_name'
ORDER BY  CreateTime DESC \G
```

Example output:
```sql
*************************** 1. row ***************************
               TaskId: 167019363907545
                JobId: 139872
              JobName: inner_mtmv_139570
                 MvId: 139570
               MvName: mv11
         MvDatabaseId: 16813
       MvDatabaseName: regression_test_nereids_rules_p0_mv
               Status: SUCCESS
             ErrorMsg: 
           CreateTime: 2024-06-21 10:31:43
            StartTime: 2024-06-21 10:31:43
           FinishTime: 2024-06-21 10:31:45
           DurationMs: 2466
          TaskContext: {"triggerMode":"SYSTEM","isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
  CompletedPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
             Progress: 100.00% (15/15)
          LastQueryId: fe700ca3d6504521-bb522fc9ccf615e3
```

- NeedRefreshPartitions and CompletedPartitions record the partitions refreshed in this Task.

- Status: If FAILED, indicates execution failed. Check ErrorMsg for failure reason or use LastQueryId to search Doris logs for detailed error information. Currently, task failure makes existing materialized views unavailable. This will be changed so existing materialized views remain available for transparent rewriting even if tasks fail.

- ErrorMsg: Failure reason.

- RefreshMode: COMPLETE means all partitions were refreshed, PARTIAL means some partitions were refreshed, NOT_REFRESH means no partitions needed refreshing.

:::info Note
- If the `grace_period` property was set when creating the materialized view, it may still be available for transparent rewriting in some cases even if `SyncWithBaseTables` is false or 0.

- `grace_period` is measured in seconds and specifies the allowed time for data inconsistency between the materialized view and base tables.

- If set to 0, requires exact consistency between materialized view and base table data for transparent rewriting.

- If set to 10, allows up to 10 seconds of delay between materialized view and base table data. The materialized view can be used for transparent rewriting during this 10-second window.
  :::

For more details, see [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)

### Querying Materialized View Jobs

```sql
SELECT * 
FROM jobs("type"="mv") 
WHERE Name="inner_mtmv_75043";
```

For more details, see [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)

### Querying Materialized View Partition Information

Checking SyncWithBaseTables Status for Partitioned Materialized Views

Run `show partitions from mv_name` to check if queried partitions are valid. Example output:

```Plain
show partitions from mv11;
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

Check the `SyncWithBaseTables` field - false indicates the partition is not available for transparent rewriting.

For more details, see [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS)

### Viewing Materialized View Table Structure

For more details, see [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE)

### Related Configuration
#### Session Variables

| Variable | Description |
|----------|-------------|
| SET enable_nereids_planner = true; | Async materialized views only work with the new optimizer. Enable this if materialized view transparent rewriting isn't working |
| SET enable_materialized_view_rewrite = true; | Enable/disable query transparent rewriting (enabled by default from version 2.1.5) |
| SET materialized_view_rewrite_enable_contain_external_table = true; | Allow materialized views containing external tables to participate in transparent rewriting (disabled by default) |
| SET materialized_view_rewrite_success_candidate_num = 3; | Maximum number of successful rewrite results allowed in CBO candidates (default 3). Reduce if transparent rewriting is slow |
| SET enable_materialized_view_union_rewrite = true; | Allow UNION ALL between base table and materialized view when partitioned view doesn't provide all needed data (enabled by default) |
| SET enable_materialized_view_nest_rewrite = true; | Allow nested rewrites (disabled by default). Enable if complex queries require nested materialized views |
| SET materialized_view_relation_mapping_max_count = 8; | Maximum allowed relation mappings during transparent rewriting (default 8). Reduce if rewriting is slow |
| SET enable_dml_materialized_view_rewrite = true; | Enable structure-based materialized view transparent rewriting during DML (enabled by default) |
| SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true; | Enable structure-based materialized view transparent rewriting during DML when view contains external tables that can't be tracked in real-time (disabled by default) |

#### fe.conf Configuration
- **job_mtmv_task_consumer_thread_num:** Controls the number of concurrent materialized view refresh tasks (default 10). Tasks exceeding this limit will be pending. Requires FE restart to take effect.
