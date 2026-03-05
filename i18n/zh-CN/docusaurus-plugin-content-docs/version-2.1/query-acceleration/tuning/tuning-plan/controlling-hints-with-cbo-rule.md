---
{
    "title": "使用 Hint 控制代价改写",
    "language": "zh-CN",
    "description": "查询优化器在生成执行计划的过程中，会应用一系列规则。这些规则主要分为两类：基于规则的优化（Rule-Based Optimizer 即 RBO）和基于代价的优化（Cost-Based Optimizer 即 CBO） 。"
}
---

## 概述

查询优化器在生成执行计划的过程中，会应用一系列规则。这些规则主要分为两类：基于规则的优化（Rule-Based Optimizer 即 RBO）和基于代价的优化（Cost-Based Optimizer 即 CBO） 。

- RBO：此类优化通过应用一系列预定义的启发式规则来改进查询计划，而不考虑具体的数据统计信息。例如，谓词下推、投影下推等策略均属于此类。
- CBO：此类优化则利用数据统计信息来估算不同执行计划的代价，并选择代价最小的计划进行执行。这包括访问路径的选择、连接算法的选择等。

在某些情况下，数据库管理员或开发人员可能需要对查询优化过程进行更为精细的控制。基于此，本文档将介绍如何使用查询 Hint 来管理 CBO 规则。

:::caution 注意
当前 Doris 已经具备良好的开箱即用的能力，也就意味着在绝大多数场景下，Doris 会自适应的优化各种场景下的性能，无需用户来手工控制 hint 来进行业务调优。本章介绍的内容主要面向专业调优人员，业务人员仅做简单了解即可。
:::

CBO 规则控制 Hint 的基本语法如下所示：

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

此 Hint 紧跟在 `SELECT` 关键字之后，并在括号内指定要启用的规则名称（规则名称不区分大小写）。

当前 Doris 优化器支持若干种代价改写，可以通过 `USE_CBO_RULE` hint 来显式启用，例如：

- PUSH_DOWN_AGG_THROUGH_JOIN
- PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE
- PUSH_DOWN_DISTINCT_THROUGH_JOIN

## 案例

查询示例如下：

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

在此示例中启用了一个聚合下推 CBO 规则。这一操作可以使表 a 能够在连接操作之前进行提前聚合，减少连接的开销，加速查询。下推后的计划如下：

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

## 总结

合理使用 `USE_CBO_RULE` hint，可以帮助手动启用部分高级 CBO 优化规则，在特定场景下优化性能。但使用 CBO 优化规则需要对查询优化过程和数据特性有深入的理解，在大多数情况下，依赖 Doris 优化器的自动决策仍然是最佳的选择。
