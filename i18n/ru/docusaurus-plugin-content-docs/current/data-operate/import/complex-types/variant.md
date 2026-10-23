---
{
    "title": "VARIANT",
    "language": "ru",
    "description": "Как загрузить данные CSV и JSON в столбец VARIANT в Doris? Полная последовательность действий: создание таблицы, команды Stream Load и проверка вывода типов.",
    "keywords": [
        "Загрузка в Doris VARIANT",
        "Загрузка CSV в VARIANT",
        "Загрузка JSON в VARIANT",
        "полуструктурированные данные",
        "Загрузка JSON с помощью Stream Load",
        "Storage Format V3",
        "describe_extend_variant_column",
        "Вывод типов VARIANT"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Semi-structured data load / VARIANT table initialization -->

В этом документе описана загрузка данных CSV или JSON в столбец `VARIANT` в Doris: от создания таблицы до загрузки данных и проверки результата.

## Для кого предназначен документ и что прочитать заранее {#target-audience-and-prerequisite-reading}

Прежде чем читать этот документ, выберите материал, который лучше всего соответствует вашей задаче:

| Ваша задача | Рекомендуемый материал |
| --- | --- |
| Быстро загрузить данные CSV / JSON | Продолжайте читать этот документ |
| Выбрать между режимом по умолчанию, Sparse, режимом DOC и Schema Template | [Руководство по использованию и настройке VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md) |
| Найти сведения о синтаксисе запросов к VARIANT, индексах, ограничениях или параметрах настройки | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md) |

## Ограничения {#limitations}

- В приведённых ниже примерах загружаются файлы **CSV** и **JSON**. В задании загрузки любое строковое поле, загружаемое в столбец `VARIANT`, разбирается как JSON, поэтому другие форматы работают так же, если исходный столбец содержит строки, например столбец `STRING` в Parquet. Формат Arrow не поддерживает загрузку столбцов `VARIANT`.

## Как обрабатываются загружаемые значения {#how-loaded-values-are-handled}

- **Столбцы `NOT NULL`:** строка, в которой значение VARIANT равно SQL `NULL`, отфильтровывается, в том числе если SQL `NULL` получен из-за ошибки разбора. Отфильтрованные строки учитываются в `max_filter_ratio` (по умолчанию `0`), поэтому при настройках по умолчанию задание загрузки завершается ошибкой.
- **Особенность INSERT:** `INSERT` не выполняет разбор строк. `INSERT INTO t VALUES (1, '{"a": 1}')` сохраняет в VARIANT строку `{"a": 1}`; так же работает `INSERT INTO ... SELECT` из `s3()`, `hdfs()` или `local()`. Чтобы сохранить объект, используйте `PARSE_TO_VARIANT`.

Сохраняемые значения нормализуются: вне массивов из объектов удаляются поля со значением `null`, `{}` или `[]`. То же значение, вычисленное в запросе, сохраняет все поля:

```sql
CREATE TABLE variant_norm (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_norm VALUES (1, PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}'));

SELECT PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}') AS computed;
SELECT v AS stored, v['a'] IS NULL AS a_is_null FROM variant_norm;
```

```text
+--------------------------------+
| computed                       |
+--------------------------------+
| {"a":null,"b":{},"c":[],"d":1} |
+--------------------------------+

+---------+-----------+
| stored  | a_is_null |
+---------+-----------+
| {"d":1} |         1 |
+---------+-----------+
```

Об ошибках разбора и других правилах нормализации см. разделы [Ошибки разбора](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#parse-errors) и [Что сохраняется при хранении](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps).

## Рекомендуемый формат хранения (V3) {#storage-format-recommendation-v3}

<!-- Knowledge type: Architecture selection decision -->

Для новых таблиц с `VARIANT`, особенно при работе с широкими JSON-объектами, сразу используйте **Storage Format V3**, если у вас нет веских причин выбрать другой формат. Обоснование этого решения приведено в разделе [Storage Format V3](../../../table-design/storage-format.md).

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

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Создайте CSV-файл с именем `test_variant.csv` и следующим содержимым:

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-the-table-in-the-database}

Выполните следующий SQL-оператор, чтобы создать таблицу:

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

### Шаг 3: Загрузите данные {#step-3-load-the-data}

На примере Stream Load загрузите данные следующей командой:

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

### Шаг 4: Проверьте загруженные данные {#step-4-verify-the-loaded-data}

Выполните следующий SQL-запрос, чтобы убедиться, что данные записаны:

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

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Создайте JSON-файл с именем `test_variant.json` и следующим содержимым:

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-the-table-in-the-database-1}

Выполните следующий SQL-оператор, чтобы создать таблицу:

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

### Шаг 3: Загрузите данные {#step-3-load-the-data-1}

На примере Stream Load загрузите данные следующей командой:

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

### Шаг 4: Проверьте загруженные данные {#step-4-verify-the-loaded-data-1}

Выполните следующий SQL-запрос, чтобы убедиться, что данные записаны:

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

### Шаг 5: Проверьте вывод типов {#step-5-verify-type-inference}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: VARIANT subcolumn type confirmation / schema exploration -->

По умолчанию `DESC` показывает только столбец VARIANT верхнего уровня и не раскрывает вложенные столбцы:

