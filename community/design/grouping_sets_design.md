---
title: Doris GROUPING SETS Design Document
language: en
description: Syntax and implementation plan for the Apache Doris GROUPING SETS, ROLLUP, and CUBE multidimensional aggregation clauses and the GROUPING / GROUPING_ID functions, including FE planning and BE execution design.
keywords:
    - Apache Doris
    - GROUPING SETS
    - ROLLUP
    - CUBE
    - GROUPING
    - GROUPING_ID
    - multidimensional aggregation
    - RepeatNode
    - OLAP
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

# GROUPING SETS Design Document

<!-- Knowledge type: Architecture design -->
<!-- Knowledge type: SQL syntax specification -->
<!-- Applicable scenario: Kernel understanding / Query planning development -->

This document describes the syntax, semantics, and implementation plan for the `GROUPING SETS`, `ROLLUP`, and `CUBE` multidimensional aggregation clauses and the `GROUPING` / `GROUPING_ID` functions in Apache Doris.

## 1. Background on GROUPING SETS

### 1.1 The GROUPING SETS Clause

`GROUP BY GROUPING SETS` is an extension of the `GROUP BY` clause. It produces multiple grouping sets within a single `GROUP BY` clause, and the result is equivalent to `UNION ALL` of multiple corresponding `GROUP BY` clauses.

In particular, an empty subset means aggregating all rows into a single group. A `GROUP BY` clause is a special case of `GROUP BY GROUPING SETS` with only one element.

For example, the following `GROUPING SETS` statement:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

Its query result is equivalent to:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

Here is an example with real data:

```sql
mysql> SELECT * FROM t;
+------+------+------+
| k1   | k2   | k3   |
+------+------+------+
| a    | A    |    1 |
| a    | A    |    2 |
| a    | B    |    1 |
| a    | B    |    3 |
| b    | A    |    1 |
| b    | A    |    4 |
| b    | B    |    1 |
| b    | B    |    5 |
+------+------+------+
8 rows in set (0.01 sec)

mysql> SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k2), (k1), ());
+------+------+-----------+
| k1   | k2   | sum(`k3`) |
+------+------+-----------+
| b    | B    |         6 |
| a    | B    |         4 |
| a    | A    |         3 |
| b    | A    |         5 |
| NULL | B    |        10 |
| NULL | A    |         8 |
| a    | NULL |         7 |
| b    | NULL |        11 |
| NULL | NULL |        18 |
+------+------+-----------+
9 rows in set (0.06 sec)
```

### 1.2 The ROLLUP Clause

`ROLLUP` is an extension of `GROUPING SETS`.

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

This `ROLLUP` is equivalent to the following `GROUPING SETS`:

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
)
```

### 1.3 The CUBE Clause

`CUBE` is also an extension of `GROUPING SETS`.

```sql
CUBE (e1, e2, e3, ...)
```

It means all subsets of the list following `GROUPING SETS`.

For example, `CUBE (a, b, c)` is equivalent to the following `GROUPING SETS`:

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a,    c),
    (a),
    (   b, c),
    (   b),
    (      c),
    ()
)
```

### 1.4 The GROUPING and GROUPING_ID Functions

<!-- Knowledge type: Function description -->

When a column is not aggregated, its value is shown as `NULL`. However, the column itself may also contain `NULL` values, so a way is needed to distinguish "not aggregated" from "the value itself is NULL". The `GROUPING` and `GROUPING_ID` functions are introduced for this purpose.

| Function | Description |
|------|------|
| `GROUPING(column)` | Distinguishes whether a column after grouping is a regular column or an aggregated column. Returns `1` if it is an aggregated column, otherwise `0`. Accepts only one column argument. |
| `GROUPING_ID(column1, column2, ...)` | Computes the bitmap value of the given columns according to the specified column order (or the order of set elements at aggregation time): aggregated columns are `0`, otherwise `1`, and finally returns the decimal value of this bit vector. For example, `[0 1 0] -> 2`. The third query below illustrates this correspondence. |

For example, given the following table:

```sql
mysql> SELECT * FROM t;
+------+------+------+
| k1   | k2   | k3   |
+------+------+------+
| a    | A    |    1 |
| a    | A    |    2 |
| a    | B    |    1 |
| a    | B    |    3 |
| b    | A    |    1 |
| b    | A    |    4 |
| b    | B    |    1 |
| b    | B    |    5 |
+------+------+------+
```

The result of `GROUPING SETS` is as follows:

