---
{
    "title": "Huawei Cloud OBS",
    "language": "ru",
    "description": "Используйте S3 Load для асинхронного импорта или TVF для синхронного импорта, чтобы эффективно загружать файлы CSV/Parquet и других форматов из Huawei Cloud OBS в Apache Doris.",
    "keywords": [
        "Huawei Cloud OBS",
        "Huawei Cloud OBS",
        "Doris import OBS",
        "S3 Load OBS",
        "TVF S3",
        "object storage import",
        "OBS Endpoint",
        "obs.cn-north-1.myhuaweicloud.com"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Huawei Cloud OBS into Apache Doris -->

Apache Doris поддерживает импорт файлов данных напрямую из Huawei Cloud Object Storage Service (OBS). Обычно этот способ используется для миграции данных в офлайн-режиме, дозагрузки исторических данных и загрузки файлов из озера данных в хранилище. В этом документе на примере файлов CSV подробно описаны все шаги для обоих способов импорта.

## Выбор способа {#choosing-an-approach}

Doris предоставляет два способа импорта файлов из Huawei Cloud OBS. Выберите подходящий способ в зависимости от объёма данных и требований к оперативности загрузки:

| Способ импорта | Тип | Сценарий использования | Справочная информация |
|---------|------|---------|---------|
| **S3 Load** | Асинхронный импорт | Импорт больших объёмов данных; задания выполняются в фоновом режиме и поддерживают повторные попытки при сбое | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| **TVF (Table Value Function)** | Синхронный импорт | Небольшие и средние объёмы данных, разовые запросы; используется совместно с `INSERT INTO ... SELECT` | Этот документ, [Импорт с помощью TVF](#import-using-tvf) |

> Примечание: Оба способа обращаются к OBS по протоколу S3 и требуют предоставленные OBS значения Endpoint, Region, Access Key и Secret Key.

## Предварительные требования {#prerequisites}

Перед началом импорта убедитесь, что выполнены следующие условия:

- Доступен бакет Huawei Cloud OBS, в который уже загружены файлы данных для импорта.
- Известны **Endpoint** OBS (например, `obs.cn-north-1.myhuaweicloud.com`) и соответствующий **Region** (например, `cn-north-1`).
- Имеются **Access Key (AK)** и **Secret Key (SK)** с правом чтения данных из бакета.
- Развёрнут кластер Apache Doris, а текущий пользователь имеет право `LOAD_PRIV` для целевой базы данных и таблицы.

## Импорт с помощью S3 Load {#import-using-s3-load}

S3 Load представляет собой асинхронный способ импорта. После отправки задания Doris планирует и выполняет его в фоновом режиме, что подходит для больших объёмов данных. Подробную информацию о параметрах и запросах состояния см. в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Загрузите CSV-файл `s3load_example.csv` в Huawei Cloud OBS. Содержимое файла:

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

Создайте в Doris целевую таблицу, соответствующую структуре файла:

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Импортируйте данные с помощью S3 Load {#step-3-import-data-with-s3-load}

Отправьте задание S3 Load для импорта CSV-файла из OBS в целевую таблицу:

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
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
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
| `DATA INFILE` | Путь к файлу в OBS с префиксом протокола `s3://` |
| `provider` | Необходимо указать значение `OBS`, обозначающее объектное хранилище Huawei Cloud |
| `s3.endpoint` | Endpoint сервиса OBS; задаётся в соответствии с регионом бакета |
| `s3.region` | Region, в котором расположен бакет OBS |
| `s3.access_key` / `s3.secret_key` | AK/SK для аутентификации |
| `timeout` | Время ожидания завершения задания в секундах |

### Шаг 4: Проверьте импортированные данные {#step-4-verify-the-imported-data}

После завершения импорта выполните запрос к целевой таблице, чтобы убедиться, что данные записаны правильно:

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

## Импорт с помощью TVF {#import-using-tvf}

TVF (Table Value Function) представляет файл в OBS как виртуальную таблицу, возвращаемую табличной функцией, что позволяет выполнить синхронный импорт непосредственно с помощью `INSERT INTO ... SELECT`. Этот способ удобно сочетать с выражениями SQL для простых операций ETL.

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Загрузите в OBS тот же CSV-файл `s3load_example.csv`, который использовался в примере S3 Load:

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

### Шаг 3: Импортируйте данные с помощью TVF {#step-3-import-data-with-tvf}

Прочитайте файл из OBS с помощью табличной функции `S3` и запишите данные в целевую таблицу с помощью `INSERT INTO ... SELECT`:

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Основные параметры:

| Параметр | Описание |
|------|------|
| `uri` | URI файла в OBS с префиксом протокола `s3://` |
| `format` | Формат файла; для файлов CSV используйте `csv` |
| `provider` | Необходимо указать значение `OBS` |
| `s3.endpoint` / `s3.region` | Endpoint и Region OBS |
| `s3.access_key` / `s3.secret_key` | AK/SK для аутентификации в OBS |
| `column_separator` | Разделитель полей; по умолчанию для CSV используется `,` |
| `csv_schema` | Определение типов столбцов CSV в формате `column_name:type;column_name:type;...` |

### Шаг 4: Проверьте импортированные данные {#step-4-verify-the-imported-data-1}

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

**Вопрос 1: Как выбрать между S3 Load и TVF?**

- Если требуется загрузить большой объём данных, выполнять задания асинхронно и повторять попытки при сбое, выберите **S3 Load**.
- Если объём данных небольшой, результат нужен сразу или во время импорта требуются простые преобразования с помощью выражений SQL, выберите **TVF**.

**Вопрос 2: Почему параметру `provider` необходимо присвоить значение `OBS`?**

Параметр `provider` определяет поставщика используемого объектного хранилища. Хотя Huawei Cloud OBS совместим с протоколом S3, он отличается в некоторых деталях, например в механизме подписи. Необходимо явно указать `OBS`, чтобы Doris мог использовать соответствующий адаптер доступа.

**Вопрос 3: Где найти Endpoint и Region OBS?**

Их можно найти на странице обзора бакета в консоли Huawei Cloud OBS. Типичный Endpoint имеет вид `obs.<region>.myhuaweicloud.com`. Например, региону `cn-north-1` соответствует `obs.cn-north-1.myhuaweicloud.com`.

**Вопрос 4: Какие форматы файлов поддерживаются помимо CSV?**

S3 Load и TVF поддерживают распространённые форматы, такие как `csv`, `parquet`, `orc` и `json`. Укажите формат с помощью параметра `FORMAT AS` или `format`.

## Устранение неполадок {#troubleshooting}

| Проблема | Возможная причина | Рекомендуемое действие |
|------|---------|---------|
| Ошибка `Access Denied` или `403` | Неверные AK/SK или у учётной записи нет права чтения данных из бакета | Проверьте AK/SK в консоли Huawei Cloud и предоставьте учётной записи право чтения данных из бакета OBS |
| Ошибка `endpoint is invalid` | Опечатка в Endpoint или несоответствие региону | Уточните регион бакета и используйте Endpoint для этого региона |
| Задание импорта остаётся в состоянии `PENDING` | Кластер занят или ограничено количество одновременно выполняемых заданий импорта | Проверьте состояние задания с помощью `SHOW LOAD` и при необходимости измените ограничение параллелизма или дождитесь освобождения ресурсов |
| TVF сообщает о несоответствии количества или типов столбцов | `csv_schema` не соответствует фактической структуре столбцов файла | Проверьте порядок, количество и типы данных столбцов файла и соответствующим образом обновите `csv_schema` |
| Превышено время ожидания импорта | Файл слишком большой, и значения `timeout` по умолчанию недостаточно | Увеличьте `timeout` в `PROPERTIES` (в секундах) |

## Связанные документы {#related-documents}

- [Руководство по Broker Load](../import-way/broker-load-manual.md)
