---
{
    "title": "Sync-Materialized View",
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

## What is a Synchronous Materialized View

A synchronous materialized view is a special type of table in Doris that stores pre-computed data sets based on defined SELECT statements. Doris automatically maintains the data in synchronous materialized views, ensuring that any new imports or deletions in the base table are reflected in the materialized view in real-time, maintaining data consistency without requiring any additional manual maintenance. When querying, Doris automatically selects the optimal materialized view and retrieves data directly from it.

## Applicable Scenarios

- Accelerating time-consuming aggregation operations

- Queries requiring prefix index matching

- Reducing the amount of data scanned by pre-filtering

- Speeding up queries by pre-computing complex expressions

## Limitations

- Synchronous materialized views only support SELECT statements for a single table, including WHERE, GROUP BY, and ORDER BY clauses, but not JOIN, HAVING, LIMIT clauses, LATERAL VIEW.

- Unlike asynchronous materialized views, synchronous materialized views cannot be queried directly.

- The SELECT list cannot include auto-increment columns, constants, duplicate expressions, or window functions.

- If the SELECT list contains aggregation functions, these must be root expressions (e.g., `sum(a + 1)` is supported, but `sum(a) + 1` is not), and no non-aggregation function expressions can follow the aggregation function (e.g., `SELECT x, sum(a)` is allowed, but `SELECT sum(a), x` is not).

- If the condition column for a DELETE statement exists in the materialized view, the DELETE operation cannot proceed. If data deletion is necessary, the materialized view must be dropped first.

- Excessive materialized views on a single table can impact import efficiency: When importing data, both the materialized views and the base table are updated synchronously. Excessive materialized views on a table can slow down imports, similar to importing data into multiple tables simultaneously.

- Materialized views on Unique Key data models can only reorder columns and do not support aggregation. Therefore, coarse-grained aggregation operations cannot be performed through materialized views on Unique Key models.

## Using Materialized Views

Doris provides a comprehensive set of DDL syntax for materialized views, including creation, viewing, and deletion. Below is an example demonstrating how to use materialized views to accelerate aggregation calculations. Suppose a user has a sales record detail table that stores transaction IDs, salespersons, stores, sale dates, and amounts. The table creation and data insertion statements are as follows:

```sql
-- Create a test_db  
create database test_db;  
use test_db;  
  
-- Create table  
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

### Creating a Materialized View

If users frequently need to analyze sales volumes by different stores, they can create a materialized view for the `sales_records` table, grouped by store ID and summing sales amounts for each store. The creation statement is as follows:

```sql
create materialized view store_amt as   
select store_id, sum(sale_amt) from sales_records group by store_id;
```

### Checking if the Materialized View is Created

Since creating a materialized view is an asynchronous operation, users need to check the status of the materialized view creation task asynchronously after submitting it. The command is as follows:

```sql
show alter table materialized view from test_db;
```

The output will show all materialized view creation tasks for that database. A sample output is:

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

The `State` column indicates the status. When the state changes to `FINISHED`, the materialized view is successfully created.

### Canceling Materialized View Creation

If the background asynchronous task for creating the materialized view has not yet completed, it can be canceled with the following command:

```sql
cancel alter table materialized view from test_db.sales_records;
```

If the materialized view has already been created, it cannot be canceled, but it can be deleted using the DROP command.

### Viewing the Materialized View Structure

The structure of all materialized views created on a target table can be viewed using the following command:

```sql
desc sales_records all;
```

### Viewing the Creation Statement of a Materialized View

The creation statement for a materialized view can be viewed with the following command:

```sql
show create materialized view store_amt on sales_records;
```

### Querying Materialized Views

Once a materialized view is created, when users query sales volumes for different stores, Doris will directly read the aggregated data from the newly created materialized view `store_amt`, thereby enhancing query efficiency. Users still specify the `sales_records` table in their queries, for example:

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

The above query will automatically match the `store_amt` materialized view. Users can use the following command to verify whether the current query has matched an appropriate materialized view.

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

The result is as follows:

```sql
+------------------------------------------------------------------------+  
| Explain String (Nereids Planner)                                       |  
+------------------------------------------------------------------------+  
| PLAN FRAGMENT 0                                                        |  
|   OUTPUT EXPRS:                                                        |  
|     store_id[#11]                                                      |  
|     sum(sale_amt)[#12]                                                 |  
|   PARTITION: HASH_PARTITIONED: mv_store_id[#7]                         |  
|                                                                        |  
|   HAS_COLO_PLAN_NODE: true                                             |  
|                                                                        |  
|   VRESULT SINK                                                         |  
|      MYSQL_PROTOCAL                                                    |  
|                                                                        |  
|   3:VAGGREGATE (merge finalize)(384)                                   |  
|   |  output: sum(partial_sum(mva_SUM__`sale_amt`)[#8])[#10]            |  
|   |  group by: mv_store_id[#7]                                         |  
|   |  sortByGroupKey: false                                             |  
|   |  cardinality = 1                                                   |  
|   |  final projections: mv_store_id[#9], sum(mva_SUM__`sale_amt`)[#10] |  
|   |  final project output tuple id: 4                                  |  
|   |  distribute expr lists: mv_store_id[#7]                            |  
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
|     HASH_PARTITIONED: mv_store_id[#7]                                  |  
|                                                                        |  
|   1:VAGGREGATE (update serialize)(374)                                 |  
|   |  STREAMING                                                         |  
|   |  output: partial_sum(mva_SUM__`sale_amt`[#1])[#8]                  |  
|   |  group by: mv_store_id[#0]                                         |  
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

`MaterializedViewRewriteSuccessAndChose` displays the materialized view that was successfully matched, as shown in the following example:

```sql
+------------------------------------------------------------------------+  
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |  
+------------------------------------------------------------------------+
```

The above content indicates that the query successfully matched the materialized view named `store_amt`. It's worth noting that if there is no data in the target table, the materialized view may not be hit.

Detailed explanations on MATERIALIZATIONS:

- **MaterializedViewRewriteSuccessAndChose**: Displays the materialized view that was successfully selected and used for query optimization.

- **MaterializedViewRewriteSuccessButNotChose**: Displays materialized views that matched the query but were not selected (the optimizer chooses the optimal materialized view based on its cost, and these matched but unselected views indicate they were not the optimal choice).

- **MaterializedViewRewriteFail**: Displays materialized views that failed to match the query, meaning the original SQL query could not match any existing materialized views and therefore could not be optimized using them.


### Dropping a Materialized View

```sql
drop materialized view store_amt on sales_records;
```

## Usage Examples

Below are additional examples demonstrating the use of materialized views.

### Example 1: Accelerating Aggregation Queries

Business Scenario: Calculating ad UV (Unique Visitors) and PV (Page Views).

Assuming the raw ad click data is stored in Doris, creating a materialized view with `bitmap_union` can speed up queries for ad PV and UV. First, create a table to store ad click details:

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

Since users want to query the UV value of advertisements, which requires an exact deduplication of users for the same advertisement, the typical query would be:

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

For this UV calculation scenario, we can create a materialized view with `bitmap_union` to achieve pre-exact deduplication. In Doris, the result of the `count(distinct)` aggregation is identical to the result of the `bitmap_union_count` aggregation. And `bitmap_union_count` is equivalent to counting the results of `bitmap_union`. Therefore, if the query involves `count(distinct)`, creating a materialized view with `bitmap_union` aggregation can speed up the query. Based on current usage scenarios, a materialized view can be created to group by advertisement and channel, with exact deduplication for `user_id`.

```sql
create materialized view advertiser_uv as 
select 
    advertiser, 
    channel, 
    bitmap_union(to_bitmap(user_id)) 
from 
    advertiser_view_record 
group by 
    advertiser, channel;
```

Once the materialized view table is created, when querying the UV for advertisements, Doris will automatically retrieve data from the newly created materialized view `advertiser_uv`. If the previous SQL is executed:

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

After selecting the materialized view, the actual query will be transformed into:

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

Use the `explain` command to check if the query matches the materialized view:

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

The output will be:

```sql
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                                         |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                                         |
|   OUTPUT EXPRS:                                                                                                                                         |
|     advertiser[#13]                                                                                                                                     |
|     channel[#14]                                                                                                                                        |
|     count(DISTINCT user_id)[#15]                                                                                                                        |
|   PARTITION: HASH_PARTITIONED: mv_advertiser[#7], mv_channel[#8]                                                                                        |
|                                                                                                                                                         |
|   HAS_COLO_PLAN_NODE: true                                                                                                                              |
|                                                                                                                                                         |
|   VRESULT SINK                                                                                                                                          |
|      MYSQL_PROTOCAL                                                                                                                                     |
|                                                                                                                                                         |
|   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
|   |  output: bitmap_union_count(partial_bitmap_union_count(mva_BITMAP_UNION__to_bitmap_with_check(CAST(`user_id` AS bigint)))[#9])[#12]                 |
|   |  group by: mv_advertiser[#7], mv_channel[#8]                                                                                                        |
|   |  sortByGroupKey:false                                                                                                                               |
|   |  cardinality=1                                                                                                                                      |
|   |  final projections: mv_advertiser[#10], mv_channel[#11], bitmap_union_count(mva_BITMAP_UNION__to_bitmap_with_check(CAST(`user_id` AS bigint)))[#12] |
|   |  final project output tuple id: 4                                                                                                                   |
|   |  distribute expr lists: mv_advertiser[#7], mv_channel[#8]                                                                                           |
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
|     HASH_PARTITIONED: mv_advertiser[#7], mv_channel[#8]                                                                                                 |
|                                                                                                                                                         |
|   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
|   |  STREAMING                                                                                                                                          |
|   |  output: partial_bitmap_union_count(mva_BITMAP_UNION__to_bitmap_with_check(CAST(`user_id` AS bigint))[#2])[#9]                                      |
|   |  group by: mv_advertiser[#0], mv_channel[#1]                                                                                                        |
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

In the result of the explain command, you can see that `internal.test_db.advertiser_view_record.advertiser_uv` was chosen. This indicates that the query will directly scan the data from the materialized view. This confirms that the match was successful. Secondly, the count(distinct) operation on the `user_id` field is rewritten as `bitmap_union_count(to_bitmap)`. This means that the exact deduplication effect is achieved through the use of Bitmap.

### Example 2: Matching Different Prefix Indexes

Business Scenario: Matching prefix indexes.

If a table has prefix indexes on k1 and k2, but queries sometimes involve k3, a materialized view can be created with k3 as the first column to leverage indexing:

```sql
create table test_table  
(  
    k1 int,   
    k2 int,   
    k3 int,   
    kx date  
)   
distributed by hash(k1)   
properties("replication_num" = "1");  
  
insert into test_table values(1,1,1,1),(3,3,3,3);
```

Create a materialized view with k3 as the prefix index:

```sql
create materialized view mv_1 as SELECT k3, k2, k1 FROM test_table;
```

Queries with `WHERE k3 = 3` will match the materialized view, as verified by `explain`.

```sql
explain select k1, k2, k3 from test_table where k3=3;
```

The output will be:

```sql
+----------------------------------------------------------+
| Explain String(Nereids Planner)                          |
+----------------------------------------------------------+
| PLAN FRAGMENT 0                                          |
|   OUTPUT EXPRS:                                          |
|     k1[#7]                                               |
|     k2[#8]                                               |
|     k3[#9]                                               |
|   PARTITION: HASH_PARTITIONED: mv_k1[#2]                 |
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
|      final projections: mv_k1[#2], mv_k2[#1], mv_k3[#0]  |
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
In the result of the explain command, you can see that `internal.test_db.test_table.mv_1` was chosen, indicating that the query hit the materialized view.


### Example 3: Pre-filtering and Expression Computation to Accelerate Queries

Business Scenario: Pre-filtering data or accelerating expression computation.

Create a table and materialized views for pre-filtering and expression computation:

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

Creating Some Materialized Views:

```sql
-- mv1 Perform expression calculations ahead of time
create materialized view mv1 as 
select 
    abs(k1)+k2+1,        
    sum(abs(k2+2)+k3+3) 
from 
    d_table 
group by 
    abs(k1)+k2+1;

-- mv2 Use where expressions to filter in advance to reduce the amount of data in materialized views
create materialized view mv2 as 
select 
    year(k4),
    month(k4) 
from 
    d_table 
where 
    year(k4) = 2020;
```

Testing Whether the Materialized Views Are Successfully Hit with Some Queries:

```sql
-- Hit mv1
select 
    abs(k1)+k2+1,
    sum(abs(k2+2)+k3+3) 
from 
    d_table 
group by 
    abs(k1)+k2+1;
    
-- Hit mv1
select 
    bin(abs(k1)+k2+1),
    sum(abs(k2+2)+k3+3) 
from 
    d_table 
group by 
    bin(abs(k1)+k2+1);

-- Hit mv2
select 
    year(k4) + month(k4) 
from 
    d_table 
where 
    year(k4) = 2020;

-- Hit table d_table but not hit mv2，because where condition does match
select 
    year(k4),
    month(k4) 
from 
    d_table;

```

## FAQ

If materialized views do not match queries as expected, check if the materialized view is still being built using:

```sql
show alter table materialized view from test_db;
```

Wait until the status changes to `FINISHED` before expecting materialized views to be available.


## Reference

### 1. Introduction to materialized view related switches


| Switch | Description |  
| ------ | ------ |  
| `SET enable_sync_mv_cost_based_rewrite = true;` | Determines whether to transparently rewrite synchronized materialized views based on structural information, with a default value of true. This property is supported from version 3.0.0 onwards. |