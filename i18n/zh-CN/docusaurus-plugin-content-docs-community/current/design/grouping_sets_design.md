---
title: Doris GROUPING SETS 设计文档
language: zh-CN
description: Apache Doris GROUPING SETS、ROLLUP、CUBE 多维聚合子句及 GROUPING / GROUPING_ID 函数的语法与实现方案，含 FE 规划与 BE 执行设计。
keywords:
    - Apache Doris
    - GROUPING SETS
    - ROLLUP
    - CUBE
    - GROUPING
    - GROUPING_ID
    - 多维聚合
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

# GROUPING SETS 设计文档

<!-- 知识类型: 架构设计 -->
<!-- 知识类型: SQL 语法规范 -->
<!-- 适用场景: 内核理解 / 查询规划开发 -->

本文档描述 Apache Doris 中 `GROUPING SETS`、`ROLLUP`、`CUBE` 多维聚合子句以及 `GROUPING` / `GROUPING_ID` 函数的语法、语义与实现方案。

## 1. GROUPING SETS 相关背景知识

### 1.1 GROUPING SETS 子句

`GROUP BY GROUPING SETS` 是对 `GROUP BY` 子句的扩展，能够在单个 `GROUP BY` 子句中一次实现多种分组集合。其结果等价于对多个相应 `GROUP BY` 子句做 `UNION ALL` 操作。

特别地，一个空的子集意味着将所有的行聚集到一个分组。`GROUP BY` 子句是只含有一个元素的 `GROUP BY GROUPING SETS` 的特例。

例如，下面的 `GROUPING SETS` 语句：

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

其查询结果等价于：

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

下面是一个实际数据的例子：

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

### 1.2 ROLLUP 子句

`ROLLUP` 是对 `GROUPING SETS` 的扩展。

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

这个 `ROLLUP` 等价于下面的 `GROUPING SETS`：

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
)
```

### 1.3 CUBE 子句

`CUBE` 也是对 `GROUPING SETS` 的扩展。

```sql
CUBE (e1, e2, e3, ...)
```

其含义是 `GROUPING SETS` 后面列表中的所有子集。

例如，`CUBE (a, b, c)` 等价于下面的 `GROUPING SETS`：

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

### 1.4 GROUPING 和 GROUPING_ID 函数

<!-- 知识类型: 函数说明 -->

当未统计某一列时，它的值显示为 `NULL`；但列本身也可能含有 `NULL` 值，因此需要一种方式区分「未统计」和「值本身为 NULL」。为此引入 `GROUPING` 和 `GROUPING_ID` 函数。

| 函数 | 说明 |
|------|------|
| `GROUPING(column)` | 用于区分分组后的某一列是普通列还是聚合列。如果是聚合列返回 `1`，否则返回 `0`。只能传入一个参数列。 |
| `GROUPING_ID(column1, column2, ...)` | 根据指定的列顺序（或聚合时给出的集合元素顺序），计算这组列的 bitmap 值：聚合列为 `0`，否则为 `1`，最终返回该位向量的十进制值。例如 `[0 1 0] -> 2`，可从下述第三个查询看到这种对应关系。 |

例如，对于下面的表：

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

`GROUPING SETS` 的结果如下：

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

### 1.5 GROUPING SETS 的组合与嵌套

首先，一个 `GROUP BY` 子句本质上是一个 `GROUPING SETS` 的特例，例如：

```text
GROUP BY a
等同于
GROUP BY GROUPING SETS ((a))

GROUP BY a, b, c
等同于
GROUP BY GROUPING SETS ((a, b, c))
```

同样地，`CUBE` 和 `ROLLUP` 也可以展开为 `GROUPING SETS`，因此 `GROUP BY`、`CUBE`、`ROLLUP`、`GROUPING SETS` 的各种组合与嵌套本质上都是 `GROUPING SETS` 的组合与嵌套。

对于 `GROUPING SETS` 的嵌套，语义上等价于将嵌套内的语句直接写到外面（参考：<https://www.brytlyt.com/documentation/data-manipulation-dml/grouping-sets-rollup-cube/>），其中写道：

> The CUBE and ROLLUP constructs can be used either directly in the GROUP BY clause, or nested inside a GROUPING SETS clause. If one GROUPING SETS clause is nested inside another, the effect is the same as if all the elements of the inner clause had been written directly in the outer clause.

对于多个 `GROUPING SETS` 的组合列表，许多数据库认为其语义是叉乘（cross product）的关系。

例如：

```sql
GROUP BY a, CUBE (b, c), GROUPING SETS ((d), (e))

等同于：

