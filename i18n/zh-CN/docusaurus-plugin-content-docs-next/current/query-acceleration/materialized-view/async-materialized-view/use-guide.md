---
{
    "title": "异步物化视图最佳实践",
    "language": "zh-CN",
    "description": "异步物化视图什么时候适合用？如何选择刷新策略？如何落地构建？本文给出场景判断、使用原则、刷新策略选择、构建实践与运维注意点。",
    "keywords": ["异步物化视图", "使用建议", "最佳实践", "刷新策略", "分区物化视图", "透明改写", "数据分层建模", "Doris"],
}
---

<!-- 知识类型：使用指南 / 最佳实践 -->
<!-- 适用场景：查询加速、ETL 数据建模、湖仓联邦查询、写入优化 -->

异步物化视图通过预先计算并存储查询结果来加速查询，但每次刷新都会带来一定的计算与 IO 开销。本文从**场景判断 → 使用原则 → 刷新策略选择 → 落地实践 → 运维注意点**的顺序，帮助 DBA 与开发者构建高效的异步物化视图。

物化视图的刷新原理参考：[刷新原理](../overview.md)。

## 快速决策清单

在创建异步物化视图前，请按以下清单评估：

- 查询是否包含多表 JOIN、复杂聚合或窗口函数？
- 基表数据更新频率是否较低（不建议每分钟多次更新）？
- 业务能否容忍分钟级及以上的数据延迟（无需 1~5 分钟内的实时数据）？
- 基表数据量是否足够大（远大于几百行）？
- 是否能将常见查询 SQL 模式分组、组间无重合？
- 基表是否为分区表，是否能构建分区物化视图？
- 是否有足够资源用于周期性刷新？
- 是否能定期检查物化视图使用状态，及时清理无用视图？

如果以上问题大多数回答**是**，则适合使用异步物化视图。

---

## 一、使用场景判断

<!-- 知识类型：场景判断 -->

下表汇总了**推荐**与**不推荐**使用异步物化视图的典型场景，便于快速对照。

### 场景速查表

| 类别 | 场景 | 关键特征 | 是否推荐 |
|---|---|---|---|
| 查询复杂度 | 复杂聚合查询 | 多表 JOIN、SUM/AVG/COUNT、窗口函数 | 推荐 |
| 报表 | 一致性快照报表 | 固定时间点（如每日午夜）生成 | 推荐 |
| 计算密集 | 计算密集型分析 | 复杂数学计算、数据转换、预测模型 | 推荐 |
| 数仓建模 | 星型 / 雪花模式 | 事实表 + 多维度表 JOIN | 推荐 |
| 湖仓 | 湖仓加速 | 数据湖查询受网络与对象存储吞吐限制 | 推荐 |
| 数仓分层 | ETL 分层加工 | 基表为原始数据，需多层加工 | 推荐 |
| 数据更新 | 基表频繁更新 | 每分钟多次更新 | 不推荐 |
| 查询复杂度 | 简单查询 | 单表扫描或简单过滤 | 不推荐 |
| 时效性 | 准实时（1~5 分钟内）数据 | 业务要求数据始终最新 | 不推荐 |
| 数据规模 | 源表数据量很小 | 仅几百行 | 不推荐 |

### 推荐使用场景

#### 复杂聚合查询

- **场景描述**：包含多表连接、复杂聚合函数（如 SUM、AVG、COUNT）或窗口函数的查询。
- **优势**：避免每次执行时重新计算复杂逻辑。

#### 报表

- **场景描述**：需要按固定时间点（如每日午夜）生成一致性快照的报表。
- **优势**：确保所有用户看到相同时间点的数据。

#### 计算密集型分析

- **场景描述**：包含复杂数学计算或数据转换的分析查询，如客户生命周期价值计算、预测分析模型。
- **优势**：预先计算结果，减少运行时资源消耗。

#### 数据仓库中的星型 / 雪花模式

- **场景描述**：事实表与多个维度表连接的场景，如销售事实表与产品、时间、地区等维度表的连接。
- **优势**：预先物化连接结果，加速分析查询。

#### 湖仓加速

