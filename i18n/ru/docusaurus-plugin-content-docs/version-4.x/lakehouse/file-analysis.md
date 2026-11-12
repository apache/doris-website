---
{
    "title": "Анализ файлов в S3/HDFS",
    "language": "ru",
    "description": "Узнайте, как с помощью Table Value Function (TVF) в Apache Doris выполнять запросы к файлам Parquet, ORC, CSV и JSON в таких системах хранения, как S3 и HDFS, и анализировать их напрямую, с поддержкой автоматического определения схемы, выбора нескольких файлов по шаблону, импорта данных и экспорта результатов запросов в файлы."
}
---

Благодаря механизму Table Value Function (TVF) Doris может выполнять запросы к файлам в объектном хранилище или HDFS и анализировать их как таблицы без предварительного импорта данных, а также автоматически определять типы столбцов. Начиная с версии 4.1.0, поддерживается и экспорт результатов запросов в файловые системы с помощью синтаксиса `INSERT INTO` для TVF.

## Поддерживаемые системы хранения {#supported-storage-systems}

Doris предоставляет следующие TVF для доступа к различным системам хранения:

| TVF | Поддерживаемое хранилище | Описание |
|-----|-------------------|-------------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | Объектное хранилище, совместимое с S3 | Поддерживает AWS S3, Alibaba Cloud OSS, Tencent Cloud COS и другие хранилища. |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | Поддерживает Hadoop Distributed File System |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | Поддерживает доступ к файлам по HTTP-адресам (начиная с версии 4.0.2) |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/локальная файловая система | Универсальная табличная функция, поддерживающая несколько типов хранилищ (начиная с версии 3.1.0) |

## Поддерживаемые форматы файлов {#supported-file-formats}

TVF поддерживает чтение и анализ файлов следующих форматов. Подробные сведения и параметры для каждого формата доступны по ссылкам:

- [Parquet](./file-formats/parquet.md)
- [ORC](./file-formats/orc.md)
- [Текст / CSV / JSON](./file-formats/text.md)
- [Lance](./file-formats/lance.md) (поддерживается начиная с версии 4.2)

## Сценарии использования {#use-cases}

### Сценарий 1: прямые запросы к файлам и их анализ {#scenario-1-direct-query-and-analysis-of-files}

TVF отлично подходит для анализа файлов непосредственно в системах хранения без предварительного импорта данных в Doris.

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

По сути, TVF представляет собой таблицу и может использоваться в SQL-операторах везде, где допустима «таблица», например:

- В предложении `FROM`
- В предложении `WITH` в CTE
- В операторах `JOIN`

### Сценарий 2: создание представлений для упрощения доступа {#scenario-2-creating-views-to-simplify-access}

Для TVF можно создавать логические представления с помощью оператора `CREATE VIEW`, чтобы не указывать данные подключения повторно и управлять правами доступа:

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

Используя TVF вместе с синтаксисом `INSERT INTO SELECT`, можно импортировать данные из файлов в таблицы Doris:

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

С помощью синтаксиса `INSERT INTO` для TVF можно напрямую экспортировать результаты запросов в виде файлов в локальные файловые системы, HDFS или объектное хранилище, совместимое с S3. Поддерживаются форматы CSV, Parquet и ORC.

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

В качестве `tvf_name` можно указать:

| Имя TVF | Целевое хранилище | Описание |
|----------|---------------|-------------|
| `local` | Локальная файловая система | Экспорт на локальный диск узла BE; требуется указать `backend_id` |
| `hdfs` | HDFS | Экспорт в Hadoop Distributed File System |
| `s3` | Объектное хранилище, совместимое с S3 | Экспорт в AWS S3, Alibaba Cloud OSS, Tencent Cloud COS и другие хранилища. |

**Общие свойства:**

