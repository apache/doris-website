---
{
    "title": "Анализ файлов в S3/HDFS",
    "language": "ru",
    "description": "Узнайте, как использовать Table Value Function (TVF) в Apache Doris для выполнения запросов непосредственно к файлам Parquet, ORC, CSV и JSON в системах хранения, таких как S3 и HDFS, и анализа этих файлов. Поддерживаются автоматическое определение схемы, выбор нескольких файлов по шаблону, импорт данных и экспорт результатов запросов в файлы."
}
---

Благодаря поддержке Table Value Function (TVF) Doris может выполнять запросы непосредственно к файлам в объектном хранилище или HDFS и анализировать их как таблицы без предварительного импорта данных. Также поддерживается автоматическое определение типов столбцов. Начиная с версии 4.1.0 поддерживается и экспорт результатов запросов в файловые системы с помощью синтаксиса `INSERT INTO` для TVF.

## Поддерживаемые системы хранения {#supported-storage-systems}

Doris предоставляет следующие TVF для доступа к различным системам хранения:

| TVF | Поддерживаемое хранилище | Описание |
|-----|-------------------|-------------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | Объектное хранилище, совместимое с S3 | Поддерживает AWS S3, Alibaba Cloud OSS, Tencent Cloud COS и другие сервисы |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | Поддерживает Hadoop Distributed File System |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | Поддерживает доступ к файлам по HTTP-адресам (начиная с версии 4.0.2) |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/Local | Универсальная табличная функция, поддерживающая несколько типов хранилищ (начиная с версии 3.1.0) |

## Поддерживаемые форматы файлов {#supported-file-formats}

TVF поддерживает чтение и анализ файлов следующих форматов. По ссылкам доступны подробные сведения и параметры для каждого формата:

- [Parquet](./file-formats/parquet.md)
- [ORC](./file-formats/orc.md)
- [Текст / CSV / JSON](./file-formats/text.md)
- [Lance](./file-formats/lance.md) (поддерживается начиная с версии 4.2)

## Сценарии использования {#use-cases}

### Сценарий 1: запросы непосредственно к файлам и их анализ {#scenario-1-direct-query-and-analysis-of-files}

TVF хорошо подходит для анализа файлов непосредственно в системах хранения без предварительного импорта данных в Doris.

В следующем примере выполняется запрос к файлу Parquet в объектном хранилище с помощью S3 TVF:

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
)
ORDER BY p_partkey LIMIT 5;
```

Пример результата запроса:

```
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

По сути, TVF представляет собой таблицу и может использоваться в любом месте SQL-оператора, где допустима таблица, например:

- В предложении `FROM`
- В предложении `WITH` выражения CTE
- В операциях `JOIN`

### Сценарий 2: создание представлений для упрощения доступа {#scenario-2-creating-views-to-simplify-access}

С помощью оператора `CREATE VIEW` можно создавать логические представления для TVF, чтобы не указывать данные подключения каждый раз и управлять правами доступа:

```sql
-- Create a view based on TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);

-- View the structure of the view
DESC tvf_view;

-- Query the view
SELECT * FROM tvf_view;

-- Grant access to other users
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```

### Сценарий 3: импорт данных в Doris {#scenario-3-importing-data-into-doris}

В сочетании с синтаксисом `INSERT INTO SELECT` TVF позволяет импортировать данные из файлов в таблицы Doris:

