---
{
    "title": "Hint",
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

Database Hint is a database query optimization technique used to guide the database query optimizer on how to execute specific queries. By providing hints, users can fine-tune the default behavior of the query optimizer in the hope of achieving better performance or meeting specific needs.

Role of Hints:

- Performance Optimization: Hints can influence the execution plan of the query optimizer, thereby enhancing query performance.

- Control of Execution Plan: They can specify the use of join methods, sorting methods, etc.

- Debugging and Testing: When debugging and testing query performance, hints can help identify the root cause of issues.

## Overview of Hints

In databases, a "Hint" is an instruction used to guide the query optimizer in formulating an execution plan. By embedding Hints in SQL statements, users can influence the optimizer's decisions and thereby select the desired execution path.

Here is a background example of using hints:

Suppose there is a table with a large amount of data, and in certain specific situations, you understand that the join order of the tables in a query may affect query performance. In such cases, the Leading Hint allows you to specify the table join order you hope the optimizer will follow.

Take the following SQL query as an example: If the execution efficiency is not ideal, we want to adjust the join order without changing the original SQL, so as not to affect the user's original scenario and achieve the purpose of optimization.

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
7 rows in set (0.06 sec)
```

At this point, we can use the Leading Hint to arbitrarily change the join order of tableA and tableB. For example:

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
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
12 rows in set (0.06 sec)
```

In this example, the Hint `/*+ leading(t2 t1) */` is used. This type of Hint informs the optimizer to use the specified table (t2) as the driving table in the execution plan and place it before (t1).

Currently, Doris mainly supports hints related to joins to specify the order or manner of join operations, including:

- LeadingHint: Primarily used to control the order of join operations.

- OrderedHint: Mainly used to fix the order of join operations, which can directly generate join operations based on the textual sequence of SQL writing.

- DistributeHint: Mainly used to fix the distribution properties of the right table in join operations.

- SetVarHint: Mainly used to set `sessionVariables` used within a single SQL statement, with effects lasting only during the lifecycle of that SQL statement.

Next, we will elaborate on how to use the above four types of JoinHints in Doris.

## How to use LeadingHint

Leading Hint is a powerful query optimization technique that allows users to guide the Doris optimizer in determining the join order of tables in a query plan. Correct usage of Leading Hint can significantly improve the performance of complex queries. This document will provide a detailed guide on how to use Leading Hint in Doris to control the join order.

### Syntax

Leading Hint allows you to specify the desired table join order for the optimizer to follow. In Doris, the basic syntax for Leading Hint is as follows:

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

Note:

1. Leading Hint is enclosed by `/*+` and `*/` and placed immediately after the `SELECT` keyword in the SQL statement.

2. `tablespec` refers to the table name or table alias, and at least two tables must be specified.

3. Multiple tables are separated by spaces.

4. Curly braces `{}` can be used to explicitly specify the shape of the Join Tree.

:::caution
There must be at least one space between the `/` at the end of Leading Hint and the SELECT list. Additionally, at least two tables must be specified for the Leading Hint to be considered valid. Curly braces can be used around any Join to explicitly define the shape of the Join Tree.
:::

Example:

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
+------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                              |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
12 rows in set (0.01 sec)
```

**1. When Leading Hint does not take effect, the query plan is generated through the normal process. EXPLAIN will show whether the Hint was used, indicated in three ways:**

- Used: Leading Hint takes effect normally.

- Unused: This includes scenarios where the specified join order in Leading Hint is not equivalent to the original SQL or is not supported in this version (see Limitations for details).

- SyntaxError: Indicates a syntax error in Leading Hint, such as an unrecognized table.

**2. Leading Hint syntax defaults to constructing a left-deep tree:**

Query statement:

```sql
select /leading(t1 t2 t3)/ * from t1 join t2 on... 
```

Result:

```sql
      join
     /    \
   join    t3
  /    \
 t1    t2

mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used: leading(t1 t2 t3)                                                        |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
15 rows in set (0.00 sec)
```

**3. Curly braces are also allowed to specify the shape of the Join tree:**

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
+----------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                  |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --PhysicalDistribute[DistributionSpecGather]                                     |
| ----PhysicalProject                                                              |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| --------PhysicalOlapScan[t1]                                                     |
| --------PhysicalDistribute[DistributionSpecHash]                                 |
| ----------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ------------PhysicalOlapScan[t2]                                                 |
| ------------PhysicalDistribute[DistributionSpecHash]                             |
| --------------PhysicalOlapScan[t3]                                               |
|                                                                                  |
| Hint log:                                                                        |
| Used: leading(t1 { t2 t3 })                                                      |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
15 rows in set (0.02 sec)
```

**4. When a View is used as an alias in JoinReorder, the corresponding View can be specified as a parameter for Leading Hint.** 

For example:

```sql
mysql> explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
  +--------------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                      |
  +--------------------------------------------------------------------------------------+
  | PhysicalResultSink                                                                   |
  | --hashAgg[GLOBAL]                                                                    |
  | ----PhysicalDistribute[DistributionSpecGather]                                       |
  | ------hashAgg[LOCAL]                                                                 |
  | --------PhysicalProject                                                              |
  | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
  | ------------PhysicalProject                                                          |
  | --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
  | ----------------PhysicalProject                                                      |
  | ------------------PhysicalOlapScan[t2]                                               |
  | ----------------PhysicalDistribute[DistributionSpecHash]                             |
  | ------------------PhysicalProject                                                    |
  | --------------------PhysicalOlapScan[t3]                                             |
  | ------------PhysicalDistribute[DistributionSpecHash]                                 |
  | --------------PhysicalProject                                                        |
  | ----------------PhysicalOlapScan[t1]                                                 |
  |                                                                                      |
  | Hint log:                                                                            |
  | Used: leading(alias t1)                                                              |
  | UnUsed:                                                                              |
  | SyntaxError:                                                                         |
  +--------------------------------------------------------------------------------------+
  21 rows in set (0.06 sec)
```

### Basic Use Cases

:::tip
In the following examples, column and table naming conventions are followed, e.g., when only t1 contains the c1 field, t1.c1 is simplified to c1 for brevity.
:::

Table creation statements:

```sql
CREATE DATABASE testleading;
USE testleading;

create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
```

Original plan:

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
7 rows in set (0.06 sec)
```

To swap the join order of t1 and t2, simply add `leading(t2 t1)` at the beginning. When executing `explain`, it will show whether the hint was used. Here, `Used` indicates the hint took effect normally.

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
+------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                              |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
12 rows in set (0.00 sec)
```

If there's a syntax error in Leading Hint, `explain` will show the error in `SyntaxError`, but the plan will still be generated normally without using the hint. For example:

```sql
mysql> explain shape plan select /*+ leading(t2 t3) */ * from t1 join t2 on t1.c1 = c2;
+--------------------------------------------------------+
| Explain String                                         |
+--------------------------------------------------------+
| PhysicalResultSink                                     |
| --PhysicalDistribute                                   |
| ----PhysicalProject                                    |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)              |
| --------PhysicalOlapScan[t1]                           |
| --------PhysicalDistribute                             |
| ----------PhysicalOlapScan[t2]                         |
|                                                        |
| Used:                                                  |
| UnUsed:                                                |
| SyntaxError: leading(t2 t3) Msg:can not find table: t3 |
+--------------------------------------------------------+
11 rows in set (0.01 sec)
```

### Advanced Scenarios

**1. Left-Deep Tree**

As mentioned earlier, Doris will default to generating a left-deep tree when no parentheses are used in the query statement with Leading Hint.

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used: leading(t1 t2 t3)                                                        |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
15 rows in set (0.10 sec)
```

**2. Right-Deep Tree**

When shaping the plan into a right-deep tree, bushy tree, or zig-zag tree, simply add curly braces to constrain the shape of the plan. There's no need to adjust step by step from a left-deep tree using swap, as in Oracle.

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
+-----------------------------------------------+
| Explain String                                |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)     |
| --------PhysicalOlapScan[t1]                  |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t2.c2 = t3.c3) |
| ------------PhysicalOlapScan[t2]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t3]            |
|                                               |
| Used: leading(t1 { t2 t3 })                   |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
14 rows in set (0.02 sec)
```

**3. Bushy Tree**

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
+-----------------------------------------------+
| Explain String                                |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t2.c2 = t3.c3)     |
| --------hashJoin[INNER_JOIN](t1.c1 = t2.c2)   |
| ----------PhysicalOlapScan[t1]                |
| ----------PhysicalDistribute                  |
| ------------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t3.c3 = t4.c4) |
| ------------PhysicalOlapScan[t3]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t4]            |
|                                               |
| Used: leading({ t1 t2 } { t3 t4 })            |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
17 rows in set (0.02 sec)
```

**4. Zig-Zag Tree**

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3} t4) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
+--------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                      |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --PhysicalDistribute[DistributionSpecGather]                                         |
| ----PhysicalProject                                                                  |
| ------hashJoin[INNER_JOIN] hashCondition=((t3.c3 = t4.c4)) otherCondition=()         |
| --------PhysicalDistribute[DistributionSpecHash]                                     |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| ------------PhysicalOlapScan[t1]                                                     |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalOlapScan[t2]                                                 |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalOlapScan[t3]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                                     |
| ----------PhysicalOlapScan[t4]                                                       |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(t1 { t2 t3 } t4)                                                       |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
19 rows in set (0.02 sec)
```

