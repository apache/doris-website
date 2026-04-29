---
{
    "title": "分区裁剪优化扫表：Doris 查询性能调优",
    "language": "zh-CN",
    "description": "如何使用 Doris 分区裁剪（Partition Pruning）减少扫描数据量、加速查询？本文通过示例讲解原理、SQL 写法与 EXPLAIN 验证方法。",
    "keywords": ["Doris 分区裁剪", "Partition Pruning", "扫表优化", "查询性能调优", "EXPLAIN 分区"]
}
---

<!-- 知识类型：调优指南 -->
<!-- 适用场景：大表查询慢、I/O 开销高、需按分区列过滤数据 -->

## 概述

<!-- 知识类型：概念定义 -->
<!-- 适用场景：理解分区裁剪原理 -->

**分区裁剪（Partition Pruning）** 是一种查询优化技术：根据查询条件智能识别相关分区，仅扫描这些分区，跳过无关分区。

Doris 通过分区裁剪可显著减少 I/O 与计算量，加速大表查询。

**适用 Checklist**：

-   [ ] 表已按业务列（如日期）做分区
-   [ ] 查询条件包含分区列过滤（如 `WHERE date BETWEEN ...`）
-   [ ] 希望减少扫描分区数、降低 I/O
-   [ ] 需通过 `EXPLAIN` 验证裁剪是否生效

## 案例：按日期分区的销售表

<!-- 知识类型：操作示例 -->
<!-- 适用场景：日期范围查询、时序数据分析 -->

下面通过一个实际案例演示 Doris 的分区裁剪功能。

### 1. 建表：按日期 Range 分区

**目的**：创建按日期分区的销售数据表 `sales`，每月一个分区。

**命令**：

```sql
CREATE TABLE sales (
    date DATE,
    product VARCHAR(50),
    amount DECIMAL(10, 2)
)
PARTITION BY RANGE(date) (
    PARTITION p1 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2 VALUES LESS THAN ('2023-02-01'),
    PARTITION p3 VALUES LESS THAN ('2023-03-01'),
    PARTITION p4 VALUES LESS THAN ('2023-04-01')
)
DISTRIBUTED BY HASH(date) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

**说明**：分区列为 `date`，共 4 个分区，每个分区覆盖一个月的数据。

### 2. 查询：带分区列过滤条件

**目的**：查询 2023 年 1 月 15 日至 2 月 15 日之间的销售总额。

**命令**：

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**说明**：`WHERE` 子句中包含分区列 `date` 的范围过滤，是触发分区裁剪的关键。

### 3. 分区裁剪执行过程

| 步骤 | Doris 行为 | 结果 |
| :--- | :--- | :--- |
| 1 | 分析查询条件中的分区列 `date` | 识别日期范围 `2023-01-15` ~ `2023-02-15` |
| 2 | 比较查询条件与分区定义 | 命中分区 `p2`、`p3` |
| 3 | 自动跳过无关分区 | 跳过 `p1`、`p4` |
| 4 | 仅在命中分区中执行扫描与聚合 | 快速返回结果 |

### 4. 通过 EXPLAIN 验证裁剪生效

<!-- 知识类型：验证方法 -->
<!-- 适用场景：确认优化是否生效 -->

**目的**：使用 `EXPLAIN` 命令查看执行计划，确认实际扫描的分区数。

**命令**：

```sql
EXPLAIN SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**关键输出**：

```text
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```

**说明**：`OlapScanNode` 节点的 `partitions=2/4 (p2,p3)` 表示总共 4 个分区中只扫描了 2 个（`p2` 与 `p3`），分区裁剪已生效。

## 生效与未生效对比

<!-- 知识类型：对比表格 -->
<!-- 适用场景：快速判断查询是否能享受裁剪优化 -->

| 维度 | 分区裁剪生效 | 分区裁剪未生效 |
| :--- | :--- | :--- |
| 查询条件 | 包含分区列过滤 | 缺少分区列条件，或对分区列做了函数计算 |
| 扫描分区数 | 仅扫描命中分区 | 扫描全部分区 |
| I/O 开销 | 低 | 高 |
| EXPLAIN 输出 | `partitions=N/M`（N < M） | `partitions=M/M` |

## FAQ / Troubleshooting

<!-- 知识类型：常见问题 -->
<!-- 适用场景：裁剪未生效排查 -->

**Q1：查询慢，怀疑分区裁剪未生效，如何确认？**

执行 `EXPLAIN <query>`，查看 `OlapScanNode` 的 `partitions=N/M` 字段。若 `N == M`，说明扫描了所有分区，裁剪未生效。

**Q2：为什么 `WHERE` 包含分区列还是扫描全部分区？**

常见原因：

-   对分区列使用了函数（如 `DATE_FORMAT(date, ...)`），导致优化器无法推导范围。
-   类型不匹配（如分区列为 `DATE`，过滤值为字符串且无法隐式转换）。
-   使用了 `OR` 连接非分区列条件，导致条件无法下推。

**Q3：分区裁剪与分桶裁剪有什么区别？**

-   **分区裁剪（Partition Pruning）**：基于 `PARTITION BY` 列裁剪分区。
-   **分桶裁剪（Bucket Pruning / Tablet Pruning）**：基于 `DISTRIBUTED BY HASH` 列等值条件裁剪 tablet。
两者可叠加使用，进一步减少扫描数据量。

## 总结

<!-- 知识类型：要点回顾 -->
<!-- 适用场景：方案落地建议 -->

-   分区裁剪自动识别查询条件与分区映射，仅扫描必要分区。
-   关键前置条件：表按业务列分区，且查询包含分区列的可下推过滤条件。
-   通过 `EXPLAIN` 的 `partitions=N/M` 字段可快速验证裁剪是否生效。
-   合理利用分区裁剪，可显著降低 I/O 与计算开销，加速海量数据查询。
