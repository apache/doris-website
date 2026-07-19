---
{
    "title": "Runtime Filter 工作原理与调优",
    "language": "zh-CN",
    "description": "Doris Runtime Filter 是什么？如何配置 Join Runtime Filter 与 TopN Runtime Filter？本文讲解原理、查看方法与调优参数。",
    "keywords": ["Doris Runtime Filter", "Join Runtime Filter", "TopN Runtime Filter", "Bloom Filter", "Min-Max Filter", "查询加速", "运行时过滤"]
}
---

<!-- 知识类型：概念 + 操作 -->
<!-- 适用场景：查询加速调优、Join 优化、TopN 优化 -->

Runtime Filter 是 Doris 在查询执行期间根据运行时数据动态生成的过滤条件，用于减少 Scan 数据量与网络传输。Doris 支持两类 Runtime Filter：**Join Runtime Filter（JRF）** 与 **TopN Runtime Filter**。

## 阅读前 Checklist

- 是否了解 Doris Join 执行流程与 Scan 节点。
- 是否区分 Hash Join 与 Shuffle Join 的执行模式。
- 是否熟悉 `EXPLAIN`、`EXPLAIN SHAPE PLAN`、Profile 的查看方式。
- 是否知道目标场景属于 Join 过滤还是 TopN 提前裁剪。

## Join Runtime Filter

<!-- 知识类型：概念 -->
<!-- 适用场景：等值/非等值 Join 查询加速 -->

Join Runtime Filter（以下简称 JRF）是一种运行时优化技术：在 Join 节点根据右表数据动态生成 Filter，下推到左表 Scan，以降低 Probe 规模、IO 与网络传输。

### 工作原理

<!-- 知识类型：原理 -->
<!-- 适用场景：理解 JRF 生成与下推流程 -->

以一个类似 TPC-H Schema 的 Join 为例说明 JRF 的工作原理。

假设数据库中有两张表：

- **订单表（orders）**：1 亿行，包含订单号 `o_orderkey`、客户编号 `o_custkey` 等。
- **客户表（customer）**：10 万行，包含客户编号 `c_custkey`、客户国籍 `c_nation` 等；共 25 个国家，每个国家约 4 千客户。

统计来自中国的客户的订单数量：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china"
```

执行计划主体是一个 Join：

![Join Runtime Filter](/images/join-runtime-filter-1.jpg)

在没有 JRF 的情况下，Scan 节点会扫描 orders 表全部 1 亿行，Join 节点对其做 Hash Probe 后生成结果。

#### 1. 优化思路

过滤条件 `c_nation = "china"` 会过滤掉所有非中国客户，因此参与 Join 的 customer 仅是 customer 表的一部分（约 1/25）。Join 条件为 `o_custkey = c_custkey`，因此只需关心过滤后选中的 `c_custkey` 集合，记为集合 A。

> **集合 A** 专指参与 Join 的 `c_custkey` 集合。

如果将集合 A 作为 IN 条件下推给 orders 表，Scan 节点即可对 orders 提前过滤，相当于增加 `c_custkey in (c001, c003)`：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china" and o_custkey in (c001, c003)
```

优化后的执行计划：

![join-runtime-filter-2](/images/join-runtime-filter-2.jpg)

参与 Join 的 orders 行数从 1 亿降至 40 万，查询速度大幅提升。

#### 2. 实现方法

优化器无法在静态分析阶段预知集合 A 的内容，因此 Doris 在 Join 节点收集右侧数据后**运行时**生成集合 A，并下推给 orders 表的 Scan 节点。该 JRF 通常记作：`RF(c_custkey -> [o_custkey])`。

由于 Doris 是分布式数据库，JRF 还需经过一次合并：

| 步骤 | 角色 | 动作 |
| --- | --- | --- |
| 1 | 各 Join Instance | 基于本分片 `c_custkey` 生成 Partial JRF |
| 2 | Runtime Filter Manager（选定节点） | 收集所有 Partial JRF |
| 3 | Manager | 合并生成 Global JRF |
| 4 | Manager | 下发 Global JRF 给 orders 的 Scan Instance |