**5. Non-inner Join**

When encountering non-inner joins (such as Outer Join or Semi/Anti Join), Leading Hint automatically derives the join method based on the original SQL semantics. If the Leading Hint differs from the original SQL semantics or cannot be generated, it will be placed in `UnUsed`, but this does not affect the normal plan generation process.

Here's an example where swapping is not possible:

```sql
-------- test outer join which can not swap
-- t1 leftjoin (t2 join t3 on (P23)) on (P12) != (t1 leftjoin t2 on (P12)) join t3 on (P23)
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used:                                                                          |
| UnUsed: leading(t1 { t2 t3 })                                                  |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
15 rows in set (0.01 sec)
```

Below are some examples of swappable and non-swappable outer joins. Readers can verify them for themselves.

```sql
-------- test outer join which can swap
-- (t1 leftjoin t2  on (P12)) innerjoin t3 on (P13) = (t1 innerjoin t3 on (P13)) leftjoin t2  on (P12)
explain shape plan select * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;
explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;

-- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P13) = (t1 leftjoin t3 on (P13)) leftjoin t2  on (P12)
explain shape plan select * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;
explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;

-- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P23) = t1 leftjoin (t2  leftjoin t3 on (P23)) on (P12)
select /*+ leading(t2 t3 t1) SWAP_INPUT(t1) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;

-------- test outer join which can not swap
--  t1 leftjoin (t2  join t3 on (P23)) on (P12) != (t1 leftjoin t2  on (P12)) join t3 on (P23)
-- eliminated to inner join
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
explain graph select /*+ leading(t1 t2 t3) */ * from t1 left join (select * from t2 join t3 on c2 = c3) on c1 = c2;

-- test semi join
explain shape plan select * from t1 where c1 in (select c2 from t2);
explain shape plan select /*+ leading(t2 t1) */ * from t1 where c1 in (select c2 from t2);

-- test anti join
explain shape plan select * from t1 where exists (select c2 from t2);
```

