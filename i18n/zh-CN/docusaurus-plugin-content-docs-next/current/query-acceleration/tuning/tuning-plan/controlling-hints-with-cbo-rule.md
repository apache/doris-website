---
{
    "title": "使用 Hint 控制 CBO 规则进行代价改写",
    "sidebar_label": "CBO 规则控制",
    "language": "zh-CN",
    "description": "如何在 Doris 中通过 USE_CBO_RULE Hint 显式启用 CBO 代价改写规则？本文介绍语法、可用规则及聚合下推等典型场景示例。",
    "keywords": ["Doris CBO Hint", "USE_CBO_RULE", "代价改写", "聚合下推", "查询优化器", "RBO 与 CBO"]
}
---

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：通过 Hint 显式控制 CBO 规则以进行查询调优 -->

## 阅读前 Checklist

- 你已了解 Doris 优化器的基本工作流程
- 你需要在特定查询中启用某条 CBO 规则（如聚合下推）
- 你的角色是 DBA 或专业调优人员，而非普通业务开发

:::caution 注意
当前 Doris 已具备良好的开箱即用能力，绝大多数场景下会自适应地优化性能，无需手动使用 Hint 调优。本文内容主要面向**专业调优人员**，业务人员了解概念即可。
:::

## 概述

<!-- 知识类型：概念 -->

`USE_CBO_RULE` 是一种查询 Hint，用于在单条 SQL 中显式启用指定的 CBO 代价改写规则。

Doris 优化器在生成执行计划时会应用两类规则：

| 优化类型 | 全称 | 决策依据 | 典型策略 |
|----------|------|----------|----------|
| RBO | Rule-Based Optimizer（基于规则的优化） | 预定义启发式规则，不依赖统计信息 | 谓词下推、投影下推 |
| CBO | Cost-Based Optimizer（基于代价的优化） | 数据统计信息，估算并选择代价最小的计划 | 访问路径选择、连接算法选择 |

在某些精细调优场景下，DBA 或开发人员需要手动控制 CBO 规则的启用与否，此时可使用查询 Hint 实现。

## 语法说明

<!-- 知识类型：参考 -->
<!-- 适用场景：编写带 Hint 的 SQL -->

**目的**：在单条 SELECT 语句中显式启用一个或多个 CBO 规则。

**命令**：

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

**说明**：

- Hint 紧跟在 `SELECT` 关键字之后。
- 括号内填写要启用的规则名称，多个规则用逗号分隔。
- 规则名称**不区分大小写**。

## 支持的 CBO 规则

<!-- 知识类型：参考 -->

当前 Doris 优化器支持以下可通过 `USE_CBO_RULE` 显式启用的代价改写规则：

| 规则名称 | 作用 |
|----------|------|
| `PUSH_DOWN_AGG_THROUGH_JOIN` | 将聚合操作下推到 Join 两侧 |
| `PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` | 将聚合操作下推到 Join 的一侧 |
| `PUSH_DOWN_DISTINCT_THROUGH_JOIN` | 将 Distinct 操作下推穿过 Join |

## 案例：聚合下推加速 Join 查询

<!-- 知识类型：示例 -->
<!-- 适用场景：Join 后再聚合的查询，期望提前聚合以减少 Join 数据量 -->

**场景**：表 `a` 与表 `b` 通过 `device_id` 关联，并按 `event_id`、`group_id` 进行聚合统计。希望在 Join 之前提前对表 `a` 进行聚合，减少 Join 处理的数据量。

**SQL 示例**：

```sql
explain shape plan
    select /*+ USE_CBO_RULE(push_down_agg_through_join_one_side) */
            a.event_id,
            b.group_id,
            COUNT(a.event_id)
    from a
    join b on
            a.device_id = b.device_id
    group by
            a.event_id,
            b.group_id
    ;
```

**改写后的执行计划**：

```sql
PhysicalResultSink
--hashAgg[GLOBAL]
----hashAgg[LOCAL]
------hashJoin[INNER_JOIN] hashCondition=((a.device_id = b.device_id)) otherCondition=()
--------hashAgg[LOCAL]
----------PhysicalOlapScan[a]
--------filter((cast(experiment_id as DOUBLE) = 73.0))
----------PhysicalOlapScan[b]
```

可以看到，表 `a` 的扫描之上多了一层 `hashAgg[LOCAL]`，实现了 Join 前的提前聚合，从而降低 Join 输入规模、加速查询。

## 常见问题

<!-- 知识类型：FAQ / Troubleshooting -->

**Q1：什么时候需要使用 `USE_CBO_RULE`？**

仅当 Doris 默认未应用某条 CBO 规则、但你判断该规则在当前数据分布下能带来收益时，才需要手动启用。绝大多数场景下应信任优化器的自动决策。

**Q2：Hint 中的规则名称大小写是否敏感？**

不区分大小写，`PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` 与 `push_down_agg_through_join_one_side` 等价。

**Q3：可以同时启用多条规则吗？**

可以，规则之间用逗号分隔，例如 `/*+ USE_CBO_RULE(rule1, rule2) */`。

**Q4：Hint 写错位置或规则名错误会怎样？**

Hint 必须紧跟在 `SELECT` 关键字之后；若规则名拼写错误，该 Hint 将不生效，但 SQL 仍会按默认计划执行。

## RBO vs CBO 对比

<!-- 知识类型：对比 -->

| 维度 | RBO | CBO |
|------|-----|-----|
| 决策依据 | 启发式规则 | 数据统计信息（代价估算） |
| 是否依赖统计信息 | 否 | 是 |
| 适用场景 | 通用、确定性优化 | 与数据分布强相关的优化 |
| 是否可被 `USE_CBO_RULE` 控制 | 否 | 是 |

## 总结

合理使用 `USE_CBO_RULE` Hint，可在特定场景下手动启用高级 CBO 优化规则，提升查询性能。但其使用需要对查询优化和数据特性有深入理解；**大多数情况下，依赖 Doris 优化器的自动决策仍是最佳选择**。
