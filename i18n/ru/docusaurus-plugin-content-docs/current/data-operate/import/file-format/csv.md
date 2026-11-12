---
{
    "title": "CSV",
    "language": "ru",
    "description": "Полное руководство по импорту файлов CSV в Apache Doris: поддерживаются пользовательские разделители, символы обрамления, символы экранирования и форматы сжатия; применимо к различным способам импорта, включая Stream Load и Broker Load.",
    "keywords": [
        "Doris CSV import",
        "CSV format parameters",
        "column_separator",
        "line_delimiter",
        "enclose",
        "Stream Load CSV",
        "Broker Load CSV",
        "Routine Load CSV",
        "csv_with_names",
        "compress_type"
    ]
}
---

<!-- Knowledge type: Operation guide + Parameter reference -->
<!-- Applicable scenario: Data import / File format adaptation -->

В этом документе описано, как импортировать файлы данных в формате CSV в Apache Doris. Doris поддерживает гибкую настройку формата CSV, включая пользовательские разделители строк и столбцов, символы обрамления полей, символы экранирования, количество пропускаемых строк и форматы сжатия. Кроме того, доступны различные способы импорта для разных сценариев, таких как пакетная загрузка, потоковая загрузка в реальном времени и федеративные запросы.

## Быстрая навигация {#quick-navigation}

Перед началом работы выберите подходящий способ импорта с учётом источника данных и требований к оперативности их поступления, затем обратитесь к параметрам и примерам в соответствующем разделе:

