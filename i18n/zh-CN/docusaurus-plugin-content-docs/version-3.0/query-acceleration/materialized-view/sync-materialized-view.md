---
{
    "title": "同步物化视图",
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


## 什么是同步物化视图

同步物化视图是将预先计算（根据定义好的 SELECT 语句）的数据集，存储在 Doris 中的一个特殊的表。Doris 会自动维护同步物化视图的数据，无论是新的导入还是删除操作，都能保证 Base 表和物化视图表的数据同步更新、保持一致后，相关命令才会结束，无需任何额外的人工维护成本。查询时，Doris 会自动匹配到最优的物化视图，并直接从物化视图中读取数据。

## 适用场景

- 加速耗时的聚合运算

- 查询需要匹配不同的前缀索引

- 通过预先过滤减少需要扫描的数据量

- 通过预先完成复杂的表达式计算来加速查询

## 局限性

- 同步物化视图只支持针对单个表的 SELECT 语句，支持 WHERE、GROUP BY、ORDER BY 等子句，但不支持 JOIN、HAVING、LIMIT 子句和 LATERAL VIEW。

- 与异步物化视图不同，不能直接查询同步物化视图。

- SELECT 列表中，不能包含自增列，不能包含常量，不能有重复表达式，也不支持窗口函数。

- 如果 SELECT 列表包含聚合函数，则聚合函数必须是根表达式（不支持 `sum(a) + 1`，支持 `sum(a + 1)`），且聚合函数之后不能有其他非聚合函数表达式（例如，`SELECT x, sum(a)` 可以，而 `SELECT sum(a)`, x 不行）。

- 如果删除语句的条件列在物化视图中存在，则不能进行删除操作。如果确实需要删除数据，则需要先将物化视图删除，然后才能删除数据。

- 单表上过多的物化视图会影响导入的效率：导入数据时，物化视图和 Base 表的数据是同步更新的。如果一张表的物化视图表过多，可能会导致导入速度变慢，这就像单次导入需要同时导入多张表的数据一样。

- 物化视图针对 Unique Key 数据模型时，只能改变列的顺序，不能起到聚合的作用。因此，在 Unique Key 模型上不能通过创建物化视图的方式对数据进行粗粒度的聚合操作。

## 使用物化视图

Doris 系统提供了一整套针对物化视图的 DDL 语法，包括创建、查看和删除。下面通过一个示例来展示如何使用物化视图加速聚合计算。假设用户有一张销售记录明细表，该表存储了每个交易的交易 ID、销售员、售卖门店、销售时间以及金额。建表语句和插入数据语句如下：

```sql
-- 创建一个 test_db
create database test_db;
use test_db;

-- 创建表
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

-- 插入数据
insert into sales_records values(1,1,1,'2020-02-02',1);
```

### 创建物化视图

如果用户经常需要分析不同门店的销售量，则可以为 `sales_records` 表创建一个物化视图，该视图以售卖门店分组，并对相同售卖门店的销售额进行求和。创建语句如下：

```sql
create materialized view store_amt as 
select store_id, sum(sale_amt) from sales_records group by store_id;
```

### 检查物化视图是否创建完成

由于创建物化视图是一个异步操作，用户在提交创建物化视图任务后，需要异步地通过命令检查物化视图是否构建完成。命令如下：

```sql
show alter table materialized view from test_db;
```

该命令的结果将显示该数据库的所有创建物化视图的任务。结果示例如下：

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

其中，TableName 指的是物化视图的数据来源表，RollupIndexName 指的是物化视图的名称。比较重要的指标是 State。当创建物化视图任务的 State 变为 FINISHED 时，就说明这个物化视图已经创建成功了。这意味着，在执行查询时有可能自动匹配到这张物化视图。

### 取消创建物化视图

如果创建物化视图的后台异步任务还未结束，可以通过以下命令取消任务：

```sql
cancel alter table materialized view from test_db.sales_records;
```

如果物化视图已经创建完毕，则无法通过该命令取消创建，但可以通过删除命令来删除物化视图。

### 查看物化视图的表结构

可以通过以下命令查看目标表上创建的所有物化视图及其表结构：

```sql
desc sales_records all;
```

该命令的结果如下：

```sql
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName     | IndexKeysType | Field               | Type   | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| sales_records | DUP_KEYS      | record_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | seller_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | store_id            | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | sale_date           | DATE   | DATEV2       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               | sale_amt            | BIGINT | BIGINT       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               |                     |        |              |      |       |         |       |         |            |             |
| store_amt     | AGG_KEYS      | mv_store_id         | INT    | INT          | Yes  | true  | NULL    |       | true    | `store_id` |             |
|               |               | mva_SUM__`sale_amt` | BIGINT | BIGINT       | Yes  | false | NULL    | SUM   | true    | `sale_amt` |             |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
```

可以看到，`sales_records`有一个名叫`store_amt`的物化视图，这个物化视图就是前序步骤创建的。

### 查看物化视图的创建语句

可以通过以下命令查看物化视图的创建语句：

```sql
show create materialized view store_amt on sales_records;
```

输出如下：

```sql
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| TableName     | ViewName  | CreateStmt                                                                                                 |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| sales_records | store_amt | create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
```


### 查询物化视图

当物化视图创建完成后，用户在查询不同门店的销售量时，Doris 会直接从刚才创建的物化视图`store_amt`中读取聚合好的数据，从而提升查询效率。用户的查询依旧指定查询`sales_records`表，比如：

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

上面的查询就能自动匹配到`store_amt`。用户可以通过下面的命令，检验当前查询是否匹配到了合适的物化视图。

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

结果如下：

```sql
+------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                        |
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
|   |  sortByGroupKey:false                                              |
|   |  cardinality=1                                                     |
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
|   |  sortByGroupKey:false                                              |
|   |  cardinality=1                                                     |
|   |  distribute expr lists:                                            |
|   |                                                                    |
|   0:VOlapScanNode(369)                                                 |
|      TABLE: test_db.sales_records(store_amt), PREAGGREGATION: ON       |
|      partitions=1/1 (sales_records)                                    |
|      tablets=10/10, tabletList=266568,266570,266572 ...                |
|      cardinality=1, avgRowSize=1805.0, numNodes=1                      |
|      pushAggOp=NONE                                                    |
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
| planed with unknown column statistics                                  |
+------------------------------------------------------------------------+
```


`MaterializedViewRewriteSuccessAndChose` 会展示被成功命中的物化视图，具体示例如下：

```sql
+------------------------------------------------------------------------+
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |
+------------------------------------------------------------------------+
```

上述内容表明，查询成功命中了名为 `store_amt` 的物化视图。值得注意的是，若目标表中无任何数据，则可能不会触发对物化视图的命中。

关于 MATERIALIZATIONS 的详细说明：

- **MaterializedViewRewriteSuccessAndChose**：展示被成功选中并用于查询优化的物化视图。

- **MaterializedViewRewriteSuccessButNotChose**：展示匹配成功但未被选中的物化视图（优化器会基于物化视图的成本进行最优选择，这些匹配但未被选中的物化视图，表示它们并非最优选择）。

- **MaterializedViewRewriteFail**：展示未能匹配的物化视图，即原始 SQL 查询与现有物化视图无法匹配，因此无法使用物化视图进行优化。

### 删除物化视图

```sql
drop materialized view store_amt on sales_records;
```

## 使用示例

接下来，我们通过更多示例来展示物化视图的作用。

### 示例一：加速聚合查询

**业务场景：**计算广告的 UV（独立访客数）和 PV（页面访问量）。

假设用户的原始广告点击数据存储在 Doris 中，那么针对广告 PV 和 UV 的查询就可以通过创建带有 `bitmap_union` 的物化视图来提升查询速度。首先，创建一个存储广告点击数据明细的表，包含每条点击的点击时间、点击的广告、点击的渠道以及点击的用户。原始表创建语句如下：

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

用户想要查询的是广告的 UV 值，也就是需要对相同广告的用户进行精确去重，查询语句一般为：

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

针对这种求 UV 的场景，可以创建一个带有 `bitmap_union` 的物化视图，以达到预先精确去重的效果。在 Doris 中，`count(distinct)` 聚合的结果和 `bitmap_union_count` 聚合的结果是完全一致的。因此，如果查询中涉及到 `count(distinct)`，则通过创建带有 `bitmap_union` 聚合的物化视图可以加快查询。根据当前的使用场景，可以创建一个根据广告和渠道分组，对 `user_id` 进行精确去重的物化视图。

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

当物化视图表创建完成后，查询广告 UV 时，Doris 就会自动从刚才创建好的物化视图 `advertiser_uv` 中查询数据。如果执行之前的 SQL 查询：

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

在选中物化视图后，实际的查询会转化为：

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

通过 `explain` 命令检查查询是否匹配到了物化视图：

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

输出结果如下：

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

在 `explain` 的结果中，可以看到 `internal.test_db.advertiser_view_record.advertiser_uv chose`。也就是说，查询会直接扫描物化视图的数据，说明匹配成功。其次，对于 `user_id` 字段求 `count(distinct)` 被改写为求 `bitmap_union_count(to_bitmap)`，也就是通过 Bitmap 的方式来达到精确去重的效果。


### 示例二：匹配不同前缀索引

**业务场景：**匹配前缀索引

用户的原始表包含三列（k1, k2, k3），其中 k1 和 k2 被设置为前缀索引列。当用户查询条件中包含` where k1=1 and k2=2 `时，查询可以通过索引进行加速。然而，在某些情况下，用户的过滤条件可能无法匹配到前缀索引，例如 `where k3=3`，此时无法通过索引来提升查询速度。为了解决这个问题，我们可以创建一个以 k3 作为第一列的物化视图。

建表语句和插入数据语句如下：

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

创建 k3 为前缀索引的物化视图：

```sql
create materialized view mv_1 as SELECT k3, k2, k1 FROM test_table;
```

使用 EXPLAIN 检查查询是否匹配物化视图：

```sql
explain select k1, k2, k3 from test_table where k3=3;
```

输出结果如下：

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

在 EXPLAIN 的结果中，可以看到 `internal.test_db.test_table.mv_1 chose`，这表明查询成功命中了物化视图。

### 示例三：预先过滤和表达式计算加速查询

**业务场景：**需要提前过滤数据或加速表达式计算。

建表和插入数据语句如下：

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

创建物化视图：

```sql
-- mv1 提前进行表达式计算
create materialized view mv1 as 
select 
    abs(k1)+k2+1,        
    sum(abs(k2+2)+k3+3) 
from 
    d_table 
group by 
    abs(k1)+k2+1;

-- mv2 提前用 where 表达式过滤以减少物化视图中的数据量
create materialized view mv2 as 
select 
    year(k4),
    month(k4) 
from 
    d_table 
where 
    year(k4) = 2020;
```

通过查询测试检测是否成功命中物化视图：

```sql
-- 命中 mv1
select 
    abs(k1)+k2+1,
    sum(abs(k2+2)+k3+3) 
from 
    d_table 
group by 
    abs(k1)+k2+1;
    
-- 命中 mv1
select 
    bin(abs(k1)+k2+1),
    sum(abs(k2+2)+k3+3) 
from 
    d_table 
group by 
    bin(abs(k1)+k2+1);

-- 命中 mv2
select 
    year(k4) + month(k4) 
from 
    d_table 
where 
    year(k4) = 2020;

-- 命中原始表 d_table 不会命中 mv2，因为 where 条件不匹配
select 
    year(k4),
    month(k4) 
from 
    d_table;
```

## 常见问题

当创建好物化视图后，如果发现没有匹配的数据，可能是因为物化视图还处于构建过程中。此时，可以使用以下命令来查看物化视图的构建状态：

```sql
show alter table materialized view from test_db;
```

如果查询结果显示`status`字段不是`FINISHED`，那么需要等待，直到状态变为`FINISHED`后，物化视图才会变得可用。



## 附录  
  
### 1. 物化视图相关开关介绍
  
| 开关 | 说明 |  
| --- | --- |  
| `SET enable_sync_mv_cost_based_rewrite = true;` | 是否使用基于结构信息的方式对同步物化视图进行透明改写，默认为 `true`。此属性自 3.0.0 版本起开始支持。 |