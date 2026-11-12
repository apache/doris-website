---
{
    "title": "Быстрый старт",
    "language": "ru",
    "description": "10-минутное знакомство с changelog и Table Stream в Doris: создание таблицы с changelog, создание Stream, запись данных, просмотр изменений и их обработка в целевой таблице.",
    "keywords": [
        "Doris Table Stream quick start",
        "changelog example",
        "CREATE STREAM",
        "changelog.enable",
        "changelog.need_historical_value",
        "min_delta",
        "show_initial_rows",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "INSERT INTO SELECT from stream",
        "table_stream_consumption",
        "consumption offset LAG",
        "incremental consumption tutorial",
        "Doris CDC example"
    ]
}
---

<!-- Knowledge type: Operations guide -->
<!-- Use cases: First use of changelog / Table Stream -->

На этой странице показано, как использовать changelog и Table Stream на примере таблицы заказов: записывать операции вставки, обновления и удаления заказов, а затем передавать эти изменения в целевую таблицу с гарантией exactly-once. Вам понадобится только клиент MySQL и около 10 минут.

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 или новее.
- Добавьте следующие параметры в `fe.conf` на каждом FE и перезапустите все FE (ни один из этих параметров нельзя изменить динамически):

    ```text
    enable_feature_changelog = true
    enable_table_stream = true
    ```

- Клиент MySQL, который может подключаться к Doris.

## Последовательность действий {#overview-of-the-steps}

1. Создайте таблицу `orders` с включённым changelog и запишите первую порцию данных.
2. Создайте Table Stream типа `min_delta` для `orders`.
3. Запишите вторую порцию данных, включающую обновление, удаление и вставки.
4. Просмотрите изменения через Stream и разберитесь с типом изменения каждой строки.
5. Обработайте изменения, записав их в целевую таблицу с помощью `INSERT INTO ... SELECT`.
6. Проверьте прогресс потребления в `information_schema.table_stream_consumption`.

## Шаг 1: Создайте таблицу с включённым changelog {#step-1-create-a-table-with-changelog-enabled}

<!-- Knowledge type: Operational steps -->

Changelog можно включить только при создании таблицы. Создайте таблицу Unique Key Merge-on-Write и включите `changelog.need_historical_value`, чтобы при обновлениях и удалениях также записывались значения до изменения:

```sql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);
```

Запишите первую порцию данных:

```sql
INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'created', 300.00);
```

## Шаг 2: Создайте Table Stream {#step-2-create-a-table-stream}

<!-- Knowledge type: Operational steps -->

Создайте Stream для таблицы `orders`; с этого момента изменения в `orders` будут читаться и обрабатываться через него:

```sql
CREATE STREAM orders_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

- `type = min_delta`: выдавать итоговое изменение каждого ключа между двумя операциями потребления.
- `show_initial_rows = false`: 3 уже существующие строки не выдаются как изменения; учитываются только последующие изменения.

На этом этапе запрос к Stream ничего не возвращает:

```sql
SELECT * FROM orders_stream;
```

```text
Empty set
```

## Шаг 3: Запишите вторую порцию изменений {#step-3-write-the-second-batch-of-changes}

<!-- Knowledge type: Operational steps -->

Эта порция охватывает четыре сценария: обновление, удаление, вставку и вставку с последующим удалением:

```sql
-- Update order 1 (writing the same key into a Unique Key table is an update)
INSERT INTO orders VALUES (1, 'paid', 100.00);
-- Delete order 2
DELETE FROM orders WHERE order_id = 2;
-- New order 4
INSERT INTO orders VALUES (4, 'created', 400.00);
-- New order 5, deleted right after
INSERT INTO orders VALUES (5, 'created', 500.00);
DELETE FROM orders WHERE order_id = 5;
```

## Шаг 4: Просмотрите изменения {#step-4-view-the-changes}

<!-- Knowledge type: Operational steps + Result interpretation -->

Выполните запрос к Stream с двумя виртуальными столбцами: `__DORIS_STREAM_CHANGE_TYPE_COL__` содержит тип изменения, а `__DORIS_STREAM_SEQUENCE_COL__` — временную метку фиксации (TSO) изменения. Виртуальные столбцы не включаются в `SELECT *`, их нужно перечислять явно.

```sql
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type,
       __DORIS_STREAM_SEQUENCE_COL__ AS change_tso
