---
{
    "title": "Многомерный анализ с агрегацией",
    "language": "ru",
    "description": "Как использовать ROLLUP, CUBE и GROUPING SETS для многомерного анализа с агрегацией в одном SQL-запросе? В статье представлены синтаксис, примеры и сравнение подходящих сценариев использования.",
    "keywords": [
        "ROLLUP",
        "CUBE",
        "GROUPING SETS",
        "функция GROUPING",
        "GROUPING_ID",
        "многомерная агрегация",
        "расширение GROUP BY",
        "промежуточные итоги и общий итог",
        "иерархическое подведение итогов"
    ]
}
---

<!-- Knowledge type: Feature description + SQL syntax -->
<!-- Applicable scenario: Multi-dimensional reports, hierarchical summarization, cross-dimensional analysis -->

При подготовке отчётов о продажах, операционного анализа или исследований рынка часто нужен один запрос, который возвращает и «промежуточные итоги на детальном уровне измерений», и «итоги по различным комбинациям измерений», и «общий итог». Объединение нескольких запросов с `GROUP BY` с помощью `UNION ALL` не только делает SQL громоздким, но и приводит к многократному сканированию исходной таблицы, что снижает эффективность.

Doris предоставляет три синтаксических расширения предложения `GROUP BY` для многомерной агрегации. Они позволяют получать сводные результаты на нескольких уровнях в одном SQL-запросе и семантически эквивалентны объединению нескольких агрегирующих запросов с помощью `UNION ALL`:

| Синтаксис | Когда использовать | Формируемые комбинации итогов |
| --- | --- | --- |
| **ROLLUP** | Поуровневая агрегация по измерениям с естественной иерархией, например по времени, географии или категориям | Последовательная агрегация в заданном порядке столбцов, от самого детального уровня до общего итога |
| **CUBE** | Несколько независимых измерений, для которых нужен полный анализ всех комбинаций | Все комбинации всех подмножеств измерений |
| **GROUPING SETS** | Интерес представляют лишь несколько конкретных комбинаций измерений, и нужно избежать затрат на полный CUBE | Наборы группировки, явно заданные пользователем |

В этой статье три варианта синтаксиса рассмотрены в порядке «сценарий -> синтаксис -> пример». Также объясняется, как вспомогательные функции `GROUPING` и `GROUPING_ID` позволяют определять строки промежуточных итогов и различать два вида значений NULL.

## ROLLUP: поуровневые итоги по иерархии {#rollup-hierarchical-level-by-level-summary}

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Dimensions with hierarchical relationships, such as time, geography, or category -->

### Когда использовать {#applicable-scenario}

`ROLLUP` подходит для поуровневой агрегации по иерархическим измерениям. Агрегация выполняется в заданном порядке столбцов: данные последовательно обобщаются от самого детального до самого верхнего уровня. Например:

- Измерение времени: `ROLLUP(year, month, day)`
- Географическое измерение: `ROLLUP(country, province, city)`

Для данных о продажах можно использовать `ROLLUP` для агрегации по региону и времени, получая продажи за каждый месяц в каждом регионе, общий объём продаж по каждому региону и общий объём продаж по всем регионам.

### Синтаксис {#syntax}

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

### Пример {#example}

Следующий запрос анализирует продажи по годам и месяцам:

```sql
SELECT
        YEAR(d_date),
        MONTH(d_date),
        SUM(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND YEAR(d_date) IN (2001, 2002)
        AND MONTH(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(YEAR(d_date), MONTH(d_date))
ORDER BY
        YEAR(d_date), MONTH(d_date);
```

Запрос выполняет поуровневую агрегацию по времени, вычисляя промежуточные итоги продаж за каждый месяц каждого года, промежуточные итоги продаж за каждый год и общий итог продаж. Результат запроса:

```sql
+--------------+---------------+-------------+
| YEAR(d_date) | MONTH(d_date) | total_sum   |
+--------------+---------------+-------------+
|         NULL |          NULL | 54262669.17 |
|         2001 |          NULL | 26640320.46 |
|         2001 |             1 |  9982165.83 |
|         2001 |             2 |  8454915.34 |
|         2001 |             3 |  8203239.29 |
|         2002 |          NULL | 27622348.71 |
|         2002 |             1 | 11260654.35 |
|         2002 |             2 |  7722750.61 |
|         2002 |             3 |  8638943.75 |
+--------------+---------------+-------------+
9 rows in set (0.08 sec)
```

