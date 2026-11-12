---
{
    "title": "ASOF JOIN для поиска ближайших соответствий во временных рядах",
    "language": "ru",
    "description": "ASOF JOIN выполняет поиск ближайших соответствий во временных рядах. Для каждой строки левой таблицы он находит ближайшую по времени строку правой таблицы в указанном направлении без использования оконных функций.",
    "keywords": [
        "ASOF JOIN",
        "JOIN для временных рядов",
        "поиск ближайших соответствий",
        "MATCH_CONDITION",
        "запрос на определённый момент времени",
        "запрос к временным рядам в Doris",
        "as of join"
    ]
}
---

<!-- Knowledge type: Capability definition + Operational example -->
<!-- Applicable scenarios: Time-series data analysis / Quote-trade matching / Event snapshot alignment -->

При анализе временных рядов часто требуется найти в другой таблице запись, «ближайшую по времени» к определённому событию. Например:

- Найти последнюю котировку на момент каждой сделки с акциями.
- Сопоставить каждый заказ с ценой или снимком складских запасов, актуальными на момент оформления заказа.
- Связать каждую запись журнала событий с предыдущим или следующим изменением состояния.

Для реализации таких запросов через обычный JOIN обычно требуются подзапросы и оконные функции (например, `ROW_NUMBER()`), что усложняет SQL и повышает стоимость выполнения. **ASOF JOIN** — специальный тип JOIN, который Doris предоставляет для поиска ближайших соответствий во временных рядах. Он позволяет выразить такой запрос одним кратким SQL-выражением.

ASOF JOIN выполняет сопоставление по столбцу даты и времени. В отличие от обычного соединения по равенству, он не требует точного совпадения значений. Вместо этого для каждой строки левой таблицы он выбирает ближайшую подходящую строку правой таблицы в направлении, заданном в `MATCH_CONDITION`.

> «Ближайшая» здесь не означает строку с наименьшей абсолютной разницей во времени. Это ближайшая строка, удовлетворяющая условию в направлении, заданном в `MATCH_CONDITION`.

ASOF JOIN поддерживает два подтипа:

| Тип | Описание | Обработка строк без соответствий |
| --- | --- | --- |
| `ASOF JOIN` / `ASOF LEFT JOIN` | Левое внешнее соединение ASOF JOIN | Столбцы правой таблицы заполняются NULL |
| `ASOF INNER JOIN` | Внутреннее соединение ASOF JOIN | Строка исключается из результата |

## Синтаксис {#syntax}

<!-- Knowledge type: Syntax reference -->

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

Основные моменты:

- `ASOF JOIN` эквивалентен `ASOF LEFT JOIN`. Строки левой таблицы без соответствий сохраняются, а столбцы правой таблицы заполняются NULL.
- `ASOF INNER JOIN` отбрасывает строки левой таблицы, для которых не найдено соответствие.
- `<comparison_operator>` должен быть одним из следующих операторов: `>=`, `>`, `<=` или `<`.

## Параметры {#parameters}

<!-- Knowledge type: Parameter reference -->

| Параметр | Обязательный | Описание |
| --- | --- | --- |
| `left_table` | Да | Левая таблица (probe table). Проверяется каждая строка этой таблицы. |
| `right_table` | Да | Правая таблица (build table). Используется для поиска ближайшего соответствия. |
| `MATCH_CONDITION` | Да | Определяет правило поиска ближайшего соответствия. Каждая сторона должна ссылаться на столбец соответствующей таблицы, причём оба столбца должны иметь тип `DATEV2`, `DATETIMEV2` или `TIMESTAMPTZ`. Допускаются выражения. Поддерживаемые операторы: `>=`, `>`, `<=`, `<`. |
| Условие `ON` / `USING` | Да | Определяет один или несколько ключей равенства, используемых для группировки. Сопоставление выполняется только внутри одной группы. `ON` поддерживает одно или несколько условий равенства (`=`) и выражения (например, `SUBSTRING(l.code, 1, 3) = r.prefix`). `USING` поддерживает один или несколько одноимённых столбцов. |

## Правила сопоставления {#matching-rules}

<!-- Knowledge type: Behavior rules -->

Направление сопоставления определяется оператором сравнения в `MATCH_CONDITION`:

