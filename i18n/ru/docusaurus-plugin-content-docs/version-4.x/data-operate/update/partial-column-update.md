---
{
    "title": "Обновление столбцов",
    "language": "ru",
    "description": "Руководство по частичному обновлению столбцов в Apache Doris: эффективное обновление заданных столбцов в моделях Unique Key и Aggregate Key с использованием Stream Load, INSERT INTO и Flink Connector, а также сценарии гибкого обновления столбцов."
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Real-time field updates / Multi-source wide-table joining / Data correction -->

При обновлении данных бизнес-требования часто предполагают изменение лишь части полей строки, например:

- **Частые обновления полей в реальном времени**: в таблице тегов пользователей необходимо поддерживать актуальность полей с данными о поведении, чтобы рекламные и рекомендательные системы могли выполнять анализ и принимать решения в реальном времени.
- **Объединение данных из нескольких источников в широкую таблицу**: данные из нескольких исходных таблиц объединяются по первичному ключу в одну широкую таблицу, причём каждая исходная таблица предоставляет лишь часть столбцов.
- **Исправление данных**: пакетная операция исправляет значения определённых полей в некоторых записях, оставляя остальные поля без изменений.

Обычный оператор `UPDATE`, как правило, должен сначала прочитать всю строку, а затем записать её целиком. Такая транзакция «read-modify-write» работает медленно при больших объёмах записи и не обеспечивает требуемую высокую пропускную способность.

**Возможность частичного обновления столбцов в Doris** позволяет при загрузке записывать только те столбцы, которые необходимо изменить, без предварительного чтения всей строки. Это значительно повышает эффективность обновлений. В этом документе описано, как выполнять частичное обновление столбцов в **модели Unique Key** и **модели Aggregate Key**.

## Обзор возможностей {#capability-overview}

<!-- Knowledge type: Capability definition -->

| Модель данных | Реализация | Производительность записи | Производительность запросов | Сценарии использования |
| --- | --- | --- | --- | --- |
| Unique Key (Merge-on-Write) | Дополнение строки до полной при записи | Средняя (зависит от IO) | Высокая | Обновления в реальном времени, сценарии с высокими требованиями к производительности запросов |
| Aggregate Key (`REPLACE_IF_NOT_NULL`) | Агрегация при выполнении запроса | Высокая (сопоставима с обычной загрузкой) | Ниже (запросы с агрегацией выполняются в 5–10 раз медленнее, чем при MoW) | Сценарии с высокими требованиями к пропускной способности записи, в которых допустима более низкая производительность запросов |

## Обновление столбцов в модели Unique Key {#column-update-on-the-unique-key-model}

<!-- Knowledge type: Operating procedure -->

При загрузке в модель Unique Key Doris может напрямую вставлять или обновлять данные отдельных столбцов без предварительного чтения всей строки, что значительно повышает эффективность обновлений.

:::caution Примечание

1. В версии 2.0 частичное обновление столбцов поддерживается только в реализации Unique Key с Merge-on-Write.
2. Начиная с версии 2.0.2, для частичного обновления столбцов можно использовать `INSERT INTO`.
3. Частичное обновление столбцов не поддерживается для таблиц с синхронными материализованными представлениями.
4. Частичное обновление столбцов не поддерживается для таблиц, в которых выполняется Schema Change.

:::

### Пример {#example}

Предположим, в Doris есть таблица заказов `order_tbl`, в которой идентификатор заказа является столбцом Key, а статус заказа и сумма заказа являются столбцами Value. Создайте её с моделью Unique-Key и реализацией Merge-on-Write и загрузите начальную строку:

```sql
CREATE TABLE order_tbl (
  order_id     INT,
  order_status VARCHAR(64),
  order_amount INT
)
UNIQUE KEY (order_id)
DISTRIBUTED BY HASH (order_id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1",
  "enable_unique_key_merge_on_write" = "true"
);

INSERT INTO order_tbl VALUES (1, 'Pending payment', 100);
```

Текущие данные:

| Идентификатор заказа | Сумма заказа | Статус заказа |
| --- | --- | --- |
| 1 | 100 | Ожидает оплаты |

```sql
+----------+--------------+------------------+
| order_id | order_amount | order_status     |
+----------+--------------+------------------+
| 1        |          100 | Pending payment  |
+----------+--------------+------------------+
1 row in set (0.01 sec)
```

Когда пользователь нажимает кнопку оплаты, статус заказа с идентификатором `1` необходимо изменить на `Pending shipment`, не затрагивая поле суммы заказа.

### Частичное обновление столбцов при загрузке {#partial-column-updates-through-loading}

#### Stream Load / Broker Load / Routine Load {#stream-load--broker-load--routine-load}

Подготовьте следующий CSV-файл:

```text
1,Pending shipment
```

При загрузке добавьте следующий заголовок:

```text
partial_columns:true
```

В параметре `columns` укажите столбцы для загрузки (**необходимо включить все столбцы Key**, иначе обновление выполнить не удастся). Ниже приведён пример Stream Load:

```shell
curl --location-trusted -u root: \
    -H "partial_columns:true" \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T /tmp/update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO {#insert-into}

Во всех моделях данных `INSERT INTO` с указанием части столбцов по умолчанию записывает строку целиком. Чтобы избежать ошибочного использования, в реализации Merge-on-Write для `INSERT INTO` также по умолчанию сохраняется семантика UPSERT всей строки. Чтобы включить семантику частичного обновления столбцов, сначала задайте следующую переменную сеанса:

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

#### Flink Connector {#flink-connector}

При использовании Flink Connector добавьте следующую настройку:

```text
'sink.properties.partial_columns' = 'true'
```

Укажите столбцы для загрузки в `sink.properties.column` (**необходимо включить все столбцы Key**, иначе обновление выполнить не удастся).

### Результат обновления {#update-result}

Результат после обновления:

```sql
+----------+--------------+-------------------+
| order_id | order_amount | order_status      |
+----------+--------------+-------------------+
| 1        |          100 | Pending shipment  |
+----------+--------------+-------------------+
1 row in set (0.01 sec)
```

### Примечания {#notes}

<!-- Knowledge type: Performance tuning -->

Реализация Merge-on-Write должна дополнять строку до полной при записи, чтобы обеспечить оптимальную производительность запросов. Поэтому частичное обновление столбцов с Merge-on-Write в некоторой степени снижает производительность загрузки.

**Рекомендации по оптимизации производительности записи:**

- **Используйте высокопроизводительные SSD**: рекомендуются NVMe SSD или высокоскоростные облачные SSD. При дополнении строки считывается большой объём исторических данных, что требует высоких IOPS и пропускной способности чтения.
- **Включите строковое хранение**: это позволяет значительно сократить количество операций ввода-вывода при дополнении строк и заметно повысить производительность загрузки. Чтобы включить его при создании таблицы, задайте следующее свойство:

    ```text
    "store_row_column" = "true"
    ```

**Ограничение для пакетов:** все строки в одной задаче пакетной записи (будь то задача загрузки или `INSERT INTO`) могут обновлять только один и тот же набор столбцов. Для обновления разных столбцов разделите данные на несколько пакетов. Это ограничение можно снять с помощью описанной ниже возможности гибкого обновления столбцов.

### Гибкое обновление столбцов {#flexible-column-update}

<!-- Knowledge type: Feature description -->
<!-- Use cases: Real-time CDC sync / Scenarios where the updated columns differ row by row -->

Ранее возможность частичного обновления столбцов в Doris требовала, чтобы все строки в рамках одной загрузки обновляли один и тот же набор столбцов. **Начиная с версии 3.1.0**, Doris поддерживает более гибкий способ обновления: **каждая строка в рамках одной загрузки может обновлять свой набор столбцов**.

:::caution Примечание

1. Гибкое обновление столбцов поддерживает Stream Load, Routine Load и любые инструменты, использующие Stream Load в качестве базового способа загрузки (например, Doris Flink Connector).
2. При использовании гибкого обновления столбцов файл загрузки должен быть в формате JSON.

:::

#### Сценарии использования {#use-cases}

При синхронизации данных из другой системы в Doris в реальном времени с помощью CDC исходная система может передавать записи, содержащие только первичный ключ и обновлённые столбцы, а не полные строки. В этом случае строки пакета, сформированного за определённый временной интервал, могут обновлять разные столбцы. Для загрузки таких данных в Doris можно использовать гибкое обновление столбцов.

#### Использование {#usage}

##### 1. Включение гибкого обновления столбцов {#1-enable-flexible-column-update}

**Новые таблицы:** при создании таблицы укажите следующие свойства, чтобы включить Merge-on-Write и добавить скрытый столбец `bitmap`, необходимый для гибкого обновления столбцов:

```text
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**Существующие таблицы:** для существующей таблицы Merge-on-Write, созданной в более ранней версии Doris, после обновления Doris можно включить гибкое обновление столбцов следующим оператором:

```sql
ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";
```

После выполнения запустите `SHOW CREATE TABLE db1.tbl1`. Если результат содержит `"enable_unique_key_skip_bitmap_column" = "true"`, возможность успешно включена.

:::tip
Прежде чем использовать этот способ для существующей таблицы, убедитесь, что для целевой таблицы включён light-schema-change.
:::

##### 2. Включение в задачах загрузки {#2-enable-in-load-tasks}

Настройки для каждого способа загрузки приведены ниже:

| Способ загрузки | Параметр настройки | Значение |
| --- | --- | --- |
| Stream Load | заголовок | `unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS` |
| Flink Doris Connector | свойство sink | `'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'` |
| Routine Load | `PROPERTIES` | `"unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"` |

**Полный пример Routine Load:**

```sql
CREATE ROUTINE LOAD db1.job1 ON tbl1
PROPERTIES (
    "format" = "json",
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
)
FROM KAFKA (
    "kafka_broker_list" = "localhost:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

Для изменения режима обновления существующей задачи Routine Load также можно использовать `ALTER ROUTINE LOAD`:

```sql
-- 1. Pause the job
PAUSE ROUTINE LOAD FOR db1.job1;

-- 2. Change the update mode
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- 3. Resume the job
RESUME ROUTINE LOAD FOR db1.job1;
```

:::caution Ограничения Routine Load

При использовании режима `UPDATE_FLEXIBLE_COLUMNS` в Routine Load действуют следующие ограничения:

- Данные должны быть в формате JSON (`"format" = "json"`).
- Нельзя указывать свойство `jsonpaths`.
- Нельзя включать параметр `fuzzy_parse`.
- Нельзя использовать предложение `COLUMNS`.
- Нельзя использовать предложение `WHERE`.

:::

#### Полный пример {#full-example}

**Шаг 1: Создайте тестовую таблицу**

```sql
CREATE TABLE t1 (
    `k`  INT NULL,
    `v1` BIGINT NULL,
    `v2` BIGINT NULL DEFAULT "9876",
    `v3` BIGINT NOT NULL,
    `v4` BIGINT NOT NULL DEFAULT "1234",
    `v5` BIGINT NULL
) UNIQUE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "3",
    "enable_unique_key_merge_on_write" = "true",
    "enable_unique_key_skip_bitmap_column" = "true"
);
```

**Шаг 2: Существующие данные в таблице**

```sql
MySQL root@127.1:d1> select * from t1;
+---+----+----+----+----+----+
| k | v1 | v2 | v3 | v4 | v5 |
+---+----+----+----+----+----+
| 0 | 0  | 0  | 0  | 0  | 0  |
| 1 | 1  | 1  | 1  | 1  | 1  |
| 2 | 2  | 2  | 2  | 2  | 2  |
| 3 | 3  | 3  | 3  | 3  | 3  |
| 4 | 4  | 4  | 4  | 4  | 4  |
| 5 | 5  | 5  | 5  | 5  | 5  |
+---+----+----+----+----+----+
```

**Шаг 3: Подготовьте данные для гибкого обновления столбцов**

Каждая строка может обновлять свой набор столбцов:

```json
{"k": 0, "__DORIS_DELETE_SIGN__": 1}
{"k": 1, "v1": 10}
{"k": 2, "v2": 20, "v5": 25}
{"k": 3, "v3": 30}
{"k": 4, "v4": 20, "v1": 43, "v3": 99}
{"k": 5, "v5": null}
{"k": 6, "v1": 999, "v3": 777}
{"k": 2, "v4": 222}
{"k": 1, "v2": 111, "v3": 111}
```

**Шаг 4: Загрузите данные через Stream Load**

```shell
curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode:false" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
    -T test1.json \
    -XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

