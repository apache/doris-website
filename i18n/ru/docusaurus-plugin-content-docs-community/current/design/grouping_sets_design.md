---
title: Проектная документация по GROUPING SETS в Doris
language: ru
description: Синтаксис и план реализации конструкций многомерной агрегации GROUPING SETS, ROLLUP и CUBE и функций GROUPING / GROUPING_ID в Apache Doris, включая проектирование планирования в FE и выполнения в BE.
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

# Проектная документация по GROUPING SETS {#grouping-sets-design-document}

<!-- Knowledge type: Architecture design -->
<!-- Knowledge type: SQL syntax specification -->
<!-- Applicable scenario: Kernel understanding / Query planning development -->

В этом документе описаны синтаксис, семантика и план реализации конструкций многомерной агрегации `GROUPING SETS`, `ROLLUP` и `CUBE` и функций `GROUPING` / `GROUPING_ID` в Apache Doris.

## 1. Общие сведения о GROUPING SETS {#1-background-on-grouping-sets}

### 1.1 Конструкция GROUPING SETS {#11-the-grouping-sets-clause}

`GROUP BY GROUPING SETS` расширяет конструкцию `GROUP BY`. Она формирует несколько наборов группировки в рамках одной конструкции `GROUP BY`, а результат эквивалентен объединению через `UNION ALL` результатов нескольких соответствующих конструкций `GROUP BY`.

В частности, пустое подмножество означает агрегацию всех строк в одну группу. Конструкция `GROUP BY` является частным случаем `GROUP BY GROUPING SETS` с единственным элементом.

Например, следующий оператор с `GROUPING SETS`:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

Его результат эквивалентен результату следующего запроса:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

Пример с реальными данными:

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

### 1.2 Конструкция ROLLUP {#12-the-rollup-clause}

`ROLLUP` является расширением `GROUPING SETS`.

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

Эта конструкция `ROLLUP` эквивалентна следующей конструкции `GROUPING SETS`:

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
)
```

### 1.3 Конструкция CUBE {#13-the-cube-clause}

`CUBE` также является расширением `GROUPING SETS`.

```sql
CUBE (e1, e2, e3, ...)
```

Она означает перечисление всех подмножеств списка после `GROUPING SETS`.

Например, `CUBE (a, b, c)` эквивалентна следующей конструкции `GROUPING SETS`:

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

### 1.4 Функции GROUPING и GROUPING_ID {#14-the-grouping-and-grouping_id-functions}

<!-- Knowledge type: Function description -->

Если столбец не агрегируется, его значение отображается как `NULL`. Однако сам столбец тоже может содержать значения `NULL`, поэтому нужен способ отличать ситуацию «столбец не агрегируется» от ситуации «само значение равно NULL». Для этого вводятся функции `GROUPING` и `GROUPING_ID`.

| Функция | Описание |
|------|------|
| `GROUPING(column)` | Определяет, является ли столбец после группировки обычным или агрегированным. Возвращает `1` для агрегированного столбца, иначе `0`. Принимает только один аргумент, задающий столбец. |
| `GROUPING_ID(column1, column2, ...)` | Вычисляет значение битовой маски для заданных столбцов в указанном порядке (или в порядке элементов набора при агрегации): агрегированным столбцам соответствует `0`, остальным `1`, после чего возвращает десятичное значение этого битового вектора. Например, `[0 1 0] -> 2`. Третий запрос ниже иллюстрирует это соответствие. |

Например, дана следующая таблица:

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

Результат `GROUPING SETS` выглядит следующим образом:

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

### 1.5 Сочетание и вложенность GROUPING SETS {#15-composition-and-nesting-of-grouping-sets}

Прежде всего, конструкция `GROUP BY` по сути является частным случаем `GROUPING SETS`. Например:

```text
GROUP BY a
is equivalent to
GROUP BY GROUPING SETS ((a))

GROUP BY a, b, c
is equivalent to
GROUP BY GROUPING SETS ((a, b, c))
```

Аналогично, `CUBE` и `ROLLUP` тоже можно развернуть в `GROUPING SETS`. Поэтому любое сочетание или вложение `GROUP BY`, `CUBE`, `ROLLUP` и `GROUPING SETS` по сути представляет собой сочетание или вложение `GROUPING SETS`.

При вложении `GROUPING SETS` семантика эквивалентна непосредственной записи вложенной конструкции на внешнем уровне (источник: <https://www.brytlyt.com/documentation/data-manipulation-dml/grouping-sets-rollup-cube/>), где сказано:

> Конструкции CUBE и ROLLUP можно использовать как непосредственно в конструкции GROUP BY, так и внутри конструкции GROUPING SETS. Если одна конструкция GROUPING SETS вложена в другую, результат будет таким же, как если бы все элементы внутренней конструкции были записаны непосредственно во внешней.

Сочетание нескольких списков `GROUPING SETS` во многих базах данных интерпретируется как декартово произведение.

Например:

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

Поддержка сочетания и вложенности `GROUPING SETS` различается в разных базах данных:

| База данных | Сочетание | Вложенность | Источник |
|--------|------|------|----------|
| Snowflake | Не поддерживается | Не поддерживается | <https://docs.snowflake.net/manuals/sql-reference/constructs/group-by.html> |
| Oracle | Поддерживается | Поддерживается | <https://docs.oracle.com/cd/B19306_01/server.102/b14223/aggreg.htm#i1006842> |
| Presto | Поддерживается | Не поддерживается | <https://prestodb.github.io/docs/current/sql/select.html> |

## 2. Цели проектирования {#2-design-goals}

Обеспечить синтаксическую поддержку `GROUPING SETS`, `ROLLUP` и `CUBE` и реализовать возможности, описанные выше в разделах 1.1, 1.2, 1.3 и 1.4.

Сочетание и вложенность `GROUPING SETS` (раздел 1.5) пока не реализуются.

Конкретный синтаксис приведён ниже.

### 2.1 Синтаксис GROUPING SETS {#21-grouping-sets-syntax}

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

### 2.2 Синтаксис ROLLUP {#22-rollup-syntax}

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY ROLLUP ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

### 2.3 Синтаксис CUBE {#23-cube-syntax}

```text
SELECT ...
FROM ...
[ ... ]
GROUP BY CUBE ( expr  [ , expr [ , ... ] ] )
[ ... ]

