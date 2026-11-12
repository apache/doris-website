---
{
    "title": "Azure Storage",
    "language": "ru",
    "description": "Как импортировать данные из Azure Storage в Apache Doris: асинхронный импорт через S3 Load или синхронный импорт через TVF, с подробными инструкциями и примерами.",
    "keywords": [
        "Azure Storage import",
        "Doris Azure Blob",
        "S3 Load Azure",
        "TVF Azure",
        "Doris data import",
        "s3_client_http_scheme",
        "Azure Blob import Doris"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Importing data from Azure Storage into Apache Doris -->

Apache Doris поддерживает импорт файлов из Azure Storage (Azure Blob Storage). В этом документе описаны два распространённых способа импорта. Выберите подходящий вариант с учётом объёма данных и требований к оперативности их загрузки.

## Выбор способа {#method-selection}

В следующей таблице приведены основные различия между двумя способами импорта, которые помогут быстро выбрать подходящий вариант:

| Способ импорта | Режим выполнения | Сценарий применения | Справочный документ |
|----------|----------|----------|----------|
| S3 Load | Асинхронный | Импорт больших объёмов данных, требующий фонового выполнения по расписанию | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| TVF (Table-Valued Function) | Синхронный | Разовые запросы, импорт небольших пакетов данных, быстрая проверка |  |

## Предварительные требования {#prerequisites}

Перед импортом данных из Azure Storage любым из этих способов проверьте следующие настройки:

- **Передача по HTTPS**: по умолчанию Azure Storage требует передачи данных по HTTPS (этому соответствует настройка учётной записи хранилища `Secure transfer required: Enabled`). Необходимо задать `s3_client_http_scheme = https` в файле Doris `be.conf`, иначе доступ к хранилищу будет работать некорректно.
- **Регион можно не указывать**: в свойствах совместимого с Azure протокола S3 параметр `s3.region` можно опустить.
- **Учётные данные для доступа**: подготовьте Access Key (AK) и Secret Key (SK) учётной записи Azure Storage.
- **Формат Endpoint**: используйте адрес Endpoint вида `<StorageAccount>.blob.core.windows.net`.

:::caution Внимание
Если HTTPS не включён в конфигурации BE, импорт завершится ошибкой из-за несовпадения протоколов. Выполните указанные выше настройки перед запуском импорта.
:::

## Способ 1: импорт с помощью S3 Load (асинхронный) {#method-1-import-using-s3-load-asynchronous}

S3 Load — это способ асинхронного пакетного импорта, подходящий для загрузки больших объёмов данных из Azure Storage в Doris. Ниже приведена полная последовательность действий.

### Шаг 1: подготовьте данные {#step-1-prepare-data}

Создайте в Azure Storage CSV-файл `s3load_example.csv` со следующим содержимым:

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### Шаг 2: создайте таблицу в Doris {#step-2-create-a-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: импортируйте данные с помощью S3 Load {#step-3-import-data-using-s3-load}

Выполните следующий SQL, чтобы отправить задачу S3 Load на выполнение:

```sql
LOAD LABEL s3_load_2022_04_01
(
    DATA INFILE("s3://your_bucket_name/s3load_example.csv")
    INTO TABLE test_s3load
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
WITH S3
(
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Описание основных параметров:

| Параметр | Описание |
|------|------|
| `provider` | Необходимо задать значение `AZURE`, чтобы указать поставщика объектного хранилища |
| `s3.endpoint` | Адрес службы Azure Blob в формате `<StorageAccount>.blob.core.windows.net` |
| `s3.region` | При работе с Azure можно опустить |
| `s3.access_key` | Access Key учётной записи Azure Storage |
| `s3.secret_key` | Secret Key учётной записи Azure Storage |
| `timeout` | Тайм-аут задачи импорта (в секундах) |

### Шаг 4: проверьте импортированные данные {#step-4-verify-the-imported-data}

```sql
SELECT * FROM test_s3load;
```

Ожидаемый результат:

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## Способ 2: импорт с помощью TVF (синхронный) {#method-2-import-using-tvf-synchronous}

TVF (Table-Valued Function) — это способ синхронного импорта, позволяющий читать и записывать данные в рамках одного оператора SQL. Он подходит для небольших пакетов данных и разовых операций.

### Шаг 1: подготовьте данные {#step-1-prepare-data-1}

Создайте в Azure Storage CSV-файл `s3load_example.csv` со следующим содержимым:

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### Шаг 2: создайте таблицу в Doris {#step-2-create-a-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: импортируйте данные с помощью TVF {#step-3-import-data-using-tvf}

Импортируйте данные напрямую через `INSERT INTO ... SELECT FROM S3(...)`:

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Описание основных параметров:

| Параметр | Описание |
|------|------|
| `uri` | Путь к объекту в Azure Storage в формате `s3://<bucket>/<object>` |
| `format` | Формат файла, например `csv`, `parquet`, `orc` и т. д. |
| `provider` | Необходимо задать значение `AZURE` |
| `s3.endpoint` | Адрес службы Azure Blob |
| `s3.region` | При работе с Azure можно опустить |
| `s3.access_key` / `s3.secret_key` | Учётные данные для доступа к Azure Storage |
| `column_separator` | Разделитель столбцов (применяется к CSV) |
| `csv_schema` | Определение столбцов CSV в формате `column_name:type;column_name:type` |

### Шаг 4: проверьте импортированные данные {#step-4-verify-the-imported-data-1}

```sql
SELECT * FROM test_s3load;
```

Ожидаемый результат:

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## Часто задаваемые вопросы {#faq}

### Q1: как выбрать между S3 Load и TVF? {#q1-how-should-you-choose-between-s3-load-and-tvf}

- **S3 Load**: выполняется асинхронно, подходит для больших пакетов данных, сценариев, требующих отслеживания состояния импорта по Label, и запуска периодических задач по расписанию.
- **TVF**: выполняется синхронно, подходит для небольших пакетов данных, разовых запросов, быстрой проверки содержимого файлов и сценариев, требующих преобразования данных в SELECT перед записью.

### Q2: почему при обращении к Azure Storage возникает ошибка или сбой подключения? {#q2-why-does-an-error-or-connection-failure-occur-when-accessing-azure-storage}

Проверьте следующее:

1. Параметр `s3_client_http_scheme = https` задан в файле `be.conf` на узле BE, а BE перезапущен, чтобы настройка вступила в силу.
2. Если для учётной записи Azure Storage включена настройка `Secure transfer required`, необходимо использовать HTTPS.
3. Параметр `s3.endpoint` указан в правильном формате: `<StorageAccount>.blob.core.windows.net`, без префикса протокола.
4. AK/SK действителен и предоставляет право на чтение целевого Bucket.

### Q3: обязателен ли параметр `s3.region`? {#q3-is-s3region-required}

Нет. При работе с Azure параметр `s3.region` можно опустить. Если он указан, это не влияет на процесс импорта.

### Q4: какой формат URI следует использовать? {#q4-what-format-should-the-uri-use}

Как для `DATA INFILE` в S3 Load, так и для `uri` в TVF используйте формат `s3://<bucket_name>/<object_path>` для доступа к объектам в Azure Storage.

## Устранение неполадок {#troubleshooting}

| Проблема | Возможная причина | Решение |
|------|----------|----------|
| Задача импорта сообщает об ошибке подключения | На BE не включён HTTPS | Задайте `s3_client_http_scheme = https` в файле `be.conf` и перезапустите BE |
| Сообщается об ошибке доступа или аутентификации | Неверный AK/SK или недостаточно прав | Проверьте правильность Access Key и Secret Key и наличие права на чтение целевого контейнера |
| Не удаётся разрешить адрес Endpoint | Endpoint содержит префикс протокола или указан с ошибкой | Используйте `<StorageAccount>.blob.core.windows.net` без префикса, например `https://` |
| Истекает время ожидания задачи импорта | Большой объём данных или медленная сеть | Увеличьте значение `timeout` в `PROPERTIES` |

## Связанные документы {#related-documents}

- [Руководство по Broker Load](../import-way/broker-load-manual.md)