GROUP BY GROUPING SETS (
    (a, b, c, d), (a, b, c, e),
    (a, b, d),    (a, b, e),
    (a, c, d),    (a, c, e),
    (a, d),       (a, e)
)
```

对于 `GROUPING SETS` 的组合与嵌套，各数据库支持情况不一致：

| 数据库 | 组合 | 嵌套 | 参考链接 |
|--------|------|------|----------|
| Snowflake | 不支持 | 不支持 | <https://docs.snowflake.net/manuals/sql-reference/constructs/group-by.html> |
| Oracle | 支持 | 支持 | <https://docs.oracle.com/cd/B19306_01/server.102/b14223/aggreg.htm#i1006842> |
| Presto | 支持 | 不支持 | <https://prestodb.github.io/docs/current/sql/select.html> |

## 2. 设计目标

从语法上支持 `GROUPING SETS`、`ROLLUP` 和 `CUBE`，实现上述 1.1、1.2、1.3、1.4 节描述的功能。

`GROUPING SETS` 的组合与嵌套（1.5 节）暂不实现。

具体语法如下。

### 2.1 GROUPING SETS 语法

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY GROUPING SETS ( groupSet [ , groupSet [ , ... ] ] )
[ ... ]

groupSet ::= { ( expr  [ , expr [ , ... ] ] ) }

<expr>
各种表达式，包括列名。
```

### 2.2 ROLLUP 语法

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY ROLLUP ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
各种表达式，包括列名。
```

### 2.3 CUBE 语法

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY CUBE ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
各种表达式，包括列名。
```

## 3. 实现方案

### 3.1 整体思路

既然 `GROUPING SETS` 子句逻辑上等价于多个相应 `GROUP BY` 子句的 `UNION ALL`，可以通过扩展输入行（此输入行已经通过下推条件过滤和投影），并在扩展行上执行一次 `GROUP BY` 操作来实现。

关键问题在于如何扩展输入行，下面举例说明。

例如，对于下面的语句：

```sql
SELECT a, b FROM src GROUP BY a, b GROUPING SETS ((a, b), (a), (b), ());
```

假定 `src` 表的数据如下：

```text
1, 2
3, 4
```

根据 `GROUPING SETS` 子句给出的列表，可以将输入行扩展为下面的 8 行（GROUPING SETS 集合数 × 行数），同时为每行生成全列对应的 `GROUPING_ID` 和其他 grouping 函数的值：

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

然后，将上面的 8 行数据作为输入，对 `a, b, GROUPING_ID` 进行 `GROUP BY` 操作即可。

### 3.2 具体例子验证说明

假设有一个 `t` 表，包含如下列和数据：

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

对于如下的查询：

```sql
SELECT k1, k2, GROUPING_ID(k1, k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

首先，对输入行进行扩展，每行数据扩展为 4 行（`GROUPING SETS` 子句的集合数），同时增加 `GROUPING_ID()` 列：

例如 `a, A, 1` 扩展后变成下面的 4 行：

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

最终，全部扩展后的输入行如下（总共 32 行）：

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

现在对 `k1, k2, GROUPING_ID(`k1`, `k2`)` 进行 `GROUP BY`：

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

可以看到，该结果与对 `GROUPING SETS` 子句后每个子集分别执行 `GROUP BY` 再做 `UNION ALL` 的结果一致：

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

### 3.3 FE 规划阶段

#### 3.3.1 主要任务

1. 引入 `GroupByClause` 类，封装 `GROUP BY` 相关信息，替换原有的 `groupingExprs`。
2. 增加 `GROUPING SETS`、`CUBE` 和 `ROLLUP` 的语法支持、语法检查、错误处理与错误信息。
3. 在 `SelectStmt` 类中增加 `GroupByClause` 成员。
4. 引入 `GroupingFunctionCallExpr` 类，封装 `grouping` 和 `grouping_id` 函数调用。
5. 引入 `VirtualSlot` 类，封装 `grouping`、`grouping_id` 生成的虚拟列与实际列之间的对应关系。
6. 增加虚拟列 `GROUPING_ID` 和其他 `grouping`、`grouping_id` 函数对应的虚拟列，并将这些列加入原有的 `groupingExprs` 表达式列表中。
7. 增加一个 `PlanNode`（考虑更通用的功能，命名为 `RepeatNode`）。对于 `GROUPING SETS` 的聚合，在执行计划中插入 `RepeatNode`。

#### 3.3.2 Tuple

在 `GroupByClause` 类中，为了将 `GROUPING_ID` 加入 `groupingExprs` 表达式列表，需要创建 virtual SlotRef；相应地，需要为这个 slot 创建一个 tuple，称为 `GROUPING_ID` Tuple。

对于 `RepeatNode` 这个执行计划，其输入是子节点的所有 tuple；输出 tuple 除了来自 repeat 子节点的数据外，还需要填写 `GROUPING_ID` 和其他 `grouping`、`grouping_id` 对应的虚拟列。

### 3.4 BE 查询执行阶段

主要任务：

1. 通过 `RepeatNode` 的执行类增加扩展输入行的逻辑：在聚合之前对原数据进行 repeat。具体做法是为每行增加一列 `GROUPING_ID`，按 `GROUPING SETS` 中的集合数对每行进行 repeat 并将对应列置为 `null`；根据 grouping list 设置新增虚拟列的值。
2. 实现 `grouping_id()` 和 `grouping()` 函数。
