---
{
  "title": "Querying Async Materialized View",
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

Doris's asynchronous materialized views employ an algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern
structure information for transparent rewriting.

Doris can analyze the structural information of query SQL, automatically search for suitable materialized views,
and attempt transparent rewriting, utilizing the optimal materialized view to express the query SQL.

By utilizing precomputed materialized view results,
significant improvements in query performance and a reduction in computational costs can be achieved.

Using the three tables: lineitem, orders, and partsupp from TPC-H, let's describe the capability of directly querying
a materialized view and using the materialized view for transparent query rewriting.
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
  DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
  PROPERTIES ("replication_num" = "1");

insert into lineitem values
                       (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
                       (2, 4, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
                       (3, 2, 4, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-19', '2023-10-19', '2023-10-19', 'a', 'b', 'yyyyyyyyy');
```
```sql
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
    DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
    PROPERTIES ("replication_num" = "1");

    insert into orders values
    (1, 1, 'o', 9.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (1, 1, 'o', 10.5, '2023-10-18', 'a', 'b', 1, 'yy'),
    (2, 1, 'o', 11.5, '2023-10-19', 'a', 'b', 1, 'yy'),
    (3, 1, 'o', 12.5, '2023-10-19', 'a', 'b', 1, 'yy');
```

```sql
    CREATE TABLE IF NOT EXISTS partsupp (
      ps_partkey     INTEGER NOT NULL,
      ps_suppkey     INTEGER NOT NULL,
      ps_availqty    INTEGER NOT NULL,
      ps_supplycost  DECIMALV3(15,2)  NOT NULL,
      ps_comment     VARCHAR(199) NOT NULL 
    )
    DUPLICATE KEY(ps_partkey, ps_suppkey)
    DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3
    PROPERTIES (
      "replication_num" = "1"
    );

    insert into partsupp values
    (2, 3, 9, 10.01, 'supply1'),
    (4, 3, 10, 11.01, 'supply2'),
    (2, 3, 10, 11.01, 'supply3');
```

## Direct Query of Materialized View
A materialized view can be considered as a table and can be queried just like a regular table.

The syntax for defining a materialized view, details can be found in
[CREATE-ASYNC-MATERIALIZED-VIEW](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

Materialized view definition:
```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM
    (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders ON l_orderkey = o_orderkey;
```

Query statement:
Direct queries can be performed on the materialized view with additional filtering conditions and aggregations.

```sql
SELECT l_linenumber,
       o_custkey
FROM mv1
WHERE l_linenumber > 1 and o_orderdate = '2023-12-31';
```      

## Transparent Rewriting Capability
### Join rewriting


Join rewriting refers to when the tables used in the query and the materialization are the same.
In this case, the optimizer will attempt transparent rewriting by either joining the input of the materialized
view with the query or placing the join in the outer layer of the query's WHERE clause.

This pattern of rewriting is supported for multi-table joins and supported join types is as following:

* INNER JOIN
* LEFT OUTER JOIN
* RIGHT OUTER JOIN
* FULL OUTER JOIN
* LEFT SEMI JOIN
* RIGHT SEMI JOIN
* LEFT ANTI JOIN
* RIGHT ANTI JOIN

**Case 1:**

The following case can undergo transparent rewriting. The condition `l_linenumber > 1` allows for pull-up,
enabling transparent rewriting by expressing the query using the precomputed results of the materialized view.

Materialized view definition:
```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```
Query statement:

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

**Case 2:**

JOIN Derivation occurs when the join type between the query and the materialized view does not match.
In cases where the materialization can provide all the necessary data for the query, transparent rewriting can
still be achieved by compensating predicates outside the join through predicate push down.

For example:

Materialized view definition:
```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_shipdate, l_suppkey, o_orderdate
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

### Aggregate rewriting
In the definitions of both the query and the materialized view, the aggregated dimensions can either be consistent or inconsistent.
Filtering of results can be achieved by using fields from the dimensions in the WHERE clause.

The dimensions used in the materialized view need to encompass those used in the query,
and the metrics utilized in the query can be expressed using the metrics of the materialized view.

**Case 1**

The following case can undergo transparent rewriting. The query and the materialized view use consistent dimensions
for aggregation, allowing the use of fields from the dimensions to filter results. The query will attempt to use the
expressions after SELECT in the materialized view.

Materialized view definition:

```sql
CREATE MATERIALIZED VIEW mv4
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
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

Query statement:

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

**Case 2**

The following query can be transparently rewritten: the query and the materialization use aggregated dimensions
that are inconsistent, but the dimensions used in the materialized view encompass those used in the query.
The query can filter results using fields from the dimensions.

The query will attempt to roll up using the functions after SELECT, such as the materialized view's
bitmap_union will eventually roll up into bitmap_union_count, maintaining consistency with the semantics of
the count(distinct) in the query.

Materialized view definition:

```sql
CREATE MATERIALIZED VIEW mv5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
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

Query statement:

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

**Case 3**
Supports transparent rewriting for multidimensional aggregation. That is, if the materialized view does not contain 
GROUPING SETS, CUBE, ROLLUP, and there are multidimensional aggregations in the query. Additionally, if the fields 
after the group by in the materialized view include all the fields in the multidimensional aggregation in the query, 
then transparent rewriting can also be performed.


Materialized view definition:
```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
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

Query statement:
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


**Case 4**
When the query contains aggregation and the materialized view does not contain aggregation, if all the columns 
used in the query can be obtained from the materialized view, then the rewrite can also be successful.

Materialized view definition:
```sql
CREATE MATERIALIZED VIEW mv5_2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
AS
select case when o_shippriority > 1 and o_orderkey IN (4, 5) then o_custkey else o_shippriority end,
       o_orderstatus,
       bin(o_orderkey)
from orders;
```

Query statement:
```sql
select
    count(case when o_shippriority > 1 and o_orderkey IN (4, 5) then o_custkey else o_shippriority end),
    o_orderstatus,
    bin(o_orderkey)
from orders
group by
    o_orderstatus,
    bin(o_orderkey);
```


Temporary support for the aggregation roll-up functions is as follows:

| Functions in Queries | Functions in Materialized Views  | Aggregation Functions After Rewriting |
|----------------------|----------------------------------|---------------------------------------|
| max                  | max                              | max                                   |
| min                  | min                              | min                                   |
| sum                  | sum                              | sum                                   |
| count                | count                            | sum                                   |
| count(distinct )     | bitmap_union                     | bitmap_union_count                    |
| bitmap_union         | bitmap_union                     | bitmap_union                          |
| bitmap_union_count   | bitmap_union                     | bitmap_union_count                    |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union 或者 hll_raw_agg    | hll_union_agg      |


## Query partial Transparent Rewriting (Coming soon)
When the number of tables in the materialized view is greater than the query, if the materialized view
satisfies the conditions for JOIN elimination for tables more than the query, transparent rewriting can also occur.
For example:

**Case 1**

Materialized view definition:

```sql
 CREATE MATERIALIZED VIEW mv6
 BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
 DISTRIBUTED BY RANDOM BUCKETS 3
 PROPERTIES ('replication_num' = '1')
 AS
 SELECT
     l_linenumber,
     o_custkey,
     ps_availqty
 FROM lineitem
 LEFT OUTER JOIN orders ON L_ORDERKEY = O_ORDERKEY
 LEFT OUTER JOIN partsupp ON l_partkey = ps_partkey
 AND l_suppkey = ps_suppkey;
```

Query statement:
```sql
 SELECT
     l_linenumber,
     o_custkey,
     ps_availqty
 FROM lineitem
 LEFT OUTER JOIN orders ON L_ORDERKEY = O_ORDERKEY;
```

## Union Rewriting
When a materialized view is insufficient to provide all the data required by a query, a UNION ALL approach can be used to combine data from both the original table and the materialized view for the final result. Currently, the materialized view needs to be a partitioned materialized view, and UNION ALL can be used to supplement the data by applying the filter conditions on the partition fields.
For example:

**Case 1**

Materialized view definition:

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1') 
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

When a new partition 2023-10-21 is added to the base table and the materialized view has not yet been refreshed, the result can be returned by combining the materialized view with the original table using UNION ALL.

```sql
insert into lineitem values
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```


Query statement:
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

Rewriting result:
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

Noted:
The materialized view includes a WHERE condition. For example, if the materialized view is constructed with the filter condition WHERE l_shipdate > '2023-10-19' and the query condition is WHERE l_shipdate > '2023-10-18', this situation currently cannot be compensated for using UNION ALL. This will be supported in the future.

## Nested Materialized View Rewrite
The definition SQL of a materialized view can use another materialized view; this type of materialized view is called a nested materialized view. Theoretically, there is no limit to the number of nested layers. This materialized view can be queried directly or can participate in transparent rewrite operations. Nested materialized views can also be involved in transparent rewrites.

**Case 1**

Here is an example to illustrate how nested materialized views work:

First, create the inner materialized view `mv8_0_inner_mv`.

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
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

Create the outer materialized view `mv8_0`.

```sql
CREATE MATERIALIZED VIEW mv8_0
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
l_orderkey,
ps_availqty
from mv8_0_inner_mv
inner join partsupp on l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

The following query will result in successful rewrite for both mv8_0_inner_mv and mv8_0. Ultimately, the cost-based optimizer will select mv8_0.

```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```

**Note:**

1. The more layers of nested materialized views, the longer the time it will take for transparent rewriting. It is recommended not to exceed 3 layers of nested materialized views.
2. Transparent rewriting of nested materialized views is disabled by default. See the switch below for enabling it.



## Auxiliary Functions
**Data Consistency Issues After Transparent Rewriting**


The unit of `grace_period` is seconds, referring to the permissible time for inconsistency between the materialized
view and the data in the underlying base tables.

For example, setting `grace_period` to 0 means requiring the materialized view to be consistent with the base
table data before it can be used for transparent rewriting. As for external tables,
since changes in data cannot be perceived, the materialized view is used with them.
Regardless of whether the data in the external table is up-to-date or not, this materialized view can be used for
transparent rewriting. If the external table is configured with an HMS metadata source,
it becomes capable of perceiving data changes. Configuring the metadata source and enabling data change
perception functionality will be supported in subsequent iterations.

Setting `grace_period` to 10 means allowing a 10-second delay between the data in the materialized view and
the data in the base tables. If there is a delay of up to 10 seconds between the data in the materialized
view and the data in the base tables, the materialized view can still be used for transparent rewriting within
that time frame.

For internal tables in the materialized view, you can control the maximum delay allowed for the data used by
the transparent rewriting by setting the `grace_period` property.
Refer to [CREATE-ASYNC-MATERIALIZED-VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

**Viewing and Debugging Transparent Rewrite Hit Information**

You can use the following statements to view the hit information of transparent rewriting for a materialized view.
It will display a concise overview of the transparent rewriting process.

`explain <query_sql>` The information returned is as follows, with the relevant information pertaining to materialized views extracted:
```text
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

**MaterializedViewRewriteSuccessAndChose**: Transparent rewrite succeeded, and the materialized view names list
chosen by the CBO.

**MaterializedViewRewriteSuccessButNotChose**: Transparent rewrite succeeded, but the final CBO did not choose the
materialized view names list.

**MaterializedViewRewriteFail**: Lists transparent rewrite failures and summarizes the reasons.



If you want to know the detailed information about materialized view candidates, rewriting, and the final selection process,
you can execute the following statement. It will provide a detailed breakdown of the transparent rewriting process.

`explain memo plan <query_sql>`

## Relevant Environment Variables

| Switch                                                              | Description                                                                                                                                                                                                                                                                                                    |
|---------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SET enable_nereids_planner = true;                                  | Asynchronous materialized views are only supported under the new optimizer, so the new optimizer needs to be enabled.                                                                                                                                                                                          |
| SET enable_materialized_view_rewrite = true;                        | Enable or disable query transparent rewriting, default is enabled                                                                                                                                                                                                                                              |
| SET materialized_view_rewrite_enable_contain_external_table = true; | Whether materialized views participating in transparent rewriting are allowed to contain external tables, default is not allowed                                                                                                                                                                               |
| SET materialized_view_rewrite_success_candidate_num = 3;            | Transparently rewrites the successful result set, allowing the maximum number of CBO candidates to participate, the default is 3                                                                                                                                                                               |
| SET enable_materialized_view_union_rewrite = true;                  | Whether to allow the union of base table and materialized view using UNION ALL when the partitioned materialized view is insufficient to provide all the data required by a query. Default is enabled.                                                                                                         |
| SET enable_materialized_view_nest_rewrite = true;                   | Whether to allow nested rewriting. Default is disabled.                                                                                                                                                                                                                                                        |
| SET materialized_view_relation_mapping_max_count = 8;               | Maximum number of relation mappings allowed during transparent rewrite. If exceeded, truncation will occur. Relation mapping is typically generated by self-joins in tables and the number is usually the Cartesian product, for example, if there are 3 tables, it may generate 8 combinations. Default is 8. |

## Limitations
- Materialized view definition statements are only allowed to include SELECT, FROM, WHERE, JOIN, and GROUP BY clauses.
- The input to JOIN can include simple GROUP BY (single-table aggregation). Supported JOIN types include INNER, LEFT OUTER JOIN,
- RIGHT OUTER JOIN, FULL OUTER JOIN, LEFT SEMI JOIN, RIGHT SEMI JOIN, LEFT ANTI JOIN, and RIGHT ANTI JOIN.

- Materialized views based on External Tables do not guarantee strong consistency of query results.

- The use of non-deterministic functions to construct materialized views is not supported, including rand, now, current_time,
- current_date, random, uuid, etc.

- Transparent rewriting does not support window functions.

- Materialized views with LIMIT are currently not supported for transparent rewriting.

- Currently, materialized view definitions cannot utilize views or other materialized views.

- When the query or materialized view has no data, transparent rewriting is not supported.

- Currently, WHERE condition compensation only supports compensating conditions on numeric and date type columns.
  For example, if the materialized view is defined as a > 5 and the query is a > 10, transparent rewriting is supported.

## Frequently Asked Questions

### 1. Why isn't the materialized view being used?
To determine why a materialized view is not being used, execute the following SQL:

`explain your_query_sql;`

a. The transparent rewriting feature for materialized views is disabled by default. You need to enable the corresponding switch for it to work. See the related switches for asynchronous materialized views.

b. The materialized view may not be available, causing transparent rewriting to fail. Check the status of materialized view construction, see problem 2.

c. After checking the first two steps, if the materialized view is still not being used, it may be because the definition SQL of the materialized view and the query SQL are not within the current capability of the materialized view rewriting. See the capabilities of materialized view transparent rewriting.

### 2. How to check if the materialized view status is normal?
#### 2.1 Confirm the Materialized View Construction Status
To participate in transparent rewriting, the status of the materialized view must be Success. First, run the following SQL to check the JobName of the materialized view:

`select * from mv_infos('database'='db_name') where Name = 'mv_name'`

Next, use the JobName to check the task status of the materialized view. Run the following SQL:

`select * from tasks("type"="mv") where JobName = 'job_name';`

Check if the status of the most recent task execution is Success.

#### 2.2 Confirm the Availability of Consistent Materialized View Data
If the materialized view is successfully built but is unavailable due to data changes and the `grace_period` setting,
confirm the availability of consistent materialized view data.

**For Full Refresh Materialized Views:**

Run the following SQL and check if the `SyncWithBaseTables` field is 1:

`select * from mv_infos('database'='db_name') where Name = 'mv_name'`

**For Partitioned Materialized Views:**

Run the following SQL to check if the partitions used in the query are valid:
`show partitions from mv_name;`

### 3. Error During Materialized View Construction
Error Message:

`ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL`

a. The statement for asynchronous materialized views is only supported under the new optimizer.
Ensure that the new optimizer is enabled:

`SET global enable_nereids_planner = true;`

b. It's possible that there is a typo in the keywords used in the statement to build the materialized view, or there
may be syntax errors in the materialized view definition SQL. Check the materialized view definition SQL and the create
materialized view statement to ensure correctness.

### 4. Error: Unable to Find a Suitable Base Table for Partitioning
This error typically indicates that the SQL definition of the materialized view and the selection of partitioning fields
for the materialized view are not suitable for partitioned incremental updates. Therefore, creating a partitioned
materialized view will result in this error.

For a materialized view to support partitioned incremental updates, it needs to meet certain requirements.
For more details, refer to the [CREATE ASYNC MATERIALIZED VIEW documentation](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md).

Here is an example to illustrate the construction of a partitioned materialized view:

```sql
   CREATE TABLE IF NOT EXISTS lineitem (
   l_orderkey    INTEGER NOT NULL,
   l_partkey     INTEGER NOT NULL,
   l_suppkey     INTEGER NOT NULL,
   l_linenumber  INTEGER NOT NULL,
   l_quantity    DECIMALV3(15,2) NOT NULL,
   l_extendedprice  DECIMALV3(15,2) NOT NULL,
   l_discount    DECIMALV3(15,2) NOT NULL,
   l_tax         DECIMALV3(15,2) NOT NULL,
   l_returnflag  CHAR(1) NOT NULL,
   l_linestatus  CHAR(1) NOT NULL,
   l_shipdate    DATE NOT NULL,
   l_commitdate  DATE NOT NULL,
   l_receiptdate DATE NOT NULL,
   l_shipinstruct CHAR(25) NOT NULL,
   l_shipmode     CHAR(10) NOT NULL,
   l_comment      VARCHAR(44) NOT NULL
   )
   DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
   PARTITION BY RANGE(l_shipdate) (
   PARTITION `day_1` VALUES LESS THAN ('2023-12-9'),
   PARTITION `day_2` VALUES LESS THAN ("2023-12-11"),
   PARTITION `day_3` VALUES LESS THAN ("2023-12-30"))
   DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
   PROPERTIES (
   "replication_num" = "1"
              );
```

```sql
    CREATE TABLE IF NOT EXISTS orders  (
   o_orderkey       INTEGER NOT NULL,
   o_custkey        INTEGER NOT NULL,
   o_orderstatus    CHAR(1) NOT NULL,
   o_totalprice     DECIMALV3(15,2) NOT NULL,
   o_orderdate      DATE NOT NULL,
   o_orderpriority  CHAR(15) NOT NULL,
   o_clerk          CHAR(15) NOT NULL,
   o_shippriority   INTEGER NOT NULL,
   O_COMMENT        VARCHAR(79) NOT NULL
   )
   DUPLICATE KEY(o_orderkey, o_custkey)
   PARTITION BY RANGE(o_orderdate) (
   PARTITION `day_2` VALUES LESS THAN ('2023-12-9'),
   PARTITION `day_3` VALUES LESS THAN ("2023-12-11"),
   PARTITION `day_4` VALUES LESS THAN ("2023-12-30")
   )
   DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
   PROPERTIES (
   "replication_num" = "1"
              );
```
If l_shipdate is the partition field of the base table lineitem, the following materialized view can be incrementally
updated by partition.

```sql
CREATE MATERIALIZED VIEW mv9
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE,
       count(O_ORDERDATE) over (partition by l_shipdate order by l_orderkey) as window_count
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

The following materialized view cannot be incrementally updated by partition because l_shipdate is generated from the
right side of a LEFT OUTER JOIN and may produce null values.

```sql
CREATE MATERIALIZED VIEW mv10
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE,
       count(O_ORDERDATE) over (partition by l_shipdate order by l_orderkey) as window_count
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

### 5. The materialized view returns no data upon direct query?
The materialized view might still be under construction or the construction process might have failed. Use the following
statement to check the status of materialized view construction:

```sql
   -- 查看物化视图元数据信息,database 为当前数据库, mv_name 为物化视图名称
   select * from mv_infos('database'='db_name') where Name = 'mv_name' \G
```

```sql
-- 查看任务元数据
select * from jobs("type"="mv") order by CreateTime limit 5;
```
```sql
-- 查看任务执行信息，这里面会展示任务执行的状态，如果失败会有失败原因
select * from tasks("type"="mv") where JobName = 'job_name';
```

### 6. What happens when the data in the base tables used by the materialized view changes before the materialized view is refreshed?
The timeliness of data in asynchronous materialized views has a certain delay compared to the base tables.

For internal tables and external tables that can perceive data changes (such as Hive tables),
whether a materialized view can be used for transparent rewriting when the data in the base tables changes
before the materialized view is refreshed depends on the threshold set by `grace_period`.

`grace_period` refers to the time allowance for the materialized view to be inconsistent with the data from the base tables.

For example, if `grace_period` is set to 0, it means that the materialized view must be consistent with the data in the base
tables before it can be used for transparent rewriting.

For external tables (except Hive tables), since data changes cannot be perceived, the materialized view can be used for transparent rewriting regardless of whether the data in the external tables is up-to-date (in this case, data inconsistency may occur).

If `grace_period` is set to 10, it means that the materialized view and the base table data are allowed to have a delay of 10 seconds. If there is a delay in the data of the materialized view compared to the base tables within 10 seconds, the materialized view can still be used for transparent rewriting.

For partitioned materialized views, if some partitions become invalid, there are two scenarios:

a. If the query does not use data from the invalid partitions, the materialized view can still be used for transparent rewriting.

b. If the query uses data from the invalid partitions and the data is within the grace_period, the materialized view can still be used. If the data in the materialized view is not within the grace_period, the query can be responded to by using UNION ALL with the original table and the materialized view.

### 7. How to confirm if the materialized view is hit, and how to check the reason if it's not hit?

You can use the `explain query_sql` command to see a summary of whether the materialized view is hit or not. For example,
consider the following materialized view:

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

Now, let's analyze the following query:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

The explain command will show information about whether the materialized view is hit or not.
If it's not hit, it will provide a summary of the failure reason. For example:
```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent
```

In this case, the failure reason is `The graph logic between query and view is not consistent`,
which means that the join order in the query is not consistent with the join order in the materialized view.

Let's consider another query:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

If this query also fails to hit the materialized view, the summary might be:

```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions    
```

In this case, the failure reason is `View dimensions doesn't not cover the query dimensions`, indicating that
the fields used in the `GROUP BY` clause of the query cannot be obtained from the `GROUP BY` clause
of the materialized view.