生成 Global JRF 的流程：

![Global JRF](/images/global-JRF.jpg)

### Filter 类型

<!-- 知识类型：对比 -->
<!-- 适用场景：选择合适的 JRF 数据结构 -->

JRF 有多种实现方式，在生成、合并、传输、应用代价上各有差异。

| 类型 | 适用场景 | 过滤精度 | 代价 |
| --- | --- | --- | --- |
| In Filter | 集合 A 元素较少的等值 Join | 精确 | 元素多时去重、传输、Probe 代价高 |
| Bloom Filter | 集合 A 元素较多的等值 Join | 模糊（存在哈希碰撞） | 中等，受桶数量影响 |
| Min-Max Filter | 数据有序、或非等值 Join | 模糊 | 最低 |

#### 1. In Filter

最简单的 JRF 实现。以前述例子为例，执行引擎在左表生成谓词 `o_custkey in (...A 中元素列表...)` 进行过滤。集合 A 较小时效率高。

集合 A 较大时，In Filter 存在性能问题：

1. **生成成本高**：合并时需对各分片采集的 `c_custkey` 去重（如 `c_custkey` 不是主键，重复值会很多），耗时较长。
2. **传输成本高**：Join 节点与 Scan 节点之间传输大量元素代价大。
3. **执行成本高**：Scan 节点执行 IN 谓词本身耗时。

为此，Doris 引入了 Bloom Filter。

#### 2. Bloom Filter

可将 Bloom Filter 理解为一组叠加的哈希表。它利用以下性质过滤：

- 基于集合 A 生成哈希表 T；若元素 **不在** T 中，则一定 **不在** A 中；反之不成立。
- 因此被 Bloom Filter 过滤掉的 `o_orderkey`，在 Join 右侧一定不存在相等的 `c_custkey`；但由于哈希碰撞，部分不匹配的 `o_custkey` 也可能通过过滤。
- 哈希桶数量决定过滤准确率：桶越多准确性越高，但生成、传输、计算代价也越大。

Bloom Filter 大小需在过滤效果与代价之间权衡，可通过以下参数约束最大/最小值：

| 参数 | 说明 |
| --- | --- |
| `RUNTIME_BLOOM_FILTER_MIN_SIZE` | Bloom Filter 最小字节数 |
| `RUNTIME_BLOOM_FILTER_MAX_SIZE` | Bloom Filter 最大字节数 |

#### 3. Min/Max Filter

Min-Max Filter 也用于模糊过滤。在数据列有序时过滤效果良好，且生成、合并、应用的代价远低于 In Filter 与 Bloom Filter。

对于非等值 Join，In Filter 与 Bloom Filter 均无法工作，但 Min-Max Filter 仍然有效：

```sql
select count(*)
from orders join customer on o_custkey > c_custkey
where c_name = "China"
```

可选出过滤后最大的 `c_custkey`，记为 n，传给 orders 的 Scan 节点；Scan 节点仅输出 `o_custkey > n` 的行。

### 查看 Join Runtime Filter

<!-- 知识类型：操作 -->
<!-- 适用场景：定位 JRF 是否生成、是否生效 -->

可通过以下三种方式查看 JRF：

| 方式 | 命令 | 说明 |
| --- | --- | --- |
| 文本执行计划 | `EXPLAIN` | 查看 Join 端生成与 Scan 端应用 |
| 形状执行计划 | `EXPLAIN SHAPE PLAN` | 查看 Nereids Planner 规划的 RF |
| 实际执行 Profile | `SET enable_profile=true` 后查询 | 查看实际过滤行数与状态 |

以下示例基于 TPC-H Schema：

```sql
select count(*) from orders join customer on o_custkey=c_custkey;
```

#### 1. EXPLAIN

JRF 信息分布在 Join 节点和 Scan 节点中：

