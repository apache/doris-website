---
{
    "title": "Manage and Query Async Materialized Views",
    "language": "en",
    "description": "How to create async materialized views in Doris and accelerate queries via direct query and transparent rewrite. This article covers refresh policies, partition configuration, and operations.",
    "keywords": ["Doris async materialized view", "CREATE MATERIALIZED VIEW", "transparent query rewrite", "materialized view refresh", "partitioned materialized view", "nested materialized view"]
}
---

<!-- Knowledge type: Operations manual + Reference documentation -->
<!-- Applicable scenarios: Use Doris async materialized views to accelerate queries, build data models, and operate and manage materialized views -->

Async Materialized View is a precomputation-based acceleration capability provided by Doris. Starting from the user's actual workflow, this article covers the following topics in order:

- **Create materialized views**: syntax, refresh policies, and partition configuration.
- **Query materialized views**: direct query and transparent query rewrite.
- **Operate materialized views**: modification, deletion, monitoring, and related parameter configuration.

Before reading, make sure that:

- You understand the basic concepts and applicable scenarios of async materialized views.
- The new optimizer is enabled (`enable_nereids_planner = true`).
- You are familiar with basic table creation and SQL syntax.

---

## 1. Create Materialized Views

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building an async materialized view for the first time -->

### 1.1 Permissions

Creating a materialized view requires the following two types of permissions:

- **Materialized view creation permission**: the same as the table creation permission.
- **Base table query permission**: the same as the SELECT permission (that is, the query permission on the base tables referenced by the materialized view definition SQL).

### 1.2 Creation Syntax

The full creation syntax of an async materialized view is as follows:

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

### 1.3 Refresh Configuration

Refresh configuration consists of three categories of parameters: **refresh timing (build_mode)**, **refresh method (refresh_method)**, and **trigger method (refresh_trigger)**.

#### 1.3.1 Parameter Overview

| Category | Value | Description |
| -------- | ------------- | -------------------------------------------------------------------------- |
| Refresh timing | `IMMEDIATE`   | Refresh immediately after creation (default). |
| Refresh timing | `DEFERRED`    | Defer the refresh after creation. |
| Refresh method | `COMPLETE`    | Full refresh, refreshes all partitions. |
| Refresh method | `AUTO`        | Refresh incrementally when possible; falls back to full refresh when changes cannot be detected. |
| Trigger method | `ON MANUAL`   | Triggered manually by the user via SQL statements. |
| Trigger method | `ON SCHEDULE` | Triggered periodically at the specified interval. |
| Trigger method | `ON COMMIT`   | Triggered automatically when the base table data changes (supported since Apache Doris 2.1.4). |

#### 1.3.2 ON MANUAL: Manual Trigger

You trigger a materialized view refresh via a SQL statement. There are three strategies:

**Strategy 1**: Detect whether base table partition data has changed since the last refresh, and refresh only the changed partitions.

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip Tip
- If the base table referenced by the materialized view definition SQL is a JDBC table, Doris cannot detect changes in the table data, so you must specify `COMPLETE` when refreshing. Otherwise, you may see the situation where the base table contains data but the materialized view does not.
- Currently, Doris can detect data changes only for internal tables and Hive data source tables. Other data sources are being supported gradually.
:::

**Strategy 2**: Skip checking base table partition data changes and directly refresh all partitions of the materialized view.

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**Strategy 3**: Refresh only the specified partitions.

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip Tip
- You can obtain `partitionName` from `SHOW PARTITIONS FROM mvName`.
- Detection of base table partition data changes for Hive is supported since version 2.1.3. Other external tables are not yet supported, while internal tables are always supported.
:::

#### 1.3.3 ON SCHEDULE: Periodic Trigger

Specify the refresh interval in the creation statement. `refreshUnit` can be `minute`, `hour`, `day`, `week`, and so on.

**Example 1**: Full refresh (`REFRESH COMPLETE`), refresh all partitions every 10 hours.

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**Example 2**: Incremental refresh when possible (`REFRESH AUTO`), refresh every 10 hours. Only partitions whose data has changed are refreshed; falls back to a full refresh when an incremental refresh is not possible.

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip Tip
Since version 2.1.3, Doris can automatically compute the partitions that need to be refreshed for Hive tables.
:::

