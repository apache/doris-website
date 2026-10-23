---
{
    "title": "S3-совместимое хранилище",
    "language": "ru",
    "description": "Как загрузить данные из S3-совместимых хранилищ, таких как MinIO и Ceph, в Apache Doris: асинхронная загрузка с помощью S3 Load или синхронная загрузка с помощью TVF.",
    "keywords": [
        "S3-совместимое хранилище",
        "Загрузка из MinIO в Doris",
        "Загрузка из Ceph в Doris",
        "S3 Load",
        "S3 TVF",
        "Broker Load",
        "Импорт из объектного хранилища",
        "use_path_style",
        "virtual-hosted style",
        "path style"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Applicable scenario: Loading data from S3-compatible storage (MinIO, Ceph, etc.) into Doris -->

Apache Doris поддерживает загрузку данных из различных систем объектного хранения, совместимых с протоколом S3, таких как MinIO, Ceph, Huawei Cloud OBS и Tencent Cloud COS. В этом документе описаны сценарии применения и все шаги для двух способов загрузки.

## Выбор способа загрузки {#choosing-a-method}

Выберите подходящий способ загрузки в зависимости от объёма данных и режима обработки:

| Способ загрузки | Режим | Сценарий применения | Документация |
| --- | --- | --- | --- |
| **S3 Load** | Асинхронный | Загрузка данных крупными пакетами, требующая управления заданиями и механизмов повторных попыток | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| **TVF (Table Value Function)** | Синхронный | Разовые запросы, загрузка данных небольшими пакетами, использование данных непосредственно в SQL | - |

:::caution Примечание
По умолчанию S3 SDK обращается к объектному хранилищу в режиме **virtual-hosted style**. Если в целевой системе хранения этот режим не включён или не поддерживается, добавьте параметр `"use_path_style" = "true"`, чтобы принудительно использовать **path style**.
:::

## Загрузка с помощью S3 Load (асинхронная) {#loading-with-s3-load-asynchronous}

S3 Load подходит для крупномасштабной пакетной загрузки. Задания загрузки отправляются асинхронно, а Doris планирует их выполнение в фоновом режиме. Подробное описание механизма см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Создайте в S3-совместимом хранилище CSV-файл `s3load_example.csv` со следующим содержимым:

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

### Шаг 2: Создайте целевую таблицу в Doris {#step-2-create-the-target-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Отправьте задание S3 Load {#step-3-submit-the-s3-load-job}

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
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Основные параметры:

| Параметр | Описание |
| --- | --- |
| `provider` | Тип поставщика объектного хранилища. Для S3-совместимых хранилищ всегда указывайте `S3`. |
| `s3.endpoint` | Конечная точка доступа к S3-совместимому хранилищу (без префикса протокола). |
| `s3.region` | Регион, в котором находится бакет. |
| `s3.access_key` | Ключ доступа (AK). |
| `s3.secret_key` | Секретный ключ (SK). |
| `use_path_style` | Определяет, следует ли использовать доступ в режиме path style. Для систем хранения, таких как MinIO, обычно требуется значение `true`. |
| `timeout` | Время ожидания завершения задания загрузки в секундах. |

### Шаг 4: Проверьте результат загрузки {#step-4-verify-the-loading-result}

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

## Загрузка с помощью TVF (синхронная) {#loading-with-tvf-synchronous}

TVF позволяет обращаться к файлам в S3-совместимом хранилище как к таблице для выполнения запросов. В сочетании с `INSERT INTO ... SELECT` этот механизм обеспечивает синхронную загрузку и подходит для разового анализа и загрузки данных небольшими пакетами.

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Создайте в S3-совместимом хранилище CSV-файл `s3load_example.csv` со следующим содержимым:

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

### Шаг 2: Создайте целевую таблицу в Doris {#step-2-create-the-target-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Выполните синхронную загрузку с помощью TVF {#step-3-load-synchronously-via-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

Основные параметры:

| Параметр | Описание |
| --- | --- |
| `uri` | Полный путь к файлу в S3-совместимом хранилище. |
| `format` | Формат файла, например `csv`, `parquet` или `orc`. |
| `provider` | Тип поставщика объектного хранилища. Для S3-совместимых хранилищ всегда указывайте `S3`. |
| `s3.endpoint` | Конечная точка доступа к S3-совместимому хранилищу. |
| `s3.region` | Регион, в котором находится бакет. |
| `s3.access_key` | Ключ доступа (AK). |
| `s3.secret_key` | Секретный ключ (SK). |
| `column_separator` | Разделитель столбцов. |
| `csv_schema` | Определение столбцов CSV-файла в формате `field_name:type`. |
| `use_path_style` | Определяет, следует ли использовать доступ в режиме path style. |

### Шаг 4: Проверьте результат загрузки {#step-4-verify-the-loading-result-1}

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

<!-- Knowledge type: Troubleshooting -->

### 1. Почему при обращении к хранилищам, таким как MinIO, появляется ошибка о том, что бакет не существует или его имя не удаётся разрешить? {#1-why-does-accessing-storage-such-as-minio-report-that-the-bucket-does-not-exist-or-cannot-be-resolved}

По умолчанию S3 SDK формирует доменное имя в режиме virtual-hosted style (например, `bucket.endpoint`), тогда как MinIO, Ceph и аналогичные системы обычно используют path style (например, `endpoint/bucket`). Чтобы устранить проблему, добавьте `"use_path_style" = "true"` в параметры загрузки.

### 2. Нужно ли включать в `s3.endpoint` префикс `http://` или `https://`? {#2-does-s3endpoint-need-to-include-the-http-or-https-prefix}

Нет. В `s3.endpoint` указываются только имя хоста и порт (например, `play.min.io:9000`).

### 3. Как выбрать между S3 Load и TVF? {#3-how-do-i-choose-between-s3-load-and-tvf}

- Для больших объёмов данных, когда требуется асинхронное выполнение и сохранение истории заданий, используйте **S3 Load**.
- Если нужно прочитать файлы S3 одним оператором SQL и синхронно записать результат с помощью `INSERT INTO ... SELECT`, используйте **TVF**.

### 4. Что делать, если истекло время ожидания завершения задания загрузки? {#4-what-should-i-do-if-the-loading-job-times-out}

Увеличьте значение свойства `timeout` в S3 Load (в секундах) или разделите большой файл на несколько файлов меньшего размера, чтобы повысить параллелизм.
