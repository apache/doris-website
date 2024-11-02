---
{
    "title": "Controlling Hints with CBO Rule",
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

## Principles

The query optimizer applies a series of rules in the process of generating execution plans. These rules are mainly divided into two categories: Rule-Based Optimizer (RBO) and Cost-Based Optimizer (CBO).

1. RBO: This type of optimization improves the query plan by applying a set of predefined heuristic rules without considering specific data statistics. Examples include strategies such as predicate pushdown and projection pushdown.

2. CBO: This type of optimization utilizes data statistics to estimate the cost of different execution plans and selects the plan with the lowest cost for execution. This includes the selection of access paths and join algorithms.

In some cases, database administrators or developers may need more granular control over the query optimization process. Based on this, this document will introduce how to use query hints to manage CBO rules.

The basic syntax for CBO rule control hints is as follows:

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

This hint should immediately follow the SELECT keyword, and the names of the rules to be enabled should be specified within parentheses (note: rule names are case-insensitive).

In the optimizer, the following CBO rules are disabled by default and need to be explicitly enabled using the `USE_CBO_RULE hint`:

1. PUSH_DOWN_AGG_THROUGH_JOIN
2. PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE
3. PUSH_DOWN_DISTINCT_THROUGH_JOIN

These rules mainly involve the optimization of aggregation operations and JOIN operations. The specific optimization logic is as follows:

1. The system first checks whether the `USE_CBO_RULE hint` exists in the query.
2. If the hint exists, the system will traverse all specified rules.
3. For each rule, the system checks if it is on the whitelist. If it is, the rule will be enabled.
4. If the specified rule is not on the whitelist, the system will further check if it is a valid rule name. If it is a valid rule, the rule will also be enabled.
5. Any unrecognized rule names will be ignored by the system.

## Tuning Usage Case

Here is a query example:

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

In this example, we have enabled two aggregation pushdown rules. This operation may enable the optimizer to generate a more efficient execution plan, especially when processing large datasets.

Best Practices:

1. Use CBO rule hints cautiously. In most cases, the optimizer can make good decisions.
2. Before applying hints, analyze query performance and identify bottlenecks.
3. Verify the effect of hints in a test environment to ensure they actually improve performance.
4. Regularly reevaluate applied hints, as changes in data distribution and system configuration may affect their effectiveness.
5. Document all applied hints and their reasons to facilitate subsequent maintenance and optimization efforts.

## Summary

By using the `USE_CBO_RULE hint` appropriately, you can fine-tune the behavior of the query optimizer in specific scenarios, potentially improving the performance of complex queries. However, this requires a deep understanding of the query optimization process and data characteristics. In most cases, relying on the optimizer's automatic decisions remains the best choice.