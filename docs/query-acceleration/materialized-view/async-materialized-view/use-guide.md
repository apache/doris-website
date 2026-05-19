---
{
    "title": "Async Materialized View Best Practices",
    "language": "en",
    "description": "When are async materialized views a good fit? How do you choose a refresh strategy? How do you implement them? This article covers scenario assessment, usage principles, refresh strategy selection, implementation practices, and operational considerations.",
    "keywords": ["async materialized view", "usage recommendations", "best practices", "refresh strategy", "partitioned materialized view", "transparent rewrite", "data layered modeling", "Doris"]
}
---

<!-- Knowledge type: usage guide / best practices -->
<!-- Applicable scenarios: query acceleration, ETL data modeling, lakehouse federated query, write optimization -->

Async materialized views accelerate queries by precomputing and storing query results, but each refresh incurs some compute and IO overhead. This article walks through **scenario assessment, usage principles, refresh strategy selection, implementation practices, and operational considerations** in order, helping DBAs and developers build efficient async materialized views.

For the refresh principles of materialized views, see [Refresh Principles](../overview.md).

## Quick Decision Checklist

Before creating an async materialized view, evaluate against the following checklist:

- Does the query include multi-table JOINs, complex aggregations, or window functions?
- Is the base table data update frequency relatively low (avoid multiple updates per minute)?
- Can the business tolerate minute-level or longer data latency (real-time data within 1 to 5 minutes is not required)?
- Is the base table data large enough (much larger than a few hundred rows)?
- Can common query SQL patterns be grouped, with no overlap between groups?
- Is the base table a partitioned table, and can a partitioned materialized view be built?
- Are there enough resources for periodic refresh?
- Can you periodically check the usage status of materialized views and clean up unused ones in time?

If most of the answers above are **yes**, then async materialized views are a good fit.

---

## 1. Scenario Assessment

<!-- Knowledge type: scenario assessment -->

The table below summarizes typical scenarios where async materialized views are **recommended** or **not recommended**, for quick reference.

### Scenario Quick Reference

| Category | Scenario | Key Characteristics | Recommended |
|---|---|---|---|
| Query complexity | Complex aggregation queries | Multi-table JOIN, SUM/AVG/COUNT, window functions | Yes |
| Reports | Consistent snapshot reports | Generated at fixed time points (such as daily midnight) | Yes |
| Compute-intensive | Compute-intensive analysis | Complex math, data transformation, prediction models | Yes |
| Data warehouse modeling | Star / snowflake schema | Fact table + multiple dimension tables JOIN | Yes |
| Lakehouse | Lakehouse acceleration | Data lake queries limited by network and object storage throughput | Yes |
| Data warehouse layering | ETL layered processing | Base table is raw data and needs multi-layer processing | Yes |
| Data updates | Frequently updated base table | Multiple updates per minute | No |
| Query complexity | Simple queries | Single-table scan or simple filter | No |
| Timeliness | Near real-time (within 1 to 5 minutes) data | Business requires data to always be the latest | No |
| Data scale | Very small source table | Only a few hundred rows | No |

### Recommended Scenarios

#### Complex Aggregation Queries

- **Description**: Queries with multi-table joins, complex aggregation functions (such as SUM, AVG, COUNT), or window functions.
- **Benefit**: Avoids recomputing complex logic on each execution.

#### Reports

- **Description**: Reports that need a consistent snapshot generated at a fixed time point (such as daily midnight).
- **Benefit**: Ensures all users see data at the same point in time.

#### Compute-Intensive Analysis

- **Description**: Analytical queries with complex math or data transformations, such as customer lifetime value calculations or predictive analytics models.
- **Benefit**: Precomputes results, reducing runtime resource consumption.

#### Star / Snowflake Schema in Data Warehouses

- **Description**: Scenarios where a fact table joins multiple dimension tables, such as a sales fact table joining product, time, and region dimensions.
- **Benefit**: Pre-materializes join results to accelerate analytical queries.

#### Lakehouse Acceleration

- **Description**: Queries against a data lake can be slow due to network latency and object storage throughput limits.
- **Benefit**: Leverages Doris local storage acceleration to speed up data lake analytics.

#### Data Warehouse Layering

- **Description**: The base table contains a large amount of raw data, and queries require complex ETL operations.
- **Benefit**: Build multi-layer async materialized views over the data to implement data warehouse layering.

### Scenarios Not Recommended