```sql
4: VHASH JOIN(258)
| join op: INNER JOIN(PARTITIONED)[]
|  equal join conjunct: (o_custkey[#10] = c_custkey[#0])
|  runtime filters: RF000[bloom] <- c_custkey[#0] (150000000/134217728/16777216)
|  cardinality=1,500,000,000
|  vec output tuple id: 3
|  output tuple id: 3
|  vIntermediate tuple ids: 2
|  hash output slot ids: 10
|  final projections: o_custkey[#17]
|  final project output tuple id: 3
|  distribute expr lists: o_custkey[#10]
|  distribute expr lists: c_custkey[#0]
|
|---1: VEXCHANGE
|      offset: 0
|      distribute expr lists: c_custkey[#0]
3: VEXCHANGE
|  offset: 0
|  distribute expr lists:

PLAN FRAGMENT 2
| PARTITION: HASH_PARTITIONED: o_orderkey[#8]
| HAS_COLO_PLAN_NODE: false
| STREAM DATA SINK
|   EXCHANGE ID: 03
|   HASH_PARTITIONED: o_custkey[#10]

2: VOlapScanNode(242)
|  TABLE: regression_test_nereids_tpch_shape_sf1000_p0.orders(orders)
|  PREAGGREGATION: ON
|  runtime filters: RF000[bloom] -> o_custkey[#10]
|  partitions=1/1 (orders)
|  tablets=96/96, tabletList=54990,54992,54994 ...
|  cardinality=0, avgRowSize=0.0, numNodes=1
|  pushAggOp=NONE
```

关键字段说明：

- **Join 端**：`runtime filters: RF000[bloom] <- c_custkey[#0] (150000000/134217728/16777216)`
  表示生成编号 000 的 Bloom Filter，以 `c_custkey` 字段为输入，括号内三个数字与 Bloom Filter Size 计算相关，可暂时忽略。
- **Scan 端**：`runtime filters: RF000[bloom] -> o_custkey[#10]`
  表示 RF000 作用于 orders 表 Scan 节点，对 `o_custkey` 字段过滤。

#### 2. EXPLAIN SHAPE PLAN

```sql
mysql> explain shape plan select count(*) from orders join customer on o_custkey=c_custkey where c_nationkey=5;
+--------------------------------------------------------------------------------------------------------------------------+
Explain String(Nereids Planner)                                                                                            ｜
+--------------------------------------------------------------------------------------------------------------------------+
PhysicalResultSink                                                                                                         ｜
--hashAgg[GLOBAL]                                                                                                          ｜
----PhysicalDistribute[DistributionSpecGather]                                                                             ｜
------hashAgg[LOCAL]                                                                                                       ｜
--------PhysicalProject                                                                                                    ｜
----------hashJoin[INNER_JOIN shuffle]                                                                                     ｜
------------hashCondition=((orders.o_custkey=customer.c_custkey)) otherCondition=() buildRFs:RF0 c_custkey->[o_custkey]    ｜
--------------PhysicalProject                                                                                              ｜
----------------Physical0lapScan[orders] apply RFs: RF0                                                                    ｜
--------------PhysicalProject                                                                                              ｜
----------------filter((customer.c_nationkey=5))                                                                           ｜
------------------Physical0lapScan[customer]                                                                               ｜
+--------------------------------------------------------------------------------------------------------------------------+
11 rows in set (0.02 sec)
```

关键字段：

- **Join 端**：`buildRFs: RF0 c_custkey -> [o_custkey]` 表示以 `c_custkey` 为输入生成作用于 `o_custkey` 的 JRF，编号 0。
- **Scan 端**：`PhysicalOlapScan[orders] apply RFs: RF0` 表示 orders 表被 RF0 过滤。

#### 3. Profile

执行时 BE 会将 JRF 使用情况输出到 Profile（需 `set enable_profile=true`）。

**Join 端 Profile：**

