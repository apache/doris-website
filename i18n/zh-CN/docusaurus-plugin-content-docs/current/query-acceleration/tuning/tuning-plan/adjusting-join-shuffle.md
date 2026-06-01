---
{
    "title": "使用 Hint 调整 Join Shuffle 方式",
    "language": "zh-CN",
    "description": "如何在 Doris 中使用 Distribute Hint 调整 Join Shuffle 方式？本文介绍 [shuffle] 与 [broadcast] Hint 的语法、执行计划对比与调优实践。",
    "keywords": ["Doris Join Shuffle", "Distribute Hint", "broadcast hint", "shuffle hint", "Join 调优", "Nereids 执行计划"]
}
---

<!-- 知识类型：概念 + 操作 -->
<!-- 适用场景：手动调整 Join 数据分发方式，优化查询性能 -->

Distribute Hint 是 Doris 用于手动指定 Join 右表数据分发方式的提示语法。通过它可在特定场景下覆盖优化器的默认选择，从而优化 Join 性能。

**调优前置 Checklist**：

- 已通过 `EXPLAIN SHAPE PLAN` 查看当前 Join 的分发方式
- 已确认默认计划存在性能瓶颈（如小表被 Shuffle、大表被 Broadcast）
- 了解两表的数据规模，可判断 Broadcast 与 Shuffle 的适用性
- 仅在专业调优场景使用 Hint，业务侧无需手工干预

:::caution 注意
当前 Doris 已经具备良好的开箱即用的能力，也就意味着在绝大多数场景下，Doris 会自适应的优化各种场景下的性能，无需用户来手工控制 Hint 来进行业务调优。本章介绍的内容主要面向专业调优人员，业务人员仅做简单了解即可。
:::

## Distribute Hint 语法

<!-- 知识类型：参考 -->
<!-- 适用场景：编写 SQL 时指定 Join 右表的分发方式 -->

Doris 支持两种独立的 [Distribute Hint](../../../query-acceleration/hints/distribute-hint.md)，需置于 Join 右表之前，使用中括号 `[]` 包裹。

### Hint 类型对比

| Hint 类型      | 分发方式（DistributionSpec） | 典型适用场景                                  | 数据传输代价                  |
| :------------- | :--------------------------- | :-------------------------------------------- | :---------------------------- |
| `[shuffle]`    | `DistributionSpecHash`       | 两表数据量都较大，按 Join Key Hash 重分布     | 双表均按 Key 重分布           |
| `[broadcast]`  | `DistributionSpecReplicated` | 右表为小表，复制到所有 BE 节点上              | 右表全量复制到每个 BE 节点    |

> 提示：也可通过 Leading Hint 配合 Distribute Hint 共同指定 Shuffle 方式，详见[使用 Leading Hint 控制 Join 顺序](reordering-join-with-leading-hint.md)。

### 最小示例

```sql
-- 强制右表 Broadcast 分发
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;

-- 强制右表 Shuffle 分发
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## 案例：通过 EXPLAIN 验证 Hint 效果

<!-- 知识类型：操作示例 -->
<!-- 适用场景：调优时验证 Hint 是否生效 -->

下面以同一查询展示 Hint 生效前后的执行计划差异。

### 步骤 1：查看默认执行计划

**目的**：确认优化器默认选择的分发方式。

**命令**：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

**说明**：默认计划中 `t2` 使用 `DistributionSpecHash`，即按 Hash 进行 Shuffle 分发。

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecHash]                            |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```

### 步骤 2：加入 [broadcast] Hint

**目的**：将右表 `t2` 的分发方式改为 Broadcast。

**命令**：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

**说明**：执行计划中 `t2` 的分发方式由 `DistributionSpecHash` 变为 `DistributionSpecReplicated`，表明 Hint 已生效。

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecReplicated]                      |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```

## 常见问题

<!-- 知识类型：FAQ / Troubleshooting -->
<!-- 适用场景：Hint 未按预期生效或选择困难 -->

### Q1：Hint 写了为什么没生效？

-   确认 Hint 写在 **Join 右表**之前，例如 `JOIN [broadcast] t1`，而非左表前。
-   使用 `EXPLAIN SHAPE PLAN` 检查 `PhysicalDistribute` 节点的 `DistributionSpec` 是否符合预期。
-   语法错误（如缺少中括号、拼写错误）会被忽略，请检查 SQL 语法。

### Q2：什么时候使用 [broadcast]，什么时候用 [shuffle]？

| 场景                     | 推荐 Hint     | 原因                               |
| :----------------------- | :------------ | :--------------------------------- |
| 右表是小表（如维度表）   | `[broadcast]` | 避免大表 Shuffle 的网络开销        |
| 两表都很大且数据均衡     | `[shuffle]`   | Broadcast 会放大右表传输代价       |
| Join Key 严重数据倾斜    | `[broadcast]` | 规避 Shuffle 后的热点节点          |

### Q3：是否需要手工指定 Hint？

绝大多数场景下不需要。Doris 优化器会自适应选择合适的分发方式，仅在性能不达预期且明确判定优化器选择不当时再使用 Hint。

## 总结

通过合理使用 Distribute Hint，可以优化 Join 操作的 Shuffle 方式，提升查询性能。实践中建议先通过 `EXPLAIN SHAPE PLAN` 分析执行计划，再根据数据规模和分布特征选择 `[shuffle]` 或 `[broadcast]`。
