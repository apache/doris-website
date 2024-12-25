---
{
    "title": "Transparent Rewriting by Async-Materialized View",
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

## Overview

The [multi-table materialized view](../../materialized-view/async-materialized-view/overview.md) adopts a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern. This algorithm can analyze the structural information of the query SQL, automatically find the appropriate materialized views, and attempt to perform transparent rewriting to express the query SQL using the optimal materialized views. By using the pre-computed results of materialized views, the query performance can be significantly improved and the computing cost can be reduced.

## Case

Next, an example will be used to demonstrate in detail how to utilize multi-table materialized views to accelerate queries.

### Create Base Tables

Firstly, create the tpch database and then create two tables, namely `orders` and `lineitem`, within it, and insert corresponding data.

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

### Create an Asynchronous Materialized View

Based on several original tables in the tpch benchmark, create an asynchronous materialized view named `mv1`.

```sql
CREATE MATERIALIZED VIEW mv1   
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)  
DISTRIBUTED BY RANDOM BUCKETS 2  
PROPERTIES ('replication_num' = '1')   
	@@ -119,107 +114,55 @@ l_partkey,
l_suppkey;
```

### Use the Materialized View for Transparent Rewriting

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

It can be seen from the `explain shape plan` that the plan after being transparently rewritten by `mv1` has already hit `mv1`. You can also use `explain` to view the current state of the plan after being rewritten by the materialized view, including whether it has hit and which materialized view has been hit, etc., as shown below:

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

## Summary

By using multi-table materialized views, the query performance can be significantly improved, especially for complex join and aggregation queries. When using them, the following points need to be noted:

:::tip Usage Suggestions
- Pre-computed Results: Materialized views pre-compute and store the query results, avoiding the overhead of repeated computations for each query. This is especially effective for complex queries that need to be executed frequently.
- Reducing Join Operations: Materialized views can combine the data of multiple tables into one view, reducing the join operations during queries and thus improving query efficiency.
- Automatic Updates: When the data in the base tables changes, materialized views can be updated automatically to maintain data consistency. This ensures that the query results always reflect the latest data status.
- Space Overhead: Materialized views require additional storage space to save the pre-computed results. When creating materialized views, it is necessary to balance the improvement in query performance and the consumption of storage space.
- Maintenance Cost: The maintenance of materialized views requires certain system resources and time. Base tables that are updated frequently may lead to relatively high update overheads for materialized views. Therefore, it is necessary to choose an appropriate refresh strategy according to the actual situation.
- Applicable Scenarios: Materialized views are suitable for scenarios where the data change frequency is low and the query frequency is high. For frequently changing data, real-time computation may be more appropriate.
  :::

Reasonable utilization of multi-table materialized views can significantly improve the query performance of the database, especially in the case of complex queries and large data volumes. Meanwhile, factors such as storage and maintenance also need to be considered comprehensively to achieve a balance between performance and cost. 