- **场景描述**：查询数据湖可能由于网络延迟和对象存储的吞吐限制而变慢。
- **优势**：利用 Doris 本地存储加速优势，加速数据湖分析。

#### 数仓分层

- **场景描述**：基表中包含大量原始数据，查询需要进行复杂的 ETL 操作。
- **优势**：对数据建立多层异步物化视图实现数仓分层。

### 不推荐使用场景

#### 基表频繁更新

- **场景描述**：源表数据变更非常频繁（如每分钟多次更新）。
- **问题**：异步物化视图难以保持同步，刷新成本过高，需要考虑定期刷新。

#### 简单查询

- **场景描述**：仅涉及单表扫描或简单过滤的查询。
- **问题**：异步物化视图带来的收益无法抵消刷新成本。

#### 需要实时（1~5 分钟内）数据的场景

- **场景描述**：业务要求数据必须是最新版本。
- **问题**：异步物化视图存在数据延迟。

#### 源表数据量很小

- **场景描述**：基表只有少量记录（如几百行）。
- **问题**：异步物化视图优化效果不明显。

---

## 二、使用原则

<!-- 知识类型：原则与约束 -->

### 2.1 何时使用异步物化视图

| 维度 | 说明 |
| --- | --- |
| 时效性 | 适用于对数据时效性要求不高的场景（如 T+1 数据），高时效性需求请使用同步物化视图 |
| 加速效果与一致性 | 应将常见查询 SQL 模式分组，组间尽量无重合；分组越清晰，构建质量越高 |
| 复用性 | 一个查询可使用多个物化视图，一个物化视图也可被多个查询使用 |
| 综合权衡 | 综合考虑命中物化视图的响应时间（加速效果）、构建成本、数据一致性要求 |

### 2.2 物化视图定义与构建成本权衡

- **定义贴近原查询**：查询加速效果好，但通用性和复用性差，构建成本高。
- **定义更通用**（如不带 WHERE 条件、聚合维度更多）：加速效果较低，但通用性和复用性好，构建成本低。

:::caution 注意

- **物化视图数量控制**：物化视图并非越多越好。构建和刷新需要资源，参与透明改写时 CBO 选择最优物化视图也需要时间。理论上，物化视图越多，透明改写时间越长。
- **定期检查使用状态**：未使用的物化视图应及时删除。
- **基表数据更新频率**：基表频繁更新会导致物化视图频繁失效，无法用于透明改写（仍可直查）。如需在此场景下使用透明改写，需允许查询数据存在一定时延，可设置 `grace_period`，详情参见 `grace_period` 适用介绍。

:::

---

## 三、刷新方式选择

<!-- 知识类型：决策指南 -->

异步物化视图提供 **手动刷新**、**定时刷新**、**触发式刷新** 三种主要策略。合理选择刷新策略对于平衡数据新鲜度和系统性能至关重要。

### 3.1 优先选择分区物化视图

当同时满足以下条件时，建议创建分区物化视图：

