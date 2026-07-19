---
{
    "title": "Sync Materialized View",
    "language": "en",
    "description": "How do you use Doris sync materialized views to accelerate aggregation, prefix index matching, and expression computation? This article covers the scenarios, syntax, hit verification, and common questions.",
    "keywords": ["Doris sync materialized view", "materialized view", "query acceleration", "bitmap_union", "prefix index", "aggregation precomputation"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenarios: aggregation precomputation, prefix index matching, prefiltering, expression precomputation -->

A sync materialized view (Sync Materialized View) is a special table in Doris that precomputes and stores the result of a SELECT statement on a base table. Doris maintains it automatically, keeps it strongly consistent with the base table on write, and automatically matches the optimal view to accelerate reads at query time.

## Usage Notes

Before using a sync materialized view, confirm the following points:

- Targets only **single-table** SELECT statements; does not involve JOIN, HAVING, LIMIT, or LATERAL VIEW
- The SELECT list must not contain auto-increment columns, constants, duplicate expressions, window functions, or VARBINARY type columns
- Aggregate functions in the SELECT list must be the root expression (`sum(a + 1)` is supported, `sum(a) + 1` is not)
- Materialized view column names must not conflict with base table columns or columns of other views (you can use a `col as xxx` alias to avoid this)
- The impact of the number of views on a single table on load performance has been evaluated
- On the Unique Key model, the view can only change column order; it cannot perform aggregation

## What Is a Sync Materialized View

<!-- Knowledge type: concept -->

A sync materialized view is a special table in Doris that stores a precomputed dataset (based on a defined SELECT statement). Doris automatically maintains the data of the sync materialized view. Whether data is added or deleted, Doris ensures that the base table and the materialized view table are updated synchronously and remain consistent. Only after the synchronization completes does the related command finish, and no additional manual maintenance is required. At query time, Doris automatically matches the optimal materialized view and reads data directly from it.

## Applicable Scenarios

<!-- Applicable scenarios: when to choose a sync materialized view -->

| Scenario | Description |
| --- | --- |
| Accelerate aggregation | Precompute time-consuming aggregations such as SUM/COUNT/BITMAP_UNION |
| Match different prefix indexes | When the query filter columns do not match the base table's prefix index, build a view prefixed by the filter columns |
| Prefilter to reduce scans | Use a WHERE condition to filter early and shrink the data volume |
| Precompute complex expressions | Precompute complex expressions such as `abs(k1)+k2+1` and reuse them directly at query time |

## Limitations

<!-- Knowledge type: constraints -->

| Category | Limitation |
| --- | --- |
| Syntax scope | Only single-table SELECT is supported, with WHERE/GROUP BY/ORDER BY; JOIN, HAVING, LIMIT, and LATERAL VIEW are not supported |
| Query method | You cannot directly query a sync materialized view (different from async materialized views) |
| SELECT list | Cannot contain auto-increment columns, constants, duplicate expressions, or window functions; cannot contain VARBINARY type columns |
| Column name requirements | Must not duplicate names in the base table or other materialized views on the base table; use an alias (`col as xxx`) to avoid conflicts |
| Aggregate functions | Must be the root expression (`sum(a) + 1` is not supported, `sum(a + 1)` is supported); no other non-aggregate expression is allowed after an aggregate function (`SELECT x, sum(a)` is allowed, `SELECT sum(a), x` is not) |
| Delete restriction | If the column referenced by a DELETE condition exists in the materialized view, drop the view first before deleting the data |
| Load performance | Too many materialized views on a single table slow down loads, because the views are updated together with the base table |
| Data model | A materialized view on the Unique Key model can only change column order; it cannot perform aggregation |

## Using a Sync Materialized View

Doris provides a complete set of DDL statements for materialized views, including create, view, and drop. The following example shows how to use a materialized view to accelerate aggregation.

### Prepare Base Table Data

Suppose a user has a sales detail table that records the transaction ID, salesperson, store, sale time, and amount of each transaction.

```sql
-- Create a test_db
create database test_db;
use test_db;

-- Create the table
create table sales_records
(
    record_id int, 
    seller_id int, 
    store_id int, 
    sale_date date, 
    sale_amt bigint
) 
distributed by hash(record_id) 
properties("replication_num" = "1");

-- Insert data
insert into sales_records values(1,1,1,"2020-02-02",1), (1,1,1,"2020-02-02",2);
```

### Create a Materialized View

**Goal**: Create a pre-aggregated view for queries that frequently analyze sales by store.

**Command**:

```sql
create materialized view store_amt as 
select store_id as store_id_, sum(sale_amt) from sales_records group by store_id;
```

**Description**: This view groups by `store_id` and sums `sale_amt` for each store, accelerating aggregation queries on the store dimension.

### Check Whether the Materialized View Is Created

**Goal**: Creating a materialized view is asynchronous, so you need to confirm the task status.

**Command**:

```sql
show alter table materialized view from test_db;
```

**Description**: The result shows all materialized view creation tasks for this database. Example output:

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

Key field descriptions:

| Field | Meaning |
| --- | --- |
| TableName | The source table of the materialized view |
| RollupIndexName | The name of the materialized view |
| State | Task state. `FINISHED` means the view was created successfully and can be matched automatically by queries |

### Cancel Creation of a Materialized View

**Goal**: Cancel the creation task while the background asynchronous task is still running.

**Command**:

```sql
cancel alter table materialized view from test_db.sales_records;
```

**Description**: If the materialized view has already been created, this command cannot cancel the creation, but you can drop the materialized view with the drop command.

### View the Schema of a Materialized View

**Goal**: View all materialized views on the target table and their schemas.

**Command**:

```sql
desc sales_records all;
```

**Description**: The output is as follows:

```sql
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName     | IndexKeysType | Field               | Type   | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| sales_records | DUP_KEYS      | record_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | seller_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | store_id            | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | sale_date           | DATE   | DATEV2       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               | sale_amt            | BIGINT | BIGINT       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               |                     |        |              |      |       |         |       |         |            |             |
| store_amt     | AGG_KEYS      | mv_store_id         | INT    | INT          | Yes  | true  | NULL    |       | true    | `store_id` |             |
|               |               | mva_SUM__`sale_amt` | BIGINT | BIGINT       | Yes  | false | NULL    | SUM   | true    | `sale_amt` |             |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
```

You can see that `sales_records` has a materialized view named `store_amt`, which is the view created in the previous step.

### View the CREATE Statement of a Materialized View

**Goal**: Query the original DDL of a materialized view.

**Command**:

```sql
show create materialized view store_amt on sales_records;
```

**Description**: The output is as follows:

```sql
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| TableName     | ViewName  | CreateStmt                                                                                                 |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| sales_records | store_amt | create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
```

### Query the Materialized View

**Goal**: Queries still target the base table, and Doris automatically rewrites them to use the materialized view.

**Command**:

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

The query above is automatically matched to `store_amt`. You can use the `EXPLAIN` command to verify whether the current query hits the materialized view:

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

**Description**: The result is as follows:

```sql
+------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                       |
+------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                        |
|   OUTPUT EXPRS:                                                        |
|     store_id[#11]                                                      |
|     sum(sale_amt)[#12]                                                 |
|   PARTITION: HASH_PARTITIONED: store_id_[#7]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: true                                             |
|                                                                        |
|   VRESULT SINK                                                         |
|      MYSQL_PROTOCAL                                                    |
|                                                                        |
|   3:VAGGREGATE (merge finalize)(384)                                   |
|   |  output: sum(partial_sum(__sum_1)[#8])[#10]                        |
|   |  group by: store_id_[#7]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  final projections: store_id_[#9], sum(__sum_1)[#10]               |
|   |  final project output tuple id: 4                                  |
|   |  distribute expr lists: store_id_[#7]                              |
|   |                                                                    |
|   2:VEXCHANGE                                                          |
|      offset: 0                                                         |
|      distribute expr lists:                                            |
|                                                                        |
| PLAN FRAGMENT 1                                                        |
|                                                                        |
|   PARTITION: HASH_PARTITIONED: record_id[#2]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: false                                            |
|                                                                        |
|   STREAM DATA SINK                                                     |
|     EXCHANGE ID: 02                                                    |
|     HASH_PARTITIONED: store_id_[#7]                                    |
|                                                                        |
|   1:VAGGREGATE (update serialize)(374)                                 |
|   |  STREAMING                                                         |
|   |  output: partial_sum(__sum_1[#1])[#8]                              |
|   |  group by: store_id_[#0]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  distribute expr lists:                                            |
|   |                                                                    |
|   0:VOlapScanNode(369)                                                 |
|      TABLE: test_db.sales_records(store_amt), PREAGGREGATION: ON       |
|      partitions = 1/1 (sales_records)                                  |
|      tablets = 10/10, tabletList = 266568, 266570, 266572 ...          |
|      cardinality = 1, avgRowSize = 1805.0, numNodes = 1                |
|      pushAggOp = NONE                                                  |
|                                                                        |
|                                                                        |
| ========== MATERIALIZATIONS ==========                                 |
|                                                                        |
| MaterializedView                                                       |
| MaterializedViewRewriteSuccessAndChose:                                |
|   internal.test_db.sales_records.store_amt chose,                      |
|                                                                        |
| MaterializedViewRewriteSuccessButNotChose:                             |
|   not chose: none,                                                     |
|                                                                        |
| MaterializedViewRewriteFail:                                           |
|                                                                        |
|                                                                        |
| ========== STATISTICS ==========                                       |
| planned with unknown column statistics                                 |
+------------------------------------------------------------------------+
```

`MaterializedViewRewriteSuccessAndChose` shows the materialized views that were successfully hit. A specific example:

```sql
+------------------------------------------------------------------------+
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |
+------------------------------------------------------------------------+
```

The output above indicates that the query successfully hit the materialized view named `store_amt`. Note that if the target table contains no data, the materialized view may not be hit.

#### MATERIALIZATIONS Field Descriptions

| Field | Meaning |
| --- | --- |
| MaterializedViewRewriteSuccessAndChose | The materialized view that was successfully selected and used for query optimization |
| MaterializedViewRewriteSuccessButNotChose | The materialized view that matched successfully but was not selected (not optimal based on cost evaluation) |
| MaterializedViewRewriteFail | A materialized view that did not match. The original SQL could not be matched against the existing view |

### Drop a Materialized View

**Goal**: Remove a materialized view that is no longer needed.

**Command**:

```sql
drop materialized view store_amt on sales_records;
```

## Examples

### Example 1: Accelerate Aggregation Queries

<!-- Applicable scenarios: exact deduplication aggregation such as UV/PV -->

**Business scenario**: Compute the UV (unique visitors) and PV (page views) of an advertisement.

**Steps**:

1. Create the source table that stores ad click details:

    ```sql
    create table advertiser_view_record
    (
        click_time datetime, 
        advertiser varchar(10), 
        channel varchar(10), 
        user_id int
    ) distributed by hash(user_id) properties("replication_num" = "1");
    insert into advertiser_view_record values("2020-02-02 02:02:02",'a','a',1), ("2020-02-02 02:02:02",'a','a',2);
    ```

2. The user wants to query the UV of an advertisement (an exact deduplication on users for the same ad). The typical query is:

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

3. For the UV scenario, create a materialized view with `bitmap_union` to perform exact deduplication in advance. In Doris, the result of `count(distinct)` is identical to `bitmap_union_count`, so a materialized view aggregated with `bitmap_union` can accelerate the query:

    ```sql
    create materialized view advertiser_uv as 
    select 
        advertiser as advertiser_, 
        channel as channel_, 
        bitmap_union(to_bitmap(user_id)) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

4. After the materialized view is created, run the original UV query again. Doris automatically reads from `advertiser_uv`:

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

5. Once the materialized view is selected, the actual query is rewritten to:

    ```sql
    select 
        advertiser, 
        channel, 
        bitmap_union_count(to_bitmap(user_id)) 
    from 
        advertiser_uv 
    group by 
        advertiser, channel;
    ```

6. Use the `explain` command to check whether the query matched the materialized view:

    ```sql
    explain select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

7. The output is as follows:

    ```sql
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                                                                                         |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | PLAN FRAGMENT 0                                                                                                                                         |
    |   OUTPUT EXPRS:                                                                                                                                         |
    |     advertiser[#13]                                                                                                                                     |
    |     channel[#14]                                                                                                                                        |
    |     count(DISTINCT user_id)[#15]                                                                                                                        |
    |   PARTITION: HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                            |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: true                                                                                                                              |
    |                                                                                                                                                         |
    |   VRESULT SINK                                                                                                                                          |
    |      MYSQL_PROTOCAL                                                                                                                                     |
    |                                                                                                                                                         |
    |   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
    |   |  output: bitmap_union_count(partial_bitmap_union_count(__bitmap_union_2)[#9])[#12]                                                                  |
    |   |  group by: advertiser_[#7], channel_[#8]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  final projections: advertiser_[#10], channel_[#11], bitmap_union_count(__bitmap_union_2)[#12]                                                      |
    |   |  final project output tuple id: 4                                                                                                                   |
    |   |  distribute expr lists: advertiser_[#7], channel_[#8]                                                                                               |
    |   |                                                                                                                                                     |
    |   2:VEXCHANGE                                                                                                                                           |
    |      offset: 0                                                                                                                                          |
    |      distribute expr lists:                                                                                                                             |
    |                                                                                                                                                         |
    | PLAN FRAGMENT 1                                                                                                                                         |
    |                                                                                                                                                         |
    |   PARTITION: HASH_PARTITIONED: user_id[#6]                                                                                                              |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: false                                                                                                                             |
    |                                                                                                                                                         |
    |   STREAM DATA SINK                                                                                                                                      |
    |     EXCHANGE ID: 02                                                                                                                                     |
    |     HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                                     |
    |                                                                                                                                                         |
    |   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
    |   |  STREAMING                                                                                                                                          |
    |   |  output: partial_bitmap_union_count(__bitmap_union_2[#2])[#9]                                                                                       |
    |   |  group by: advertiser_[#0], channel_[#1]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  distribute expr lists:                                                                                                                             |
    |   |                                                                                                                                                     |
    |   0:VOlapScanNode(425)                                                                                                                                  |
    |      TABLE: test_db.advertiser_view_record(advertiser_uv), PREAGGREGATION: ON                                                                           |
    |      partitions=1/1 (advertiser_view_record)                                                                                                            |
    |      tablets=10/10, tabletList=266637,266639,266641 ...                                                                                                 |
    |      cardinality=1, avgRowSize=0.0, numNodes=1                                                                                                          |
    |      pushAggOp=NONE                                                                                                                                     |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== MATERIALIZATIONS ==========                                                                                                                  |
    |                                                                                                                                                         |
    | MaterializedView                                                                                                                                        |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                 |
    |   internal.test_db.advertiser_view_record.advertiser_uv chose,                                                                                          |
    |                                                                                                                                                         |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                              |
    |   not chose: none,                                                                                                                                      |
    |                                                                                                                                                         |
    | MaterializedViewRewriteFail:                                                                                                                            |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== STATISTICS ==========                                                                                                                        |
    | planed with unknown column statistics                                                                                                                   |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    ```

8. In the `explain` output, you can see `internal.test_db.advertiser_view_record.advertiser_uv chose`, which means the query directly scans the data of the materialized view and the match succeeded. At the same time, `count(distinct)` on the `user_id` column is rewritten as `bitmap_union_count(to_bitmap)`, which performs exact deduplication via Bitmap.

### Example 2: Match a Different Prefix Index

<!-- Applicable scenarios: filter conditions not covered by the base table prefix index -->

**Business scenario**: Match a prefix index.

The user's source table contains three columns (k1, k2, k3), where k1 and k2 are configured as prefix index columns. When the query condition contains `where k1=1 and k2=2`, the index can accelerate it. However, conditions such as `where k3=3` cannot hit the prefix index. To address this, you can create a materialized view whose first column is `k3`.

**Steps**:

1. Create the table and insert data:

    ```sql
    create table test_table
    (
        k1 int, 
        k2 int, 
        k3 int, 
        kx int
    ) 
    distributed by hash(k1) 
    properties("replication_num" = "1");
    
    insert into test_table values(1,1,1,1),(3,3,3,3);
    ```

2. Create a materialized view that uses k3 as the prefix index:

    ```sql
    create materialized view mv_1 as SELECT k3 as k3_, k2 as k2_, k1 as k1_ FROM test_table;
    ```

3. Use `EXPLAIN` to check whether the query matches the materialized view:

    ```sql
    explain select k1, k2, k3 from test_table where k3=3;
    ```

4. The output is as follows:

    ```sql
    +----------------------------------------------------------+
    | Explain String(Nereids Planner)                          |
    +----------------------------------------------------------+
    | PLAN FRAGMENT 0                                          |
    |   OUTPUT EXPRS:                                          |
    |     k1[#7]                                               |
    |     k2[#8]                                               |
    |     k3[#9]                                               |
    |   PARTITION: HASH_PARTITIONED: k1_[#2]                   |
    |                                                          |
    |   HAS_COLO_PLAN_NODE: false                              |
    |                                                          |
    |   VRESULT SINK                                           |
    |      MYSQL_PROTOCAL                                      |
    |                                                          |
    |   0:VOlapScanNode(256)                                   |
    |      TABLE: test_db.test_table(mv_1), PREAGGREGATION: ON |
    |      PREDICATES: (mv_k3[#0] = 3)                         |
    |      partitions=1/1 (test_table)                         |
    |      tablets=10/10, tabletList=271177,271179,271181 ...  |
    |      cardinality=1, avgRowSize=0.0, numNodes=1           |
    |      pushAggOp=NONE                                      |
    |      final projections: k1_[#2], mv_k2[#1], mv_k3[#0]    |
    |      final project output tuple id: 2                    |
    |                                                          |
    |                                                          |
    | ========== MATERIALIZATIONS ==========                   |
    |                                                          |
    | MaterializedView                                         |
    | MaterializedViewRewriteSuccessAndChose:                  |
    |   internal.test_db.test_table.mv_1 chose,                |
    |                                                          |
    | MaterializedViewRewriteSuccessButNotChose:               |
    |   not chose: none,                                       |
    |                                                          |
    | MaterializedViewRewriteFail:                             |
    |                                                          |
    |                                                          |
    | ========== STATISTICS ==========                         |
    | planed with unknown column statistics                    |
    +----------------------------------------------------------+
    ```

5. In the `EXPLAIN` output, you can see `internal.test_db.test_table.mv_1 chose`, which means the query successfully hit the materialized view.

### Example 3: Accelerate Queries with Prefiltering and Expression Computation

<!-- Applicable scenarios: repeated computation of complex expressions or subset queries under fixed WHERE conditions -->

**Business scenario**: Filter data in advance or accelerate expression computation.

**Steps**:

1. Create the table and insert data:

    ```sql
    create table d_table (
       k1 int null,
       k2 int not null,
       k3 bigint null,
       k4 date null
    )
    duplicate key (k1,k2,k3)
    distributed BY hash(k1) buckets 3
    properties("replication_num" = "1");
    
    insert into d_table select 1,1,1,'2020-02-20';
    insert into d_table select 2,2,2,'2021-02-20';
    insert into d_table select 3,-3,null,'2022-02-20';
    ```

2. Create two materialized views, one for expression precomputation and one for data prefiltering:

    ```sql
    -- mv1 performs expression computation in advance
    create materialized view mv1 as 
    select 
        abs(k1)+k2+1,        
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
    
    -- mv2 filters with a where expression in advance to reduce the data volume in the materialized view
    create materialized view mv2 as 
    select 
        year(k4),
        month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    ```

3. Verify materialized view hits:

    ```sql
    -- Hits mv1
    select 
        abs(k1)+k2+1,
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
        
    -- Hits mv1
    select 
        bin(abs(k1)+k2+1),
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        bin(abs(k1)+k2+1);
    
    -- Hits mv2
    select 
        year(k4) + month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    
    -- Hits the original table d_table; does not hit mv2 because the where condition does not match
    select 
        year(k4),
        month(k4) 
    from 
        d_table;
    ```

## FAQ

<!-- Knowledge type: FAQ -->

### Q1: After the materialized view is created, why is it not rewritten successfully?

**Cause**: The materialized view may still be under construction.

**Diagnostic command**:

```sql
show alter table materialized view from test_db;
```

**Description**: If the `State` field is not `FINISHED`, wait for the build to complete. Only after the state becomes `FINISHED` can a query hit the materialized view. In addition, if the base table contains no data, the hit may not be triggered either.

### Q2: After upgrading from 2.x to 3.0.0, why are previous sync materialized views no longer hit?

**Cause**: Starting from version 3.0.0, sync materialized views are transparently rewritten by default based on plan-structure information.

**Solution**: If a query hits in 2.x but does not hit in 3.0.0, turn off the following switch (enabled by default):

```sql
SET enable_sync_mv_cost_based_rewrite = false;
```

### Q3: What is the difference between sync and async materialized views?

| Comparison | Sync materialized view | Async materialized view |
| --- | --- | --- |
| Data consistency | Strongly consistent with the base table; updated synchronously on write | Refreshed asynchronously with latency |
| Supported syntax | Single-table SELECT only | Supports complex queries such as multi-table JOIN |
| Direct query | Not supported; must be triggered through automatic rewriting of base table queries | Supports querying the view directly |
| Maintenance cost | Maintained automatically without manual intervention | Requires a refresh policy |
| Applicable scenarios | Single-table aggregation, prefix index, prefiltering, expression precomputation | Multi-table JOIN and cross-table precomputation |