#### Frequently Updated Base Tables

- **Description**: Source table data changes very frequently (such as multiple updates per minute).
- **Issue**: Async materialized views are hard to keep in sync, and refresh costs are too high. Consider periodic refresh instead.

#### Simple Queries

- **Description**: Queries that involve only a single-table scan or simple filtering.
- **Issue**: The benefit of an async materialized view does not offset the refresh cost.

#### Scenarios Requiring Real-Time Data (Within 1 to 5 Minutes)

- **Description**: The business requires data to always be the latest version.
- **Issue**: Async materialized views have data latency.

#### Very Small Source Tables

- **Description**: The base table has only a small number of records (such as a few hundred rows).
- **Issue**: The optimization benefit of an async materialized view is not significant.

---

## 2. Usage Principles

<!-- Knowledge type: principles and constraints -->

### 2.1 When to Use Async Materialized Views

| Dimension | Description |
| --- | --- |
| Timeliness | Suitable for scenarios where data timeliness requirements are not high (such as T+1 data). For high timeliness requirements, use synchronous materialized views. |
| Acceleration and consistency | Group common query SQL patterns with as little overlap between groups as possible. The clearer the grouping, the higher the build quality. |
| Reusability | One query can use multiple materialized views, and one materialized view can be used by multiple queries. |
| Trade-offs | Consider together the response time when hitting a materialized view (acceleration), build cost, and data consistency requirements. |

### 2.2 Trade-off Between Materialized View Definition and Build Cost

- **Definition close to the original query**: Strong acceleration, but poor generality and reusability, with high build cost.
- **More general definition** (such as without WHERE conditions or with more aggregation dimensions): Lower acceleration, but better generality and reusability, with lower build cost.

:::caution Note

- **Control the number of materialized views**: More materialized views are not always better. Building and refreshing them consumes resources, and the CBO also takes time to choose the optimal materialized view during transparent rewrite. In theory, the more materialized views, the longer the transparent rewrite time.
- **Periodically review usage status**: Unused materialized views should be deleted in a timely manner.
- **Base table update frequency**: Frequent updates to the base table cause materialized views to be invalidated frequently and unable to be used for transparent rewrite (direct queries are still possible). To use transparent rewrite in this scenario, you must allow some latency in queried data, which can be configured via `grace_period`. See the `grace_period` description for details.

:::

---

## 3. Refresh Strategy Selection

<!-- Knowledge type: decision guide -->

Async materialized views provide three main refresh strategies: **manual refresh**, **scheduled refresh**, and **trigger-based refresh**. Choosing an appropriate refresh strategy is critical for balancing data freshness and system performance.

### 3.1 Prefer Partitioned Materialized Views

When all of the following conditions are met, building a partitioned materialized view is recommended:

1. The base table of the materialized view has a large amount of data and is a partitioned table.
2. Non-partitioned tables referenced by the materialized view do not change frequently.
3. The materialized view definition SQL and partition fields meet partition derivation requirements (that is, they meet the partition incremental update requirements). For detailed requirements, see [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters).
4. The materialized view does not have many partitions. Too many partitions cause excessively long build times.

> When some partitions of a materialized view are invalidated, transparent rewrite can still use the valid partitions UNION ALL with the base table to return data.

If a partitioned materialized view cannot be built, consider using a materialized view with **full refresh**.

### 3.2 Comparison of the Three Refresh Strategies

| Refresh Strategy | Trigger Method | Data Freshness | Automation Level | Main Risk |
|---|---|---|---|---|
| Manual refresh | Explicit user command or external scheduling | Low, depends on scheduling | Low | Scheduling must be self-managed |
| Scheduled refresh | At fixed time intervals (minimum minute level) | Medium, deterministic latency | Medium | High frequency continuously occupies resources |
| Trigger-based refresh | Automatically triggered when base table data changes | High | High | May cause refresh storms |

### 3.3 Detailed Refresh Strategies

#### Manual Refresh

- **How it works**: Triggered by users via explicit commands or external system scheduling.
- **Applicable scenarios**:
    - Reporting systems with low real-time requirements
    - Historical data analysis in data warehouses
    - Scenarios that need to refresh in sync with specific business processes
    - Large-scale data refreshes that need to coordinate system resources
- **Pros**: Full control over refresh timing, can avoid business peak hours.
- **Cons**: Requires extra refresh scheduling management and good fault tolerance to avoid external loops continuously triggering refreshes.