```sql
mysql> desc test_variant;
+------------+---------------------------+------+-------+---------+-------+
| Field      | Type                      | Null | Key   | Default | Extra |
+------------+---------------------------+------+-------+---------+-------+
| id         | bigint                    | No   | true  | NULL    |       |
| type       | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor      | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo       | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload    | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public     | boolean                   | Yes  | false | NULL    | NONE  |
| created_at | datetime                  | Yes  | false | NULL    | NONE  |
+------------+---------------------------+------+-------+---------+-------+
7 rows in set
```

Строка типа VARIANT, в которой перечислены свойства столбца, здесь сокращена до `variant<PROPERTIES (...)>`.

После включения `describe_extend_variant_column` можно просмотреть типы вложенных столбцов, выведенные из столбца VARIANT:

```sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.00 sec)

mysql> desc test_variant;
+-----------------------+---------------------------+------+-------+---------+-------+
| Field                 | Type                      | Null | Key   | Default | Extra |
+-----------------------+---------------------------+------+-------+---------+-------+
| id                    | bigint                    | No   | true  | NULL    |       |
| type                  | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor                 | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo                  | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload               | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public                | boolean                   | Yes  | false | NULL    | NONE  |
| created_at            | datetime                  | Yes  | false | NULL    | NONE  |
| actor.avatar_url      | text                      | Yes  | false | NULL    | NONE  |
| actor.display_login   | text                      | Yes  | false | NULL    | NONE  |
| actor.gravatar_id     | text                      | Yes  | false | NULL    | NONE  |
| actor.id              | bigint                    | Yes  | false | NULL    | NONE  |
| actor.login           | text                      | Yes  | false | NULL    | NONE  |
| actor.url             | text                      | Yes  | false | NULL    | NONE  |
| payload.before        | text                      | Yes  | false | NULL    | NONE  |
| payload.commits       | array<text>               | Yes  | false | NULL    | NONE  |
| payload.distinct_size | bigint                    | Yes  | false | NULL    | NONE  |
| payload.head          | text                      | Yes  | false | NULL    | NONE  |
| payload.push_id       | bigint                    | Yes  | false | NULL    | NONE  |
| payload.ref           | text                      | Yes  | false | NULL    | NONE  |
| payload.size          | bigint                    | Yes  | false | NULL    | NONE  |
| repo.id               | bigint                    | Yes  | false | NULL    | NONE  |
| repo.name             | text                      | Yes  | false | NULL    | NONE  |
| repo.url              | text                      | Yes  | false | NULL    | NONE  |
+-----------------------+---------------------------+------+-------+---------+-------+
23 rows in set
```

Результаты вывода типов также можно просмотреть для отдельной партиции:

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## Часто задаваемые вопросы {#faq}

### Q1: Какие форматы данных поддерживаются при загрузке в VARIANT? {#q1-which-data-formats-does-variant-support-for-loading}

Задания загрузки разбирают любое строковое поле, загружаемое в столбец `VARIANT`, как JSON независимо от формата файла; в примерах этого документа используются **CSV** и **JSON**. При использовании `INSERT`, в том числе `INSERT INTO ... SELECT` из табличных функций, оборачивайте строковые значения в `PARSE_TO_VARIANT`.

### Q2: Когда требуется Storage Format V3? {#q2-when-is-storage-format-v3-required}

Для новых таблиц с `VARIANT`, особенно при работе с широкими JSON-объектами с большим количеством полей, сразу используйте формат хранения V3. Более ранние форматы хранения не рекомендуются, если у вас нет веских причин их использовать.

### Q3: Почему `DESC` не показывает вложенные столбцы, выведенные из VARIANT? {#q3-why-does-desc-not-show-the-subcolumns-inferred-from-variant}

По умолчанию `DESC` показывает только столбец VARIANT верхнего уровня. Сначала выполните:

```sql
SET describe_extend_variant_column = true;
```

После этого повторный вызов `DESC` покажет все выведенные вложенные столбцы и их типы. Их также можно просмотреть для отдельной партиции с помощью `DESCRIBE ${table_name} PARTITION ($partition_name)`.

### Q4: Чем отличаются операторы создания таблицы при загрузке CSV и JSON? {#q4-how-do-the-table-creation-statements-differ-between-the-csv-and-json-loading-methods}

Операторы создания таблицы практически одинаковы. Единственное отличие состоит в том, что в примере CSV явно указано `"replication_num" = "1"`. Различие при загрузке заключается в команде Stream Load:

| Формат | Основной заголовок |
| --- | --- |
| CSV | `-H "column_separator:\|"` |
| JSON | `-H "format:json"` |

### Q5: Как проверить, успешно ли завершилась загрузка Stream Load? {#q5-how-do-you-confirm-whether-a-stream-load-succeeded}

Проверьте поле `Status` в возвращённом JSON:

- Значение `Status`, равное `Success`, указывает на успешную загрузку.
- Значение `NumberLoadedRows` должно быть равно `NumberTotalRows`, а `NumberFilteredRows` должно быть равно `0`.

### Q6: Почему `INSERT` сохраняет мой JSON-текст как строку? {#q6-why-does-insert-store-my-json-text-as-a-string}

`INSERT` преобразует строку в VARIANT с помощью `CAST(string AS VARIANT)`, сохраняя её как строку без разбора. Задания загрузки, такие как Stream Load, выполняют разбор JSON-текста; при использовании `INSERT` оборачивайте текст в `PARSE_TO_VARIANT`:

```sql
INSERT INTO testdb.test_variant (id, actor)
VALUES (1, PARSE_TO_VARIANT('{"id": 282080, "login": "brianchandotcom"}'));
```