| Оператор | Правило сопоставления | Типичный сценарий использования |
| --- | --- | --- |
| `>=` | Для каждой строки левой таблицы найти строку правой таблицы с **наибольшим** значением, которое **меньше или равно** значению слева | Найти последний снимок или котировку на момент события или до него |
| `>` | Для каждой строки левой таблицы найти строку правой таблицы с **наибольшим** значением, которое **строго меньше** значения слева | Найти последний снимок или котировку строго до момента события |
| `<=` | Для каждой строки левой таблицы найти строку правой таблицы с **наименьшим** значением, которое **больше или равно** значению слева | Найти следующее событие или снимок на текущий момент или после него |
| `<` | Для каждой строки левой таблицы найти строку правой таблицы с **наименьшим** значением, которое **строго больше** значения слева | Найти следующее событие или снимок строго после текущего момента |

Обратите особое внимание на следующие правила:

1. Столбцы в `MATCH_CONDITION` должны иметь тип `DATEV2`, `DATETIMEV2` или `TIMESTAMPTZ`.
2. Внутри `MATCH_CONDITION` допускаются выражения, например `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` или `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))`.
3. Условие по ключам равенства можно записать через `ON` или `USING`. При использовании `ON` допускаются только условия равенства (`=`), объединённые через `AND`. Условия неравенства (например, `>`, `OR`) и сравнения с литералами (например, `l.grp = 1`) в условии `ON` не допускаются.
4. Значения NULL в столбце сопоставления или в столбцах ключей равенства не дают соответствия. Если строка левой таблицы содержит NULL в столбце сопоставления либо в той же группе нет подходящей строки правой таблицы, столбцы правой таблицы заполняются NULL (LEFT JOIN) или строка отбрасывается (INNER JOIN).
5. Если несколько строк правой таблицы имеют одинаковый ключ группировки и одинаковое значение в столбце сопоставления и все они удовлетворяют условию сопоставления, возвращается одна из них (результат недетерминирован).

Начиная с 4.1.5, для ключей равенства в условии `ON` соединения ASOF JOIN допускается только обычный оператор `=`, а NULL-безопасный оператор равенства `<=>` отклоняется. Это ограничение не меняет поведение `<=>` в обычных соединениях.

## Примеры {#examples}

<!-- Knowledge type: Operational example -->
<!-- Applicable scenarios: Quote-trade matching / Order-price matching / Multi-table time-series alignment -->

### Подготовка данных {#data-preparation}

Приведённые ниже примеры основаны на распространённом сценарии: таблица `trades` и таблица `quotes` группируются по `symbol` и сопоставляются по близости во времени.

```sql
CREATE TABLE trades (
    trade_id INT,
    symbol VARCHAR(10),
    trade_time DATETIME,
    price DECIMAL(10, 2),
    quantity INT
) DISTRIBUTED BY HASH(trade_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

CREATE TABLE quotes (
    quote_id INT,
    symbol VARCHAR(10),
    quote_time DATETIME,
    bid_price DECIMAL(10, 2),
    ask_price DECIMAL(10, 2)
) DISTRIBUTED BY HASH(quote_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

INSERT INTO trades VALUES
(1, 'AAPL', '2024-01-01 10:00:05', 150.50, 100),
(2, 'AAPL', '2024-01-01 10:00:15', 151.00, 200),
(3, 'AAPL', '2024-01-01 10:00:25', 150.75, 150),
(4, 'GOOG', '2024-01-01 10:00:10', 2800.00, 50),
(5, 'GOOG', '2024-01-01 10:00:20', 2805.00, 75),
(6, 'MSFT', '2024-01-01 10:00:08', 380.00, 120);

INSERT INTO quotes VALUES
(1, 'AAPL', '2024-01-01 10:00:00', 150.00, 150.10),
(2, 'AAPL', '2024-01-01 10:00:10', 150.40, 150.60),
(3, 'AAPL', '2024-01-01 10:00:20', 150.90, 151.10),
(4, 'GOOG', '2024-01-01 10:00:05', 2795.00, 2800.00),
(5, 'GOOG', '2024-01-01 10:00:15', 2802.00, 2808.00),
(6, 'MSFT', '2024-01-01 10:00:00', 378.00, 380.00),
(7, 'MSFT', '2024-01-01 10:00:10', 379.50, 381.00);
```

