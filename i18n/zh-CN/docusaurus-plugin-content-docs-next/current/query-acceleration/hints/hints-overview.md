---
{
    "title": "Hint 概述",
    "language": "zh-CN",
    "description": "了解 Doris Hint 的分类、使用场景与生效验证方法，通过 Leading、Ordered、Distribute 等 Hint 手动干预查询计划，进行 Join 顺序与数据分发调优。",
    "keywords": [
        "Doris Hint",
        "查询优化器 Hint",
        "Leading Hint",
        "Ordered Hint",
        "Distribute Hint",
        "Join 顺序调优",
        "Hint Log",
        "执行计划干预"
    ]
}
---

<!-- 知识类型: 概念定义 / 能力概览 -->
<!-- 适用场景: 性能调优 / 执行计划干预 -->

数据库 Hint 是一种查询优化技术，用于指导数据库查询优化器如何生成指定的计划。通过提供 Hint，用户可以对查询优化器的默认行为进行微调，以期望获得更好的性能或满足特定需求。

:::caution 注意
当前 Doris 已经具备良好的开箱即用的能力，在绝大多数场景下，Doris 会自适应的优化各种场景下的性能，无需用户来手工控制 Hint 来进行业务调优。本章介绍的内容主要面向专业调优人员，业务人员仅做简单了解即可。
:::

## 快速导航

-   想了解 Doris 支持哪些 Hint 类型 → 参考 [Hint 分类](#hint-分类)
-   想通过示例了解 Hint 如何改变执行计划 → 参考 [使用示例：调整 Join 顺序](#使用示例调整-join-顺序)
-   想验证 Hint 是否生效及失效原因 → 参考 [Hint Log：验证 Hint 是否生效](#hint-log验证-hint-是否生效)

## Hint 分类

<!-- 知识类型: 能力对照 -->

Doris 目前支持以下几种 Hint 类型，分别用于干预 Join 顺序和数据分发方式：

| Hint 类型                            | 作用                                                  | 典型应用场景                              |
| ------------------------------------ | ----------------------------------------------------- | ----------------------------------------- |
| [Leading Hint](leading-hint.md)      | 指定 Join Order 为 Leading 中提供的顺序               | 手动控制多表 Join 的连接顺序              |
| [Ordered Hint](leading-hint.md)      | 一种特定的 Leading Hint，指定 Join Order 为原始文本序 | 希望严格按照 SQL 文本顺序执行 Join        |
| [Distribute Hint](distribute-hint.md) | 指定 Join 的数据分发方式为 Shuffle 还是 Broadcast    | 在 Join 数据分发策略不理想时进行手动调整 |

## 使用示例：调整 Join 顺序

<!-- 知识类型: 操作示例 -->
<!-- 适用场景: Join 顺序调优 -->

假设有一个包含大量数据的表，而在某些特定情况下，你了解到在一个查询中，表的连接顺序可能会影响查询性能。此时，Leading Hint 允许你指定希望优化器遵循的表连接顺序。

以下面 SQL 查询为例，若执行效率不理想，我们希望调整 Join 顺序，同时不改变原始 SQL，以免影响用户原始查询逻辑，并达到调优目的。

**步骤 1：查看原始执行计划**

```sql
mysql> explain shape plan select * from t1 join t2 on t1.c1 = c2;
+-------------------------------------------+
| Explain String                            |
+-------------------------------------------+
| PhysicalResultSink                        |
| --PhysicalDistribute                      |
| ----PhysicalProject                       |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2) |
| --------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                |
| ----------PhysicalOlapScan[t1]            |
+-------------------------------------------+
```

**步骤 2：使用 Leading Hint 改变 Join 顺序**

我们可以使用 Leading Hint 来任意改变 t1 和 t2 的 Join 顺序。例如：

```sql
mysql> explain shape plan select  /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = c2;
+-----------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                     |
+-----------------------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                                  |
| --PhysicalDistribute                                                                                |
| ----PhysicalProject                                                                                 |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() build RFs:RF0 c1->[c2] |
| --------PhysicalOlapScan[t2] apply RFs: RF0                                                         |
| --------PhysicalDistribute                                                                          |
| ----------PhysicalOlapScan[t1]                                                                      |
|                                                                                                     |
| Hint log:                                                                                           |
| Used: leading(t2 t1)                                                                                |
| UnUsed:                                                                                             |
| SyntaxError:                                                                                        |
+-----------------------------------------------------------------------------------------------------+
```

**说明**：在此示例中，使用了 `/*+ leading(t2 t1) */` 的 Leading Hint。Leading Hint 会告知优化器在执行计划中使用指定表（t2）作为驱动表，并将其置于 (t1) 之前。

## Hint Log：验证 Hint 是否生效

<!-- 知识类型: 排查方法 -->
<!-- 适用场景: Hint 生效验证 / 故障排查 -->

Hint Log 主要用于在执行 `EXPLAIN` 时显示提示是否生效。其显示位置通常位于 `EXPLAIN` 输出的最下方。

```sql
+---------------------------------+
| Hint log:                       |
| Used:                           |
| UnUsed:                         |
| SyntaxError:                    |
+---------------------------------+
```

Hint Log 包含以下三种状态：

| 状态          | 含义                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `Used`        | 该 Hint 已生效                                                             |
| `UnUsed`      | 该 Hint 未生效                                                             |
| `SyntaxError` | 该 Hint 未生效，且语法使用错误或不被支持，会附加不支持的原因信息           |

用户可以通过 Hint Log 查看 Hint 的生效情况以及未生效原因，便于调整和验证。

## 总结

Hint 是手动管理执行计划的强大工具。当前 Doris 支持的 Leading Hint、Ordered Hint、Distribute Hint 等，可以支撑用户手动管理 Join Order、Shuffle 方式以及其他变量配置，给用户提供更方便有效的运维能力。
