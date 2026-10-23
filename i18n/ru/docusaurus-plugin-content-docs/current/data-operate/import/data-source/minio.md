---
{
    "title": "Импорт данных из MinIO",
    "language": "ru",
    "description": "Как импортировать CSV, Parquet и другие файлы из объектного хранилища MinIO в Doris? Поддерживаются как асинхронный метод S3 Load, так и синхронный метод TVF.",
    "keywords": [
        "импорт из MinIO",
        "Doris MinIO",
        "S3 Load",
        "S3 TVF",
        "импорт из объектного хранилища",
        "use_path_style",
        "endpoint MinIO"
    ],
    "sidebar_label": "MinIO"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing files from MinIO object storage into Doris -->

[MinIO](https://min.io/) — объектное хранилище, совместимое с S3. Doris предоставляет два способа импорта файлов из MinIO. Выбирайте подходящий способ в зависимости от объёма данных и требований к оперативности загрузки:

| Способ импорта | Режим выполнения | Сценарий использования | Документация |
|----------|----------|----------|----------|
| S3 Load   | Асинхронный | Импорт больших объёмов данных; задачи, которые должны выполняться в фоновом режиме | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| TVF (Table Value Function) | Синхронный | Импорт небольших объёмов данных с помощью разовых запросов; используется с `INSERT INTO ... SELECT` | Примеры в этом документе |

## Предварительные требования {#prerequisites}

Перед импортом данных из MinIO любым из этих способов убедитесь, что выполнены следующие условия:

- Кластер Doris развёрнут и имеет доступ к сервису MinIO.
- У вас есть endpoint MinIO, регион, ключ доступа и секретный ключ.
- Файлы CSV/Parquet для импорта загружены в бакет MinIO.

:::caution Важно: особенности настройки подключения к MinIO
При использовании S3 Load или TVF для импорта данных из MinIO учитывайте следующие два момента:

- **Префикс протокола в endpoint**: если MinIO развёрнут в локальной сети без TLS, необходимо явно добавить `http://` к `endpoint`, например `"s3.endpoint" = "http://localhost:9000"`.
- **Режим доступа по пути**: S3 SDK по умолчанию использует virtual-hosted style, но в MinIO этот режим доступа по умолчанию не включён. Добавьте `"use_path_style" = "true"`, чтобы принудительно использовать path style.
:::

## Способ 1: импорт с помощью S3 Load (асинхронно) {#method-1-import-using-s3-load-asynchronous}

S3 Load подходит для импорта файлов из MinIO в Doris в виде асинхронной задачи. Подробные инструкции см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: подготовьте данные {#step-1-prepare-the-data}

Создайте файл CSV `s3load_example.csv` со следующим содержимым и загрузите его в MinIO:

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
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Шаг 4: проверьте импортированные данные {#step-4-verify-the-imported-data}

Выполните запрос, чтобы убедиться, что данные успешно импортированы:

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

## Способ 2: импорт с помощью TVF (синхронно) {#method-2-import-using-tvf-synchronous}

Метод TVF (Table Value Function) позволяет читать файлы MinIO как виртуальную таблицу с помощью функции `S3()` и в сочетании с `INSERT INTO ... SELECT` выполнять импорт синхронно. Он подходит для небольших объёмов данных или разовых задач.

### Шаг 1: подготовьте данные {#step-1-prepare-the-data-1}

Создайте файл CSV `s3load_example.csv` со следующим содержимым и загрузите его в MinIO:

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

Выполните следующий SQL для синхронного импорта данных:

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

### Шаг 4: проверьте импортированные данные {#step-4-verify-the-imported-data-1}

Выполните запрос, чтобы убедиться, что данные успешно импортированы:

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

## Основные параметры {#key-parameters}

<!-- Knowledge type: Configuration parameters -->

Для работы как S3 Load, так и TVF необходимо правильно настроить следующие параметры:

| Параметр | Описание | Пример значения |
|------|------|--------|
| `provider` | Поставщик объектного хранилища. При использовании MinIO укажите `S3`. | `S3` |
| `s3.endpoint` | Адрес сервиса MinIO. Если TLS не включён, необходим префикс `http://`. | `http://localhost:9000` |
| `s3.region` | Регион, в котором развёрнут MinIO. Можно указать любое значение, но оно должно оставаться неизменным. | `us-east-1` |
| `s3.access_key` | Идентификатор ключа доступа MinIO. | `myminioadmin` |
| `s3.secret_key` | Секретный ключ доступа MinIO. | `minio-secret-key-change-me` |
| `use_path_style` | Использовать ли доступ в режиме path-style. Для MinIO необходимо установить значение `true`. | `true` |

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Connection configuration -->

### Вопрос 1: как выбрать между S3 Load и TVF? {#q1-how-do-i-choose-between-s3-load-and-tvf}

- **S3 Load**: выполняется асинхронно. Подходит для импорта больших объёмов данных. После отправки задачи Doris планирует и выполняет её в фоновом режиме. Проверить состояние задачи можно с помощью `SHOW LOAD`.
- **TVF**: выполняется синхронно. Подходит для небольших объёмов данных, разового анализа или использования в конвейерах с `INSERT INTO ... SELECT`. Возвращает результат сразу.

### Вопрос 2: что делать, если при подключении к MinIO возникают ошибки, связанные с endpoint? {#q2-what-should-i-do-if-i-get-endpoint-related-errors-when-connecting-to-minio}

Убедитесь, что в endpoint указан правильный префикс протокола:

- TLS не включён: необходимо указать `http://`, например `http://localhost:9000`.
- TLS включён: используйте префикс `https://`.

### Вопрос 3: что делать, если при обращении к хранилищу возникает ошибка разбора имени бакета или ошибка 404? {#q3-what-should-i-do-if-access-reports-a-bucket-parsing-error-or-404}

По умолчанию MinIO не поддерживает доступ в режиме virtual-hosted style. Необходимо явно добавить в параметры импорта следующую настройку:

```text
"use_path_style" = "true"
```

### Вопрос 4: поддерживаются ли другие форматы, например Parquet/ORC? {#q4-are-other-formats-such-as-parquetorc-supported}

Да. Замените `FORMAT AS "CSV"` (или `"format" = "csv"` в TVF) на `parquet`, `orc` или другой соответствующий формат. Подробнее см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).