### Пример 1: поиск последней котировки для каждой сделки (>=) {#example-1-find-the-most-recent-quote-for-each-trade-}

Сценарий: для каждой сделки найти последнюю котировку с тем же значением `symbol`, у которой `quote_time` меньше или равно `trade_time`.

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price, q.ask_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price | ask_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |    150.10 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |    150.60 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |    151.10 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |   2800.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |   2808.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |    380.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
```

Например, сделка №1 (AAPL, 10:00:05) сопоставляется с котировкой №1 (AAPL, 10:00:00), поскольку это последняя котировка с тем же значением `symbol` на момент сделки или до него.

### Пример 2: поиск следующей котировки после каждой сделки (<=) {#example-2-find-the-next-quote-after-each-trade-}

Сценарий: изменить направление сопоставления на противоположное и найти следующую котировку после каждой сделки.

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time <= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |     NULL | NULL                |      NULL |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |     NULL | NULL                |      NULL |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        7 | 2024-01-01 10:00:10 |    379.50 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```

После сделки №3 (AAPL, 10:00:25) данных о котировках нет, поэтому правая сторона возвращает NULL.

### Пример 3: исключение строк без соответствий с помощью INNER JOIN {#example-3-use-inner-join-to-exclude-unmatched-rows}

Сценарий: интерес представляют только сделки, для которых найдено соответствие, а строки с NULL не должны передаваться на дальнейшую обработку.

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF INNER JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```

```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```

В этом наборе данных для каждой сделки есть подходящая котировка, поэтому результат совпадает с примером 1. Если бы для сделки не было подходящей котировки, эта строка была бы исключена.

### Пример 4: группировка по нескольким условиям равенства {#example-4-group-by-multiple-equality-conditions}

Сценарий: группировать строки для сопоставления одновременно по `product_id` и `region` и для каждого заказа находить последнюю действующую цену для того же товара и региона.

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### Пример 5: использование выражений в MATCH_CONDITION {#example-5-use-expressions-in-match_condition}

Сценарий: сопоставление допускается только тогда, когда временная метка справа как минимум на 1 час раньше временной метки слева.

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

Также поддерживаются функции даты и времени:

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### Пример 6: многоуровневый ASOF JOIN {#example-6-multi-level-asof-join}

ASOF JOIN можно последовательно объединять с другими ASOF JOIN или с обычными JOIN.

Свяжем каждый заказ как с действующей ценой, так и со снимком складских запасов:

```sql
SELECT o.order_id, o.order_time,
       p.price, p.effective_time AS price_time,
       i.stock_level, i.snapshot_time AS inv_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ASOF LEFT JOIN inventory i
    MATCH_CONDITION(o.order_time >= i.snapshot_time)
    ON o.product_id = i.product_id AND o.region = i.region
ORDER BY o.order_id;
```

ASOF JOIN также можно сочетать с обычным JOIN:

```sql
SELECT o.order_id, prod.product_name,
       o.order_time, p.price
FROM orders o
INNER JOIN products prod ON o.product_id = prod.product_id
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### Пример 7: ASOF JOIN с агрегацией {#example-7-asof-join-with-aggregation}

Сценарий: подсчитать сделки для каждого значения `symbol` и вычислить среднюю цену покупки по соответствующим котировкам.

```sql
SELECT t.symbol,
       COUNT(*) AS trade_count,
       AVG(q.bid_price) AS avg_bid
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
GROUP BY t.symbol
ORDER BY t.symbol;
```

### Пример 8: двунаправленное сопоставление для поиска предыдущих и последующих записей {#example-8-bidirectional-matching-to-find-records-before-and-after}

Сценарий: для каждого заказа найти как предыдущую, так и следующую действующую цену.

```sql
SELECT o.order_id, o.order_time,
       p_before.price AS price_before,
       p_before.effective_time AS time_before,
       p_after.price AS price_after,
       p_after.effective_time AS time_after
FROM orders o
ASOF LEFT JOIN prices p_before
    MATCH_CONDITION(o.order_time >= p_before.effective_time)
    ON o.product_id = p_before.product_id AND o.region = p_before.region
ASOF LEFT JOIN prices p_after
    MATCH_CONDITION(o.order_time <= p_after.effective_time)
    ON o.product_id = p_after.product_id AND o.region = p_after.region
ORDER BY o.order_id;
```

