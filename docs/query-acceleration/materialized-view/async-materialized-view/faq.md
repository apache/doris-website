---
title: Async Materialized View FAQ
description: "Quick reference for async materialized view FAQs: how to troubleshoot and resolve build errors, refresh exceptions, transparent rewrite misses, and unavailable states."
keywords:
    - Async Materialized View FAQ
    - materialized view refresh failure
    - transparent rewrite miss
    - partition materialized view error
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
---

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Diagnosing issues during async materialized view build, refresh, and query rewrite -->

This document collects high-frequency questions and troubleshooting approaches encountered when using Async Materialized Views. One-sentence definition: an **async materialized view** is a pre-computed result set that refreshes from base table data on demand or on schedule, and can be used to transparently rewrite queries for acceleration.

## Quick Navigation

<!-- Knowledge type: Index -->
<!-- Applicable scenarios: Quickly locating issues and the corresponding sections -->

Issues are grouped into two categories by user stage, plus an appendix of cause references:

| Scenario category | Issues covered | Keywords |
| --- | --- | --- |
| [Build and refresh](#build-and-refresh) | Creation errors, refresh strategies, schema change, resource consumption | `BUILD`, `REFRESH`, `workload_group` |
| [Query and transparent rewrite](#query-and-transparent-rewrite) | Whether a hit occurred, why it did not, unavailable states | `explain`, `MaterializedViewRewrite`, `grace_period` |
| [Appendix](#appendix) | Transparent rewrite failure cause table, partition build failure cause table | Summary reference tables |

Quick lookup checklist for common problems:

- When creating a partition materialized view fails with `Unable to find a suitable base table for partitioning`, jump to [Q12](#q12-error-when-building-a-partition-materialized-view) and [Appendix 2](#appendix-2-async-materialized-view-partition-build-failure-causes).
- When the create statement reports `Syntax error`, jump to [Q13](#q13-syntax-error-when-creating-a-materialized-view).
- When the refresh succeeds but the materialized view has no data, jump to [Q14](#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh).
- When a partition materialized view performs a full refresh every time, jump to [Q15](#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time).
- When transparent rewrite is not hit, jump to [Query and Transparent Rewrite Q1/Q2](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) and [Appendix 1](#appendix-1-transparent-rewrite-failure-summary-information).

## Build and Refresh

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Issues during materialized view creation, refresh, and modification -->

### Q1: How does the materialized view determine which partitions need to be refreshed?

Doris internally computes the partition mapping between the materialized view and the base tables, and records the base table partition versions used at the last successful refresh. On the next refresh, Doris compares the current versions to determine whether a partition needs to be refreshed.

**Example**: Materialized view `mv1` is created from base tables `t1` and `t2`, and is partitioned based on `t1`. Suppose partition `p202003` of `mv1` corresponds to partitions `p20200301` and `p20200302` of `t1`:

- After refreshing `p202003`, the current versions of `p20200301`, `p20200302`, and table `t2` are recorded.
- On the next refresh, if the version of `p20200301`, `p20200302`, or `t2` has changed, `p202003` needs to be refreshed.

**Business exclusion**: If, from a business perspective, changes in `t2` should not trigger a refresh of `mv1`, you can configure this through the materialized view property `excluded_trigger_tables`.

### Q2: What if the materialized view consumes too many resources and affects other workloads?

You can specify a [workload_group](../../../admin-manual/workload-management/workload-group.md) through a materialized view property to control the resource usage of the materialized view refresh task.

**Caveats**: If the memory setting is too small while a single partition refresh requires more memory, the task will fail to refresh. Balance these settings based on your business needs.

### Q3: Can a new materialized view be created based on an existing materialized view?

Yes, this is supported starting from Doris 2.1.3.

**Note**: The refresh logic of each materialized view is independent. For example, if `mv2` is created based on `mv1`, and `mv1` is created based on `t1`, refreshing `mv2` does not consider whether the data between `mv1` and `t1` is in sync.

### Q4: Which external tables does Doris support for materialized views?

All external tables supported by Doris can be used to create materialized views. However, currently **only Hive supports partition refresh**. Other types will be supported in subsequent releases.

### Q5: The materialized view appears consistent with Hive data, but is actually inconsistent

The materialized view can only guarantee that its data is consistent with the result queried through the Catalog.

Because the Catalog contains some metadata and data caches, to keep the materialized view consistent with the data in Hive, you need to use methods such as `Refresh Catalog` to ensure that the data in the Catalog is consistent with the data in Hive.

### Q6: Does the materialized view support Schema Change?

Modification is not supported. The column attributes of a materialized view are inferred from its defining SQL, and explicit custom modification is not currently supported.

### Q7: Are Schema Changes allowed on the base tables used by a materialized view?

Yes, but the following state changes occur after the modification:

- The state of any materialized view that uses this base table changes from `NORMAL` to `SCHEMA_CHANGE`.
- While in the `SCHEMA_CHANGE` state, the materialized view cannot be used for transparent rewrite, but querying the materialized view directly is still possible.
- If the next refresh task of the materialized view succeeds, the state changes from `SCHEMA_CHANGE` back to `NORMAL`.

### Q8: Can a table with the Unique Key model be used to create a materialized view?

Yes. The materialized view has no requirement on the data model of the base table, but **the materialized view itself can only use the Duplicate Key model**.

### Q9: Can indexes still be created on a materialized view?

Yes.

### Q10: Does refreshing a materialized view lock the table?

The refresh process locks the table only during a very brief stage, but does not hold the table lock continuously (the lock duration is roughly equivalent to the lock duration when loading data).

### Q11: Are materialized views suitable for near-real-time scenarios?

Not really. The minimum unit of materialized view refresh is a partition, which consumes considerable resources when the data volume is large, and the freshness is not sufficient. Synchronous materialized views or other approaches are recommended instead.

### Q12: Error when building a partition materialized view

**Error message**:

```text
Unable to find a suitable base table for partitioning
```

**Cause analysis**:

This is usually caused by the materialized view's SQL definition and the choice of partition column making incremental partition updates impossible, which leads to an error when creating the partition materialized view:

- For the materialized view to perform incremental partition updates, the corresponding requirements must be met. For details, see [Materialized view refresh modes](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters).
- The latest version can report the specific reason for partition build failure. For a summary of causes and explanations, see [Appendix 2](#appendix-2-async-materialized-view-partition-build-failure-causes).

**Example**:

The two base tables below are `orders` (partitioned) and `lineitem` (not partitioned):

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey INTEGER NOT NULL, 
  o_custkey INTEGER NOT NULL, 
  o_orderstatus CHAR(1) NOT NULL, 
  o_totalprice DECIMALV3(15, 2) NOT NULL, 
  o_orderdate DATE NOT NULL, 
  o_orderpriority CHAR(15) NOT NULL, 
  o_clerk CHAR(15) NOT NULL, 
  o_shippriority INTEGER NOT NULL, 
  O_COMMENT VARCHAR(79) NOT NULL
) DUPLICATE KEY(o_orderkey, o_custkey) PARTITION BY RANGE(o_orderdate) (
  FROM 
    ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;


CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey INTEGER NOT NULL, 
  l_partkey INTEGER NOT NULL, 
  l_suppkey INTEGER NOT NULL, 
  l_linenumber INTEGER NOT NULL, 
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
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;
```

The materialized view is defined as follows. If `orders.o_orderdate` is chosen as the partition column, incremental partition updates are supported; conversely, using `lineitem.l_shipdate` cannot achieve incremental updates.

```sql
CREATE MATERIALIZED VIEW mv_1 
       BUILD IMMEDIATE 
       REFRESH AUTO ON MANUAL 
       partition by(o_orderdate) 
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
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

**Why `lineitem.l_shipdate` cannot be chosen as the partition column**:

1. `lineitem.l_shipdate` is not a partition column of the base table; in fact, the `lineitem` table has no partition column configured.
2. `lineitem.l_shipdate` is a column on the side that produces `null` values in the `outer join` operation.

### Q13: Syntax error when creating a materialized view

**Error message**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

**Possible causes**:

1. Async materialized view statements are only supported under the new optimizer. Make sure the new optimizer is in use:

    ```sql
    SET enable_nereids_planner = true;
    ```

2. The statement that builds the materialized view contains **misspelled keywords** or the **defining SQL has syntax issues**. Check whether the materialized view definition SQL and the create statement are correct.

### Q14: The materialized view still has no data after a successful refresh

When the materialized view determines whether data needs to be updated, it depends on being able to obtain version information for the base table or its partitions.

For data lakes that currently do not support obtaining version information (for example, JDBC Catalog), the refresh treats the materialized view as not requiring an update. **Therefore, when creating or refreshing such materialized views, specify `complete` instead of `auto`**.

For the progress of materialized view support for data lakes, refer to [Data lake support](./overview.md).

### Q15: Why does a partition materialized view do a full refresh every time?

Incremental partition refresh of the materialized view depends on the version information of the base table partitions. If the base table partition data corresponding to a materialized view partition has changed since the last refresh, only that partition is refreshed.

**Possible cause**:

The data of a **non-partition-tracking table** in the materialized view's defining SQL has changed, making it impossible to determine which partitions need to be updated during refresh, so only a full refresh is possible.

**Example**:

This materialized view tracks the `o_orderdate` partition of the `orders` table. However, when `lineitem` or `partsupp` data changes, the materialized view cannot determine which partitions need to be updated and can only do a full refresh.

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE 
REFRESH AUTO 
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00' 
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2 
PROPERTIES 
("replication_num" = "3") 
AS 
SELECT 
o_orderdate, 
l_orderkey, 
l_partkey 
FROM 
orders 
LEFT JOIN lineitem ON l_orderkey = o_orderkey 
LEFT JOIN partsupp ON ps_partkey = l_partkey 
and l_suppkey = ps_suppkey;
```

**Troubleshooting steps**:

- **Goal**: View the base tables and partition columns tracked by the materialized view.
- **Command**:

    ```sql
    SELECT * 
    FROM mv_infos('database'='db_name')
    WHERE Name = 'partition_mv' \G 
    ```

- **Explanation**: In the result, `MvPartitionInfo.partitionType` being `FOLLOW_BASE_TABLE` indicates that the materialized view partition follows the base table partition; `relatedCol` being `o_orderdate` indicates partitioning based on this column.

    ```text
                    Id: 1752809156450
                  Name: partition_mv
               JobName: inner_mtmv_1752809156450
                 State: NORMAL
    SchemaChangeDetail: 
          RefreshState: SUCCESS
           RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 DAY STARTS "2025-12-01 20:30:00"
              QuerySql: SELECT
                        `internal`.`doc_db`.`orders`.`o_orderdate`,
                        `internal`.`doc_db`.`lineitem`.`l_orderkey`,
                        `internal`.`doc_db`.`lineitem`.`l_partkey`
                        FROM
                        `internal`.`doc_db`.`orders`
                        LEFT JOIN `internal`.`doc_db`.`lineitem` ON `internal`.`doc_db`.`lineitem`.`l_orderkey` = `internal`.`doc_db`.`orders`.`o_orderkey`
                        LEFT JOIN `internal`.`doc_db`.`partsupp` ON `internal`.`doc_db`.`partsupp`.`ps_partkey` = `internal`.`doc_db`.`lineitem`.`l_partkey`
                        and `internal`.`doc_db`.`lineitem`.`l_suppkey` = `internal`.`doc_db`.`partsupp`.`ps_suppkey`
       MvPartitionInfo: MTMVPartitionInfo{partitionType=EXPR, relatedTable=orders, relatedCol='o_orderdate', partitionCol='o_orderdate'}
    SyncWithBaseTables: 1
    ```

**Solution**:

If changes to the `lineitem` or `partsupp` table data have no impact on the materialized view, you can set the `excluded_trigger_tables` property to exclude full refreshes triggered by changes in these tables:

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

## Query and Transparent Rewrite

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Diagnosing materialized view hit rate and transparent rewrite failures -->

### Q1: How to confirm whether a query hits the materialized view

You can use `explain query_sql` to view the summary of the materialized view hit status.

**Example materialized view**:

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**Run explain**:

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**Interpreting the result**:

The materialized view hit information is in the last part of the plan. The key fields have the following meanings:

| Field | Meaning |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | List of materialized view names where transparent rewrite succeeded and the CBO ultimately chose to use them |
| `MaterializedViewRewriteSuccessButNotChose` | List of materialized view names where transparent rewrite succeeded, but the CBO did not choose them (the execution plan does not use them) |
| `MaterializedViewRewriteFail` | Lists materialized views for which transparent rewrite failed, along with a summary of the reasons |

If no `MaterializedView` related information appears at the end of `explain`, the materialized view is in an unavailable state and therefore cannot participate in transparent rewrite (for situations that cause a materialized view to be unavailable, refer to Usage and Practice - View Materialized View Status).

**Example output**:

```text
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```

### Q2: What are the reasons for a materialized view not being hit?

First confirm whether a hit occurred, following [Q1](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view):

```sql
explain
your_query_sql;
```

**Possible reasons for a miss**:

1. In versions before Doris 2.1.3, the transparent rewrite feature for materialized views is disabled by default. The corresponding switch must be turned on for transparent rewrite to take effect. For the specific switches, refer to the async materialized view related switches.
2. The materialized view may be in an unavailable state. To view the build status of a materialized view, refer to View Materialized View Status.
3. If a hit still does not occur after the previous two checks, the materialized view's defining SQL and the query SQL may be outside the current scope of transparent rewrite capabilities. For details, refer to [Materialized View Transparent Rewrite Capabilities](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite).
4. For detailed summary information and explanations of failed hits, see [Appendix 1](#appendix-1-transparent-rewrite-failure-summary-information).

The two examples below illustrate common transparent rewrite failure scenarios.

#### Case 1: Inconsistent join order causes rewrite failure

**Create the materialized view**:

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**Run the query**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain output**:

```text
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

`MaterializedViewRewriteFail` contains the failure summary `The graph logic between query and view is not consistent`, which indicates that the join logic of the query and the materialized view are inconsistent (the join types or the joined tables differ). In this example, the join order of the tables in the query and the materialized view is inconsistent, so this error is reported. For complete summary explanations, see [Appendix 1](#appendix-1-transparent-rewrite-failure-summary-information).

#### Case 2: Dimensions not covered by the materialized view

**Run the query**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain output**:

```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

The failure summary `View dimensions doesn't not cover the query dimensions` indicates that the `group by` columns in the query cannot be obtained from the `group by` columns of the materialized view, so this error is reported.

### Q3: What situations cause a materialized view's state to change and become unavailable?

"Unavailable" means **the materialized view cannot be used for transparent rewrite**, but the materialized view itself can still be queried directly.

| Materialized view type | Event that triggers unavailability | Scope of impact |
| --- | --- | --- |
| Full materialized view | Base table data change / base table schema change | The entire materialized view is unavailable |
| Partition materialized view | Base table data change | The corresponding partition is unavailable |
| Partition materialized view | Base table schema change | The entire materialized view is unavailable |

Currently, a refresh failure also makes the materialized view unavailable. This will be optimized in the future: even if the refresh fails, the existing materialized view will still be usable for transparent rewrite.

### Q4: Direct query on the materialized view returns no data

Possible causes:

- The materialized view is being built.
- The materialized view build has failed.

You can confirm by querying the materialized view status. For details, refer to View Materialized View Status.

### Q5: When base table data changes but the materialized view has not been refreshed, what is the transparent rewrite behavior?

The data of an async materialized view has a certain delay relative to the base tables. The transparent rewrite behavior depends on the base table type and the `grace_period` threshold.

**1. Internal tables and external tables that can detect data changes (such as Hive)**:

`grace_period` is the maximum time period during which the materialized view is allowed to be inconsistent with the base table data:

| `grace_period` setting | Rewrite behavior |
| --- | --- |
| `0` | Requires the materialized view and base table data to be fully consistent before it can be used for transparent rewrite; for external tables that cannot detect data changes (other than Hive), the materialized view can be used for transparent rewrite regardless of whether the data is up to date (the data may be inconsistent) |
| `10` (seconds) | Allows the materialized view and base table data to have a delay of at most 10 seconds. While the delay is within 10 seconds, the materialized view can still be used for transparent rewrite |

**2. Partition materialized view, when some partitions are invalid**:

- If the query does not use data from invalid partitions: the materialized view is still available.
- If the query uses data from invalid partitions and the data freshness is within `grace_period`: the materialized view is still available.
- If the data freshness exceeds `grace_period`: the query can be served by combining the original tables with the materialized view. This requires enabling the union rewrite switch `enable_materialized_view_union_rewrite` (this switch is enabled by default starting from version 2.1.5).

## Appendix

### Appendix 1: Transparent rewrite failure summary information

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating the cause of transparent rewrite failure based on the FailSummary in explain output -->

| Summary information | Explanation |
| --- | --- |
| View struct info is invalid | The structural information of the materialized view is invalid. The currently supported rewrite SQL patterns are: query is a join and the materialized view is also a join; query is an agg and the materialized view does not need to have a join. During transparent rewrite, this issue is shown in most cases, because each transparent rewrite rule handles a particular SQL pattern, and a rule that does not match the requirements reports this error when hit. It is generally not the main reason for transparent rewrite failure |
| Materialized view rule exec fail | The transparent rewrite rule threw an exception during execution. Use `Explain memo plan query_sql` to view the specific exception stack |
| Match mode is invalid | The number of tables in the query and the materialized view is inconsistent; rewrite is not supported for now |
| Query to view table mapping is null | Failed to generate the table mapping between the query and the materialized view |
| queryToViewTableMappings are over the limit and be intercepted | The query has too many self-joined tables, causing the transparent rewrite search space to expand too much, so transparent rewrite is stopped |
| Query to view slot mapping is null | Failed to generate the slot mapping between the query tables and the materialized view tables |
| The graph logic between query and view is not consistent | The join types of the query and the materialized view are different, or the joined tables differ |
| Predicate compensate fail | Usually the query condition range is outside the materialized view range. For example, the query is `a > 10` but the materialized view is `a > 15` |
| Rewrite compensate predicate by view fail | Predicate compensation failed. Usually, the query has more conditions than the materialized view that need to be compensated, but the columns used in the conditions do not appear in the select clause of the materialized view |
| Calc invalid partitions fail | The partition materialized view failed when calculating whether the partitions used by the query are valid |
| mv can not offer any partition for query | The query only uses invalid partitions of the materialized view. Use `show partitions from mv_name` to check whether the `SyncWithBaseTables` field of the partitions is true. If it is false, manually refresh the corresponding partition; if a certain delay between the materialized view and query data is acceptable, set the `grace_period` property of the materialized view (in seconds) |
| Add filter to base table fail when union rewrite | The query used invalid partitions of the materialized view, and the attempt to union all the materialized view with the original table failed |
| RewrittenPlan output logical properties is different with target group | The rewrite finished, but the output of the materialized view is inconsistent with the original query |
| Rewrite expressions by view in join fail | During join rewrite, fields or expressions used in the query are not in the materialized view |
| Rewrite expressions by view in scan fail | During single-table rewrite, fields or expressions used in the query are not in the materialized view |
| Split view to top plan and agg fail, view doesn't not contain aggregate | When rewriting an aggregation, the materialized view does not contain an aggregation |
| Split query to top plan and agg fail | When rewriting an aggregation, the query does not contain an aggregation |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | When the `group by` clauses of the query and the materialized view are equal, the rewritten expression contains aggregate functions |
| Can not rewrite expression when no roll up | When the `group by` clauses of the query and the materialized view are equal, expression rewrite failed |
| Query function roll up fail | During aggregation rewrite, the aggregate function rollup failed |
| View dimensions do not cover the query dimensions | The `group by` clause of the query uses some dimensions that do not appear in the `group by` clause of the materialized view |
| View dimensions don't not cover the query dimensions in bottom agg | The `group by` clause of the query uses some dimensions that do not appear in the `group by` clause of the materialized view |
| View dimensions do not cover the query group set dimensions | The `group sets` of the query uses some dimensions that do not appear in the `group by` clause of the materialized view |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | The query has a `group by`, but the materialized view does not |
| Both query and view have group sets, or query doesn't have but view has, not supported | Both the query and the materialized view have `group sets`, or the query has no `group sets` but the materialized view does. Transparent rewrite is not supported in this case |

### Appendix 2: Async materialized view partition build failure causes

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating causes when an error is reported while creating a partition materialized view -->

The refresh principle of a partition materialized view is incremental partition update:

1. **Step 1**: Compute whether the partition column of the materialized view can be mapped to the partitions of the base table.
2. **Step 2**: Compute the specific mapping relationship, that is, whether the partition is 1:1 or 1:n.

| Summary information | Explanation |
| --- | --- |
| partition column can not be found in the SQL select column | The column used after `partition by` in the materialized view definition must appear in the select clause of the materialized view's defining SQL |
| can't not find valid partition track column, because %s | No suitable partition column was found. The specific reason follows `because` |
| partition track doesn't support mark join | The column referenced by the materialized view partition column is the partition column of the input table of a mark join, which is not supported |
| partition column is in un supported join null generate side | The column referenced by the materialized view partition column is on the null-generating side of a join, for example, the right side of a left join |
| relation should be LogicalCatalogRelation | The scan type of the partition base table referenced by the materialized view should be `LogicalCatalogRelation`; other types are not supported |
| self join doesn't support partition update | A self-join SQL is not yet supported for building materialized views |
| partition track already has a related base table column | The partition column referenced by the materialized view currently only supports referencing the partition column of one base table |
| relation base table is not MTMVRelatedTableIf | The partition base table referenced by the materialized view does not inherit `MTMVRelatedTableIf`, the interface that indicates whether a table is partitionable |
| The related base table is not partition table | The base table used by the materialized view is not a partitioned table |
| The related base table partition column doesn't contain the mv partition | The column referenced after `partition by` in the materialized view does not exist in the partition base table |
| group by sets is empty, doesn't contain the target partition | The materialized view's defining SQL uses aggregation, but `group by` is empty |
| window partition sets don't contain the target partition | A window function is used, but the partition column referenced by the materialized view is not in the `partition by` clause |
| Unsupported plan operate in track partition | The materialized view's defining SQL uses unsupported operations, such as `order by` |
| context partition column should be slot from column | A window function is used, and the materialized view's referenced partition column in the `partition by` clause is not a plain column but an expression |
| partition expressions use more than one slot reference | The partition column after `group by` or `partition by` is an expression containing multiple columns rather than a plain column. For example, `group by partition_col + other_col` |
| column to check using invalid implicit expression | The materialized view partition column can only use `date_trunc`. Expressions on the partition column are restricted to `date_trunc` and similar |
| partition column time unit level should be greater than SQL select column | The time granularity of `date_trunc` after `partition by` in the materialized view is smaller than the time granularity that appears after the select clause in the materialized view's defining SQL. For example, the materialized view uses `partition by(date_trunc(col, 'day'))`, but the materialized view's defining SQL contains `date_trunc(col, 'month')` after select |