**6. View**

In cases involving aliases, the alias can be specified as a complete and independent subtree, and the join order within these subtrees can be generated based on the textual order.

```sql
mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                      |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --hashAgg[GLOBAL]                                                                    |
| ----PhysicalDistribute[DistributionSpecGather]                                       |
| ------hashAgg[LOCAL]                                                                 |
| --------PhysicalProject                                                              |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
| ------------PhysicalProject                                                          |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalProject                                                      |
| ------------------PhysicalOlapScan[t2]                                               |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalProject                                                    |
| --------------------PhysicalOlapScan[t3]                                             |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------PhysicalProject                                                        |
| ----------------PhysicalOlapScan[t1]                                                 |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(alias t1)                                                              |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
21 rows in set (0.02 sec)
```

## How to use OrderedHint

OrderedHint is used to fix the shape of the Join Tree, causing it to be displayed and executed in the textual order of the tables specified in the query. This is particularly useful when precise control over the query plan is required.

The syntax for OrderedHint is `/*+ ORDERED */`, which should be placed immediately after the `SELECT` keyword in the `SELECT` statement, followed by the rest of the query.

Here's an example of using OrderedHint:

```sql
mysql> explain shape plan select /*+ ORDERED */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t2]                                               |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalProject                                                    |
| --------------PhysicalOlapScan[t1]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t3]                                               |
|                                                                                |
| Hint log:                                                                      |
| Used: ORDERED                                                                  |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
18 rows in set (0.02 sec)
```

**Relationship with LeadingHint**

When OrderedHint and LeadingHint are used simultaneously, OrderedHint takes precedence over LeadingHint. This means that even if LeadingHint is specified, if OrderedHint is also present, the query plan will be executed according to the rules of OrderedHint, and LeadingHint will be ignored.

Here's an example showing how the two hints behave when used together:

```sql
mysql> explain shape plan select /*+ ORDERED LEADING(t1 t2 t3) */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
  +--------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                |
  +--------------------------------------------------------------------------------+
  | PhysicalResultSink                                                             |
  | --PhysicalDistribute[DistributionSpecGather]                                   |
  | ----PhysicalProject                                                            |
  | ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
  | --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
  | ----------PhysicalProject                                                      |
  | ------------PhysicalOlapScan[t2]                                               |
  | ----------PhysicalDistribute[DistributionSpecHash]                             |
  | ------------PhysicalProject                                                    |
  | --------------PhysicalOlapScan[t1]                                             |
  | --------PhysicalDistribute[DistributionSpecHash]                               |
  | ----------PhysicalProject                                                      |
  | ------------PhysicalOlapScan[t3]                                               |
  |                                                                                |
  | Hint log:                                                                      |
  | Used: ORDERED                                                                  |
  | UnUsed: leading(t1 t2 t3)                                                      |
  | SyntaxError:                                                                   |
  +--------------------------------------------------------------------------------+
  18 rows in set (0.02 sec)
```

