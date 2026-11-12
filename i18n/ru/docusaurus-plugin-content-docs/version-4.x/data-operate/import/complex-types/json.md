---
{
    "title": "JSON | Сложные типы",
    "language": "ru",
    "description": "В этой статье описаны возможности и ограничения по объёму типа JSON в Apache Doris, а также способы импорта через Stream Load и примеры для форматов CSV и JSON.",
    "keywords": [
        "Doris JSON",
        "JSON data type",
        "JSONB",
        "JSON import",
        "Stream Load JSON",
        "json_extract",
        "complex type import",
        "semi-structured data"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Data type description + Operation steps -->
<!-- Use case: Semi-structured data modeling / JSON data import -->

## Обзор {#overview}

`JSON` представляет собой сложный тип данных в Apache Doris. Он обеспечивает эффективное хранение данных JSON в двоичном формате и предоставляет функции JSON для доступа к внутренним полям. Выбирайте этот тип, если вам нужно хранить полуструктурированные данные, например журналы событий, атрибуты пользователей или параметры конфигурации, и быстро обращаться к их внутренним полям.

По сравнению с хранением JSON в виде строк типа `String`, тип `JSON` обладает следующими преимуществами:

1. **Проверка данных**: Doris автоматически проверяет формат JSON при записи, предотвращая сохранение некорректных данных.
2. **Быстрый доступ**: двоичный формат хранения компактнее, а доступ к полям JSON с помощью таких функций, как `json_extract`, в несколько раз быстрее, чем с помощью функций `get_json_xx`.

### Ограничения по объёму {#capacity-limits}

| Параметр | По умолчанию | Максимум | Как изменить |
| --- | --- | --- | --- |
| Размер одного поля JSON | 1 MB (1048576 байт) | 2 GB (2147483643 байт) | Измените параметр конфигурации BE `string_type_length_soft_limit_bytes` |

:::caution[Совместимость версий]
В версии 1.2.x тип JSON назывался `JSONB`. Для совместимости с MySQL начиная с версии 2.0.0 он был переименован в `JSON`. Существующие таблицы, созданные с типом `JSONB`, продолжают работать в обычном режиме.
:::

## Выбор способа импорта {#choose-an-import-method}

Выберите способ импорта в зависимости от формата исходного файла данных:

| Формат исходного файла | Сценарий использования | Основные параметры |
| --- | --- | --- |
| CSV | Данные поступают из файла с разделителями, в котором каждая строка содержит одну запись | `column_separator` (рекомендуется разделитель, отличный от запятой, например `|`) |
| JSON | Данные уже представлены в формате массива JSON или JSON Lines | `format:json`, `strip_outer_array:true` |

В следующих разделах на примере Stream Load пошагово описан полный процесс импорта обоими способами.

## Импорт в формате CSV {#import-via-csv-format}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Создайте файл CSV `test_json.csv`. Поскольку в JSON для разделения полей используются запятые, задайте `|` в качестве разделителя столбцов, чтобы избежать конфликтов:

```text
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "micheal", "age": null}
4|{"name": null, "age": null}
5|null
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database}

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 3: Импортируйте данные {#step-3-import-the-data}

Отправьте задание Stream Load. Задайте разделитель столбцов `|` с помощью параметра `column_separator`:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_json" \
    -T "test_json.csv" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### Шаг 4: Проверьте импортированные данные {#step-4-verify-the-imported-data}

```sql
SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## Импорт в формате JSON {#import-via-json-format}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Создайте файл JSON `test_json.json`. Содержимое файла представляет собой массив JSON, каждый элемент которого соответствует одной строке данных:

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "micheal", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database-1}

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 3: Импортируйте данные {#step-3-import-the-data-1}

Отправьте задание Stream Load. Задайте `format:json` и используйте `strip_outer_array:true`, чтобы развернуть внешний массив:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_json" \
    -H "strip_outer_array:true" \
    -T "test_json.json" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### Шаг 4: Проверьте импортированные данные {#step-4-verify-the-imported-data-1}

```sql
mysql> SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**В1: Каков максимальный размер поля JSON?**

По умолчанию ограничение составляет 1 MB (1048576 байт). Его можно увеличить до 2 GB (2147483643 байт), изменив параметр конфигурации BE `string_type_length_soft_limit_bytes`.

**В2: Нужно ли изменять поля `JSONB`, созданные в версии 1.2.x, после обновления?**

Изменения не требуются. Начиная с версии 2.0.0 тип был переименован в `JSON`, однако существующие таблицы, созданные с типом `JSONB`, по-прежнему поддерживают чтение и запись в обычном режиме.

**В3: Почему для хранения JSON рекомендуется использовать тип `JSON` вместо `String`?**

Тип `JSON` проверяет формат при записи, предотвращая сохранение некорректных данных. Его двоичный формат хранения компактнее, а доступ к полям с помощью таких функций, как `json_extract`, в несколько раз быстрее, чем с помощью функций `get_json_xx`.

**В4: Зачем использовать разделитель `|` при импорте CSV?**

Сам JSON содержит запятые, поэтому использование запятой в качестве разделителя столбцов приведёт к ошибкам разбора. Выберите в качестве разделителя столбцов символ, который не встречается в строках JSON, например `|`.

**В5: Зачем нужен параметр `strip_outer_array:true` при импорте массива JSON?**

Этот параметр указывает Stream Load развернуть внешний массив JSON и импортировать каждый его элемент как отдельную строку. Без него весь массив обрабатывается как одна запись.
