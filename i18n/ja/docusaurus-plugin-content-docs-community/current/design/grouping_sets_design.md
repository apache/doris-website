---
title: Doris GROUPING SETS 設計文書
language: ja
description: Apache Doris の多次元集約句 GROUPING SETS、ROLLUP、CUBE、および GROUPING / GROUPING_ID 関数の構文と実装計画。FE のプランニングと BE の実行設計を含みます。
keywords:
    - Apache Doris
    - GROUPING SETS
    - ROLLUP
    - CUBE
    - GROUPING
    - GROUPING_ID
    - 多次元集約
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

# GROUPING SETS 設計文書

<!-- Knowledge type: Architecture design -->
<!-- Knowledge type: SQL syntax specification -->
<!-- Applicable scenario: Kernel understanding / Query planning development -->

この文書では、Apache Doris の多次元集約句 `GROUPING SETS`、`ROLLUP`、`CUBE` と、`GROUPING` / `GROUPING_ID` 関数の構文、意味、および実装計画について説明します。

## 1. GROUPING SETS の背景

### 1.1 GROUPING SETS 句

`GROUP BY GROUPING SETS` は `GROUP BY` 句の拡張です。一つの `GROUP BY` 句で複数のグループ化セットを生成します。その結果は、`UNION ALL` で対応する複数の `GROUP BY` 句の結果を結合したものと等価です。

特に、空の部分集合は、すべての行を単一のグループに集約することを意味します。`GROUP BY` 句は、要素が一つだけの `GROUP BY GROUPING SETS` の特殊なケースです。

たとえば、次の `GROUPING SETS` 文があります。

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

このクエリの結果は、次のクエリの結果と等価です。

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

実際のデータを使った例を次に示します。

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

### 1.2 ROLLUP 句

`ROLLUP` は `GROUPING SETS` の拡張です。

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

この `ROLLUP` は、次の `GROUPING SETS` と等価です。

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
)
```

### 1.3 CUBE 句

`CUBE` も `GROUPING SETS` の拡張です。

```sql
CUBE (e1, e2, e3, ...)
```

これは、`GROUPING SETS` に続くリストのすべての部分集合を意味します。

たとえば、`CUBE (a, b, c)` は次の `GROUPING SETS` と等価です。

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

### 1.4 GROUPING 関数と GROUPING_ID 関数

<!-- Knowledge type: Function description -->

列が集約されない場合、その値は `NULL` として表示されます。ただし、列自体に `NULL` 値が含まれることもあるため、「集約されなかった」場合と「値自体が NULL である」場合を区別する方法が必要です。この目的のために、`GROUPING` 関数と `GROUPING_ID` 関数を導入します。

| 関数 | 説明 |
|------|------|
| `GROUPING(column)` | グループ化後の列が通常の列か集約された列かを区別します。集約された列なら `1`、それ以外なら `0` を返します。引数には列を一つだけ指定できます。 |
| `GROUPING_ID(column1, column2, ...)` | 指定した列の順序（または集約時のセット要素の順序）に従ってビットマップ値を計算します。集約された列を `0`、それ以外を `1` とし、最後にこのビットベクトルの十進値を返します。たとえば、`[0 1 0] -> 2` です。以下の三番目のクエリは、この対応関係を示しています。 |

たとえば、次のテーブルがあるとします。

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

`GROUPING SETS` の結果は次のとおりです。

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

### 1.5 GROUPING SETS の組み合わせと入れ子

まず、`GROUP BY` 句は本質的に `GROUPING SETS` の特殊なケースです。たとえば、次のようになります。

```text
GROUP BY a
is equivalent to
GROUP BY GROUPING SETS ((a))