### Пример 9: сопоставление в заданном направлении, а не поиск абсолютно ближайшей записи {#example-9-directional-matching-not-absolute-nearest}

ASOF JOIN выполняет поиск только в направлении, заданном в `MATCH_CONDITION`. **Он не сравнивает абсолютные разницы во времени между записями левой и правой таблиц.**

Поиск «до»:

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        1 | 2024-01-01 10:00:00 |
+----------+---------------------+----------+---------------------+
```

Хотя `10:00:08` отличается от времени слева всего на 2 секунды, а `10:00:00` — на 6 секунд, условие `MATCH_CONDITION(l.event_time >= r.ref_time)` допускает сопоставление только с записями правой таблицы, временная метка которых не позже временной метки слева, поэтому результатом будет `10:00:00`.

Поиск «после» работает в противоположном направлении:

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time <= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        2 | 2024-01-01 10:00:08 |
+----------+---------------------+----------+---------------------+
```

### Пример 10: одинаковые значения сопоставления приводят к недетерминированным результатам {#example-10-duplicate-matching-values-lead-to-non-deterministic-results}

Если несколько строк правой таблицы имеют одинаковый ключ группировки и одинаковое значение сопоставления, ASOF JOIN может вернуть любую из них. Это относится и к типу `TIMESTAMPTZ`.

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:05 +00:00' AS TIMESTAMPTZ) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_a' AS tag
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_b' AS tag
)
SELECT l.event_id, r.right_id, r.ref_time, r.tag
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```

```text
+----------+----------+---------------------------+------------+
| event_id | right_id | ref_time                  | tag        |
+----------+----------+---------------------------+------------+
|        1 |        1 | 2024-01-01 10:00:00+00:00 | snapshot_a |
+----------+----------+---------------------------+------------+
```

Запрос также может вернуть `right_id = 2` со значением `tag = snapshot_b`. Если бизнес-логика требует детерминированных результатов, удалите дубликаты из правой таблицы или выполните её предварительную агрегацию перед ASOF JOIN.

## Эквивалентная запись с использованием оконных функций {#equivalent-rewrite-using-window-functions}

<!-- Knowledge type: Comparison -->

ASOF JOIN семантически эквивалентен следующей конструкции `LEFT JOIN` + `ROW_NUMBER()`, но выполняется значительно быстрее:

```sql
-- Equivalent to: ASOF LEFT JOIN ... MATCH_CONDITION(l.ts >= r.ts)
SELECT id, rid, val FROM (
    SELECT l.id, r.id AS rid, r.val,
           ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY r.ts DESC) AS rn
    FROM left_table l
    LEFT JOIN right_table r
        ON l.grp = r.grp AND l.ts >= r.ts
) t
WHERE rn = 1;
```

## Рекомендации по использованию {#best-practices}

<!-- Knowledge type: Usage recommendations -->

- **Отдавайте предпочтение ASOF JOIN для запросов к временным рядам на определённый момент времени.** Если для каждой строки таблицы фактов нужно найти последнюю (или ближайшую) запись в справочной таблице, ASOF JOIN — наиболее естественный и эффективный подход.
- **Добавляйте подходящие ключи равенства для группировки.** Указывайте ключи группировки в условии `ON` или `USING`. Чем точнее группировка, тем меньше область поиска и выше производительность.
- **Выбирайте подходящий оператор сравнения.** Используйте `>=`, если нужно включать соответствия с одинаковыми временными метками, и `>`, если строки с одинаковыми временными метками необходимо строго исключить. То же правило действует и для обратного направления.
- **Используйте `ASOF INNER JOIN`, если строки без соответствий не нужны.** Это позволяет избежать появления строк с NULL и упрощает дальнейшую обработку.
- **Удаляйте дубликаты из правой таблицы, если требуются детерминированные результаты.** Если правая таблица содержит несколько строк с одинаковым ключом группировки и значением столбца сопоставления, ASOF JOIN может вернуть любую из них.
- **Используйте выражения для сопоставления со смещением по времени.** Например, `MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` требует разницы как минимум в 1 час.
