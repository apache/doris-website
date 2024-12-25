---
{
    "title": "Overview of Hints",
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

Database Hints are query optimization techniques used to guide the database query optimizer on how to generate a specific plan. By providing Hints, users can fine-tune the default behavior of the query optimizer in hopes of achieving better performance or meeting specific requirements.
:::caution Note
Currently, Doris possesses excellent out-of-the-box capabilities. In most scenarios, Doris adaptively optimizes performance across various situations without requiring users to manually control hints for business tuning. The content presented in this chapter is primarily intended for professional tuning personnel. Business users can have a brief understanding of it.
:::

## Hint Classification

Doris currently supports several types of hints, including leading hint, ordered hint, and distribute hint:：

- [Leading Hint](leading-hint.md)：Specifies the join order according to the order provided in the leading hint.
- [Ordered Hint](leading-hint.md)：A specific type of leading hint that specifies the join order as the original text sequence.
- [Distribute Hint](distribute-hint.md)：Specifies the data distribution method for joins as either shuffle or broadcast.

## Hint Example
Imagine a table with a large amount of data. In certain specific cases, you may know that the join order of the tables can affect query performance. In such situations, the Leading Hint allows you to specify the table join order you want the optimizer to follow.

Take the following SQL query as an example. If the execution efficiency is not ideal, you may want to adjust the join order without changing the original SQL to avoid impacting the user's original scenario and achieve tuning goals.

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

In this case, we can use the Leading Hint to arbitrarily change the join order of t1 and t2. For example:

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

In this example, the Leading Hint `/*+ leading(t2 t1) */` is used. The Leading Hint informs the optimizer to use the specified table (t2) as the driving table and place it before (t1) in the execution plan.

## Hint Log

The Hint Log is primarily used to display whether the hint is effective when executing `EXPLAIN`. It is usually located at the bottom of the `EXPLAIN` output.

Hint Log has three statuses:

```sql
+---------------------------------+
| Hint log:                       |
| Used:                           |
| UnUsed:                         |
| SyntaxError:                    |
+---------------------------------+
```

- `Used`：Indicates that the hint is effective.
- `UnUsed` 和 `SyntaxError`：Both indicate that the hint is not effective. SyntaxError indicates that there is a syntax error in using the hint or the syntax is not supported, and additional information about the unsupported reason will be provided.

Users can view the effectiveness and reasons for non-effectiveness through the Hint log, facilitating adjustments and verification.

## Summary

Hints are powerful tools for manually managing execution plans. Currently, Doris supports leading hint, ordered hint, distribute hint, etc., enabling users to manually manage join order, shuffle methods, and other variable configurations, providing users with more convenient and effective operational capabilities.