## How to use DistributeHint 

- Currently, only the Distribute Type for the right table in a Join can be specified, and only `[shuffle]` and `[broadcast]` are supported. It should be written before the right table of the Join, and both bracket `[]` and `/`*`+`*`/` notations are allowed.

- Any number of DistributeHints can be used.

- When encountering a DistributeHint that cannot properly generate a plan, the system will not display an error. Instead, it will apply the hint to the best of its ability, with the final Distribution method shown in EXPLAIN being the definitive version.

**1. Mixed Use with OrderedHint**

Fix the Join order using the textual sequence and then specify the expected Distribution method for the corresponding Join. For example:

Before use:

```sql
mysql> explain shape plan select count(*) from t1 join t2 on t1.c1 = t2.c2;
  +----------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                  |
  +----------------------------------------------------------------------------------+
  | PhysicalResultSink                                                               |
  | --hashAgg[GLOBAL]                                                                |
  | ----PhysicalDistribute[DistributionSpecGather]                                   |
  | ------hashAgg[LOCAL]                                                             |
  | --------PhysicalProject                                                          |
  | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
  | ------------PhysicalProject                                                      |
  | --------------PhysicalOlapScan[t1]                                               |
  | ------------PhysicalDistribute[DistributionSpecHash]                             |
  | --------------PhysicalProject                                                    |
  | ----------------PhysicalOlapScan[t2]                                             |
  +----------------------------------------------------------------------------------+
  11 rows in set (0.01 sec)
```

After use:

```sql
mysql> explain shape plan select /*+ ordered */ count(*) from t2 join[broadcast] t1 on t1.c1 = t2.c2;
+----------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                  |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg[GLOBAL]                                                                |
| ----PhysicalDistribute[DistributionSpecGather]                                   |
| ------hashAgg[LOCAL]                                                             |
| --------PhysicalProject                                                          |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan[t2]                                               |
| ------------PhysicalDistribute[DistributionSpecReplicated]                       |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan[t1]                                             |
|                                                                                  |
| Hint log:                                                                        |
| Used: ORDERED                                                                    |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
16 rows in set (0.01 sec)
```

The Explain Shape Plan will display information related to the Distribute operator. Specifically:

- DistributionSpecReplicated indicates that the corresponding data is replicated to all BE nodes.

- DistributionSpecGather indicates that data is gathered to the FE node.

- DistributionSpecHash indicates that data is distributed to different BE nodes based on a specific hashKey and algorithm.

**2. Mixed Use with LeadingHint**

When writing SQL queries, we can specify the corresponding `DISTRIBUTE` method for each `JOIN` operation while using the `LEADING` hint. The following is a specific example showing how to mix `DistributeHint` and `LeadingHint` in an SQL query.

```sql
explain shape plan
    select 
        nation,
        o_year,
        sum(amount) as sum_profit
    from
        (
            select
                /*+ leading(orders shuffle {lineitem shuffle part} shuffle {supplier broadcast nation} shuffle partsupp) */
                n_name as nation,
                extract(year from o_orderdate) as o_year,
                l_extendedprice * (1 - l_discount) - ps_supplycost * l_quantity as amount
            from
                part,
                supplier,
                lineitem,
                partsupp,
                orders,
                nation
            where
                s_suppkey = l_suppkey
                and ps_suppkey = l_suppkey
                and ps_partkey = l_partkey
                and p_partkey = l_partkey
                and o_orderkey = l_orderkey
                and s_nationkey = n_nationkey
                and p_name like '%green%'
        ) as profit
    group by
        nation,
        o_year
    order by
        nation,
        o_year desc;
```

## Reference

### 1 Hint Log

The Hint Log is primarily used to indicate whether a hint has taken effect during the execution of an `EXPLAIN` statement. It is typically displayed at the bottom of the `EXPLAIN` output.

The Hint Log has three states:

```sql
+---------------------------------+
| Hint log:                       |
| Used:                           |
| UnUsed:                         |
| SyntaxError:                    |
+---------------------------------+
```

- `Used`: Indicates that the hint has taken effect.

- `UnUsed` and `SyntaxError`: Both indicate that the hint has not taken effect. However, `SyntaxError` specifically denotes that there is an error in the syntax used for the hint or the syntax is not supported, and it is often accompanied by information about the reason for the unsupported operation.