GROUP BY a, b, c
is equivalent to
GROUP BY GROUPING SETS ((a, b, c))
```

同様に、`CUBE` と `ROLLUP` も `GROUPING SETS` に展開できます。したがって、`GROUP BY`、`CUBE`、`ROLLUP`、`GROUPING SETS` の組み合わせや入れ子は、本質的に `GROUPING SETS` の組み合わせや入れ子です。

`GROUPING SETS` を入れ子にした場合の意味は、内側の句を外側の階層に直接記述した場合と等価です（参照: <https://www.brytlyt.com/documentation/data-manipulation-dml/grouping-sets-rollup-cube/>）。参照先では次のように説明されています。

> CUBE 構文と ROLLUP 構文は、GROUP BY 句で直接使用することも、GROUPING SETS 句の中に入れ子にすることもできます。ある GROUPING SETS 句を別の GROUPING SETS 句の中に入れ子にした場合、その効果は内側の句のすべての要素を外側の句に直接記述した場合と同じです。

複数の `GROUPING SETS` リストを組み合わせた場合、多くのデータベースでは直積として扱います。

たとえば、次のようになります。

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

`GROUPING SETS` の組み合わせと入れ子のサポート状況は、データベースによって異なります。

| データベース | 組み合わせ | 入れ子 | 参照 |
|--------|------|------|----------|
| Snowflake | 非対応 | 非対応 | <https://docs.snowflake.net/manuals/sql-reference/constructs/group-by.html> |
| Oracle | 対応 | 対応 | <https://docs.oracle.com/cd/B19306_01/server.102/b14223/aggreg.htm#i1006842> |
| Presto | 対応 | 非対応 | <https://prestodb.github.io/docs/current/sql/select.html> |

## 2. 設計目標

`GROUPING SETS`、`ROLLUP`、`CUBE` の構文をサポートし、上記のセクション 1.1、1.2、1.3、1.4 で説明した機能を実装します。

`GROUPING SETS` の組み合わせと入れ子（セクション 1.5）は、現時点では実装しません。

具体的な構文は次のとおりです。

### 2.1 GROUPING SETS の構文

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

### 2.2 ROLLUP の構文

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY ROLLUP ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

### 2.3 CUBE の構文

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY CUBE ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

## 3. 実装計画

### 3.1 全体的な方針

`GROUPING SETS` 句は、`UNION ALL` で対応する複数の `GROUP BY` 句の結果を結合したものと論理的に等価です。そのため、入力行（プッシュダウンされた述語によるフィルタリングと射影がすでに行われています）を展開し、展開後の行に対して `GROUP BY` を一度実行することで実装できます。

重要なのは入力行の展開方法です。次の例で説明します。

たとえば、次の文があるとします。

```sql
SELECT a, b FROM src GROUP BY a, b GROUPING SETS ((a, b), (a), (b), ());
```

`src` テーブルのデータが次のとおりだとします。

```text
1, 2
3, 4
```

`GROUPING SETS` 句で指定したリストに従って、入力行を次の 8 行（GROUPING SETS の数 × 入力行数）に展開できます。また、各行について、すべての列に対応する `GROUPING_ID` とその他のグループ化関数の値を生成します。

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

次に、上記の 8 行を入力として `GROUP BY` を `a, b, GROUPING_ID` に対して実行します。

### 3.2 具体例

次の列とデータを持つテーブル `t` があるとします。

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

次のクエリについて考えます。

```sql
SELECT k1, k2, GROUPING_ID(k1, k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

まず入力行を展開します。各データ行は 4 行（`GROUPING SETS` 句に含まれるセットの数）に展開され、`GROUPING_ID()` 列が追加されます。

たとえば、`a, A, 1` は次の 4 行に展開されます。

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

すべての行を展開すると、入力行は次のようになります（合計 32 行）。

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

次に、`GROUP BY` を `k1, k2, GROUPING_ID(`k1`, `k2`)` に対して実行します。

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

この結果は、`GROUP BY` を `GROUPING SETS` 句に続く各部分集合に対して実行し、その結果を `UNION ALL` で結合したものと一致します。

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

### 3.3 FE のプランニング段階

#### 3.3.1 主な作業

1. `GroupByClause` クラスを導入し、`GROUP BY` に関する情報をカプセル化して、元の `groupingExprs` を置き換えます。
2. `GROUPING SETS`、`CUBE`、`ROLLUP` の構文サポート、構文チェック、エラー処理、エラーメッセージを追加します。
3. `GroupByClause` メンバーを `SelectStmt` クラスに追加します。
4. `GroupingFunctionCallExpr` クラスを導入し、`grouping` 関数と `grouping_id` 関数の呼び出しをカプセル化します。
5. `VirtualSlot` クラスを導入し、`grouping` と `grouping_id` によって生成される仮想列と実際の列との対応関係をカプセル化します。
6. 仮想列 `GROUPING_ID` と、その他の `grouping` 関数および `grouping_id` 関数に対応する仮想列を追加し、これらの列を元の `groupingExprs` 式リストに追加します。
7. `PlanNode` を追加します（より汎用的な機能を表すため、`RepeatNode` と命名します）。その `RepeatNode` を、`GROUPING SETS` 集約の実行計画に挿入します。

#### 3.3.2 タプル

`GroupByClause` クラスで `GROUPING_ID` を `groupingExprs` 式リストに追加するには、仮想 SlotRef を作成する必要があります。それに応じて、このスロット用に `GROUPING_ID` タプルと呼ぶタプルを作成する必要があります。

`RepeatNode` の実行計画では、子ノードのすべてのタプルが入力になります。出力タプルには、RepeatNode の子ノードからのデータに加えて、`GROUPING_ID` の値と、その他の `grouping` 関数および `grouping_id` 関数に対応する仮想列の値が含まれます。

### 3.4 BE のクエリ実行段階

主な作業は次のとおりです。

1. `RepeatNode` の実行クラスに行展開のロジックを追加し、集約前に元のデータを繰り返します。具体的には、各行に `GROUPING_ID` 列を追加し、`GROUPING SETS` のセット数に応じて各行を繰り返し、対応する列を `null` に設定します。新しく追加した仮想列の値は、グループ化リストに従って設定します。
2. `grouping_id()` 関数と `grouping()` 関数を実装します。
