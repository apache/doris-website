# 使用多表物化视图透明改写

## 概述

多表物化视图采用的是基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。该算法能够分析查询 SQL 的结构信息，自动寻找合适的物化视图，并尝试进行透明改写，以利用最优的物化视图来表达查询 SQL。通过使用预计算的物化视图结果，可以显著提高查询性能，并降低计算成本。

## 案例

接下来将会通过示例，详细展示如何利用多表物化视图来进行查询加速。

### 创建基础表

首先，创建 tpch 数据库并在其中创建 `orders` 和 `lineitem` 两张表，并插入相应的数据。

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

### 创建异步物化视图

基于 tpch benchmark 中的若干原始表，创建一个异步物化视图 `mv1`。

```sql
CREATE MATERIALIZED VIEW mv1   
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)  
DISTRIBUTED BY RANDOM BUCKETS 2  
PROPERTIES ('replication_num' = '1')   
AS   
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total  
FROM lineitem  
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate  
GROUP BY  
l_shipdate,  
o_orderdate,  
l_partkey,  
l_suppkey;
```

### 使用物化视图进行透明改写

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

通过 explain shape plan 可见经过 mv1 透明改写后的计划已经命中 mv1。通过 explain 也可以查看当前计划经过 mv 改写的状态，包括是否命中以及命中的 mv 等信息，如下所示：

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

## 总结

通过使用物化视图， 可以显著提高查询性能， 特别是对于复杂的聚合查询。在使用的时候需要注意：

合理利用物化视图，可以显著改善数据库的查询性能，特别是在复杂查询和大数据量的情况下。同时，也需要综合考虑存储、维护等因素，以实现性能和成本的平衡。