<expr>
Various expressions, including column names.
```

## 3. План реализации {#3-implementation-plan}

### 3.1 Общий подход {#31-overall-approach}

Поскольку конструкция `GROUPING SETS` логически эквивалентна объединению через `UNION ALL` результатов нескольких соответствующих конструкций `GROUP BY`, её можно реализовать путём размножения входных строк (эти строки уже отфильтрованы с помощью предикатов, переданных на нижние уровни, и к ним применена проекция) и выполнения одной операции `GROUP BY` над полученными строками.

Главный вопрос заключается в том, как размножить входные строки. Следующий пример иллюстрирует этот процесс.

Например, дан следующий оператор:

```sql
SELECT a, b FROM src GROUP BY a, b GROUPING SETS ((a, b), (a), (b), ());
```

Предположим, таблица `src` содержит следующие данные:

```text
1, 2
3, 4
```

В соответствии со списком, заданным конструкцией `GROUPING SETS`, входные строки можно размножить до следующих 8 строк (число GROUPING SETS x число строк), при этом для каждой строки формируются соответствующие значения `GROUPING_ID` и других функций группировки для всех столбцов:

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

Затем эти 8 строк используются как входные данные для операции `GROUP BY` по `a, b, GROUPING_ID`.

### 3.2 Подробный пример {#32-worked-example}

Предположим, существует таблица `t` со следующими столбцами и данными:

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

Для следующего запроса:

```sql
SELECT k1, k2, GROUPING_ID(k1, k2), SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

Сначала размножим входные строки. Каждая строка данных превращается в 4 строки (по числу наборов в конструкции `GROUPING SETS`), и добавляется столбец `GROUPING_ID()`:

Например, `a, A, 1` превращается в следующие 4 строки:

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

После размножения всех строк входные данные выглядят следующим образом (всего 32 строки):

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

Теперь выполним `GROUP BY` по `k1, k2, GROUPING_ID(`k1`, `k2`)`:

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

Этот результат совпадает с результатом выполнения `GROUP BY` для каждого подмножества после конструкции `GROUPING SETS` с последующим объединением через `UNION ALL`:

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

### 3.3 Этап планирования в FE {#33-fe-planning-phase}

#### 3.3.1 Основные задачи {#331-main-tasks}

1. Ввести класс `GroupByClause` для инкапсуляции информации, связанной с `GROUP BY`, заменив исходный `groupingExprs`.
2. Добавить поддержку синтаксиса, синтаксическую проверку, обработку ошибок и сообщения об ошибках для `GROUPING SETS`, `CUBE` и `ROLLUP`.
3. Добавить член `GroupByClause` в класс `SelectStmt`.
4. Ввести класс `GroupingFunctionCallExpr` для инкапсуляции вызовов функций `grouping` и `grouping_id`.
5. Ввести класс `VirtualSlot` для инкапсуляции соответствия между виртуальными столбцами, создаваемыми функциями `grouping` и `grouping_id`, и фактическими столбцами.
6. Добавить виртуальный столбец `GROUPING_ID` и виртуальные столбцы, соответствующие другим функциям `grouping` и `grouping_id`, а затем добавить эти столбцы в исходный список выражений `groupingExprs`.
7. Добавить `PlanNode` (с именем `RepeatNode`, отражающим более общее назначение). Вставить `RepeatNode` в план выполнения агрегации `GROUPING SETS`.

#### 3.3.2 Кортеж {#332-tuple}

В классе `GroupByClause` для добавления `GROUPING_ID` в список выражений `groupingExprs` необходимо создать виртуальный SlotRef. Соответственно, для этого слота нужно создать кортеж, называемый кортежем `GROUPING_ID`.

В плане выполнения `RepeatNode` входными данными служат все кортежи его дочерних узлов. Выходной кортеж содержит как данные дочернего узла повторения, так и значения `GROUPING_ID` и виртуальных столбцов, соответствующих другим функциям `grouping` и `grouping_id`.

### 3.4 Этап выполнения запроса в BE {#34-be-query-execution-phase}

Основные задачи:

1. Добавить логику размножения строк в класс выполнения `RepeatNode`: повторять исходные данные перед агрегацией. В частности, добавить столбец `GROUPING_ID` в каждую строку, повторить каждую строку в соответствии с числом наборов в `GROUPING SETS` и установить значения соответствующих столбцов в `null`. Задать значения новых виртуальных столбцов в соответствии со списком группировки.
2. Реализовать функции `grouping_id()` и `grouping()`.
