---
{
    "title": "使用 Colocate Group 优化 Join",
    "language": "zh-CN",
    "description": "Colocate Group 是一种高效的 Join 方式，使得执行引擎能有效地规避 Join 操作中数据的 shuffle 开销。相关原理介绍和案例参考详见 Colocation Join。"
}
---

Colocate Group 是一种高效的 Join 方式，使得执行引擎能有效地规避 Join 操作中数据的 shuffle 开销。相关原理介绍和案例参考详见 [Colocation Join](../../colocation-join.md)。

:::tip 注意
- 在某些场景下，即使已经成功建立了 Colocate Group，执行计划（plan）仍然可能会显示为 `Shuffle Join` 或 `Bucket Shuffle Join`。这种情况通常发生在 Doris 正在进行数据整理的过程中，比如，它可能在 BE 间迁移 tablet，以确保数据在多个 BE 之间的分布达到更加均衡的状态。
- 通过命令`show proc "/colocation_group"`;可以查看 Colocate Group 状态，如下图所示：`IsStable` 出现 false，表示有 Colocate Group 不可用的情况。
:::

![使用 Colocate Group 优化 Join](/images/use-colocate-group.jpg)