**Шаг 5: Проверьте результат обновления**

```sql
MySQL root@127.1:d1> select * from t1;
+---+-----+------+-----+------+--------+
| k | v1  | v2   | v3  | v4   | v5     |
+---+-----+------+-----+------+--------+
| 1 | 10  | 111  | 111 | 1    | 1      |
| 2 | 2   | 20   | 2   | 222  | 25     |
| 3 | 3   | 3    | 30  | 3    | 3      |
| 4 | 43  | 4    | 99  | 20   | 4      |
| 5 | 5   | 5    | 5   | 5    | <null> |
| 6 | 999 | 9876 | 777 | 1234 | <null> |
+---+-----+------+-----+------+--------+
```

#### Ограничения и примечания {#restrictions-and-notes}

1. Как и при обычном частичном обновлении столбцов, при гибком обновлении каждая строка должна содержать **все столбцы Key**. Строки, не отвечающие этому требованию, отфильтровываются и учитываются в `filter rows`. Если `filtered rows` превышает верхний предел, разрешённый параметром загрузки `max_filter_ratio`, вся загрузка завершается ошибкой. Каждая отфильтрованная строка записывается в журнал ошибок.
2. Из пар «ключ-значение» в объекте JSON применяются только те, у которых ключ совпадает с именем столбца в целевой таблице. Остальные игнорируются. Кроме того, игнорируются и пары, у которых ключ равен `__DORIS_VERSION_COL__`, `__DORIS_ROW_STORE_COL__` или `__DORIS_SKIP_BITMAP_COL__`.
3. Гибкое обновление столбцов не поддерживается для таблиц со столбцами Variant.
4. Гибкое обновление столбцов не поддерживается для таблиц с синхронными материализованными представлениями.
5. При использовании гибкого обновления столбцов **нельзя** указывать или включать следующие параметры загрузки:
    - `merge_type`
    - `delete`
    - `fuzzy_parse`
    - `columns`
    - `jsonpaths`
    - `hidden_columns`
    - `function_column.sequence_col`
    - `sql`
    - `memtable_on_sink_node` move-forward
    - `group_commit`
    - `where`