```sql
mysql> SELECT k1, k2, GROUPING(k1), GROUPING(k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k2), (k1), ());
+------+------+----------------+----------------+-----------+
| k1   | k2   | grouping(`k1`) | grouping(`k2`) | sum(`k3`) |
+------+------+----------------+----------------+-----------+
| a    | A    |              0 |              0 |         3 |
| a    | B    |              0 |              0 |         4 |
| a    | NULL |              0 |              1 |         7 |
| b    | A    |              0 |              0 |         5 |
| b    | B    |              0 |              0 |         6 |
| b    | NULL |              0 |              1 |        11 |
| NULL | A    |              1 |              0 |         8 |
| NULL | B    |              1 |              0 |        10 |
| NULL | NULL |              1 |              1 |        18 |
+------+------+----------------+----------------+-----------+
9 rows in set (0.02 sec)

mysql> SELECT k1, k2, GROUPING_ID(k1, k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k2), (k1), ());
+------+------+-------------------------+-----------+
| k1   | k2   | grouping_id(`k1`, `k2`) | sum(`k3`) |
+------+------+-------------------------+-----------+
| a    | A    |                       0 |         3 |
| a    | B    |                       0 |         4 |
| a    | NULL |                       1 |         7 |
| b    | A    |                       0 |         5 |
| b    | B    |                       0 |         6 |
| b    | NULL |                       1 |        11 |
| NULL | A    |                       2 |         8 |
| NULL | B    |                       2 |        10 |
| NULL | NULL |                       3 |        18 |
+------+------+-------------------------+-----------+
9 rows in set (0.02 sec)

mysql> SELECT k1, k2, grouping(k1), grouping(k2), GROUPING_ID(k1, k2), SUM(k4) FROM t GROUP BY GROUPING SETS ((k1, k2), (k2), (k1), ()) ORDER BY k1, k2;
+------+------+----------------+----------------+-------------------------+-----------+
| k1   | k2   | grouping(`k1`) | grouping(`k2`) | grouping_id(`k1`, `k2`) | sum(`k4`) |
+------+------+----------------+----------------+-------------------------+-----------+
| a    | A    |              0 |              0 |                       0 |         3 |
| a    | B    |              0 |              0 |                       0 |         4 |
| a    | NULL |              0 |              1 |                       1 |         7 |
| b    | A    |              0 |              0 |                       0 |         5 |
| b    | B    |              0 |              0 |                       0 |         6 |
| b    | NULL |              0 |              1 |                       1 |        11 |
| NULL | A    |              1 |              0 |                       2 |         8 |
| NULL | B    |              1 |              0 |                       2 |        10 |
| NULL | NULL |              1 |              1 |                       3 |        18 |
+------+------+----------------+----------------+-------------------------+-----------+
9 rows in set (0.02 sec)
```

### 1.5 Composition and Nesting of GROUPING SETS

First, a `GROUP BY` clause is essentially a special case of `GROUPING SETS`. For example:

```text
GROUP BY a
is equivalent to
GROUP BY GROUPING SETS ((a))

GROUP BY a, b, c
is equivalent to
GROUP BY GROUPING SETS ((a, b, c))
```

Likewise, `CUBE` and `ROLLUP` can also be expanded into `GROUPING SETS`. Therefore, any composition or nesting of `GROUP BY`, `CUBE`, `ROLLUP`, and `GROUPING SETS` is essentially a composition or nesting of `GROUPING SETS`.

