---
{
    "title": "Adjusting Join Shuffle Mode with Hint",
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

Doris supports the use of hints to adjust the type of data shuffle in Join operations, thereby optimizing query performance. This section provides detailed instructions on how to specify the Join Shuffle type in Doris using hints.

:::caution Note
Currently, Doris has good out-of-the-box capabilities. This means that in most scenarios, Doris will adaptively optimize performance in various scenarios, and users do not need to manually control hints for performance tuning. The content introduced in this chapter is mainly for professional tuners, and business personnel only need a simple understanding.
:::

Currently, Doris supports two independent [Distribute Hint](../../../query-acceleration/hints/distribute-hint.md), `[shuffle]` and `[broadcast]`, to specify the Distribute Type for the right table in a Join. The Distribute Type should be placed before the right table in the Join, enclosed in square brackets `[]`. Additionally, Doris can specify the shuffle mode by using the Leading Hint in conjunction with the Distribute Hint (for more details, refer to [Reordering Join With Leading Hint](reordering-join-with-leading-hint.md)).

Examples are as follows:

```sql
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## Case

Next, we will demonstrate the usage of Distribute Hints through an example:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

The plan for the original SQL is as follows, showing that the join between t1 and t2 uses the hash distribute method, indicated by `DistributionSpecHash`.

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

After adding the [broadcast] hint:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

It can be seen that the distribution method for the join between t1 and t2 has been changed to the broadcast method, indicated by `DistributionSpecReplicated`.

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

## Summary

By appropriately using Distribute Hints, you can optimize the shuffle mode for Join operations and improve query performance. In practice, it is recommended to first analyze the query execution plan using EXPLAIN and then specify the appropriate shuffle type based on the actual situation.
