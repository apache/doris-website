---
title: Controlling Join Order with Leading Hint
language: en
description: How to use Leading Hint in Doris to manually specify the multi-table Join order, solving complex query tuning problems.
keywords:
    - Doris Leading Hint
    - Join order control
    - Ordered Hint
    - Left-deep tree, right-deep tree, Bushy tree
    - Join Reorder tuning
    - SyntaxError UnUsed
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenario: Complex query performance tuning / Manual intervention in Join order -->

## One-Sentence Definition

Leading Hint is a query hint in Doris used to manually specify the multi-table Join order. By adding a `/*+ LEADING(...) */` comment after the `SELECT` keyword, it guides the optimizer to generate a Join plan in the specified order, thereby improving the performance of complex queries.

## Quick Look at Applicable Scenarios

<!-- Knowledge type: Scenario guide -->
<!-- Applicable scenario: Choosing the appropriate Hint type -->

Consider using Leading Hint or Ordered Hint in the following scenarios:

- The Join order automatically chosen by the optimizer is not ideal and manual intervention is needed.
- In complex multi-table Joins, you want to explicitly specify the shape of a left-deep tree, right-deep tree, Bushy tree, or zig-zag tree.
- A view or subquery participates in Join Reorder as an alias, and you need to position the entire subtree as a whole.
- You want to force the Join order to follow the order in which the tables are written in the SQL text (using Ordered Hint).

## Pre-Use Checklist

<!-- Knowledge type: Operation checklist -->

Before writing a Hint, confirm the following:

- [ ] The SQL contains at least two tables participating in the Join.
- [ ] The table names/aliases used in the Hint match those in the `FROM` clause.
- [ ] You have used `EXPLAIN SHAPE PLAN` to compare the original Plan with the target Plan.
- [ ] You have evaluated whether the target Join Order is semantically equivalent to the original SQL (especially in Outer Join / Semi / Anti Join scenarios).

## Quick Navigation