For the nesting of `GROUPING SETS`, the semantics are equivalent to writing the nested clause directly at the outer level (reference: <https://www.brytlyt.com/documentation/data-manipulation-dml/grouping-sets-rollup-cube/>), which states:

> The CUBE and ROLLUP constructs can be used either directly in the GROUP BY clause, or nested inside a GROUPING SETS clause. If one GROUPING SETS clause is nested inside another, the effect is the same as if all the elements of the inner clause had been written directly in the outer clause.

For the composition of multiple `GROUPING SETS` lists, many databases treat the semantics as a cross product.

For example:

```sql
GROUP BY a, CUBE (b, c), GROUPING SETS ((d), (e))

is equivalent to:

GROUP BY GROUPING SETS (
    (a, b, c, d), (a, b, c, e),
    (a, b, d),    (a, b, e),
    (a, c, d),    (a, c, e),
    (a, d),       (a, e)
)
```

Support for the composition and nesting of `GROUPING SETS` varies among databases:

| Database | Composition | Nesting | Reference |
|--------|------|------|----------|
| Snowflake | Not supported | Not supported | <https://docs.snowflake.net/manuals/sql-reference/constructs/group-by.html> |
| Oracle | Supported | Supported | <https://docs.oracle.com/cd/B19306_01/server.102/b14223/aggreg.htm#i1006842> |
| Presto | Supported | Not supported | <https://prestodb.github.io/docs/current/sql/select.html> |

## 2. Design Goals

Support `GROUPING SETS`, `ROLLUP`, and `CUBE` syntactically, and implement the features described in Sections 1.1, 1.2, 1.3, and 1.4 above.

The composition and nesting of `GROUPING SETS` (Section 1.5) is not implemented for now.

The specific syntax is as follows.

### 2.1 GROUPING SETS Syntax

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY GROUPING SETS ( groupSet [ , groupSet [ , ... ] ] )
[ ... ]

groupSet ::= { ( expr  [ , expr [ , ... ] ] ) }

<expr>
Various expressions, including column names.
```

### 2.2 ROLLUP Syntax

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY ROLLUP ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

### 2.3 CUBE Syntax

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY CUBE ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

## 3. Implementation Plan

### 3.1 Overall Approach

Since a `GROUPING SETS` clause is logically equivalent to the `UNION ALL` of multiple corresponding `GROUP BY` clauses, it can be implemented by expanding input rows (these input rows have already been filtered by pushed-down predicates and projected) and performing a single `GROUP BY` operation on the expanded rows.

The key question is how to expand the input rows. The following example illustrates this.

For example, given the following statement:

```sql
SELECT a, b FROM src GROUP BY a, b GROUPING SETS ((a, b), (a), (b), ());
```

Assume the data in the `src` table is as follows:

```text
1, 2
3, 4
```

According to the list given by the `GROUPING SETS` clause, the input rows can be expanded into the following 8 rows (number of GROUPING SETS x number of rows), and the corresponding `GROUPING_ID` and other grouping function values for all columns are generated for each row:

```text
1, 2       (GROUPING_ID: a, b       -> 00 -> 0)
1, null    (GROUPING_ID: a, null    -> 01 -> 1)
null, 2    (GROUPING_ID: null, b    -> 10 -> 2)
null, null (GROUPING_ID: null, null -> 11 -> 3)

3, 4       (GROUPING_ID: a, b       -> 00 -> 0)
3, null    (GROUPING_ID: a, null    -> 01 -> 1)
null, 4    (GROUPING_ID: null, b    -> 10 -> 2)
null, null (GROUPING_ID: null, null -> 11 -> 3)
```

Then, take the 8 rows above as input and perform a `GROUP BY` operation on `a, b, GROUPING_ID`.

### 3.2 Worked Example

Assume there is a table `t` with the following columns and data:

```sql
mysql> SELECT * FROM t;
+------+------+------+
| k1   | k2   | k3   |
+------+------+------+
| a    | A    |    1 |
| a    | A    |    2 |
| a    | B    |    1 |
| a    | B    |    3 |
| b    | A    |    1 |
| b    | A    |    4 |
| b    | B    |    1 |
| b    | B    |    5 |
+------+------+------+
8 rows in set (0.01 sec)
```

For the following query:

```sql
SELECT k1, k2, GROUPING_ID(k1, k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

First, expand the input rows. Each row of data is expanded into 4 rows (the number of sets in the `GROUPING SETS` clause), and a `GROUPING_ID()` column is added:

For example, `a, A, 1` is expanded into the following 4 rows:

```text
+------+------+------+-------------------------+
| k1   | k2   | k3   | GROUPING_ID(`k1`, `k2`) |
+------+------+------+-------------------------+
| a    | A    |    1 |                       0 |
| a    | NULL |    1 |                       1 |
| NULL | A    |    1 |                       2 |
| NULL | NULL |    1 |                       3 |
+------+------+------+-------------------------+
```

After all rows are expanded, the input rows are as follows (32 rows in total):

```text
+------+------+------+-------------------------+
| k1   | k2   | k3   | GROUPING_ID(`k1`, `k2`) |
+------+------+------+-------------------------+
| a    | A    |    1 |                       0 |
| a    | A    |    2 |                       0 |
| a    | B    |    1 |                       0 |
| a    | B    |    3 |                       0 |
| b    | A    |    1 |                       0 |
| b    | A    |    4 |                       0 |
| b    | B    |    1 |                       0 |
| b    | B    |    5 |                       0 |
| a    | NULL |    1 |                       1 |
| a    | NULL |    1 |                       1 |
| a    | NULL |    2 |                       1 |
| a    | NULL |    3 |                       1 |
| b    | NULL |    1 |                       1 |
| b    | NULL |    1 |                       1 |
| b    | NULL |    4 |                       1 |
| b    | NULL |    5 |                       1 |
| NULL | A    |    1 |                       2 |
| NULL | A    |    1 |                       2 |
| NULL | A    |    2 |                       2 |
| NULL | A    |    4 |                       2 |
| NULL | B    |    1 |                       2 |
| NULL | B    |    1 |                       2 |
| NULL | B    |    3 |                       2 |
| NULL | B    |    5 |                       2 |
| NULL | NULL |    1 |                       3 |
| NULL | NULL |    1 |                       3 |
| NULL | NULL |    1 |                       3 |
| NULL | NULL |    1 |                       3 |
| NULL | NULL |    2 |                       3 |
| NULL | NULL |    3 |                       3 |
| NULL | NULL |    4 |                       3 |
| NULL | NULL |    5 |                       3 |
+------+------+------+-------------------------+
32 rows in set.
```

Now perform `GROUP BY` on `k1, k2, GROUPING_ID(`k1`, `k2`)`:

```text
+------+------+-------------------------+-----------+
| k1   | k2   | grouping_id(`k1`, `k2`) | sum(`k3`) |
+------+------+-------------------------+-----------+
| a    | A    |                       0 |         3 |
| a    | B    |                       0 |         4 |
| a    | NULL |                       1 |         7 |
| b    | A    |                       0 |         5 |
| b    | B    |                       0 |         6 |
| b    | NULL |                       1 |        11 |
| NULL | A    |                       2 |         8 |
| NULL | B    |                       2 |        10 |
| NULL | NULL |                       3 |        18 |
+------+------+-------------------------+-----------+
9 rows in set (0.02 sec)
```

This result matches the result of executing `GROUP BY` for each subset following the `GROUPING SETS` clause and then performing `UNION ALL`:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;

+------+------+-----------+
| k1   | k2   | sum(`k3`) |
+------+------+-----------+
| b    | B    |         6 |
| b    | A    |         5 |
| a    | A    |         3 |
| a    | B    |         4 |
| a    | NULL |         7 |
| b    | NULL |        11 |
| NULL | B    |        10 |
| NULL | A    |         8 |
| NULL | NULL |        18 |
+------+------+-----------+
9 rows in set (0.06 sec)
```

### 3.3 FE Planning Phase

#### 3.3.1 Main Tasks

1. Introduce the `GroupByClause` class to encapsulate `GROUP BY` related information, replacing the original `groupingExprs`.
2. Add syntax support, syntax checking, error handling, and error messages for `GROUPING SETS`, `CUBE`, and `ROLLUP`.
3. Add a `GroupByClause` member to the `SelectStmt` class.
4. Introduce the `GroupingFunctionCallExpr` class to encapsulate calls to the `grouping` and `grouping_id` functions.
5. Introduce the `VirtualSlot` class to encapsulate the mapping between the virtual columns generated by `grouping` and `grouping_id` and the actual columns.
6. Add the virtual column `GROUPING_ID` and the virtual columns corresponding to other `grouping` and `grouping_id` functions, and add these columns to the original `groupingExprs` expression list.
7. Add a `PlanNode` (named `RepeatNode` for more general functionality). Insert a `RepeatNode` into the execution plan for `GROUPING SETS` aggregation.

#### 3.3.2 Tuple

In the `GroupByClause` class, to add `GROUPING_ID` to the `groupingExprs` expression list, a virtual SlotRef must be created. Accordingly, a tuple must be created for this slot, called the `GROUPING_ID` Tuple.

For the `RepeatNode` execution plan, its input is all the tuples from its child nodes. The output tuple contains not only the data from the repeat child node but also the values for `GROUPING_ID` and the virtual columns corresponding to other `grouping` and `grouping_id` functions.

### 3.4 BE Query Execution Phase

Main tasks:

1. Add the row-expansion logic through the execution class of `RepeatNode`: repeat the original data before aggregation. Specifically, add a `GROUPING_ID` column to each row, repeat each row according to the number of sets in `GROUPING SETS`, and set the corresponding columns to `null`. Set the values of the newly added virtual columns according to the grouping list.
2. Implement the `grouping_id()` and `grouping()` functions.
