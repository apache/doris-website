---
title: Doris GROUPING SETS 설계 문서
language: ko
description: Apache Doris의 GROUPING SETS, ROLLUP, CUBE 다차원 집계 절과 GROUPING / GROUPING_ID 함수의 구문 및 구현 계획을 설명하며, FE 계획 수립과 BE 실행 설계를 포함합니다.
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

# GROUPING SETS 설계 문서 {#grouping-sets-design-document}

<!-- Knowledge type: Architecture design -->
<!-- Knowledge type: SQL syntax specification -->
<!-- Applicable scenario: Kernel understanding / Query planning development -->

이 문서는 Apache Doris의 `GROUPING SETS`, `ROLLUP`, `CUBE` 다차원 집계 절과 `GROUPING` / `GROUPING_ID` 함수의 구문, 의미, 구현 계획을 설명합니다.

## 1. GROUPING SETS 배경 {#1-background-on-grouping-sets}

### 1.1 GROUPING SETS 절 {#11-the-grouping-sets-clause}

`GROUP BY GROUPING SETS`는 `GROUP BY` 절의 확장입니다. 하나의 `GROUP BY` 절에서 여러 그룹화 집합을 생성하며, 결과는 `UNION ALL`로 이에 대응하는 여러 `GROUP BY` 절의 결과를 결합한 것과 같습니다.

특히 빈 부분집합은 모든 행을 하나의 그룹으로 집계한다는 의미입니다. `GROUP BY` 절은 원소가 하나뿐인 `GROUP BY GROUPING SETS`의 특수한 경우입니다.

예를 들어 다음 `GROUPING SETS` 문이 있다고 가정합니다.

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

이 쿼리의 결과는 다음과 같습니다.

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

실제 데이터를 사용한 예제는 다음과 같습니다.

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

### 1.2 ROLLUP 절 {#12-the-rollup-clause}

`ROLLUP`은 `GROUPING SETS`의 확장입니다.

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

이 `ROLLUP`은 다음 `GROUPING SETS`와 같습니다.

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
)
```

### 1.3 CUBE 절 {#13-the-cube-clause}

`CUBE`도 `GROUPING SETS`의 확장입니다.

```sql
CUBE (e1, e2, e3, ...)
```

이는 `GROUPING SETS` 뒤에 오는 목록의 모든 부분집합을 의미합니다.

예를 들어 `CUBE (a, b, c)`는 다음 `GROUPING SETS`와 같습니다.

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

### 1.4 GROUPING 및 GROUPING_ID 함수 {#14-the-grouping-and-grouping_id-functions}

<!-- Knowledge type: Function description -->

열이 집계되지 않으면 해당 값은 `NULL`로 표시됩니다. 하지만 열 자체에도 `NULL` 값이 포함될 수 있으므로, "집계되지 않음"과 "값 자체가 NULL임"을 구분할 방법이 필요합니다. 이를 위해 `GROUPING` 및 `GROUPING_ID` 함수를 도입합니다.

| 함수 | 설명 |
|------|------|
| `GROUPING(column)` | 그룹화 후의 열이 일반 열인지 집계된 열인지 구분합니다. 집계된 열이면 `1`, 아니면 `0`을 반환합니다. 열 인수를 하나만 받습니다. |
| `GROUPING_ID(column1, column2, ...)` | 지정된 열 순서(또는 집계 시 집합 원소의 순서)에 따라 주어진 열의 비트맵 값을 계산합니다. 집계된 열은 `0`, 그 외의 열은 `1`로 표시하고, 마지막으로 이 비트 벡터의 십진수 값을 반환합니다. 예를 들어 `[0 1 0] -> 2`입니다. 아래 세 번째 쿼리는 이 대응 관계를 보여 줍니다. |

예를 들어 다음 테이블이 있다고 가정합니다.

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

`GROUPING SETS`의 결과는 다음과 같습니다.

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

### 1.5 GROUPING SETS의 조합과 중첩 {#15-composition-and-nesting-of-grouping-sets}

먼저 `GROUP BY` 절은 본질적으로 `GROUPING SETS`의 특수한 경우입니다. 예를 들면 다음과 같습니다.

```text
GROUP BY a
is equivalent to
GROUP BY GROUPING SETS ((a))