- [Regular Leading Hint](#regular-leading-hint): basic syntax, effective states, typical usage.
- [Typical Scenario Examples](#typical-scenario-examples): basic usage + left-deep tree / right-deep tree / Bushy tree / zig-zag tree / Non-inner Join / View.
- [Ordered Hint](#ordered-hint): a special case that fixes the Join order to the textual order.
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq): Hint not taking effect, priority with other Hints, and so on.

## Regular Leading Hint

<!-- Knowledge type: Syntax description -->

### Syntax

Leading Hint is used to specify the table join order that you want the optimizer to follow. In Doris, the basic syntax is as follows:

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

Syntax notes:

- A Leading Hint is enclosed by `/*+` and `*/`, and is placed after the `SELECT` keyword in the SQL statement.
- `tablespec` is a table name or table alias, and at least two tables must be specified.
- Multiple tables are separated by spaces or `,`.
- You can use curly braces `{}` to explicitly specify the shape of the Join Tree.

Minimal example:

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
```

### Hint Effective States

When a Leading Hint does not take effect, the normal flow generates the plan. `EXPLAIN` shows whether the Hint took effect, and there are three main states:

| State         | Description                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Used`        | The Leading Hint takes effect normally.                                                                                                    |
| `UnUsed`      | Cases not supported here include: the Join Order specified by the Leading Hint is not equivalent to the original SQL, or the feature is not yet supported in this version (see the limitations for details). |
| `SyntaxError` | The Leading Hint has a syntax error, for example, the corresponding table cannot be found.                                                 |

### Core Rules

1. **A left-deep tree is constructed by default**: when no parentheses are used, a Leading Hint constructs a left-deep tree by default.

    ```sql
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
    ```

2. **Use curly braces to specify the Join tree shape**: with `{}`, you can explicitly control the shape of the Join Tree.

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
    ```

3. **Views / aliases are supported as parameters**: when a view participates in Join Reorder as an alias, you can specify the corresponding view as a parameter to the Leading Hint.

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
    ```

## Typical Scenario Examples

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Learning Leading Hint usage / Copying examples for verification -->

### Preparation: Table Creation Statements

The following examples are all based on this set of test tables.

```sql
CREATE DATABASE testleading;
USE testleading;

create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
```

### Basic Scenario: Swapping the Join Order of Two Tables

1. Original Plan:

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

2. To swap the Join order of t1 and t2, simply prepend `leading(t2 t1)`. When you run `EXPLAIN`, `Used` indicates that the Hint takes effect normally.

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
    ```

3. If the Leading Hint contains a syntax error, the corresponding information is shown under `SyntaxError` in the `EXPLAIN` output, but the plan is still generated as usual; the Leading Hint is simply not used.

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
    ```

### Extended Scenario: Constructing Different Join Tree Shapes

The following table summarizes the syntax for the four common Join tree shapes:

| Shape          | Leading syntax              | Description                                       |
| -------------- | --------------------------- | ------------------------------------------------- |
| Left-deep tree | `leading(t1 t2 t3)`         | The default behavior; no curly braces needed.     |
| Right-deep tree| `leading(t1 {t2 t3})`       | Wrap the right subtree with `{}`.                 |
| Bushy tree     | `leading({t1 t2} {t3 t4})`  | Wrap both the left and right subtrees with `{}`.  |
| Zig-zag tree   | `leading(t1 {t2 t3} t4)`    | Embed a subtree in the middle to form a zig-zag.  |

#### Left-Deep Tree

As mentioned earlier, when no parentheses are used, a Leading Hint generates a left-deep tree by default.

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
```

#### Right-Deep Tree

To shape the plan as a right-deep tree, Bushy tree, or zig-zag tree, simply add curly braces to constrain the Plan shape. There is no need to swap step by step from a left-deep tree as in Oracle.

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
```

#### Bushy Tree

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
```

#### Zig-Zag Tree

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
```

### Non-inner Join Scenarios

When non-Inner Joins are involved (such as Outer Joins or Semi/Anti Joins), the Leading Hint automatically derives the type of each Join based on the original SQL semantics. If the Leading Hint differs from the original SQL semantics or cannot be generated, it is placed in `UnUsed`. This does not affect normal plan generation.

The following is an example that cannot be swapped:

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
```

The following are some examples that can and cannot be swapped, which readers can verify on their own.

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

### View / Alias Scenarios

When aliases are involved, you can specify the alias as a complete, independent subtree, and within these subtrees the Join order is generated according to the textual order.

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
```

## Ordered Hint

<!-- Knowledge type: Feature description -->
<!-- Applicable scenario: Forcing the Join order to follow the SQL textual order -->

Ordered Hint can be regarded as a special case of Leading Hint, used to force the Join Order to match the SQL textual order.

### Syntax

The syntax of Ordered Hint is `/*+ ORDERED */`. It is placed after the `SELECT` keyword in the `SELECT` statement, immediately followed by the rest of the query.

### Example

The following is an example of using Ordered Hint:

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
```

### Priority Relationship with Leading Hint

When Ordered Hint and Leading Hint are used at the same time, Ordered Hint takes priority over Leading Hint. This means that even if a Leading Hint is specified, when an Ordered Hint is also present, the query plan executes according to the rules of the Ordered Hint, and the Leading Hint is ignored.

The following example shows the situation when both are used at the same time:

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
```

## Leading Hint vs Ordered Hint Comparison

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Choosing the appropriate Hint -->

| Dimension              | Leading Hint                                        | Ordered Hint                                                                |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Syntax                 | `/*+ LEADING(t1 t2 ...) */`                         | `/*+ ORDERED */`                                                            |
| Join order             | Follows the order in which tables are listed in the Hint | Follows the order in which tables are written in the SQL `FROM` clause |
| Control of Join tree shape | Supported, explicitly specified with `{}`        | Not supported; fixed as a left-deep tree                                    |
| Flexibility            | High; can specify any shape of Join tree            | Low; only follows the textual order                                         |
| When used together     | Placed in `UnUsed`                                  | Takes priority                                                              |

## Frequently Asked Questions (FAQ)

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Hint not taking effect / Error troubleshooting -->

### Q1: Why does the Leading Hint appear in `UnUsed` instead of `Used` in `EXPLAIN`?

There are usually two types of reasons:

- The Join Order specified by the Leading Hint is not semantically equivalent to the original SQL (for example, an Outer Join scenario that cannot be swapped).
- The current version does not yet support this feature.

In this case, Doris falls back to the normal plan generation flow, and the query can still execute normally.

### Q2: What should I do if `SyntaxError` reports that a table cannot be found?

`SyntaxError` indicates that the Hint itself has a syntax error. For example, in `leading(t2 t3)`, `t3` does not appear in the `FROM` clause of the SQL. Check whether the table names or aliases in the Hint match those actually used in the SQL.

### Q3: Which one takes effect when Ordered Hint and Leading Hint are used at the same time?

Ordered Hint has higher priority. When both are present, the query executes according to the Ordered Hint (the Join order follows the SQL textual order), and the Leading Hint is placed in `UnUsed`.

### Q4: What shape of Join tree is generated by default? How do I adjust it?

When no curly braces are used, a left-deep tree is generated by default. To produce a right-deep tree, Bushy tree, or zig-zag tree, use curly braces `{}` to explicitly specify the shape, without needing to swap step by step from a left-deep tree as in Oracle.

### Q5: Do the table names in a Hint need to be fully qualified?

No. The table names/aliases in a Hint only need to match the names used in the `FROM` clause of the current query. A database name prefix is not required.

## Summary

Leading Hint is a powerful feature for manually controlling the Join Order, and is widely used in production tuning. Used appropriately, Leading Hint can meet on-site Join Order tuning needs and improve the flexibility of system control. Ordered Hint is a special form of Leading Hint, used to fix the Join Order of the current workload to the textual order. When using it, pay attention to its priority relationship with other Hints.