### Управление поведением при вставке новых строк {#behavior-control-for-newly-inserted-rows}

<!-- Knowledge type: Configuration parameter -->

Переменная сеанса или свойство загрузки `partial_update_new_key_behavior` управляет поведением при **вставке новых строк** во время частичного и гибкого обновления столбцов.

| Значение | Поведение |
| --- | --- |
| `ERROR` | Ключ каждой строки должен уже существовать в таблице, иначе загрузка завершается ошибкой. |
| `APPEND` | Разрешены как обновление существующих строк, так и вставка новых строк с ключами, которых ещё нет в таблице. |

#### Пример схемы таблицы {#example-table-schema}

```sql
CREATE TABLE user_profile (
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

Существующие данные в таблице:

```sql
mysql> select * from user_profile;
+----+-------+-----+----------+---------+---------------------+
| id | name  | age | city     | balance | last_access_time    |
+----+-------+-----+----------+---------+---------------------+
|  1 | kevin |  18 | shenzhen |     400 | 2023-07-01 12:00:00 |
+----+-------+-----+----------+---------+---------------------+
```

#### Сценарий 1: Режим `ERROR` (отклонение новых строк) {#scenario-1-error-mode-reject-new-rows}

Поскольку ключи второй и третьей строк (`3` и `18`) отсутствуют в исходной таблице, эта вставка завершается ошибкой:

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');

-- Error:
-- (1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error:
-- [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR.
-- Row with key=[3] is not in table., host: 127.0.0.1")
```