```sql
-- 1. Create the target table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Import data via TVF
INSERT INTO test_table (id, name, age)
SELECT cast(id as INT) as id, name, cast(age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

### Сценарий 4: экспорт результатов запросов в файлы (начиная с версии 4.1.0) {#export-query-results}

:::tip
Эта возможность поддерживается начиная с Apache Doris версии 4.1.0 и в настоящее время является экспериментальной.
:::

С помощью синтаксиса `INSERT INTO` для TVF можно экспортировать результаты запросов непосредственно в файлы в локальных файловых системах, HDFS или объектных хранилищах, совместимых с S3. Поддерживаются форматы CSV, Parquet и ORC.

**Синтаксис:**

```sql
INSERT INTO tvf_name(
    "file_path" = "<file_path_prefix>",
    "format" = "<file_format>",
    ... -- other connection properties and format options
)
[WITH LABEL label_name]
SELECT ... ;
```

Здесь `tvf_name` может принимать следующие значения:

| Имя TVF | Целевое хранилище | Описание |
|----------|---------------|-------------|
| `local` | Локальная файловая система | Экспорт на локальный диск узла BE; необходимо указать `backend_id` |
| `hdfs` | HDFS | Экспорт в Hadoop Distributed File System |
| `s3` | Объектное хранилище, совместимое с S3 | Экспорт в AWS S3, Alibaba Cloud OSS, Tencent Cloud COS и другие сервисы |

**Общие свойства:**

| Свойство | Обязательное | Описание |
|----------|----------|-------------|
| `file_path` | Да | Префикс пути выходного файла. Имена создаваемых файлов имеют формат `{prefix}{query_id}_{idx}.{ext}` |
| `format` | Нет | Формат выходного файла; поддерживаются `csv` (по умолчанию), `parquet`, `orc` |
| `max_file_size` | Нет | Максимальный размер одного файла (в байтах). При превышении автоматически создаётся новый файл |
| `delete_existing_files` | Нет | Определяет, нужно ли удалять существующие файлы в целевом каталоге перед записью; значение по умолчанию: `false` |

**Дополнительные свойства для формата CSV:**

| Свойство | Описание |
|----------|-------------|
| `column_separator` | Разделитель столбцов; по умолчанию: `,` |
| `line_delimiter` | Разделитель строк; по умолчанию: `\n` |
| `compress_type` | Формат сжатия; поддерживаются `gz`, `zstd`, `lz4`, `snappy` |

**Пример 1: экспорт CSV в HDFS**

```sql
INSERT INTO hdfs(
    "file_path" = "/tmp/export/csv_data_",
    "format" = "csv",
    "column_separator" = ",",
    "hadoop.username" = "doris",
    "fs.defaultFS" = "hdfs://namenode:8020",
    "delete_existing_files" = "true"
)
SELECT * FROM my_table ORDER BY id;
```

**Пример 2: экспорт Parquet в S3**

```sql
INSERT INTO s3(
    "uri" = "s3://bucket/export/parquet_data_",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "format" = "parquet"
)
SELECT * FROM my_table WHERE dt = '2024-01-01';
```

**Пример 3: экспорт ORC в S3**

```sql
INSERT INTO s3(
    "uri" = "s3://bucket/export/orc_data_",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "format" = "orc",
    "delete_existing_files" = "true"
)
SELECT c_int, c_varchar, c_string FROM my_table WHERE c_int IS NOT NULL ORDER BY c_int;
```

**Пример 4: экспорт CSV на локальный узел BE**

```sql
INSERT INTO local(
    "file_path" = "/tmp/export/local_csv_",
    "backend_id" = "10001",
    "format" = "csv"
)
SELECT * FROM my_table ORDER BY id;
```

:::note
- `file_path` задаёт префикс имени файла. Имена создаваемых файлов имеют формат `{prefix}{query_id}_{idx}.{ext}`, где `idx` начинается с 0 и увеличивается.
- При использовании TVF `local` необходимо указать узел BE для записи файлов с помощью `backend_id`.
- При использовании `delete_existing_files` система перед записью удаляет все файлы в каталоге, указанном в `file_path`. Используйте это свойство с осторожностью.
- Для выполнения `INSERT INTO TVF` требуются права ADMIN или LOAD.
- Для S3 TVF свойству `file_path` соответствует свойство `uri`.
:::

## Основные возможности {#core-features}

### Выбор нескольких файлов по шаблону {#multi-file-matching}

Путь к файлу (URI) поддерживает подстановочные символы и шаблоны диапазонов для выбора нескольких файлов:

| Шаблон | Пример | Результат сопоставления |
|---------|---------|--------------|
| `*` | `file_*` | Все файлы, имена которых начинаются с `file_` |
| `{n..m}` | `file_{1..3}` | `file_1`, `file_2`, `file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`, `file_b` |

### Использование Resource для упрощения настройки {#using-resource-to-simplify-configuration}

TVF поддерживает ссылки на заранее созданные объекты Resource для S3 или HDFS через свойство `resource`. Это позволяет не указывать данные подключения в каждом запросе.

**1. Создание Resource**

```sql
CREATE RESOURCE "s3_resource"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.bucket" = "bucket"
);
```

**2. Использование Resource в TVF**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```

:::tip
- Свойства Resource используются как значения по умолчанию; свойства, указанные в TVF, переопределяют одноимённые свойства Resource
- Использование объектов Resource позволяет централизованно управлять данными подключения, упрощая обслуживание и контроль доступа
:::

### Автоматическое определение схемы {#automatic-schema-inference}

С помощью синтаксиса `DESC FUNCTION` можно просмотреть автоматически определённую схему TVF:

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true"
);
```

```
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

**Правила определения схемы:**

| Формат файла | Способ определения |
|-------------|------------------|
| Parquet, ORC | Схема автоматически извлекается из метаданных файла |
| CSV, JSON | Для определения схемы разбирается первая строка данных; тип столбцов по умолчанию: `string` |
| Выбор нескольких файлов по шаблону | Используется схема первого файла |

### Указание типов столбцов вручную (CSV/JSON) {#manually-specifying-column-types-csvjson}

Для форматов CSV и JSON можно вручную задать имена и типы столбцов с помощью свойства `csv_schema` в формате `name1:type1;name2:type2;...`:

```sql
S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.csv',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'format' = 'csv',
    'column_separator' = '|',
    'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
)
```

**Поддерживаемые типы столбцов:**

| Целочисленные типы | Типы с плавающей точкой | Другие типы |
|---------------|----------------------|-------------|
| tinyint | float | decimal(p,s) |
| smallint | double | date |
| int | | datetime |
| bigint | | char |
| largeint | | varchar |
| | | string |
| | | boolean |
| | | uuid |

Для столбцов UUID укажите схему, например `"csv_schema" = "id:int;u:uuid"`. В качестве значений принимается текстовое шестнадцатеричное представление UUID в каноническом или компактном формате; при определении схемы CSV/JSON тип UUID автоматически не распознаётся. Правила ввода приведены в разделе [Тип UUID](../sql-manual/basic-element/sql-data-types/uuid.md).

:::note
- Если тип столбца не соответствует данным (например, файл содержит строку, а указан тип `int`), столбец возвращает `null`
- Если количество столбцов не совпадает (например, в файле 4 столбца, а указано 5), отсутствующие столбцы возвращают `null`
:::

## Примечания {#notes}

| Сценарий | Поведение |
|----------|----------|
| Ни один файл не соответствует `uri` или все файлы пусты | TVF возвращает пустой набор результатов; при просмотре схемы с помощью `DESC FUNCTION` отображается столбец-заполнитель `__dummy_col` |
| Первая строка файла CSV пуста (сам файл не пуст) | Сообщение об ошибке: `The first line is empty, can not parse column numbers` |