## CUBE: полные итоги по всем комбинациям измерений {#cube-full-cross-dimensional-summary}

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Comprehensive multi-dimensional analysis across multiple independent dimensions -->

### Когда использовать {#applicable-scenario-1}

`CUBE` лучше всего подходит для запросов с несколькими независимыми столбцами измерений, а не со столбцами, представляющими разные уровни одного измерения. Типичный пример использования: подведение итогов по всем комбинациям месяца, региона и товара. Это три взаимно независимых измерения, и анализ всех возможных комбинаций промежуточных итогов требуется очень часто.

Напротив, перекрёстная агрегация по году, месяцу и дню даёт много ненужных значений, поскольку измерение времени само по себе имеет естественную иерархию. В большинстве случаев промежуточные итоги вроде «прибыли по сочетанию месяца и дня» не нужны, и сравнительно немногие пользователи спрашивают, «каков общий объём продаж за 16-е число каждого месяца в течение года». Для таких иерархических измерений лучше подходит `ROLLUP`.

### Синтаксис {#syntax-1}

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

### Пример {#example-1}

```sql
SELECT
        YEAR(d_date),
        i_category,
        ca_state,
        SUM(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND YEAR(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(YEAR(d_date), i_category, ca_state)
ORDER BY YEAR(d_date), i_category, ca_state;
```

В результате запроса вычисляются:

- Общий итог продаж.
- Промежуточные итоги продаж за каждый год, продаж товаров по каждой категории и продаж по каждому штату.
- Промежуточные итоги продаж по каждой категории за каждый год, продаж по каждому товару в каждом штате, продаж по каждому штату за каждый год и продаж товаров по каждой категории в каждом штате за каждый год.

```sql
+--------------+-------------+----------+------------+
| YEAR(d_date) | i_category  | ca_state | total_sum  |
+--------------+-------------+----------+------------+
|         NULL | NULL        | NULL     | 8690374.60 |
|         NULL | NULL        | AK       | 2675198.33 |
|         NULL | NULL        | LA       | 6015176.27 |
|         NULL | Books       | NULL     | 4238177.69 |
|         NULL | Books       | AK       | 1310791.36 |
|         NULL | Books       | LA       | 2927386.33 |
|         NULL | Electronics | NULL     | 4452196.91 |
|         NULL | Electronics | AK       | 1364406.97 |
|         NULL | Electronics | LA       | 3087789.94 |
|         1998 | NULL        | NULL     | 4369656.14 |
|         1998 | NULL        | AK       | 1402539.19 |
|         1998 | NULL        | LA       | 2967116.95 |
|         1998 | Books       | NULL     | 2213703.82 |
|         1998 | Books       | AK       |  719911.29 |
|         1998 | Books       | LA       | 1493792.53 |
|         1998 | Electronics | NULL     | 2155952.32 |
|         1998 | Electronics | AK       |  682627.90 |
|         1998 | Electronics | LA       | 1473324.42 |
|         1999 | NULL        | NULL     | 4320718.46 |
|         1999 | NULL        | AK       | 1272659.14 |
|         1999 | NULL        | LA       | 3048059.32 |
|         1999 | Books       | NULL     | 2024473.87 |
|         1999 | Books       | AK       |  590880.07 |
|         1999 | Books       | LA       | 1433593.80 |
|         1999 | Electronics | NULL     | 2296244.59 |
|         1999 | Electronics | AK       |  681779.07 |
|         1999 | Electronics | LA       | 1614465.52 |
+--------------+-------------+----------+------------+
27 rows in set (0.21 sec)
```

## Функция GROUPING: определение строк промежуточных итогов {#grouping-function-identifying-subtotal-rows}

<!-- Knowledge type: SQL function -->
<!-- Applicable scenario: Distinguish subtotal rows from real NULLs and filter results by aggregation level -->

При использовании `ROLLUP` и `CUBE` возникают две задачи, связанные с набором результатов:

