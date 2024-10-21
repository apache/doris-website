---
{
  "title": "功能描述",
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

本文将详细说明物化视图 DDL 和基础运维、元数据查询、权限说明、物化刷新数据湖支持情况、与 OLAP 内表关系、直查、查询改写等功能以及基础命令。



## DDL 和基础运维

### 物化视图创建

**1. 详情参考** **[CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW)**

**2. 新增属性** 

- use_for_rewrite：：标识此物化视图是否参与到透明改写中，如果为 false，不参与到透明改写，默认是 true。数据建模场景中，如果物化视图只是用于直查，物化视图可以设置此属性，从而不参与透明改写，提高查询响应速度。

**3. 分区物化视图**

创建分区物化视图时，对于分区字段引用的表达式，仅允许使用 `date_trunc` 函数和常量。以下语句是符合要求的：

分区字段引用的列仅使用了 `date_trunc` 函数。

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL   
partition by (date_alias)   
DISTRIBUTED BY RANDOM BUCKETS 2   
PROPERTIES ('replication_num' = '1')   
AS   
SELECT   
  l_linestatus,   
  date_trunc(o_orderdate) as date_alias,   
  o_shippriority   
FROM   
  orders   
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

以下示例则无法创建分区物化视图，因为分区字段引用的表达式使用了 `to_date` 函数：

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL   
partition by (date_alias)   
DISTRIBUTED BY RANDOM BUCKETS 2   
PROPERTIES ('replication_num' = '1')   
AS   
SELECT   
  l_linestatus,   
  to_date(o_orderdate) as date_alias,   
  o_shippriority   
FROM   
  orders   
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 物化视图修改

详情参考 [ALTER ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-ASYNC-MATERIALIZED-VIEW)

### 物化视图删除

详情参考 [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-ASYNC-MATERIALIZED-VIEW)

### 刷新物化视图

详情参考 [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/Utility-Statements/REFRESH-MATERIALIZED-VIEW/)

### 暂停物化视图

详情参考 [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/Utility-Statements/PAUSE-MATERIALIZED-VIEW)

### 启用物化视图

详情参考 [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/Utility-Statements/RESUME-MATERIALIZED-VIEW)

### 取消物化视图刷新任务

详情参考 [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/Utility-Statements/CANCEL-MATERIALIZED-VIEW-TASK)



## 元数据查询

- 查询物化视图信息：[MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv-infos)

- 查询 TASK 信息：[TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks?_highlight=task)

- 查询物化视图对应的 JOB 信息：[JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)

- 查询物化视图的分区信息：[SHOW PARTITIONS](../../../sql-manual/sql-statements/Show-Statements/SHOW-PARTITIONS)

- 查看物化视图表结构：[DESCRIBE](../../../sql-manual/sql-statements/Utility-Statements/DESCRIBE)

- 查看物化视图创建语句：[SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/Show-Statements/SHOW-CREATE-MATERIALIZED-VIEW/)

## 权限说明

- 创建物化视图：需要具有有物化视图的创建权限（与建表权限相同）以及创建物化视图查询语句的查询权限（与 SELECT 权限相同）。

- 删除物化视图：需要具有物化视图的删除权限（与删除表权限相同）。

- 修改物化视图：需要具有物化视图的修改权限（与修改表权限相同）。

- 暂停/恢复/取消/刷新物化视图：需要具有物化视图的创建权限。

## 物化刷新数据湖支持情况

对于物化刷新数据湖的支持情况，不同类型的表和 Catalog 有不同的支持程度：

| 表类型  | Catalog 类型 | 全量刷新 | 分区刷新 | 触发刷新  |
| ------- | ------------ | -------- | -------- | --------- |
| 内表    | Internal     | 2.1 支持  | 2.1 支持  | 2.1.4 支持 |
| 外表    | Hive         | 2.1 支持  | 2.1 支持  | 不支持    |
| Iceberg | 支持         | 不支持   | 不支持   |           |
| Paimon  | 支持         | 不支持   | 不支持   |           |
| Hudi    | 支持         | 不支持   | 不支持   |           |
| JDBC    | 支持         | 不支持   | 不支持   |           |
| ES      | 支持         | 不支持   | 不支持   |           |

## 物化视图和 OLAP 内表关系

:::tips
自 2.1.4 版本起，物化视图支持 Duplicate 模型
:::

物化视图的底层实现是一个 Duplicate 模型的 OLAP 表。这意味着，理论上物化视图支持 Duplicate 模型的所有功能。然而，为了确保物化视图能够正常且高效地刷新数据，对其功能进行了一些限制：

1. 物化视图的分区是基于其基表自动创建和维护的，因此用户不能对物化视图进行分区操作。

2. 由于物化视图背后有相关的作业（JOB）需要处理，所以不能使用删除表（DELETE TABLE）或重命名表（RENAME TABLE）的命令来操作物化视图。相反，需要使用物化视图自身的命令来进行这些操作。

3. 物化视图的列数据类型是根据查询语句推导出来的，因此这些数据类型不能被修改。否则，可能会导致物化视图的刷新任务失败。

4. 物化视图具有一些 Duplicate 表没有的属性（property），这些属性需要通过物化视图的命令进行修改。而其他公用的属性则需要使用 ALTER TABLE 命令进行修改。

5. DESC、SHOW PARTITIONS 等命令同样适用于物化视图，可以用于查看物化视图的描述信息和分区信息。

6. 物化视图支持创建索引。

7. 用户可以基于一个物化视图创建同步物化视图。

## 直查

建表语句如下：

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

物化视图可以看作是表，可以像正常的表一样直接查询。

举例如下：

**1. 物化视图的定义：**

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

详情可参考 [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW)

**2. 查询语句：**

可以对物化视图添加过滤条件和聚合等，进行直接查询。

```sql
SELECT
l_linenumber,
o_custkey
FROM mv1
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

## 查询改写的能力边界

### 条件补偿

当物化视图和查询的 `where` 条件是通过 `and` 连接的表达式时：

**1. 当查询的表达式包含物化视图的表达式时：**

可以进行条件补偿。

例如，查询是 `a > 5 and b > 10 and c = 7`，物化的条件是 `a > 5 and b > 10`，物化视图的条件是查询条件的子集，那么只需补偿 `c = 7` 条件即可。

**2. 当查询的表达式不完全包含物化视图的表达式时：**

查询的条件可以推导出物化视图的条件时（常见的是比较和范围表达式，如 `>`、`<`、`=`、`in` 等），也可以进行条件补偿。补偿结果就是查询条件本身。

例如，查询是 `a > 5 and b = 10`，物化视图是 `a > 1 and b > 8`，可见物化的条件包含了查询的条件，查询的条件可以推导出物化视图的条件，这样也可以进行补偿，补偿结果就是 `a > 5 and b = 10`。

条件补偿使用限制：

1. 对于通过 `or` 连接的表达式，不能进行条件补偿，必须一样才可以改写成功。

2. 对于 `like` 这种非比较和范围表达式，不能进行条件补偿，必须一样才可以改写成功。

### JOIN 改写

JOIN 改写指的是查询和物化使用的表相同，可以在物化视图和查询的 JOIN 输入或者 JOIN 的外层写 `where`，优化器对此模式的查询会尝试进行透明改写。

支持多表 JOIN，支持的 JOIN 类型为：

- INNER JOIN

- LEFT OUTER JOIN

- RIGHT OUTER JOIN

- FULL OUTER JOIN

- LEFT SEMI JOIN

- RIGHT SEMI JOIN

- LEFT ANTI JOIN

- RIGHT ANTI JOIN

举例如下：

如下查询可进行透明改写，条件 `l_linenumber > 1` 可以上拉，从而进行透明改写，使用物化视图的预计算结果来表达查询。

**1. 物化视图定义：**

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

**2. 查询语句：**

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

### JOIN 衍生

当查询和物化视图的 JOIN 类型不一致时，如果物化视图能够提供查询所需的所有数据，那么通过在 JOIN 的外部补偿谓词，也可以进行透明改写。

举例如下：

**1. 物化视图定义：**

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

**2. 查询语句：**

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

当查询和物化视图定义中的 group 维度一致时，如果物化视图使用的 group by 维度和查询的 group by 维度相同，并且查询使用的聚合函数可以使用物化视图的聚合函数来表示，那么可以进行透明改写。

举例如下：

如下查询可以进行透明改写，因为查询和物化视图使用的聚合维度一致，可以使用物化视图 `o_shippriority` 字段进行过滤结果。查询中的 group by 维度和聚合函数可以使用物化视图的 group by 维度和聚合函数来改写。

**1. 物化视图定义**

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

**2. 查询语句：**

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

### 聚合改写（上卷）

在查询和物化视图定义中，即使聚合的维度不一致，也可以进行改写。物化视图使用的 `group by` 维度需要包含查询的 `group by` 维度，而查询可以没有 `group by`。并且，查询使用的聚合函数可以用物化视图的聚合函数来表示。

举例如下：

以下查询可以进行透明改写。查询和物化视图使用的聚合维度不一致，但物化视图使用的维度包含了查询的维度。查询可以使用维度中的字段对结果进行过滤。查询会尝试使用物化视图 `SELECT` 后的函数进行上卷，例如，物化视图的 `bitmap_union` 最后会上卷成 `bitmap_union_count`，这和查询中的 `count(distinct)` 的语义保持一致。

**1. 物化视图定义：**

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

**2. 查询语句：**

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

目前支持的聚合上卷函数列表如下：

| 查询中函数                                            | 物化视图中函数             | 函数上卷后         |
| ----------------------------------------------------- | -------------------------- | ------------------ |
| max                                                   | max                        | max                |
| min                                                   | min                        | min                |
| sum                                                   | sum                        | sum                |
| count                                                 | count                      | sum                |
| count(distinct)                                       | bitmap_union               | bitmap_union_count |
| bitmap_union                                          | bitmap_union               | bitmap_union       |
| bitmap_union_count                                    | bitmap_union               | bitmap_union_count |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union 或者 hll_raw_agg | hll_union_agg      |

### 多维聚合改写

支持多维聚合的透明改写，即如果物化视图中没有使用 `GROUPING SETS`, `CUBE`, `ROLLUP`，而查询中有多维聚合，并且物化视图 `group by` 后的字段包含查询中多维聚合的所有字段，那么也可以进行透明改写。

举例如下：

**1. 物化视图定义：**

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

**2. 查询语句：**

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

### 分区补偿改写

当分区物化视图不足以提供查询的所有数据时，可以使用 `union all` 的方式，将查询原表和物化视图的数据 `union all` 作为最终返回结果。

举例如下：

**1. 物化视图定义：**

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

**2. 运行查询语句：**

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

**3. 改写结果示意：**

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

:::caution 注意
目前支持分区补偿，暂时不支持带条件的 `UNION ALL` 补偿。

比如，如果物化视图带有 `where` 条件，以上述为例，如果构建物化的过滤条件加上 ` WHERE l_shipdate > '2023-10-19'`，而查询是 `WHERE l_shipdate > '2023-10-18'`，目前这种还无法通过 `UNION ALL` 补偿，待支持。
:::

### 嵌套物化视图改写

物化视图的定义 SQL 可以使用物化视图，此物化视图称为嵌套物化视图。嵌套的层数理论上没有限制，此物化视图既可以直查，也可以进行透明改写。嵌套物化视图同样可以参与透明改写。

举例如下：

**1. 创建内层物化视图 `mv8_0_inner_mv`：**

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

**2. 创建外层物化视图 `mv8_0`：**

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

对于以下查询，`mv8_0_inner_mv` 和 `mv8_0` 都会成功进行改写，最终代价模型会选择 `mv8_0`：

```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```

注意：

1. 嵌套物化视图的层数越多，透明改写的耗时会相应增加。建议嵌套物化视图层数不要超过 3 层。

2. 嵌套物化视图透明改写默认关闭，开启方式见下面的开关设置。

## Explain 查询透明改写情况

查询透明改写命中情况，用于查看和调试。

**1. 如果需要查看物化视图的透明改写命中情况，该语句会展示查询透明改写的简要过程信息。**

```sql
explain <query_sql> 
```

返回的信息如下，此处截取了与物化视图相关的信息：

```sql
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

- MaterializedViewRewriteSuccessAndChose：表示透明改写成功，并且 CBO（Cost-Based Optimizer）选择的物化视图名称列表。
- MaterializedViewRewriteSuccessButNotChose：表示透明改写成功，但是最终 CBO 没有选择的物化视图名称列表。
- MaterializedViewRewriteFail：列举透明改写失败的情况及原因摘要。

**2. 如果想了解物化视图的候选、改写以及最终选择情况的详细过程信息，可以执行如下语句：**

```sql
explain memo plan <query_sql>
```

## 附录

### 物化视图相关开关介绍

| 开关                                                         | 说明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | 异步物化视图只有在新优化器下才支持，所以物化视图透明改写没有生效时，需要开启新优化器 |
| SET enable_materialized_view_rewrite = true;                 | 开启或者关闭查询透明改写，默认开启                           |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 参与透明改写的物化视图是否允许包含外表，默认不允许，如果物化视图的定义 SQL 中包含外表，也想参与到透明改写，可以打开此开关。 |
| SET materialized_view_rewrite_success_candidate_num = 3;     | 透明改写成功的结果集合，允许参与到 CBO 候选的最大数量，默认是 3。如果发现透明改写的性能很慢，可以考虑把这个值调小。 |
| SET enable_materialized_view_union_rewrite = true;           | 当分区物化视图不足以提供查询的全部数据时，是否允许基表和物化视图 union all 来响应查询，默认允许。如果发现命中物化视图时数据错误，可以把此开关关闭。 |
| SET enable_materialized_view_nest_rewrite = true;            | 是否允许嵌套改写，默认不允许。如果查询 SQL 很复杂，需要构建嵌套物化视图才可以命中，那么需要打开此开关。 |
| SET materialized_view_relation_mapping_max_count = 8;        | 透明改写过程中，relation mapping 最大允许数量，如果超过，进行截取。relation mapping 通常由表自关联产生，数量一般会是笛卡尔积，比如 3 张表，可能会产生 8 种组合。默认是 8。如果发现透明改写时间很长，可以把这个值调低 |