1. 物化视图的基表数据量很大，且基表为分区表。
2. 物化视图引用的非分区表不经常变化。
3. 物化视图的定义 SQL 和分区字段满足分区推导要求（即符合分区增量更新要求）。详细要求参考：[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#可选参数)。
4. 物化视图分区数不多。分区过多会导致构建时间过长。

> 当物化视图的部分分区失效时，透明改写仍可使用有效分区 UNION ALL 基表来返回数据。

如果不能构建分区物化视图，可考虑选择**全量刷新**的物化视图。

### 3.2 三种刷新策略对比

| 刷新策略 | 触发方式 | 数据新鲜度 | 自动化程度 | 主要风险 |
|---|---|---|---|---|
| 手动刷新 | 用户显式命令或外部调度 | 低，取决于调度 | 低 | 调度需自行管理 |
| 定时刷新 | 按固定时间间隔（最小分钟级） | 中，确定性延迟 | 中 | 高频会持续占用资源 |
| 触发式刷新 | 基表数据变更时自动触发 | 高 | 高 | 可能造成刷新风暴 |

### 3.3 刷新策略详解

#### 手动刷新

- **工作方式**：由用户通过显式命令或外部系统调度触发。
- **适用场景**：
    - 对数据实时性要求不高的报表系统
    - 数据仓库中的历史数据分析
    - 需要与特定业务流程同步刷新的场景
    - 大规模数据刷新需要协调系统资源时
- **优点**：完全控制刷新时机，可避开业务高峰期。
- **缺点**：需要额外管理刷新调度，需要做好容错，避免外部循环不断地刷新。

#### 定时刷新

- **工作方式**：
    - 按固定时间间隔自动刷新
    - 最小时间单位为分钟级
    - 可指定第一次运行任务的开始时间
- **适用场景**：
    - 周期性业务指标监控
    - 阶梯式数据管道
    - 时间敏感度分级的报表体系
    - 有规律波动的源数据
- **优点**：定时数据处理，确定性的数据延迟。
- **缺点**：数据新鲜度局限，相关视图的刷新时序需要人工编排。
- **配置约束**：不建议将所有物化视图设置为高频定时刷新以达到类实时的目的，这会导致：
    - 系统资源持续被占用
    - 刷新作业相互竞争资源
    - 频繁增删 partition / tablet 等，对 BE 造成较大压力

#### 触发式刷新

- **工作方式**：当基表数据变更时自动触发刷新。
- **适用场景**：
    - 多层物化视图架构的上层视图
    - 基表变更频率较低的场景
- **优点**：数据新鲜度高，自动化程度高。
- **缺点**：可能造成刷新风暴，难以预测系统负载。
- **配置约束**：不建议对基础层物化视图使用触发式刷新，除非：
    - 能明确知道基表刷新频率不高（如：几十分钟变更一次）

### 3.4 刷新策略组合建议

#### 按数仓分层

| 视图层级 | 推荐刷新策略 |
|---|---|
| 基础层 | 定时刷新（如每小时） |
| 中间层 | 定时刷新或触发式刷新 |
| 展示层 | 触发式刷新或手动刷新 |

#### 按业务关键性

| 业务级别 | 推荐策略 |
|---|---|
| 关键实时业务数据 | 不建议使用异步物化视图 |
| 常规分析数据 | 定时刷新（每日 / 每小时） |
| 历史 / 归档数据 | 手动刷新 |

#### 按数据变更频率

| 变更频率 | 推荐策略 |
|---|---|
| 高频变更 | 定时刷新（较长间隔）或手动刷新 |
| 低频变更 | 触发式刷新或短间隔定时刷新 |
| 批量变更 | 变更后手动刷新 |

### 3.5 刷新频率建议

以下为通用建议，实际还需根据系统资源、异步物化视图数量、其它业务资源占用等情况综合评估。

| 实际刷新耗时 | 建议刷新频率 |
|---|---|
| 小于 15 秒 | 大于等于 5 分钟 |
| 小于 10 分钟 | 大于等于 1 小时 |
| 小于 1 小时 | 大于等于 1 天 |

---

## 四、分区物化视图实践

<!-- 适用场景：基表为大数据量分区表 -->

### 4.1 分区映射关系

物化视图的分区跟随基表分区映射创建，一般与基表分区为 1:1 或 1:n 关系。分区推导的详细要求请参考 [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#可选参数) 和 [异步物化视图 FAQ Q12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12构建分区物化视图报错)。

### 4.2 分区失效与刷新行为

| 触发情况 | 影响 | 应对方式 |
| --- | --- | --- |
| 基表的分区数据变更（新增、删除等） | 物化视图对应分区失效；失效分区不能用于透明改写，但可直查；透明改写时失效分区会联合基表响应查询 | 通过 `SHOW PARTITIONS FROM mv_name` 查看分区状态 |
| 引用的非分区表数据变更 | 触发物化视图所有分区失效，无法用于透明改写 | 执行 `REFRESH MATERIALIZED VIEW mv1 AUTO;` 刷新所有数据变化的分区 |
| 引用的非分区表只新增、不修改数据 | 默认会使所有分区失效 | 创建时指定 `excluded_trigger_tables = '非分区表名1,非分区表名2'`，下次刷新时仅刷新分区表对应的失效分区 |

> **设计建议**：将数据频繁变化的表放在分区物化视图引用的分区表，将不经常变化的维表放在非引用分区表的位置。

### 4.3 分区粒度透明改写

分区物化视图的透明改写是**分区粒度**的：

- 即使物化视图部分分区失效，仍可用于透明改写。
- 但如果只查询了一个分区，且该分区数据失效，则该物化视图无法用于此次透明改写。

### 4.4 完整示例

**目的**：构建一个按"天"粒度的分区物化视图，加速按天聚合的查询。

**步骤 1**：创建按天分区的基表 `lineitem`，并准备维表 `partsupp`。

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL, 
    l_partkey INTEGER NOT NULL, 
    l_suppkey INTEGER NOT NULL, 
    l_linenumber INTEGER NOT NULL, 
    l_ordertime DATETIME NOT NULL, 
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
) PARTITION BY RANGE(l_ordertime) (
    FROM 
      ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES      
(1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
(1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
(2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy'),

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES     
(2, 3, 9, 10.01, 'supply1'),     
(4, 3, 9, 10.01, 'supply2'),     
(5, 6, 9, 10.01, 'supply3'),     
(6, 5, 10, 11.01, 'supply4');
```

**步骤 2**：典型按天聚合的查询语句。

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```

**步骤 3**：构建按天分区的物化视图，分区粒度与基表保持一致，并按天聚合数据。

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

### 4.5 只保留最近分区数据

:::tip 提示
该功能自 Apache Doris 2.1.1 版本起支持。
:::

物化视图可以只保留最近若干个分区的数据，每次刷新时自动删除过期分区数据。通过设置以下属性实现：

| 属性 | 说明 |
| --- | --- |
| `partition_sync_limit` | 基表分区字段为时间时，配置同步基表的分区范围（与 `partition_sync_time_unit` 配合使用）。例如设置为 `3`、单位为 `DAY`，表示仅同步基表近 3 天的分区和数据 |
| `partition_sync_time_unit` | 分区刷新的时间单位，支持 `DAY` / `MONTH` / `YEAR`，默认 `DAY` |
| `partition_date_format` | 当基表分区字段为字符串时，使用 `partition_sync_limit` 能力时所需的日期格式 |

下例物化视图只保留最近 3 天的数据。如果近 3 天没有数据，直查该物化视图将不会返回数据。

```sql
CREATE MATERIALIZED VIEW latest_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
PROPERTIES (
  "partition_sync_limit" = "3", 
  "partition_sync_time_unit" = "DAY", 
  "partition_date_format" = "yyyy-MM-dd"
)       
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

---

## 五、如何使用物化视图加速查询

<!-- 知识类型：操作类指南 -->

### 5.1 总体思路

使用物化视图加速查询，请按以下步骤操作：

1. 查看 profile 文件，找到查询中消耗时间最多的操作。瓶颈通常出现在：连接（Join）、聚合（Aggregate）、过滤（Filter）、表达式计算（Calculated Expressions）。
2. 针对瓶颈算子构建相应的物化视图。例如 Join 占用大量计算资源、Aggregate 占用相对较小，应针对 Join 构建物化视图。

### 5.2 针对四类操作的构建建议

#### 5.2.1 针对 Join

- 提取查询中使用的公共表连接模式构建物化视图，命中后可节省 Join 计算。
- **去除查询中的 Filters**，可获得更通用的 Join 物化视图。

#### 5.2.2 针对 Aggregate

- 尽量使用**低基数字段**作为维度构建物化视图，使聚合后数据量尽量减少。
- 物化视图聚合粒度需比查询更细（即物化视图聚合维度包含查询的聚合维度），物化视图的聚合函数也应包含查询的聚合函数。

**基数评估示例**：

- 表 `t1` 数据量 1,000,000 行，查询包含 `GROUP BY a, b, c`：
    - 若 a、b、c 基数分别为 100、50、15，则聚合后约 75,000 行，**物化视图有效**。
    - 若 a、b、c 存在相关性，聚合后数据量会进一步减少。
    - 若 c 基数为 3,500，则聚合后约 17,000,000 行，比原表更大，**不适合构建物化视图**。

#### 5.2.3 针对 Filter

- 若查询经常对相同字段进行过滤，可在物化视图中加入相应 Filter，减少物化视图数据量。
- **物化视图的 Filter 应少于查询**，且查询的 Filter 包含物化视图的 Filter。

例如查询为 `a > 10 AND b > 5`：

- 物化视图可以无 Filter；
- 也可以是 `a > 5 AND b > 5`、`a > 5` 等数据范围更大的 Filter。

#### 5.2.4 针对 Calculated Expressions

- 对 `CASE WHEN`、字符串处理等高消耗表达式进行预计算，可显著提升查询性能。
- 单个物化视图的列数量不宜过多，应根据查询 SQL 模式分组，分别构建对应的物化视图。

**聚合查询加速完整示例**：

查询 1：

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_partkey;
```

查询 2：

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey;
```

针对上述查询，可构建一个更通用的聚合物化视图：将 `l_partkey` 和 `l_suppkey` 都作为聚合维度，并将 `o_orderdate` 作为过滤条件。注意：`o_orderdate` 不仅在物化视图条件补偿中使用，也需要包含在聚合维度中。这样查询 1 和查询 2 都可以命中该物化视图：

```sql
CREATE MATERIALIZED VIEW common_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate;
```

---

## 六、典型使用场景

<!-- 知识类型：场景示例 -->

### 6.1 场景一：查询加速

**适用场景**：BI 报表场景或其他对查询响应时间敏感的场景，要求秒级返回结果。多表 Join 后再聚合的查询会消耗大量计算资源，难以保证时效性。异步物化视图既支持直查，也支持透明改写——优化器会依据改写算法和代价模型自动选择最优物化视图。

#### 用例 1：多表连接聚合查询加速

通过构建更通用的物化视图加速多表连接聚合查询。

**目标**：以下三个查询，构建一个统一的物化视图同时满足。

查询 1：

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount)
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01';
```

查询 2：

```sql
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

查询 3：

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**构建方案 1**：通用 Join 物化视图。去除查询 1、2 的过滤条件，并预计算 `l_extendedprice * (1 - l_discount)`：

```sql
CREATE MATERIALIZED VIEW common_join_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**构建方案 2**：若上述物化视图无法满足查询 2 的加速性能要求，可额外构建聚合物化视图，去除对 `o_orderdate` 的过滤条件以保持通用性：

```sql
CREATE MATERIALIZED VIEW target_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
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
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

#### 用例 2：日志查询加速

**适用场景**：基表通常按小时分区，单表聚合查询，过滤条件多为时间和标识位。响应速度不达标时，可结合**异步物化视图与同步物化视图**联合使用。

**步骤 1**：基表定义。

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT '标识', 
`event_id` VARCHAR(128) NULL COMMENT '标识', 
`decision` VARCHAR(32) NULL COMMENT '枚举值', 
`time` DATETIME NULL COMMENT '查询时间', 
`id` VARCHAR(35) NOT NULL COMMENT 'od', 
`code` VARCHAR(64) NULL COMMENT '标识', 
`event_type` VARCHAR(32) NULL COMMENT '事件类型' 
)
DUPLICATE KEY(app_name, event_id)
PARTITION BY RANGE(time)                                    
(                                                                                                                                      
    FROM ("2024-07-01 00:00:00") TO ("2024-07-15 00:00:00") INTERVAL 1 HOUR                                                                     
)     
DISTRIBUTED BY HASH(event_id)
BUCKETS 3;
```

**步骤 2**：构建按分钟聚合的物化视图，达到一定的聚合效果。

```sql
CREATE MATERIALIZED VIEW sync_mv
AS
SELECT 
  decision,
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  DATE_FORMAT(
    `time`, '%Y-%m-%d'
  ), 
  cast(FLOOR(MINUTE(time) / 15) AS decimal(9, 0)),
  count(id) AS cnt
FROM 
  test 
GROUP BY 
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  decision, 
  DATE_FORMAT(time, '%Y-%m-%d'), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

**步骤 3**：典型查询语句。

```sql
SELECT 
    decision, 
    CONCAT(
        CONCAT(
          DATE_FORMAT(
            `time`, '%Y-%m-%d'
          ), 
          '', 
          LPAD(
            cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) AS time, 
      count(id) AS cnt 
FROM 
  test 
WHERE 
  date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
  AND '2024-07-03 20:00:00' 
GROUP BY 
  decision, 
  DATE_FORMAT(
    `time`, "%Y-%m-%d"
  ), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

### 6.2 场景二：数据建模（ETL）

**适用场景**：数据分析常需对多表进行连接和聚合，存在复杂且重复的查询，导致延迟高、资源消耗大。利用异步物化视图构建数据分层模型，可在已有物化视图基础上创建更高层级物化视图（2.1.3 起支持）。

**不同层级的触发方式选择**：

- 第一层定时刷新 + 第二层触发刷新：第一层刷新完成后自动触发第二层刷新。
- 每层均为定时刷新：第二层刷新时不考虑第一层是否与基表同步，仅将第一层数据加工同步到第二层。

下面以 TPC-H 数据集为例，分析每月各地区和国家的订单数量与利润。

**原始查询（未使用物化视图）**：

```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') AS month,
count(distinct o.o_orderkey) AS order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) AS revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```

**步骤 1**：构建 DWD 层（明细数据）——订单明细宽表。

```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name AS nation_name,
r.r_name AS region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
FROM orders o
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
JOIN lineitem l ON o.o_orderkey = l.l_orderkey;
```

**步骤 2**：构建 DWS 层（汇总数据）——每日订单汇总。

```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
date_trunc(o_orderdate, 'month') AS month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) AS order_count,
sum(l_extendedprice * (1 - l_discount)) AS net_revenue
FROM dwd_order_detail
GROUP BY
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```

**步骤 3**：使用物化视图优化查询。

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) AS revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```

### 6.3 场景三：湖仓一体联邦数据查询

**适用场景**：现代化数据架构中，企业常采用湖仓一体设计以平衡存储成本与查询性能。该架构存在两大挑战：

- **查询性能受限**：频繁查询数据湖时受网络延迟和第三方服务影响，导致查询延迟。
- **数据分层建模复杂**：从数据湖到实时数仓的流转和转换通常需要复杂的 ETL，维护成本高。

**Doris 异步物化视图的应对**：

- **透明改写加速查询**：将常用数据湖查询结果物化到 Doris 内部存储，通过透明改写提升查询性能。
- **简化分层建模**：支持基于数据湖中的表创建物化视图，便捷实现数据湖到实时数仓的转换。

下面以 Hive 为例说明。

**步骤 1**：基于 Hive 创建 Catalog（使用 TPC-H 数据集）。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store 地址
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

**步骤 2**：基于 Hive Catalog 创建物化视图。

```sql
-- 物化视图只能在 internal 的 catalog 上创建，切换到内部 catalog
SWITCH internal;
CREATE DATABASE hive_mv_db;
USE hive_mv_db;

CREATE MATERIALIZED VIEW external_hive_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 12
AS
SELECT
n_name,
o_orderdate,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
GROUP BY
n_name,
o_orderdate;
```

**步骤 3**：运行查询，通过透明改写自动使用物化视图加速。

```sql
SELECT
n_name,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
AND o_orderdate >= DATE '1994-01-01'
AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
GROUP BY
n_name
ORDER BY
revenue DESC;
```

:::tip 提示

Doris 暂无法感知除 Hive 外其他外表的数据变更。当外表数据不一致时，使用物化视图可能出现数据不一致情况。

**外表透明改写开关**（默认 `false`）：参与透明改写的物化视图是否允许包含外表。如可接受数据不一致或可通过定时刷新保证一致性，可开启：

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

**改写未被选择的排查**：若物化视图处于 `MaterializedViewRewriteSuccessButNotChose` 状态，说明改写成功但 plan 未被 CBO 选择，可能因外表统计信息不完整。

启用从文件中获取行数：

```sql
SET enable_get_row_count_from_file_list = true;
```

查看外表统计信息以确认是否已收集完整：

```sql
SHOW TABLE STATS external_table_name;
```

:::

### 6.4 场景四：提升写入效率，减少资源竞争

**适用场景**：高吞吐数据写入场景，需保证系统性能稳定与数据处理高效。通过异步物化视图灵活的刷新策略，可降低写入压力、避免资源争抢。

基表数据变更时不会立即触发物化视图刷新，延迟刷新有利于降低资源压力，避免写入资源争抢。

**示例**：定时刷新策略，每 2 小时刷新一次。当 `orders` 与 `lineitem` 导入数据时，不会立即触发物化视图刷新。

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 透明改写提升导入效率

透明改写不仅能加速查询，也能改写导入 SQL，从而提升导入效率。从 **2.1.6 版本**开始，当物化视图与基表数据强一致时，可对 DML 操作（如 `INSERT INTO` 或 `INSERT OVERWRITE`）进行透明改写，对数据导入场景性能提升显著。

**步骤 1**：创建 `INSERT INTO` 数据的目标表。

```sql
CREATE TABLE IF NOT EXISTS target_table  (
orderdate      DATE NOT NULL,
shippriority   INTEGER NOT NULL,
linestatus     CHAR(1) NOT NULL,
sale           DECIMALV3(15,2) NOT NULL
)
DUPLICATE KEY(orderdate, shippriority)
DISTRIBUTED BY HASH(shippriority) BUCKETS 3;
```

**步骤 2**：创建 `common_schedule_join_mv` 物化视图。

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**步骤 3**：未经改写的导入语句。

```sql
INSERT INTO target_table
SELECT
o_orderdate,
o_shippriority,
l_linestatus,
l_extendedprice * (1 - l_discount)
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**步骤 4**：经过透明改写后的等价语句。

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

:::caution 注意

如果 DML 操作的是无法感知数据变更的外表，透明改写可能导致基表最新数据无法实时导入目标表。如可接受数据不一致或自行保证数据一致性，可打开如下开关。

DML 时，当物化视图存在无法实时感知数据的外表时，是否开启基于结构信息的物化视图透明改写（默认关闭）：

```sql
SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;
```

:::

---

## 七、运维注意点

<!-- 知识类型：运维建议 -->

异步物化视图本质上是增强的 ETL 计算，需要持续维护。以下三点是日常运维的关键。

1. **监控**：物化视图运行后要通过 [metrics](../../../admin-manual/maint-monitor/metrics.md) 及时监控系统运行情况。后续异步物化视图自身也会暴露更多的监控指标，目前可通过 [tasks](../../../sql-manual/sql-functions/table-valued-functions/tasks.md) 查看任务数量、执行状态、任务耗时等信息。
2. **规划**：要规划物化视图的运行个数、运行频率以及集群的最大计算量。切记不要"只管建物化视图，不维护物化视图"——物化视图本质上是增强的 ETL 计算，和传统 ETL 一样需要维护。
3. **资源隔离**：物化视图是数据计算任务，需要按需做好资源隔离。

---

## 常见问题

**Q1：异步物化视图能否完全替代实时查询？**

不能。异步物化视图存在数据延迟（取决于刷新策略），不适用于要求 1~5 分钟以内数据新鲜度的场景。高时效性场景请考虑同步物化视图。

**Q2：是否可以把所有物化视图都设置为高频定时刷新来逼近实时？**

不建议。这会导致系统资源持续被占用、刷新作业相互竞争、频繁增删 partition / tablet 对 BE 造成较大压力。

**Q3：如何选择刷新策略？**

参考 [三种刷新策略对比](#32-三种刷新策略对比) 与 [刷新策略组合建议](#34-刷新策略组合建议)，按数仓分层、业务关键性或数据变更频率进行匹配。优先评估是否能构建[分区物化视图](#31-优先选择分区物化视图)。

**Q4：物化视图建好后还需要维护吗？**

需要。物化视图本质上是增强的 ETL 计算，需要监控、规划与资源隔离，详见 [运维注意点](#七运维注意点)。

**Q5：基表频繁更新还能用透明改写吗？**

基表频繁更新会导致物化视图频繁失效，无法用于透明改写（仍可直查）。如需在此场景下使用透明改写，需允许查询数据存在一定时延，可设置 `grace_period`。