1. **Как определить строки промежуточных итогов**: программно установить, какие строки результата содержат промежуточные итоги и какому уровню агрегации соответствует каждый из них. Это часто требуется, например, при вычислении «доли от общего итога».
2. **Как различить два вида NULL**: если результат запроса содержит и значения NULL, фактически хранящиеся в таблице, и значения NULL, полученные в результате операций `ROLLUP` или `CUBE`, нужен способ отличить их друг от друга.

Функции `GROUPING` и `GROUPING_ID` (в сочетании с `GROUPING SETS`) эффективно решают эти задачи.

### GROUPING {#grouping}

#### Принцип работы {#principle}

`GROUPING` принимает в качестве аргумента один столбец:

- Возвращает `1`, если значение NULL получено в результате операции `ROLLUP` или `CUBE` (то есть строка содержит промежуточный итог).
- Возвращает `0` для любого другого значения, в том числе для значений NULL, уже существующих в таблице.

Пример:

```sql
SELECT
        year(d_date),
        month(d_date),
        sum(ss_net_paid) AS total_sum,
        grouping(year(d_date)),
        grouping(month(d_date))
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND year(d_date) IN (2001, 2002)
        AND month(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(year(d_date), month(d_date))
ORDER BY
        year(d_date), month(d_date);
```

Значения функции `GROUPING` на разных уровнях агрегации:

- Группа `(year(d_date), month(d_date))`: результат `(0, 0)`, детальные строки с агрегацией по году и месяцу.
- Группа `(year(d_date))`: результат `(0, 1)`, строки промежуточных итогов с агрегацией по году.
- Группа `()`: результат `(1, 1)`, строка общего итога.

Результат запроса:

```sql
+--------------+---------------+-------------+------------------------+-------------------------+
| year(d_date) | month(d_date) | total_sum   | Grouping(year(d_date)) | Grouping(month(d_date)) |
+--------------+---------------+-------------+------------------------+-------------------------+
|         NULL |          NULL | 54262669.17 |                      1 |                       1 |
|         2001 |          NULL | 26640320.46 |                      0 |                       1 |
|         2001 |             1 |  9982165.83 |                      0 |                       0 |
|         2001 |             2 |  8454915.34 |                      0 |                       0 |
|         2001 |             3 |  8203239.29 |                      0 |                       0 |
|         2002 |          NULL | 27622348.71 |                      0 |                       1 |
|         2002 |             1 | 11260654.35 |                      0 |                       0 |
|         2002 |             2 |  7722750.61 |                      0 |                       0 |
|         2002 |             3 |  8638943.75 |                      0 |                       0 |
+--------------+---------------+-------------+------------------------+-------------------------+
9 rows in set (0.06 sec)
```

#### Применение 1: фильтрация по уровням агрегации в HAVING {#usage-1-filtering-aggregation-levels-in-having}

Функция `GROUPING` позволяет отфильтровать результаты по определённому уровню агрегации. В следующем примере сохраняются только «общий итог продаж», «продажи с агрегацией по году» и «продажи с агрегацией по штату»:

```sql
SELECT
        year(d_date),
        i_category,
        ca_state,
        sum(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category, ca_state)
HAVING grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 0 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 0
ORDER BY year(d_date), i_category, ca_state;
```

Результат запроса:

```sql
+---------------------+------------+----------+------------+
| year(`d1`.`d_date`) | i_category | ca_state | total_sum  |
+---------------------+------------+----------+------------+
|                NULL | NULL       | NULL     | 8690374.60 |
|                NULL | NULL       | AK       | 2675198.33 |
|                NULL | NULL       | LA       | 6015176.27 |
|                1998 | NULL       | NULL     | 4369656.14 |
|                1999 | NULL       | NULL     | 4320718.46 |
+---------------------+------------+----------+------------+
5 rows in set (0.13 sec)
```

#### Применение 2: сочетание с IF для улучшения читаемости {#usage-2-combining-with-if-to-improve-readability}

Замена значений NULL в строках промежуточных итогов на более понятные строки делает результат удобнее для чтения:

```sql
SELECT
        IF(grouping(year(d_date)) = 1, "Multi-year sum", year(d_date)) AS year,
        IF(grouping(i_category) = 1, "Multi-category sum", i_category) AS category,
        sum(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category)
```

