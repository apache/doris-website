---
title: 异步物化视图常见问题
description: 异步物化视图常见问题速查：构建报错、刷新异常、透明改写不命中、状态不可用等场景如何排查与解决？
keywords:
    - 异步物化视图 FAQ
    - 物化视图刷新失败
    - 透明改写不命中
    - 分区物化视图报错
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
---

<!-- 知识类型: 故障排查 / 常见问题 -->
<!-- 适用场景: 异步物化视图构建、刷新、查询改写中的问题诊断 -->

本文汇总异步物化视图（Async Materialized View）使用过程中的高频问题与排查思路。一句话定义：**异步物化视图**是基于基表数据按需或按计划刷新的预计算结果集，可用于查询的透明改写加速。

## 速查导航

<!-- 知识类型: 索引 -->
<!-- 适用场景: 快速定位故障与对应章节 -->

按用户使用阶段分为两大类问题，外加一份原因对照附录：

| 场景分类 | 涉及问题 | 关键词 |
| --- | --- | --- |
| [构建与刷新](#构建与刷新) | 创建报错、刷新策略、Schema Change、资源占用 | `BUILD`、`REFRESH`、`workload_group` |
| [查询与透明改写](#查询与透明改写) | 是否命中、为何不命中、状态不可用 | `explain`、`MaterializedViewRewrite`、`grace_period` |
| [附录](#附录) | 透明改写失败原因表、分区构建失败原因表 | 摘要信息对照表 |

常见问题快速定位 Checklist：

- 创建分区物化视图时报错 `Unable to find a suitable base table for partitioning`，跳转 [Q12](#q12构建分区物化视图报错) 与 [附录 2](#附录-2-异步物化视图分区构建失败原因)。
- 创建语句报 `Syntax error`，跳转 [Q13](#q13创建物化视图时报错-syntax-error)。
- 刷新成功但物化视图无数据，跳转 [Q14](#q14物化视图刷新成功后还是没有数据)。
- 分区物化视图却每次全量刷新，跳转 [Q15](#q15创建的是分区物化视图为什么每次都是全量刷新)。
- 透明改写未命中，跳转 [查询与透明改写 Q1/Q2](#q1如何确认查询是否命中物化视图) 与 [附录 1](#附录-1-透明改写失败摘要信息)。

## 构建与刷新

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 物化视图创建、刷新、变更过程中的问题 -->

### Q1：物化视图是如何判断需要刷新哪些分区的？

Doris 内部会计算物化视图与基表的分区对应关系，并记录上次刷新成功后所使用的基表分区版本。下次刷新时，会比对当前版本判断分区是否需要刷新。

**示例**：物化视图 `mv1` 由基表 `t1` 和 `t2` 创建，并依赖 `t1` 进行分区。假设 `mv1` 的分区 `p202003` 对应 `t1` 的分区 `p20200301` 和 `p20200302`：

- 刷新 `p202003` 后，会记录 `p20200301`、`p20200302` 以及表 `t2` 的当前版本。
- 下次刷新时，若 `p20200301`、`p20200302` 或 `t2` 的版本任一发生变化，就代表 `p202003` 需要刷新。

**业务排除**：如果业务上能接受 `t2` 的变化而不触发 `mv1` 的刷新，可通过物化视图属性 `excluded_trigger_tables` 进行设置。

### Q2：物化视图占用资源过多，影响其他业务怎么办？

可以通过物化视图的属性指定 [workload_group](../../../admin-manual/workload-management/workload-group.md)，控制物化视图刷新任务的资源使用。

**注意事项**：如果内存设置过小，而单个分区刷新所需内存较多，任务会刷新失败。需要根据业务情况进行权衡。

### Q3：能基于物化视图创建新的物化视图吗？

可以，从 Doris 2.1.3 版本开始支持。

**注意**：每个物化视图的刷新逻辑相互独立。例如 `mv2` 基于 `mv1` 创建，`mv1` 又基于 `t1` 创建，刷新 `mv2` 时不会考虑 `mv1` 与 `t1` 之间的数据是否同步。

### Q4：Doris 都支持哪些外表用于物化视图？

Doris 支持的所有外表均可用于创建物化视图。但目前**仅 Hive 支持分区刷新**，其余类型将在后续版本陆续支持。

### Q5：物化视图显示和 Hive 数据一致，但实际上不一致

物化视图仅能保证其数据与通过 Catalog 查询的结果一致。

由于 Catalog 包含一定的元数据和数据缓存，若希望物化视图与 Hive 中的数据保持一致，需通过 `Refresh Catalog` 等方式确保 Catalog 中的数据与 Hive 中的数据一致。

### Q6：物化视图支持 Schema Change 吗？

不支持修改。物化视图的列属性是根据其定义的 SQL 推导出来的，目前不支持显式自定义修改。

### Q7：物化视图使用的基表允许 Schema Change 吗？

允许。但变更后存在如下状态变化：

- 使用到该基表的物化视图状态会从 `NORMAL` 变为 `SCHEMA_CHANGE`。
- 处于 `SCHEMA_CHANGE` 状态时，物化视图不能用于透明改写，但不影响直接查询物化视图。
- 如果物化视图下次刷新任务成功，状态会由 `SCHEMA_CHANGE` 变回 `NORMAL`。

### Q8：主键模型的表能用来创建物化视图吗？

可以。物化视图对基表的数据模型没有要求，但**物化视图本身只能是明细模型**。

### Q9：物化视图上还能建索引吗？

可以。

### Q10：物化视图刷新时会锁表吗？

刷新过程中会在很小的阶段锁表，但不会持续占用表锁（几乎等同于导入数据时的锁表时间）。

### Q11：物化视图适合近实时场景吗？

不太适合。物化视图刷新的最小单位是分区，数据量较大时会占用较多资源，且实时性不够。建议改用同步物化视图或其他手段。

### Q12：构建分区物化视图报错

**报错信息**：

```text
Unable to find a suitable base table for partitioning
```

**原因分析**：

通常是物化视图的 SQL 定义和分区字段的选择导致不能进行分区增量更新，从而创建分区物化视图时报错：

- 物化视图想要分区增量更新，需要满足相应要求，详情见 [物化视图刷新模式](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters)。
- 最新版本可以提示分区构建失败的具体原因，原因摘要和说明见 [附录 2](#附录-2-异步物化视图分区构建失败原因)。

**示例**：

以下两张基表 `orders`（带分区）和 `lineitem`（不带分区）：

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
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;


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
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;
```

物化视图定义如下：如果选择 `orders.o_orderdate` 作为分区字段，则可以支持增量分区更新；相反，如果使用 `lineitem.l_shipdate`，则无法实现增量更新。

```sql
CREATE MATERIALIZED VIEW mv_1 
       BUILD IMMEDIATE 
       REFRESH AUTO ON MANUAL 
       partition by(o_orderdate) 
       DISTRIBUTED BY RANDOM BUCKETS 2
       AS 
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

**不能选 `lineitem.l_shipdate` 作为分区字段的原因**：

1. `lineitem.l_shipdate` 不是基表的分区列，实际上 `lineitem` 表并没有设置分区列。
2. `lineitem.l_shipdate` 是 `outer join` 操作中产生 `null` 值那一端的列。

### Q13：创建物化视图时报错 Syntax error

**报错信息**：

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

**可能原因**：

1. 异步物化视图的语句仅在新优化器下才支持，需确保使用的是新优化器：

    ```sql
    SET enable_nereids_planner = true;
    ```

2. 构建物化视图的语句使用的**关键词写错**或物化定义 **SQL 语法有问题**，可以检查物化定义 SQL 与创建物化语句是否正确。

### Q14：物化视图刷新成功后还是没有数据

物化视图判断数据是否需要更新，依赖于能够获取到基表或基表分区的版本信息。

对于目前不支持获取版本信息的数据湖（例如 JDBC Catalog），刷新时会认为物化视图不需要更新。**因此创建或刷新此类物化视图时应指定 `complete` 而不是 `auto`**。

物化视图支持数据湖的进度参考 [数据湖支持情况](./overview.md)。

### Q15：创建的是分区物化视图，为什么每次都是全量刷新？

物化视图的分区增量刷新依赖于基表分区的版本信息。如果物化视图的分区自上次刷新后基表分区数据发生变化，则只刷新此分区。

**可能原因**：

物化视图定义 SQL 中**非分区追踪表**的数据发生了变化，导致刷新时无法判断哪些分区需要更新，因此只能全量刷新。

**示例**：

此物化视图追踪 `orders` 表的 `o_orderdate` 分区，但 `lineitem` 或 `partsupp` 数据发生变化，导致物化视图无法判断哪些分区需要更新，只能全量刷新。

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE 
REFRESH AUTO 
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00' 
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2 
PROPERTIES 
("replication_num" = "3") 
AS 
SELECT 
o_orderdate, 
l_orderkey, 
l_partkey 
FROM 
orders 
LEFT JOIN lineitem ON l_orderkey = o_orderkey 
LEFT JOIN partsupp ON ps_partkey = l_partkey 
and l_suppkey = ps_suppkey;
```

**排查步骤**：

- **目的**：查看物化视图追踪的基表与分区列。
- **命令**：

    ```sql
    SELECT * 
    FROM mv_infos('database'='db_name')
    WHERE Name = 'partition_mv' \G 
    ```

- **说明**：返回结果中，`MvPartitionInfo.partitionType` 为 `FOLLOW_BASE_TABLE` 表示物化视图分区跟随基表分区；`relatedCol` 为 `o_orderdate` 表示基于该列分区。

    ```text
                    Id: 1752809156450
                  Name: partition_mv
               JobName: inner_mtmv_1752809156450
                 State: NORMAL
    SchemaChangeDetail: 
          RefreshState: SUCCESS
           RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 DAY STARTS "2025-12-01 20:30:00"
              QuerySql: SELECT
                        `internal`.`doc_db`.`orders`.`o_orderdate`,
                        `internal`.`doc_db`.`lineitem`.`l_orderkey`,
                        `internal`.`doc_db`.`lineitem`.`l_partkey`
                        FROM
                        `internal`.`doc_db`.`orders`
                        LEFT JOIN `internal`.`doc_db`.`lineitem` ON `internal`.`doc_db`.`lineitem`.`l_orderkey` = `internal`.`doc_db`.`orders`.`o_orderkey`
                        LEFT JOIN `internal`.`doc_db`.`partsupp` ON `internal`.`doc_db`.`partsupp`.`ps_partkey` = `internal`.`doc_db`.`lineitem`.`l_partkey`
                        and `internal`.`doc_db`.`lineitem`.`l_suppkey` = `internal`.`doc_db`.`partsupp`.`ps_suppkey`
       MvPartitionInfo: MTMVPartitionInfo{partitionType=EXPR, relatedTable=orders, relatedCol='o_orderdate', partitionCol='o_orderdate'}
    SyncWithBaseTables: 1
    ```

**解决办法**：

如果 `lineitem` 或 `partsupp` 表的数据变化对物化视图没有影响，可通过设置 `excluded_trigger_tables` 属性排除这些表的变化引起的全量刷新：

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

## 查询与透明改写

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 物化视图查询命中率诊断、透明改写失败排查 -->

### Q1：如何确认查询是否命中物化视图？

可以通过 `explain query_sql` 查看物化视图命中情况摘要信息。

**示例物化视图**：

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**执行 explain**：

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**结果解读**：

物化视图的命中信息位于 plan 最后部分，关键字段含义如下：

| 字段 | 含义 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 透明改写成功，且 CBO 最终选择使用的物化视图名称列表 |
| `MaterializedViewRewriteSuccessButNotChose` | 透明改写成功，但 CBO 没有选择的物化视图名称列表（执行计划不会使用） |
| `MaterializedViewRewriteFail` | 列举透明改写失败的物化视图及原因摘要 |

如果 `explain` 最后没有出现 `MaterializedView` 相关信息，意味着此物化视图状态不可用，因此不能参与透明改写（关于何种情况会导致物化视图状态不可用，可参考使用与实践 - 查看物化视图状态）。

**输出示例**：

```text
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

首先按照 [Q1](#q1如何确认查询是否命中物化视图) 确认是否命中：

```sql
explain
your_query_sql;
```

**未命中可能原因**：

1. 在 Doris 2.1.3 之前的版本中，物化视图透明改写功能默认关闭，需要打开对应开关才能实现透明改写。具体开关请参见异步物化视图相关开关。
2. 物化视图可能处于不可用状态。要查看物化视图的构建状态，请参见查看物化视图状态。
3. 经过前两步检查后仍未命中，可能是物化视图的定义 SQL 和查询 SQL 不在当前透明改写能力范围内。详情参考 [物化视图透明改写能力](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite)。
4. 失败命中的详细摘要信息和说明，请查阅 [附录 1](#附录-1-透明改写失败摘要信息)。

下面通过两个示例说明常见的透明改写失败场景。

#### 用例 1：Join 顺序不一致导致改写失败

**创建物化视图**：

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

**执行查询**：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain 输出**：

```text
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

`MaterializedViewRewriteFail` 包含失败摘要 `The graph logic between query and view is not consistent`，表示查询与物化视图的 Join 逻辑不一致（即 Join 类型或 Join 的表不同）。本例中查询和物化视图 Join 的表顺序不一致，因此报告此错误。完整摘要信息说明请参见 [附录 1](#附录-1-透明改写失败摘要信息)。

#### 用例 2：维度未被物化视图覆盖

**执行查询**：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain 输出**：

```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

失败摘要 `View dimensions doesn't not cover the query dimensions` 表示查询中 `group by` 的字段无法从物化视图的 `group by` 字段中获取，因此报告此错误。

### Q3：什么情况会导致物化视图的状态变更并且不可用？

「不可用」是指**物化视图不能用于透明改写**，但物化视图本身仍可直接查询。

| 物化视图类型 | 触发不可用的事件 | 影响范围 |
| --- | --- | --- |
| 全量物化视图 | 基表数据变更 / 基表 Schema Change | 整个物化视图不可用 |
| 分区物化视图 | 基表数据变更 | 对应分区不可用 |
| 分区物化视图 | 基表 Schema Change | 整个物化视图不可用 |

目前，物化视图刷新失败也会导致其不可用。后续会进行优化：即使刷新失败，已存在的物化视图仍可用于透明改写。

### Q4：直查物化视图没有数据

可能原因：

- 物化视图正在构建中。
- 物化视图构建已经失败。

可通过查询物化视图状态确认，具体方法请参见查看物化视图状态。

### Q5：基表数据变更但物化视图未刷新时，透明改写的行为是什么？

异步物化视图的数据与基表之间存在一定的时延。透明改写行为取决于基表类型与 `grace_period` 阈值。

**1. 内表与可感知数据变化的外表（如 Hive）**：

`grace_period` 是允许物化视图与基表数据不一致的最大时间段：

| `grace_period` 设置 | 改写行为 |
| --- | --- |
| `0` | 要求物化视图与基表数据完全一致才可用于透明改写；对于无法感知数据变更的外表（除 Hive 外），无论数据是否最新都可以用于透明改写（数据可能不一致） |
| `10`（秒） | 允许物化视图与基表数据有最多 10 秒延迟，延迟在 10 秒内时仍可用于透明改写 |

**2. 分区物化视图，部分分区失效时**：

- 查询未使用失效分区数据：物化视图仍可用。
- 查询使用了失效分区数据，且数据时效在 `grace_period` 范围内：物化视图仍可用。
- 数据时效超出 `grace_period` 范围：可通过联合原表和物化视图响应查询。此时需要开启联合改写开关 `enable_materialized_view_union_rewrite`（自 2.1.5 版本起，该开关默认开启）。

## 附录

### 附录 1 透明改写失败摘要信息

<!-- 知识类型: 参考表 -->
<!-- 适用场景: 根据 explain 输出的 FailSummary 定位透明改写失败原因 -->

| 摘要信息 | 说明 |
| --- | --- |
| View struct info is invalid | 物化视图的结构信息不合法。目前支持改写的 SQL pattern：查询是 join，物化也是 join；查询是 agg，物化可以没有 join。透明改写过程中，多数情况会显示这个问题，因为每个透明改写规则负责一定 SQL pattern 的改写，命中了不符合要求的规则就会报此错误。一般不是决定透明改写失败的主要原因 |
| Materialized view rule exec fail | 透明改写规则执行抛异常，需要 `Explain memo plan query_sql` 查看具体异常栈 |
| Match mode is invalid | 查询和物化视图表的数量不一致，暂不支持改写 |
| Query to view table mapping is null | 查询和物化视图表映射生成失败 |
| queryToViewTableMappings are over the limit and be intercepted | 查询自关联的表太多，导致透明改写空间膨胀过大，停止透明改写 |
| Query to view slot mapping is null | 查询和物化的表 slot 映射失败 |
| The graph logic between query and view is not consistent | 查询和物化的 Join 类型不同或者 Join 的表不同 |
| Predicate compensate fail | 一般是查询的条件范围在物化的范围外，比如查询是 a > 10，但是物化是 a > 15 |
| Rewrite compensate predicate by view fail | 条件补偿失败，通常是查询比物化多的条件需要补偿，但条件用的列没有出现在物化视图 select 后 |
| Calc invalid partitions fail | 分区物化视图尝试计算查询使用的分区是否有效失败 |
| mv can not offer any partition for query | 查询使用的都是物化视图的失效分区。可使用 `show partitions from mv_name` 查看分区的 `SyncWithBaseTables` 字段是否为 true。如果为 false，可手动刷新对应分区；若允许物化和查询的数据有一定延迟，可以设置物化视图的 `grace_period` 属性（单位秒） |
| Add filter to base table fail when union rewrite | 查询使用了物化视图失效的分区，尝试将物化视图和原表 union all 失败 |
| RewrittenPlan output logical properties is different with target group | 改写完成，物化视图的 output 和原查询不一致 |
| Rewrite expressions by view in join fail | join 改写中，查询使用的字段或者表达式不在物化视图中 |
| Rewrite expressions by view in scan fail | 单表改写中，查询使用的字段或者表达式不在物化视图中 |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 改写聚合时，物化视图中不含有聚合 |
| Split query to top plan and agg fail | 改写聚合时，查询中不含有聚合 |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | 在查询和物化 group by 相等时，改写后的表达式含有聚合函数 |
| Can not rewrite expression when no roll up | 在查询和物化 group by 相等时，表达式改写失败 |
| Query function roll up fail | 聚合改写时，聚合函数上卷失败 |
| View dimensions do not cover the query dimensions | 查询中 group by 使用了一些维度，这些维度不在物化视图的 group by 后 |
| View dimensions don't not cover the query dimensions in bottom agg | 查询中 group by 使用了一些维度，这些维度不在物化视图的 group by 后 |
| View dimensions do not cover the query group set dimensions | 查询中 group sets 使用了一些维度，这些维度不在物化视图的 group by 后 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | 查询中有 group by，但是物化视图中没有 group by |
| Both query and view have group sets, or query doesn't have but view has, not supported | 查询和物化视图都有 group sets，或查询没有 group sets 但物化视图有，这种不支持透明改写 |

### 附录 2 异步物化视图分区构建失败原因

<!-- 知识类型: 参考表 -->
<!-- 适用场景: 创建分区物化视图报错时定位原因 -->

分区物化视图的刷新原理是分区增量更新：

1. **第一步**：计算物化视图的分区字段是否可以和基表的分区映射。
2. **第二步**：计算具体的映射关系，分区是 1:1 还是 1:n。

| 摘要信息 | 说明 |
| --- | --- |
| partition column can not be found in the SQL select column | 物化视图定义中 `partition by` 后用的列需要出现在物化定义 SQL 的 select 后 |
| can't not find valid partition track column, because %s | 找不到合适的分区列，具体原因在 `because` 后 |
| partition track doesn't support mark join | 物化视图分区字段引用的列是 mark join 输入表的分区列，暂不支持 |
| partition column is in un supported join null generate side | 物化视图分区字段引用列在 join 的 null 产生端，比如 left join 的右侧 |
| relation should be LogicalCatalogRelation | 物化视图引用的分区基表 scan 类型应该是 `LogicalCatalogRelation`，其他暂不支持 |
| self join doesn't support partition update | 自关联的 SQL 暂不支持构建物化视图 |
| partition track already has a related base table column | 物化视图引用的分区列目前只支持引用一张基表的分区列 |
| relation base table is not MTMVRelatedTableIf | 物化视图引用的分区基表没有继承 `MTMVRelatedTableIf`，该接口标识表是否可分区 |
| The related base table is not partition table | 物化视图使用的基表不是分区表 |
| The related base table partition column doesn't contain the mv partition | 物化视图 `partition by` 后引用的列在分区基表中不存在 |
| group by sets is empty, doesn't contain the target partition | 物化视图定义 SQL 使用了聚合，但 `group by` 为空 |
| window partition sets don't contain the target partition | 使用了 window 函数，但物化视图引用的分区列不在 `partition by` 中 |
| Unsupported plan operate in track partition | 物化视图定义 SQL 中使用了不支持的操作，比如 `order by` 等 |
| context partition column should be slot from column | 使用了 window 函数，`partition by` 中物化视图引用的分区列不是单纯的列，而是表达式 |
| partition expressions use more than one slot reference | `group by` 或 `partition by` 后分区列是包含多列的表达式而不是单纯的列。比如 `group by partition_col + other_col` |
| column to check using invalid implicit expression | 物化视图分区列只能使用 `date_trunc`，使用了分区列的表达式只能是 `date_trunc` 等 |
| partition column time unit level should be greater than SQL select column | 物化视图中 `partition by` 后 `date_trunc` 的时间粒度小于物化视图定义 SQL 中 select 后出现的时间粒度。例如物化视图 `partition by(date_trunc(col, 'day'))`，但物化视图定义 SQL select 后是 `date_trunc(col, 'month')` |
