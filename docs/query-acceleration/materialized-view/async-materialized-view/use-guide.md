---
{
    "title": "Best Practices",
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

## Principles for Using Asynchronous Materialized Views
- **Timeliness Consideration:** Asynchronous materialized views are typically used in scenarios where data timeliness is not critical, usually T+1 data. If high timeliness is required, consider using synchronous materialized views.

-  **Acceleration Effect and Consistency Consideration:** In query acceleration scenarios, when creating materialized views, DBAs should group common query SQL patterns, aiming to minimize overlap between groups. The clearer the SQL pattern grouping, the higher the quality of the materialized view construction. A query may use multiple materialized views, and a materialized view may be used by multiple queries. Constructing materialized views requires comprehensive consideration of response time (acceleration effect), construction cost, and data consistency requirements.

-  **Materialized View Definition and Construction Cost Consideration:**
    
    - The closer the materialized view definition is to the original query, the better the query acceleration effect, but the lower the generality and reusability of the materialization, meaning higher construction costs.
    
    - The more general the materialized view definition (e.g., without WHERE conditions and more aggregation dimensions), the lower the query acceleration effect, but the better the generality and reusability of the materialization, meaning lower construction costs.

:::caution Note
- **Control of Materialized View Quantity:** More materialized views are not necessarily better. Constructing and refreshing materialized views requires resources. Materialized views participate in transparent rewriting, and the CBO cost model needs time to select the optimal materialized view. In theory, the more materialized views, the longer the transparent rewriting time.

- **Regularly Check the Usage Status of Materialized Views:** If not used, they should be deleted in time.

- **Base Table Data Update Frequency:** If the base table data of the materialized view is frequently updated, it may not be suitable to use materialized views, as this will cause the materialized view to frequently become invalid and not usable for transparent rewriting (direct query). If you need to use such materialized views for transparent rewriting, you need to allow a certain timeliness delay in the queried data and can set a `grace_period`. See the applicable introduction of `grace_period` for details.
:::


## Principles for Choosing Materialized View Refresh Methods

When the following conditions are met, it is recommended to create partitioned materialized views:

- The base table data volume of the materialized view is large, and the base table is a partitioned table.

- The tables used by the materialized view, except for the partitioned table, do not change frequently.

- The definition SQL of the materialized view and the partition field meet the requirements of partition derivation, that is, meet the requirements of partition incremental update. Detailed requirements can be found in [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)

- The number of partitions in the materialized view is not large, as too many partitions will lead to excessively long partition materialized view construction time.

When some partitions of the materialized view become invalid, transparent rewriting can use the valid partitions of the materialized view UNION ALL base table to return data.

If partitioned materialized views cannot be constructed, you can consider choosing fully refreshed materialized views.

## Common Usage of Partitioned Materialized Views

When the materialized view's base table data volume is large and the base table is a partitioned table, if the materialized view's definition SQL and partition fields meet the requirements of partition derivation, this scenario is suitable for building partitioned materialized views. For detailed requirements of partition derivation, refer to [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters) and [Async Materialized View FAQ Building Question 12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-partitioned-materialized-view).

The materialized view's partitions are created following the base table's partition mapping, generally having a 1:1 or 1:n relationship with the base table's partitions.

- If the base table's partitions undergo data changes, such as adding partitions or deleting partitions, the corresponding partitions in the materialized view will also become invalid. Invalid partitions cannot be used for transparent rewriting but can be directly queried. When transparent rewriting discovers that the materialized view's partition data is invalid, the invalid partitions will be handled by joining with the base table to respond to queries.

  For commands to check materialized view partition status, see viewing materialized view status, mainly using the `show partitions from mv_name` command.

- If non-partitioned tables referenced by the materialized view undergo data changes, it will trigger all partitions of the materialized view to become invalid, preventing the materialized view from being used for transparent rewriting. You need to refresh all partition data of the materialized view using the command `REFRESH MATERIALIZED VIEW mv1 AUTO;`. This command will attempt to refresh all partitions of the materialized view where data has changed.

  Therefore, it's generally recommended to place frequently changing data in partitioned tables referenced by the partitioned materialized view, and place infrequently changing dimension tables in non-referenced partition table positions.
- If non-partitioned tables referenced by the materialized view undergo data changes, and the non-partitioned table data is only being added without modifications, you can specify the attribute `excluded_trigger_tables = 'non_partition_table_name1,non_partition_table_name2'` when creating the materialized view. This way, data changes in non-partitioned tables won't invalidate all partitions of the materialized view, and the next refresh will only refresh the invalid partitions of the materialized view corresponding to the partition table.

Transparent rewriting of partitioned materialized views is at the partition granularity. Even if some partitions of the materialized view become invalid, the materialized view can still be used for transparent rewriting. However, if only one partition is queried and that partition's data in the materialized view is invalid, then the materialized view cannot be used for transparent rewriting.

For example:
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
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy'),     
(4, 4, 3, 7, '2024-06-15 13:20:09', 5.5, 6.5, 0, 8.5, 'o', 'k', '2024-06-15', '2024-06-15', '2024-06-15', 'a', 'b', 'yyyyyyyyy'),     
(5, 5, 6, 8, '2024-06-25 15:15:36', 5.5, 6.5, 0.12, 8.5, 'o', 'k', '2024-06-25', '2024-06-25', '2024-06-25', 'a', 'b', 'yyyyyyyyy'),     
(5, 5, 6, 9, '2024-06-29 21:10:52', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-06-30', '2024-06-30', '2024-06-30', 'a', 'b', 'yyyyyyyyy'),     
(5, 6, 5, 10, '2024-06-03 22:05:50', 7.5, 8.5, 0.1, 10.5, 'k', 'o', '2024-06-03', '2024-06-03', '2024-06-03', 'c', 'd', 'xxxxxxxxx');     
  
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

In this example, the o_ordertime field in the orders table is the partition field, with type DATETIME, partitioned by day.
The main query is based on a "day" granularity:

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
  and l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```

To avoid refreshing too many partitions each time in the materialized view, the partition granularity can be consistent with the base table orders, also partitioning by "day".

The materialized view's definition SQL can use "day" granularity and aggregate data by "day":

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
  date_trunc(l_ordertime, 'day') as order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  and l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

## How to Use Materialized Views to Accelerate Queries

To use materialized views for query acceleration, first check the profile file to find the operation that consumes the most time in a query, which usually appears in Join, Aggregate, Filter, or Calculated Expressions.

For Join, Aggregate, Filters, and Calculated Expressions, building materialized views can help accelerate queries. If a Join operation in a query consumes a large amount of computing resources while Aggregate consumes relatively fewer resources, you can build materialized views targeting the Join operation.

Next, we'll explain in detail how to build materialized views for these four operations:

**1. For Join**

You can extract common table join patterns used in queries to build materialized views. If transparent rewriting uses this materialized view, it can save Join computation. Remove the Filters from the query to create a more general Join materialized view.

**2. For Aggregate**

It is recommended to use low-cardinality fields as dimensions when building materialized views. If the dimensions are related, the number after aggregation can be reduced as much as possible.

For example, with table t1, if the original table has 1,000,000 records, and the SQL query has `group by a, b, c`. If the cardinality of a, b, c is 100, 50, and 15 respectively, then the aggregated data would be around 75,000, indicating that this materialized view is effective. If a, b, c are correlated, the amount of aggregated data will be further reduced.

If a, b, c have high cardinality, it will cause the aggregated data to expand rapidly. If the aggregated data is more than the original table data, this scenario might not be suitable for building materialized views. For example, if c's cardinality is 3,500, then the aggregated data would be around 17,000,000, much larger than the original table data, making the performance acceleration benefit of building such a materialized view low.

The aggregation granularity of the materialized view should be finer than the query, meaning the aggregation dimensions of the materialized view should include the query's aggregation dimensions to provide the data needed by the query. The query may not write Group By, and similarly, the aggregation functions of the materialized view should include the query's aggregation functions.

Taking aggregate query acceleration as an example:

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

Based on the above two SQL queries, we can build a more general materialized view that includes Aggregate. In this materialized view, we include both l_partkey and l_suppkey as group by dimensions for aggregation, and use o_orderdate as a filter condition. Note that o_orderdate is not only used in the materialized view's condition compensation but also needs to be included in the materialized view's aggregation group by dimensions.

After building the materialized view this way, both Query 1 and Query 2 can hit this materialized view. The materialized view definition is as follows:

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

**3. For Filter**

If filters on the same fields frequently appear in queries, adding corresponding Filters in the materialized view can reduce the amount of data in the materialized view, thereby improving the performance when queries hit the materialized view.

Note that the materialized view should have fewer Filters than those appearing in queries, and the query's Filters should include the materialized view's Filters. For example, if the query is `a > 10 and b > 5`, the materialized view can have no Filter, or if it has Filters, it should filter on a and b with a larger data range than the query, such as `a > 5 and b > 5`, `b > 0`, or just `a > 5`.

**4. For Calculated Expressions**

Taking examples like case when and string processing functions, these expression calculations are very performance-intensive. If these can be pre-calculated in the materialized view, using the pre-calculated materialized view through transparent rewriting can improve query performance.

It is recommended that the number of columns in the materialized view should not be too many. If a query uses multiple fields, you should build corresponding materialized views for different columns based on the initial SQL pattern grouping, avoiding too many columns in a single materialized view.

## Usage Scenarios

### Scenario One: Query Acceleration

In BI reporting scenarios or other acceleration scenarios, users are sensitive to query response times and typically require results to be returned in seconds. Queries usually involve multiple table joins followed by aggregate calculations, which consume significant computing resources and sometimes make it difficult to guarantee timeliness. Asynchronous materialized views can handle this well, supporting both direct queries and transparent rewriting, where the optimizer automatically selects the optimal materialized view to respond to requests based on rewriting algorithms and cost models.

#### Use Case 1: Multi-table Join Aggregate Query Acceleration
Building more general materialized views can accelerate multi-table join aggregate queries.

Taking the following three query SQLs as examples:

Query 1:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount)
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

For the above queries, we can build the following materialized view to satisfy all the above queries.

The materialized view definition removes the filter conditions from Query 1 and Query 2 to get a more general Join, and pre-calculates the expression `l_extendedprice * (1 - l_discount)`, so when queries hit the materialized view, it can save expression calculation:

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

If the above materialized view cannot meet the acceleration performance requirements of Query 2, we can build an aggregate materialized view. To maintain generality, we can remove the filter condition on the `o_orderdate` field:

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

In log query acceleration scenarios, it is recommended not to limit yourself to using only asynchronous materialized views; they can be combined with synchronous materialized views.

Generally, the base table is a partitioned table, mostly partitioned by hour, with single-table aggregate queries, and filter conditions are usually based on time and some flag bits. Sometimes when query response speed cannot meet requirements, synchronous materialized views can usually be built for acceleration.

For example, the base table definition might be as follows:

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT 'identifier', 
`event_id` VARCHAR(128) NULL COMMENT 'identifier', 
`decision` VARCHAR(32) NULL COMMENT 'enum value', 
`time` DATETIME NULL COMMENT 'query time', 
`id` VARCHAR(35) NOT NULL COMMENT 'od', 
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

The materialized view can aggregate data by minute, which can also achieve a certain aggregation effect. For example:

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
      cast(FLOOR(MINUTE(time) / 15) as decimal(9, 0)),
      count(id) as cnt
    from 
      test 
    group by 
      code, 
      app_name, 
      event_id, 
      event_type, 
      date_trunc(time, 'minute'), 
      decision, 
      DATE_FORMAT(time, '%Y-%m-%d'), 
      cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0));
```

The query statement might be as follows:

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
            cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) as time, 
      count(id) as cnt 
    from 
      test 
    where 
    date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
      AND '2024-07-03 20:00:00' 
    group by 
      decision, 
      DATE_FORMAT(
        `time`, "%Y-%m-%d"
      ), 
      cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0));
