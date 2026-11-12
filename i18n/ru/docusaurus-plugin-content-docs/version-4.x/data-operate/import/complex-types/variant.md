---
{
    "title": "VARIANT",
    "language": "ru",
    "description": "Как загрузить данные CSV и JSON в столбец VARIANT в Doris? Полная последовательность действий: создание таблицы, команды Stream Load и проверка определения типов.",
    "keywords": [
        "Загрузка данных в Doris VARIANT",
        "Загрузка CSV в VARIANT",
        "Загрузка JSON в VARIANT",
        "полуструктурированные данные",
        "Загрузка JSON через Stream Load",
        "Storage Format V3",
        "describe_extend_variant_column",
        "Определение типов VARIANT"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Semi-structured data load / VARIANT table initialization -->

В этом документе описано, как загрузить данные CSV или JSON в столбец `VARIANT` в Doris: от создания таблицы до загрузки данных и проверки результата.

## Целевая аудитория и материалы для предварительного ознакомления {#target-audience-and-prerequisite-reading}

Прежде чем читать этот документ, выберите материал, который лучше всего соответствует вашей задаче:

| Ваша задача | Рекомендуемый материал |
| --- | --- |
| Быстро загрузить данные CSV / JSON | Продолжайте читать этот документ |
| Выбрать режим по умолчанию, Sparse, режим DOC или Schema Template | [Руководство по использованию и настройке VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide) |
| Найти синтаксис запросов с VARIANT, сведения об индексах, ограничениях или настройках | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT) |

## Ограничения {#limitations}

- В настоящее время загрузка в столбец `VARIANT` поддерживается только для форматов данных **CSV** и **JSON**.

## Рекомендация по формату хранения (V3) {#storage-format-recommendation-v3}

<!-- Knowledge type: Architecture selection decision -->

Для новых таблиц `VARIANT`, особенно при работе с JSON с большим числом полей, сразу используйте **Storage Format V3**, если у вас нет веской причины выбрать другой формат. Обоснование этого решения приведено в разделе [Storage Format V3](../../../table-design/storage-format).

Явно включите этот формат через `PROPERTIES` при создании таблицы:

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## Загрузка данных в формате CSV {#loading-csv-format}

### Шаг 1: Подготовка данных {#step-1-prepare-the-data}

Создайте файл CSV с именем `test_variant.csv` и следующим содержимым:

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### Шаг 2: Создание таблицы в базе данных {#step-2-create-the-table-in-the-database}

Выполните следующую инструкцию SQL, чтобы создать таблицу:

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

### Шаг 3: Загрузка данных {#step-3-load-the-data}

Например, для загрузки данных через Stream Load выполните следующую команду:

```SQL
curl --location-trusted -u root:  -T test_variant.csv -H "column_separator:|" http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

Пример ответа при успешной загрузке:

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### Шаг 4: Проверка загруженных данных {#step-4-verify-the-loaded-data}

Выполните следующий запрос SQL, чтобы убедиться, что данные записаны:

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

## Загрузка данных в формате JSON {#loading-json-format}

### Шаг 1: Подготовка данных {#step-1-prepare-the-data-1}

Создайте файл JSON с именем `test_variant.json` и следующим содержимым:

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### Шаг 2: Создание таблицы в базе данных {#step-2-create-the-table-in-the-database-1}

Выполните следующую инструкцию SQL, чтобы создать таблицу:

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### Шаг 3: Загрузка данных {#step-3-load-the-data-1}

Например, для загрузки данных через Stream Load выполните следующую команду:

```SQL
curl --location-trusted -u root:  -T test_variant.json -H "format:json"  http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

Пример ответа при успешной загрузке:

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### Шаг 4: Проверка загруженных данных {#step-4-verify-the-loaded-data-1}

Выполните следующий запрос SQL, чтобы убедиться, что данные записаны:

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

### Шаг 5: Проверка определения типов {#step-5-verify-type-inference}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: VARIANT subcolumn type confirmation / schema exploration -->

По умолчанию `DESC` показывает только столбец VARIANT верхнего уровня, не раскрывая вложенные подстолбцы:

``` sql
mysql> desc test_variant;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| public                                                     | BOOLEAN    | Yes  | false | NULL    | NONE  |
+------------------------------------------------------------+------------+------+-------+---------+-------+
6 rows in set (0.07 sec)
```

После включения `describe_extend_variant_column` можно просмотреть автоматически определённые типы подстолбцов столбца VARIANT:

``` sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.01 sec)

mysql> desc test_variant;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| actor.avatar_url                                           | TEXT       | Yes  | false | NULL    | NONE  |
| actor.display_login                                        | TEXT       | Yes  | false | NULL    | NONE  |
| actor.id                                                   | INT        | Yes  | false | NULL    | NONE  |
| actor.login                                                | TEXT       | Yes  | false | NULL    | NONE  |
| actor.url                                                  | TEXT       | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| payload.action                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.before                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.author_association                         | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.body                                       | TEXT       | Yes  | false | NULL    | NONE  |
....
+------------------------------------------------------------+------------+------+-------+---------+-------+
406 rows in set (0.07 sec)
```

Результаты определения типов также можно просмотреть по партициям:

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## Часто задаваемые вопросы {#faq}

### Вопрос 1: Какие форматы данных поддерживает VARIANT при загрузке? {#q1-which-data-formats-does-variant-support-for-loading}

В настоящее время загрузка в столбец `VARIANT` поддерживается только для форматов **CSV** и **JSON**. Данные в других форматах необходимо преобразовать перед загрузкой.

### Вопрос 2: Когда требуется Storage Format V3? {#q2-when-is-storage-format-v3-required}

Для новых таблиц `VARIANT`, особенно при работе с JSON с большим числом полей, сразу используйте формат хранения V3. Более ранние форматы хранения не рекомендуются, если у вас нет веской причины их использовать.

### Вопрос 3: Почему `DESC` не показывает автоматически определённые подстолбцы VARIANT? {#q3-why-does-desc-not-show-the-subcolumns-inferred-from-variant}

По умолчанию `DESC` показывает только столбец VARIANT верхнего уровня. Сначала выполните:

```sql
SET describe_extend_variant_column = true;
```

После этого повторный запуск `DESC` покажет все автоматически определённые подстолбцы и их типы. Их также можно просмотреть по партициям с помощью `DESCRIBE ${table_name} PARTITION ($partition_name)`.

### Вопрос 4: Чем отличаются инструкции создания таблицы при загрузке CSV и JSON? {#q4-how-do-the-table-creation-statements-differ-between-the-csv-and-json-loading-methods}

Инструкции создания таблицы практически одинаковы. Единственное отличие заключается в том, что в примере для CSV явно указано `"replication_num" = "1"`. При загрузке различаются команды Stream Load:

| Формат | Ключевой заголовок |
| --- | --- |
| CSV | `-H "column_separator:|"` |
| JSON | `-H "format:json"` |

### Вопрос 5: Как убедиться, что загрузка через Stream Load прошла успешно? {#q5-how-do-you-confirm-whether-a-stream-load-succeeded}

Проверьте поле `Status` в возвращённом JSON:

- Значение `Status`, равное `Success`, указывает на успешную загрузку.
- Значение `NumberLoadedRows` должно совпадать с `NumberTotalRows`, а `NumberFilteredRows` должно быть равно `0`.