Результат запроса:

```sql
+----------------+--------------------+------------+
| year           | category           | total_sum  |
+----------------+--------------------+------------+
| 1998           | Books              | 2213703.82 |
| 1998           | Electronics        | 2155952.32 |
| 1999           | Electronics        | 2296244.59 |
| 1999           | Books              | 2024473.87 |
| 1998           | Multi-category sum | 4369656.14 |
| 1999           | Multi-category sum | 4320718.46 |
| Multi-year sum | Books              | 4238177.69 |
| Multi-year sum | Electronics        | 4452196.91 |
| Multi-year sum | Multi-category sum | 8690374.60 |
+----------------+--------------------+------------+
9 rows in set (0.09 sec)
```

### GROUPING_ID {#grouping_id}

#### Когда использовать {#applicable-scenario-2}

`GROUPING_ID` и `GROUPING` используются как вспомогательные функции в запросах с многомерной агрегацией (например, с `ROLLUP` и `CUBE`), позволяя различать результаты агрегации на разных уровнях.

Чтобы определить уровень агрегации строки с помощью `GROUPING`, нужно отдельно вычислить функцию для каждого столбца `GROUP BY` (результата для одного столбца недостаточно, чтобы различать уровни), что делает SQL громоздким. `GROUPING_ID` обладает более широкими возможностями, чем `GROUPING`: она принимает несколько столбцов в качестве аргументов и возвращает целое число, двоичные разряды которого одновременно представляют состояние агрегации всех этих столбцов.

При сохранении вычисленных результатов в таблице или материализованном представлении использование функции `GROUPING` для обозначения разных уровней агрегации требует больше места для хранения. В этом случае лучше подходит `GROUPING_ID`.

Для примера `CUBE(a, b)` соответствие между `GROUPING_ID` и `GROUPING` выглядит так:

| Уровень агрегации | Битовый вектор | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------- | ---------- | ----------- | ----------- | ----------- |
| a, b        | 0 0        | 0           | 0           | 0           |
| a           | 0 1        | 1           | 0           | 1           |
| b           | 1 0        | 2           | 1           | 0           |
| Общий итог | 1 1        | 3           | 1           | 1           |

#### Синтаксис и пример {#syntax-and-example}

```sql
SELECT
    year(d_date),
    i_category,
    SUM(ss_net_paid) AS total_sum,
    GROUPING(year(d_date)),
    GROUPING(i_category),
    GROUPING_ID(year(d_date), i_category)
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND year(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY CUBE(year(d_date), i_category);
```

Результат запроса:

```sql
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
| year(d_date) | i_category  | total_sum  | GROUPING(year(d_date)) | GROUPING(i_category) | GROUPING_ID(year(d_date), i_category) |
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
| 1998         | Electronics | 2155952.32 | 0                      | 0                    | 0                                     |
| 1998         | Books       | 2213703.82 | 0                      | 0                    | 0                                     |
| 1999         | Electronics | 2296244.59 | 0                      | 0                    | 0                                     |
| 1999         | Books       | 2024473.87 | 0                      | 0                    | 0                                     |
| 1998         | NULL        | 4369656.14 | 0                      | 1                    | 1                                     |
| 1999         | NULL        | 4320718.46 | 0                      | 1                    | 1                                     |
| NULL         | Electronics | 4452196.91 | 1                      | 0                    | 2                                     |
| NULL         | Books       | 4238177.69 | 1                      | 0                    | 2                                     |
| NULL         | NULL        | 8690374.60 | 1                      | 1                    | 3                                     |
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
9 rows in set (0.12 sec)
```

## GROUPING SETS: точное задание комбинаций группировки {#grouping-sets-specifying-grouping-combinations-precisely}

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Only a few specific dimension combinations are of interest, avoiding the cost of a full CUBE -->

### Когда использовать {#applicable-scenario-3}

Если нужно выполнить агрегацию лишь по нескольким заданным комбинациям группировки, а не вычислять полный `CUBE`, используйте `GROUPING SETS` в предложении `GROUP BY`. Это позволяет точно задать комбинации нескольких измерений, для которых нужны вычисления, и избежать лишних затрат.