#### Scheduled Refresh

- **How it works**:
    - Automatically refreshes at fixed time intervals
    - Minimum time unit is at the minute level
    - The start time of the first task run can be specified
- **Applicable scenarios**:
    - Periodic business metric monitoring
    - Tiered data pipelines
    - Reporting systems with tiered time sensitivity
    - Source data with regular fluctuations
- **Pros**: Scheduled data processing with deterministic data latency.
- **Cons**: Limited data freshness, and the refresh sequence of related views must be manually coordinated.
- **Configuration constraints**: Setting all materialized views to high-frequency scheduled refresh to approach real-time is not recommended, because it causes:
    - Continuous occupation of system resources
    - Refresh jobs competing with each other for resources
    - Frequent addition and removal of partitions / tablets, which puts heavy pressure on BE

#### Trigger-Based Refresh

- **How it works**: Automatically triggers a refresh when base table data changes.
- **Applicable scenarios**:
    - Upper-layer views in a multi-layer materialized view architecture
    - Scenarios where base table change frequency is low
- **Pros**: High data freshness, high automation.
- **Cons**: May cause refresh storms, and system load is hard to predict.
- **Configuration constraints**: Trigger-based refresh on base-layer materialized views is not recommended unless:
    - You can confirm the base table refresh frequency is low (for example, changes every few tens of minutes)

### 3.4 Recommendations for Combining Refresh Strategies

#### By Data Warehouse Layer

| View Layer | Recommended Refresh Strategy |
|---|---|
| Base layer | Scheduled refresh (such as hourly) |
| Middle layer | Scheduled refresh or trigger-based refresh |
| Presentation layer | Trigger-based refresh or manual refresh |

#### By Business Criticality

| Business Level | Recommended Strategy |
|---|---|
| Critical real-time business data | Async materialized views are not recommended |
| Regular analytical data | Scheduled refresh (daily / hourly) |
| Historical / archived data | Manual refresh |

#### By Data Change Frequency

| Change Frequency | Recommended Strategy |
|---|---|
| High-frequency changes | Scheduled refresh (longer interval) or manual refresh |
| Low-frequency changes | Trigger-based refresh or short-interval scheduled refresh |
| Batch changes | Manual refresh after changes |

### 3.5 Refresh Frequency Recommendations

The following are general recommendations. The actual choice should also be evaluated based on system resources, the number of async materialized views, and other business resource usage.

| Actual Refresh Duration | Recommended Refresh Frequency |
|---|---|
| Less than 15 seconds | Greater than or equal to 5 minutes |
| Less than 10 minutes | Greater than or equal to 1 hour |
| Less than 1 hour | Greater than or equal to 1 day |

---

## 4. Partitioned Materialized View Practice

<!-- Applicable scenarios: large partitioned base tables -->

### 4.1 Partition Mapping Relationship

The partitions of a materialized view are created by mapping from base table partitions, generally with a 1:1 or 1:n relationship to the base table partitions. For detailed partition derivation requirements, see [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters) and [Async Materialized View FAQ Q12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-a-partition-materialized-view).

### 4.2 Partition Invalidation and Refresh Behavior

| Trigger | Effect | Response |
| --- | --- | --- |
| Base table partition data changes (insert, delete, etc.) | The corresponding materialized view partition is invalidated. Invalidated partitions cannot be used for transparent rewrite but can still be queried directly. During transparent rewrite, the invalidated partition responds to the query together with the base table | Use `SHOW PARTITIONS FROM mv_name` to view partition status |
| Referenced non-partitioned table data changes | All partitions of the materialized view are invalidated, and it cannot be used for transparent rewrite | Run `REFRESH MATERIALIZED VIEW mv1 AUTO;` to refresh all partitions where data has changed |
| Referenced non-partitioned tables only insert and never modify data | By default, all partitions are invalidated | At creation, specify `excluded_trigger_tables = 'non_partitioned_table_name1,non_partitioned_table_name2'`. The next refresh will only refresh the invalidated partitions corresponding to the partitioned table |

> **Design recommendation**: Place tables with frequently changing data in the partitioned table referenced by the partitioned materialized view, and place dimension tables that change infrequently in non-referenced partitioned positions.

### 4.3 Partition-Granularity Transparent Rewrite

Transparent rewrite for a partitioned materialized view operates at **partition granularity**:

