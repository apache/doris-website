---
{
    "title": "Инкрементальный запрос",
    "language": "ru",
    "description": "Чтение изменений на уровне строк таблицы Doris за временное окно с помощью @incr без Table Stream: синтаксис, примеры и ограничения APPEND_ONLY, MIN_DELTA, DETAIL.",
    "keywords": [
        "@incr",
        "Doris incremental query",
        "incremental query",
        "startTimestamp",
        "endTimestamp",
        "incrementType",
        "APPEND_ONLY",
        "MIN_DELTA",
        "DETAIL",
        "changes by time window",
        "stateless incremental read",
        "__DORIS_CHANGELOG_OP__",
        "changelog query",
        "external scheduler incremental ETL",
        "INCR query requires changelog enabled on base table",
        "Table Stream vs @incr"
    ]
}
---

<!-- Knowledge type: Operations guide + Syntax description -->
<!-- Use cases: Ad-hoc incremental reads by time range / External systems managing their own positions -->

Если для таблицы включён [changelog](changelog), изменения можно не только получать через [Table Stream](table-stream), но и читать за указанное временное окно непосредственно в запросе с `@incr`, без создания объектов и сохранения смещения чтения. Это обычный запрос без сохранения состояния, который можно свободно сочетать с WHERE, JOIN, агрегацией и другими операциями.

:::caution Экспериментальная функция
Эта функция доступна начиная с версии 5.0.0 и является экспериментальной. Пока используйте `@incr` в режиме с совмещёнными хранением и вычислениями; поддержка режима с разделением вычислений и хранения ещё находится в разработке.
:::

## Отличия от Table Stream {#differences-from-table-stream}

<!-- Knowledge type: Comparison + Selection guide -->

| | Инкрементальный запрос `@incr` | Table Stream |
|---|---|---|
| Создание объекта | Не требуется | Требуется |
| Диапазон чтения | Указанное вами временное окно | От последнего смещения чтения до текущего момента |
| Кто отслеживает позицию | Вы (например, внешний планировщик сохраняет последнее окно) | Doris, отдельно для каждого раздела; позиция продвигается атомарно в рамках транзакции, читающей изменения |
| Повторное чтение | Одно и то же окно можно читать многократно | Уже прочитанные изменения повторно не возвращаются |
| Лучше всего подходит для | Разового анализа, просмотра изменений за период, внешних систем с собственным управлением позицией чтения | Непрерывного инкрементального ETL с гарантией exactly-once |

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris версии 5.0.0 или новее с `enable_feature_changelog = true` на FE.
- На базовой таблице должен быть включён changelog, иначе запрос завершится ошибкой `INCR query requires changelog enabled on base table.`.
- Для режима `MIN_DELTA` нужна базовая таблица Unique Key MoW с включённым `changelog.need_historical_value`.
- Пока поддерживается только режим с совмещёнными хранением и вычислениями.

## Синтаксис {#syntax}

<!-- Knowledge type: Syntax reference -->

```sql
SELECT ... FROM <table_name>@incr(
    ["startTimestamp" = "<datetime>",]
    ["endTimestamp"   = "<datetime>",]
    ["incrementType"  = "<APPEND_ONLY | MIN_DELTA | DETAIL>"]
) [PARTITION (<partition_name>, ...)] [<alias>]
[WHERE ...]
```

### Параметры {#parameters}

<!-- Knowledge type: Parameter reference -->