- Небольшие локальные файлы, отправка по HTTP: используйте [Stream Load](../import-way/stream-load-manual)
- Большие пакеты файлов в объектном хранилище / HDFS: используйте [Broker Load](../import-way/broker-load-manual)
- Потоки данных из Kafka в реальном времени: используйте [Routine Load](../import-way/routine-load-manual)
- Локальные файлы через клиент MySQL: используйте [MySQL Load](../import-way/mysql-load-manual)
- Выполнение запросов к файлам во внешних хранилищах или их загрузка напрямую через SQL: используйте [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) или [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## Поддерживаемые способы импорта {#supported-import-methods}

Doris предоставляет следующие способы импорта данных в формате CSV:

| Способ импорта | Сценарий использования | Документация |
|----------|----------|------|
| Stream Load | Отправка локальных файлов или данных из программы по HTTP | [Stream Load](../import-way/stream-load-manual) |
| Broker Load | Пакетный импорт из удалённых хранилищ, таких как S3 / HDFS | [Broker Load](../import-way/broker-load-manual) |
| Routine Load | Непрерывная подписка на данные из Kafka и их импорт | [Routine Load](../import-way/routine-load-manual) |
| MySQL Load | Импорт локальных файлов по протоколу MySQL | [MySQL Load](../import-way/mysql-load-manual) |
| INSERT INTO FROM S3 TVF | Прямое чтение файлов из S3 и вставка данных в таблицу | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | Прямое чтение файлов из HDFS и вставка данных в таблицу | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## Параметры формата CSV {#csv-format-parameters}

<!-- Knowledge type: Configuration parameters -->

### Матрица поддержки параметров для разных способов импорта {#parameter-support-matrix-across-import-methods}

В следующей таблице приведены сведения о поддержке параметров формата CSV и соответствующем синтаксисе для разных способов импорта:

| Параметр | По умолчанию | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|------|--------|-------------|-------------|--------------|------------|-----|
| Разделитель строк | `\n` | line_delimiter | LINES TERMINATED BY | Не поддерживается | LINES TERMINATED BY | line_delimiter |
| Разделитель столбцов | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| Символ обрамления | Не задан | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| Символ экранирования | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| Пропуск строк | 0 | skip_lines | PROPERTIES.skip_lines | Не поддерживается | IGNORE LINES | skip_lines |
| Удаление двойных кавычек | false | trim_double_quotes | Не поддерживается | PROPERTIES.trim_double_quotes | Не поддерживается | trim_double_quotes |
| Формат сжатия | plain | compress_type | PROPERTIES.compress_type | Не поддерживается | Не поддерживается | compress_type |

:::tip Синтаксис параметров для каждого способа импорта
1. **Stream Load**: параметры задаются напрямую через заголовки HTTP, например: `-H "line_delimiter:\n"`
2. **Broker Load**: параметры задаются в операторах SQL:
    - Разделители задаются с помощью `COLUMNS TERMINATED BY` и `LINES TERMINATED BY`
    - Остальные параметры задаются через `PROPERTIES`, например: `PROPERTIES("compress_type"="gz")`
3. **Routine Load**: параметры задаются в операторах SQL:
    - Разделители задаются с помощью `COLUMNS TERMINATED BY`
    - Остальные параметры задаются через `PROPERTIES`, например: `PROPERTIES("enclose"="\"")`
4. **MySQL Load**: параметры задаются в операторах SQL:
    - Разделители задаются с помощью `LINES TERMINATED BY` и `COLUMNS TERMINATED BY`
    - Остальные параметры задаются через `PROPERTIES`, например: `PROPERTIES("escape"="\\")`
5. **TVF**: параметры задаются в операторе TVF, например: `S3("line_delimiter"="\n")`
:::

### Подробное описание параметров {#parameter-details}

#### Разделитель строк (line_delimiter) {#line-delimiter-line_delimiter}

- **Назначение**: задаёт символ перевода строки в импортируемом файле
- **По умолчанию**: `\n`
- **Особенности**: в качестве разделителя строк поддерживается сочетание нескольких символов

**Типичные сценарии**:

- Файлы Linux/Unix:

    ```text
    Data file:
    Zhang San, 25\n
    Li Si, 30\n

    Parameter setting:
    line_delimiter: \n (default value, can be omitted)
    ```

- Файлы Windows:

    ```text
    Data file:
    Zhang San, 25\r\n
    Li Si, 30\r\n

    Parameter setting:
    line_delimiter: \r\n
    ```

- Файлы, созданные специализированными программами:

    ```text
    Data file:
    Zhang San, 25\r
    Li Si, 30\r

    Parameter setting:
    line_delimiter: \r
    ```

- Пользовательский разделитель из нескольких символов:

    ```text
    Data file:
    Zhang San, 25||
    Li Si, 30||

    Parameter setting:
    line_delimiter: ||
    ```

#### Разделитель столбцов (column_separator) {#column-separator-column_separator}

- **Назначение**: задаёт разделитель столбцов в импортируемом файле
- **По умолчанию**: `\t` (табуляция)
- **Особенности**:
    - Поддерживаются как видимые, так и невидимые символы
    - Поддерживаются сочетания нескольких символов
    - Невидимые символы необходимо задавать в шестнадцатеричном виде с префиксом `\x`
- **Особенности обработки в протоколе MySQL**:
    - Для невидимых символов требуется дополнительная обратная косая черта
    - Например, разделитель `\x01`, используемый в Hive, в Broker Load нужно записывать как `\\x01`

**Типичные сценарии**:

- Распространённые видимые символы:

    ```text
    Data file:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    column_separator: ,
    ```

- Табуляция (по умолчанию):

    ```text
    Data file:
    Zhang San    25    Beijing
    Li Si    30    Shanghai

    Parameter setting:
    column_separator: \t (default value, can be omitted)
    ```

- Файлы Hive (Stream Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    column_separator: \x01
    ```

- Файлы Hive (Broker Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    PROPERTIES("column_separator"="\\x01")
    ```

- Разделитель из нескольких символов:

    ```text
    Data file:
    Zhang San||25||Beijing
    Li Si||30||Shanghai

    Parameter setting:
    column_separator: ||
    ```

#### Символ обрамления (enclose) {#enclose-enclose}

- **Назначение**: предотвращает неверный разбор полей, содержащих специальные символы
- **Ограничение**: поддерживаются только однобайтовые символы
- **Распространённые символы**:
    - Одинарная кавычка: `'`
    - Двойная кавычка: `"`

**Типичные сценарии**:

- Поле содержит разделитель столбцов:

    ```text
    Data: a,'b,c',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c] [d]
    ```

- Поле содержит разделитель строк:

    ```text
    Data: a,'b\nc',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b\nc] [d]
    ```

- Поле содержит и разделитель столбцов, и разделитель строк:

    ```text
    Data: a,'b,c\nd,e',f
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c\nd,e] [f]
    ```

#### Символ экранирования (escape) {#escape-escape}

- **Назначение**: экранирует в поле символы, совпадающие с символом обрамления
- **Ограничение**: поддерживаются только однобайтовые символы. По умолчанию используется `\`

**Типичные сценарии**:

- Поле содержит символ обрамления:

    ```text
    Data: a,'b,\'c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b,'c] [d]
    ```

- Поле содержит несколько символов обрамления:

    ```text
    Data: a,"b,\"c\"d",e
    Column separator: ,
    Enclose: "
    Escape: \
    Parsing result: 3 fields [a] [b,"c"d] [e]
    ```

- Поле содержит сам символ экранирования:

    ```text
    Data: a,'b\\c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b\c] [d]
    ```

#### Пропуск строк (skip_lines) {#skip-lines-skip_lines}

- **Назначение**: пропускает первые N строк файла CSV
- **Тип**: целое число
- **По умолчанию**: 0
- **Особые замечания**:
    - Если `format` имеет значение `csv_with_names`, система автоматически пропускает первую строку (имена столбцов) и игнорирует параметр `skip_lines`
    - Если `format` имеет значение `csv_with_names_and_types`, система автоматически пропускает первые две строки (имена и типы столбцов) и игнорирует параметр `skip_lines`

**Типичные сценарии**:

- Пропуск строки заголовка:

    ```text
    Data file:
    Name, Age, City
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 1
    Result: skip the header line and import the subsequent data
    ```

- Пропуск строк комментариев:

    ```text
    Data file:
    # User information table
    # Created at: 2024-01-01
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 2
    Result: skip the comment lines and import the subsequent data
    ```

- Использование формата csv_with_names:

    ```text
    Data file:
    name,age,city
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names
    Result: the system automatically skips the first line of column names
    ```

- Использование формата csv_with_names_and_types:

    ```text
    Data file:
    name,age,city
    string,int,string
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names_and_types
    Result: the system automatically skips the first two lines of column names and types
    ```

#### Удаление двойных кавычек (trim_double_quotes) {#trim-double-quotes-trim_double_quotes}

- **Назначение**: удаляет внешние двойные кавычки из каждого поля файла CSV
- **Тип**: логический
- **По умолчанию**: false

**Типичные сценарии**:

- Удаление двойных кавычек:

    ```text
    Data file:
    "Zhang San","25","Beijing"
    "Li Si","30","Shanghai"

    Parameter setting:
    trim_double_quotes: true
    Result:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai
    ```

#### Формат сжатия (compress_type) {#compression-format-compress_type}

- **Назначение**: задаёт формат сжатия импортируемого файла
- **Тип**: строка, без учёта регистра
- **По умолчанию**: plain
- **Поддерживаемые форматы сжатия**:

    | Значение | Описание |
    |------|------|
    | plain | Без сжатия (по умолчанию) |
    | bz2 | Сжатие BZIP2 |
    | deflate | Сжатие DEFLATE |
    | gz | Сжатие GZIP |
    | lz4 | Сжатие в формате LZ4 Frame |
    | lz4_block | Сжатие в формате LZ4 Block |
    | lzo | Сжатие LZO |
    | lzop | Сжатие LZOP |
    | snappy_block | Сжатие в формате SNAPPY Block |

- **Примечания**:
    - tar является форматом упаковки файлов, а не форматом сжатия, поэтому файлы `.tar` не поддерживаются
    - Чтобы использовать файл, упакованный в tar, сначала распакуйте его, а затем выполните импорт

## Примеры {#examples}

<!-- Knowledge type: Operation steps -->

В этом разделе показаны три наиболее распространённые операции для каждого способа импорта: задание разделителей, обработка данных в кавычках и импорт сжатых файлов.

### Stream Load {#stream-load}

```shell
# Specify delimiters
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "line_delimiter:\n" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Handle quoted data
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "enclose:\"" \
    -H "escape:\\" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Import a compressed file
curl --location-trusted -u root: \
    -H "compress_type:gz" \
    -T example.csv.gz \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load
```

### Broker Load {#broker-load}

```sql
-- Specify delimiters
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
)
WITH S3
(
    ...
);

