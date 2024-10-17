---
{
    "title": "Adjusting Join Shuffle with Hint",
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

## Principle

Doris supports the use of hints to adjust the type of data shuffle in Join operations, thereby optimizing query performance. This section will introduce in detail how to use hints in Doris to specify the type of Join shuffle.

Currently, Doris is limited to specifying the Distribute Type for the right table in a Join, offering two types to choose from: `[shuffle]` and `[broadcast]`. The Distribute Type should be placed before the right table in the Join, and can be represented using either square brackets `[]` or double slashes `//`.

Examples are as follows:

```sql
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT COUNT(*) FROM t2 JOIN /*+broadcast*/ t1 ON t1.c1 = t2.c2;
SELECT /*+ ordered */ COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT /*+ ordered */ COUNT(*) FROM t2 JOIN /+broadcast/ t1 ON t1.c1 = t2.c2;
```

When using hints, please note the following:

1. If Doris encounters a DistributeHint that cannot correctly generate an execution plan, it will not display the hint but will make it effective according to the "best effort" principle. Ultimately, the distribute method displayed by EXPLAIN shall be deemed as final.

2. In the current version, DistributeHint does not support mixing with LEADING, and the hint will only take effect when the table specified by distribute is on the right side of the Join.

3. It is recommended to mix DistributeHint with ORDERED. First, use ORDERED to fix the Join order, and then specify the expected distribute method in the corresponding Join.

## Use Case

Next, we will demonstrate the use of hints through the same example:

**1. Before Using Hint:**

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

Result:

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

**2. After Using Hint:**

```sql
EXPLAIN SHAPE PLAN SELECT /*+ ordered */ COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
```

Result:

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

In the EXPLAIN results, you can see the relevant information for the distribute operator:

1. `DistributionSpecReplicated` indicates that the corresponding data is replicated to all BE nodes.

2. `DistributionSpecGather` indicates that the data is gathered to the FE node.

3. `DistributionSpecHash` indicates that the data is scattered to different BE nodes according to a specific HashKey and algorithm.

## Summary

By properly using DistributeHint, you can optimize the shuffle method of Join operations and improve query performance. In practice, it is recommended to first analyze the query execution plan through EXPLAIN and then choose the appropriate shuffle type based on the actual situation.