FROM orders_stream
ORDER BY order_id, change_type DESC;
```

```text
+----------+---------+--------+---------------+--------------------+
| order_id | status  | amount | change_type   | change_tso         |
+----------+---------+--------+---------------+--------------------+
|        1 | created | 100.00 | UPDATE_BEFORE | 469067680972800000 |
|        1 | paid    | 100.00 | UPDATE_AFTER  | 469067680972800000 |
|        2 | created | 200.00 | DELETE        | 469067681287372800 |
|        4 | created | 400.00 | APPEND        | 469067681628160003 |
+----------+---------+--------+---------------+--------------------+
```

Операциям из шага 3 соответствуют следующие результаты:

| Операция из шага 3 | Результат Stream |
|---|---|
| Обновление заказа 1 | Пара записей: `UPDATE_BEFORE` (значение до обновления) и `UPDATE_AFTER` (значение после обновления) |
| Удаление заказа 2 | Одна запись `DELETE` со значением до удаления |
| Вставка заказа 4 | Одна запись `APPEND` (новый ключ) |
| Вставка заказа 5 с последующим удалением | Итоговое изменение между двумя операциями потребления отсутствует, поэтому `min_delta` ничего не выдаёт |

Если выполнить тот же запрос ещё раз, результат будет точно таким же: **обычный SELECT только читает изменения и никогда не продвигает позицию потребления.**

## Шаг 5: Обработайте изменения {#step-5-consume-the-changes}

<!-- Knowledge type: Operational steps -->

Используйте `INSERT INTO ... SELECT ... FROM <stream>`, чтобы записать изменения в целевую таблицу. Эта инструкция продвигает позицию потребления в той же транзакции, в которой выполняется запись:

```sql
CREATE TABLE orders_changes (
    order_id    BIGINT,
    status      VARCHAR(16),
    amount      DECIMAL(10, 2),
    change_type VARCHAR(16),
    change_tso  BIGINT
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO orders_changes
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__,
       __DORIS_STREAM_SEQUENCE_COL__
FROM orders_stream;
```

После потребления в Stream не остаётся необработанных изменений:

```sql
SELECT COUNT(*) FROM orders_stream;
```

```text
+----------+
| count(*) |
+----------+
|        0 |
+----------+
```

Запишите новые изменения, и Stream вернёт только то, что произошло после этой операции потребления:

```sql
INSERT INTO orders VALUES (4, 'paid', 400.00);

SELECT order_id, status, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM orders_stream ORDER BY change_type DESC;
```

```text
+----------+---------+---------------+
| order_id | status  | change_type   |
+----------+---------+---------------+
|        4 | created | UPDATE_BEFORE |
|        4 | paid    | UPDATE_AFTER  |
+----------+---------+---------------+
```

## Шаг 6: Проверьте прогресс потребления {#step-6-check-the-consumption-progress}

<!-- Knowledge type: Operational steps + Operations monitoring -->

`information_schema.table_stream_consumption` показывает позицию потребления и отставание каждого Stream по разделам:

```sql
SELECT STREAM_NAME, UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream';
```

```text
+---------------+--------+--------------------+-----------+-----------------------+
| STREAM_NAME   | UNIT   | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+---------------+--------+--------------------+-----------+-----------------------+
| orders_stream | orders | 469067681628160003 | 262144000 |         1789351206000 |
+---------------+--------+--------------------+-----------+-----------------------+
```

| Столбец | Значение |
|---|---|
| `UNIT` | Единица потребления, то есть раздел базовой таблицы. В `orders` разделы явно не заданы, поэтому она содержит один раздел с именем таблицы |
| `CONSUMPTION_STATUS` | TSO, до которого обработаны изменения в разделе |
| `LAG` | Разница между последним зафиксированным TSO раздела и TSO, до которого обработаны изменения; `0` означает отсутствие отставания |
| `LAST_CONSUMPTION_TIME` | Время последнего потребления (временная метка в миллисекундах); `-1` означает, что потребление ещё не выполнялось |

Повторно выполните `INSERT INTO orders_changes SELECT ...` из шага 5, и `LAG` снова станет равным `0`.

## Очистка {#clean-up}

```sql
DROP STREAM orders_stream;
DROP TABLE orders_changes;
DROP TABLE orders;
```

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

| Проблема | Причина и решение |
|---|---|
| Создание Stream завершается ошибкой `Table Stream is experimental. Please set enable_table_stream=true to enable it.` | Параметр `enable_table_stream` не включён на FE либо FE не был перезапущен после изменения `fe.conf`. Выполните [предварительные требования](#prerequisites) |
| Stream пуст сразу после создания | При `show_initial_rows = false` данные, существующие на момент создания Stream, не выдаются как изменения. Запишите новые изменения и повторите запрос |
| `SELECT * FROM orders_stream` не показывает тип изменения | Виртуальные столбцы не включаются в `SELECT *`; явно перечислите `__DORIS_STREAM_CHANGE_TYPE_COL__` и `__DORIS_STREAM_SEQUENCE_COL__` |
| Каждый запрос снова возвращает одни и те же изменения | Обычный `SELECT` только читает изменения и никогда не продвигает позицию потребления. Изменения перестанут возвращаться после их потребления с помощью `INSERT INTO ... SELECT ... FROM orders_stream` |
| Включение changelog для существующей таблицы | Changelog можно включить только при создании таблицы; создайте новую таблицу с включённым changelog и заново загрузите данные, см. [Changelog](changelog#enabling-changelog) |
| `LAST_CONSUMPTION_TIME` показывает `-1` | Потребление изменений из раздела ещё ни разу не выполнялось |

## Дальнейшие шаги {#next-steps}

- Различия между тремя типами потребления, значение `show_initial_rows` и транзакционная семантика чтения и потребления: [Основы Table Stream](table-stream)
- Потребление по отдельным разделам, чтение снимков, соединения с таблицами измерений и влияние DDL базовой таблицы на Stream: [Расширенные возможности Table Stream](table-stream-advanced)
- Свойства changelog, поддерживаемые сценарии и ограничения: [Changelog](changelog)
- Чтение изменений за заданный временной интервал без создания Stream: [Инкрементальные запросы](incremental-query)
