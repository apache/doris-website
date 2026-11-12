---
{
    "title": "ARRAY | Сложные типы",
    "language": "ru",
    "description": "Как импортировать данные типа ARRAY в Apache Doris с помощью Stream Load в форматах CSV и JSON: создание таблицы, разделители и примеры параметров.",
    "sidebar_label": "ARRAY",
    "keywords": [
        "ARRAY import",
        "array type",
        "complex type import",
        "CSV import array",
        "JSON import array",
        "Stream Load",
        "ARRAY<T>",
        "Apache Doris array",
        "column_separator",
        "strip_outer_array"
    ]
}
---

<!-- Knowledge type: Procedure / Data import example -->
<!-- Applicable scenario: Importing data files containing array fields into Doris -->

`ARRAY<T>` представляет собой массив элементов типа T и обычно используется для хранения тегов, списков идентификаторов, многозначных атрибутов и в других подобных случаях. Синтаксис этого типа, ограничения и поддерживаемые функции описаны в разделе [Тип данных ARRAY](../../../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md).

В этом документе описано, **как импортировать в Doris данные, содержащие поля ARRAY**, и приведены полные примеры для двух типичных сценариев в зависимости от формата исходных данных: CSV и JSON.

## Сценарии применения {#applicable-scenarios}

| Источник данных | Рекомендуемый способ | Основные параметры |
| --- | --- | --- |
| Текстовые файлы с разделителями `|`, `\t` или другими подобными символами | Stream Load в формате CSV | `column_separator` |
| Вложенные структурированные массивы JSON | Stream Load в формате JSON | `format=json`, `strip_outer_array` |

Общий порядок действий:

1. Подготовьте исходный файл данных в подходящем формате
2. Создайте в Doris целевую таблицу со столбцом `ARRAY<T>`
3. Импортируйте файл с помощью Stream Load
4. Выполните запрос и проверьте, что данные разобраны правильно

## Импорт в формате CSV {#csv-format-import}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Создайте CSV-файл `test_array.csv`. Поскольку элементы массива разделяются запятыми, в качестве разделителя столбцов здесь используется `|`, чтобы разделитель столбцов не совпадал с разделителем элементов массива:

```text
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-the-table-in-the-database}

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 3: Импортируйте данные {#step-3-import-the-data}

Импортируйте данные с помощью Stream Load, указав в параметре `column_separator` символ `|` в качестве разделителя столбцов:

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### Шаг 4: Проверьте импортированные данные {#step-4-check-the-imported-data}

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## Импорт в формате JSON {#json-format-import}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Создайте JSON-файл `test_array.json`. На внешнем уровне он представляет собой массив объектов:

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-the-table-in-the-database-1}

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 3: Импортируйте данные {#step-3-import-the-data-1}

Импортируйте данные с помощью Stream Load. Установите для `format` значение `json` и используйте `strip_outer_array:true`, чтобы разбить внешний массив на несколько строк:

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### Шаг 4: Проверьте импортированные данные {#step-4-check-the-imported-data-1}

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## Описание основных параметров {#key-parameter-description}

| Параметр | Применимый формат | Описание |
| --- | --- | --- |
| `column_separator` | CSV | Разделитель столбцов. Если массив содержит запятые, рекомендуется использовать символы `|` or `\t`, чтобы избежать конфликта с разделителем элементов массива |
| `columns` | CSV / JSON | Задаёт порядок сопоставления столбцов данных со столбцами таблицы |
| `format` | JSON | Установите значение `json`, чтобы указать, что входные данные разбираются в формате JSON |
| `strip_outer_array` | JSON | При значении `true` внешние скобки `[]` удаляются, а каждый объект внутри импортируется как отдельная строка |

## Часто задаваемые вопросы {#faq}

### Почему нельзя использовать запятую в качестве разделителя столбцов CSV, если массив содержит запятые? {#when-the-array-contains-commas-why-cannot-the-csv-column-separator-be-a-comma}

В CSV-файле массив `ARRAY` записывается в виде `[1,2,3]`, где элементы разделены запятыми. Если разделителем столбцов также служит запятая, парсер не может отличить разделитель элементов массива от разделителя столбцов, что приводит к ошибкам разбора. Используйте символы, например `|` или `\t`, которые не встречаются в содержимом массива.

### Как представить массивы NULL и пустые массивы? {#how-to-represent-null-arrays-and-empty-arrays}

- **Массив NULL**: запишите `null` напрямую (CSV) или используйте литерал JSON `null`. После импорта значение будет `NULL`
- **Пустой массив**: запишите `[]`. После импорта значение будет `[]`. Эти варианты имеют разную семантику

### Что делать, если на внешнем уровне JSON-файла находится не массив? {#what-if-the-outermost-layer-of-the-json-file-is-not-an-array}

Если каждая строка файла представляет собой отдельный объект JSON (JSON Lines), задавать `strip_outer_array` не нужно. Только если внешний уровень имеет вид `[ {...}, {...} ]`, нужно установить `strip_outer_array` в `true`.
