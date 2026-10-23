---
{
    "title": "WINDOW_FUNNEL",
    "language": "ru",
    "description": "Функция WINDOWFUNNEL анализирует последовательности действий пользователей, находя цепочки событий в заданном временном окне и вычисляя максимальное "
}
---

## Описание {#description}

Функция WINDOW_FUNNEL анализирует последовательности действий пользователей, находя цепочки событий в заданном временном окне и вычисляя максимальное количество выполненных шагов в цепочке. Эта функция особенно полезна для анализа воронки конверсии, например для анализа перехода пользователей от посещения сайта к совершению покупки.

Функция работает по следующему алгоритму:

- Функция ищет данные, удовлетворяющие первому условию цепочки, и устанавливает значение счётчика событий равным 1. С этого момента начинается отсчёт скользящего окна.
- Если события цепочки происходят последовательно в пределах окна, счётчик увеличивается. Если последовательность событий нарушается, счётчик не увеличивается.
- Если данные содержат несколько цепочек событий с разной степенью завершённости, функция выводит только длину самой длинной цепочки.

## Синтаксис {#syntax}

```sql
WINDOW_FUNNEL(<window>, <mode>, <timestamp>, <event_1>[, event_2, ... , event_n])
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<window>` | window задаёт длительность временного окна в секундах |
| `<mode>` | Всего доступно четыре режима: `default`, `deduplication`, `fixed` и `increase`. Подробнее см. ниже в разделе **Режим**. |
| `<timestamp>` | Столбец временных меток, используемый скользящим окном. Поддерживаются `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. |
| `<event_n>` | evnet_n представляет собой логическое выражение, например eventID = 1004 |

**Режим**

    - `default`: Standard funnel calculation. Doris searches for the longest event chain that matches the specified order within the time window. Events that do not match any condition are ignored.

    - `deduplication`: Based on `default`, but an event that has already been matched in the current chain cannot appear again. For example, if the condition list is [event1='A', event2='B', event3='C', event4='D'] and the original event chain is `A-B-C-B-D`, the second `B` breaks the chain, so the matched event chain is `A-B-C` and the max level is `3`.

    - `fixed`: The chain must advance in the specified order and cannot skip intermediate steps. If an event that matches a later condition appears before its immediate predecessor is matched, the chain stops. Events that do not match any condition are ignored and do not break the chain. For example, with [event1='A', event2='B', event3='C', event4='D'], `A-B-D-C` returns `A-B` and level `2`; with `A-B-X-C-D` (`X` matches none of the conditions), Doris returns `A-B-C-D`.

    - `increase`: Based on `default`, but matched events must have strictly increasing timestamps. If two matched events have the same timestamp, the later event cannot advance the chain.

## Возвращаемое значение {#return-value}
Возвращает целое число, обозначающее максимальное количество последовательных шагов, выполненных в заданном временном окне.

## Примеры {#examples}

### Пример 1: режим default {#example1-default-mode}

В режиме `default` определим максимальное количество последовательных событий для разных `user_id` при временном окне в `5` минут:

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 3),
    (100123, 'payment', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        300,
        "default",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```

Для `user_id=100123` событие `payment` произошло за пределами временного окна, поэтому найденная цепочка событий имеет вид `login-visit-order`.

### Пример 2: режим deduplication {#example2-deduplication-mode}

В режиме `deduplication` определим максимальное количество последовательных событий для разных user_ids при временном окне в 1 час:

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'login', '2022-05-14 10:03:00', 'HONOR', 3),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 4),
    (100123, 'payment', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "deduplication",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     2 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
Для `user_id=100123` после сопоставления события `visit` событие `login` появляется повторно, поэтому найденная цепочка событий имеет вид `login-visit`.

### Пример 3: режим fixed {#example3-fixed-mode}

В режиме `fixed` определим максимальное количество последовательных событий для разных `user_id` при временном окне в `1` час:

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'login2', '2022-05-14 10:03:00', 'HONOR', 3),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 4),
    (100123, 'payment', '2022-05-14 10:10:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "fixed",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     4 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
Для `user_id=100123` событие `login2` не соответствует ни одному условию воронки, поэтому оно не прерывает цепочку в режиме `fixed`. Найденная цепочка событий имеет вид `login-visit-order-payment`.

### Пример 4: режим increase {#example4-increase-mode}

В режиме `increase` определим максимальное количество последовательных событий для разных `user_id` при временном окне в `1` час:

```sql
CREATE TABLE events(
    user_id BIGINT,
    event_name VARCHAR(64),
    event_timestamp datetime,
    phone_brand varchar(64),
    tab_num int
) distributed by hash(user_id) buckets 3 properties("replication_num" = "1");

INSERT INTO
    events
VALUES
    (100123, 'login', '2022-05-14 10:01:00', 'HONOR', 1),
    (100123, 'visit', '2022-05-14 10:02:00', 'HONOR', 2),
    (100123, 'order', '2022-05-14 10:04:00', 'HONOR', 4),
    (100123, 'payment', '2022-05-14 10:04:00', 'HONOR', 4),
    (100125, 'login', '2022-05-15 11:00:00', 'XIAOMI', 1),
    (100125, 'visit', '2022-05-15 11:01:00', 'XIAOMI', 2),
    (100125, 'order', '2022-05-15 11:02:00', 'XIAOMI', 6),
    (100126, 'login', '2022-05-15 12:00:00', 'IPHONE', 1),
    (100126, 'visit', '2022-05-15 12:01:00', 'HONOR', 2),
    (100127, 'login', '2022-05-15 11:30:00', 'VIVO', 1),
    (100127, 'visit', '2022-05-15 11:31:00', 'VIVO', 5);

SELECT
    user_id,
    window_funnel(
        3600,
        "increase",
        event_timestamp,
        event_name = 'login',
        event_name = 'visit',
        event_name = 'order',
        event_name = 'payment'
    ) AS level
FROM
    events
GROUP BY
    user_id
order BY
    user_id;
```

```text
+---------+-------+
| user_id | level |
+---------+-------+
|  100123 |     3 |
|  100125 |     3 |
|  100126 |     2 |
|  100127 |     2 |
+---------+-------+
```
Для `user_id=100123` временные метки событий `payment` и `order` приходятся на одну и ту же секунду и не возрастают, поэтому найденная цепочка событий имеет вид `login-visit-order`.
