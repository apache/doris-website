---
{
    "title": "Импорт данных из Google Cloud Storage (GCS)",
    "language": "ru",
    "description": "Как импортировать данные из Google Cloud Storage в Apache Doris: асинхронный импорт с помощью S3 Load или синхронный импорт с помощью S3 TVF.",
    "keywords": [
        "импорт из Google Cloud Storage",
        "импорт из GCS в Doris",
        "S3 Load GCP",
        "S3 TVF GCS",
        "импорт в Doris из объектного хранилища",
        "провайдер GCP"
    ],
    "sidebar_label": "Google Cloud Storage"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing data from Google Cloud Storage into Apache Doris -->

Apache Doris поддерживает импорт файлов из Google Cloud Storage (GCS), обращаясь к бакетам GCS по протоколу, совместимому с S3. В этом документе описаны два способа импорта и приведены полные инструкции для каждого из них.

## Выбор способа импорта {#choosing-an-approach}

Doris предоставляет два способа импорта файлов из Google Cloud Storage. Выбирайте подходящий способ в зависимости от объёма данных и требований к скорости получения результата:

| Способ импорта | Режим выполнения | Когда использовать | Подробнее |
|---------|---------|---------|---------|
| S3 Load | Асинхронный | Импорт больших пакетов данных, длительные задания | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| S3 TVF (табличная функция) | Синхронный | Импорт небольших пакетов данных, разовые запросы, быстрая проверка | Этот документ |

Рекомендации:

- Для больших объёмов данных или заданий, которые должны выполняться в фоновом режиме, используйте **S3 Load**.
- Для немедленного получения результатов или использования с `INSERT INTO ... SELECT` применяйте **S3 TVF**.

## Предварительные требования {#prerequisites}

Перед импортом подготовьте следующую информацию и ресурсы:

- Имя бакета Google Cloud Storage (`your_bucket_name`).
- Учётные данные для доступа: Access Key и Secret Key.
- Endpoint и Region GCS (например, `storage.us-west2.rep.googleapis.com` и `US-WEST2`).
- Развёрнутый и доступный кластер Apache Doris.

## Способ 1: импорт с помощью S3 Load (асинхронный) {#method-1-import-with-s3-load-asynchronous}

S3 Load подходит для асинхронного импорта больших объёмов данных. Подробное описание параметров и дополнительных возможностей см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: подготовьте данные {#step-1-prepare-the-data}

Создайте файл CSV `s3load_example.csv` и загрузите его в Google Cloud Storage. Содержимое файла:

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

### Шаг 3: импортируйте данные с помощью S3 Load {#step-3-import-the-data-with-s3-load}

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
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Основные параметры:

| Параметр | Описание |
|------|------|
| `provider` | Провайдер объектного хранилища. Для GCS всегда указывается `GCP` |
| `s3.endpoint` | Конечная точка доступа к GCS, совместимая с S3 |
| `s3.region` | Регион, в котором расположен бакет GCS |
| `s3.access_key` | ID ключа доступа GCS |
| `s3.secret_key` | Секретный ключ доступа GCS |
| `timeout` | Время ожидания завершения импорта в секундах |

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

## Способ 2: импорт с помощью TVF (синхронный) {#method-2-import-with-tvf-synchronous}

Табличная функция S3 (TVF) подходит для синхронного импорта и разовых запросов и может использоваться непосредственно с `INSERT INTO ... SELECT`.

### Шаг 1: подготовьте данные {#step-1-prepare-the-data-1}

Создайте файл CSV `s3load_example.csv` и загрузите его в Google Cloud Storage. Содержимое файла:

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

### Шаг 3: импортируйте данные с помощью TVF {#step-3-import-the-data-with-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Основные параметры:

| Параметр | Описание |
|------|------|
| `uri` | S3 URI файла в объектном хранилище |
| `format` | Формат файла, например `csv`, `parquet` или `orc` |
| `provider` | Провайдер объектного хранилища. Для GCS всегда указывается `GCP` |
| `s3.endpoint` | Конечная точка доступа к GCS, совместимая с S3 |
| `s3.region` | Регион, в котором расположен бакет GCS |
| `s3.access_key` | ID ключа доступа GCS |
| `s3.secret_key` | Секретный ключ доступа GCS |
| `column_separator` | Разделитель столбцов |
| `csv_schema` | Определения столбцов CSV в формате `column_name:type;column_name:type` |

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

<!-- Knowledge type: Troubleshooting -->

**Вопрос 1: какое значение следует указать для параметра `provider`?**

При импорте из Google Cloud Storage параметру `provider` необходимо присвоить значение `GCP`, чтобы Doris обращался к GCS по протоколу, совместимому с S3.

**Вопрос 2: как выбрать между S3 Load и S3 TVF?**

- Для больших объёмов данных, которые нужно импортировать асинхронно в фоновом режиме, выбирайте **S3 Load**.
- Для небольших объёмов данных, когда нужен немедленный результат или импорт выполняется вместе с запросами SQL, выбирайте **S3 TVF**.

**Вопрос 3: как получить Access Key и Secret Key для GCS?**

Создавать ключи HMAC (Access Key / Secret Key) для доступа по протоколу, совместимому с S3, и управлять ими можно на странице **Cloud Storage > Настройки > Совместимость** в Google Cloud Console.

**Вопрос 4: как определить Endpoint и Region?**

Значения Endpoint и Region зависят от региона, в котором расположен бакет. Например, региону `US-WEST2` соответствует конечная точка `storage.us-west2.rep.googleapis.com`. Замените эти значения в соответствии с фактическим расположением вашего бакета.

**Вопрос 5: что делать, если импорт завершается ошибкой из-за превышения времени ожидания?**

Увеличьте значение параметра `timeout` в `PROPERTIES` (в секундах). Значение по умолчанию — `3600`. Для очень больших файлов или медленных сетей увеличьте его по мере необходимости.
