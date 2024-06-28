---
{
  "title": "查询异步物化视图",
  "language": "zh-CN"
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

## 概述
Doris 的异步物化视图采用了基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式结构信息来进行透明改写的算法。

Doris 可以分析查询 SQL 的结构信息，自动寻找满足要求的物化视图，并尝试进行透明改写，使用最优的物化视图来表达查询 SQL。

通过使用预计算的物化视图结果，可以大幅提高查询性能，减少计算成本。

以 TPC-H 的三张 lineitem，orders 和 partsupp 表来描述直接查询物化视图和使用物化视图进行查询透明改写的能力。
表的定义如下：
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

## 直查物化视图
物化视图可以看作是表，可以像正常的表一样直接查询。

**用例 1:**

物化视图的定义语法，详情见 [CREATE-ASYNC-MATERIALIZED-VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

mv 定义：
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
查询语句：

可以对物化视图添加过滤条件和聚合等，进行直接查询。

```sql
SELECT l_linenumber,
       o_custkey
FROM mv1
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

## 透明改写能力
### JOIN 改写
Join 改写指的是查询和物化使用的表相同，可以在物化视图和查询 Join 的输入或者 Join 的外层写 where，优化器对此 pattern 的查询会尝试进行透明改写。

支持多表 Join，支持 Join 的类型为：
* INNER JOIN
* LEFT OUTER JOIN
* RIGHT OUTER JOIN
* FULL OUTER JOIN
* LEFT SEMI JOIN
* RIGHT SEMI JOIN
* LEFT ANTI JOIN
* RIGHT ANTI JOIN

**用例 1:**

如下查询可进行透明改写，条件 `l_linenumber > 1`可以上拉，从而进行透明改写，使用物化视图的预计算结果来表达查询。

mv 定义：
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
查询语句：
```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

**用例 2:**

JOIN 衍生，当查询和物化视图的 JOIN 的类型不一致时，如果物化可以提供查询所需的所有数据时，通过在 JOIN 的外部补偿谓词，也可以进行透明改写，

举例如下

mv 定义：
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

查询语句：
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

### 聚合改写
查询和物化视图定义中，聚合的维度可以一致或者不一致，可以使用维度中的字段写 WHERE 对结果进行过滤。

物化视图使用的维度需要包含查询的维度，并且查询使用的指标可以使用物化视图的指标来表示。

**用例 1**

如下查询可以进行透明改写，查询和物化使用聚合的维度一致，可以使用维度中的字段进行过滤结果，并且查询会尝试使用物化视图 SELECT 后的表达式。

mv 定义：
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

查询语句：

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

**用例 2**

如下查询可以进行透明改写，查询和物化使用聚合的维度不一致，物化视图使用的维度包含查询的维度。查询可以使用维度中的字段对结果进行过滤，

查询会尝试使用物化视图 SELECT 后的函数进行上卷，如物化视图的 `bitmap_union` 最后会上卷成 `bitmap_union_count`，和查询中
`count(distinct)` 的语义保持一致。

mv 定义：
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

查询语句：
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

暂时目前支持的聚合上卷函数列表如下：

| 查询中函数                                                 | 物化视图中函数                     | 函数上卷后              |
|-------------------------------------------------------|-----------------------------|--------------------|
| max                                                   | max                         | max                |
| min                                                   | min                         | min                |
| sum                                                   | sum                         | sum                |
| count                                                 | count                       | sum                |
| count(distinct )                                      | bitmap_union                | bitmap_union_count |
| bitmap_union                                          | bitmap_union                | bitmap_union       |
| bitmap_union_count                                    | bitmap_union                | bitmap_union_count |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union 或者 hll_raw_agg    | hll_union_agg      |

## Query partial 透明改写（Coming soon）
当物化视图的表比查询多时，如果物化视图比查询多的表满足 JOIN 消除的条件，那么也可以进行透明改写，如下可以进行透明改写，待支持。

**用例 1**

mv 定义：
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

查询语句：
```sql
 SELECT
     l_linenumber,
     o_custkey,
     ps_availqty
 FROM lineitem
 LEFT OUTER JOIN orders ON L_ORDERKEY = O_ORDERKEY;
```

## Union 改写
当物化视图不足以提供查询的所有数据时，可以使用 union all 的方式，将查询原表和物化视图的数据结合作为最终返回结果。
目前需要物化视图是分区物化视图，可以对分区字段的过滤条件使用 union all 补全数据。

**用例 1**

mv 定义：
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

当基表新增分区 `2023-10-21` 时，并且物化视图还未刷新时，可以通过物化视图 union all 原表的方式返回结果

```sql
insert into lineitem values
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

运行查询语句：
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

改写结果示意：
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

注意：
物化视图带 where 条件，以上述为例，如果构建物化的过滤条件加上 `where l_shipdate > '2023-10-19'` 查询是 `where l_shipdate > '2023-10-18'`
目前这种还无法通过 union 补偿，待支持


## 嵌套物化视图改写
物化视图的定义SQL可以使用物化视图，此物化视图称为嵌套物化视图，嵌套的层数理论上没有限制，此物化视图可以直查，也可以进行透明改写。
嵌套物化视图也可以参与透明改写。

**用例 1**

首先创建内层物化视图 `mv8_0_inner_mv`
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

创建外层物化视图 `mv8_0`
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
如下查询， `mv8_0_inner_mv` 和 `mv8_0` 都会改写成功，最终代价模型会选择 `mv8_0`
```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```

**注意：**
1. 嵌套物化视图的层数越多，透明改写的耗时会相应增加，建议嵌套物化视图层数不要超过3层。
2. 嵌套物化视图透明改写默认关闭，开启方式见下面开关。


## 辅助功能
**透明改写后数据一致性问题**

`grace_period` 的单位是秒，指的是容许物化视图和所用基表数据不一致的时间。
比如 `grace_period` 设置成 0，意味要求物化视图和基表数据保持一致，此物化视图才可用于透明改写；对于外表，因为无法感知数据变更，所以物化视图使用了外表，

无论外表的数据是不是最新的，都可以使用此物化视图用于透明改写，如果外表配置了 HMS 元数据源，是可以感知数据变更的，配置数据源和感知数据变更的功能会在后面迭代支持。

如果设置成 10，意味物化视图和基表数据允许 10s 的延迟，如果物化视图的数据和基表的数据有延迟，如果在 10s 内，此物化视图都可以用于透明改写。

对于物化视图中的内表，可以通过设定 `grace_period` 属性来控制透明改写使用的物化视图所允许数据最大的延迟时间。
可查看 [CREATE-ASYNC-MATERIALIZED-VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

**查询透明改写命中情况查看和调试**

可通过如下语句查看物化视图的透明改写命中情况，会展示查询透明改写简要过程信息。

`explain <query_sql>` 返回的信息如下，截取了物化视图相关的信息
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
**MaterializedViewRewriteSuccessAndChose**：透明改写成功，并且 CBO 选择的物化视图名称列表。

**MaterializedViewRewriteSuccessButNotChose**：透明改写成功，但是最终 CBO 没有选择的物化视图名称列表。

**MaterializedViewRewriteFail**：列举透明改写失败及原因摘要。


如果想知道物化视图候选，改写和最终选择情况的过程详细信息，可以执行如下语句，会展示透明改写过程详细的信息。

`explain memo plan <query_sql>`

## 相关环境变量

| 开关                                                                  | 说明                                                                                                   |
|---------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| SET enable_nereids_planner = true;                                  | 异步物化视图只有在新优化器下才支持，所以需要开启新优化器                                                                         |
| SET enable_materialized_view_rewrite = true;                        | 开启或者关闭查询透明改写，默认关闭                                                                                    |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 参与透明改写的物化视图是否允许包含外表，默认不允许                                                                            |
| SET materialized_view_rewrite_success_candidate_num = 3;            | 透明改写成功的结果集合，允许参与到 CBO 候选的最大数量，默认是 3                                                                  |
| SET enable_materialized_view_union_rewrite = true;                  | 当分区物化视图不足以提供查询的全部数据时，是否允许基表和物化视图 union all 来响应查询，默认允许                                                |
| SET enable_materialized_view_nest_rewrite = true;                   | 是否允许嵌套改写，默认不允许                                                                                       |
| SET materialized_view_relation_mapping_max_count = 8;               | 透明改写过程中，relation mapping最大允许数量，如果超过，进行截取。relation mapping通常由表自关联产生，数量一般会是笛卡尔积，比如3张表，可能会产生 8 种组合。默认是 8 |

## 限制
- 物化视图定义语句中只允许包含 SELECT、FROM、WHERE、JOIN、GROUP BY 语句，JOIN 的输入可以包含简单的 GROUP BY（单表聚合），其中 JOIN 的支持的类型为
  INNER，LEFT OUTER JOIN，RIGHT OUTER JOIN，FULL OUTER JOIN， LEFT SEMI JOIN，RIGHT SEMI JOIN，LEFT ANTI JOIN，RIGHT ANTI JOIN。
- 基于 External Table 的物化视图不保证查询结果强一致。
- 不支持使用非确定性函数来构建物化视图，包括 rand、now、current_time、current_date、random、uuid 等。
- 不支持窗口函数的透明改写。
- 物化视图中有 LIMIT，暂时不支持透明改写。
- 当查询或者物化视图没有数据时，不支持透明改写。
- 目前 WHERE 条件补偿，只支持列为数值和日期类型的条件范围补偿，比如物化视图定义是 a > 5，查询是 a > 10支持透明改写。


# 常见问题
## 1. 物化视图没有命中是为什么？
   确定物化视图是否命中需要执行如下SQL
   ```sql explain your_query_sql;```

   a. 物化视图透明改写功能默认是关闭的，需要打开对应开关才可以改写，开关值见 异步物化视图相关开关

   b. 可能物化视图不可用，导致透明改写不能命中，查看物化视图构建状态见问题2

   c. 经过前两步的检查，如果物化视图还是不能命中，可能物化视图的定义SQL和查询SQL不在当前物化视图改写能力的范围内，见物化视图透明改写能力


## 2. 怎么查看物化状态是否正常？
### 2.1 确认物化视图构建状态
物化视图的状态是Success，才可以参与透明改写，首先运行 
```sql
select * from mv_infos('database'='db_name') where Name = 'mv_name' \G
```   
查看物化视图的 JobName。
其次根据JobName查看物化视图的任务状态，运行如下语句
```sql
select * from tasks("type"="mv") where JobName = 'job_name';
```
查看最近执行的任务状态 `Status` 是否是 `Success`

### 2.2 确认物化视图数据一致的可用性
物化视图构建成功，但是因为数据变更，和 `grace_period` 的设置导致物化视图不可用。
查看物化视图数据一致性的方法
* 全量构建的物化视图
运行如下sql，查看字段 `SyncWithBaseTables` 是否是 1
```sql
select * from mv_infos('database'='db_name') where Name = 'mv_name' \G
```
* 分区构建的物化视图
运行如下sql,查看查询使用的分区是否有效
```sql
show partitions from mv_name;
```


## 3. 构建物化时报错
   报错信息
`   ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
   BUILD IMMEDIATE REFRESH AUTO ON MANUAL`

1.  异步物化视图的语句，在新优化器下才支持，确保使用的是新优化器
`SET global enable_nereids_planner = true;`
2. 可能是构建物化的语句使用的关键词写错或者物化定义SQL的语法有问题，可以检查下物化定义SQL和创建物化语句是否正确。

## 4. 构建分区物化视图报  Unable to find a suitable base table for partitioning
   报这个错，通常指的是物化视图的SQL定义和物化视图分区字段的选择，导致不能分区增量更新，所以创建分区物化视图会报这个错。
   物化视图想要分区增量更新，需要满足以下要求，详情见 [CREATE ASYNC MATERIALIZED VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)
   
满足分区物化视图构建，举例如下：
 
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

物化视图定义如下，如果 `l_shipdate` 是基表 `lineitem` 的分区字段，如下的物化视图是可以进行分区增量更新的

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
如下的物化视图是不可以进行分区增量更新的，因为 `l_shipdate` 来自 `LEFT OUTER JOIN` 的右侧 null 产生端。

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


## 5. 直查物化物化视图没有数据？
可能物化在构建中，也有可能物化构建失败了。 通过如下语句查看物化构建的状态

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

## 6. 物化视图使用的基表数据变了，但是此时物化视图还没有刷新，透明改写的行为是？
异步物化视图的数据时效性和基表是有一定时延的。
对于内表和可以感知数据变化的外表（比如hive），当基表的数据变更时，此物化视图是否可用于透明改写是通过 `grace_period` 的阈值来决定的。
`grace_period` 指的是容许物化视图和所用基表数据不一致的时间。 

比如 grace_period 设置成 0，意味要求物化视图和基表数据保持一致，此物化视图才可用于透明改写；
对于外表（除 hive 外），因为无法感知数据变更，所以物化视图使用了外表，无论外表的数据是不是最新的，都可以使用此物化视图用于透明改写（此种情况数据会不一致）。
   
如果设置成 10，意味物化视图和基表数据允许 10s 的延迟，如果物化视图的数据和基表的数据有延迟，如果在 10s 内，此物化视图都可以用于透明改写。

如果物化视图是分区物化视图，如果部分分区失效。有如下两种情况
1. 查询没有使用失效的分区数据，那么此物化视图依然可用于透明改写。
2. 查询使用了失效分区的数据，并且数据时效在 `grace_period` 范围内，那么此物化视图依然可用。如果物化视图数据时效不在 `grace_period` 范围内。
可以通过 union all 原表和物化视图来响应查询。

## 7. 怎么确认是否命中，如果不命中怎么查看原因？
可以通过 `explain query_sql` 的方式查看是否命中和不命中的摘要信息，例如如下物化视图
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

查询如下

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

Explain 显示信息可以看到 `MaterializedViewRewriteFail` 有失败的摘要信息，
`The graph logic between query and view is not consistent` 表示查询和物化join的逻辑不一致，上述查询和物化 join的表顺序不一致所以会报这个错。
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

来看另一个查询
```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```
Explain 显示信息如下
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
失败的摘要信息为 `View dimensions doesn't not cover the query dimensions`，表示查询中 `group by` 的字段不能从物化 `group by` 中获取，会报这个错。