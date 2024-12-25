---
{
    "title": "Control CBO Rules With Hint",
    "language": "en"
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

## Overview

The query optimizer applies a series of rules when generating execution plans. These rules are mainly categorized into two types: Rule-Based Optimizer (RBO) and Cost-Based Optimizer (CBO).

- RBO: This type of optimization improves query plans by applying a set of predefined heuristic rules without considering specific data statistics. Strategies such as predicate pushdown and projection pushdown fall into this category.
- CBO: This type of optimization leverages data statistics to estimate the cost of different execution plans and selects the plan with the lowest cost for execution. This includes choices of access paths and join algorithms.

In some cases, database administrators or developers may need more granular control over the query optimization process. Based on this, this document will introduce how to use query hints to manage CBO rules.

:::caution Note
Currently, Doris has good out-of-the-box capabilities. This means that in most scenarios, Doris will adaptively optimize performance in various scenarios, and users do not need to manually control hints for performance tuning. The content introduced in this chapter is mainly for professional tuners, and business personnel only need a simple understanding.
:::

The basic syntax for CBO rule control hints is as follows:

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

This hint immediately follows the `SELECT` keyword and specifies the names of the rules to be enabled within parentheses (rule names are case-insensitive).

Currently, the Doris optimizer supports several cost-based rewrites, which can be explicitly enabled using the `USE_CBO_RULE` hint, such as:

- PUSH_DOWN_AGG_THROUGH_JOIN
- PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE
- PUSH_DOWN_DISTINCT_THROUGH_JOIN

## Case

Here is a query example:

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

In this example, a CBO rule for aggregation pushdown is enabled. This operation allows table a to be aggregated before the join operation, reducing the cost of the join and speeding up the query. The plan after pushdown is as follows:

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

## Summary

Proper use of the `USE_CBO_RULE` hint can help manually enable certain advanced CBO optimization rules, optimizing performance in specific scenarios. However, using CBO optimization rules requires a deep understanding of the query optimization process and data characteristics. In most cases, relying on the automatic decisions of the Doris optimizer is still the best choice.
