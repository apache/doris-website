---
{
    "title": "Amazon S3",
    "language": "ru",
    "description": "Загрузка данных из Amazon S3 в Doris: подробные инструкции, параметры и примеры асинхронной загрузки с помощью S3 Load и синхронной загрузки с помощью TVF.",
    "keywords": [
        "Amazon S3 load",
        "Doris S3 Load",
        "S3 TVF",
        "AWS S3 data loading",
        "Broker Load S3",
        "AWS Assume Role"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Use case: Load files from AWS S3 into Doris -->

Doris предоставляет два способа загрузки файлов из AWS S3, предназначенных для асинхронных и синхронных сценариев соответственно:

| Способ | Тип | Сценарий использования |
| --- | --- | --- |
| **S3 Load** | Асинхронный | Загрузка больших пакетов данных, задания по расписанию и загрузка в автономном режиме, требующая высокой пропускной способности и стабильности |
| **TVF (Table Value Function)** | Синхронный | Разовые запросы, обработка ETL и синхронная запись в сочетании с `INSERT INTO ... SELECT` |

> Совет: S3 Load реализован на основе Broker Load. Подробное описание работы см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

## Способ 1: загрузка с помощью S3 Load (асинхронная) {#method-1-load-with-s3-load-asynchronous}

<!-- Knowledge type: Procedure -->

S3 Load — это асинхронный способ загрузки. После отправки задания управление возвращается сразу, а загрузка выполняется в фоновом режиме. Этот способ подходит для работы с большими объёмами данных или для сценариев, требующих фоновой пакетной обработки.

### Шаг 1: подготовьте данные {#step-1-prepare-the-data}

Создайте в S3 CSV-файл `s3load_example.csv` со следующим содержимым:

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

### Шаг 3: загрузите данные с помощью S3 Load {#step-3-load-the-data-with-s3-load}

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
    "s3.endpoint" = "https://s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
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
| --- | --- |
| `DATA INFILE` | URI загружаемого файла в S3 в формате `s3://bucket/path` |
| `COLUMNS TERMINATED BY` | Разделитель столбцов CSV |
| `FORMAT AS` | Формат файла, например `CSV` |
| `provider` | Поставщик объектного хранилища. Для AWS S3 укажите `S3` |
| `s3.endpoint` | Конечная точка сервиса S3, например `s3.us-west-2.amazonaws.com` |
| `s3.region` | Регион, в котором расположен бакет S3 |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `timeout` | Время ожидания завершения задания загрузки, в секундах |

### Шаг 4: проверьте загруженные данные {#step-4-check-the-loaded-data}

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

## Способ 2: загрузка с помощью TVF (синхронная) {#method-2-load-with-tvf-synchronous}

<!-- Knowledge type: Procedure -->

TVF (Table Value Function) представляет файл в S3 как таблицу. К нему можно напрямую обращаться с помощью `SELECT`, а результат синхронно записывать в таблицу Doris, сочетая запрос с `INSERT INTO`. Этот способ подходит для сценариев с умеренным объёмом данных, в которых важно сразу видеть результат.

### Шаг 1: подготовьте данные {#step-1-prepare-the-data-1}

Создайте в S3 CSV-файл `s3load_example.csv` со следующим содержимым:

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

### Шаг 3: загрузите данные с помощью TVF {#step-3-load-the-data-with-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "s3.endpoint" = "https://s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Основные параметры:

| Параметр | Описание |
| --- | --- |
| `uri` | URI читаемого файла в S3 |
| `format` | Формат файла, например `csv` |
| `s3.endpoint` | Конечная точка сервиса S3 |
| `s3.region` | Регион, в котором расположен бакет S3 |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `column_separator` | Разделитель столбцов |
| `csv_schema` | Определение схемы CSV-файла в формате `column_name:type;...` |

### Шаг 4: проверьте загруженные данные {#step-4-check-the-loaded-data-1}

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

## Аутентификация с помощью AWS Assume Role {#authentication-with-aws-assume-role}

<!-- Knowledge type: Configuration / Authentication -->

Помимо использования Access Key / Secret Key, Doris поддерживает аутентификацию S3 Load и TVF через `AWS Assume Role`. Этот вариант подходит для организаций с ограничениями на распространение учётных данных. Подробные сведения о настройке см. в разделе [Интеграция с AWS: аутентификация через Assumed Role](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization).

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**Вопрос 1: как выбрать между S3 Load и TVF?**

- Для загрузки больших пакетов данных, загрузки в автономном режиме и заданий по расписанию выбирайте **S3 Load** (асинхронная загрузка, работа в фоновом режиме, возможность настройки времени ожидания).
- Для разовых запросов или обработки данных средствами SQL перед записью выбирайте **TVF** (синхронная загрузка, возможность сочетания с `SELECT` / `INSERT`).

**Вопрос 2: как указать регион и конечную точку для файла в S3?**

- Используйте `s3.region`, чтобы указать регион расположения бакета, например `us-west-2`.
- Используйте `s3.endpoint`, чтобы указать адрес сервиса, например `s3.us-west-2.amazonaws.com`.
- Эти параметры должны соответствовать друг другу, иначе возможны сбои подключения или ошибки перенаправления.

**Вопрос 3: обязателен ли `csv_schema` для загрузки через TVF?**

Если исходный файл имеет формат CSV, рекомендуется явно указать `csv_schema`, чтобы задать имя и тип каждого столбца и избежать неопределённости при автоматическом определении типов.

**Вопрос 4: что делать, если задание S3 Load выполняется слишком долго?**

Увеличьте значение `timeout` в `PROPERTIES` (в секундах) с учётом объёма данных. В примере используется `3600`; это значение можно изменить в зависимости от объёма данных.

## Устранение неполадок {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| Проблема | Возможная причина | Рекомендуемое действие |
| --- | --- | --- |
| Не удаётся подключиться к S3 / истекает время ожидания | `s3.endpoint` не соответствует `s3.region` или сеть недоступна | Проверьте конечную точку и регион; убедитесь, что узлы BE Doris имеют доступ к S3 |
| Ошибка аутентификации (403) | Неверные Access Key / Secret Key или недостаточные права доступа | Проверьте правильность AK/SK; убедитесь в наличии прав на чтение соответствующих бакета и объекта |
| Файл не найден | Неверный путь в `DATA INFILE` / `uri` | Проверьте имя бакета, путь ключа объекта и регистр символов |
| Ошибка разбора CSV | Разделитель или схема не соответствуют данным | Проверьте `COLUMNS TERMINATED BY` / `column_separator` и `csv_schema` |
| Истекло время ожидания задания | Большой объём данных или медленная сеть | Увеличьте `timeout` или разделите файл на части и загрузите их параллельно |

## Связанные документы {#related-documents}

- [Руководство по Broker Load](../import-way/broker-load-manual.md)
- [Интеграция с AWS: аутентификация через Assumed Role](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)