```

### Scenario Two: Data Modeling (ETL)

Data analysis work often requires joining and aggregating multiple tables, a process that typically involves complex and frequently repeated queries. These types of queries may lead to high query latency or high resource consumption issues. However, if using asynchronous materialized views to build layered data models, these problems can be well avoided. You can create higher-level materialized views based on existing materialized views (supported since version 2.1.3), flexibly meeting different requirements.

Different levels of materialized views can be set with their own trigger methods, for example:

- The first layer of materialized views can be set to refresh periodically, and the second layer set to trigger refresh. This way, when the first layer of materialized views completes refreshing, it will automatically trigger the refresh of the second layer materialized views.
- If each layer of materialized views is set to refresh periodically, then when the second layer materialized view refreshes, it won't consider whether the first layer's materialized view data is synchronized with the base table, it will just process the first layer's materialized view data and synchronize it to the second layer.

Next, we'll use the TPC-H dataset to illustrate the application of asynchronous materialized views in data modeling, taking the analysis of monthly order quantities and profits by region and country as an example:

Original query (without using materialized views):

```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') as month,
count(distinct o.o_orderkey) as order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) as revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```


Using asynchronous materialized views for layered modeling:

Build DWD layer (detailed data), process order detail wide table

```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
select
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name as nation_name,
r.r_name as region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
from orders o
join customer c on o.o_custkey = c.c_custkey
join nation n on c.c_nationkey = n.n_nationkey
join region r on n.n_regionkey = r.r_regionkey
join lineitem l on o.o_orderkey = l.l_orderkey;
```

Build DWS layer (summary data), perform daily order summary
```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
select
date_trunc(o_orderdate, 'month') as month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) as order_count,
sum(l_extendedprice * (1 - l_discount)) as net_revenue
from dwd_order_detail
group by
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```

The optimized query using materialized views is as follows:
```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) as revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```

### Scenario Three: Lake-Warehouse Integration Federated Data Query

In modern data architectures, enterprises often adopt a lake-warehouse integration design to balance data storage costs and query performance. Under this architecture, two key challenges are frequently encountered:
- Limited Query Performance: When frequently querying data from data lakes, performance may be affected by network latency and third-party services, leading to query delays and impacting user experience.
- Complexity of Data Layer Modeling: In the data flow and transformation process from data lake to real-time data warehouse, complex ETL processes are usually required, which increases maintenance costs and development difficulty.
  
Using Doris asynchronous materialized views can effectively address these challenges:
- Transparent Rewriting Accelerates Queries: Materialize commonly used data lake query results into Doris internal storage, using transparent rewriting to effectively improve query performance.
- Simplify Layer Modeling: Support creating materialized views based on tables in the data lake, enabling convenient transformation from data lake to real-time data warehouse, greatly simplifying the data modeling process.

For example, using Hive:

Create Catalog based on Hive, using TPC-H dataset
```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

