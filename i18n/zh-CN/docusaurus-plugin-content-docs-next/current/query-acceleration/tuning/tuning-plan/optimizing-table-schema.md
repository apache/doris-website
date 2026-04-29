---
{
    "title": "优化表 Schema 设计：表模型、分桶列、Key 列与字段类型调优",
    "language": "zh-CN",
    "description": "如何通过表模型选择、分桶列设计、Key 列与字段类型优化 Doris 表 Schema？本文从典型场景出发给出可落地的调优建议。",
    "keywords": ["Doris Schema 设计", "Doris 表模型", "分桶列优化", "Key 列优化", "字段类型优化", "数据倾斜", "Doris 性能调优"]
}
---

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：建表前的 Schema 设计与查询性能调优 -->

## 概述

表 Schema 设计是 Doris 性能调优的关键环节，直接影响数据分布、查询并行度与排序效率。

不合理的 Schema 设计常导致以下问题：

-   数据倾斜，查询并行度无法充分利用
-   排序特性失效，等值/范围查询变慢
-   字段类型选择不当，计算开销升高

更详细的设计原则可参考 [数据表设计](../../../table-design/overview.md) 章节。本章从实际案例出发，展示典型 Schema 设计问题及调优建议。

### 调优 Checklist

在设计或排查表 Schema 时，建议依次检查以下项：

-   [ ] 是否选择了与业务匹配的表模型（Duplicate / Unique / Aggregate）？
-   [ ] 分桶列是否散列均匀，无 null 或固定值倾斜？
-   [ ] 高频等值/范围查询列是否定义为 Key 列？
-   [ ] 字段类型是否遵循「定长优先、低精优先」原则？

## 案例 1：表模型选择

<!-- 知识类型：概念对比 -->
<!-- 适用场景：建表前选型 -->

**一句话定义**：Doris 提供 Duplicate、Unique（MOR/MOW）、Aggregate 三种表模型，查询性能与功能特性各不相同。

### 三种表模型对比

| 表模型             | 查询性能 | 是否支持更新 | 典型场景                        |
| ------------------ | -------- | ------------ | ------------------------------- |
| Duplicate          | 最高     | 不支持       | 日志、明细数据的高性能查询      |
| Unique（MOW）      | 较高     | 支持         | 需主键去重、对查询性能要求较高  |
| Unique（MOR）      | 一般     | 支持         | 需主键去重，写入频繁            |
| Aggregate          | 一般     | 聚合更新     | 预聚合报表、指标汇总            |

> 性能排序：Duplicate > MOW > MOR ≈ Aggregate

:::tip 优化建议

业务无数据更新需求且对查询性能要求高时，优先使用 [Duplicate 表](../../../table-design/data-model/duplicate.md)。

:::

## 案例 2：分桶列选择

<!-- 知识类型：操作指南 -->
<!-- 适用场景：数据倾斜排查与建表前设计 -->

**一句话定义**：分桶列决定数据在 Bucket 间的分布，选择不当会引发数据倾斜，进而导致查询性能瓶颈。

合理的分桶列设计能：

-   防止数据倾斜，充分利用并行能力
-   最大化 Colocate Join、Bucket Shuffle Join 的效果

### 反例：c2 列存在大量 null

下例将分桶列设为 `c2`，但导入数据中 `c2` 全为 null，导致 64 个分桶中只有 1 个分桶承载全部数据：

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 64
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
insert into t1 select number, null from numbers ('number'='10000000');
```

### 优化方案：改用散列度高的列

将分桶列从 `c2` 改为 `c1`，使数据均匀分布到各 Bucket，提升并行处理能力。

### 数据倾斜排查命令

**目的**：确认分桶字段是否倾斜
**命令**：

```sql
select c2, count(*) cnt from t1 group by c2 order by cnt desc limit 10;
```

**说明**：如果 Top 值的 cnt 远大于其他值，说明该列存在严重倾斜，不适合作为分桶列。

### 分桶列选择原则

-   避免使用业务上易出现 null 或固定值的列
-   优先选择业务含义上散列度高的字段，如用户 ID、订单 ID
-   建表前预估字段值分布，必要时抽样验证

:::tip 优化建议

检查分桶列是否存在数据倾斜，如有，更换为散列度高的字段作为分桶列。事前设计可显著降低事后定位与修正成本。

:::

## 案例 3：Key 列优化

<!-- 知识类型：操作指南 -->
<!-- 适用场景：等值/范围查询性能调优 -->

**一句话定义**：Doris 在存储层按 Key 列排序，将高频查询列定义为 Key 列，可显著加速等值与范围查询。

### 业务查询示例

```sql
select * from t1 where t1.c1 = 1;
select * from t1 where t1.c1 > 1 and t1.c1 < 10;
select * from t1 where t1.c1 in (1, 2, 3);
```

### 优化方案：将 c1 设为 Key 列

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip 优化建议

将业务查询中频繁使用的等值或范围查询列定义为 Key 列，以加速查询过程。

:::

## 案例 4：字段类型优化

<!-- 知识类型：原则与最佳实践 -->
<!-- 适用场景：建表与字段类型重构 -->

**一句话定义**：字段类型直接影响计算复杂度，定长类型与低精类型在处理上比变长类型与高精类型更高效。

### 类型选择原则

| 原则       | 推荐                                       | 避免                  |
| ---------- | ------------------------------------------ | --------------------- |
| 定长优先   | INT、BIGINT、DATE、DATETIME                | VARCHAR、STRING       |
| 低精优先   | INT、BIGINT、FLOAT                         | DECIMAL（高精度场景） |

### 常见替换场景

-   用 BIGINT 替代用于存储数值的 VARCHAR / STRING 字段
-   用 FLOAT / INT / BIGINT 替代非必要的 DECIMAL 字段
-   用 DATETIME 替代字符串形式的时间字段

:::tip 优化建议

定义 Schema 类型时遵循「定长优先、低精优先」原则，提升计算效率和系统性能。

:::

## FAQ 与常见问题排查

<!-- 知识类型：FAQ -->
<!-- 适用场景：调优过程中的常见疑问 -->

### Q1：建表后发现分桶列不合理，如何调整？

分桶列在建表后无法直接修改，需要新建表并重新导入数据，或使用 `ALTER TABLE` 创建新的 Rollup / 分区方案。建议建表前充分评估字段散列度。

### Q2：Key 列越多越好吗？

并非如此。Key 列过多会增加存储排序开销和写入成本。仅将真正高频用于等值或范围过滤的列设为 Key 列。

### Q3：什么时候必须使用 Unique 或 Aggregate 模型？

-   需要按主键去重或更新数据 → Unique
-   需要预聚合（SUM、MAX、MIN 等）→ Aggregate
-   仅追加明细且追求极致查询性能 → Duplicate

### Q4：如何判断当前表是否存在数据倾斜？

执行以下 SQL 排查分桶列分布：

```sql
select <bucket_col>, count(*) cnt from <table> group by <bucket_col> order by cnt desc limit 10;
```

若 Top 值数量远超其他值，则存在倾斜。

## 总结

精心设计的 Schema 能最大化利用 Doris 特性，显著提升查询性能；反之则可能导致数据倾斜等全局性问题。

调优要点：

-   优先选择 Duplicate 表模型（无更新需求场景）
-   分桶列选择散列度高的字段，避免 null 或固定值
-   将高频查询列定义为 Key 列
-   字段类型遵循「定长优先、低精优先」原则

事前设计永远比事后调优成本更低，建议在 Schema 设计阶段严格执行上述原则。