```sql
HASH_JOIN_SINK_OPERATOR  (id=3  ,  nereids_id=367):(ExecTime:  703.905us)
    -  JoinType:  INNER_JOIN
    。。。
    -  BuildRows:  617
    。。。
    -  RuntimeFilterComputeTime:  70.741us
    -  RuntimeFilterInitTime:  10.882us
```

此例中生成 JRF 耗时 70.741us，输入 617 行；JRF 大小与类型由 Scan 端展示。

**Scan 端 Profile：**

```sql
OLAP_SCAN_OPERATOR  (id=2.  nereids_id=351.  table  name  =  orders(orders)):(ExecTime:  13.32ms)
              -  RuntimeFilters:  :  RuntimeFilter:  (id  =  0,  type  =  bloomfilter,  need_local_merge:  false,  is_broadcast:  true,  build_bf_cardinality:  false,
              。。。
              -  RuntimeFilterInfo:
                  -  filter  id  =  0  filtered:  714.761K  (714761)
                  -  filter  id  =  0  input:  747.862K  (747862)
              。。。
              -  WaitForRuntimeFilter:  6.317ms
            RuntimeFilter:  (id  =  0,  type  =  bloomfilter):
                  -  Info:  [IsPushDown  =  true,  RuntimeFilterState  =  READY,  HasRemoteTarget  =  false,  HasLocalTarget  =  true,  Ignored  =  false]
                  -  RealRuntimeFilterType:  bloomfilter
                  -  BloomFilterSize:  1024
```

需关注以下信息：

| 关注点 | 字段 | 含义 |
| --- | --- | --- |
| 过滤效果 | `filter id = 0 filtered / input` | Filtered 越大表明过滤效果越好 |
| 是否下推存储层 | `IsPushDown = true` | 下推后可触发延迟物化、减少 IO |
| 是否生效 | `RuntimeFilterState = READY` | 非 READY 表示 Scan 未等到 JRF |
| Filter 大小 | `BloomFilterSize: 1024` | Bloom Filter 字节数 |

### 调优

<!-- 知识类型：操作 -->
<!-- 适用场景：JRF 自适应失败时手动调整 -->

绝大多数情况下 JRF 是自适应的，无需手动调优。如确需调整，可使用以下 Session 变量：

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `runtime_filter_mode` | `GLOBAL` | 是否开启 JRF（`GLOBAL` 开启 / `OFF` 关闭） |
| `runtime_filter_type` | 2.1 版本默认 12 | 控制 JRF 类型枚举值之和 |
| `runtime_filter_wait_time_ms` | 1000 | Scan 等待 JRF 的最长毫秒数 |
| `enable_runtime_filter_prune` | `true` | 是否裁剪无过滤性的 JRF |

#### 1. 开关 JRF

- 打开：`set runtime_filter_mode = GLOBAL`
- 关闭：`set runtime_filter_mode = OFF`

#### 2. 设定 JRF 类型

`runtime_filter_type` 控制 JRF 类型枚举值，可叠加（求和）以同时生成多种类型：

| 类型 | 枚举值 |
| --- | --- |
| `IN` | 1 |
| `BLOOM` | 2 |
| `MIN_MAX` | 4 |
| `IN_OR_BLOOM` | 8 |

`IN_OR_BLOOM` 让 BE 根据实际行数自适应选择 IN 或 BLOOM。例如：

- `set runtime_filter_type = 6`：同时生成 BLOOM 与 MIN_MAX。
- 2.1 版本默认值 12（4 + 8）：同时生成 MIN_MAX 与 IN_OR_BLOOM。

#### 3. 设定等待时间

JRF 采用 Try-best 机制：Scan 启动前会等待 JRF；Doris 自动估算等待时间。某些情况下等待不足导致 JRF 未生效，Scan 输出行数会高于预期。

判断方法：Profile 中 Scan 节点 `RuntimeFilterState = NOT_READY`。

操作：