#### 1.3.4 ON COMMIT: Automatic Trigger

:::tip Tip
This feature is supported since Apache Doris 2.1.4.
:::

After the base table data changes, the corresponding materialized view refresh is triggered automatically. The range of refreshed partitions is the same as that of the periodic trigger.

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

When the data in partition `t1` of the base table `lineitem` changes, the corresponding partition refresh of the materialized view is triggered automatically.

:::caution Caution
If the base table data changes frequently, this trigger method is not recommended, because refresh tasks will be built frequently and consume excessive resources.
:::

For details, see [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW).

#### 1.3.5 Complete Examples

The following set of complete examples demonstrates the refresh mechanism. First, create the base tables and initialize the data:

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

CREATE TABLE IF NOT EXISTS orders (
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

**Example 1: Immediate incremental refresh + manual trigger**

The refresh timing is to refresh immediately after creation (`BUILD IMMEDIATE`), the refresh method is incremental when possible (`REFRESH AUTO`), and the trigger method is manual (`ON MANUAL`). For a non-partitioned full materialized view, there is only one partition, so any change in the base table data triggers a full refresh.

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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Example 2: Deferred full refresh + scheduled trigger**

The refresh timing is deferred (`BUILD DEFERRED`), the refresh method is full (`REFRESH COMPLETE`), the first refresh time is `2024-12-01 20:30:00`, and afterwards it refreshes once a day.

:::tip Tip
The time specified by `STARTS` must be later than the current time. If `BUILD IMMEDIATE` is specified, an immediate refresh is performed once after creation, and afterwards it refreshes once a day starting from `2024-12-01 20:30:00`.
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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Example 3: Immediate full refresh + automatic trigger**

The refresh timing is immediate (`BUILD IMMEDIATE`), the refresh method is full (`REFRESH COMPLETE`), and the trigger method is automatic (`ON COMMIT`). A data change in either the `orders` or `lineitem` table automatically triggers a refresh.

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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 1.4 Partition Configuration

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building partitioned materialized views and accelerating partition-grained queries -->

When creating a partitioned materialized view, you must specify `PARTITION BY`. **The expression referenced by the partition column may only use the `date_trunc` function and identifiers.**

#### 1.4.1 Valid Partition Column Example

The column referenced by the partition column uses only the `date_trunc` function. The refresh method of a partitioned materialized view is generally `AUTO`.

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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 1.4.2 Invalid Partition Column Example

The following statement fails to create the materialized view because the partition column uses the `date_add()` function.

```sql
CREATE MATERIALIZED VIEW mv_2_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

Error message: `because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`.

#### 1.4.3 Multi-Column Partitioning of the Base Table

Currently, only multi-column partitioning of Hive external tables is supported. For example, when the first-level partition is by date and the second-level partition is by region, the materialized view can choose any level of partition column as its own partition column.

Hive table creation statement:

```sql
CREATE TABLE hive1 (
    `k1` int)
PARTITIONED BY (
    `year` int,
    `region` string)
STORED AS ORC;

ALTER TABLE hive1 ADD IF NOT EXISTS
PARTITION(year=2020, region="bj")
PARTITION(year=2020, region="sh")
PARTITION(year=2021, region="bj")
PARTITION(year=2021, region="sh")
PARTITION(year=2022, region="bj")
PARTITION(year=2022, region="sh");
```

**Scenario 1: Use `year` as the partition column.** The materialized view `mv_hive` will have three partitions: `('2020')`, `('2021')`, and `('2022')`.

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**Scenario 2: Use `region` as the partition column.** The materialized view `mv_hive2` will have two partitions: `('bj')` and `('sh')`.

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 Use Only a Subset of Base Table Partitions

Applicable scenario: the base table has many partitions, but the materialized view only needs to focus on the recent "hot" data.

Base table creation statement:

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
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

The materialized view synchronizes only the most recent day's data. If the current time is `2024-03-28 xx:xx:xx`, the materialized view will have only one partition `[("2024-03-28"),("2024-03-29")]`.

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
    'partition_sync_limit' = '1',
    'partition_sync_time_unit' = 'DAY'
)
AS
SELECT * FROM t1;
```

After one day, when the time becomes `2024-03-29 xx:xx:xx`, `t1` adds a new partition `[("2024-03-29"),("2024-03-30")]`. After refreshing the materialized view, the materialized view will have only one partition `[("2024-03-29"),("2024-03-30")]`.

:::tip Tip
When the partition column is of string type, you can set the materialized view property `partition_date_format`, for example `%Y-%m-%d`.
:::

#### 1.4.5 Partition Roll-Up

:::tip Tip
Range partitioning is supported since Doris 2.1.5.
:::

**Applicable scenario**: After base table data is aggregated, the data volume of each partition decreases significantly. Partition roll-up reduces the number of partitions in the materialized view.

Base table creation statement:

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
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

**Roll up by month**: the materialized view contains two partitions, `[("2020-01-01","2020-02-01")]` and `[("2020-02-01","2020-03-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**Roll up by year**: the materialized view contains only one partition, `[("2020-01-01","2021-01-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip Tip
When the partition column is of string type, you can specify the date format by setting the `partition_date_format` property, for example `'%Y-%m-%d'`.
:::

For details, see [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW).

#### 1.4.6 Multi-Source Partition Refresh

**Definition**: an async materialized view is allowed to have multiple partition tracking tables, meaning that when the data of any of these tables changes, the materialized view performs a partition refresh rather than a full refresh.

**Restrictions**:

- Only materialized views built on `INNER JOIN` or `UNION` (including `UNION ALL`) are supported.
- When the materialized view uses `UNION`, every part participating in the union must support partition change tracking (PCT). For example, if the materialized view is defined as `q1 union all q2`, both `q1` and `q2` used individually to create a materialized view must support partition refresh, and the derived partition columns must be in a consistent order.
- Partition granularity must be aligned across multiple PCT tables:

    **Allowed example**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    Partitions of base table t2: [2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    The partitions of the multiple base tables are not entirely identical, but they do not overlap.

    **Disallowed example**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    Partitions of base table t2: [2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    `[2020-01-01, 2020-01-03)` and `[2020-01-01, 2020-01-02)` overlap but are not identical.

### 1.5 SQL Definition Notes

Async materialized views support being created based on internal views (View), but **do not support being built on views from external data sources**.

Note the following:

- When the internal view that the materialized view depends on is modified or rebuilt, the data in the async materialized view becomes inconsistent with the base table. In this case, the data in the materialized view still exists, but it cannot support transparent query rewrite.
- If a structure change affects the partition tracking table or column that the async materialized view depends on, or changes its schema, the materialized view will fail to refresh.
- If the change does not affect the elements above, the materialized view returns to normal use after a refresh.

---

## 2. Query Materialized Views

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Use materialized views to accelerate queries -->

There are two ways to query materialized views: **direct query** and **transparent query rewrite**.

| Query Method | Requires Modifying the Original Query | Applicable Scenarios |
| ------------ | ------------------ | ---------------------------------------------- |
| Direct query | Yes | The materialized view is known to exist, and you want to explicitly use its precomputed results. |
| Transparent rewrite | No | You want to leverage materialized views to accelerate queries transparently to users. |

### 2.1 Direct Query of Materialized Views

A materialized view can be treated as a table, against which you can apply filter conditions, aggregations, and so on for direct querying.

**Materialized view definition**:

```sql
CREATE MATERIALIZED VIEW mv_5
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

**Original query**:

```sql
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**Equivalent direct query against the materialized view** (which the user must rewrite manually):

```sql
SELECT
    l_linenumber,
    o_custkey
FROM mv_5
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

### 2.2 Transparent Query Rewrite

**Transparent rewrite** means the system automatically optimizes and rewrites a query during processing, without the user having to modify it manually. Doris async materialized views adopt a transparent rewrite algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern. The algorithm analyzes SQL structure information, automatically finds suitable materialized views, and selects the optimal result to respond to the query.

The following table summarizes the transparent rewrite capabilities supported by Doris:

| Rewrite Capability | Applicable Scenarios |
| ------------------ | ------------------------------------------------------------- |
| Predicate compensation | The `WHERE` conditions of the query and the materialized view are not exactly the same. |
| JOIN rewrite | The query and the materialized view use the same tables, with the same JOIN type. |
| JOIN derivation | The JOIN type of the query and the materialized view differ, but the materialized view can provide enough data. |
| Aggregation rewrite | The grouping dimensions of the query and the materialized view are the same. |
| Aggregation rewrite (roll-up) | The dimensions of the materialized view contain the dimensions of the query, and the aggregate functions of the query can be expressed using the materialized view's functions. |
| Multi-dimensional aggregation rewrite | The materialized view does not use `GROUPING SETS`/`CUBE`/`ROLLUP`, but the query has multi-dimensional aggregation. |
| Partition compensation rewrite | When the partitioned materialized view cannot provide all the data for the query, do `UNION ALL` with the base table. |
| Nested materialized view rewrite | A materialized view is built on top of another materialized view. |
| Non-aggregation hits aggregation query | The query is an aggregation query, and the materialized view contains no aggregation but can provide all the required columns. |
| Window function rewrite | Both the query and the materialized view contain window functions, and the definitions match exactly. |
| Limit / TopN rewrite | The query contains `ORDER BY` or `LIMIT`, and the materialized view satisfies the requirements. |

#### 2.2.1 Predicate Compensation

The conditions of the query and the materialized view do not need to be identical. By compensating predicates on top of the materialized view to express the query, the materialized view can be reused to the maximum extent.

When the `WHERE` conditions of the materialized view and the query are expressions connected by `AND`, two cases apply:

**Case 1: When the query expression contains the materialized view expression**, predicate compensation can be applied.

For example, if the query is `a > 5 AND b > 10 AND c = 7` and the materialized view condition is `a > 5 AND b > 10`, the materialized view condition is a subset of the query condition, and only the `c = 7` condition needs to be compensated.

**Case 2: When the query expression does not fully contain the materialized view expression**, if the query condition can derive the materialized view condition (commonly comparison and range expressions such as `>`, `<`, `=`, `IN`), predicate compensation can also be applied. The compensated result is the query condition itself.

For example, if the query is `a > 5 AND b = 10` and the materialized view is `a > 1 AND b > 8`, the materialized view condition contains the query condition and can be compensated; the compensated result is `a > 5 AND b = 10`.

**Restrictions on predicate compensation**:

- For expressions connected by `OR`, predicate compensation is not supported, and the conditions must be identical for a successful rewrite.
- For non-comparison and non-range expressions such as `LIKE`, predicate compensation is not supported, and the conditions must be identical for a successful rewrite.

**Example**:

Materialized view definition:

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

The following queries can hit the materialized view, reusing the same materialized view via transparent rewrite, which reduces rewrite time and saves construction cost:

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
WHERE l_linenumber > 2 AND o_orderdate = '2023-10-19';
```

#### 2.2.2 JOIN Rewrite

**Applicable scenario**: the query and the materialized view use the same tables. `WHERE` clauses can appear on the inputs of the JOIN or outside the JOIN, in both the materialized view and the query. The optimizer attempts transparent rewrite for queries of this pattern.

**Supported JOIN types**:

- `INNER JOIN`
- `LEFT OUTER JOIN`
- `RIGHT OUTER JOIN`
- `FULL OUTER JOIN`
- `LEFT SEMI JOIN`
- `RIGHT SEMI JOIN`
- `LEFT ANTI JOIN`
- `RIGHT ANTI JOIN`

**Example**:

Materialized view definition:

```sql
CREATE MATERIALIZED VIEW mv2
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

The following query can be transparently rewritten. The condition `l_linenumber > 1` can be pulled up, and the precomputed results of the materialized view can be used to express the query. After hitting the materialized view, the JOIN computation is saved.

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 JOIN Derivation

When the JOIN types of the query and the materialized view differ, transparent rewrite can still be applied if the materialized view can provide all the data the query needs, by compensating predicates outside the JOIN.

**Example**:

Materialized view definition:

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

Query statement:

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

#### 2.2.4 Aggregation Rewrite

**Applicable conditions**: the grouping dimensions in the query and the materialized view definition are the same, and the aggregate functions used by the query can be expressed using the aggregate functions of the materialized view.

**Example**:

Materialized view definition:

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

The following query can be transparently rewritten: the aggregation dimensions are the same, the `o_shippriority` field of the materialized view can be used to filter results, and both the GROUP BY dimensions and the aggregate functions can be rewritten using the materialized view. Hitting the aggregation materialized view reduces aggregation computation:

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
WHERE o_shippriority IN (1, 2)
GROUP BY
    o_shippriority,
    o_comment;
```

#### 2.2.5 Aggregation Rewrite (Roll-Up)

The rewrite still applies even when the aggregation dimensions are not identical. The requirements are:

- The `GROUP BY` dimensions of the materialized view must contain the `GROUP BY` dimensions of the query. The query may have no `GROUP BY`.
- The aggregate functions of the query can be expressed using the aggregate functions of the materialized view.

**Example**:

Materialized view definition:

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

The following query can be transparently rewritten. The dimensions of the materialized view contain the query's dimensions, so the query attempts to use the functions in the materialized view's `SELECT` to roll up. For example, the materialized view's `bitmap_union` is ultimately rolled up to `bitmap_union_count`, which is semantically consistent with the `count(distinct)` in the query.

Through aggregation roll-up, the same materialized view can be reused by multiple queries, saving construction cost:

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

**List of supported roll-up aggregate functions**:

| Function in the Query | Function in the Materialized View | Function After Roll-Up |
| ------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `max`                                                   | `max`                                       | `max`                |
| `min`                                                   | `min`                                       | `min`                |
| `sum`                                                   | `sum`                                       | `sum`                |
| `count`                                                 | `count`                                     | `sum`                |
| `count(distinct)`                                       | `bitmap_union`                              | `bitmap_union_count` |
| `bitmap_union`                                          | `bitmap_union`                              | `bitmap_union`       |
| `bitmap_union_count`                                    | `bitmap_union`                              | `bitmap_union_count` |
| `hll_union_agg`, `approx_count_distinct`, `hll_cardinality` | `hll_union` or `hll_raw_agg`            | `hll_union_agg`      |
| `any_value`                                             | `any_value` or a column referenced by `any_value` after SELECT | `any_value`          |

#### 2.2.6 Multi-Dimensional Aggregation Rewrite

Transparent rewrite supports multi-dimensional aggregation: the materialized view does not use `GROUPING SETS`/`CUBE`/`ROLLUP`, the query has multi-dimensional aggregation, and the `GROUP BY` columns of the materialized view contain all columns referenced by the query's multi-dimensional aggregation.

**Example**:

Materialized view definition:

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) AS sum_total,
       max(o_totalprice) AS max_total,
       min(o_totalprice) AS min_total,
       count(*) AS count_all
FROM orders
GROUP BY
    o_orderstatus, o_orderdate, o_orderpriority;
```

The following query can hit the materialized view, reusing the aggregation results and saving computation:

```sql
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
FROM orders
GROUP BY
    GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

#### 2.2.7 Partition Compensation Rewrite

**Applicable scenario**: when the partitioned materialized view cannot provide all the data the query needs, use `UNION ALL` to combine the data from the original base tables and the materialized view as the final result.

**Example**:

Materialized view definition:

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

When a new partition `2023-10-21` is added to the base table and the materialized view has not been refreshed, the result can be returned by `UNION ALL`-ing the materialized view with the original tables.

```sql
INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

Query statement:

```sql
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

The query can partially use the materialized precomputed results, saving the corresponding computation.

Illustration of the rewritten result:

```sql
SELECT *
FROM mv7
UNION ALL
SELECT t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) AS sum_total
FROM (SELECT * FROM lineitem WHERE l_shipdate = '2023-10-21') t1
LEFT JOIN orders ON t1.l_orderkey = orders.o_orderkey AND t1.l_shipdate = o_orderdate
GROUP BY
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;
```

:::caution Caution
Partition compensation is currently supported, but `UNION ALL` compensation with conditions is not yet supported.

For example, if the materialized view is built with the filter condition `WHERE l_shipdate > '2023-10-19'` and the query is `WHERE l_shipdate > '2023-10-18'`, this case currently cannot be compensated via `UNION ALL`. Support is planned.
:::

:::info Note
Since version 3.1.0, the partition compensation rewrite feature supports the following types of partitioned tables: internal tables, Hive, Iceberg, and Paimon. Partition compensation rewrite is triggered only when the partitioned materialized view is built on top of one of these types of partitioned tables.
:::

#### 2.2.8 Nested Materialized View Rewrite

**Definition**: the definition SQL of a materialized view can use other materialized views, which is called a nested materialized view. The number of nesting levels is theoretically unlimited. Nested materialized views can be queried directly and can also participate in transparent rewrite.

**Applicable scenarios**: commonly used for data modeling and complex queries. If a single materialized view cannot achieve transparent rewrite, you can split a complex query and build nested materialized views.

**Example**:

Create the inner materialized view `mv8_0_inner_mv`:

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

Create the outer materialized view `mv8_0`:

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey,
    ps_availqty
FROM mv8_0_inner_mv
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

For the following query, both `mv8_0_inner_mv` and `mv8_0` can be successfully rewritten, and the cost model finally chooses `mv8_0`:

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution Caution
- The more nesting levels a materialized view has, the longer transparent rewrite takes. It is recommended that the nesting depth not exceed 3 levels.
- Nested materialized view transparent rewrite is disabled by default. To enable it, see [3.11 Related Configuration](#311-related-configuration).
:::

#### 2.2.9 Aggregation Query Hits a Non-Aggregation Materialized View

If the query is an aggregation query and the materialized view contains no aggregation, but the materialized view can provide all the columns the query uses, the rewrite can still be applied. For example, when a query first performs JOIN and then aggregates with `GROUP BY`, hitting a materialized view that contains the JOIN is beneficial.

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate;
```

The following query can hit `mv10_0`, saving the `lineitem JOIN orders` computation:

```sql
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

#### 2.2.10 Window Function Rewrite

When both the query and the materialized view contain window functions and the window function definitions match exactly, transparent rewrite can be applied. Window function rewrite reuses the precomputed window function results in the materialized view, significantly improving the performance of queries with complex window computations. **All window functions are currently supported for transparent rewrite.**

**Example 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 1;
```

The following query can hit `mv11_0`, saving the window function computation. Even though the query condition `o_orderkey > 2` differs from the materialized view, the rewrite can still succeed:

```sql
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 2;
```

**Example 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderkey,
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-09';
```

The following query can hit `mv11_1`, saving the window function computation. Since `o_orderdate` is a `PARTITION BY` field of the window function, even though the query condition `o_orderdate > '2023-12-10'` is evaluated before the window function executes, transparent rewrite can still be applied:

```sql
SELECT
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-10';
```

:::tip Tip
The example uses a single table, but window function rewrite also applies to multi-table JOIN scenarios.
:::

#### 2.2.11 Limit and TopN Rewrite

When a query contains an `ORDER BY` or `LIMIT` clause (that is, a Top-N query), if the materialized view can provide enough data to satisfy the query's `ORDER BY` and `LIMIT` requirements, the optimizer can use the materialized view to perform transparent rewrite, which significantly accelerates common Top-N analytical scenarios.

**Rewrite conditions**:

| Check Item | Validation Rule |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | The `ORDER BY` clause of the query must be compatible with or identical to the `ORDER BY` clause of the materialized view. |
| LIMIT      | When the materialized view has no `LIMIT`, any query with `LIMIT` can attempt rewrite.<br/>When the materialized view has `LIMIT N`, the query's `LIMIT M` must satisfy `M <= N`.<br/>When the materialized view has `LIMIT N OFFSET L`, the query's `LIMIT M OFFSET O` must satisfy `O >= L` and `M + O <= N + L`. |
| WHERE conditions | Other `WHERE` conditions of the materialized view and the query must be the same. |

**Example 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 8 OFFSET 1;
```

The following query can hit `mv11_0` and meets the validation conditions:

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

The following query cannot hit `mv11_0` because it has the additional condition `o_orderdate > '2023-12-08'`. If the `mv11_0` materialized view also had this `WHERE` condition, the query could hit it:

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

**Example 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey,
    o_orderkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 4 OFFSET 2;
```

The `ORDER BY + LIMIT` in the following query is converted into a TopN, which can hit `mv11_1` and meets the validation conditions:

```sql
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 2 OFFSET 3;
```

### 2.3 Inspect Transparent Rewrite (Explain)

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging why a query did not hit the materialized view -->

#### 2.3.1 Brief View: EXPLAIN

To view brief process information of materialized view transparent rewrite:

```sql
EXPLAIN <query_sql>
```

Returned information (extract of the parts related to materialized views):

```text
| MaterializedView                                                              |
| MaterializedViewRewriteSuccessAndChose:                                       |
|   Names: mv5                                                                  |
| MaterializedViewRewriteSuccessButNotChose:                                    |
|                                                                               |
| MaterializedViewRewriteFail:                                                  |
|   Name: mv4                                                                   |
|   FailSummary: Match mode is invalid, View struct info is invalid             |
|   Name: mv3                                                                   |
|   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid |
|   Name: mv1                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
|   Name: mv2                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
```

Field meanings:

- **`MaterializedViewRewriteSuccessAndChose`**: the list of materialized view names that were transparently rewritten successfully and chosen by the CBO (Cost-Based Optimizer).
- **`MaterializedViewRewriteSuccessButNotChose`**: the list of materialized view names that were transparently rewritten successfully but ultimately not chosen by the CBO.
- **`MaterializedViewRewriteFail`**: materialized views for which transparent rewrite failed, along with a summary of the reasons.

#### 2.3.2 Detailed View: EXPLAIN MEMO PLAN

To learn the detailed process of materialized view candidates, rewriting, and the final selection:

```sql
EXPLAIN MEMO PLAN <query_sql>
```

---

## 3. Maintain Materialized Views

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Day-to-day operations and management of materialized views -->

### 3.1 Permissions

| Operation | Required Permission |
| ----------------------------- | ------------------------- |
| Drop a materialized view | The drop permission on the materialized view (the same as dropping a table). |
| Modify a materialized view | The modify permission on the materialized view (the same as modifying a table). |
| Pause / resume / cancel / refresh a materialized view | The creation permission on the materialized view. |

### 3.2 Modify a Materialized View

#### 3.2.1 Modify Materialized View Properties

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
    "grace_period" = "10"
);
```

#### 3.2.2 Atomic Replacement of a Materialized View (Rename)

First, create a new materialized view to use as the replacement:

```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

Replace `mv7` with `mv9_0` and drop `mv7`:

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```

### 3.3 Drop a Materialized View

```sql
DROP MATERIALIZED VIEW mv_1;
```

For details, see [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW).

### 3.4 View the Creation Statement of a Materialized View

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

For details, see [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW).

### 3.5 Pause / Enable / Cancel a Refresh

| Operation | Reference Documentation |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Pause a materialized view | [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB) |
| Enable a materialized view | [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB) |
| Cancel a materialized view refresh task | [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK) |

### 3.6 Query Materialized View Information

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G
```

Sample returned result:

```text
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

**Key field descriptions**:

- **`SyncWithBaseTables`**: whether the materialized view data is consistent with the base tables.
    - For a fully built materialized view: a value of `1` indicates that it can be used for transparent rewrite.
    - For a partition-incremental materialized view: this is judged at partition granularity. Even if some partitions are unavailable, as long as the queried partitions are valid, the materialized view can still be used for transparent rewrite. Whether transparent rewrite is possible mainly depends on the `SyncWithBaseTables` field of the partitions used by the query: `1` means available, `0` means unavailable.
- **`JobName`**: the name of the build job for the materialized view. Each materialized view has one job, and each refresh creates a new task; the relationship between job and task is 1:n.
- **`State`**: a value of `SCHEMA_CHANGE` indicates that the schema of the base table has changed. In this case, the materialized view cannot be used for transparent rewrite (direct query is not affected). After the next successful refresh, it will return to `NORMAL`.
- **`SchemaChangeDetail`**: indicates the reason that `SCHEMA_CHANGE` occurred.
- **`RefreshState`**: the refresh state of the materialized view's last task. If it is `FAIL`, you can use the `tasks()` command to further locate the failure cause (see [3.7 Query Refresh Task (TASK) Information](#37-query-refresh-task-task-information)).

**Transparent rewrite status**:

- **Normal status**: the materialized view is currently available for transparent rewrite.
- **Abnormal / unavailable status**: the materialized view cannot be used for transparent rewrite, but direct query is still possible.

For details, see [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos).

### 3.7 Query Refresh Task (TASK) Information

Each materialized view has one job, and each refresh produces a new task; the relationship between job and task is 1:n. To view the task status by materialized view name:

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
    MvDatabaseName = 'mv_db_name' AND
    mvName = 'mv_name'
ORDER BY CreateTime DESC \G
```

Sample returned result:

```text
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

**Key field descriptions**:

- **`NeedRefreshPartitions` / `CompletedPartitions`**: the partitions that this task needs to refresh and the partitions that have been refreshed.
- **`Status`**: `FAILED` indicates a failed run. You can use `ErrorMsg` to view the cause, or search the Doris logs by `LastQueryId` for detailed information. Currently, a task failure makes the existing materialized view unavailable. In the future this will be changed so that even if the task fails, the existing materialized view remains available for transparent rewrite.
- **`ErrorMsg`**: the cause of the failure.
- **`RefreshMode`**:
    - `COMPLETE`: refreshed all partitions.
    - `PARTIAL`: refreshed some partitions.
    - `NOT_REFRESH`: no partitions need to be refreshed.

:::info Note
- Currently, the default number of stored and displayed tasks is 100. You can modify it via `max_persistence_task_count` in `fe.conf`. When this number is exceeded, older task records are discarded; if the value is less than 1, no persistence is performed. The configuration takes effect only after FE is restarted.
- If the `grace_period` property is set when the materialized view is created, the materialized view may still be used for transparent rewrite in some cases even when `SyncWithBaseTables` is `false` or `0`.
- The unit of `grace_period` is seconds, indicating the inconsistency between the materialized view and the base table data that is allowed.
    - Set to `0`: the materialized view data must be fully consistent with the base table data for transparent rewrite to apply.
    - Set to `10`: a 10-second delay is allowed; the materialized view can be used for transparent rewrite within 10 seconds.
:::

For details, see [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks).

### 3.8 Query the JOB Corresponding to a Materialized View

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

For details, see [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs).

### 3.9 Query Materialized View Partition Information

For a partitioned materialized view, use `SHOW PARTITIONS` to view the `SyncWithBaseTables` status:

```sql
SHOW PARTITIONS FROM mv_name;
```

Sample returned result:

```Plain
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

The main field to inspect is `SyncWithBaseTables`: `true` means the partition can be used for transparent rewrite, while `false` means it cannot.

For details, see [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS).

### 3.10 View the Schema of a Materialized View

For details, see [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE).

### 3.11 Related Configuration

<!-- Knowledge type: Reference documentation -->
<!-- Applicable scenarios: Tuning materialized view transparent rewrite behavior -->

#### 3.11.1 Session Variable Switches

| Switch | Description |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | Async materialized views are supported only under the new optimizer. Enable this switch when transparent rewrite does not take effect. |
| `SET enable_materialized_view_rewrite = true;`                                 | Enables or disables transparent query rewrite. Enabled by default since version 2.1.5. |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | Whether materialized views participating in transparent rewrite are allowed to contain external tables. Disallowed by default. If a materialized view's definition SQL contains external tables and you want it to participate in transparent rewrite, enable this switch. |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | The maximum number of successfully rewritten results allowed to participate in CBO candidates. Defaults to 3. If transparent rewrite performance is slow, decrease this value. |
| `SET enable_materialized_view_union_rewrite = true;`                           | When the partitioned materialized view cannot provide all the data for the query, whether to allow the base table and the materialized view to be combined with `UNION ALL` to respond to the query. Allowed by default. Disable this switch if you find data errors when hitting the materialized view. |
| `SET enable_materialized_view_nest_rewrite = true;`                            | Whether to allow nested rewrite. Disallowed by default. Enable it if a query SQL is complex and requires building nested materialized views to be hit. |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | The maximum number of relation mappings allowed during transparent rewrite. Mappings beyond this limit are truncated. Relation mappings are usually produced by self-joins, and the count is a Cartesian product (for example, 3 tables may produce 8 combinations). Defaults to 8. If transparent rewrite is slow, decrease this value. |
| `SET enable_dml_materialized_view_rewrite = true;`                             | Whether to enable transparent rewrite of materialized views based on structure information during DML. Enabled by default. |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | Whether to enable transparent rewrite based on structure information during DML when a materialized view contains external tables whose data changes cannot be detected in real time. Disabled by default. |

#### 3.11.2 fe.conf Configuration

| Configuration Item | Description |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | Controls the number of materialized view refresh tasks that can run concurrently. Defaults to 10; tasks beyond this number enter the pending state. Modifying this value requires restarting FE. |
