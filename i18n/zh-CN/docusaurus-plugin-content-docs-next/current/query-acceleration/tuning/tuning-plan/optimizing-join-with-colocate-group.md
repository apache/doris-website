---
{
    "title": "使用 Colocate Group 优化 Join：消除 Shuffle 开销",
    "language": "zh-CN",
    "description": "如何用 Colocate Group 消除 Doris Join 中的数据 Shuffle 开销？本文介绍配置方法、状态排查与常见 Shuffle Join、Bucket Shuffle Join 误判问题。",
    "keywords": ["Doris Colocate Join", "Colocate Group 优化", "Join Shuffle 开销", "Bucket Shuffle Join", "IsStable false"]
}
---

<!-- 知识类型：调优指南 -->
<!-- 适用场景：大表 Join 性能优化、跨 BE Shuffle 数据传输瓶颈消除 -->

Colocate Group 是一种高效的 Join 方式，可以让执行引擎规避 Join 操作中数据的 Shuffle 开销。原理与案例详见 [Colocation Join](../../colocation-join.md)。

## 适用前提 Checklist

<!-- 知识类型：前置检查 -->
<!-- 适用场景：判断查询是否可受益于 Colocate Group -->

在使用本文前，请先确认：

-   两张及以上参与 Join 的表已加入同一个 Colocate Group。
-   Join Key 与分桶列（Distribution Key）一致。
-   表的副本数与分桶数相同，且数据分布稳定（`IsStable = true`）。
-   查询中存在明显的大表 Join 大表导致的 Shuffle 性能瓶颈。

## 核心概念

<!-- 知识类型：术语定义 -->
<!-- 适用场景：理解 Colocate Group 的基本含义 -->

**Colocate Group**：一组按相同规则分桶并保证同桶数据落在同一 BE 节点上的表，使得 Join 时本地即可完成关联计算，无需跨节点 Shuffle。

## 状态查看与排查

<!-- 知识类型：操作指引 -->
<!-- 适用场景：确认 Colocate Group 是否生效、是否稳定 -->

### 查看 Colocate Group 状态

-   **目的**：确认当前 Colocate Group 是否可用。
-   **命令**：

    ```sql
    SHOW PROC "/colocation_group";
    ```

-   **说明**：重点关注 `IsStable` 列。

### 状态字段对照表

| 字段       | 取值          | 含义                                                 |
| :--------- | :------------ | :--------------------------------------------------- |
| `IsStable` | `true`        | Colocate Group 可用，Join 可走 Colocate 计划。       |
| `IsStable` | `false`       | Colocate Group 暂不可用，Doris 正在均衡数据。        |

![使用 Colocate Group 优化 Join](/images/use-colocate-group.jpg)

## 常见误判与排错

<!-- 知识类型：故障排查 -->
<!-- 适用场景：执行计划未走 Colocate Join 时的诊断 -->

:::tip 注意
-   在某些场景下，即使已经成功建立了 Colocate Group，执行计划（plan）仍然可能会显示为 `Shuffle Join` 或 `Bucket Shuffle Join`。这种情况通常发生在 Doris 正在进行数据整理的过程中，比如，它可能在 BE 间迁移 tablet，以确保数据在多个 BE 之间的分布达到更加均衡的状态。
-   通过命令 `SHOW PROC "/colocation_group";` 可以查看 Colocate Group 状态：`IsStable` 出现 `false`，表示有 Colocate Group 不可用的情况。
:::

### Join 类型对比

| Join 类型               | 是否 Shuffle 数据 | 触发条件                                      |
| :---------------------- | :---------------- | :-------------------------------------------- |
| Colocate Join           | 否                | 表加入同一 Colocate Group 且 `IsStable=true`  |
| Bucket Shuffle Join     | 部分（一侧）      | Join Key 与左表分桶列一致                     |
| Shuffle Join            | 是（双侧）        | 不满足上述条件时的默认行为                    |
| Broadcast Join          | 是（小表广播）    | 右表数据量较小                                |

## FAQ

<!-- 知识类型：常见问题 -->
<!-- 适用场景：用户排查 Colocate Join 失效原因 -->

**Q1：建立了 Colocate Group，为什么执行计划仍是 `Shuffle Join` 或 `Bucket Shuffle Join`？**

通常是因为 Doris 正在进行数据整理（如在 BE 间迁移 tablet）以保证数据均衡。此时 `IsStable` 会显示为 `false`，待数据稳定后会恢复为 Colocate Join。

**Q2：如何确认 Colocate Group 当前是否可用？**

执行 `SHOW PROC "/colocation_group";`，查看 `IsStable` 字段。`true` 表示可用，`false` 表示暂不可用。

**Q3：`IsStable=false` 会持续多久？**

取决于数据迁移规模和集群负载，等待 Doris 完成 tablet 均衡后会自动恢复。

## 相关链接

-   [Colocation Join 原理与案例](../../colocation-join.md)
