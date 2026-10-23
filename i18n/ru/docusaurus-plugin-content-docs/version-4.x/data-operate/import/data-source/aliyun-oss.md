---
{
    "title": "Aliyun OSS",
    "language": "ru",
    "description": "В этой статье описано, как эффективно импортировать CSV и другие файлы из Aliyun OSS в Apache Doris с помощью S3 Load и TVF.",
    "keywords": [
        "Aliyun OSS",
        "Aliyun OSS",
        "Doris import OSS",
        "S3 Load",
        "Table Value Function",
        "TVF import",
        "object storage import",
        "Broker Load",
        "OSS endpoint"
    ]
}
---

<!-- Knowledge type: Procedure / Data Import -->
<!-- Applicable scenario: Loading data from Aliyun OSS into Doris -->

Apache Doris поддерживает импорт файлов из Aliyun OSS (Object Storage Service) для двух типичных сценариев: массового асинхронного импорта и синхронного импорта по мере необходимости. В этой статье сравниваются оба подхода, приводятся пошаговые инструкции и рассматриваются распространённые проблемы и способы их устранения.

## Выбор подхода {#choosing-an-approach}

Прежде чем выбрать способ импорта, обратитесь к таблице ниже, чтобы определить, какой подход подходит для вашего сценария:

| Способ импорта | Команда запуска                       | Синхронный/асинхронный | Сценарий использования                                                  | Справочная документация                                                         |
| ------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S3 Load       | `LOAD LABEL ...`                      | Асинхронный      | Импорт больших объёмов данных, требующий управления задачами и повторных попыток при сбоях | [Руководство по Broker Load](../import-way/broker-load-manual.md)         |
| Импорт через TVF    | `INSERT INTO ... SELECT FROM S3(...)` | Синхронный       | Разовые запросы и небольшой объём импорта, когда результат нужен немедленно  | -                                                                 |

## Предварительные требования {#prerequisites}

Перед началом работы убедитесь, что у вас есть следующие сведения и выполнены необходимые условия:

- Имя `bucket` в Aliyun OSS и путь к целевому файлу
- Учётные данные для доступа: `AccessKey` (AK) и `SecretKey` (SK)
- Endpoint OSS и сведения о Region
- Кластер Doris имеет доступ к OSS через общедоступную или внутреннюю сеть

:::caution Выбор Endpoint
В Aliyun OSS используются разные Endpoint для общедоступной и внутренней сети. Если кластер Doris и OSS находятся в одном Region, используйте Endpoint внутренней сети, чтобы снизить задержку, получить более стабильную пропускную способность и избежать платы за трафик в общедоступной сети.

- Внутренний Endpoint: `oss-cn-hangzhou-internal.aliyuncs.com`
- Общедоступный Endpoint: `oss-cn-hangzhou.aliyuncs.com`
:::

## Импорт с помощью S3 Load (асинхронный) {#importing-with-s3-load-asynchronous}

S3 Load — это способ асинхронного импорта на основе Broker Load, подходящий для пакетной загрузки данных. Подробное описание механизма приведено в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Создайте в Aliyun OSS файл CSV `s3load_example.csv` со следующим содержимым:

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

### Шаг 2: Создайте таблицу в Doris {#step-2-create-a-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Запустите импорт с помощью S3 Load {#step-3-run-the-s3-load-import}

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
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Основные параметры:

| Параметр         | Описание                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `provider`        | Тип объектного хранилища. Для Aliyun OSS используется фиксированное значение `OSS`.         |
| `s3.endpoint`     | Endpoint сервиса OSS. Выбирайте его с учётом Region и сетевого окружения. |
| `s3.region`       | Название Region OSS, например `oss-cn-hangzhou`.                      |
| `s3.access_key`   | AccessKey ID учётной записи Aliyun.                              |
| `s3.secret_key`   | AccessKey Secret учётной записи Aliyun.                          |
| `timeout`         | Время ожидания выполнения задачи в секундах.                                            |