-- Handle quoted data
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    PROPERTIES
    (
        "enclose" = "\"",
        "escape" = "\\"
    )
)
WITH S3
(
    ...
);

-- Import a compressed file
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv.gz")
    INTO TABLE test_table
    PROPERTIES
    (
        "compress_type" = "gz"
    )
)
WITH S3
(
    ...
);
```

### Routine Load {#routine-load}

```sql
-- Specify delimiters
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
FROM KAFKA
(
     ...
);

-- Handle quoted data
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
)
FROM KAFKA
(
    ...
);
```

### MySQL Load {#mysql-load}

```sql
-- Specify delimiters
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';

-- Handle quoted data
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
);

-- Skip the header
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

### TVF {#tvf}

```sql
-- Specify delimiters
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "line_delimiter" = "\n"
    ...
);

-- Handle quoted data
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "enclose" = "\"",
    "escape" = "\\"
    ...
);

-- Import a compressed file
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv.gz",
    "format" = "csv",
    "compress_type" = "gz"
    ...
);
```

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

**Вопрос 1: Почему разделитель столбцов `\x01`, используемый в Hive по умолчанию, не работает в Broker Load?**

В протоколе MySQL для невидимых символов требуется дополнительная обратная косая черта, поэтому разделитель необходимо записывать как `\\x01`, например `PROPERTIES("column_separator"="\\x01")`. При задании через заголовок HTTP в Stream Load достаточно `\x01`.