- 目的：延长 Scan 等待 JRF 的时间。
- 命令：`set runtime_filter_wait_time_ms = <毫秒>`
- 说明：默认 1000 毫秒。

#### 4. 裁剪 JRF

某些场景下 JRF 没有过滤性。例如 orders 与 customer 存在主外键关系且 customer 上无过滤条件，则 JRF 输入是全体 `custkey`，无法过滤 orders。优化器会基于列统计信息判断有效性并裁剪。

- 目的：开启/关闭 JRF 裁剪。
- 命令：`set enable_runtime_filter_prune = true|false`
- 说明：默认 `true`。

## TopN Runtime Filter

<!-- 知识类型：概念 + 原理 -->
<!-- 适用场景：包含 ORDER BY ... LIMIT 的 TopN 查询 -->

TopN Runtime Filter 在执行 `topN` 算子时根据当前堆顶值动态生成 Filter，提前裁剪 Scan 数据。

### 工作原理

Doris 以分块流式方式处理数据。当 SQL 包含 `topN` 时，Doris 不会计算所有结果，而是生成一个动态 Filter 提前过滤数据。

示例：

```sql
select o_orderkey from orders order by o_orderdate limit 5;
```

执行计划如下：

```sql
mysql> explain select o_orderkey from orders order by o_orderdate limit 5;
+-----------------------------------------------------+
| Explain String(Nereids Planner)                     |
+-----------------------------------------------------+
| PLAN FRAGMENT 0                                     |
|   OUTPUT EXPRS:                                     |
|     o_orderkey[#11]                                 |
|   PARTITION: UNPARTITIONED                          |
|                                                     |
|   HAS_COLO_PLAN_NODE: false                         |
|                                                     |
|   VRESULT SINK                                      |
|      MYSQL_PROTOCAL                                 |
|                                                     |
|   2:VMERGING-EXCHANGE                               |
|      offset: 0                                      |
|      limit: 5                                       |
|      final projections: o_orderkey[#9]              |
|      final project output tuple id: 2               |
|      distribute expr lists:                         |
|                                                     |
| PLAN FRAGMENT 1                                     |
|                                                     |
|   PARTITION: HASH_PARTITIONED: O_ORDERKEY[#0]       |
|                                                     |
|   HAS_COLO_PLAN_NODE: false                         |
|                                                     |
|   STREAM DATA SINK                                  |
|     EXCHANGE ID: 02                                 |
|     UNPARTITIONED                                   |
|                                                     |
|   1:VTOP-N(119)                                     |
|   |  order by: o_orderdate[#10] ASC                 |
|   |  TOPN OPT                                       |
|   |  offset: 0                                      |
|   |  limit: 5                                       |
|   |  distribute expr lists: O_ORDERKEY[#0]          |
|   |                                                 |
|   0:VOlapScanNode(113)                              |
|      TABLE: tpch.orders(orders), PREAGGREGATION: ON |
|      TOPN OPT:1                                     |
|      partitions=1/1 (orders)                        |
|      tablets=3/3, tabletList=135112,135114,135116   |
|      cardinality=150000, avgRowSize=0.0, numNodes=1 |
|      pushAggOp=NONE                                 |
+-----------------------------------------------------+
41 rows in set (0.06 sec)
```

执行流程：

1. 没有 TopN Filter 时，Scan 依次读入数据块给 TopN，TopN 通过堆排序维护当前 Top 5。
2. 一个数据 Block 约 1024 行；处理完第一个 Block 即可得到该 Block 的第 5 名。
3. 假设该值为 `1995-01-01`，则 Scan 输出第二个 Block 时，`o_orderdate > 1995-01-01` 的行无需再发送给 TopN。
4. 阈值会动态更新：若后续 Block 出现更小的 `o_orderdate`，TopN 会更新阈值。

### 查看 TopN Runtime Filter

通过 `EXPLAIN` 查看优化器规划的 TopN Runtime Filter：

