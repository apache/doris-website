---
{
    "title": "使用异步物化视图透明改写",
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

## 原理

异步物化视图采用基于 SPJG（SELECT - PROJECT - JOIN - GROUP - BY，即选择 - 投影 - 连接 - 分组 - 依据）模型的透明重写算法。该算法能够分析查询 SQL 的结构信息，自动查找合适的物化视图，并尝试进行透明重写，以便利用最优的物化视图来表述查询 SQL。通过使用预先计算好的物化视图结果，能够显著提升查询性能并降低计算成本。

## 调优案例

接下来，我们将通过一个示例详细演示如何使用异步物化视图来优化查询。这个示例涵盖了物化视图的创建、元数据查看、数据刷新、任务管理、修改以及删除等一系列操作。

### 1. 基础表创建与数据插入

首先，在 `tpch` 数据库中创建两张表，即 `orders` 表和 `lineitem` 表，并插入相应的数据。

```sql
CREATE DATABASE IF NOT EXISTS tpch;

USE tpch;  
  
-- 创建orders表  
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
  
-- 向orders表中插入数据  
INSERT INTO orders VALUES  
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),  
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),  
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');  
  
-- 创建lineitem表  
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
  
-- 向lineitem表中插入数据  
INSERT INTO lineitem VALUES  
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),  
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),  
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

### 2. 异步物化视图创建

接下来，创建一个异步物化视图 `mv1`。

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

### 3. 查看物化视图元数据

```sql
SELECT * FROM mv_infos("database"="tpch") WHERE Name="mv1";
```

### 4. 刷新物化视图

首先，查看分区列表：

```sql
SHOW PARTITIONS FROM mv1;
```

然后刷新特定分区：

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS(p_20231017_20231018);
```

### 5. 任务管理

对物化视图的任务进行管理，包括查看任务、暂停计划任务、恢复计划任务以及查看和取消任务。

- 查看物化视图任务
  
    ```sql
    SELECT * FROM jobs("type"="mv") ORDER BY CreateTime;
    ```

- 暂停物化视图的计划任务
  
    ```sql
    PAUSE MATERIALIZED VIEW JOB ON mv1;
    ```
- 恢复物化视图的计划任务
  
    ```sql
    RESUME MATERIALIZED VIEW JOB ON mv1;
    ```

- 查看物化视图任务
  
    ```sql
    SELECT * FROM tasks("type"="mv");
    ```

- 取消一个物化视图任务：假设 `realTaskId` 为 123

    ```sql
    CANCEL MATERIALIZED VIEW TASK 123 ON mv1;
    ```

### 6. 修改物化视图

```sql
ALTER MATERIALIZED VIEW mv1 SET("grace_period"="3333");
```

### 7. 删除物化视图

```sql
DROP MATERIALIZED VIEW mv1;
```

### 8. 使用物化视图进行查询

- 直接查询

    ```sql
    SELECT l_shipdate, sum_total 
    FROM mv1 
    WHERE l_partkey = 2 AND l_suppkey = 3;
    ```

- 通过透明重写进行查询（查询优化器会自动使用物化视图）

    ```sql
    SELECT l_shipdate, SUM(o_totalprice) AS total_price
    FROM lineitem
    LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    WHERE l_partkey = 2 AND l_suppkey = 3
    GROUP BY l_shipdate;
    ```

上述示例充分展示了异步物化视图的整个生命周期，包括创建、管理、使用以及删除环节。

## 总结

通过利用物化视图，查询性能能够得到显著提升，尤其对于复杂的聚合查询而言更是如此。在使用物化视图时，需要牢记以下几点：

1. 预先计算的结果：物化视图预先计算并存储查询结果，避免了每次查询时重复计算的开销。对于需要频繁执行的复杂查询，这一点尤为有效。

2. 减少连接操作：物化视图能够将来自多个表的数据整合到一个视图中，减少了查询过程中连接操作的需求，从而提高查询效率。

3. 自动更新：当基础表中的数据发生变化时，物化视图可以自动更新以保持数据的一致性。这确保了查询结果始终能反映最新的数据状态。

4. 存储开销：物化视图需要额外的存储空间来保存预先计算的结果。在创建物化视图时，需要在查询性能提升和存储空间消耗之间进行权衡。

5. 维护成本：物化视图的维护需要一定的系统资源和时间。频繁更新的基础表可能会导致物化视图有更高的更新开销。因此，有必要根据实际情况选择合适的刷新策略。

6. 适用场景：物化视图适用于数据变更不频繁但查询频率较高的场景。对于频繁变更的数据，实时计算可能更为合适。

合理使用物化视图能够显著提高数据库查询性能，特别是在面对复杂查询和大数据量的情况下。同时，也需要综合考虑存储、维护等因素，以在性能和成本之间实现平衡。 