| Параметр | Значение по умолчанию | Описание |
|---|---|---|
| `startTimestamp` | первый сохранённый TSO | Необязательный. Начало окна в формате `yyyy-MM-dd HH:mm:ss`, интерпретируется с учётом параметра сеанса `time_zone`. Возвращаются изменения, время фиксации которых **больше или равно** началу окна, с учётом срока хранения, заданного для базовой таблицы в `changelog.ttl_seconds` |
| `endTimestamp` | без ограничения | Необязательный. Конец окна в том же формате. Возвращаются изменения, время фиксации которых **меньше** конца окна |
| `incrementType` | `MIN_DELTA` | Необязательный. Режим инкрементального чтения, см. [Три режима инкрементального чтения](#the-three-incremental-modes) |

Все три параметра можно опустить; `t@incr()` читает сохранённые изменения в режиме `MIN_DELTA`. Если явно заданное начало выходит за пределы окна хранения, режим `MIN_DELTA` возвращает ошибку; `DETAIL` и `APPEND_ONLY` сдвигают фактическое начало к первому сохранённому TSO. См. [Хранение и очистка](changelog#retention-and-cleanup). Окно представляет собой интервал с включённой левой и исключённой правой границей `[startTimestamp, endTimestamp)`; если начало позже конца или находится в будущем, запрос возвращает пустой результат при условии, что начало проходит проверку срока хранения.

### Столбцы результата {#result-columns}

Результат содержит видимые столбцы базовой таблицы и следующие скрытые столбцы:

| Скрытый столбец | Описание |
|---|---|
| `__DORIS_CHANGELOG_OP__` | Тип изменения: `0` вставка (APPEND), `1` удаление (DELETE), `2` строка до обновления (UPDATE_BEFORE), `3` строка после обновления (UPDATE_AFTER) |
| `__DORIS_CHANGELOG_TSO__` | Временная метка фиксации изменения |
| `__DORIS_CHANGELOG_LSN__` | Порядковый номер внутри транзакции, используется вместе с TSO для упорядочивания |

## Три режима инкрементального чтения {#the-three-incremental-modes}

<!-- Knowledge type: Behavior rules + Selection guide -->

| Режим | Результат | Требования к базовой таблице |
|---|---|---|
| `APPEND_ONLY` | Строки, вставленные в пределах окна. Обновления и удаления не выводятся | Включён changelog |
| `MIN_DELTA` | Итоговое изменение каждого ключа за окно; см. правила свёртки ниже | Для таблиц MoW должен быть включён `changelog.need_historical_value` |
| `DETAIL` | Каждое изменение в пределах окна; обновление разбивается на строку UPDATE_BEFORE и строку UPDATE_AFTER | Включён changelog |

`MIN_DELTA` сравнивает состояние каждого ключа в начале и в конце окна:

| Ключ существует в начале окна | Ключ существует в конце окна | Результат |
|---|---|---|
| Нет | Да | Одна запись APPEND |
| Да | Да, и за это время он был изменён | Одна запись UPDATE_BEFORE (значение в начале) + одна запись UPDATE_AFTER (значение в конце) |
| Да | Нет | Одна запись DELETE |
| Нет | Нет | Ничего |

Для таблиц Duplicate Key все три режима возвращают одинаковый результат: в таблицах Duplicate Key есть только вставки, поэтому сворачивать нечего.

## Примеры {#examples}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Comparing the output of the three modes on the same batch of changes -->

### Подготовка данных {#data-preparation}

В примерах используется таблица `orders` из раздела [Быстрый старт](quick-start) (Unique Key MoW с включённым сохранением образа строки до изменения). Предположим, что два пакета данных были записаны в следующие моменты времени:

```sql
-- 10:00, first batch
INSERT INTO orders VALUES (1, 'created', 100.00), (2, 'created', 200.00), (3, 'created', 300.00);

-- 10:05, second batch
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update order 1
DELETE FROM orders WHERE order_id = 2;              -- delete order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

### MIN_DELTA: итоговые изменения между 10:03 и 10:10 {#min_delta-net-changes-between-1003-and-1010}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "MIN_DELTA"
)
ORDER BY order_id, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

Заказ 5 был добавлен и удалён в пределах окна; итоговых изменений нет, поэтому он не выводится.

### APPEND_ONLY: строки, вставленные в пределах того же окна {#append_only-rows-inserted-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "APPEND_ONLY"
)
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
+----------+---------+--------+------+
```

Обновление заказа 1 и удаление заказа 2 отфильтровываются; вставка заказа 5 выводится, а его последующее удаление не отменяет запись об этой вставке.

### DETAIL: каждое изменение в пределах того же окна {#detail-every-change-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "DETAIL"
)
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
|        5 | created | 500.00 |    1 |
+----------+---------+--------+------+
```

### Без указания окна: итоговые изменения с момента создания таблицы {#no-window-net-changes-since-the-table-was-created}

В этом примере предполагается, что все изменения с момента создания таблицы ещё находятся в пределах окна хранения. В противном случае запрос без указания окна читает только сохранённые изменения.

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr()
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | paid    | 100.00 |    0 |
|        3 | created | 300.00 |    0 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

Если отсчитывать от момента создания таблицы, в начале нет ни одного ключа, поэтому каждый ключ, который всё ещё существует, выводится как APPEND с последним значением, а удалённые заказы 2 и 5 не выводятся.

## Рекомендации {#recommendations}

<!-- Knowledge type: Usage recommendations -->
<!-- Use cases: Periodic increments driven by an external scheduler -->

- Когда инкрементальное чтение запускается внешним планировщиком, используйте предыдущий `endTimestamp` как следующий `startTimestamp`; в пределах окна хранения включённая левая и исключённая правая границы окна гарантируют отсутствие пропусков и дубликатов. Задержка чтения должна быть меньше `changelog.ttl_seconds`. Учтите, что окна определяются по времени фиксации: ещё выполняющаяся транзакция не попадает в текущее окно и появится в окне, содержащем момент её фиксации.
- Если важны только последние значения, а значения до обновления не нужны, оставляйте только строки, удовлетворяющие условию `__DORIS_CHANGELOG_OP__ IN (0, 1, 3)`.
- Запрос `@incr` читает все записи об изменениях в пределах окна; чем больше окно, тем больше записей он читает. По возможности указывайте окно явно.

## Ограничения и распространённые ошибки {#limitations-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

| Ограничение | Сообщение об ошибке | Действие |
|---|---|---|
| На базовой таблице должен быть включён changelog | `INCR query requires changelog enabled on base table.` | Пересоздайте базовую таблицу с `"changelog.enable" = "true"`, см. [Changelog](changelog#enabling-changelog) |
| `MIN_DELTA` требует таблицу Unique Key MoW с включённым `changelog.need_historical_value` | `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` или `... requires base table to enable changelog.need_historical_value=true` | Пересоздайте базовую таблицу с нужными настройками или используйте `APPEND_ONLY` / `DETAIL` |
| Читать можно только базовый индекс | - | Нельзя указывать материализованные представления и rollups |
| Подсказка `PREAGGOPEN` не поддерживается | - | Удалите подсказку |
| Допускаются только `startTimestamp`, `endTimestamp` и `incrementType` | `Unsupported parameter in incr query` | Проверьте написание имён параметров |
