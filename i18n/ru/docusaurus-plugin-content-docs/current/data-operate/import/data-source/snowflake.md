---
{
    "title": "Snowflake",
    "language": "ru",
    "description": "Перенос данных из Snowflake в Doris с использованием объектного хранилища в качестве промежуточного звена: экспорт в S3 с помощью COPY INTO, затем импорт в Doris с помощью S3 Load.",
    "keywords": [
        "Миграция из Snowflake в Doris",
        "Импорт данных из Snowflake",
        "Экспорт с помощью COPY INTO",
        "S3 Load",
        "Сопоставление типов данных Snowflake и Doris",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data migration / Snowflake to Doris sync -->

При переносе данных из Snowflake в Apache Doris в качестве промежуточного звена обычно используется объектное хранилище. Весь процесс состоит из двух шагов:

1. Экспортируйте данные в объектное хранилище (например, AWS S3, GCS или Azure Blob) с помощью оператора [COPY INTO](https://docs.snowflake.cn/zh/guides-overview-unloading-data) в Snowflake.
2. Прочитайте данные из объектного хранилища и импортируйте их в Doris с помощью S3 Load. Подробное описание параметров см. в разделе [S3 Load](./amazon-s3.md).

## Подготовка к миграции {#pre-migration-preparation}

<!-- Knowledge type: Pre-deployment check -->

Перед миграцией спланируйте структуру таблиц и стратегию импорта в Doris на основе структуры таблиц Snowflake:

- Выберите подходящую [модель данных](../../../table-design/data-model/intro.mdx) (модель Detail / модель Unique Key / модель Aggregate).
- Разработайте стратегии [партиционирования](../../../table-design/data-partitioning/dynamic-partitioning.md) и [бакетирования](../../../table-design/data-partitioning/data-bucketing.md).
- Спланируйте размер пакетов и степень параллелизма, руководствуясь [рекомендациями по загрузке](../load-best-practices/load-best-practices.md).

## Сопоставление типов данных {#data-type-mapping}

<!-- Knowledge type: Configuration parameters -->

В следующей таблице приведены соответствия типов данных Snowflake и Doris, которые помогут создать подходящие структуры таблиц в Doris:

| Snowflake                                        | Doris          | Примечания                                          |
| ------------------------------------------------ | -------------- | --------------------------------------------------- |
| NUMBER(p, s) / DECIMAL(p, s) / NUMERIC(p, s)     | DECIMAL(p, s)  |                                                     |
| INT / INTEGER                                    | INT            |                                                     |
| TINYINT / BYTEINT                                | TINYINT        |                                                     |
| SMALLINT                                         | SMALLINT       |                                                     |
| BIGINT                                           | BIGINT         |                                                     |
| FLOAT / FLOAT4 / FLOAT8 / DOUBLE / DOUBLE PRECISION / REAL | DOUBLE         |                                                     |
| VARCHAR / STRING / TEXT                          | VARCHAR / STRING | Максимальная длина VARCHAR составляет 65535         |
| CHAR / CHARACTER / NCHAR                         | CHAR           |                                                     |
| BINARY / VARBINARY                               | STRING         |                                                     |
| BOOLEAN                                          | BOOLEAN        |                                                     |
| DATE                                             | DATE           |                                                     |
| DATETIME / TIMESTAMP / TIMESTAMP_NTZ             | DATETIME       | TIMESTAMP — настраиваемый пользователем псевдоним, по умолчанию соответствующий TIMESTAMP_NTZ |
| TIME                                             | STRING         | При экспорте из Snowflake необходимо привести к типу String |
| VARIANT                                          | VARIANT        |                                                     |
| ARRAY                                            | ARRAY\<T\>     |                                                     |
| OBJECT                                           | JSON           |                                                     |
| GEOGRAPHY / GEOMETRY                             | STRING         |                                                     |

## Процесс миграции {#migration-process}

Миграция состоит из трёх этапов: **создание целевой таблицы в Doris -> экспорт данных из Snowflake в объектное хранилище -> импорт в Doris с помощью S3 Load**.

### Шаг 1: создание целевой таблицы в Doris {#step-1-create-the-target-table-in-doris}

<!-- Knowledge type: Procedure -->

Предположим, что в Snowflake уже существуют следующая таблица и данные:

```sql
CREATE OR REPLACE TABLE sales_data (
    order_id      INT PRIMARY KEY,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
CLUSTER BY (order_date);

INSERT INTO sales_data VALUES
(1, 'Alice',   '2025-04-08',  99.99, 'USA'),
(2, 'Bob',     '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09',  75.00, 'UK'),
(4, 'Diana',   '2025-04-10', 200.00, 'Australia');
```

На основе этой структуры создайте в Doris партиционированную таблицу Unique Key. Столбец партиционирования соответствует ключу кластеризации Snowflake; динамическое партиционирование включено с разбиением по дням:

```sql
CREATE TABLE `sales_data` (
    order_id      INT,
    order_date    DATE NOT NULL,
    customer_name VARCHAR(128),
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`, `order_date`)
PARTITION BY RANGE(`order_date`) (
    PARTITION p20250408 VALUES [('2025-04-08'), ('2025-04-09')),
    PARTITION p20250409 VALUES [('2025-04-09'), ('2025-04-10')),
    PARTITION p20250410 VALUES [('2025-04-10'), ('2025-04-11'))
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "5",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "16",
    "replication_num" = "1"
);
```

### Шаг 2: экспорт данных из Snowflake в объектное хранилище {#step-2-export-data-from-snowflake-to-object-storage}

<!-- Knowledge type: Procedure -->

Snowflake поддерживает экспорт данных в несколько сервисов объектного хранения:

- [AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)
- [Google Cloud Storage](https://docs.snowflake.com/en/user-guide/data-unload-gcs)
- [Azure Blob Storage](https://docs.snowflake.com/en/user-guide/data-unload-azure)

**Рекомендуется разбивать экспортируемые данные по столбцу партиционирования Doris**, чтобы затем выполнять импорт пакетами по партициям.

#### 2.1 Экспорт в файлы Parquet с помощью COPY INTO {#21-export-to-parquet-files-with-copy-into}

В следующем примере данные Snowflake экспортируются в AWS S3 в формате Parquet с разбиением по `order_date`:

```sql
CREATE FILE FORMAT my_parquet_format TYPE = parquet;

CREATE OR REPLACE STAGE external_stage
URL='s3://mybucket/sales_data'
CREDENTIALS=(AWS_KEY_ID='<ak>' AWS_SECRET_KEY='<sk>')
FILE_FORMAT = my_parquet_format;

COPY INTO @external_stage FROM sales_data
PARTITION BY (CAST(order_date AS VARCHAR))
HEADER=TRUE;
```

#### 2.2 Просмотр экспортированных файлов в S3 {#22-view-the-exported-files-on-s3}

После завершения экспорта в S3 для каждой партиции создаётся отдельный подкаталог:

![snowflake_s3_out](/images/data-operate/snowflake_s3_out_en.png)

![snowflake_s3_out2](/images/data-operate/snowflake_s3_out2_en.png)

### Шаг 3: импорт в Doris с помощью S3 Load {#step-3-import-into-doris-with-s3-load}

<!-- Knowledge type: Procedure -->

S3 Load — это **асинхронный способ импорта данных**: после запуска Doris самостоятельно получает данные из источника. Поддерживаются объектные хранилища, совместимые с протоколом S3, включая [AWS S3](./amazon-s3.md), [GCS](./google-cloud-storage.md) и [Azure](./azure-storage.md).

S3 Load подходит для сценариев с **большими объёмами данных, требующими фоновой асинхронной обработки**. Для синхронной обработки небольших пакетов данных можно использовать [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous).

:::caution Примечание
Для **файлов Parquet / ORC, содержащих сложные типы (Struct / Array / Map)**, в настоящее время необходимо использовать TVF Load.
:::

#### 3.1 Импорт данных из одной партиции {#31-import-data-from-a-single-partition}

В следующем примере все файлы Parquet из каталога партиции `2025_04_08` в S3 импортируются в таблицу `sales_data` в Doris:

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/sales_data/2025_04_08/*")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.access_key" = "<ak>",
    "s3.secret_key" = "<sk>",
    "s3.region" = "ap-southeast-1"
);
```

#### 3.2 Проверка состояния задания с помощью SHOW LOAD {#32-check-job-status-with-show-load}

Поскольку задания S3 Load отправляются асинхронно, состояние импорта для конкретной метки Label необходимо запрашивать с помощью `SHOW LOAD`:

```yaml
mysql> show load where label = "sales_data_2025_04_08"\G
*************************** 1. row ***************************
        JobId: 17956078
        Label: sales_data_2025_04_08
        State: FINISHED
     Progress: 100.00% (1/1)
         Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
     TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
     ErrorMsg: NULL
   CreateTime: 2025-04-10 17:50:53
 EtlStartTime: 2025-04-10 17:50:54
EtlFinishTime: 2025-04-10 17:50:54
LoadStartTime: 2025-04-10 17:50:54
LoadFinishTime: 2025-04-10 17:50:54
          URL: NULL
   JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All   backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
TransactionId: 766228
 ErrorTablets: {}
         User: root
      Comment:
1 row in set (0.00 sec)
```

#### 3.3 Обработка ошибок при импорте {#33-handle-errors-during-import}

Если заданий импорта несколько, следующим запросом можно сразу получить список неудачных заданий и причины их сбоев:

```sql
mysql> show load where state='CANCELLED' and label like "label_test%"\G
*************************** 1. row ***************************
        JobId: 18312384
        Label: label_test123
        State: CANCELLED
     Progress: 100.00% (3/3)
         Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
     TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
     ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
   CreateTime: 2025-04-15 17:32:59
 EtlStartTime: 2025-04-15 17:33:02
EtlFinishTime: 2025-04-15 17:33:02
LoadStartTime: 2025-04-15 17:33:02
LoadFinishTime: 2025-04-15 17:33:02
          URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
   JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All   backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
TransactionId: 769213
 ErrorTablets: {}
         User: root
      Comment:
```

В примере выше показана **ошибка качества данных** (`ETL_QUALITY_UNSATISFIED`). Чтобы получить подробные сведения об ошибке, необходимо перейти по ссылке из поля `URL`. Например, следующие сообщения показывают, что фактическая длина значений столбца `country` в данных превышает длину, заданную в схеме таблицы:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual   length: 3; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual   length: 6; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual   length: 2; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1;   actual length: 9; . src line [];
```

Если при ошибках качества данных допускается пропуск части некорректных данных, можно задать допустимую долю ошибок в `PROPERTIES` задания S3 Load. Подробнее см. в разделе [Параметры настройки импорта](../../import/import-way/broker-load-manual.md#import-configuration-parameters).

#### 3.4 Пакетный импорт нескольких партиций {#34-batch-import-multiple-partitions}

<!-- Applicable scenario: Large-scale stock data migration -->

При переносе большого объёма накопленных данных рекомендуется **стратегия пакетного импорта**:

- Каждый пакет соответствует одной или небольшому числу партиций в Doris.
- Рекомендуемый размер пакета — **не более 100 ГБ**.
- Такой подход снижает нагрузку на систему и затраты на повторную попытку при сбое импорта.

Можно воспользоваться скриптом [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh), который опрашивает каталоги партиций в S3 и автоматически отправляет задания S3 Load в Doris, обеспечивая пакетный импорт.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ / Troubleshooting -->

### Вопрос 1: задание импорта сообщает об ошибке `ETL_QUALITY_UNSATISFIED`. Как найти причину? {#q1-an-import-job-reports-an-etl_quality_unsatisfied-error-how-can-i-troubleshoot-it}

Это ошибка качества данных. Распространённые причины: длина поля превышает заданную в схеме, типы данных не совпадают или обязательные поля содержат NULL. Порядок диагностики:

1. Просмотрите поле `URL` задания с помощью `SHOW LOAD`.
2. Откройте URL с помощью `curl`, чтобы получить подробный журнал ошибок.
3. Исправьте исходные данные или скорректируйте схему таблицы Doris в соответствии с сообщением об ошибке.
4. Если допускается небольшое количество некорректных данных, задайте допустимую долю ошибок `max_filter_ratio` в `PROPERTIES` задания.

### Вопрос 2: как импортировать файлы Parquet, содержащие сложные типы? {#q2-how-do-i-import-parquet-files-containing-complex-types}

Для файлов Parquet / ORC, содержащих сложные типы, такие как Struct / Array / Map, **S3 Load в настоящее время не поддерживается**. Необходимо использовать [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous).

### Вопрос 3: почему тип TIME в Snowflake нужно преобразовывать в String? {#q3-why-does-the-snowflake-time-type-need-to-be-converted-to-string}

В Doris нет типа, который полностью соответствовал бы типу `TIME` в Snowflake. Поэтому при экспорте из Snowflake с помощью `COPY INTO` необходимо выполнить `CAST` поля `TIME` в тип `STRING`. После импорта в Doris данные хранятся как `STRING`.

### Вопрос 4: как ускорить миграцию больших таблиц? {#q4-how-can-i-speed-up-the-migration-of-large-tables}

- На стороне Snowflake экспортируйте данные с разбиением по столбцу партиционирования Doris, чтобы упростить параллельный импорт.
- На стороне Doris используйте пакетный импорт с размером каждого пакета не более 100 ГБ.
- Используйте скрипт [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) для одновременной отправки нескольких заданий S3 Load.

### Вопрос 5: каким типам соответствуют OBJECT и VARIANT в Snowflake? {#q5-how-do-snowflakes-object-and-variant-types-map}

- `VARIANT` напрямую соответствует типу `VARIANT` в Doris.
- `OBJECT` соответствует типу `JSON` в Doris.

## Связанные документы {#related-documents}

- [S3 Load](./amazon-s3.md)
- [GCS Load](./google-cloud-storage.md)
- [Azure Load](./azure-storage.md)
- [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous)
- [Рекомендации по загрузке](../load-best-practices/load-best-practices.md)
- [Параметры настройки импорта](../../import/import-way/broker-load-manual.md#import-configuration-parameters)