GROUP BY a, b, c
is equivalent to
GROUP BY GROUPING SETS ((a, b, c))
```

마찬가지로 `CUBE`와 `ROLLUP`도 `GROUPING SETS`로 전개할 수 있습니다. 따라서 `GROUP BY`, `CUBE`, `ROLLUP`, `GROUPING SETS`를 조합하거나 중첩하는 것은 본질적으로 `GROUPING SETS`를 조합하거나 중첩하는 것입니다.

`GROUPING SETS`의 중첩은 중첩된 절을 외부 수준에 직접 작성한 것과 의미가 같습니다. 참고 자료(<https://www.brytlyt.com/documentation/data-manipulation-dml/grouping-sets-rollup-cube/>)에서는 이를 다음과 같이 설명합니다.

> CUBE 및 ROLLUP 구문은 GROUP BY 절에서 직접 사용하거나 GROUPING SETS 절 안에 중첩하여 사용할 수 있습니다. 하나의 GROUPING SETS 절이 다른 GROUPING SETS 절 안에 중첩된 경우, 내부 절의 모든 원소를 외부 절에 직접 작성한 것과 효과가 같습니다.

여러 `GROUPING SETS` 목록을 조합하는 경우, 많은 데이터베이스는 이를 곱집합으로 해석합니다.

예를 들면 다음과 같습니다.

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

`GROUPING SETS`의 조합 및 중첩 지원 여부는 데이터베이스마다 다릅니다.

| 데이터베이스 | 조합 | 중첩 | 참고 자료 |
|--------|------|------|----------|
| Snowflake | 지원하지 않음 | 지원하지 않음 | <https://docs.snowflake.net/manuals/sql-reference/constructs/group-by.html> |
| Oracle | 지원함 | 지원함 | <https://docs.oracle.com/cd/B19306_01/server.102/b14223/aggreg.htm#i1006842> |
| Presto | 지원함 | 지원하지 않음 | <https://prestodb.github.io/docs/current/sql/select.html> |

## 2. 설계 목표 {#2-design-goals}

구문 차원에서 `GROUPING SETS`, `ROLLUP`, `CUBE`를 지원하고, 위의 1.1, 1.2, 1.3, 1.4절에서 설명한 기능을 구현합니다.

현재는 `GROUPING SETS`의 조합과 중첩(1.5절)을 구현하지 않습니다.

구체적인 구문은 다음과 같습니다.

### 2.1 GROUPING SETS 구문 {#21-grouping-sets-syntax}

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

### 2.2 ROLLUP 구문 {#22-rollup-syntax}

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY ROLLUP ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

### 2.3 CUBE 구문 {#23-cube-syntax}

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY CUBE ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

## 3. 구현 계획 {#3-implementation-plan}

### 3.1 전체 접근 방식 {#31-overall-approach}

`GROUPING SETS` 절은 논리적으로 `UNION ALL`로 이에 대응하는 여러 `GROUP BY` 절의 결과를 결합한 것과 같으므로, 입력 행(이미 푸시다운된 조건자로 필터링되고 프로젝션된 행)을 확장한 뒤 확장된 행에 한 번의 `GROUP BY` 연산을 수행하는 방식으로 구현할 수 있습니다.

핵심은 입력 행을 어떻게 확장하느냐입니다. 다음 예제로 이를 설명합니다.

예를 들어 다음 문이 있다고 가정합니다.

```sql
SELECT a, b FROM src GROUP BY a, b GROUPING SETS ((a, b), (a), (b), ());
```

`src` 테이블의 데이터가 다음과 같다고 가정합니다.

```text
1, 2
3, 4
```

`GROUPING SETS` 절에 지정된 목록에 따라 입력 행을 다음 8개 행(GROUPING SETS 개수 x 행 수)으로 확장하고, 각 행에 대해 모든 열에 대응하는 `GROUPING_ID` 및 기타 그룹화 함수 값을 생성할 수 있습니다.

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

그런 다음 위의 8개 행을 입력으로 사용하여 `GROUP BY`를 수행하며, 그룹화 기준은 `a, b, GROUPING_ID`입니다.

### 3.2 상세 예제 {#32-worked-example}

다음 열과 데이터를 가진 테이블 `t`가 있다고 가정합니다.

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

다음 쿼리를 살펴보겠습니다.

```sql
SELECT k1, k2, GROUPING_ID(k1, k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

먼저 입력 행을 확장합니다. 각 데이터 행을 4개 행(`GROUPING SETS` 절의 집합 수)으로 확장하고, `GROUPING_ID()` 열을 추가합니다.

예를 들어 `a, A, 1`은 다음 4개 행으로 확장됩니다.

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

모든 행을 확장한 후의 입력 행은 다음과 같습니다(총 32개 행).

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

이제 `GROUP BY`를 `k1, k2, GROUPING_ID(`k1`, `k2`)`에 대해 수행합니다.

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

이 결과는 `GROUP BY`를 `GROUPING SETS` 절 뒤에 오는 각 부분집합에 대해 실행한 후 `UNION ALL`로 결합한 결과와 같습니다.

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

### 3.3 FE 계획 수립 단계 {#33-fe-planning-phase}

#### 3.3.1 주요 작업 {#331-main-tasks}

1. `GroupByClause` 클래스를 도입하여 `GROUP BY` 관련 정보를 캡슐화하고, 기존 `groupingExprs`를 대체합니다.
2. `GROUPING SETS`, `CUBE`, `ROLLUP`에 대한 구문 지원, 구문 검사, 오류 처리, 오류 메시지를 추가합니다.
3. `GroupByClause` 멤버를 `SelectStmt` 클래스에 추가합니다.
4. `GroupingFunctionCallExpr` 클래스를 도입하여 `grouping` 및 `grouping_id` 함수 호출을 캡슐화합니다.
5. `VirtualSlot` 클래스를 도입하여 `grouping` 및 `grouping_id`가 생성하는 가상 열과 실제 열 간의 매핑을 캡슐화합니다.
6. 가상 열 `GROUPING_ID`와 다른 `grouping` 및 `grouping_id` 함수에 해당하는 가상 열을 추가하고, 이 열들을 기존 `groupingExprs` 표현식 목록에 추가합니다.
7. `PlanNode`를 추가합니다(더 범용적인 기능을 위해 `RepeatNode`로 명명). `RepeatNode`를 `GROUPING SETS` 집계를 위한 실행 계획에 삽입합니다.

#### 3.3.2 튜플 {#332-tuple}

`GroupByClause` 클래스에서 `GROUPING_ID`를 `groupingExprs` 표현식 목록에 추가하려면 가상 SlotRef를 생성해야 합니다. 따라서 이 슬롯을 위한 튜플도 생성해야 하며, 이를 `GROUPING_ID` 튜플이라고 합니다.

`RepeatNode` 실행 계획의 입력은 자식 노드의 모든 튜플입니다. 출력 튜플에는 반복 대상인 자식 노드의 데이터뿐 아니라 `GROUPING_ID` 값과 다른 `grouping` 및 `grouping_id` 함수에 해당하는 가상 열의 값도 포함됩니다.

### 3.4 BE 쿼리 실행 단계 {#34-be-query-execution-phase}

주요 작업은 다음과 같습니다.

1. `RepeatNode`의 실행 클래스를 통해 행 확장 로직을 추가합니다. 집계 전에 원본 데이터를 반복합니다. 구체적으로 각 행에 `GROUPING_ID` 열을 추가하고, `GROUPING SETS`의 집합 수만큼 각 행을 반복하며, 해당 열을 `null`로 설정합니다. 새로 추가한 가상 열의 값은 그룹화 목록에 따라 설정합니다.
2. `grouping_id()` 및 `grouping()` 함수를 구현합니다.
