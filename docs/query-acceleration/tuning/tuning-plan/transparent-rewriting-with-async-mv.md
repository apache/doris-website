---
{
    "title": "Transparent Rewriting with Async Materialized Views: Accelerating Complex Queries",
    "sidebar_label": "Transparent Rewriting with Async MV",
    "language": "en",
    "description": "How to use Doris async materialized views for transparent rewriting? This article introduces the SPJG-based rewriting algorithm, hands-on examples, and hit-verification methods to help accelerate complex join and aggregation queries.",
    "keywords": ["Doris async materialized view", "transparent rewriting", "SPJG", "query acceleration", "explain shape plan", "materialized view hit"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenario: Performance optimization for complex JOIN/aggregation queries -->

Transparent rewriting with async materialized views means that Doris automatically analyzes the structure of a query SQL and rewrites it into an equivalent query based on existing materialized views, so that precomputed results are reused to accelerate the query.

## Before You Read

- You are familiar with the basic concepts of [async materialized views](../../materialized-view/async-materialized-view/overview.md).
- You have experience with SQL and `EXPLAIN`.
- The query follows the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern.
- You have permissions to create materialized views and query the tables.

## Overview

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Understanding the principles of transparent rewriting -->

[Async materialized views](../../materialized-view/async-materialized-view/overview.md) use a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern.

The core capabilities of this algorithm include:

- **Structure analysis**: Automatically parses the logical structure of the query SQL.
- **View matching**: Searches for usable candidates among existing materialized views.
- **Transparent rewriting**: Rewrites the query into an equivalent query based on a materialized view without modifying the original SQL.
- **Performance improvement**: Significantly improves query speed and reduces compute cost by reusing precomputed results.

## Applicable Scenarios

<!-- Knowledge type: Decision reference -->
<!-- Applicable scenario: Deciding whether to use transparent rewriting -->

| Scenario characteristic | Recommended to use transparent rewriting? | Description |
| --- | --- | --- |
| Complex JOIN + GROUP BY queries | Recommended | Naturally fits the SPJG pattern |
| High-frequency repeated aggregation queries | Recommended | High benefit from precomputation |
| Base tables with low-frequency data changes | Recommended | Low maintenance cost |
| Base tables with high-frequency data changes | Not recommended | High refresh overhead for materialized views |
| Simple point queries only | Not recommended | Limited benefit from precomputation |
| Tight storage resources | Use with caution | Materialized views require additional storage |

## Hands-On Example: Accelerating Queries with a Materialized View

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenario: End-to-end implementation of transparent rewriting -->

The following end-to-end example uses the TPC-H dataset to demonstrate the full flow of transparent rewriting.

### Step 1: Create the Base Tables

**Goal**: Create the `orders` and `lineitem` tables for the demo and load data into them.

**Commands**:

```sql
CREATE DATABASE IF NOT EXISTS tpch;
USE tpch;

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
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO orders VALUES
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

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

INSERT INTO lineitem VALUES
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

**Notes**: Both tables are partitioned by date, which makes it easier for the materialized view to refresh by partition.

### Step 2: Create an Async Materialized View

**Goal**: Create a pre-aggregated async materialized view `mv1` based on `lineitem` and `orders`.

**Commands**:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
o_orderdate,
l_partkey,
l_suppkey;
```

**Key parameters**:

| Parameter | Value | Description |
| --- | --- | --- |
| `BUILD IMMEDIATE` | Build immediately | Materialize data right after creation |
| `REFRESH COMPLETE ON MANUAL` | Manual full refresh | Refresh is triggered by the user |
| `PARTITION BY(l_shipdate)` | Partition by partition key | Aligned with the base table partitions for incremental maintenance |
| `DISTRIBUTED BY RANDOM BUCKETS 2` | Random bucketing | Simplifies the distribution configuration |

### Step 3: Run the Query and Verify Transparent Rewriting

**Goal**: Verify that the query is rewritten into an execution plan based on `mv1`.

**Commands**:

```sql
mysql> explain shape plan SELECT l_shipdate, SUM(o_totalprice) AS total_price
    -> FROM lineitem
    -> LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    -> WHERE l_partkey = 2 AND l_suppkey = 3
    -> GROUP BY l_shipdate;
+-------------------------------------------------------------------+
| Explain String(Nereids Planner)                                   |
+-------------------------------------------------------------------+
| PhysicalResultSink                                                |
| --PhysicalDistribute[DistributionSpecGather]                      |
| ----PhysicalProject                                               |
| ------hashAgg[GLOBAL]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                  |
| ----------hashAgg[LOCAL]                                          |
| ------------PhysicalProject                                       |
| --------------filter((mv1.l_partkey = 2) and (mv1.l_suppkey = 3)) |
| ----------------PhysicalOlapScan[mv1]                             |
+-------------------------------------------------------------------+
```

**Notes**: The end of the execution plan shows `PhysicalOlapScan[mv1]`, indicating that the query has been transparently rewritten and hits `mv1`.

### Step 4: Inspect Rewriting Status Details

**Goal**: Use `explain` to view more fine-grained rewriting status information.

**Commands**:

```sql
| ========== MATERIALIZATIONS ==========                                            |
|                                                                                   |
| MaterializedView                                                                  |
| MaterializedViewRewriteSuccessAndChose:                                           |
|   internal.tpch.mv1 chose,                                                        |
|                                                                                   |
| MaterializedViewRewriteSuccessButNotChose:                                        |
|   not chose: none,                                                                |
|                                                                                   |
| MaterializedViewRewriteFail:                                                      |
```

**Key fields**:

| Field | Meaning |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | Rewriting succeeded and was chosen by the optimizer |
| `MaterializedViewRewriteSuccessButNotChose` | Rewriting succeeded but was not chosen (cost is not optimal) |
| `MaterializedViewRewriteFail` | Rewriting failed |

## Usage Recommendations

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: Materialized view design and operations -->

:::tip Usage recommendations

- **Precomputed results**: A materialized view precomputes and stores query results, avoiding repeated computation on each query. It is a good fit for frequently executed complex queries.
- **Reduced join operations**: A materialized view can merge data from multiple tables into a single view, reducing join operations at query time and improving query efficiency.
- **Automatic updates**: When base table data changes, the materialized view can be updated automatically so that query results reflect the latest data state.
- **Storage overhead**: A materialized view requires additional storage. When creating one, balance query performance against storage cost.
- **Maintenance cost**: Maintaining a materialized view consumes system resources. When the base table is updated frequently, the refresh overhead is high, so choose an appropriate refresh strategy.
- **Applicable scenarios**: Materialized views are suitable for scenarios where data changes infrequently and queries run frequently. For frequently changing data, real-time computation may be more appropriate.

:::

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting rewriting misses and lower-than-expected performance -->

### Q1: What should I do if my query does not hit a materialized view?

Troubleshoot in the following order:

1. Use `explain` to check whether the `MATERIALIZATIONS` section contains `RewriteFail` information.
2. Confirm that the query follows the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern.
3. Check whether the materialized view fields cover the columns required by the query.
4. Check whether the materialized view status is available (built and not invalidated).

### Q2: Why does rewriting succeed but does not get chosen?

`MaterializedViewRewriteSuccessButNotChose` means the optimizer considers the cost of the rewritten plan higher than the original plan. You can try:

- Adjusting the partitioning and bucketing strategy of the materialized view.
- Collecting statistics with `ANALYZE` so the optimizer has accurate cost estimates.

### Q3: What should I do if materialized view refresh is too slow?

- Prefer incremental refresh over full refresh.
- Align the partition key of the materialized view with that of the base table, and refresh by partition.
- Evaluate the write frequency of the base table and avoid triggering refresh during peak periods.

### Q4: How do I confirm whether a rewrite is hit?

Run `EXPLAIN` or `EXPLAIN SHAPE PLAN` and check:

- Whether `PhysicalOlapScan[mv name]` appears in the plan.
- Whether `RewriteSuccessAndChose` in the `MATERIALIZATIONS` section contains the target materialized view.

### Common Error Keywords

- `MaterializedViewRewriteFail`: Rewriting failed. This is commonly caused by SQL that does not match the SPJG pattern or by missing fields.
- `not chose`: Rewriting succeeded but was not chosen. This is usually a cost-estimation issue.
- `MV is not in NORMAL state`: The materialized view is in an abnormal state. Check its refresh history.

## Summary

Using async materialized views appropriately can significantly improve the performance of complex joins and aggregation queries over large datasets. When applying them, weigh storage cost, refresh overhead, and data freshness together to balance performance and cost.
