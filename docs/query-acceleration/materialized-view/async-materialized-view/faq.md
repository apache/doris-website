---
{
  "title": "FAQ",
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

## Build and Refresh

### Q1: How does Doris determine which partitions need to be refreshed for a materialized view?

Doris internally calculates the partition correspondence between the materialized view and the base tables and records the version of the base table partitions used by the materialized view after the last successful refresh. For example, if materialized view, mv1 is created from base tables t1 and t2 and is partitioned based on t1.

Assuming partition p202003 of mv1 corresponds to partitions p20200301 and p20200302 of base table t1, after refreshing p202003, Doris will record partitions p20200301 and p20200302, along with the current version of table t2.

During the next refresh, Doris checks if the versions of p20200301, p20200302, and t2 have changed. If any of them have changed, it indicates that p202003 needs to be refreshed.

Alternatively, if changes to t2 can be accepted without triggering a refresh of mv1, the `excluded_trigger_tables` property of the materialized view can be used to configure this.

### Q2: What can be done if a materialized view consumes too many resources, impacting other business operations?

You can control the resources allocated to materialized view refresh tasks by specifying a [workload_group](../../../admin-manual/resource-admin/workload-group) through the materialized view's properties.

It's important to note that if the memory allocation is too small and the refresh of a single partition requires more memory, the task may fail. This trade-off should be carefully considered based on business requirements.

### Q3: Can a new materialized view be created based on an existing materialized view?

Yes, this is supported starting from Doris 2.1.3. However, each materialized view employs its own refresh logic when updating data. For example, if mv2 is based on mv1, which in turn is based on t1, the synchronization between mv1 and t1 will not be considered during the refresh of mv2.

### Q4: Which external tables are supported by Doris?

All external tables supported by Doris can be used to create materialized views. However, only Hive currently supports partition refreshes, with support for other types planned in the future.

### Q5: The materialized view displays the same data as Hive, but in reality, they are inconsistent.

A materialized view guarantees consistency only with the results obtained through the Catalog. Since the Catalog contains metadata and data caching, to ensure that the materialized view and Hive data remain consistent, you may need to refresh the Catalog using methods such as `REFRESH CATALOG` to synchronize the Catalog data with Hive.

### Q6: Does materialized view support schema change?

No, schema changes are not supported because the column attributes of a materialized view are derived from the SQL definition of the materialized view itself. Explicit custom modifications are not allowed.

### Q7: Can the base tables used by materialized views undergo schema changes?

Yes, schema changes are allowed. However, after the change, the status of the materialized views that use this base table will change from NORMAL to SCHEMA_CHANGE, at which point the materialized view cannot be used for transparent rewriting but direct queries to the materialized view will not be affected. If the next refreshing task of the materialized view is successful, its status will change back to NORMAL.

### Q8: Can tables with the primary key model be used to create materialized views?

There are no restrictions on the data model of the base tables for materialized views. However, the materialized view itself can only be of the detailed model.

### Q9: Can indexes be created on materialized views?

Yes.

### Q10: Does the materialized view lock tables during refresh?

Table locking occurs for a brief period during the refresh but does not continuously occupy table locks (almost equivalent to the locking time during data import).

### Q11: Is the materialized view suitable for near-real-time scenarios?

Not particularly. The minimum unit for refreshing materialized views is the partition, which can consume significant resources for large data volumes and lacks real-time capabilities. Consider using synchronous materialized views or other methods instead.

### Q12: Error encountered when building a partitioned materialized view

Error Message:

```sql
Unable to find a suitable base table for partitioning
```

This error typically indicates that the SQL definition of the materialized view and the choice of partitioning fields do not allow incremental partition updates, resulting in an error during the creation of the partitioned materialized view.

- For incremental partition updates, the materialized view's SQL definition and partitioning field selection must meet specific requirements. See [Materialized View Refresh Modes](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW#refreshmethod) for details.

- The latest code can indicate the reason for partition build failure, with error summaries and descriptions provided in Appendix 2.

Example:

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
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1");


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
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1");
```

The materialized view definition below allows for incremental partition updates if `orders.o_orderdate` is chosen as the partitioning field for the materialized view. Conversely, using `lineitem.l_shipdate` would not enable incremental updates.

Reason:

1. `lineitem.l_shipdate` is not a partitioning column of the base table, and `lineitem` does not have a partitioning column defined.

2. `lineitem.l_shipdate` is the column that generates `null` values during the `outer join` operation.

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL partition by(o_orderdate) DISTRIBUTED BY RANDOM BUCKETS 2 PROPERTIES ('replication_num' = '1') AS 
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

### Q13: Error encountered when creating a materialized view

Error Message:

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

Reasons may be:

1. The statement for creating an asynchronous materialized view is only supported by the new optimizer. Ensure you are using the new optimizer:

    ```sql
    SET enable_nereids_planner = true;
    ```

2. There may be a typographical error in the refresh keywords or a syntax error in the SQL definition of the materialized view. Check the SQL definition and creation statement for the materialized view for correctness.

## Queries and Transparent Rewriting

### Q1: How to confirm if a Materialized View hits, and how to find the reasons for Non-Hits?

You can use `explain query_sql` to view a summary of materialized view hits. 

For example, consider the following materialized view:

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

The query can be:

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

- The materialized view hit information is at the end of the plan.

- **MaterializedViewRewriteSuccessAndChose:** Indicates that transparent rewriting was successful, and lists the names of the materialized views chosen by the Cost-Based Optimizer (CBO).

- **MaterializedViewRewriteSuccessButNotChose:** Indicates that transparent rewriting was successful, but lists the names of materialized views that were not chosen by the CBO. Not choosing them means the execution plan will not use these materialized views.

- **MaterializedViewRewriteFail:** Lists the failures and summaries of the reasons for transparent rewriting failures.

- If there is no `MaterializedView` information at the end of the `explain` output, it means the materialized view is in an unusable state and therefore cannot participate in transparent rewriting. (For details on when a materialized view becomes unusable, refer to the "Usage and Practice - Viewing Materialized View Status" section.)

Here's an example output:

```sql
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```

### Q2: What Are the Reasons for a Materialized View Not Hitting?

First, to confirm if a materialized view hits, execute the following SQL (refer to [Queries and Transparent Rewriting - Q1](#q1-how-does-doris-determine-which-partitions-need-to-be-refreshed-for-a-materialized-view) for details):

```Plain
explain
your_query_sql;
```

If there is no hit, the following reasons may apply:

- In Doris versions before 2.1.3, the transparent rewriting feature for materialized views is disabled by default. You need to enable the corresponding switch to achieve transparent rewriting. For specific switch values, refer to async-materialized view-related switches.

- The materialized view may be in an unusable state, preventing transparent rewriting from hitting it. To view the build status of the materialized view, refer to the section on viewing materialized view status.

- If, after checking the first two steps, the materialized view still does not hit, it may be because SQL defines the materialized view and the query SQL is outside the current rewriting capabilities of the materialized view. Refer to the [Materialized View Transparent Rewriting Capabilities](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands#transparent-rewriting-capability) for details.

- For detailed information and explanations on failed hits, refer to [Appendix 1](#reference).

Here's an example of a failed transparent rewriting for a materialized view:

**Case 1:**

Materialized view creation SQL:

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

Query execution:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

`Explain` output:

```sql
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

In the output, `MaterializedViewRewriteFail` shows a failure summary, where `The graph logic between query and view is not consistent` indicates that the join logic between the query and the materialized view is not the same, meaning the join type or tables joined differ.

In the above example, the table join order in the query and materialized view is inconsistent, hence the error. Refer to Appendix 1 for summaries and explanations of transparent rewriting failures.

**Case 2:**

Query execution:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

`Explain` output:

```sql
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

The failure summary `View dimensions doesn't cover the query dimensions` indicates that the `GROUP BY` fields in the query cannot be obtained from the `GROUP BY` fields of the materialized view, hence the error.

### Q3: What Situations Can Lead to a Materialized View's State Changing and Becoming Unusable?

By "unusable," we mean that the materialized view cannot be used for transparent rewriting, though it can still be queried directly.

- For full materialized views, changes to the underlying table data or Schema Change can render the materialized view unusable.

- For partitioned materialized views, changes to the underlying table data can render the corresponding partitions unusable, while Schema Change of the underlying table can render the entire materialized view unusable.

Currently, failed refreshes of materialized views can also make them unusable. However, optimizations are planned to allow even failed materialized views to be used for transparent rewriting.

### Q4: What If Direct Queries to a Materialized View Return No Data?

It's possible that the materialized view is still being built or that the building has failed.

You can check the status of the materialized view to confirm this. Refer to the section on viewing materialized view status for specific methods.

### Q5: When the Data in the Base Table Used by a Materialized View Changes, but the Materialized View Has Not Yet Been Refreshed, What Is the Behavior of Transparent Rewriting?

There is a certain delay between the data in async-materialized views and the underlying tables.

**1. For internal tables and external tables that can perceive data changes (like Hive): When the underlying table data changes, whether the materialized view is usable depends on the** **`grace_period`** **threshold.**

`grace_period` is the time period that allows for data inconsistency between the materialized view and the underlying table. For example:

- If `grace_period` is set to 0, it means the materialized view must be consistent with the underlying table data for it to be used for transparent rewriting. For external tables (except Hive), since they cannot perceive data changes, materialized views that use them can still be used for transparent rewriting (but the data may be inconsistent).

- If `grace_period` is set to 10 seconds, it allows for up to 10 seconds of delay between the materialized view data and the underlying table data. If the delay is within 10 seconds, the materialized view can still be used for transparent rewriting.

**2. For partitioned materialized views, if some partitions become invalid, there are two scenarios:**

- If the query does not use data from invalid partitions, the materialized view is still usable.

- If the query uses data from invalid partitions, and the data delay is within the `grace_period`, the materialized view is still usable. If the delay exceeds the `grace_period`, the query can be responded to by unioning the original table and the materialized view. This requires enabling the `enable_materialized_view_union_rewrite` switch, which is on by default from version 2.1.5.

## Reference

### 1 Materialized View-Related Configuration

| Configuration                                                | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | Enables the new optimizer required for materialized view rewriting. |
| SET enable_materialized_view_rewrite = true;                 | Enables or disables query rewriting. Default: Enabled.       |
| SET materialized_view_rewrite_enable_contain_external_table = true; | Allows materialized views containing external tables to participate in rewriting. Default: Disabled. |
| SET materialized_view_rewrite_success_candidate_num = 3;     | Maximum number of successful rewrite candidates considered by CBO. Default: 3. |
| SET enable_materialized_view_union_rewrite = true;           | Allows UNION ALL between base tables and materialized views when data is insufficient. Default: Enabled. |
| SET enable_materialized_view_nest_rewrite = true;            | Enables nested materialized view rewriting. Default: Disabled. |
| SET materialized_view_relation_mapping_max_count = 8;        | Maximum number of relation mappings during rewriting. Default: 8. |

### 2 Summary and Description of Transparent Rewriting Failures

| Summary                                                      | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| View struct info is invalid                                  | The structure information of the materialized view is invalid. Currently supported SQL patterns for rewriting include joins in both queries and materialized views, and aggregations in queries with or without joins in materialized views. This error is often displayed during transparent rewriting, as each rewriting rule is responsible for a specific SQL pattern. If a rule is hit that does not match the required pattern, this error will occur, but it is generally not the primary cause of rewriting failure. |
| Materialized view rule exec fail                             | Typically indicates an exception during the execution of the transparent rewriting rule. To investigate, use EXPLAIN memo plan query_sql to view the specific exception stack. |
| Match mode is invalid                                        | The number of tables in the query does not match the number of tables in the materialized view, and rewriting is not supported. |
| Query to view table mapping is null                          | Failed to generate the mapping between the query and materialized view tables. |
| queryToViewTableMappings are over the limit and be intercepted | Too many self-joined tables in the query led to excessive expansion of the rewriting space, stopping transparent rewriting. |
| Query to view slot mapping is null                           | Failed to map slots between the query and materialized view tables. |
| The graph logic between query and view is not consistent     | The join types or joined tables between the query and materialized view are different. |
| Predicate compensate fail                                    | Typically occurs when the query's condition range exceeds that of the materialized view, e.g., query is a > 10 but materialized view is a > 15. |
| Rewrite compensate predicate by view fail                    | Predicate compensation failed, usually because the query has additional conditions that need compensation, but the columns used in those conditions do not appear in the SELECT clause of the materialized view. |
| Calc invalid partitions fail                                 | For partitioned materialized views, attempts to calculate whether partitions used by the query are valid failed. |
| mv can not offer any partition for query                     | All partitions used by the query are invalid in the materialized view, meaning the materialized view cannot provide valid data for the query. |
| Add filter to base table fail when union rewrite             | The query used invalid partitions of the materialized view, and attempting to union all the materialized view and base table failed. |
| RewrittenPlan output logical properties is different with target group | After rewriting, the output logical properties of the materialized view do not match those of the original query. |
| Rewrite expressions by view in join fail                     | In join rewriting, fields or expressions used in the query are not present in the materialized view. |
| Rewrite expressions by view in scan fail                     | In single-table rewriting, fields or expressions used in the query are not present in the materialized view. |
| Split view to top plan and agg fail, view doesn't not contain aggregate | During aggregation rewriting, the materialized view does not contain an aggregate function. |
| Split query to top plan and agg fail                         | During aggregation rewriting, the query does not contain an aggregate function. |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | When the query and materialized view have the same GROUP BY, the rewritten expression contains aggregate functions. |
| Can not rewrite expression when no roll up                   | When the query and materialized view have the same GROUP BY, expression rewriting fails. |
| Query function roll up fail                                  | During aggregation rewriting, the aggregation function roll-up fails. |
| View dimensions do not cover the query dimensions            | The GROUP BY in the query uses dimensions not present in the GROUP BY of the materialized view. |
| View dimensions don't not cover the query dimensions in bottom agg | Similar to above, but specific to bottom-level aggregations. |
| View dimensions do not cover the query group set dimensions  | The GROUP SETS in the query use dimensions not present in the GROUP BY of the materialized view. |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | The query has a GROUP BY but the materialized view does not. |
| Both query and view have group sets, or query doesn't have but view has, not supported | Unsupported transparent rewriting scenario involving GROUP SETS in both the query and materialized view, or only in the materialized view. |

### 3 Reasons of Async-Materialized View Partition Building Failures

The refresh mechanism for partitioned materialized views relies on incremental partition updates:

- First, calculate whether the partition columns of the materialized view can be mapped to those of the base table.

- Second, determine the specific mapping relationship, whether it is 1:1 or 1:n.

| Abstract                                                     | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Partition column cannot be found in the SQL SELECT column    | The column used after PARTITION BY in the materialized view definition must appear in the SELECT clause of the SQL defining the materialized view. |
| Cannot find a valid partition track column, because %s       | Unable to locate a suitable partition column; the specific reason follows "because". |
| Partition track does not support mark join                   | The column referenced by the partition field of the materialized view is a partition column of the input table in a mark join, which is currently not supported. |
| Partition column is in an unsupported join null generation side | The referenced column of the partition field in the materialized view is on the null-generating side of a join, such as the right side of a LEFT JOIN. |
| Relation should be LogicalCatalogRelation                    | The scan type of the partition base table referenced by the materialized view should be LogicalCatalogRelation; other types are currently not supported. |
| Self join does not support partition update                  | For SQL queries involving self-joins, constructing a materialized view is currently not supported. |
| Partition track already has a related base table column      | The partition column referenced by the materialized view currently only supports referencing the partition column of a single base table. |
| Relation base table is not MTMVRelatedTableIf                | The partition base table referenced by the materialized view does not inherit from MTMVRelatedTableIf, which indicates whether a table can be partitioned. |
| The related base table is not a partition table              | The base table used by the materialized view is not a partition table. |
| The related base table partition column doesn't contain the MV partition | The column referenced after PARTITION BY in the materialized view does not exist in the partition base table. |
| Group BY sets are empty, does not contain the target partition | The SQL defining the materialized view uses aggregation, but the GROUP BY clause is empty. |
| Window partition sets do not contain the target partition    | Window functions are used, but the partition column referenced by the materialized view is not in the PARTITION BY clause. |
| Unsupported plan operation in track partition                | The SQL defining the materialized view uses unsupported operations, such as ORDER BY. |
| Context partition column should be a slot from column        | Window functions are used, and in the PARTITION BY clause, the partition column referenced by the materialized view is not a simple column but an expression. |
| Partition expressions use more than one slot reference       | The partition column after GROUP BY or PARTITION BY is an expression containing multiple columns, rather than a simple column. For example, GROUP BY partition_col + other_col. |
| Column to check using invalid implicit expression            | The partition column of the materialized view can only be used in date_trunc, and the expression using the partition column can only be date_trunc, etc. |
| Partition column time unit level should be greater than SQL SELECT column | In the materialized view, the time unit granularity in date_trunc after PARTITION BY is smaller than the time unit granularity appearing after SELECT in the SQL defining the materialized view. For example, the materialized view uses `PARTITION BY(date_trunc(col, 'day'))`, but the SQL defining the materialized view has `date_trunc(col, 'month')` after SELECT. |