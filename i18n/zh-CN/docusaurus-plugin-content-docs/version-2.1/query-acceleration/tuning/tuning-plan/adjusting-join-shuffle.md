---
{
    "title": "使用 Hint 调整 Join Shuffle 方式",
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

Doris 支持使用 Hint 来调整 Join 操作中数据 Shuffle 的类型，从而优化查询性能。本节将详细介绍如何在 Doris 中利用 Hint 来指定 Join Shuffle 的类型。

目前，Doris 仅限于指定 Join 右表的 Distribute Type，并且仅提供两种类型供选择：`[shuffle] `和 `[broadcast]`。Distribute Type 需置于 Join 右表之前，可采用中括号 `[]`的方式。

示例如下：

```sql
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
SELECT /*+ ordered */ COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT /*+ ordered */ COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```


## 调优案例

接下来，我们将通过同一个例子来展示 Hint 的使用方法：

**1. 使用前：**

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

结果：

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

**2. 使用后：**

```sql
EXPLAIN SHAPE PLAN SELECT /*+ ordered */ COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
```

结果：

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
| --------------PhysicalOlapScan [t2]                                              |  
| ------------PhysicalDistribute [DistributionSpecReplicated]                      |  
| --------------PhysicalProject                                                    |  
| ----------------PhysicalOlapScan [t1]                                            |  
|                                                                                  |  
| Hint log:                                                                        |  
| Used: ORDERED                                                                    |  
| UnUsed:                                                                          |  
| SyntaxError:                                                                     |  
+----------------------------------------------------------------------------------+
```

在 EXPLAIN 结果中，可以看到 Distribute 算子的相关信息：

1. `DistributionSpecReplicated` 表示将对应的数据复制到所有 BE 节点。

2. `DistributionSpecGather` 表示将数据 Gather 到 FE 节点。

3. `DistributionSpecHash` 表示将数据按照特定的 HashKey 和算法打散到不同的 BE 节点。

## 总结

通过合理使用 DistributeHint，可以优化 Join 操作的 Shuffle 方式，提升查询性能。在实践中，建议 先通过 EXPLAIN 分析查询执行计划，再根据实际情况选择合适的 Shuffle 类型。在使用时，需注意以下事项：

1. 若遇到无法正确生成执行计划的 DistributeHint 时，Doris 不会显示该 Hint，而是会按“最大努力”原则使其生效。最终，以 EXPLAIN 显示的 Distribute 方式为准。

2. 在当前版本中，DistributeHint 暂不支持与 LEADING 混用，且仅当 Distribute 指定的表位于 Join 右边时，Hint 才会生效。

3. 建议将 DistributeHint 与 ORDERED 混用。首先利用 ORDERED 固定 Join 顺序，然后再指定相应 Join 中预期使用的 Distribute 方式。
