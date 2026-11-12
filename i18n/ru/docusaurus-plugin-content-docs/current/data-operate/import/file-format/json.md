---
{
    "title": "JSON | Формат файла",
    "language": "ru",
    "description": "Руководство по импорту файлов JSON в Doris: три формата JSON, настройка параметров jsonpaths и json_root, а также примеры использования Stream Load, Broker Load, Routine Load и TVF.",
    "keywords": [
        "импорт JSON в Doris",
        "jsonpaths",
        "json_root",
        "strip_outer_array",
        "read_json_by_line",
        "Stream Load JSON",
        "Routine Load JSON",
        "импорт вложенного JSON"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: JSON data import / Field extraction / Nested structure handling -->

В этом документе описывается импорт файлов данных в формате JSON в Doris. Doris поддерживает импорт данных в стандартном формате JSON. Настройка параметров позволяет гибко обрабатывать различные структуры данных JSON, извлекать поля из данных JSON, разбирать вложенные структуры и выполнять другие операции.

## Способы импорта {#import-methods}

Следующие способы импорта поддерживают данные в формате JSON:

| Способ импорта | Сценарий применения | Передача параметров |
|---|---|---|
| [Stream Load](../import-way/stream-load-manual) | Импорт небольшими пакетами почти в реальном времени с отправкой данных с локального компьютера или из клиента | HTTP Header, например `-H "jsonpaths: $.data"` |
| [Broker Load](../import-way/broker-load-manual) | Массовый импорт больших файлов из объектного хранилища, HDFS и аналогичных источников | `PROPERTIES`, например `PROPERTIES("jsonpaths"="$.data")` |
| [Routine Load](../import-way/routine-load-manual) | Непрерывное получение JSON из очередей сообщений, таких как Kafka | `PROPERTIES`, например `PROPERTIES("jsonpaths"="$.data")` |
| [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) | Чтение файлов JSON в S3 напрямую с помощью SQL | Параметры TVF, например `S3("jsonpaths"="$.data")` |
| [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) | Чтение файлов JSON в HDFS напрямую с помощью SQL | Параметры TVF |

## Поддерживаемые форматы JSON {#supported-json-formats}

Doris поддерживает следующие три варианта организации файлов JSON, каждый из которых подходит для определённых бизнес-сценариев.

### Формат 1: Несколько строк в виде массива {#format-1-multiple-rows-represented-as-an-array}

Подходит для массового импорта нескольких строк за один раз.

Требования:

- Корневой узел должен быть массивом.
- Каждый элемент массива должен быть объектом, представляющим одну строку данных.
- Необходимо задать `strip_outer_array=true`.

Пример данных:

```json
[
    {"id": 123, "city": "beijing"},
    {"id": 456, "city": "shanghai"}
]

// Nested structures are supported
[
    {"id": 123, "city": {"name": "beijing", "region": "haidian"}},
    {"id": 456, "city": {"name": "beijing", "region": "chaoyang"}}
]
```

### Формат 2: Одна строка в виде объекта {#format-2-a-single-row-represented-as-an-object}

Подходит для импорта одной строки данных.

Требования:

- Корневой узел должен быть объектом.
- Весь объект представляет одну строку данных.
- В каждой строке файла должна быть только одна запись JSON.

Пример данных:

```json
{"id": 123, "city": "beijing"}

// Nested structures are supported
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip Примечание
Этот формат обычно используется с Routine Load, например для отдельного сообщения в Kafka.
:::

### Формат 3: Несколько строк объектов, разделённых фиксированным разделителем {#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter}

Подходит для массового импорта нескольких строк, каждая из которых является отдельным объектом JSON (аналогично NDJSON).

Требования:

- Каждая строка должна содержать полный объект JSON.
- Явно задавать `read_json_by_line=true` не требуется: этот режим включён по умолчанию.
- Разделитель строк можно указать с помощью параметра `line_delimiter`; по умолчанию используется `\n`.

Пример данных:

```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## Настройка параметров {#parameter-configuration}

### Матрица поддержки параметров для каждого способа импорта {#parameter-support-matrix-for-each-import-method}

В следующей таблице показана поддержка параметров JSON для разных способов импорта:

| Параметр | Значение по умолчанию | Stream Load | Broker Load | Routine Load | TVF |
|---|---|---|---|---|---|
| `jsonpaths` | Не задано | Поддерживается | Поддерживается | Поддерживается | Поддерживается |
| `json_root` | Не задано | Поддерживается | Поддерживается | Поддерживается | Поддерживается |
| `strip_outer_array` | false | Поддерживается | Поддерживается | Поддерживается | Поддерживается |
| `read_json_by_line` | true | Поддерживается | Не настраивается | Не настраивается | Поддерживается |
| `fuzzy_parse` | false | Поддерживается | Поддерживается | Не поддерживается | Поддерживается |
| `num_as_string` | false | Поддерживается | Поддерживается | Поддерживается | Поддерживается |
| Формат сжатия | plain | Поддерживается | Поддерживается | Не поддерживается | Поддерживается |

:::tip Передача параметров и поведение по умолчанию

1. Stream Load: параметры передаются напрямую через HTTP Header, например `-H "jsonpaths: $.data"`.
2. Broker Load: параметры передаются через `PROPERTIES`, например `PROPERTIES("jsonpaths"="$.data")`.
3. Routine Load: параметры передаются через `PROPERTIES`, например `PROPERTIES("jsonpaths"="$.data")`.
4. TVF: параметры передаются в выражении TVF, например `S3("jsonpaths"="$.data")`.
5. Чтобы напрямую импортировать объект JSON из корневого узла файла JSON, задайте для `jsonpaths` значение `$.`, например `PROPERTIES("jsonpaths"="$.")`.
6. Значение `read_json_by_line` по умолчанию равно true. Это означает, что, если при импорте не указан ни `strip_outer_array`, ни `read_json_by_line`, значение `read_json_by_line` равно true.
7. `read_json_by_line` не настраивается в Broker Load и Routine Load. Для него принудительно устанавливается true, чтобы обеспечить потоковое чтение и снизить нагрузку на память BE.

:::

### Подробное описание параметров {#detailed-parameter-description}

#### jsonpaths {#jsonpaths}

- **Назначение**: Задаёт способ извлечения полей из данных JSON.
- **Тип**: Массив строк.
- **Значение по умолчанию**: Не задано. По умолчанию столбцы сопоставляются по имени.
- **Примеры**:

    ```json
    -- Basic usage
    ["$.id", "$.city"]

    -- Nested structure
    ["$.id", "$.info.city", "$.data[0].name"]
    ```

#### json_root {#json_root}

- **Назначение**: Задаёт начальную точку разбора данных JSON.
- **Тип**: Строка.
- **Значение по умолчанию**: Не задано. По умолчанию разбор начинается с корневого узла.
- **Примеры**:

    ```json
    -- Original data
    {
      "data": {
        "id": 123,
        "city": "beijing"
      }
    }

    -- Set json_root
    json_root = $.data
    ```

#### strip_outer_array {#strip_outer_array}

- **Назначение**: Определяет, нужно ли удалять внешнюю структуру массива.
- **Тип**: Логическое значение.
- **Значение по умолчанию**: false.
- **Примеры**:

    ```json
    -- Original data
    [
      {"id": 1, "city": "beijing"},
      {"id": 2, "city": "shanghai"}
    ]

    -- Set strip_outer_array=true
    ```

#### read_json_by_line {#read_json_by_line}

- **Назначение**: Определяет, нужно ли читать данные JSON построчно.
- **Тип**: Логическое значение.
- **Значение по умолчанию**: true, если `strip_outer_array` не задан; при указании `strip_outer_array=true` значением по умолчанию становится false. (Broker Load и Routine Load всегда принудительно устанавливают `read_json_by_line=true`.)
- **Примеры**:

    ```json
    -- Original data (one complete JSON object per line)
    {"id": 1, "city": "beijing"}
    {"id": 2, "city": "shanghai"}

    -- Set read_json_by_line=true
    ```

#### fuzzy_parse {#fuzzy_parse}

- **Назначение**: Ускоряет импорт данных JSON.
- **Тип**: Логическое значение.
- **Значение по умолчанию**: false.
- **Ограничения**:
    - Порядок полей в каждой строке массива должен быть строго одинаковым.
    - Обычно используется вместе с `strip_outer_array`.
- **Производительность**: Повышает скорость импорта в 3–5 раз.

#### num_as_string {#num_as_string}

- **Назначение**: Определяет, нужно ли разбирать числовые значения в JSON как строки.
- **Тип**: Логическое значение.
- **Значение по умолчанию**: false.
- **Сценарии использования**:
    - Обработка чисел, выходящих за пределы поддерживаемого числового диапазона.
    - Предотвращение потери точности чисел.
- **Пример**:

    ```json
    -- Original data
    {
      "id": "12345678901234567890",
      "price": "99999999.999999"
    }
    -- With num_as_string=true, the price field is parsed as a string
    ```

### Связь между JSON Path и Columns {#relationship-between-json-path-and-columns}

При импорте данных `jsonpaths` и `columns` выполняют разные задачи:

| Параметр | Задача | Результат |
|---|---|---|
| `jsonpaths` | Определяет правила извлечения данных | Извлекает поля из данных JSON по указанным путям и упорядочивает их в соответствии с порядком, заданным в `jsonpaths` |
| `columns` | Определяет правила сопоставления данных | Сопоставляет извлечённые поля со столбцами целевой таблицы, при необходимости изменяя порядок столбцов и преобразуя значения |

Они обрабатываются последовательно:

1. Сначала `jsonpaths` извлекает поля из исходных данных и формирует упорядоченный набор данных.
2. Затем `columns` сопоставляет эти элементы данных со столбцами таблицы.

Если `columns` не указан, извлечённые поля сопоставляются напрямую в порядке столбцов таблицы.

#### Пример 1: Использование только JSON Path {#example-1-using-json-path-only}

Схема таблицы и данные:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON data
{"k1": 1, "k2": 2}
```

Команда импорта:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Результат импорта:

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 |
+------+------+
```

#### Пример 2: Совместное использование JSON Path и Columns {#example-2-using-json-path-together-with-columns}

Используйте ту же схему таблицы и те же данные, что и выше, и добавьте параметр `columns`.

Команда импорта:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Результат импорта:

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 |
+------+------+
```

#### Пример 3: Повторное использование поля {#example-3-reusing-a-field}

Схема таблицы и данные:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_copy int
);

-- JSON data
{"k1": 1, "k2": 2}
```

Команда импорта:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Результат импорта:

```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```

#### Пример 4: Сопоставление вложенных полей {#example-4-mapping-nested-fields}

Схема таблицы и данные:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_nested1 int,
    k1_nested2 int
);

-- JSON data
{
    "k1": 1,
    "k2": 2,
    "k3": {
        "k1": 31,
        "k1_nested": {
            "k1": 32
        }
    }
}
```

Команда импорта:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

Результат импорта:

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

## Примеры использования {#usage-examples}

В этом разделе показано, как использовать формат JSON с каждым способом импорта. Приведённые фрагменты можно копировать и адаптировать под свои задачи.

### Stream Load {#stream-load}

```bash
# Use JSON Path
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "jsonpaths: [\"$.id\", \"$.city\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Specify JSON root
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "json_root: $.events" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Read JSON line by line
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "read_json_by_line: true" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load {#broker-load}

```sql
-- Use JSON Path
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "jsonpaths" = "[\"$.id\", \"$.city\"]"
    )
)
WITH S3
(
    ...
);

-- Specify JSON root
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "json_root" = "$.events"
    )
)
WITH S3
(
    ...
);
```

### Routine Load {#routine-load}

```sql
-- Use JSON Path
CREATE ROUTINE LOAD example_db.example_job ON example_table
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]"
)
FROM KAFKA
(
    ...
);
```

### TVF {#tvf}

```sql
-- Use JSON Path
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]",
    ...
);

-- Specify JSON root
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "json_root" = "$.events",
    ...
);
```

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: Почему при импорте файла JSON в виде массива все данные обрабатываются как одна строка? {#q1-when-importing-a-json-file-in-array-form-all-data-is-treated-as-a-single-row-why}

Необходимо явно задать `strip_outer_array=true`. В противном случае Doris разбирает весь внешний массив как один объект JSON и не может записывать данные построчно.

### Вопрос 2: Как импортировать файл, в котором каждая строка содержит один объект JSON (NDJSON)? {#q2-how-should-i-import-a-file-with-one-json-object-per-line-ndjson}

Импортируйте его напрямую, используя [формат 3](#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter). `read_json_by_line` включён по умолчанию, поэтому дополнительная настройка не требуется. Если разделитель строк отличается от `\n`, укажите его с помощью `line_delimiter`.

### Вопрос 3: Как напрямую импортировать объект JSON из корневого узла файла JSON? {#q3-how-do-i-import-the-json-object-at-the-root-node-of-a-json-file-directly}

Задайте для `jsonpaths` значение `$.`, например `PROPERTIES("jsonpaths"="$.")`.

### Вопрос 4: Как избежать потери точности для очень больших чисел или десятичных чисел высокой точности? {#q4-how-do-i-avoid-precision-loss-for-very-large-numbers-or-high-precision-decimals}

Задайте `num_as_string=true`. Числовые значения в JSON разбираются как строки, а затем записываются в столбцы соответствующих типов, что позволяет избежать числового переполнения и потери точности.

### Вопрос 5: Почему Broker Load / Routine Load не позволяют настраивать `read_json_by_line`? {#q5-why-does-broker-load--routine-load-not-allow-read_json_by_line-to-be-configured}

Чтобы снизить нагрузку на память BE, Broker Load и Routine Load всегда читают данные построчно в потоковом режиме. Поэтому `read_json_by_line` нельзя настроить явно.

### Вопрос 6: Как ускорить импорт большого количества массивов JSON с одинаковой структурой? {#q6-how-do-i-speed-up-the-import-of-large-numbers-of-json-arrays-with-the-same-structure}

Включите `fuzzy_parse=true` вместе с `strip_outer_array=true`, чтобы повысить скорость импорта в 3–5 раз. Порядок полей в каждой строке массива должен быть строго одинаковым.

### Вопрос 7: Как связаны `jsonpaths` и `columns` и какой параметр применяется первым? {#q7-what-is-the-relationship-between-jsonpaths-and-columns-and-which-takes-effect-first}

Сначала `jsonpaths` извлекает поля из JSON и располагает их в заданном порядке, а затем `columns` сопоставляет эти поля со столбцами целевой таблицы. Подробнее см. в разделе [Связь между JSON Path и Columns](#relationship-between-json-path-and-columns).
