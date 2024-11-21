---
{
    "title": "使用多表物化视图透明改写",
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

## 工作原理

多表物化视图采用的是基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。该算法能够分析查询 SQL 的结构信息，自动寻找合适的物化视图，并尝试进行透明改写，以利用最优的物化视图来表达查询 SQL。通过使用预计算的物化视图结果，可以显著提高查询性能，并降低计算成本。

## 调优案例

接下来，将会通过示例，详细展示如何利用多表物化视图来优化查询。此示例涵盖物化视图的创建、元信息查看、数据刷新、任务管理、修改以及删除等一系列操作。

### 1 创建基础表与数据插入

首先，创建tpch数据库并在其中创建 `orders` 和 `lineitem` 两张表，并插入相应的数据。

```sql
CREATE DATABASE IF NOT EXISTS tpch;
USE tpch;

-- 创建 orders 表
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

-- 插入数据到 orders 表
INSERT INTO orders VALUES
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

-- 创建 lineitem 表
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

-- 插入数据到 lineitem 表
INSERT INTO lineitem VALUES
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

### 2 创建异步物化视图

接下来，创建一个异步物化视图`mv1`。

```sql
CREATE MATERIALIZED VIEW mv1   
BUILD DEFERRED REFRESH AUTO ON MANUAL  
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

### 3 查看物化视图元信息

```sql
SELECT * FROM mv_infos("database"="tpch") WHERE Name="mv1";
```

### 4 刷新物化视图

首先查看分区列表：

```sql
SHOW PARTITIONS FROM mv1;
```

然后刷新特定分区：

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS(p_20231017_20231018);
```

### 5 任务管理

管理物化视图的作业，包括查看作业、暂停定时调度、恢复定时调度以及查看和取消任务。

- 查看物化视图 Job

    ```sql
    SELECT * FROM jobs("type"="mv") ORDER BY CreateTime;
    ```

- 暂停物化视图 Job 定时调度

    ```sql
    PAUSE MATERIALIZED VIEW JOB ON mv1;
    ```

- 恢复物化视图 Job 定时调度

    ```sql
    RESUME MATERIALIZED VIEW JOB ON mv1;
    ```

- 查看物化视图的 Task

    ```sql
    SELECT * FROM tasks("type"="mv");
    ```

- 取消物化视图的 Task：假设 `realTaskId` 为 123

    ```sql
    CANCEL MATERIALIZED VIEW TASK 123 ON mv1;
    ```

### 6 修改物化视图

```sql
ALTER MATERIALIZED VIEW mv1 SET("grace_period"="3333");
```

### 7 删除物化视图

```sql
DROP MATERIALIZED VIEW mv1;
```

### 8 使用物化视图进行查询

- 直接查询

    ```sql
    SELECT l_shipdate, sum_total 
    FROM mv1 
    WHERE l_partkey = 2 AND l_suppkey = 3;
    ```

- 通过透明改写查询（查询优化器会自动使用物化视图）

    ```sql
    SELECT l_shipdate, SUM(o_totalprice) AS total_price
    FROM lineitem
    LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    WHERE l_partkey = 2 AND l_suppkey = 3
    GROUP BY l_shipdate;
    ```

上述例子，完整展示了异步物化视图的生命周期，包括创建、管理、使用和删除。

## 总结

通过使用物化视图，可以显著提高查询性能，特别是对于复杂的聚合查询。在使用的时候需要注意：

1. 预计算结果：物化视图将查询结果预先计算并存储，避免了每次查询时重复计算的开销。这对于需要频繁执行的复杂查询尤其有效。

2. 减少联接操作：物化视图可以将多个表的数据合并到一个视图中，减少了查询时的联接操作，从而提高查询效率。

3. 自动更新：当基表数据发生变化时，物化视图可以自动更新，以保持数据的一致性。这确保了查询结果始终反映最新的数据状态。

4. 空间开销：物化视图需要额外的存储空间来保存预计算的结果。在创建物化视图时，需要权衡查询性能提升和存储空间消耗。

5. 维护成本：物化视图的维护需要一定的系统资源和时间。频繁更新的基表可能导致物化视图的更新开销较大。因此，需要根据实际情况选择合适的刷新策略。

6. 适用场景：物化视图适用于数据变化频率较低、查询频率较高的场景。对于经常变化的数据，实时计算可能更为合适。

合理利用物化视图，可以显著改善数据库的查询性能，特别是在复杂查询和大数据量的情况下。同时，也需要综合考虑存储、维护等因素，以实现性能和成本的平衡。