Create materialized view based on Hive Catalog
```sql
-- Materialized views can only be created on internal catalog, switch to internal catalog
switch internal;
create database hive_mv_db;
use hive_mv_db;

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

Run the following query, which will automatically use the materialized view for acceleration through transparent rewriting.
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

:::tip Note
Doris currently cannot detect data changes in external tables other than Hive. When external table data is inconsistent, using materialized views may result in data inconsistency. The following switch indicates: whether materialized views participating in transparent rewriting are allowed to include external tables, default false. If you accept data inconsistency or ensure external table data consistency through periodic refresh, you can set this switch to true.
Set whether materialized views containing external tables can be used for transparent rewriting, default not allowed, if you can accept data inconsistency or can ensure data consistency yourself, you can enable

`SET materialized_view_rewrite_enable_contain_external_table = true;`

If the materialized view is in MaterializedViewRewriteSuccessButNotChose status, it means the rewrite was successful but the plan was not chosen by CBO, possibly due to incomplete statistics of external tables.
Enable getting row count from file list for statistics

``SET enable_get_row_count_from_file_list = true;``
   
View external table statistics to confirm if they are complete

``SHOW TABLE STATS external_table_name;``
:::

### Scenario Four: Improving Write Efficiency, Reducing Resource Contention
In high-throughput data write scenarios, system stability and efficient data processing are equally important. Through the flexible refresh strategies of asynchronous materialized views, users can choose appropriate refresh methods based on specific scenarios, thereby reducing write pressure and avoiding resource contention.

Compared to synchronous materialized views, asynchronous materialized views provide three flexible refresh strategies: manual trigger, trigger-based, and periodic trigger. Users can choose suitable refresh strategies based on scenario requirements. When base table data changes, it won't immediately trigger materialized view refresh, and delayed refresh helps reduce resource pressure, effectively avoiding write resource contention.

As shown below, the chosen refresh method is periodic refresh, refreshing every 2 hours. When orders and lineitem import data, it won't immediately trigger materialized view refresh.

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

Transparent rewriting can rewrite query SQL and achieve query acceleration, while also being able to rewrite import SQL to improve import efficiency. Starting from version 2.1.6, when materialized view and base table data are strongly consistent, DML operations like Insert Into or Insert Overwrite can be transparently rewritten, which significantly improves performance for data import scenarios.

1. Create target table for Insert Into data
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

2. common_schedule_join_mv
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

Import statement before rewriting:
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

After transparent rewriting, the statement becomes:

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

Note that: If the DML operation involves external tables whose data changes cannot be detected, transparent rewriting may cause the latest base table data to not be imported into the target table in real-time. If users can accept data inconsistency or can ensure data consistency themselves, they can enable the following switch:

For DML, when the materialized view contains external tables whose data cannot be detected in real-time, whether to enable materialized view transparent rewriting based on structure information, default disabled

`SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;`