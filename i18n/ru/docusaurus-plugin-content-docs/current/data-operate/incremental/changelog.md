---
{
    "title": "Журнал изменений (Changelog)",
    "language": "ru",
    "description": "Changelog в Doris фиксирует вставки, обновления и удаления на уровне строк: свойства таблиц, срок хранения TTL, автоматическая очистка, поддерживаемые модели таблиц и диагностика.",
    "keywords": [
        "Changelog",
        "Doris changelog",
        "row-level change log",
        "changelog.enable",
        "changelog.need_historical_value",
        "changelog.ttl_seconds",
        "changelog TTL",
        "before image",
        "historical value",
        "commit TSO",
        "__DORIS_CHANGELOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "changelog() table function",
        "Merge-on-Write change records",
        "Duplicate Key change records",
        "light schema change",
        "enable_mow_light_delete",
        "enable_feature_changelog",
        "change data capture",
        "Doris CDC",
        "Incremental View Maintenance",
        "IVM",
        "Not allowed to perform current operation on Table With changelog",
        "Only duplicate and mow table model support changelog"
    ]
}
---

<!-- Knowledge type: Feature description + Parameter reference -->
<!-- Use cases: Enabling row-level change recording on a table / Checking whether a table model is supported / Inspecting change records -->

Changelog представляет собой журнал изменений на уровне строк для внутренних таблиц Doris. После его включения каждое изменение строки при записи (вставка, обновление, удаление) сохраняется вместе со значениями до и после изменения и временной меткой фиксации транзакции. Он служит источником данных для [Table Stream](table-stream), [инкрементальных запросов](incremental-query) и [инкрементального обслуживания материализованных представлений (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view). Читать его также можно из Flink через [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read) (Connector версии 26.4.0 или новее).

По умолчанию записи об изменениях хранятся один день. Задайте `changelog.ttl_seconds` так, чтобы срок хранения покрывал максимальную ожидаемую задержку чтения изменений; истечение срока хранения записей об изменениях не удаляет данные из базовой таблицы.

Changelog не зависит от binlog, используемого для межкластерной репликации (CCR): у него собственные свойства `changelog.*` и собственный переключатель включения. В одной таблице нельзя включить оба механизма. См. [Binlog для CCR](#ccr-binlog).

:::caution Экспериментальная функция
Эта функция доступна начиная с версии 5.0.0 и является экспериментальной. Для её работы необходимо задать `enable_feature_changelog = true` в конфигурации FE.
:::

:::info Переименование row binlog
В ранних сборках для разработки эта функция называлась «row binlog» и включалась с помощью `"binlog.enable" = "true"` и `"binlog.format" = "ROW"`; перед первым выпуском её переименовали в changelog. Таблицы, созданные таким способом в этих сборках, больше нельзя использовать: удалите их и создайте заново с `"changelog.enable" = "true"`.
:::

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 или новее.
- `enable_feature_changelog = true` в `fe.conf` на FE (параметр не является динамическим; требуется перезапуск FE). Он управляет таблицами с changelog, выделением временных меток фиксации транзакций (TSO) и чтением через Table Stream. `enable_feature_binlog` управляет только binlog для CCR и не требуется для changelog.
- Для автоматической очистки также задайте `enable_feature_changelog = true` в `be.conf` на узлах BE (параметр не является динамическим; требуется перезапуск BE).
- Таблица Duplicate Key или таблица Unique Key Merge-on-Write (MoW) без ключей кластеризации; см. [Область поддержки и ограничения](#supported-scope-and-limitations).
- Changelog можно включить только при создании таблицы, поэтому оцените необходимость его использования заранее.

## Основные понятия {#basic-concepts}

<!-- Knowledge type: Concept description -->

| Понятие | Описание |
|---|---|
| Запись об изменении | При каждой фиксации транзакции в базовой таблице для каждой изменённой строки создаётся одна запись, содержащая тип операции (вставка / обновление / удаление), значения после изменения и, при соответствующей настройке, значения до изменения (before image) |
| Временная метка фиксации транзакции (TSO) | Глобально монотонная временная метка, получаемая от FE при фиксации транзакции записи. Состоит из физической части (миллисекунды) и логического счётчика. Все изменения одной транзакции имеют одинаковую TSO. Смещения Table Stream и временные окна `@incr` измеряются в TSO |
| LSN | Порядковый номер записи об изменении внутри транзакции. Вместе с TSO определяет порядок записей об изменениях |

## Включение changelog {#enabling-changelog}

<!-- Knowledge type: Operational steps + Configuration parameters -->

Changelog можно включить только через свойства таблицы в `CREATE TABLE`; после этого отключить его нельзя:

```sql
CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);
```

Свойства `binlog.*` (`binlog.enable`, `binlog.ttl_seconds` и другие) настраивают binlog для CCR, а не changelog; см. [Binlog для CCR](#ccr-binlog).

### Свойства {#properties}

| Свойство | Значения | По умолчанию | Можно изменить после создания | Описание |
|---|---|---|---|---|
| `changelog.enable` | `true` / `false` | `false` | Нет | Включён ли changelog. Можно задать только в `CREATE TABLE` или унаследовать из настроек базы данных по умолчанию, см. [Настройки базы данных по умолчанию](#database-default) |
| `changelog.need_historical_value` | `true` / `false` | `false` | Нет | Записываются ли значения до изменения (before image). Требует включённого changelog. Значение `true` можно задать только для таблиц Unique Key MoW. Это свойство необходимо для Table Stream типов `min_delta` / `detail`, инкрементальных запросов `MIN_DELTA` и IVM, которым требуется обрабатывать обновления или удаления |
| `changelog.ttl_seconds` | Положительное целое число (секунды) | `86400` (один день) | Да | Срок хранения записей об изменениях. Требует включённого changelog. Записи с истёкшим сроком хранения исключаются из инкрементального чтения и удаляются в ходе фоновых операций compaction; `0` и отрицательные значения не допускаются. См. [Хранение и очистка](#retention-and-cleanup) |

### Изменение неизменяемых свойств {#changing-immutable-properties}

`changelog.enable` и `changelog.need_historical_value` нельзя изменить у существующей таблицы, поэтому для неё нельзя ни включить, ни отключить changelog. Попытка такого изменения сразу завершается ошибкой:

```sql
ALTER TABLE orders SET ("changelog.enable" = "false");
-- ERROR: not support change changelog.enable from true to false

ALTER TABLE orders SET ("changelog.need_historical_value" = "false");
-- ERROR: not support change changelog.need_historical_value from true to false

ALTER TABLE t_without_changelog SET ("changelog.enable" = "true");
-- ERROR: not support change changelog.enable from false to true
```

Если у существующей таблицы нет changelog, создайте новую таблицу с включённым changelog, загрузите данные и атомарно поменяйте таблицы местами с помощью [`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE).

### Просмотр свойств {#viewing-the-properties}

`SHOW CREATE TABLE` выводит свойства `changelog.*` таблицы с включённым changelog:

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"changelog.enable" = "true",
"changelog.ttl_seconds" = "86400",
"changelog.need_historical_value" = "true",
...
```

### Настройки базы данных по умолчанию {#database-default}

В базе данных можно включить changelog по умолчанию для создаваемых в ней таблиц:

```sql
CREATE DATABASE changelog_db PROPERTIES ("changelog.enable" = "true");
```

У таблиц, созданных после этого в `changelog_db`, changelog включён, если для них не задано `"changelog.enable" = "false"`. Значения `changelog.ttl_seconds` и `changelog.need_historical_value` наследуются из базы данных, если таблица не задаёт собственные. Для таблицы, модель которой не поддерживает changelog, например Aggregate Key, в такой базе данных необходимо задать `"changelog.enable" = "false"`. `ALTER DATABASE ... SET PROPERTIES` изменяет настройки по умолчанию только для таблиц, создаваемых после этого.

В базе данных, где changelog включён по умолчанию, `SHOW CREATE TABLE` для таблицы без changelog выводит `"changelog.enable" = "false"`. Благодаря этому `CREATE TABLE ... LIKE` и команда, скопированная из этого вывода, также создают таблицу без changelog.

## Область поддержки и ограничения {#supported-scope-and-limitations}

<!-- Knowledge type: Support matrix -->
<!-- Use cases: Checking table model / column type support before creating the table -->

### Модели таблиц {#table-models}

| Модель таблицы | Поддерживается | Примечания |
|---|---|---|
| Duplicate Key | Да | Записываются только вставленные строки; `changelog.need_historical_value = true` отклоняется с ошибкой `Duplicate table model don't support record historical value` |
| Unique Key, Merge-on-Write | Да | Записываются вставки, обновления и удаления; можно включить запись before image. **Таблицы с ключами кластеризации не поддерживаются**; попытка их создания завершается ошибкой `Unique merge-on-write tables with cluster keys do not support changelog` |
| Unique Key, Merge-on-Read | Нет | Завершается ошибкой `Only duplicate and mow table model support changelog` |
| Aggregate Key | Нет | То же, что и выше |

### Типы столбцов {#column-types}

| Ограничение | Примечания |
|---|---|
| Столбцы с автоинкрементом | Не поддерживаются; отклоняются как в `CREATE TABLE`, так и в `ADD COLUMN` |
| Столбцы VARIANT | Не поддерживаются; отклоняются как в `CREATE TABLE`, так и в `ADD COLUMN` |

### Режимы развёртывания {#deployment-modes}

Changelog можно включить как в режиме с совмещёнными хранением и вычислениями, так и в режиме с разделёнными хранением и вычислениями.

### Способы записи {#write-methods}

Фиксируются изменения, создаваемые любым способом записи (`INSERT`, `UPDATE`, `DELETE`, Stream Load, Broker Load, Routine Load, коннекторы Flink / Spark и другие), включая частичные обновления столбцов и гибкие частичные обновления столбцов.

### Временные таблицы {#temporary-tables}

У временных таблиц changelog отсутствует всегда. Параметр `"changelog.enable" = "true"` для временной таблицы вызывает ошибку `Cannot create temporary table with changelog enable`; временные таблицы также игнорируют настройку changelog по умолчанию своей базы данных.

### Binlog для CCR {#ccr-binlog}

Changelog и binlog, используемый для межкластерной репликации (CCR), нельзя совмещать:

- Для таблицы нельзя одновременно задать `"binlog.enable" = "true"` и `"changelog.enable" = "true"`. Свойства `binlog.*` таблицы с changelog изменять нельзя.
- Таблицу с changelog нельзя создать или восстановить в базе данных, где включён binlog для CCR; в базе данных, содержащей таблицу с changelog, нельзя включить binlog для CCR.
- В базе данных нельзя включить оба механизма одновременно.

Таблицы с changelog также не поддерживают резервное копирование и восстановление.

## Модель записей об изменениях {#change-record-model}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Understanding which change records each write operation produces -->

### Типы операций и скрытые столбцы {#operation-types-and-hidden-columns}

Каждая запись об изменении содержит все видимые столбцы базовой таблицы (значения после изменения) и следующие скрытые столбцы:

| Скрытый столбец | Тип | Описание |
|---|---|---|
| `__DORIS_CHANGELOG_OP__` | BIGINT | Тип операции. В исходных записях, возвращаемых табличной функцией `changelog()`: `0` означает вставку, `1` обновление, `2` удаление. В инкрементальных запросах `@incr` обновление разбивается на две строки: `0` означает вставку, `1` удаление, `2` состояние до обновления, `3` состояние после обновления |
| `__DORIS_CHANGELOG_TSO__` | BIGINT | Временная метка фиксации транзакции |
| `__DORIS_CHANGELOG_LSN__` | BIGINT | Порядковый номер внутри транзакции |
| `__DORIS_CHANGELOG_BEFORE_<column>__` | Как у исходного столбца | Значение до изменения; по одному такому столбцу на каждый неключевой столбец. Присутствует только при `changelog.need_historical_value = true` |

В самой базовой таблице появляется дополнительный скрытый столбец `__DORIS_COMMIT_TSO_COL__`, содержащий временную метку фиксации последней записи для каждой строки. Его можно запрашивать напрямую после выполнения `SET show_hidden_columns = true`:

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Таблицы Duplicate Key {#duplicate-key-tables}

В таблицах Duplicate Key фиксируются только вставки. Каждая строка при каждой записи фиксируется как запись о вставке; строки с одинаковым ключом никогда не объединяются.

`DELETE FROM ... WHERE ...` в таблице Duplicate Key помечает строки предикатом удаления и **не создаёт записей об изменениях**; потребители данных, использующие Table Stream или `@incr`, не видят таких удалений. Если удаления должны передаваться потребителям, используйте таблицу Unique Key MoW.

### Таблицы Unique Key MoW {#unique-key-mow-tables}

| Операция записи | Что фиксируется |
|---|---|
| Запись с несуществующим ключом | Одна запись о вставке |
| Запись с уже существующим ключом (`INSERT` с тем же ключом, `UPDATE`, частичное обновление столбцов) | Одна запись об обновлении, содержащая полную строку после обновления; если включена запись before image, также сохраняются значения до обновления |
| Удаление существующего ключа (`DELETE`, загрузка с признаком удаления) | Одна запись об удалении. Если включена запись before image, она содержит значения до удаления; в противном случае значения присутствуют только в ключевых столбцах |
| Повторная запись с тем же ключом после его удаления | Одна запись о вставке (предыдущая версия представляет собой маркер удаления, а не действующую строку) |
| Запись значения столбца последовательности, меньшего, чем у видимой строки | Запись отбрасывается, запись об изменении не создаётся |

По умолчанию `DELETE` в таблице MoW реализуется путём записи маркеров удаления, поэтому создаёт записи об удалении. Если свойство таблицы `enable_mow_light_delete` имеет значение `true`, `DELETE` вместо этого использует предикат удаления и, как и в таблицах Duplicate Key, не создаёт записей об изменениях. Для таблиц с changelog оставляйте у этого свойства значение по умолчанию `false`.

При частичном обновлении столбцов в журнал записывается полная строка после объединения, а не только обновлённые столбцы. При гибком частичном обновлении столбцов (`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`) удаление и последующая запись с тем же ключом в одном пакете фиксируются как одна запись об обновлении: before image содержит старую строку до удаления, а after image содержит новую строку, в которой неуказанные столбцы получают значения по умолчанию или NULL вместо старых значений.

Следующий пример показывает исходные записи об изменениях таблицы MoW с включённой записью before image:

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_CHANGELOG_OP__ AS op, order_id, status, amount,
       __DORIS_CHANGELOG_BEFORE_status__ AS before_status,
       __DORIS_CHANGELOG_BEFORE_amount__ AS before_amount
FROM changelog("table" = "orders")
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

```text
+------+----------+---------+--------+---------------+---------------+
| op   | order_id | status  | amount | before_status | before_amount |
+------+----------+---------+--------+---------------+---------------+
|    0 |        1 | created | 100.00 | NULL          |          NULL |
|    1 |        1 | paid    | 100.00 | created       |        100.00 |
|    2 |        1 | paid    | 100.00 | paid          |        100.00 |
|    0 |        1 | created | 150.00 | NULL          |          NULL |
+------+----------+---------+--------+---------------+---------------+
```

## Ограничения DDL {#ddl-restrictions}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Checking which ALTER TABLE operations remain available with changelog enabled -->

Для таблицы с включённым changelog разрешены только следующие операции `ALTER TABLE`:

| Разрешённая операция | Примечания |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | Только в режиме облегчённого изменения схемы (light schema change): у таблицы должно быть включено свойство `light_schema_change`, что является настройкой по умолчанию; новые столбцы автоматически добавляются в записи об изменениях |
| `CREATE INDEX` / `DROP INDEX` | Только облегчённые изменения индексов |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| Операции с разделами: `ADD PARTITION`, `DROP PARTITION`, `MODIFY PARTITION`, `RENAME PARTITION`, `REPLACE PARTITION` | |
| `RENAME` для таблицы, `REPLACE WITH TABLE` | |
| Изменение комментария к таблице или комментариев к столбцам | |
| Изменение распределения по бакетам | |
| Изменение свойств таблицы | За исключением `bloom_filter_columns` / `bloom_filter_fpp` |
| `ENABLE FEATURE` (например, `SEQUENCE_LOAD`) | Внутри системы преобразуется в `ADD COLUMN` |

Другие операции отклоняются с ошибкой `Not allowed to perform current operation on Table With changelog`. В частности, это касается следующих операций:

- `MODIFY COLUMN` (изменение типа, позиции столбца и т. п.)
- `RENAME COLUMN`
- `ORDER BY` (изменение порядка столбцов)
- `BUILD INDEX`
- Изменение свойств фильтра Блума

`TRUNCATE TABLE` работает с таблицами с changelog как обычно, но резервное копирование и восстановление таких таблиц не поддерживаются. Влияние изменений схемы и разделов базовой таблицы на существующие Table Stream описано в разделе [Расширенные возможности Table Stream](table-stream-advanced#effect-of-base-table-changes).

## Хранение и очистка {#retention-and-cleanup}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Setting retention / Handling expired offsets / Capacity planning -->

Начиная с Doris 5.0.0, `changelog.ttl_seconds` управляет сроком хранения changelog как в режиме с совмещёнными хранением и вычислениями, так и в режиме с разделёнными хранением и вычислениями. Срок хранения отсчитывается по физическому времени в TSO фиксации транзакции; опорным значением служит текущая TSO Master FE. Записи, время фиксации которых не позднее опорного времени за вычетом TTL, считаются просроченными. Окно хранения сдвигается, даже если в таблицу не поступают новые записи.

### Настройка срока хранения {#configuring-retention}

TTL по умолчанию равен `86400` секунд (один день). Если в базе данных задано `changelog.ttl_seconds`, новые таблицы с changelog наследуют это значение, если оно не переопределено в свойствах таблицы. Изменение настройки базы данных не влияет на существующие таблицы. `CREATE TABLE ... LIKE` копирует TTL исходной таблицы.

Чтобы хранить изменения в созданной выше таблице `orders` в течение семи дней, выполните:

```sql
ALTER TABLE orders SET ("changelog.ttl_seconds" = "604800");
```

После успешного выполнения команды вывод `SHOW CREATE TABLE orders` содержит:

```text
"changelog.ttl_seconds" = "604800"
```

TTL должен быть больше `0`; ни `0`, ни `-1` не отключают истечение срока хранения. Уменьшение TTL может сразу сделать существующие записи просроченными. Увеличение TTL может снова сделать доступными для чтения записи, которые ещё физически присутствуют, но не позволяет восстановить уже удалённые при очистке записи. Если `ALTER TABLE` завершается ошибкой при передаче настройки разделам, уменьшенный TTL уже мог вступить в силу; проверьте `SHOW CREATE TABLE` и повторите ту же команду, чтобы завершить обновление.

### Влияние на чтение {#effect-on-reads}

При инкрементальном чтении окно хранения применяется на этапе планирования команды, ещё до завершения физической очистки. В рамках одной команды используется одна опорная TSO; для каждой новой команды окно вычисляется заново.

| Способ чтения | Поведение, если запрошенное начало находится за пределами срока хранения |
|---|---|
| `@incr` без `startTimestamp` | Читает только изменения в пределах срока хранения, в том числе в режиме `MIN_DELTA` |
| `@incr` с `incrementType = MIN_DELTA` и явно заданным `startTimestamp` | Завершается ошибкой `Changelog offset has expired according to changelog.ttl_seconds`, чтобы не возвращать неполные итоговые изменения |
| `@incr` с `incrementType = DETAIL` или `APPEND_ONLY` | Сдвигает фактическое начало к первой TSO в пределах срока хранения и возвращает только сохранившуюся часть запрошенного окна |
| Table Stream с `type = min_delta` | Завершается той же ошибкой, если смещение чтения какого-либо раздела вышло за пределы срока хранения |
| Table Stream с `type = detail` или `append_only` | Пропускает просроченные изменения и читает начиная с первой TSO в пределах срока хранения |
| Чтение снимков MoW (`FOR TIME AS OF`, `FOR VERSION AS OF` или `@snapshot()` для Stream) | Если для восстановления снимка требуется changelog, чтение целевого снимка за пределами срока хранения завершается той же ошибкой, поскольку необходимые before image больше не входят в окно хранения |
| Табличная функция `changelog()` | Не применяет фильтр TTL; она может показывать просроченные исходные записи, пока их не удалит физическая очистка |

Истечение срока хранения не зависит от того, успели ли потребители прочитать изменения. Читайте изменения в пределах окна хранения, даже если `IS_STALE` / `STALE_REASON` всё ещё показывают, что Stream пригоден к использованию: в текущей реализации эти поля не сообщают об истечении TTL. Если срок хранения необходимых изменений уже истёк, заново постройте данные у потребителя на основе полного снимка. Для Table Stream используйте [процедуру сброса](table-stream-advanced#reset-reset), чтобы перезагрузить данные у потребителя и продвинуть смещения. Управляйте внутренними Stream механизма IVM через [задачи обновления материализованных представлений](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams).

### Пример: срок хранения изменений истёк, а базовые данные сохранились {#example-expired-changes-with-base-data-preserved}

Выполните этот пример в существующей базе данных с правами `CREATE` и `LOAD`, а для запросов также потребуется право `SELECT`:

```sql
CREATE TABLE changelog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.ttl_seconds" = "30"
);

INSERT INTO changelog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM changelog_ttl_demo@incr("incrementType" = "DETAIL");
```

Сразу после вставки запрос возвращает:

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

Подождите больше 30 секунд, затем повторите инкрементальный запрос:

```sql
SELECT COUNT(*) AS change_count
FROM changelog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

Строка в базовой таблице по-прежнему присутствует:

```sql
SELECT id, value FROM changelog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### Физическая очистка и планирование ёмкости хранилища {#physical-cleanup-and-capacity-planning}

Фоновые операции compaction освобождают место, занятое наборами Rowset changelog, в которых все записи просрочены, в том числе у таблиц без новых записей. Если Rowset также содержит записи, срок хранения которых ещё не истёк, он сохраняется до истечения срока хранения всех его записей. При очистке сохраняются данные базовой таблицы и непрерывность версий. Место в хранилище освобождается асинхронно, поэтому TTL не задаёт предельный срок удаления файлов или жёсткий лимит объёма хранения.

Для автоматической очистки необходимо задать `enable_feature_changelog = true` на узлах BE и включить автоматический compaction. Установка `disable_auto_compaction = true` в конфигурации BE или свойствах таблицы приостанавливает автоматическую очистку, но инкрементальное чтение по-прежнему отфильтровывает просроченные записи. После перезапуска BE очистка ожидает получения корректной опорной TSO из heartbeat Master FE.

Хранение changelog ограничивается только временем; ограничений по объёму или количеству записей нет. Резервируйте место в хранилище с учётом объёма записи, TTL и задержки очистки. В таблицах MoW с включённой записью before image каждое обновление сохраняет дополнительную копию старых значений. Задавайте TTL больше максимальной задержки чтения изменений, интервала обновления и ожидаемой продолжительности простоя, оставляя запас времени на восстановление.

## Накладные расходы при записи {#write-overhead}

<!-- Knowledge type: Performance notes -->
<!-- Use cases: Evaluating load throughput before going to production -->

При включённом changelog каждая запись дополнительно создаёт и сохраняет записи об изменениях; в таблицах MoW обновления и удаления также считывают старые значения для формирования before image. Пропускная способность загрузки заметно снижается; степень снижения зависит от схемы таблицы и доли обновлений. Рекомендации:

- Включайте changelog только для таблиц, которым действительно требуется инкрементальное чтение.
- Перед вводом в эксплуатацию оцените изменение пропускной способности на реалистичной нагрузке записи.
- Не включайте `changelog.need_historical_value`, если значения до изменения не нужны (например, при чтении в режиме `append_only` или если важны только последние значения).

## Диагностика с помощью табличной функции changelog() {#troubleshooting-with-the-changelog-table-function}

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Confirming whether a write produced the expected changes / Inspecting the change history of a key -->

Табличная функция `changelog()` возвращает исходные записи об изменениях таблицы. Например, с её помощью можно проверить, создала ли операция записи ожидаемые изменения, или просмотреть историю изменений по определённому ключу.

:::caution
`changelog()` предназначена главным образом для внутренней отладки и не рекомендуется для конвейеров обработки данных в рабочей среде. Формат вывода и параметры могут меняться от версии к версии; для инкрементального чтения в рабочих процессах используйте [Table Stream](table-stream) или [`@incr`](incremental-query).
:::

```sql
SELECT __DORIS_CHANGELOG_OP__, __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__,
       order_id, status, amount
FROM changelog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

| Параметр | Обязательный | Описание |
|---|---|---|
| `table` | Да | Имя таблицы |
| `db` | Нет | Имя базы данных; по умолчанию используется текущая база данных |
| `partition` | Нет | Имена разделов через запятую; по умолчанию используются все разделы |
| `tablet` | Нет | Идентификаторы tablet через запятую; по умолчанию используются все tablet |

`changelog()` читает сохранённые исходные записи без свёртки изменений и фильтрации по TTL, а столбец `__DORIS_CHANGELOG_OP__` использует исходную кодировку (`0` означает вставку, `1` обновление, `2` удаление). Просроченные записи могут оставаться видимыми здесь до завершения физической очистки. Для таблицы с `changelog.need_historical_value = true` запрос `SELECT *` к `changelog()` также возвращает столбцы before image, имена которых начинаются с зарезервированного префикса `__DORIS_`. Чтобы определить представление, таблицу CTAS или материализованное представление на основе `changelog()`, явно перечислите столбцы и задайте псевдонимы скрытым столбцам и столбцам before image. Полный синтаксис приведён в разделе [Табличная функция CHANGELOG](../../sql-manual/sql-functions/table-valued-functions/changelog).

## Распространённые ошибки {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| Сообщение об ошибке | Причина | Действие |
|---|---|---|
| `Property binlog.format is no longer supported, use "changelog.enable" = "true" to enable changelog, or remove it for CCR binlog` | В команде используется `binlog.format`, с помощью которого changelog включали в ранних сборках для разработки | Включите changelog с помощью `"changelog.enable" = "true"`; для binlog CCR удалите это свойство |
| `Property binlog.need_historical_value is no longer supported, use changelog.need_historical_value instead` | В команде используется имя свойства из ранних сборок для разработки | Используйте `changelog.need_historical_value` |
| `Table <db>.<table> was created with "binlog.format" = "ROW", which is no longer supported; drop the table and create it again with "changelog.enable" = "true"` | Таблица создана в ранней сборке для разработки | Удалите таблицу, затем создайте её заново с `"changelog.enable" = "true"` |
| `Cannot create table <table> with changelog when enable_feature_changelog=false` | Changelog не включён на FE | Задайте `enable_feature_changelog = true` в `fe.conf` и перезапустите FE |
| `changelog.ttl_seconds must be greater than 0` | TTL равен `0` или отрицателен | Задайте положительное целое число секунд; значение по умолчанию равно `86400` |
| `Changelog offset has expired according to changelog.ttl_seconds` | Начальная точка `MIN_DELTA` или снимок MoW находится за пределами окна хранения | Заново постройте данные у потребителя на основе полного снимка и согласуйте позицию чтения; см. [Влияние на чтение](#effect-on-reads) |
| `not support change changelog.enable from false to true` | Для включения changelog у существующей таблицы использована команда `ALTER TABLE` | Changelog можно включить только при создании таблицы. Создайте новую таблицу с включённым changelog, загрузите данные и поменяйте таблицы местами с помощью `ALTER TABLE ... REPLACE WITH TABLE` |
| `not support change changelog.enable from true to false` | У таблицы с включённым changelog задано `changelog.enable = false` | После включения changelog отключить его нельзя |
| `not support change changelog.need_historical_value from true to false` | Изменено `changelog.need_historical_value` | Это свойство нельзя изменить после создания таблицы |
| `Property <property> requires "changelog.enable" = "true"` | Свойство `changelog.ttl_seconds` или `changelog.need_historical_value` задано в `CREATE TABLE` для таблицы, у которой не включён changelog | Включите changelog для таблицы или удалите это свойство |
| `changelog.ttl_seconds can not be set because changelog is not enabled for table: <table>` | Через `ALTER TABLE` задано `changelog.ttl_seconds` для таблицы без changelog | Срок хранения changelog можно задать только для таблицы с changelog |
| `Duplicate table model don't support record historical value` | Для таблицы Duplicate Key задано `changelog.need_historical_value = true` | У таблиц Duplicate Key нет before image; удалите это свойство или используйте таблицу Unique Key MoW, если нужны значения до изменения |
| `Unique merge-on-write tables with cluster keys do not support changelog` | У таблицы MoW есть ключи кластеризации | Создайте таблицу без ключей кластеризации |
| `Only duplicate and mow table model support changelog` | Модель таблицы: Aggregate Key или Unique Key Merge-on-Read | Используйте таблицу Duplicate Key или Unique Key MoW. В базе данных, где changelog включён по умолчанию, задайте для такой таблицы `"changelog.enable" = "false"` |
| `Table <table> can not enable both binlog and changelog` | В `CREATE TABLE` для обоих свойств, `binlog.enable` и `changelog.enable`, задано значение `true` | Выберите один механизм; см. [Binlog для CCR](#ccr-binlog) |
| `Can not create table <table> with changelog in database <db> because the database enables binlog` | В базе данных включён binlog для CCR | Создайте таблицу в базе данных без binlog для CCR |
| `Cannot create temporary table with changelog enable` | Для временной таблицы задано `"changelog.enable" = "true"` | Временные таблицы не могут иметь changelog |
| `Not allowed to perform current operation on Table With changelog` | Выполнена запрещённая операция DDL, например `MODIFY COLUMN`, `RENAME COLUMN`, `ORDER BY`, `BUILD INDEX` или изменение свойств фильтра Блума | См. список разрешённых операций в разделе [Ограничения DDL](#ddl-restrictions) |
