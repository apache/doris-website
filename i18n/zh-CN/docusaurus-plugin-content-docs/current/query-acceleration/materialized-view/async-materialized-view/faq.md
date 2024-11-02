---
{
  "title": "常见问题",
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

## 构建和刷新

### Q1：物化视图是如何判断需要刷新哪些分区的？

Doris 内部会计算物化视图和基表的分区对应关系，并且记录上次刷新成功后物化视图使用的基表分区版本。例如，物化视图 mv1 由基表 t1 和 t2 创建，并且依赖 t1 进行分区。

假设 mv1 的分区 p202003 对应基表 t1 的分区 p20200301 和 p20200302，那么刷新 p202003 之后，会记录分区 p20200301、p20200302，以及表 t2 的当前版本。

下次刷新时，会判断 p20200301、p20200302 以及 t2 的版本是否发生变化。如果其中之一发生了变化，就代表 p202003 需要刷新。

当然，如果业务上能接受 t2 的变化而不触发 mv1 的刷新，可以通过物化视图的属性`excluded_trigger_tables`来设置。

### Q2：物化视图占用资源过多，影响其他业务怎么办？

可以通过物化视图的属性指定 [workload_group](../../../admin-manual/resource-admin/workload-group) 来控制物化视图刷新任务的资源。

使用时需要注意，如果内存设置的太小，单个分区刷新又需要的内存较多，任务会刷新失败。需要根据业务情况进行权衡。

### Q3：能基于物化视图创建新的物化视图吗？

能。从 Doris 2.1.3 版本开始支持。但是，在刷新数据时，每个物化视图都是采用单独的刷新逻辑。例如，如果 mv2 是基于 mv1 创建的，而 mv1 又是基于 t1 创建的，那么在刷新 mv2 时，不会考虑 mv1 与 t1 之间的数据是否同步。

### Q4：Doris 都支持哪些外表？

Doris 支持的所有外表都能用于创建物化视图，但是目前仅有 Hive 支持分区刷新，后续会陆续支持其他类型。

### Q5：物化视图显示和 Hive 数据一致，但是实际上不一致

物化视图仅能保证其数据与通过 Catalog 查询的结果一致。由于 Catalog 包含一定的元数据和数据缓存，因此，如果想让物化视图与 Hive 中的数据保持一致，需要通过 Refresh Catalog 等方式，确保 Catalog 中的数据与 Hive 中的数据一致。

### Q6：物化视图支持 Schema Change 吗？

不支持修改，因为物化视图的列属性是根据物化视图定义的 SQL 推导出来的。目前不支持显式地自定义修改。

### Q7：物化视图使用的基表允许 Schema Change 吗？

允许。但是变更之后，使用到该基表的物化视图的状态会从 NORMAL 变为 SCHEMA_CHANGE，此时物化视图将不能被用来透明改写，但是不影响直接查询物化视图。如果物化视图下次刷新任务成功，那么状态会由 SCHEMA_CHANGE 变回 NORMAL。

### Q8：主键模型的表能用来创建物化视图吗？

物化视图对基表的数据模型没有要求。但是物化视图本身只能是明细模型。

### Q9：物化视图上还能建索引吗？

能。

### Q10：物化视图刷新的时候会锁表吗？

在很小的阶段会锁表，但不会持续的占用表锁（几乎等同于导入数据的锁表时间）。

### Q11：物化视图适合近实时场景吗？

不太适合。物化视图刷新的最小单位是分区，如果数据量较大会占用较多的资源，并且实时性不够。可以考虑使用同步物化视图或其他手段。

### Q12：构建分区物化视图报错  

**报错信息如下：**

```sql
Unable to find a suitable base table for partitioning
```

出现该报错通常指的是物化视图的 SQL 定义和物化视图分区字段的选择，导致不能分区增量更新，所以创建分区物化视图会报错。

- 物化视图想要分区增量更新，需要满足以下要求，详情见[物化视图刷新模式](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW#refreshmethod)

- 最新的代码可以提示分区构建失败的原因，原因摘要和说明见附录 2

**举例如下：**

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey INTEGER NOT NULL, 
  o_custkey INTEGER NOT NULL, 
  o_orderstatus CHAR(1) NOT NULL, 
  o_totalprice DECIMALV3(15, 2) NOT NULL, 
  o_orderdate DATE NOT NULL, 
  o_orderpriority CHAR(15) NOT NULL, 
  o_clerk CHAR(15) NOT NULL, 
  o_shippriority INTEGER NOT NULL, 
  O_COMMENT VARCHAR(79) NOT NULL
) DUPLICATE KEY(o_orderkey, o_custkey) PARTITION BY RANGE(o_orderdate) (
  FROM 
    ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1");


CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey INTEGER NOT NULL, 
  l_partkey INTEGER NOT NULL, 
  l_suppkey INTEGER NOT NULL, 
  l_linenumber INTEGER NOT NULL, 
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
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1");
```

物化视图定义如下，可以进行分区增量更新。如果选择`orders.o_orderdate`作为物化视图的分区字段，那么它是可以支持增量分区更新的。相反，如果使用了`lineitem.l_shipdate`，则不能实现增量更新。

**原因为：**

1. `lineitem.l_shipdate`不是基表的分区列，实际上`lineitem`表并没有设置分区列。

2. `lineitem.l_shipdate`是`outer join`操作中产生`null`值那一端的列。

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL partition by(o_orderdate) DISTRIBUTED BY RANDOM BUCKETS 2 PROPERTIES ('replication_num' = '1') AS 
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

### Q13：创建物化视图时报错

报错信息如下：

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

可能原因如下：

1. 异步物化视图的语句，在新优化器下才支持，确保使用的是新优化器。

    ```sql
    SET enable_nereids_planner = true;
    ```

2. 可能是构建物化的语句使用的 **关键词写错**或者物化定义 **SQL 语法有问题**，可以检查下物化定义 SQL 和创建物化语句是否正确。

## 查询和透明改写

### Q1：如何确认是否命中，如果不命中如何查看原因？

可以通过 `explain query_sql` 的方式查看是物化视图命中情况摘要信息，例如物化视图如下：

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

查询如下：

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

- 物化视图的命中信息在 plan 最后。

- **MaterializedViewRewriteSuccessAndChose：**表示透明改写成功，并且 CBO 选择的物化视图名称列表。-

- **MaterializedViewRewriteSuccessButNotChose：**表示透明改写成功，但是最终 CBO 没有选择的物化视图名称列表，没有选择意味着执行计划不会使用物化视图。”

- **MaterializedViewRewriteFail**：表示列举透明改写失败及原因摘要。

- 如果 explain 最后没有出现 `MaterializedView` 等信息，那么意味着此物化视图状态不可用，因此不能参与透明改写。（关于什么情况下会导致物化视图状态不可用，可详细参考使用与实践 - 查看物化视图状态）。

举例如下：

```sql
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```

### Q2：物化视图没有命中的原因是什么？

首先，需要确认物化视图是否命中，需要执行如下 SQL，详细见[查询和透明改写 - 问题 1](#q1如何确认是否命中如果不命中如何查看原因)

```Plain
explain
your_query_sql;
```

如果未命中，可能是存在以下几个问题：

- 在 Doris 2.1.3 之前的版本中，物化视图透明改写功能是默认关闭的。需要打开对应的开关，才能实现透明改写。具体的开关值，请参见异步物化视图相关开关。

- 物化视图可能处于不可用状态，从而导致透明改写无法命中。要查看物化视图的构建状态，请参见查看物化视图状态。

- 若经过前两步的检查后，物化视图仍然无法命中，那么可能是物化视图的定义 SQL 和查询 SQL 不在当前物化视图改写能力的范围内。详情请参考 [物化视图透明改写能力](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands#透明改写能力)。

- 对于失败命中的详细信息和说明，请查阅[附录 1](#附录)。

以下是物化视图透明改写失败的示例：

**用例 1：**

创建物化视图的 SQL 如下：

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

执行查询如下：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

Explain 显示的信息如下：

```sql
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

在执行结果中，可以看到`MaterializedViewRewriteFail`有失败的摘要信息，其中`The graph logic between query and view is not consistent`表示查询和物化视图的 Join 逻辑不一致，即查询和物化视图的 Join 类型或 Join 的表不同。

在上述示例中，查询和物化视图 Join 的表顺序不一致，因此会报告此错误。对于透明改写失败的摘要信息和说明，请参见附录 1。

**用例 2：**

执行查询如下：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

Explain 显示的信息如下：

```sql
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

失败的摘要信息为`View dimensions doesn't not cover the query dimensions`，表示查询中`group by`的字段无法从物化视图的`group by`字段中获取，因此会报告此错误。

### Q3：什么情况会导致物化视图的状态变更并且不可用？

不可用，指代的是“物化视图不能用于透明改写”的简称，而物化视图仍然可以直接查询。

- 对于全量物化视图，如果使用的基表数据发生变更或者发生 Schema Change，会导致物化视图不可用。

- 对于分区物化视图，基表数据变更会导致对应的分区不可用。而基表的 Schema Change 则会导致整个物化视图不可用。

目前，物化视图刷新失败也会导致其不可用。但后续会进行优化，即使刷新失败，已存在的物化视图仍然可用于透明改写。

### Q4：出现直查物化视图没有数据的情况

可能物化视图正在构建中，也有可能物化视图构建已经失败。

可以查询物化视图的状态来确认，具体方法请参见查看物化视图状态。

### Q5：物化视图使用的基表数据变了，但是此时物化视图还没有刷新，透明改写的行为是什么？

异步物化视图的数据与基表之间存在一定的时延。

**1. 对于内表以及能够感知数据变化的外表（如 Hive）：当基表数据发生变更时，物化视图是否可用取决于 `grace_period` 的阈值。**

`grace_period` 是指允许物化视图与所用基表数据不一致的时间段。例如：

- 如果 `grace_period` 设置为 0，则意味着要求物化视图与基表数据保持一致，此时物化视图才可用于透明改写；对于外表（除 Hive 外），由于无法感知数据变更，因此无论外表的数据是否为最新，使用了外表的物化视图都可以用于透明改写（但数据可能会不一致）。

- 如果 `grace_period` 设置为 10 秒，则意味着允许物化视图与基表数据有最多 10 秒的延迟。如果物化视图的数据与基表数据的延迟在 10 秒内，那么此物化视图仍然可以用于透明改写。

**2. 对于分区物化视图，如果部分分区失效，存在以下两种情况：**

- 如果查询没有使用失效的分区数据，那么此物化视图仍然可用。

- 如果查询使用了失效分区的数据，并且数据时效在 `grace_period` 范围内，那么此物化视图仍然可用。如果物化视图数据时效超出 `grace_period` 范围，可以通过联合原表和物化视图来响应查询。此时需要开启允许联合改写开关 `enable_materialized_view_union_rewrite`（自 2.1.5 版本起，该开关默认开启。）

## 附录

### 1 物化视图相关开关介绍

| 开关                                                         | 说明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | 异步物化视图只有在新优化器下才支持，所以物化视图透明改写没有生效时，需要开启新优化器 |
| SET enable_materialized_view_rewrite = true;                 | 开启或者关闭查询透明改写，默认开启                           |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 参与透明改写的物化视图是否允许包含外表，默认不允许，如果物化视图的定义 SQL 中包含外表，也想参与到透明改写，可以打开此开关。 |
| SET materialized_view_rewrite_success_candidate_num = 3;     | 透明改写成功的结果集合，允许参与到 CBO 候选的最大数量，默认是 3。如果发现透明改写的性能很慢，可以考虑把这个值调小。 |
| SET enable_materialized_view_union_rewrite = true;           | 当分区物化视图不足以提供查询的全部数据时，是否允许基表和物化视图 union all 来响应查询，默认允许。如果发现命中物化视图时数据错误，可以把这个开关关闭。 |
| SET enable_materialized_view_nest_rewrite = true;            | 是否允许嵌套改写，默认不允许。如果查询 SQL 很复杂，需要构建嵌套物化视图才可以命中，那么需要打开此开关。 |
| SET materialized_view_relation_mapping_max_count = 8;        | 透明改写过程中，relation mapping 最大允许数量，如果超过，进行截取。relation mapping 通常由表自关联产生，数量一般会是笛卡尔积，比如 3 张表，可能会产生 8 种组合。默认是 8。如果发现透明改写时间很长，可以把这个值调低 |

### 2 透明改写失败摘要信息和说明

| 摘要信息                                                     | 说明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| View struct info is invalid                                  | 物化视图的结构信息不合法，目前支持改写的 SQL pattern 如下查询是 join，物化也是 join，查询是 agg，物化可以没有 join 透明改写过程中，多数会显示这个问题，因为每个透明改写的规则负责一定 SQL pattern 的改写，如果命中了不符合要求规则，就会有这个错误，这个错误一般不是决定透明改写失败的主要原因。 |
| Materialized view rule exec fail                             | 这个一般是透明改写规则执行抛异常，这种情况需要 Explain memo plan query_sql 看下具体异常栈 |
| Match mode is invalid                                        | 查询和物化视图表的数量不一致，暂不支持改写                   |
| Query to view table mapping is null                          | 查询和物化视图表映射生成失败                                 |
| queryToViewTableMappings are over the limit and be intercepted | 查询自关联的表太多了，导致透明改写空间膨胀过大，停止透明改写 |
| Query to view slot mapping is null                           | 查询和物化的表 slot 映射失败                                   |
| The graph logic between query and view is not consistent     | 查询和物化的 Join 类型不同或者 Join 的表不同                  |
| Predicate compensate fail                                    | 一般是查询的条件范围在物化的范围外，比如查询是 a > 10，但是物化是 a > 15 |
| Rewrite compensate predicate by view fail                    | 条件补偿失败，通常是查询比物化多的条件要进行补偿，但是条件用的列没有出现在物化视图 select 后 |
| Calc invalid partitions fail                                 | 如果是分区物化视图，会尝试计算查询使用的物化视图分区是否有效，计算查询可能用到的失效分区失败 |
| mv can not offer any partition for query                     | 查询使用的都是物化视图的失效分区，也就是说物化视图不能为查询提供有效的数据 |
| Add filter to base table fail when union rewrite             | 查询使用了物化视图失效的分区，尝试将物化视图和原表 union all 失败 |
| RewrittenPlan output logical properties is different with target group | 改写完成，物化视图的 output 和原查询不一致                     |
| Rewrite expressions by view in join fail                     | join 改写中，查询使用的字段或者表达式不在物化视图中           |
| Rewrite expressions by view in scan fail                     | 单表改写中，查询使用的字段或者表达式不在物化视图中           |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 改写聚合时，物化视图中不含有聚合                             |
| Split query to top plan and agg fail                         | 改写聚合时，查询中不含有聚合                                 |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | 在查询和物化 group by 相等的时候，改写后的表达式含有聚合函数 |
| Can not rewrite expression when no roll up                   | 在查询和物化 group by 相等的时候，表达式改写失败             |
| Query function roll up fail                                  | 聚合改写时，聚合函数上卷失败                                 |
| View dimensions do not cover the query dimensions            | 查询中 group by 使用了一些维度，这些维度不在物化视图的 group by 后 |
| View dimensions don't not cover the query dimensions in bottom agg | 查询中 group by 使用了一些维度，这些维度不在物化视图的 group by 后 |
| View dimensions do not cover the query group set dimensions  | 查询中 group sets 使用了一些维度，这些维度不在物化视图的 group by 后 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | 查询中有 group by，但是物化视图中没有 group by                 |
| Both query and view have group sets, or query doesn't have but view has, not supported | 查询和物化视图都有 group sets 查询没有 group sets，但是物化视图有，这种不支持透明改写 |
|                                                              |                                                              |

### 3 异步物化视图分区构建物化视图失败原因和说明

分区物化视图的刷新原理是分区增量更新：

- 第一步需要计算物化视图的分区字段是否可以和基表的分区映射。

- 第二步是计算具体的映射关系，看分区是 1:1 还是 1:n。

| 摘要信息                                                     | 说明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| partition column can not be found in the SQL select column   | 物化视图定义中 partition by 后用的列需要出现在物化定义 SQL 的 select 后 |
| can't not find valid partition track column, because %s      | 找不到合适的分区列，具体原因在 because 后                    |
| partition track doesn't support mark join                    | 物化视图分区字段引用的列是 mark join 输入表的分区列，暂不支持 |
| partition column is in un supported join null generate side  | 物化视图分区字段引用列在 join 的 null 产生端，比如 left join 的右侧 |
| relation should be LogicalCatalogRelation                    | 物化化视图引用的分区基表 scan 类型应该是 LogicalCatalogRelation，其他暂不支持 |
| self join doesn't support partition update                   | 自关联的 SQL，暂不支持构建物化视图                           |
| partition track already has a related base table column      | 物化化视图引用的分区列，目前只支持引用一张基表的分区列       |
| relation base table is not MTMVRelatedTableIf                | 物化视图引用的分区基表没有继承 MTMVRelatedTableIf，MTMVRelatedTableIf 标识了是不是可以分区的表 |
| The related base table is not partition table                | 物化视图使用的基表不是分区表                                 |
| The related base table partition column doesn't contain the mv partition | 物化视图 partition by 后引用的列在分区基表中不存在           |
| group by sets is empty, doesn't contain the target partition | 物化视图定义 SQL，使用了聚合，但是 group by 为空             |
| window partition sets don't contain the target partition     | 使用了 window 函数，但是物化视图引用分区列不在 partition by 中 |
| Unsupported plan operate in track partition                  | 物化视图定义 SQL 中使用了不支持的操作，比如 order by 等        |
| context partition column should be slot from column          | 使用了 window 函数，partition by 中 物化视图引用分区列不是单纯的列，而是表达式 |
| partition expressions use more than one slot reference       | group by 或者 partition by 后分区列是包含了多列的表达式，而不是单纯的列。比如 group by partition_col + other_col |
| column to check using invalid implicit expression            | 物化视图分区列仅仅可以使用 date_trunc 中，使用了分区列的表达式只能是 date_trunc 等 |
| partition column time unit level should be greater than SQL select column | 物化视图中 partition by 后的 date_trunc 中的时间单位粒度小于 物化视图定义 SQL 中 select 后出现的时间单位粒度比如物化视图 `partition by(date_trunc(col, 'day'))`，但是物化视图定义 SQL select 后是 `date_trunc(col, 'month')` |