### Шаг 4: Проверьте результат импорта {#step-4-check-the-import-result}

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

## Импорт с помощью TVF (синхронный) {#importing-with-tvf-synchronous}

TVF (Table Value Function) позволяет читать файлы из объектного хранилища напрямую с помощью табличной функции и синхронно записывать данные в целевую таблицу через `INSERT INTO ... SELECT`. Этот подход подходит для разового импорта данных или загрузки небольшими пакетами.

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Создайте в Aliyun OSS файл CSV `s3load_example.csv` со следующим содержимым:

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

### Шаг 2: Создайте таблицу в Doris {#step-2-create-a-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Запустите импорт с помощью TVF {#step-3-run-the-tvf-import}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Основные параметры:

| Параметр           | Описание                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `uri`               | Адрес файла в OSS с префиксом протокола `s3://`.                   |
| `format`            | Формат файла, например `csv`, `parquet` или `orc`.                       |
| `provider`          | Тип объектного хранилища. Для Aliyun OSS используется фиксированное значение `OSS`.               |
| `s3.endpoint`       | Endpoint сервиса OSS.                                                      |
| `s3.region`         | Название Region OSS.                                                           |
| `s3.access_key`     | AccessKey ID учётной записи Aliyun.                                    |
| `s3.secret_key`     | AccessKey Secret учётной записи Aliyun.                                |
| `column_separator`  | Разделитель столбцов CSV.                                                  |
| `csv_schema`        | Определения столбцов CSV в формате `column_name:type;column_name:type;...`. |

### Шаг 4: Проверьте результат импорта {#step-4-check-the-import-result-1}

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

<!-- Knowledge type: FAQ / Troubleshooting -->

## Часто задаваемые вопросы {#faq}

### Вопрос 1: Как выбрать между S3 Load и импортом через TVF? {#q1-how-do-i-choose-between-s3-load-and-tvf-import}

- Используйте **S3 Load**, если объём данных велик и вам нужно асинхронное выполнение с планированием задач и механизмами повторных попыток.
- Используйте **импорт через TVF**, если вам нужны разовые запросы или синхронная запись с немедленным получением результата.

### Вопрос 2: Чем внутренний Endpoint отличается от общедоступного Endpoint? {#q2-what-is-the-difference-between-an-internal-endpoint-and-a-public-endpoint}

- Если кластер Doris и OSS находятся в одном Region, использование **внутреннего Endpoint** (например, `oss-cn-hangzhou-internal.aliyuncs.com`) снижает задержку, обеспечивает более стабильную пропускную способность и позволяет избежать платы за трафик в общедоступной сети.
- Для доступа между разными Region или при размещении кластера вне Aliyun используйте **общедоступный Endpoint** (например, `oss-cn-hangzhou.aliyuncs.com`).

### Вопрос 3: Почему параметр `provider` должен иметь значение `OSS`? {#q3-why-must-the-provider-parameter-be-set-to-oss}

Параметр `provider` сообщает серверной части Doris, какой тип объектного хранилища используется, чтобы она могла учитывать особенности аутентификации и протокола Aliyun OSS. При импорте файлов из Aliyun OSS необходимо явно задать для этого параметра значение `OSS`.

### Вопрос 4: Что делать, если задача S3 Load зависает или завершается по тайм-ауту? {#q4-what-should-i-do-if-an-s3-load-task-hangs-or-times-out}

- Увеличьте значение `timeout` (в секундах) в `PROPERTIES`.
- Проверьте сетевое соединение и по возможности используйте внутренний Endpoint.
- Выполните `SHOW LOAD`, чтобы посмотреть состояние задачи и причину сбоя. Подробнее см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Вопрос 5: Поддерживает ли импорт через TVF другие форматы, кроме CSV? {#q5-does-tvf-import-support-formats-other-than-csv}

Да. С помощью значений `csv`, `parquet` и `orc` параметра `format` можно выбрать соответствующий формат. Для форматов, отличных от CSV, указывать `column_separator` и `csv_schema` не требуется.