**Вопрос 2: Поддерживает ли Routine Load пользовательский разделитель строк?**

Нет. Каждое сообщение, которое Routine Load получает из Kafka, само по себе соответствует одной строке, поэтому параметр `line_delimiter` не требуется и не поддерживается.

**Вопрос 3: Первая строка файла CSV содержит заголовок. Как пропустить её при импорте?**

- Stream Load / Broker Load / TVF: используйте `skip_lines=1`
- MySQL Load: используйте `IGNORE 1 LINES`
- Если заголовок файла также соответствует соглашению `name1,name2,...`, задайте для `format` значение `csv_with_names`, и система автоматически пропустит первую строку. Задайте значение `csv_with_names_and_types`, чтобы автоматически пропустить первые две строки (имена и типы столбцов)

**Вопрос 4: Можно ли напрямую импортировать файл `.tar` или `.tar.gz`?**

Нет. tar является форматом упаковки, а не форматом сжатия. Doris поддерживает только форматы сжатия, перечисленные в описании `compress_type`. Сначала распакуйте файлы `.tar` или `.tar.gz`, а затем выполните импорт.

**Вопрос 5: Поле содержит и разделитель столбцов, и перевод строки. Как его обработать?**

Задайте `enclose` для этого поля. Например, при использовании одинарных кавычек в качестве символа обрамления строка `a,'b,c\nd,e',f` корректно разбирается на 3 поля `[a]`, `[b,c\nd,e]`, `[f]`, если разделитель столбцов задан как `,`, а символ обрамления как `'`. Если поле также содержит сам символ обрамления, используйте этот параметр вместе с `escape`.

**Вопрос 6: Как удалить внешние двойные кавычки при импорте полей, заключённых в двойные кавычки?**

Задайте для `trim_double_quotes` значение `true`, и Doris автоматически удалит внешние двойные кавычки из каждого поля после разбора. Этот параметр поддерживается в Stream Load, Routine Load и TVF, но не поддерживается в Broker Load и MySQL Load.
