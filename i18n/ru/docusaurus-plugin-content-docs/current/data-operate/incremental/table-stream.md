---
{
    "title": "Основы Table Stream",
    "language": "ru",
    "description": "Руководство по Table Stream в Doris: создание, просмотр и удаление объектов Stream, типы потребления append_only / min_delta / detail, show_initial_rows, различия между чтением и потреблением.",
    "keywords": [
        "Table Stream",
        "Doris Stream",
        "CREATE STREAM",
        "DROP STREAM",
        "SHOW STREAMS",
        "SHOW CREATE STREAM",
        "ALTER STREAM",
        "append_only",
        "min_delta",
        "detail",
        "show_initial_rows",
        "consumption offset",
        "offset",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "__DORIS_STREAM_LSN_COL__",
        "APPEND UPDATE_BEFORE UPDATE_AFTER DELETE",
        "incremental ETL",
        "downstream table sync",
        "__DORIS_DELETE_SIGN__",
        "information_schema.table_streams",
        "enable_table_stream",
        "Incremental View Maintenance",
        "IVM",
        "change data consumption"
    ]
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Incremental ETL / Downstream table sync / Change auditing / Exactly-once consumption of table changes -->

Table Stream (далее Stream) — это объект для потребления изменений, построенный на основе [changelog](changelog). Он хранит позицию потребления: при каждом чтении возвращаются только изменения базовой таблицы с момента последнего потребления, а смещение потребления продвигается в той же транзакции, которая записывает изменения в целевую таблицу. Благодаря этому изменения не пропускаются и не потребляются повторно.

:::caution Экспериментальная функция
Эта функция доступна начиная с версии 5.0.0 и является экспериментальной. Для неё необходимо задать `enable_feature_changelog = true` и `enable_table_stream = true` в конфигурации FE.
:::

## Основные понятия {#basic-concepts}

<!-- Knowledge type: Concept description -->

| Понятие | Описание |
|---|---|
| Базовая таблица | Таблица, изменения которой отслеживает Stream; для неё должен быть включён changelog. У одной базовой таблицы может быть несколько объектов Stream, каждый из которых потребляет изменения независимо |
| Смещение потребления | Для каждой партиции базовой таблицы Stream хранит временную метку фиксации (TSO), до которой изменения уже потреблены. При чтении Stream для каждой партиции возвращаются изменения между её смещением и последней фиксацией на момент начала выполнения оператора |
| Тип изменения | `APPEND` (вставка), `UPDATE_BEFORE` (значение до обновления), `UPDATE_AFTER` (значение после обновления), `DELETE` (удаление, содержащее значение до удаления) |
| Тип потребления | Значение `type`, указанное при создании Stream; определяет, с какой детализацией выдаются изменения. См. [Типы потребления](#consumption-types) |
| Чтение и потребление | Обычный `SELECT` только читает изменения и никогда не продвигает смещение; `INSERT INTO ... SELECT ... FROM <stream>` продвигает смещение при успешной записи. См. [Чтение и потребление](#reading-and-consuming) |

:::info Внутренние объекты Stream для IVM
[Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) автоматически создаёт внутренние объекты Stream, имена которых начинаются с `__doris_ivm_stream_`. Создавать, потреблять или удалять эти объекты Stream самостоятельно не требуется, а Doris не разрешает использовать их в обычных операторах `INSERT INTO`.
:::

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 или новее с включёнными `enable_feature_changelog = true` и `enable_table_stream = true` на FE.
- Внутренняя базовая таблица с включённым changelog; для типов `min_delta` / `detail` дополнительно требуется таблица Unique Key MoW с включённым `changelog.need_historical_value`. См. [Changelog](changelog#supported-scope-and-limitations).
- Право `CREATE_PRIV` на базу данных Stream и право `SELECT_PRIV` на базовую таблицу.

## Создание объектов Stream и управление ими {#creating-and-managing-streams}

<!-- Knowledge type: Operational steps + Syntax reference -->

### Создание Stream {#creating-a-stream}

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES (
    "type" = "<append_only | min_delta | detail>",
    "show_initial_rows" = "<true | false>"
)]
```

| Свойство | По умолчанию | Описание |
|---|---|---|
| `type` | `min_delta` | Тип потребления. Для `min_delta` и `detail` базовая таблица должна быть таблицей Unique Key MoW с включённым `changelog.need_historical_value`; на таблицах Duplicate Key тип `min_delta` работает как `append_only` |
| `show_initial_rows` | `false` | Определяет, выдаются ли в виде изменений данные, уже существующие на момент создания Stream. См. [Начальные строки](#initial-rows) |

Пример:

```sql
CREATE STREAM orders_stream ON TABLE orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

Требования для создания Stream и ошибки при их невыполнении:

| Требование | Ошибка при невыполнении |
|---|---|
| На базовой таблице включён changelog | `Base Olap table ... need to enable changelog for table stream` |
| Для `type = min_delta` требуется базовая таблица MoW с включённым `changelog.need_historical_value` | `MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true` |
| Право `CREATE_PRIV` на базу данных Stream и право `SELECT_PRIV` на базовую таблицу | - |

Stream и его базовая таблица могут находиться в разных базах данных. Имя Stream не должно совпадать с именем таблицы или представления. `CREATE OR REPLACE STREAM` пока не поддерживается. Полный синтаксис приведён в [CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM).

### Просмотр объектов Stream {#viewing-streams}

```sql
-- List the Streams in the current database
SHOW STREAMS;
SHOW STREAMS FROM demo LIKE 'orders%';

-- Show the CREATE STREAM statement
SHOW CREATE STREAM orders_stream;

-- Show the columns of the Stream (the same as the current visible columns of the base table)
DESC orders_stream;
```

```text
mysql> SHOW CREATE STREAM orders_stream\G
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```

`information_schema.table_streams` содержит список всех объектов Stream и их состояний; `information_schema.table_stream_consumption` показывает смещение потребления и объём ещё не потреблённых изменений для каждой партиции:

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```

Полные описания столбцов этих системных таблиц приведены в [table_streams](../../admin-manual/system-tables/information_schema/table_streams) и [table_stream_consumption](../../admin-manual/system-tables/information_schema/table_stream_consumption); операторы описаны в [SHOW STREAMS](../../sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS) и [SHOW CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM).

### Изменение Stream {#modifying-a-stream}

В настоящее время можно изменить только комментарий:

```sql
ALTER STREAM orders_stream SET COMMENT 'new comment';
```

Тип потребления и `show_initial_rows` нельзя изменить после создания; для этого удалите Stream и создайте его заново. Оператор описан в [ALTER STREAM](../../sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM).

### Удаление Stream {#dropping-a-stream}

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE];
```

- Удаление Stream не влияет на базовую таблицу или её changelog.
- Stream, базовая таблица которого была удалена, остаётся в Catalog; удалите его с помощью `FORCE`.
- В режиме с разделением вычислений и хранения использование `DROP STREAM ... FORCE` обязательно.
- Выполнение `DROP TABLE` для Stream завершается ошибкой с подсказкой использовать `DROP STREAM`.

Оператор описан в [DROP STREAM](../../sql-manual/sql-statements/table-and-view/stream/DROP-STREAM).

## Типы потребления {#consumption-types}

<!-- Knowledge type: Behavior rules + Selection guide -->
<!-- Use cases: Choosing between append_only / min_delta / detail -->

| Тип потребления | Выдаваемые данные | Для чего подходит | Требования к базовой таблице |
|---|---|---|---|
| `append_only` | Только вставленные строки; обновления и удаления не выдаются | Журналы append-only и таблицы событий; потребителю нужны только новые данные | Включённый changelog |
| `min_delta` (по умолчанию) | Все изменения между двумя потреблениями сворачиваются по ключу; выдаётся только итоговое изменение | Синхронизация таблицы-получателя с обработкой минимального числа строк | Таблица Unique Key MoW с включённым `changelog.need_historical_value` |
| `detail` | Каждое изменение выдаётся построчно, без свёртки | Аудит, повторное воспроизведение изменений и любые сценарии, в которых нужна полная история изменений | Таблица Unique Key MoW с включённым `changelog.need_historical_value` |

Ниже эти три типа потребления сравниваются на одних и тех же данных. Базовая таблица `orders` — это таблица Unique Key MoW с включённым сохранением значений до изменения. После создания Stream выполняются следующие операторы:

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update existing order 1
DELETE FROM orders WHERE order_id = 2;              -- delete existing order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

Затем выполните:

```sql
SELECT order_id, status, amount, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM <stream>
ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__;
```

### append_only {#append_only}

Выдаются только вставленные строки; обновления и удаления не выдаются. Этот тип подходит для журналов append-only и таблиц событий, а также для случаев, когда потребителю нужны только новые данные.

```text
+----------+---------+--------+-------------+
| order_id | status  | amount | change_type |
+----------+---------+--------+-------------+
|        4 | created | 400.00 | APPEND      |
|        5 | created | 500.00 | APPEND      |
+----------+---------+--------+-------------+
```

- Обновление заказа 1 и удаление заказа 2 отфильтровываются.
- Вставка заказа 5 выдаётся; последующее удаление не отменяет её.
- В таблицах MoW вставкой считается только запись ключа, которого ещё нет; запись существующего ключа считается обновлением и не выдаётся.

### min_delta (по умолчанию) {#min_delta-default}

Все изменения между двумя потреблениями сворачиваются по ключу, и выдаётся только итоговое изменение:

| Ключ существует на начало потребления | Существует сейчас | Выдаваемые данные |
|---|---|---|
| Нет | Да | Одна строка `APPEND` с текущим значением |
| Да | Да (за это время был изменён) | Одна строка `UPDATE_BEFORE` (значение на начало периода) + одна строка `UPDATE_AFTER` (текущее значение) |
| Да | Нет | Одна строка `DELETE` со значением на начало периода |
| Нет | Нет | Ничего |

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
+----------+---------+--------+---------------+
```

- Заказ 5 был вставлен, а затем удалён; итоговое изменение отсутствует, поэтому ничего не выдаётся.
- Если ключ обновлялся несколько раз между двумя потреблениями, выдаётся только одна пара `UPDATE_BEFORE` / `UPDATE_AFTER`; промежуточные значения исключаются при свёртке.
- Свёртка начинается с текущего смещения потребления партиции. Если заказ 4 снова изменится после этого потребления, строка `UPDATE_BEFORE` при следующем чтении будет содержать значение на момент этого потребления.

`min_delta` — наиболее распространённый тип для поддержания синхронизации таблицы-получателя: в неё записываются строки `APPEND` / `UPDATE_AFTER`, а по строкам `DELETE` выполняются удаления. В результате таблица остаётся согласованной с базовой таблицей, а число обрабатываемых строк минимально.

### detail {#detail}

Каждое изменение выдаётся построчно; обновление разбивается на строку `UPDATE_BEFORE` и строку `UPDATE_AFTER`, свёртка не выполняется. Этот тип подходит для аудита, повторного воспроизведения изменений и любых сценариев, в которых нужна полная история изменений.

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
|        5 | created | 500.00 | APPEND        |
|        5 | created | 500.00 | DELETE        |
+----------+---------+--------+---------------+
```

### Поведение на таблицах Duplicate Key {#behavior-on-duplicate-key-tables}

Таблицы Duplicate Key фиксируют только вставки, поэтому все три типа выдают одинаковый результат: каждая записанная строка выдаётся как отдельная строка `APPEND`, несколько записей с одним и тем же ключом не объединяются, а строки, удалённые операторами `DELETE`, не выдаются (см. [Changelog](changelog#duplicate-key-tables)). Stream типа `min_delta`, созданный на таблице Duplicate Key, автоматически обрабатывается как `append_only`.

## Начальные строки {#initial-rows}

<!-- Knowledge type: Configuration parameters + Behavior rules -->
<!-- Use cases: Syncing the existing data first, then the increments -->

`show_initial_rows` определяет, выдаются ли данные, уже существующие на момент создания Stream:

| Значение | Поведение |
|---|---|
| `false` (по умолчанию) | Смещение потребления инициализируется последней фиксацией каждой партиции на момент создания; выдаются только изменения, произошедшие после создания |
| `true` | При первом чтении все текущие данные базовой таблицы выдаются в виде строк `APPEND` (значение `__DORIS_STREAM_SEQUENCE_COL__` каждой строки — временная метка фиксации её партиции); после этого потребления Stream переходит к выдаче только приращений |

`show_initial_rows = true` подходит для схемы «сначала синхронизировать существующие данные, затем продолжать синхронизацию приращений» без отдельной полной загрузки. Обратите внимание: первое чтение возвращает полный снимок **на момент чтения**. Изменения, произошедшие между созданием Stream и первым потреблением, отражаются в этом снимке, а не выдаются как отдельные изменения.

Независимо от значения этого свойства все данные партиций, добавленных после создания Stream, выдаются в виде изменений.

## Чтение и потребление {#reading-and-consuming}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Understanding which operations advance the consumption offset -->

### Чтение не продвигает смещение {#reads-do-not-advance-the-offset}

Обычный `SELECT` из Stream возвращает для каждой партиции изменения между её смещением потребления и последней фиксацией на момент начала выполнения оператора. Смещение не меняется, и повторное выполнение запроса возвращает тот же результат, если между запросами в базовую таблицу не поступали новые записи. Записи, поступившие между двумя запросами, появляются в результате более позднего запроса.

Stream можно использовать как обычную таблицу: с WHERE, JOIN, агрегацией, CTE и так далее:

```sql
-- Only deletes
SELECT order_id FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE';

-- Count the pending changes
SELECT __DORIS_STREAM_CHANGE_TYPE_COL__, COUNT(*)
FROM orders_stream GROUP BY 1;
```

### INSERT ... SELECT продвигает смещение {#insert--select-advances-the-offset}

`INSERT INTO <target> SELECT ... FROM <stream>` продвигает смещения потребления задействованных партиций до верхней границы диапазона текущего чтения при фиксации транзакции записи:

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

Семантика потребления:

| Свойство | Описание |
|---|---|
| Атомарность | Запись в целевую таблицу и продвижение смещения происходят в одной транзакции. Если оператор завершается ошибкой или отменяется, смещение остаётся прежним и при следующем потреблении тот же пакет читается повторно |
| Отсутствие повторного потребления | Уже потреблённый пакет изменений больше не возвращается. Если два сеанса одновременно потребляют одну и ту же партицию одного Stream, транзакция, которая фиксируется позже, завершается ошибкой (`target offset already consumed`) и откатывается, поэтому изменения не потребляются дважды |
| Отфильтрованные строки пропускаются | Смещение продвигается по диапазону чтения независимо от того, отфильтровал ли SELECT часть строк с помощью WHERE. В приведённом выше примере отфильтрованные строки `UPDATE_BEFORE` и `DELETE` больше не появятся; если потребителю нужны и удаления, записывайте их в том же операторе или потребляйте через отдельный Stream |
| Пустой результат тоже продвигает смещение | Даже если чтение не возвращает ни одной строки, смещение продвигается до верхней границы диапазона текущего чтения |
| Один оператор может потреблять несколько объектов Stream | Продвигаются смещения всех этих объектов. Если один Stream упоминается в операторе несколько раз через псевдонимы, CTE или подзапросы, его смещение продвигается только один раз, а все обращения видят одни и те же данные |

Целевая таблица должна быть внутренней таблицей Doris. В режиме с разделением вычислений и хранения оператор потребления должен быть обычным `INSERT INTO ... SELECT`; выполнение внутри явной транзакции (`BEGIN ... COMMIT`) или с Group Commit завершается ошибкой `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table`.

### Типовая схема потребления {#a-typical-consumption-pattern}

Синхронизируйте изменения `min_delta` с целевой таблицей Unique Key: записывайте вставки и значения после обновления напрямую, а удаления применяйте через признак удаления.

```sql
CREATE TABLE dwd_orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES ("enable_unique_key_merge_on_write" = "true");

INSERT INTO dwd_orders (order_id, status, amount, __DORIS_DELETE_SIGN__)
SELECT order_id, status, amount,
       CASE WHEN __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE' THEN 1 ELSE 0 END
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER', 'DELETE');
```

Выполняйте этот оператор по расписанию, например с помощью [планировщика заданий](../../admin-manual/workload-management/job-scheduler) Doris или внешнего планировщика, и вы получите простейший конвейер инкрементальной синхронизации. Запись в целевую таблицу Unique Key по своей природе идемпотентна. Поэтому, даже если выполнение завершится сбоем после фиксации, но до того, как планировщик сохранит его состояние, и будет запущено повторно, некорректные данные не появятся.

## Виртуальные столбцы {#virtual-columns}

<!-- Knowledge type: Parameter reference -->

Stream содержит текущие видимые столбцы базовой таблицы, которые автоматически синхронизируются после `ADD COLUMN` / `DROP COLUMN` в базовой таблице, а также три виртуальных столбца. Виртуальные столбцы не включаются в `SELECT *`, их нужно перечислять явно:

| Виртуальный столбец | Тип | Описание |
|---|---|---|
| `__DORIS_STREAM_CHANGE_TYPE_COL__` | STRING | Тип изменения: `APPEND` / `UPDATE_BEFORE` / `UPDATE_AFTER` / `DELETE` |
| `__DORIS_STREAM_SEQUENCE_COL__` | BIGINT | Временная метка фиксации (TSO) изменения. Изменения одной транзакции имеют одинаковое значение |
| `__DORIS_STREAM_LSN_COL__` | BIGINT | Порядковый номер изменения внутри транзакции. `ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__` задаёт порядок, в котором произошли изменения |

`<stream>@snapshot()` и `<stream>@reset()` читают снимки таблицы, а не изменения, и не предоставляют виртуальных столбцов; см. [Расширенные возможности Table Stream](table-stream-advanced).

## Ограничения {#limitations}

<!-- Knowledge type: Usage limitations -->

- Базовая таблица должна быть внутренней таблицей с включённым changelog; поддерживаемые модели таблиц и ограничения на типы столбцов перечислены в [Changelog](changelog#supported-scope-and-limitations).
- Stream читает только базовый индекс базовой таблицы; указать rollup-индексы или материализованные представления нельзя, предложение `TABLET (...)` не поддерживается.
- Stream не может быть целью операций `INSERT`, `UPDATE` или `DELETE`.
- Тип потребления и `show_initial_rows` нельзя изменить после создания.
- Срок хранения changelog определяется параметром `changelog.ttl_seconds` (по умолчанию одни сутки) независимо от прогресса потребления. Если смещение указывает на изменения с истёкшим сроком хранения, чтение `min_delta` завершается ошибкой; `detail` и `append_only` пропускают такие изменения. В текущей реализации `IS_STALE` / `STALE_REASON` не сообщают об истечении TTL. Потребляйте изменения до истечения срока хранения; см. [Хранение и очистка](changelog#retention-and-cleanup).
- Влияние удаления базовой таблицы, удаления или замены партиций и подобных операций на Stream описано в [Расширенных возможностях Table Stream](table-stream-advanced#effect-of-base-table-changes).

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

| Вопрос | Ответ |
|---|---|
| Почему только что созданный Stream пуст? | При `show_initial_rows = false` (значение по умолчанию) данные, уже существующие на момент создания, не выдаются в виде изменений; если они нужны, создайте Stream с `show_initial_rows = true`. См. [Начальные строки](#initial-rows) |
| Почему `SELECT *` не показывает тип изменения? | Виртуальные столбцы не включаются в `SELECT *`; явно перечислите `__DORIS_STREAM_CHANGE_TYPE_COL__` и остальные виртуальные столбцы |
| Можно ли повторно прочитать строки, отфильтрованные с помощью WHERE при потреблении? | Нет. Смещение продвигается по диапазону чтения независимо от фильтрации; записывайте все нужные типы изменений в одном операторе |
| Что происходит, если два задания одновременно потребляют один Stream? | Транзакция, которая фиксируется позже, завершается ошибкой `target offset already consumed` и откатывается; обеспечьте, чтобы каждую партицию в каждый момент времени потреблял только один потребитель. См. [Несколько объектов Stream и параллельное потребление](table-stream-advanced#multiple-streams-and-concurrent-consumption) |
| Можно ли создать Stream типа `min_delta` на таблице Duplicate Key? | Да, но он автоматически обрабатывается как `append_only`, а строки, удалённые операторами `DELETE`, не выдаются |
| Можно ли изменить тип потребления Stream? | Нет. В настоящее время `ALTER STREAM` изменяет только комментарий; удалите Stream и создайте его заново |
| Где описаны остальные ошибки? | См. [Распространённые ошибки](table-stream-advanced#common-errors) |