Поскольку запросы с `CUBE` обычно потребляют больше ресурсов, `GROUPING SETS` повышает эффективность выполнения, когда интерес представляют лишь несколько измерений.

### Синтаксис {#syntax-2}

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

### Пример {#example-2}

Предположим, вам нужны:

- Промежуточные итоги продаж по каждой категории товаров за каждый год
- Промежуточные итоги продаж в каждом штате за каждый год
- Промежуточные итоги продаж каждого товара в каждом штате за каждый год

С помощью `GROUPING SETS` можно явно задать эти комбинации измерений:

```sql
SELECT
    YEAR(d_date),
    i_category,
    ca_state,
    SUM(ss_net_paid) AS total_sum
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND YEAR(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY GROUPING SETS(
    (YEAR(d_date), i_category),
    (YEAR(d_date), ca_state),
    (YEAR(d_date), ca_state, i_category)
)
ORDER BY YEAR(d_date), i_category, ca_state;
```

Результат запроса:

```sql
+--------------+-------------+----------+------------+
| YEAR(d_date) | i_category  | ca_state | total_sum  |
+--------------+-------------+----------+------------+
| 1998         | NULL        | AK       | 1402539.19 |
| 1998         | NULL        | LA       | 2967116.95 |
| 1998         | Books       | NULL     | 2213703.82 |
| 1998         | Books       | AK       |  719911.29 |
| 1998         | Books       | LA       | 1493792.53 |
| 1998         | Electronics | NULL     | 2155952.32 |
| 1998         | Electronics | AK       |  682627.90 |
| 1998         | Electronics | LA       | 1473324.42 |
| 1999         | NULL        | AK       | 1272659.14 |
| 1999         | NULL        | LA       | 3048059.32 |
| 1999         | Books       | NULL     | 2024473.87 |
| 1999         | Books       | AK       |  590880.07 |
| 1999         | Books       | LA       | 1433593.80 |
| 1999         | Electronics | NULL     | 2296244.59 |
| 1999         | Electronics | AK       |  681779.07 |
| 1999         | Electronics | LA       | 1614465.52 |
+--------------+-------------+----------+------------+
16 rows in set (0.11 sec)
```

Приведённый выше запрос эквивалентен выполнению `CUBE` с последующим использованием `grouping_id` для сохранения только заданных комбинаций агрегации и позволяет избежать лишних вычислений:

```sql
SELECT
    SUM(ss_net_paid) AS total_sum,
    YEAR(d_date),
    i_category,
    ca_state
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND YEAR(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY CUBE(YEAR(d_date), ca_state, i_category)
HAVING grouping_id(YEAR(d_date), ca_state, i_category) = 0
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 2
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 1;
```

:::info Примечание
`CUBE` вычисляет все возможные уровни агрегации (в этом примере их восемь), но на практике вас могут интересовать лишь некоторые из них.
:::

### Семантическая эквивалентность {#semantic-equivalences}

`GROUPING SETS` представляет собой более базовую форму многомерной агрегации. И `ROLLUP`, и `CUBE` можно развернуть в `GROUPING SETS`.

#### GROUPING SETS и GROUP BY UNION ALL {#grouping-sets-and-group-by-union-all}

Следующий запрос с `GROUPING SETS`:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

Эквивалентен нескольким запросам с `GROUP BY`, объединённым с помощью `UNION ALL`:

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

Запрос с объединением через `UNION ALL` длиннее и сканирует исходную таблицу несколько раз, поэтому требует больше усилий при написании и менее эффективен при выполнении.

#### GROUPING SETS и ROLLUP {#grouping-sets-and-rollup}

`ROLLUP` является расширением `GROUPING SETS`. Например:

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

Эквивалентен следующему выражению `GROUPING SETS`:

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
);
```

#### GROUPING SETS и CUBE {#grouping-sets-and-cube}

`CUBE(a, b, c)` эквивалентен следующему выражению `GROUPING SETS`:

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a, c),
    (a),
    (b, c),
    (b),
    (c),
    ()
);
```

## Приложение {#appendix}

Операторы создания таблиц и файлы данных приведены в приложении к статье [Аналитические функции (оконные функции)](./window-function.md).
