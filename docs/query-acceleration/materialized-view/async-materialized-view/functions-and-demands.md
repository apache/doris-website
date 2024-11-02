---
{
  "title": "Functions and Demands",
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


This document provides a comprehensive overview of Materialized View DDL (Data Definition Language) operations, metadata querying, permission requirements, data lake refresh support, relationships with OLAP internal tables, direct querying, query rewriting capabilities, and basic commands.

## DDL and Basic Operations

### Create Materialized View:

**1. Refer to [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW)**

**2. New Attribute**

- use_for_rewrite:: Indicates whether this materialized view participates in transparent rewriting. If set to false, it does not participate in transparent rewriting; the default is true. In data modeling scenarios, if the materialized view is only used for direct queries, this attribute can be set for the materialized view to prevent it from participating in transparent rewriting, thereby improving query response speed.

**3. Partitioned Materialized Views**

When creating a partitioned materialized view, only the `date_trunc` function and constants are allowed for expressions referencing the partition field. The following statement meets the requirements:

The column referenced by the partition field only uses the `date_trunc` function.

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL     
PARTITION BY (date_alias)     
DISTRIBUTED BY RANDOM BUCKETS 2     
PROPERTIES ('replication_num' = '1')     
AS     
SELECT     
  l_linestatus,     
  date_trunc(o_orderdate) AS date_alias,     
  o_shippriority     
FROM     
  orders     
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

The following example cannot create a partitioned materialized view because the expression referencing the partition field uses the `to_date` function:

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL     
PARTITION BY (date_alias)     
DISTRIBUTED BY RANDOM BUCKETS 2     
PROPERTIES ('replication_num' = '1')     
AS     
SELECT     
  l_linestatus,     
  to_date(o_orderdate) AS date_alias,     
  o_shippriority     
FROM     
  orders     
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 2 Alter Materialized View

Refer to [ALTER ASYNC MATERIALIZED VIEW](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-ASYNC-MATERIALIZED-VIEW)

### 3 Drop Materialized View

Refer to [DROP ASYNC MATERIALIZED VIEW](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-ASYNC-MATERIALIZED-VIEW)

### 4 Refresh Materialized View

Refer to [REFRESH MATERIALIZED VIEW](https://doris.apache.org/docs/sql-manual/sql-statements/Utility-Statements/REFRESH-MATERIALIZED-VIEW/)

### 5 Pause Materialized View

Refer to [PAUSE MATERIALIZED VIEW](https://doris.apache.org/docs/sql-manual/sql-statements/Utility-Statements/PAUSE-MATERIALIZED-VIEW)

### 6 Resume Materialized View

Refer to [RESUME MATERIALIZED VIEW](https://doris.apache.org/docs/sql-manual/sql-statements/Utility-Statements/RESUME-MATERIALIZED-VIEW)

### 7 Cancel Refresh Task

Refer to [CANCEL MATERIALIZED VIEW TASK](https://doris.apache.org/docs/sql-manual/sql-statements/Utility-Statements/CANCEL-MATERIALIZED-VIEW-TASK)

## Metadata Querying

- Query Materialized View Information: use [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv-infos)

- Query Task Information: use [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks?_highlight=task)

- Query Job Information Related to Materialized View: use [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)

- Query Partition Information: use [SHOW PARTITIONS](../../../sql-manual/sql-statements/Show-Statements/SHOW-PARTITIONS)

- View Table Structure: use [DESCRIBE](../../../sql-manual/sql-statements/Utility-Statements/DESCRIBE)

- View Creation Statement: use [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/Show-Statements/SHOW-CREATE-MATERIALIZED-VIEW/)

## Permission

- Create Materialized View: requires permission to create materialized views (similar to creating tables) and execute the underlying SELECT query (similar to SELECT permission).

- Delete Materialized View: requires permission to delete materialized views (similar to deleting tables).

- Alter Materialized View: requires permission to modify materialized views (similar to modifying tables).

- Pause/Resume/Cancel/Refresh Materialized View: requires permission to create materialized views.

## Materialized Refresh Support in Data Lakes

The level of support for materialized refresh varies by table type and catalog:

| Table Type | Catalog Type | Full Refresh        | Partition Refresh   | Triggered Refresh     |
| ---------- | ------------ | ------------------- | ------------------- | --------------------- |
| Internal   | Internal     | Supported since 2.1 | Supported since 2.1 | Supported since 2.1.4 |
| External   | Hive         | Supported since 2.1 | Supported since 2.1 | Not Supported         |
| Iceberg    | Supported    | Not Supported       | Not Supported       |                       |
| Paimon     | Supported    | Not Supported       | Not Supported       |                       |
| Hudi       | Supported    | Not Supported       | Not Supported       |                       |
| JDBC       | Supported    | Not Supported       | Not Supported       |                       |
| ES         | Supported    | Not Supported       | Not Supported       |                       |

## Materialized Views and OLAP Internal Tables

:::tips
Since version 2.1.4, materialized views support the Duplicate model.
:::

Materialized views are implemented as OLAP tables using the Duplicate model. This means they theoretically support all DUPLICATE model features. However, certain restrictions apply to ensure efficient data refreshes:

1. Materialized view partitions are automatically created and maintained based on their base tables; manual partitioning is not allowed.

2. Operations like `DELETE TABLE` or `RENAME TABLE` cannot be used directly on materialized views due to associated jobs; use materialized view-specific commands instead.

3. Column data types are derived from the query and cannot be modified, as this may cause refresh tasks to fail.

4. Materialized views have properties unique to them, which must be modified using materialized view commands. Common properties are modified using `ALTER TABLE`.

5. Commands like `DESC` and `SHOW PARTITIONS` can be used to view materialized view descriptions and partition information.

6. Materialized views support index creation.

7. Synchronous materialized views can be created based on existing materialized views.

## Direct Querying

The create table statement is as follows:

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

Materialized Views can be queried directly like tables.

For example:

**1. Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv1
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

For more details, refer to  [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW)

**2. Query Statement:**

Materialized Views allow the addition of filter conditions and aggregate/rollup commands for direct querying

```sql
SELECT
l_linenumber,
o_custkey
FROM mv1
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

## Rewriting Query

### Condition Compensation

When the `WHERE` conditions of the materialized view and query are connected by `AND`:

**1. If the query's conditions contain those of the materialized view:** 

Compensation is possible.

For example, if the query is `a > 5 AND b > 10 AND c = 7` and the materialized view's conditions are `a > 5 AND b > 10`, only `c = 7` needs to be added.

**2. If the query's conditions can be derived from the materialized view's conditions:** 

Compensation is also possible.

For example, if the query is `a > 5 AND b = 10` and the materialized view is `a > 1 AND b > 8`, compensation is feasible since the materialized view's conditions encompass the query's.

Limitations:

- Conditions connected by OR cannot be compensated; they must match exactly.

- Non-comparative and range expressions like LIKE cannot be compensated; they must match exactly.

### JOIN Rewriting

JOIN rewriting applies when the query and materialized view use the same tables. The optimizer attempts transparent rewriting for such queries.

Supported JOIN types include:

- INNER JOIN

- LEFT OUTER JOIN

- RIGHT OUTER JOIN

- FULL OUTER JOIN

- LEFT SEMI JOIN

- RIGHT SEMI JOIN

- LEFT ANTI JOIN

- RIGHT ANTI JOIN

### JOIN Derivation

When JOIN types differ but the materialized view provides all necessary data, rewriting is possible with predicate compensation outside the JOIN.

For example:

**1. Create Materialized view**

```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
PROPERTIES ('replication_num' = '1')
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

**2. Query statement**

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

### Aggregation Rewriting

Rewriting occurs when the group dimensions match between the query and materialized view, and the aggregation functions are compatible.

For example: 

The following query can be transparently rewritten because the aggregation dimensions used in the query and the materialized view are consistent. The materialized view's `o_shippriority` field can be used to filter the results. The `GROUP BY` dimensions and aggregation functions in the query can be rewritten using the `GROUP BY` dimensions and aggregation functions of the materialized view.

**1. Create Materialized View**

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

**2. Query Statement**

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

### Roll-Up Aggregation Rewriting

In the definition of a query and a materialized view, even if the aggregation dimensions do not align, rewriting is still possible. The `GROUP BY` dimensions used in the materialized view need to encompass those used in the query, though the query itself may not contain a `GROUP BY` clause. Additionally, the aggregation functions used in the query can be represented using the aggregation functions from the materialized view.

Here is an example:

The following query can be transparently rewritten. The aggregation dimensions used in the query and the materialized view do not align, but the dimensions used in the materialized view encompass those in the query. The query can filter results using fields within the dimensions. The query will attempt to roll up functions after the `SELECT` in the materialized view. For instance, `bitmap_union` in the materialized view can be rolled up to `bitmap_union_count`, which aligns with the semantics of `count(distinct)` in the query.

**1. Create Materialized View:**

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

**2. Query Statement:**

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

The currently supported list of aggregation roll-up functions is as follows:

| Function in Querying                                  | Function in MV             | 函数上卷后         |
| ----------------------------------------------------- | -------------------------- | ------------------ |
| max                                                   | max                        | max                |
| min                                                   | min                        | min                |
| sum                                                   | sum                        | sum                |
| count                                                 | count                      | sum                |
| count(distinct)                                       | bitmap_union               | bitmap_union_count |
| bitmap_union                                          | bitmap_union               | bitmap_union       |
| bitmap_union_count                                    | bitmap_union               | bitmap_union_count |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union 或者 hll_raw_agg | hll_union_agg      |

### Multi-Dimensional Aggregation Rewriting

Rewriting is supported for multi-dimensional aggregations if the materialized view's GROUP BY fields cover all those in the query.

Here is an example:

**1. Create Materialized View:**

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

**2. Query Statement:**

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

### Partition Compensation Rewriting

When a partitioned materialized view does not provide all the data required for a query, the `UNION ALL` operation can be used to combine the data from the original query table and the materialized view, with the result of this union serving as the final output.

For example

**1. Create Materialized view**

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

当基表新增分区 `2023-10-21` 时，并且物化视图还未刷新时，可以通过物化视图 `union all` 原表的方式返回结果。

```sql
insert into lineitem values
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

**2. Run Query**

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

**3. Result**

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

:::caution
Currently, partition compensation is supported, but conditional UNION ALL compensation is not yet supported.

For example, if the materialized view has a WHERE condition, taking the previous example, if the materialized view's filtering condition includes `WHERE l_shipdate > '2023-10-19'`, but the query condition is `WHERE l_shipdate > '2023-10-18'`, currently, this scenario cannot be compensated using UNION ALL. This feature is pending support.
:::

### Nested Materialized View Rewriting

The SQL definition of a materialized view can utilize other materialized views, referred to as nested materialized views. There is theoretically no limit to the number of nesting levels, and such materialized views can be queried directly or transparently rewritten. Nested materialized views are also eligible for transparent rewriting.

Here's an example:

**1. Create the inner nested materialized view `mv8_0_inner_mv`:**

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

**2. Create the outer nested materialized view `mv8_0`:**

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

For the following query, both `mv8_0_inner_mv` and `mv8_0` will be successfully rewritten, with the cost-based optimizer ultimately selecting `mv8_0`:

```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```

Notes:

1. As the number of nesting levels increases, the time required for transparent rewriting also increases. It is recommended to limit nested materialized views to no more than 3 levels.

2. Transparent rewriting for nested materialized views is disabled by default. Refer to the switch settings below for enabling it.

## Explain Query Rewriting

Query Rewrite Hit Analysis for Debugging and Inspection

**1. To view the hit analysis of materialized view rewrite for debugging and inspection, execute the following statement, which provides a brief overview of the query rewrite process.**

```sql
explain <query_sql> 
```

The returned information is shown below, with a snippet focusing on materialized view-related details:

```sql
| MaterializedView                                                                                             |
| MaterializedViewRewriteSuccessAndChose:                                                                      |
|   Names: mv5                                                                                                 |
| MaterializedViewRewriteSuccessButNotChose:                                                                   |
|                                                                                                              |
| MaterializedViewRewriteFail:                                                                                 |
|   Name: mv4                                                                                                  |
|   FailSummary: Match mode is invalid, View struct info is invalid                                            |
|   Name: mv3                                                                                                  |
|   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid |
|   Name: mv1                                                                                                  |
|   FailSummary: The columns used by query are not in view, View struct info is invalid                        |
|   Name: mv2                                                                                                  |
|   FailSummary: The columns used by query are not in view, View struct info is invalid                        |
```

- MaterializedViewRewriteSuccessAndChose: Indicates successful rewrite where the Cost-Based Optimizer (CBO) selected a materialized view. Lists the names of the materialized views chosen by the CBO.

- MaterializedViewRewriteSuccessButNotChose: Indicates successful rewrite but the CBO ultimately did not select any of these materialized views. Lists the names of these materialized views.

- MaterializedViewRewriteFail: Summarizes the instances where rewrite failed, including the reasons for failure.

**2. To gain a detailed understanding of the candidate selection, rewrite process, and final choice made by the CBO for materialized views, execute the following statement:**

```sql
explain memo plan <query_sql>
```

## Reference

### Materialized View Related Configuration

| Configuration                                                | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | Enables the new optimizer required for materialized view rewriting. |
| SET enable_materialized_view_rewrite = true;                 | Enables or disables query rewriting. Default: Enabled.       |
| SET materialized_view_rewrite_enable_contain_external_table = true; | Allows materialized views containing external tables to participate in rewriting. Default: Disabled. |
| SET materialized_view_rewrite_success_candidate_num = 3;     | Maximum number of successful rewrite candidates considered by CBO. Default: 3. |
| SET enable_materialized_view_union_rewrite = true;           | Allows UNION ALL between base tables and materialized views when data is insufficient. Default: Enabled. |
| SET enable_materialized_view_nest_rewrite = true;            | Enables nested materialized view rewriting. Default: Disabled. |
| SET materialized_view_relation_mapping_max_count = 8;        | Maximum number of relation mappings during rewriting. Default: 8. |