---
{
    "title": "Загрузка данных типа STRUCT",
    "language": "ru",
    "description": "Описание загрузки данных типа STRUCT в Apache Doris из CSV и JSON, а также с помощью INSERT INTO, с примерами создания таблицы, использования Stream Load и проверки результатов.",
    "keywords": [
        "загрузка STRUCT",
        "загрузка сложных типов",
        "Doris STRUCT",
        "Stream Load STRUCT",
        "named_struct",
        "загрузка STRUCT из CSV",
        "загрузка STRUCT из JSON"
    ],
    "sidebar_label": "STRUCT"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Complex type data import -->

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` представляет собой структуру из нескольких полей, которую также можно рассматривать как совокупность нескольких столбцов. Подробнее о типе см. [Тип данных STRUCT](../../../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md).

В этой статье на примере типичных пользовательских сценариев описана загрузка данных STRUCT в Apache Doris для двух распространённых форматов данных:

- **Загрузка в формате CSV**: подходит для загрузки из текстовых файлов, результатов выполнения заданий ETL и подобных сценариев.
- **Загрузка в формате JSON**: подходит для загрузки из API, журналов или источников полуструктурированных данных.

В обоих случаях используется [Stream Load](../import-way/stream-load-manual.md). Для прямой записи также поддерживаются операторы `INSERT INTO VALUES`.

## Обзор процесса загрузки {#import-process-overview}

Независимо от формата данных загрузка данных типа STRUCT включает 4 этапа:

| Этап | Операция | Описание |
|------|------|------|
| 1 | Подготовка данных | Создайте файлы с тестовыми данными в целевом формате (CSV / JSON) |
| 2 | Создание таблицы в базе данных | Создайте схему таблицы с полем `STRUCT` |
| 3 | Загрузка данных | Запишите данные с помощью Stream Load или `INSERT INTO` |
| 4 | Проверка загруженных данных | Проверьте результат с помощью `SELECT` |

## Загрузка в формате CSV {#csv-format-import}

### Шаг 1: Подготовьте данные {#step-1-prepare-data}

Создайте CSV-файл `test_struct.csv` со следующим содержимым. В качестве разделителя используется `|` вместо запятой, чтобы отличать его от запятых внутри STRUCT.

```text
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database}

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 3: Загрузите данные {#step-3-import-data}

Используйте Stream Load для загрузки CSV-файла:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_struct" \
    -T "test_struct.csv" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

Также можно загрузить данные с помощью оператора `INSERT INTO VALUES`:

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### Шаг 4: Проверьте загруженные данные {#step-4-verify-imported-data}

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.01 sec)
```

## Загрузка в формате JSON {#json-format-import}

### Шаг 1: Подготовьте данные {#step-1-prepare-data-1}

Создайте JSON-файл `test_struct.json` со следующим содержимым:

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database-1}

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 3: Загрузите данные {#step-3-import-data-1}

Используйте Stream Load для загрузки JSON-файла. Укажите формат с помощью `format:json` и используйте `strip_outer_array:true` для разбора внешнего массива JSON:

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_struct" \
    -H "strip_outer_array:true" \
    -T "test_struct.json" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

### Шаг 4: Проверьте загруженные данные {#step-4-verify-imported-data-1}

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.00 sec)
```

## Основные параметры {#key-parameters}

<!-- Knowledge type: Configuration parameters -->

В следующей таблице приведены параметры заголовков Stream Load, часто используемые при загрузке STRUCT:

| Параметр | Применимый формат | Описание |
|------|----------|------|
| `column_separator` | CSV | Разделитель столбцов. Внутри STRUCT используется `,`, поэтому во избежание неоднозначности для внешнего разделителя рекомендуется использовать другие символы, например `|` |
| `columns` | CSV / JSON | Задаёт соответствие между столбцами и полями таблицы |
| `format` | JSON | Указывает, что формат загружаемого файла — `json` |
| `strip_outer_array` | JSON | Установите значение `true`, если внешний уровень JSON-файла представляет собой массив, чтобы данные разбирались построчно |

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

### 1. Почему в CSV-файле нужно использовать `|` вместо `,` в качестве разделителя? {#1-why-does-the-csv-file-need-to-use--instead-of--as-the-delimiter}

В литерале поля STRUCT для разделения полей используется `,` (например, `{10, 3.14, "Emily"}`). Если внешним разделителем столбцов также служит `,`, он будет конфликтовать с внутренним разделителем STRUCT и вызывать ошибки разбора. Рекомендуется использовать символы, которые не встречаются внутри STRUCT, например `|` или `\t`.

### 2. Как вставлять значения STRUCT непосредственно в SQL? {#2-how-to-insert-struct-values-directly-in-sql}

Используйте функцию `named_struct`, чтобы явно указать имя и значение каждого поля, например:

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 3. Какие варианты NULL допустимы для полей STRUCT? {#3-what-forms-of-null-are-allowed-for-struct-fields}

| Представление данных | Значение |
|----------|------|
| `null` | Весь столбец STRUCT имеет значение NULL |
| `{}` | Структура STRUCT существует, но все её поля имеют значение NULL |
| `{10, null, "Emily"}` | Некоторые поля имеют значение NULL, остальным присвоены обычные значения |

### 4. Почему при загрузке JSON нужно задавать `strip_outer_array:true`? {#4-why-does-json-import-need-to-set-strip_outer_arraytrue}

Если в JSON-файле несколько записей объединены в массив (например, `[ {...}, {...} ]`), параметр `strip_outer_array:true` нужен, чтобы Doris удалил внешний массив и разбирал данные построчно. В противном случае при загрузке весь массив будет обработан как одна запись.
