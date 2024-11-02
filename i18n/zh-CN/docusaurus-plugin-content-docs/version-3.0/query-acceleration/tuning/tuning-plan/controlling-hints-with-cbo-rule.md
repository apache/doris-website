---
{
    "title": "使用 Hint 控制代价改写",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 工作原理

查询优化器在生成执行计划的过程中，会应用一系列规则。这些规则主要分为两类：基于规则的优化 (Rule-Based Optimizer 即 RBO) 和基于代价的优化 (Cost-Based Optimizer 即 CBO) 。

1. RBO：此类优化通过应用一系列预定义的启发式规则来改进查询计划，而不考虑具体的数据统计信息。例如，谓词下推、投影下推等策略均属于此类。

2. CBO：此类优化则利用数据统计信息来估算不同执行计划的代价，并选择代价最小的计划进行执行。这包括访问路径的选择、连接算法的选择等。

在某些情况下，数据库管理员或开发人员可能需要对查询优化过程进行更为精细的控制。基于此，本文档将介绍如何使用查询 Hint 来管理 CBO 规则。

CBO 规则控制 Hint 的基本语法如下所示：

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

此 Hint 应紧跟在 SELECT 关键字之后，并在括号内指定要启用的规则名称（注：规则名称不区分大小写）。

在优化器中，以下 CBO 规则默认处于禁用状态，需要通过 `USE_CBO_RULE hint `来显式启用：

1. PUSH_DOWN_AGG_THROUGH_JOIN

2. PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE

3. PUSH_DOWN_DISTINCT_THROUGH_JOIN

这些规则主要涉及聚合操作和 JOIN 操作的优化。具体的优化逻辑如下：

1. 系统首先会检查查询中是否存在 `USE_CBO_RULE hint`。

2. 如果存在该 Hint，系统会遍历所有指定的规则。

3. 对于每个规则，系统会检查其是否在白名单中。若在白名单中，则该规则将被启用。

4. 若指定的规则不在白名单中，系统会进一步检查其是否为有效的规则名称。如果是有效规则，该规则同样会被启用。

5. 任何无法识别的规则名称都将被系统忽略。

## 调优案例

查询示例如下：

```sql
SELECT /*+ USE_CBO_RULE(push_down_agg_through_join, push_down_agg_through_join_one_side) */    a.event_id,
    b.experiment_id,
    b.group_id,
    COUNT(a.event_id)
FROM
    com_dd_library a
JOIN shunt_log_com_dd_library b ON
    a.device_id = b.device_id
GROUP BY
    b.group_id,
    b.experiment_id,
    a.event_id;
```

在此示例中，我们启用了两个聚合下推规则。这一操作可能使优化器能够生成一个更为高效的执行计划，尤其是在处理大规模数据集时。

最佳实践：

1. 谨慎使用 CBO 规则 `hint`。在大多数情况下，优化器能够做出良好的决策。

2. 在应用 `hint` 之前，应先分析查询性能并识别出瓶颈所在。

3. 在测试环境中验证 `hint` 的效果，以确保它确实能够改善性能。

4. 定期重新评估已应用的 `hint`，因为数据分布和系统配置的变化可能会影响其有效性。

5. 记录所有已应用的 `hint` 及其理由，以便于后续的维护和优化工作。

## 总结

通过合理使用 `USE_CBO_RULE hint`，你可以在特定场景下微调查询优化器的行为，从而潜在地提升复杂查询的性能。然而，这需要对查询优化过程和数据特性有深入的理解。在大多数情况下，依赖优化器的自动决策仍然是最佳的选择。