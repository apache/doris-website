---
{
    "title": "同步物化视图",
    "language": "zh-CN",
    "description": "如何使用 Doris 同步物化视图加速聚合、前缀索引匹配与表达式计算？本文给出场景、语法、命中验证与常见问题。",
    "keywords": ["Doris 同步物化视图", "materialized view", "查询加速", "bitmap_union", "前缀索引", "聚合预计算"]
}
---

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：聚合预计算、前缀索引匹配、预过滤、表达式预计算 -->

## 一句话定义

同步物化视图（Sync Materialized View）是 Doris 中基于基表 SELECT 语句预先计算并存储结果的特殊表，由 Doris 自动维护，写入时与基表保持强一致，查询时自动匹配最优视图加速读取。

## 快速 Checklist

在使用同步物化视图前，请确认以下要点：

- [ ] 仅针对**单表** SELECT，不涉及 JOIN、HAVING、LIMIT、LATERAL VIEW
- [ ] SELECT 列表无自增列、常量、重复表达式、窗口函数、VARBINARY 类型
- [ ] SELECT 列表中聚合函数为根表达式（支持 `sum(a + 1)`，不支持 `sum(a) + 1`）
- [ ] 物化视图列名与基表及其他视图列名不冲突（可通过 `col as xxx` 别名规避）
- [ ] 已评估单表上视图数量对导入性能的影响
- [ ] Unique Key 模型仅用于改变列顺序，不可用于聚合

## 什么是同步物化视图

<!-- 知识类型：概念 -->

同步物化视图是将预先计算（根据定义好的 SELECT 语句）的数据集，存储在 Doris 中的一个特殊的表。Doris 会自动维护同步物化视图的数据，无论是新增数据还是删除数据，都能保证基表（Base Table）和物化视图表的数据同步更新并保持一致，只有同步完成后，相关命令才会结束，无需任何额外的人工维护成本。查询时，Doris 会自动匹配到最优的物化视图，并直接从物化视图中读取数据。

## 适用场景

<!-- 适用场景：何时选择同步物化视图 -->

| 场景 | 说明 |
| --- | --- |
| 加速聚合运算 | 对耗时的 SUM/COUNT/BITMAP_UNION 等聚合预计算 |
| 匹配不同前缀索引 | 当查询过滤列与基表前缀索引不一致时，构建以过滤列为前缀的视图 |
| 预先过滤减少扫描 | 通过 WHERE 条件提前过滤，缩小数据量 |
| 预计算复杂表达式 | 提前计算 `abs(k1)+k2+1` 等复杂表达式，查询时直接复用 |

## 局限性

<!-- 知识类型：约束 -->

| 类别 | 限制说明 |
| --- | --- |
| 语法范围 | 仅支持单表 SELECT，支持 WHERE/GROUP BY/ORDER BY；不支持 JOIN、HAVING、LIMIT、LATERAL VIEW |
| 查询方式 | 不能直接查询同步物化视图（与异步物化视图不同） |
| SELECT 列表 | 不能包含自增列、常量、重复表达式、窗口函数；不能包含 VARBINARY 类型列 |
| 列名要求 | 不能与基表或基表上其他物化视图重名，可通过别名（`col as xxx`）规避 |
| 聚合函数 | 必须是根表达式（不支持 `sum(a) + 1`，支持 `sum(a + 1)`）；聚合函数之后不能有其他非聚合表达式（`SELECT x, sum(a)` 可以，`SELECT sum(a), x` 不行） |
| 删除限制 | 若 DELETE 条件列存在于物化视图中，需先删除视图再删除数据 |
| 导入性能 | 单表上过多物化视图会拖慢导入，因为视图与基表同步更新 |
| 数据模型 | Unique Key 模型上的物化视图只能改变列顺序，不能起到聚合作用 |

## 使用同步物化视图