#### Сценарий 2: Режим `APPEND` (разрешение новых строк) {#scenario-2-append-mode-allow-new-rows}

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');
```

После выполнения исходная строка обновляется и добавляются две новые строки. Для столбцов, которые пользователь не указал, действуют следующие правила:

1. Если у столбца **есть значение по умолчанию**, используется это значение.
2. В противном случае, если столбец **допускает NULL**, используется NULL.
3. В остальных случаях вставка завершается ошибкой.

Результат запроса:

```sql
mysql> select * from user_profile;
+----+-------+------+----------+---------+---------------------+
| id | name  | age  | city     | balance | last_access_time    |
+----+-------+------+----------+---------+---------------------+
|  1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|  3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
| 18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+----+-------+------+----------+---------+---------------------+
```

## Обновление столбцов в модели Aggregate Key {#column-update-on-the-aggregate-key-model}

<!-- Knowledge type: Operating procedure -->
<!-- Use cases: Sensitive to write throughput, lower query performance is acceptable -->

Таблица Aggregate в основном используется для предварительной агрегации, но также позволяет добиться частичного обновления столбцов, если задать функцию агрегации `REPLACE_IF_NOT_NULL`.

### Создание таблицы {#create-the-table}

Для каждого поля, которому требуется обновление столбца, задайте функцию агрегации `REPLACE_IF_NOT_NULL`:

```sql
CREATE TABLE order_tbl (
    order_id     INT(11) NULL,
    order_amount INT(11) REPLACE_IF_NOT_NULL NULL,
    order_status VARCHAR(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Запись данных {#write-data}

Независимо от того, используете ли вы Stream Load, Broker Load, Routine Load или `INSERT INTO`, достаточно записать данные полей, которые нужно обновить. **Дополнительные параметры не требуются.**

### Пример {#example-1}

Используем тот же пример, что и выше. Соответствующая команда Stream Load выглядит так (дополнительный заголовок не требуется):

```shell
$ cat update.csv
1,Pending shipment

curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T ./update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

Соответствующий оператор `INSERT INTO` выглядит так (дополнительная переменная сеанса не требуется):

```sql
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

### Примечания {#notes-1}

- **Производительность записи**: модель Aggregate Key не выполняет дополнительной обработки при записи, поэтому производительность записи такая же, как при обычной загрузке данных.
- **Производительность запросов**: агрегация при выполнении запроса требует значительных ресурсов. По сравнению с реализацией Merge-on-Write модели Unique Key типичные запросы с агрегацией выполняются **в 5–10 раз** медленнее.
- **Ограничение для значений NULL**: поскольку функция агрегации `REPLACE_IF_NOT_NULL` применяется только к значениям, отличным от NULL, **значение поля нельзя изменить на NULL**.
