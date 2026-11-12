---
{
    "title": "Импорт данных из HDFS",
    "language": "ru",
    "description": "Описывает импорт файлов из HDFS в Apache Doris с помощью HDFS Load (асинхронно) и TVF (синхронно), включая подробные инструкции и примеры.",
    "sidebar_label": "HDFS",
    "keywords": [
        "Doris HDFS import",
        "HDFS Load",
        "HDFS TVF",
        "Broker Load",
        "Hadoop data import",
        "asynchronous import",
        "synchronous import",
        "fs.defaultFS",
        "hadoop.username"
    ]
}
---

<!-- Knowledge type: Procedure / Data import -->
<!-- Applicable scenario: Importing data from HDFS to Doris -->

Apache Doris предоставляет два способа импорта файлов из HDFS, каждый из которых подходит для разных бизнес-сценариев.

## Выбор способа импорта {#choosing-an-approach}

Перед началом работы выберите подходящий способ импорта с учётом объёма данных, требований к задержке и бизнес-сценария:

| Способ импорта | Режим выполнения | Сценарий использования | Справочная информация |
|----------|----------|----------|----------|
| **HDFS Load** | Асинхронный | Плановые офлайн-задания для больших пакетов данных, при выполнении которых не требуется блокировать текущий сеанс до завершения импорта | [Руководство по Broker Load](../import-way/broker-load-manual.md) |
| **TVF (Table-Valued Function)** | Синхронный | Импорт небольших пакетов данных и разовые запросы с возможностью гибкого сочетания с `INSERT INTO ... SELECT` | Примеры ниже в этом документе |

> Совет: Для обоих способов необходимо правильно указать параметры подключения к HDFS (`fs.defaultFS`, `hadoop.username` и другие). Убедитесь, что кластер Doris может подключиться к HDFS по сети.

---

## Способ 1: Импорт с помощью HDFS Load (асинхронный) {#method-1-importing-with-hdfs-load-asynchronous}

<!-- Knowledge type: Procedure -->

HDFS Load — асинхронный способ импорта на основе Broker Load, подходящий для загрузки больших пакетов данных. Полное описание возможностей приведено в [руководстве по Broker Load](../import-way/broker-load-manual.md).

### Шаг 1: Подготовьте файл данных в HDFS {#step-1-prepare-the-hdfs-data-file}

Создайте в HDFS файл CSV `hdfsload_example.csv` со следующим содержимым:

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
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Отправьте задание HDFS Load {#step-3-submit-the-hdfs-load-job}

```sql
LOAD LABEL hdfs_load_2022_04_01
(
    DATA INFILE("hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv")
    INTO TABLE test_hdfsload
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
with HDFS
(
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "user"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Основные параметры:

| Параметр | Описание |
|------|------|
| `LABEL` | Уникальный идентификатор задания импорта, используемый для отслеживания и дедупликации |
| `DATA INFILE` | Путь к файлу в HDFS |
| `COLUMNS TERMINATED BY` | Разделитель столбцов; должен совпадать с разделителем в исходном файле |
| `FORMAT AS` | Формат файла, в данном случае `CSV` |
| `fs.defaultFS` | Адрес NameNode в HDFS |
| `hadoop.username` | Имя пользователя для доступа к HDFS |
| `timeout` | Время ожидания завершения задания (в секундах) |

### Шаг 4: Проверьте результат импорта {#step-4-verify-the-import-result}

```sql
SELECT * FROM test_hdfsload;
```

Ожидаемый вывод:

```text
mysql> select * from test_hdfsload;
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

---

## Способ 2: Импорт с помощью TVF (синхронный) {#method-2-importing-with-tvf-synchronous}

<!-- Knowledge type: Procedure -->

TVF (Table-Valued Function) — синхронный способ импорта, позволяющий гибко читать данные из HDFS и записывать их в Doris с помощью `INSERT INTO ... SELECT`.

### Шаг 1: Подготовьте файл данных в HDFS {#step-1-prepare-the-hdfs-data-file-1}

Создайте в HDFS файл CSV `hdfsload_example.csv` со следующим содержимым:

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
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Выполните синхронный импорт данных с помощью TVF {#step-3-import-data-synchronously-via-tvf}

```sql
INSERT INTO test_hdfsload
SELECT * FROM hdfs (
    "uri" = "hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "doris",
    "format" = "csv",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Основные параметры:

| Параметр | Описание |
|------|------|
| `uri` | Полный путь к файлу в HDFS |
| `fs.defaultFS` | Адрес NameNode в HDFS |
| `hadoop.username` | Имя пользователя для доступа к HDFS |
| `format` | Формат файла, например `csv` |
| `csv_schema` | Определения столбцов файла CSV в формате `column_name:type;column_name:type` |

### Шаг 4: Проверьте результат импорта {#step-4-verify-the-import-result-1}

```sql
SELECT * FROM test_hdfsload;
```

Ожидаемый вывод:

```text
mysql> select * from test_hdfsload;
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

---

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Import failure troubleshooting / parameter selection -->

### Вопрос 1: Как выбрать между HDFS Load и TVF? {#q1-how-do-i-choose-between-hdfs-load-and-tvf}

- Для больших объёмов данных, когда допустимо асинхронное выполнение, выбирайте **HDFS Load**.
- Для небольших объёмов данных, когда результат импорта нужен сразу или требуется совместить импорт с `INSERT INTO ... SELECT` для преобразования данных, выбирайте **TVF**.

### Вопрос 2: Какие основные параметры обязательны для подключения к HDFS? {#q2-what-are-the-common-required-parameters-for-connecting-to-hdfs}

- `fs.defaultFS`: адрес NameNode в HDFS. Обязательный параметр.
- `hadoop.username`: имя пользователя для доступа к HDFS. Обязательный параметр.
- Если включена аутентификация, например Kerberos, добавьте соответствующие настройки аутентификации.

### Вопрос 3: Как задать `csv_schema` в TVF? {#q3-how-should-csv_schema-be-written-in-tvf}

Используйте формат `column_name:type;column_name:type`, например `user_id:int;name:string;age:int`. Определение должно соответствовать фактическому порядку и типам столбцов в файле CSV.

### Вопрос 4: Что делать, если истекло время ожидания задания HDFS Load? {#q4-what-if-an-hdfs-load-job-times-out}

Измените значение `timeout` (в секундах) в `PROPERTIES`; значение по умолчанию составляет 3600. Для больших файлов увеличьте его при необходимости.

### Вопрос 5: Почему порядок данных в результате импорта отличается от порядка в исходном файле? {#q5-why-does-the-import-result-not-match-the-order-of-the-source-file}

Doris использует распределённый механизм хранения, и `SELECT *` по умолчанию не гарантирует порядок строк. Чтобы получить упорядоченный результат, явно добавьте `ORDER BY`.