Doris 系统提供了一整套针对物化视图的 DDL 语法，包括创建、查看和删除。下面通过一个示例来展示如何使用物化视图加速聚合计算。

### 准备基表数据

假设用户有一张销售记录明细表，存储了每笔交易的交易 ID、销售员、售卖门店、销售时间以及金额。

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
insert into sales_records values(1,1,1,"2020-02-02",1), (1,1,1,"2020-02-02",2);
```

### 创建物化视图

**目的**：为经常按门店分析销售量的查询创建预聚合视图。

**命令**：

```sql
create materialized view store_amt as 
select store_id as store_id_, sum(sale_amt) from sales_records group by store_id;
```

**说明**：该视图按 `store_id` 分组，对相同门店的 `sale_amt` 求和，从而加速门店维度的聚合查询。

### 检查物化视图是否创建完成

**目的**：创建物化视图是异步操作，需要确认任务状态。

**命令**：

```sql
show alter table materialized view from test_db;
```

**说明**：该命令的结果将显示该数据库的所有创建物化视图的任务。结果示例如下：

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

关键字段说明：

| 字段 | 含义 |
| --- | --- |
| TableName | 物化视图的数据来源表 |
| RollupIndexName | 物化视图的名称 |
| State | 任务状态，`FINISHED` 表示创建成功，可被查询自动匹配 |

### 取消创建物化视图

**目的**：当后台异步任务尚未结束时，取消创建任务。

**命令**：

```sql
cancel alter table materialized view from test_db.sales_records;
```

**说明**：如果物化视图已经创建完毕，则无法通过该命令取消创建，但可以通过删除命令来删除物化视图。

### 查看物化视图的表结构

**目的**：查看目标表上所有物化视图及其表结构。

**命令**：

```sql
desc sales_records all;
```

**说明**：该命令的结果如下：

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

可以看到，`sales_records` 上有一个名为 `store_amt` 的物化视图，即前面步骤创建的视图。

### 查看物化视图的创建语句

**目的**：查询某个物化视图的原始 DDL。

**命令**：

```sql
show create materialized view store_amt on sales_records;
```

**说明**：输出如下：

```sql
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| TableName     | ViewName  | CreateStmt                                                                                                 |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| sales_records | store_amt | create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
```

### 查询物化视图

**目的**：用户的查询依旧指向基表，由 Doris 自动改写到物化视图。

**命令**：

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

上面的查询会自动匹配到 `store_amt`。可以通过 `EXPLAIN` 命令检验当前查询是否命中了物化视图：

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

**说明**：结果如下：

```sql
+------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                       |
+------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                        |
|   OUTPUT EXPRS:                                                        |
|     store_id[#11]                                                      |
|     sum(sale_amt)[#12]                                                 |
|   PARTITION: HASH_PARTITIONED: store_id_[#7]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: true                                             |
|                                                                        |
|   VRESULT SINK                                                         |
|      MYSQL_PROTOCAL                                                    |
|                                                                        |
|   3:VAGGREGATE (merge finalize)(384)                                   |
|   |  output: sum(partial_sum(__sum_1)[#8])[#10]                        |
|   |  group by: store_id_[#7]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  final projections: store_id_[#9], sum(__sum_1)[#10]               |
|   |  final project output tuple id: 4                                  |
|   |  distribute expr lists: store_id_[#7]                              |
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
|     HASH_PARTITIONED: store_id_[#7]                                    |
|                                                                        |
|   1:VAGGREGATE (update serialize)(374)                                 |
|   |  STREAMING                                                         |
|   |  output: partial_sum(__sum_1[#1])[#8]                              |
|   |  group by: store_id_[#0]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  distribute expr lists:                                            |
|   |                                                                    |
|   0:VOlapScanNode(369)                                                 |
|      TABLE: test_db.sales_records(store_amt), PREAGGREGATION: ON       |
|      partitions = 1/1 (sales_records)                                  |
|      tablets = 10/10, tabletList = 266568, 266570, 266572 ...          |
|      cardinality = 1, avgRowSize = 1805.0, numNodes = 1                |
|      pushAggOp = NONE                                                  |
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
| planned with unknown column statistics                                 |
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

#### MATERIALIZATIONS 字段说明

| 字段 | 含义 |
| --- | --- |
| MaterializedViewRewriteSuccessAndChose | 被成功选中并用于查询优化的物化视图 |
| MaterializedViewRewriteSuccessButNotChose | 匹配成功但未被选中的物化视图（基于成本评估非最优） |
| MaterializedViewRewriteFail | 未能匹配的物化视图，原始 SQL 与现有视图无法匹配 |

### 删除物化视图

**目的**：移除不再需要的物化视图。

**命令**：

```sql
drop materialized view store_amt on sales_records;
```

## 使用示例

### 示例一：加速聚合查询

<!-- 适用场景：UV/PV 等精确去重聚合 -->

**业务场景**：计算广告的 UV（独立访客数）和 PV（页面访问量）。

**步骤**：

1. 创建存储广告点击数据明细的原始表：

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

2. 用户想要查询广告的 UV 值（对相同广告的用户进行精确去重），查询语句一般为：

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

3. 针对求 UV 的场景，创建一个带有 `bitmap_union` 的物化视图实现预先精确去重。在 Doris 中，`count(distinct)` 的结果与 `bitmap_union_count` 完全一致，因此可通过 `bitmap_union` 聚合的物化视图加速查询：

    ```sql
    create materialized view advertiser_uv as 
    select 
        advertiser as advertiser_, 
        channel as channel_, 
        bitmap_union(to_bitmap(user_id)) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

4. 物化视图创建完成后，再次执行原始 UV 查询，Doris 会自动从 `advertiser_uv` 中读取：

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

5. 在选中物化视图后，实际查询会被改写为：

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

6. 通过 `explain` 命令检查查询是否匹配到了物化视图：

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

7. 输出结果如下：

    ```sql
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                                                                                         |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | PLAN FRAGMENT 0                                                                                                                                         |
    |   OUTPUT EXPRS:                                                                                                                                         |
    |     advertiser[#13]                                                                                                                                     |
    |     channel[#14]                                                                                                                                        |
    |     count(DISTINCT user_id)[#15]                                                                                                                        |
    |   PARTITION: HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                            |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: true                                                                                                                              |
    |                                                                                                                                                         |
    |   VRESULT SINK                                                                                                                                          |
    |      MYSQL_PROTOCAL                                                                                                                                     |
    |                                                                                                                                                         |
    |   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
    |   |  output: bitmap_union_count(partial_bitmap_union_count(__bitmap_union_2)[#9])[#12]                                                                  |
    |   |  group by: advertiser_[#7], channel_[#8]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  final projections: advertiser_[#10], channel_[#11], bitmap_union_count(__bitmap_union_2)[#12]                                                      |
    |   |  final project output tuple id: 4                                                                                                                   |
    |   |  distribute expr lists: advertiser_[#7], channel_[#8]                                                                                               |
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
    |     HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                                     |
    |                                                                                                                                                         |
    |   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
    |   |  STREAMING                                                                                                                                          |
    |   |  output: partial_bitmap_union_count(__bitmap_union_2[#2])[#9]                                                                                       |
    |   |  group by: advertiser_[#0], channel_[#1]                                                                                                            |
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

8. 在 `explain` 的结果中，可以看到 `internal.test_db.advertiser_view_record.advertiser_uv chose`，说明查询直接扫描物化视图的数据，匹配成功。同时，对 `user_id` 字段的 `count(distinct)` 被改写为 `bitmap_union_count(to_bitmap)`，通过 Bitmap 实现精确去重。

### 示例二：匹配不同前缀索引

<!-- 适用场景：基表前缀索引无法覆盖的过滤条件 -->

**业务场景**：匹配前缀索引。

用户的原始表包含三列（k1、k2、k3），其中 k1 和 k2 被设置为前缀索引列。当查询条件中包含 `where k1=1 and k2=2` 时，可通过索引加速。然而 `where k3=3` 等条件无法命中前缀索引。为此，可创建一个以 `k3` 为第一列的物化视图。

**步骤**：

1. 建表并插入数据：

    ```sql
    create table test_table
    (
        k1 int, 
        k2 int, 
        k3 int, 
        kx int
    ) 
    distributed by hash(k1) 
    properties("replication_num" = "1");
    
    insert into test_table values(1,1,1,1),(3,3,3,3);
    ```

2. 创建以 k3 为前缀索引的物化视图：

    ```sql
    create materialized view mv_1 as SELECT k3 as k3_, k2 as k2_, k1 as k1_ FROM test_table;
    ```

3. 使用 `EXPLAIN` 检查查询是否匹配物化视图：

    ```sql
    explain select k1, k2, k3 from test_table where k3=3;
    ```

4. 输出结果如下：

    ```sql
    +----------------------------------------------------------+
    | Explain String(Nereids Planner)                          |
    +----------------------------------------------------------+
    | PLAN FRAGMENT 0                                          |
    |   OUTPUT EXPRS:                                          |
    |     k1[#7]                                               |
    |     k2[#8]                                               |
    |     k3[#9]                                               |
    |   PARTITION: HASH_PARTITIONED: k1_[#2]                   |
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
    |      final projections: k1_[#2], mv_k2[#1], mv_k3[#0]    |
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

5. 在 `EXPLAIN` 结果中，可以看到 `internal.test_db.test_table.mv_1 chose`，表明查询成功命中了物化视图。

### 示例三：预先过滤和表达式计算加速查询

<!-- 适用场景：复杂表达式重复计算或固定 WHERE 条件下的子集查询 -->

**业务场景**：需要提前过滤数据或加速表达式计算。

**步骤**：

1. 建表并插入数据：

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

2. 创建两个物化视图，分别用于表达式预计算和数据预过滤：

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

3. 验证物化视图命中情况：

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
    
    -- 命中原始表 d_table，不会命中 mv2，因为 where 条件不匹配
    select 
        year(k4),
        month(k4) 
    from 
        d_table;
    ```

## 常见问题（FAQ / Troubleshooting）

<!-- 知识类型：FAQ -->

### Q1：物化视图创建后为什么没有改写成功？

**原因**：物化视图可能仍处于构建过程中。

**排查命令**：

```sql
show alter table materialized view from test_db;
```

**说明**：若 `State` 字段不是 `FINISHED`，需等待构建完成；状态变为 `FINISHED` 后物化视图才可被查询命中。此外，若基表无任何数据，也可能不触发命中。

### Q2：从 2.x 升级到 3.0.0 后，之前的同步物化视图为什么不能命中了？

**原因**：自 3.0.0 版本起，默认使用基于 plan 结构信息的方式对同步物化视图进行透明改写。

**解决方法**：如果发现 2.x 能命中但 3.0.0 不能命中，可关闭如下开关（默认开启）：

```sql
SET enable_sync_mv_cost_based_rewrite = true;
```

### Q3：同步物化视图与异步物化视图有何区别？

| 对比项 | 同步物化视图 | 异步物化视图 |
| --- | --- | --- |
| 数据一致性 | 与基表强一致，写入同步更新 | 异步刷新，存在延迟 |
| 支持语法 | 仅单表 SELECT | 支持多表 JOIN 等复杂查询 |
| 直接查询 | 不支持，需通过基表查询自动改写 | 支持直接查询视图 |
| 维护成本 | 自动维护，无需人工干预 | 需配置刷新策略 |
| 适用场景 | 单表聚合/前缀索引/预过滤/表达式预计算 | 多表 JOIN 与跨表预计算 |