```sql
1:VTOP-N(119)
| order by: o_orderdate[#10] ASC
| TOPN OPT
| offset: 0
| limit: 5
| distribute expr lists: O_ORDERKEY[#0]
|

0:VLapScanNode[113]
    TABLE: regression_test_nereids_tpch_p0.(orders), PREAGGREGATION: ON
    TOPN OPT: 1
    partitions=1/1 (orders)
    tablets=3/3, tabletList=135112,135114,135116
    cardinality=150000, avgRowSize=0.0, numNodes=1
    pushAggOp: NONE
```

关键字段：

- **TopN 节点**：显示 `TOPN OPT`，表示该 TopN 节点会产生 TopN Runtime Filter。
- **Scan 节点**：标注所用 TopN Runtime Filter 由哪个 TopN 节点产生。例如 `TOPN OPT: 1` 表示 orders 的 Scan 使用编号为 1 的 TopN 节点生成的 Runtime Filter。

作为分布式数据库，Doris 还会考虑 TopN 与 Scan 的物理位置。跨 BE 通信代价较高，因此 BE **自适应** 决定是否启用以及生效范围。当前实现为 **BE 级别** 的 TopN Runtime Filter（TopN 与 Scan 在同一 BE 内），仅依赖线程间通信，代价低。

### 调优

<!-- 知识类型：操作 -->
<!-- 适用场景：控制 TopN Runtime Filter 是否生成 -->

`limit` 越小，TopN Runtime Filter 过滤性越强。系统默认仅在 `limit` 小于表数据一半时启用。

| 变量 | 作用 |
| --- | --- |
| `topn_filter_ratio` | 控制是否生成 TopN Runtime Filter |

例如设置 `set topn_filter_ratio=0` 后，以下查询不会生成 TopN Runtime Filter：

```sql
select o_orderkey from orders order by o_orderdate limit 20;
```

## Runtime Filter 类型对比

<!-- 知识类型：对比 -->
<!-- 适用场景：快速选择适用方案 -->

| 维度 | Join Runtime Filter | TopN Runtime Filter |
| --- | --- | --- |
| 触发场景 | Join 查询 | `ORDER BY ... LIMIT` 查询 |
| 生成位置 | Join 节点 | TopN 节点 |
| 下推目标 | 左表 Scan | 同一 BE 的 Scan |
| 跨 BE | 支持（Global JRF 合并） | 不支持（仅 BE 内） |
| 自适应 | 是 | 是 |

## FAQ / Troubleshooting

<!-- 知识类型：故障排查 -->
<!-- 适用场景：JRF 未生效、过滤效果差 -->

**Q1：JRF 未生效，Scan 输出行数远高于预期？**
检查 Profile 中 `RuntimeFilterState`：若不为 `READY`，说明 Scan 等待超时。可调大 `runtime_filter_wait_time_ms`。

**Q2：JRF 已生成但 Filtered 行数很少？**
JRF 输入可能没有过滤性（如主外键 Join 且右表无过滤条件）。可保持 `enable_runtime_filter_prune = true` 让优化器自动裁剪，或检查右表是否缺少过滤条件。

**Q3：如何同时生成多种 JRF 类型？**
将 `runtime_filter_type` 设置为对应枚举值之和，例如 `set runtime_filter_type = 6` 同时生成 BLOOM 与 MIN_MAX。

**Q4：非等值 Join 能否使用 JRF？**
可以使用 Min-Max Filter；In Filter 与 Bloom Filter 仅支持等值 Join。

**Q5：TopN Runtime Filter 没有生成？**
检查 `topn_filter_ratio`：若为 0 则不生成。系统默认仅在 `limit` 小于表数据量一半时生成；放宽 `limit` 或调高 `topn_filter_ratio` 可触发。

**Q6：Bloom Filter 大小如何控制？**
通过 `RUNTIME_BLOOM_FILTER_MIN_SIZE` 与 `RUNTIME_BLOOM_FILTER_MAX_SIZE` 限制最小/最大字节数，需在过滤精度与代价间权衡。
