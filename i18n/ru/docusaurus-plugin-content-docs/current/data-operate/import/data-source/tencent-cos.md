---
{
    "title": "Tencent Cloud COS",
    "language": "ru",
    "description": "Как импортировать данные из Tencent Cloud COS в Apache Doris: подробные инструкции и примеры для асинхронного режима S3 Load и синхронного режима TVF.",
    "keywords": [
        "Tencent Cloud COS",
        "Tencent COS",
        "S3 Load",
        "TVF",
        "импорт из объектного хранилища",
        "импорт в Doris",
        "импорт из COS в Doris",
        "протокол S3"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Tencent Cloud COS into Apache Doris -->

Apache Doris обращается к Tencent Cloud Object Storage (COS) по S3-совместимому протоколу. Поддерживаются два режима импорта. Выберите подходящий с учётом объёма данных и требований к задержке.

## Выбор решения {#choosing-a-solution}

| Способ импорта | Режим | Сценарий использования | Справочный материал |
| --- | --- | --- | --- |
| S3 Load | Асинхронный | Офлайн-импорт больших пакетов данных; задание импорта выполняется в фоновом режиме, его состояние можно проверить | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| TVF (Table Value Function) | Синхронный | Разовые запросы или импорт небольших пакетов данных; чтение файлов COS напрямую с помощью `INSERT INTO ... SELECT` | - |

## Предварительные требования {#prerequisites}

Перед запуском импорта подготовьте следующую информацию и ресурсы:

- Имя бакета COS и путь к объекту (например, `s3://your_bucket_name/s3load_example.csv`)
- Endpoint COS (например, `cos.ap-beijing.myqcloud.com`) и регион (например, `ap-beijing`)
- AccessKey (`access_key`) и SecretKey (`secret_key`) с правом доступа к бакету
- Доступный кластер Apache Doris

Во всех примерах этого документа используется следующий CSV-файл `s3load_example.csv`:

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

Целевая таблица `test_s3load` имеет следующую структуру:

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

## Способ 1: Асинхронный импорт с помощью S3 Load {#method-1-asynchronous-import-with-s3-load}

S3 Load позволяет асинхронно импортировать данные и подходит для офлайн-сценариев или больших объёмов данных. Подробное описание механизма см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Загрузите приведённый выше файл `s3load_example.csv` в целевой бакет Tencent Cloud COS.

### Шаг 2: Создайте таблицу в Doris {#step-2-create-the-table-in-doris}

Выполните оператор `CREATE TABLE` из раздела [Предварительные требования](#prerequisites), чтобы создать целевую таблицу `test_s3load`.

### Шаг 3: Отправьте задание S3 Load {#step-3-submit-the-s3-load-job}

Отправьте задание импорта с помощью следующего SQL. Замените `<your-ak>` и `<your-sk>` фактическими учётными данными, а вместо `your_bucket_name` укажите фактическое имя бакета:

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
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Шаг 4: Проверьте результат импорта {#step-4-check-the-import-result}

```sql
SELECT * FROM test_s3load;
```

Пример результата:

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

## Способ 2: Синхронный импорт с помощью TVF {#method-2-synchronous-import-with-tvf}

TVF (Table Value Function) читает файлы COS как таблицу через функцию `S3`. В сочетании с `INSERT INTO ... SELECT` она выполняет синхронный импорт и подходит для импорта небольших пакетов данных или разовых запросов.

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Загрузите приведённый выше файл `s3load_example.csv` в целевой бакет Tencent Cloud COS.

### Шаг 2: Создайте таблицу в Doris {#step-2-create-the-table-in-doris-1}

Выполните оператор `CREATE TABLE` из раздела [Предварительные требования](#prerequisites), чтобы создать целевую таблицу `test_s3load`.

### Шаг 3: Импортируйте данные с помощью TVF {#step-3-import-the-data-with-the-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

### Шаг 4: Проверьте результат импорта {#step-4-check-the-import-result-1}

```sql
SELECT * FROM test_s3load;
```

Пример результата:

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

В следующей таблице перечислены параметры, которые обычно используются при импорте данных из Tencent Cloud COS:

| Параметр | Описание | Пример |
| --- | --- | --- |
| `provider` | Поставщик объектного хранилища. Для Tencent Cloud COS всегда указывается `COS` | `COS` |
| `s3.endpoint` | Endpoint COS, соответствующий региону бакета | `cos.ap-beijing.myqcloud.com` |
| `s3.region` | Регион COS | `ap-beijing` |
| `s3.access_key` | ID ключа доступа Tencent Cloud | `<your-ak>` |
| `s3.secret_key` | Секретный ключ доступа Tencent Cloud | `<your-sk>` |
| `uri` / `DATA INFILE` | Путь к файлу в COS. Всегда используйте префикс `s3://` | `s3://your_bucket_name/s3load_example.csv` |
| `format` / `FORMAT AS` | Формат файла (CSV, Parquet, ORC и т. д.) | `csv` |
| `column_separator` / `COLUMNS TERMINATED BY` | Разделитель столбцов | `,` |
| `csv_schema` | Задаёт схему столбцов CSV в режиме TVF | `user_id:int;name:string;age:int` |
| `timeout` | Тайм-аут задания S3 Load (в секундах) | `3600` |

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

**Вопрос 1: Как выбрать между импортом через S3 Load и TVF?**

- Большие объёмы данных, которые можно импортировать асинхронно в фоновом режиме: выберите **S3 Load**.
- Небольшие объёмы данных, для которых нужен немедленный результат, или необходимость использовать файлы COS в запросе SELECT: выберите **TVF**.

**Вопрос 2: Как определить значение `s3.endpoint`?**

Используйте общедоступное или внутреннее доменное имя COS, соответствующее региону бакета. Например, для региона Пекин используется `cos.ap-beijing.myqcloud.com`, а для региона Шанхай используется `cos.ap-shanghai.myqcloud.com`. Подробности см. в официальной документации Tencent Cloud COS.

**Вопрос 3: Должен ли URI начинаться с `s3://`?**

Да. Doris обращается к COS по протоколу S3, поэтому и в `DATA INFILE` для S3 Load, и в `uri` для TVF необходимо использовать формат `s3://bucket_name/path`.

**Вопрос 4: Почему порядок строк в результате отличается от порядка в исходном файле?**

Таблица Doris распределена: данные размещаются в нескольких таблетах в соответствии с ключом бакетирования `HASH(user_id)`, а `SELECT *` не гарантирует определённого порядка. Чтобы получить упорядоченный результат, явно используйте `ORDER BY`.

**Вопрос 5: Как выяснить причину сбоя импорта?**

- Проверьте, есть ли у `access_key` / `secret_key` право на чтение целевого бакета.
- Убедитесь, что `s3.endpoint` и `s3.region` соответствуют региону бакета.
- Для задания S3 Load выполните `SHOW LOAD WHERE LABEL = 's3_load_2022_04_01';`, чтобы просмотреть подробные сведения об ошибке.