| Свойство | Обязательное | Описание |
|----------|----------|-------------|
| `file_path` | Да | Префикс пути выходного файла. Имя фактически создаваемого файла имеет формат `{prefix}{query_id}_{idx}.{ext}` |
| `format` | Нет | Формат выходного файла. Поддерживаются `csv` (по умолчанию), `parquet`, `orc` |
| `max_file_size` | Нет | Максимальный размер одного файла (в байтах). При превышении автоматически создаётся новый файл |
| `delete_existing_files` | Нет | Удалять ли существующие файлы в целевом каталоге перед записью; по умолчанию `false` |

**Дополнительные свойства для формата CSV:**

| Свойство | Описание |
|----------|-------------|
| `column_separator` | Разделитель столбцов; по умолчанию `,` |
| `line_delimiter` | Разделитель строк; по умолчанию `\n` |
| `compress_type` | Формат сжатия. Поддерживаются `gz`, `zstd`, `lz4`, `snappy` |

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
- `file_path` задаёт префикс имени файла. Имя фактически создаваемого файла имеет формат `{prefix}{query_id}_{idx}.{ext}`, где `idx` начинается с 0 и увеличивается.
- При использовании TVF `local` необходимо указать узел BE, на который будут записываться файлы, с помощью `backend_id`.
- При использовании `delete_existing_files` система перед записью удалит все файлы в каталоге, в котором находится `file_path`. Используйте с осторожностью.
- Для выполнения `INSERT INTO TVF` требуются права ADMIN или LOAD.
- Для S3 TVF свойство `file_path` соответствует свойству `uri`.
:::

## Основные возможности {#core-features}

### Выбор нескольких файлов по шаблону {#multi-file-matching}

Путь к файлу (URI) поддерживает подстановочные знаки и шаблоны диапазонов для выбора нескольких файлов:

| Шаблон | Пример | Результат сопоставления |
|---------|---------|--------------|
| `*` | `file_*` | Все файлы, имена которых начинаются с `file_` |
| `{n..m}` | `file_{1..3}` | `file_1`, `file_2`, `file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`, `file_b` |

### Использование Resource для упрощения конфигурации {#using-resource-to-simplify-configuration}

TVF поддерживает ссылки на заранее созданные объекты Resource для S3 или HDFS через свойство `resource`, что позволяет не указывать данные подключения повторно в каждом запросе.

**1. Создайте Resource**

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

**2. Используйте Resource в TVF**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```

:::tip
- Свойства Resource используются как значения по умолчанию; свойства, указанные в TVF, переопределяют одноимённые свойства Resource
- Использование объектов Resource позволяет централизованно управлять данными подключения, упрощая обслуживание и контроль прав доступа
:::

### Автоматическое определение схемы {#automatic-schema-inference}

Просмотреть автоматически определённую схему TVF можно с помощью синтаксиса `DESC FUNCTION`:

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
| CSV, JSON | Для определения схемы разбирается первая строка данных; тип столбцов по умолчанию — `string` |
| Выбор нескольких файлов по шаблону | Используется схема первого файла |

### Ручное указание типов столбцов (CSV/JSON) {#manually-specifying-column-types-csvjson}

Для форматов CSV и JSON можно вручную указать имена и типы столбцов с помощью свойства `csv_schema` в формате `name1:type1;name2:type2;...`:

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

:::note
- Если тип столбца не соответствует данным (например, файл содержит строку, а указан `int`), столбец возвращает `null`
- Если количество столбцов не совпадает (например, в файле 4 столбца, а указано 5), отсутствующие столбцы возвращают `null`
:::

## Примечания {#notes}

| Сценарий | Поведение |
|----------|----------|
| `uri` не соответствует ни одному файлу или все файлы пусты | TVF возвращает пустой набор результатов; при просмотре схемы с помощью `DESC FUNCTION` отображается столбец-заполнитель `__dummy_col` |
| Первая строка файла CSV пуста (сам файл не пуст) | Сообщение об ошибке: `The first line is empty, can not parse column numbers` |