- Even if some partitions of the materialized view are invalidated, it can still be used for transparent rewrite.
- However, if a query targets only one partition and that partition is invalidated, the materialized view cannot be used for this transparent rewrite.

### 4.4 Complete Example

**Goal**: Build a daily-granularity partitioned materialized view to accelerate queries that aggregate by day.

**Step 1**: Create the daily-partitioned base table `lineitem` and prepare the dimension table `partsupp`.

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL, 
    l_partkey INTEGER NOT NULL, 
    l_suppkey INTEGER NOT NULL, 
    l_linenumber INTEGER NOT NULL, 
    l_ordertime DATETIME NOT NULL, 
    l_quantity DECIMALV3(15, 2) NOT NULL, 
    l_extendedprice DECIMALV3(15, 2) NOT NULL, 
    l_discount DECIMALV3(15, 2) NOT NULL, 
    l_tax DECIMALV3(15, 2) NOT NULL, 
    l_returnflag CHAR(1) NOT NULL, 
    l_linestatus CHAR(1) NOT NULL, 
    l_shipdate DATE NOT NULL, 
    l_commitdate DATE NOT NULL, 
    l_receiptdate DATE NOT NULL, 
    l_shipinstruct CHAR(25) NOT NULL, 
    l_shipmode CHAR(10) NOT NULL, 
    l_comment VARCHAR(44) NOT NULL
) DUPLICATE KEY(
    l_orderkey, l_partkey, l_suppkey, 
    l_linenumber
) PARTITION BY RANGE(l_ordertime) (
    FROM 
      ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES      
(1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
(1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
(2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy');

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES     
(2, 3, 9, 10.01, 'supply1'),     
(4, 3, 9, 10.01, 'supply2'),     
(5, 6, 9, 10.01, 'supply3'),     
(6, 5, 10, 11.01, 'supply4');
```

**Step 2**: A typical query that aggregates by day.

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```

**Step 3**: Build a daily-partitioned materialized view with the same partition granularity as the base table, aggregating data by day.

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

### 4.5 Retain Only the Most Recent Partition Data

:::tip Tip
This feature is supported starting from Apache Doris 2.1.1.
:::

A materialized view can retain data only for the most recent few partitions and automatically delete expired partition data on each refresh. Configure this with the following properties:

| Property | Description |
| --- | --- |
| `partition_sync_limit` | When the base table partition field is a time type, configure the partition range to sync from the base table (used together with `partition_sync_time_unit`). For example, setting it to `3` with unit `DAY` means only the last 3 days of partitions and data are synced from the base table |
| `partition_sync_time_unit` | The time unit for partition refresh. Supports `DAY` / `MONTH` / `YEAR`, defaults to `DAY` |
| `partition_date_format` | When the base table partition field is a string, the date format required to use the `partition_sync_limit` capability |

The materialized view below retains only the most recent 3 days of data. If there is no data in the last 3 days, querying the materialized view directly returns no data.

```sql
CREATE MATERIALIZED VIEW latest_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
PROPERTIES (
  "partition_sync_limit" = "3", 
  "partition_sync_time_unit" = "DAY", 
  "partition_date_format" = "yyyy-MM-dd"
)       
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

---

## 5. How to Use Materialized Views to Accelerate Queries

<!-- Knowledge type: operational guide -->

### 5.1 General Approach

To use a materialized view to accelerate queries, follow these steps:

1. View the profile file and find the most time-consuming operation in the query. The bottleneck is typically in: Join, Aggregate, Filter, or Calculated Expressions.
2. Build a corresponding materialized view targeting the bottleneck operator. For example, if Join consumes a lot of compute resources while Aggregate consumes relatively little, build a materialized view targeting Join.

### 5.2 Build Recommendations for the Four Operation Types

#### 5.2.1 For Join

- Extract common table join patterns used in queries to build a materialized view. Hits save the Join computation.
- **Remove filters from the query** to obtain a more general Join materialized view.

#### 5.2.2 For Aggregate

- Use **low-cardinality fields** as dimensions for the materialized view to minimize data size after aggregation.
- The aggregation granularity of the materialized view should be finer than the query (that is, the materialized view aggregation dimensions include the query's aggregation dimensions), and the aggregation functions in the materialized view should also include those in the query.

**Cardinality assessment example**:

- Table `t1` has 1,000,000 rows, and the query includes `GROUP BY a, b, c`:
    - If the cardinalities of a, b, and c are 100, 50, and 15 respectively, the aggregated result is about 75,000 rows. **The materialized view is effective**.
    - If a, b, and c are correlated, the post-aggregation data size shrinks further.
    - If c has a cardinality of 3,500, the aggregated result is about 17,000,000 rows, larger than the original table. **A materialized view is not suitable**.

#### 5.2.3 For Filter

- If queries frequently filter on the same fields, add corresponding filters to the materialized view to reduce its data size.
- **The materialized view's filter should be less restrictive than the query's**, and the query's filter should include the materialized view's filter.

For example, if the query is `a > 10 AND b > 5`:

- The materialized view can have no filter at all,
- Or have a broader-range filter such as `a > 5 AND b > 5` or `a > 5`.

#### 5.2.4 For Calculated Expressions

- Precomputing high-cost expressions such as `CASE WHEN` or string processing can significantly improve query performance.
- The number of columns in a single materialized view should not be too large. Group by query SQL pattern and build separate materialized views for each group.

**Complete example for accelerating aggregation queries**:

Query 1:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_partkey;
```

Query 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey;
```

For the queries above, build a more general aggregation materialized view: include both `l_partkey` and `l_suppkey` as aggregation dimensions, and use `o_orderdate` as a filter condition. Note: `o_orderdate` is used not only in materialized view condition compensation but must also be included in the aggregation dimensions. This way both Query 1 and Query 2 can hit the materialized view:

```sql
CREATE MATERIALIZED VIEW common_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate;
```

---

## 6. Typical Use Cases

<!-- Knowledge type: scenario examples -->

### 6.1 Scenario 1: Query Acceleration

**Applicable scenarios**: BI reporting or other scenarios sensitive to query response time, requiring results in seconds. Multi-table Joins followed by aggregation consume significant compute resources, making timeliness hard to guarantee. Async materialized views support both direct queries and transparent rewrite. The optimizer automatically selects the optimal materialized view based on the rewrite algorithm and cost model.

#### Use Case 1: Multi-Table Join Aggregation Query Acceleration

Build a more general materialized view to accelerate multi-table join aggregation queries.

**Goal**: Build a single materialized view that satisfies all three of the queries below.

Query 1:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01';
```

Query 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

Query 3:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Build option 1**: A general Join materialized view. Remove the filter conditions of Query 1 and Query 2, and precompute `l_extendedprice * (1 - l_discount)`:

```sql
CREATE MATERIALIZED VIEW common_join_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Build option 2**: If the materialized view above does not meet the acceleration performance requirement of Query 2, build an additional aggregation materialized view. Remove the filter on `o_orderdate` to keep it general:

```sql
CREATE MATERIALIZED VIEW target_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

#### Use Case 2: Log Query Acceleration

**Applicable scenarios**: The base table is typically partitioned by hour, and queries are single-table aggregations with filters mostly on time and identifier flags. When response speed is not satisfactory, **async and synchronous materialized views can be used together**.

**Step 1**: Base table definition.

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT 'identifier', 
`event_id` VARCHAR(128) NULL COMMENT 'identifier', 
`decision` VARCHAR(32) NULL COMMENT 'enum value', 
`time` DATETIME NULL COMMENT 'query time', 
`id` VARCHAR(35) NOT NULL COMMENT 'id', 
`code` VARCHAR(64) NULL COMMENT 'identifier', 
`event_type` VARCHAR(32) NULL COMMENT 'event type' 
)
DUPLICATE KEY(app_name, event_id)
PARTITION BY RANGE(time)                                    
(                                                                                                                                      
    FROM ("2024-07-01 00:00:00") TO ("2024-07-15 00:00:00") INTERVAL 1 HOUR                                                                     
)     
DISTRIBUTED BY HASH(event_id)
BUCKETS 3;
```

**Step 2**: Build a materialized view aggregated by minute to achieve a certain level of aggregation.

```sql
CREATE MATERIALIZED VIEW sync_mv
AS
SELECT 
  decision,
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  DATE_FORMAT(
    `time`, '%Y-%m-%d'
  ), 
  cast(FLOOR(MINUTE(time) / 15) AS decimal(9, 0)),
  count(id) AS cnt
FROM 
  test 
GROUP BY 
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  decision, 
  DATE_FORMAT(time, '%Y-%m-%d'), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

**Step 3**: A typical query.

```sql
SELECT 
    decision, 
    CONCAT(
        CONCAT(
          DATE_FORMAT(
            `time`, '%Y-%m-%d'
          ), 
          '', 
          LPAD(
            cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) AS time, 
      count(id) AS cnt 
FROM 
  test 
WHERE 
  date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
  AND '2024-07-03 20:00:00' 
GROUP BY 
  decision, 
  DATE_FORMAT(
    `time`, "%Y-%m-%d"
  ), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

### 6.2 Scenario 2: Data Modeling (ETL)

**Applicable scenarios**: Data analysis often requires joining and aggregating multiple tables, with complex and repeated queries leading to high latency and heavy resource consumption. Use async materialized views to build a layered data model. You can build higher-level materialized views on top of existing materialized views (supported from 2.1.3).

**Choosing trigger methods for different layers**:

- First-layer scheduled refresh + second-layer trigger refresh: When the first layer finishes refreshing, the second layer is automatically triggered.
- All layers use scheduled refresh: When the second layer refreshes, it does not consider whether the first layer is in sync with the base table, and only processes and syncs first-layer data to the second layer.

The following example uses the TPC-H dataset to analyze the order count and profit per region and country per month.

**Original query (without materialized views)**:

```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') AS month,
count(distinct o.o_orderkey) AS order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) AS revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```

**Step 1**: Build the DWD layer (detail data) - the order detail wide table.

```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name AS nation_name,
r.r_name AS region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
FROM orders o
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
JOIN lineitem l ON o.o_orderkey = l.l_orderkey;
```

**Step 2**: Build the DWS layer (summary data) - daily order summary.

```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
date_trunc(o_orderdate, 'month') AS month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) AS order_count,
sum(l_extendedprice * (1 - l_discount)) AS net_revenue
FROM dwd_order_detail
GROUP BY
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```

**Step 3**: Use the materialized view to optimize the query.

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) AS revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```

### 6.3 Scenario 3: Lakehouse Federated Data Query

**Applicable scenarios**: Modern data architectures often adopt a lakehouse design to balance storage cost and query performance. This architecture has two main challenges:

- **Limited query performance**: Frequent queries against the data lake are affected by network latency and third-party services, leading to query latency.
- **Complex data layered modeling**: Moving and transforming data from the data lake to a real-time data warehouse usually requires complex ETL with high maintenance cost.

**How Doris async materialized views address these issues**:

- **Transparent rewrite to accelerate queries**: Materialize commonly used data lake query results into Doris internal storage, and use transparent rewrite to improve query performance.
- **Simplified layered modeling**: Support creating materialized views on top of tables in the data lake, making it easy to convert from a data lake to a real-time data warehouse.

The example below uses Hive.

**Step 1**: Create a Catalog based on Hive (using the TPC-H dataset).

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

**Step 2**: Create a materialized view based on the Hive Catalog.

```sql
-- Materialized views can only be created on the internal catalog. Switch to the internal catalog
SWITCH internal;
CREATE DATABASE hive_mv_db;
USE hive_mv_db;

CREATE MATERIALIZED VIEW external_hive_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 12
AS
SELECT
n_name,
o_orderdate,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
GROUP BY
n_name,
o_orderdate;
```

**Step 3**: Run the query and accelerate it automatically via transparent rewrite using the materialized view.

```sql
SELECT
n_name,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
AND o_orderdate >= DATE '1994-01-01'
AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
GROUP BY
n_name
ORDER BY
revenue DESC;
```

:::tip Tip

Doris cannot currently detect data changes in external tables other than Hive. When external table data is inconsistent, using a materialized view may produce inconsistent data.

**External-table transparent rewrite switch** (default `false`): Whether materialized views participating in transparent rewrite are allowed to contain external tables. If you can accept data inconsistency or can ensure consistency through scheduled refresh, enable it:

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

**Troubleshooting when a rewrite is not chosen**: If the materialized view is in `MaterializedViewRewriteSuccessButNotChose` status, the rewrite succeeded but the plan was not chosen by the CBO. This may be due to incomplete external table statistics.

Enable getting row counts from files:

```sql
SET enable_get_row_count_from_file_list = true;
```

View external table statistics to confirm whether they have been collected completely:

```sql
SHOW TABLE STATS external_table_name;
```

:::

### 6.4 Scenario 4: Improve Write Efficiency and Reduce Resource Contention

**Applicable scenarios**: High-throughput data write scenarios that need stable system performance and efficient data processing. Through the flexible refresh strategies of async materialized views, you can reduce write pressure and avoid resource contention.

When base table data changes, the materialized view refresh is not triggered immediately. Delayed refresh helps reduce resource pressure and avoid contention with write operations.

**Example**: A scheduled refresh strategy that refreshes every 2 hours. When data is loaded into `orders` and `lineitem`, the materialized view refresh is not triggered immediately.

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### Transparent Rewrite Improves Load Efficiency

Transparent rewrite not only accelerates queries but can also rewrite load SQL, thereby improving load efficiency. Starting from **version 2.1.6**, when a materialized view is strongly consistent with the base table, DML operations (such as `INSERT INTO` or `INSERT OVERWRITE`) can be transparently rewritten, providing significant performance gains in data load scenarios.

**Step 1**: Create the target table for the `INSERT INTO` data.

```sql
CREATE TABLE IF NOT EXISTS target_table  (
orderdate      DATE NOT NULL,
shippriority   INTEGER NOT NULL,
linestatus     CHAR(1) NOT NULL,
sale           DECIMALV3(15,2) NOT NULL
)
DUPLICATE KEY(orderdate, shippriority)
DISTRIBUTED BY HASH(shippriority) BUCKETS 3;
```

**Step 2**: Create the `common_schedule_join_mv` materialized view.

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Step 3**: The load statement before rewrite.

```sql
INSERT INTO target_table
SELECT
o_orderdate,
o_shippriority,
l_linestatus,
l_extendedprice * (1 - l_discount)
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Step 4**: The equivalent statement after transparent rewrite.

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

:::caution Note

If the DML operates on an external table whose data changes cannot be detected, transparent rewrite may cause the latest data in the base table to not be loaded into the target table in real time. If you can accept data inconsistency or can ensure consistency yourself, you can enable the following switch.

For DML, when the materialized view contains an external table whose data changes cannot be detected in real time, whether to enable structure-based transparent rewrite of the materialized view (disabled by default):

```sql
SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;
```

:::

---

## 7. Operational Considerations

<!-- Knowledge type: operational recommendations -->

Async materialized views are essentially enhanced ETL computations and require ongoing maintenance. The following three points are key to daily operations.

1. **Monitoring**: After a materialized view starts running, monitor system status via [metrics](../../../admin-manual/maint-monitor/metrics.md) in a timely manner. Async materialized views will expose more monitoring metrics in the future. Currently, you can use [tasks](../../../sql-manual/sql-functions/table-valued-functions/tasks.md) to view information such as the number of tasks, execution status, and task duration.
2. **Planning**: Plan the number of materialized views, refresh frequency, and the maximum cluster compute capacity. Do not "just build materialized views without maintaining them." A materialized view is essentially an enhanced ETL computation and requires maintenance just like traditional ETL.
3. **Resource isolation**: A materialized view is a data computation task, so apply resource isolation as needed.

---

## FAQ

**Q1: Can async materialized views completely replace real-time queries?**

No. Async materialized views have data latency (depending on the refresh strategy) and are not suitable for scenarios that require data freshness within 1 to 5 minutes. For scenarios with high timeliness requirements, consider synchronous materialized views.

**Q2: Can I set all materialized views to high-frequency scheduled refresh to approach real-time?**

Not recommended. Doing so causes continuous occupation of system resources, refresh jobs competing with each other, and frequent addition and removal of partitions / tablets, which puts heavy pressure on BE.

**Q3: How do I choose a refresh strategy?**

Refer to [Comparison of the Three Refresh Strategies](#32-comparison-of-the-three-refresh-strategies) and [Recommendations for Combining Refresh Strategies](#34-recommendations-for-combining-refresh-strategies), and match by data warehouse layer, business criticality, or data change frequency. First evaluate whether you can build a [partitioned materialized view](#31-prefer-partitioned-materialized-views).

**Q4: Do materialized views still need maintenance after they are built?**

Yes. A materialized view is essentially an enhanced ETL computation and requires monitoring, planning, and resource isolation. See [Operational Considerations](#7-operational-considerations) for details.

**Q5: Can I still use transparent rewrite when the base table is updated frequently?**

Frequent updates to the base table cause the materialized view to be invalidated frequently and unable to be used for transparent rewrite (direct queries are still possible). To use transparent rewrite in this scenario, you must allow some latency in queried data, which can be configured via `grace_period`.
