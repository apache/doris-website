---
{
    "title": "Локальные файлы",
    "language": "ru",
    "description": "Руководство по импорту локальных файлов в Apache Doris: импорт локальных файлов CSV, JSON, Parquet и ORC в Doris с помощью Stream Load, Streamloader или MySQL Load.",
    "keywords": [
        "импорт локальных файлов в Doris",
        "Stream Load",
        "Streamloader",
        "MySQL Load",
        "LOAD DATA LOCAL INFILE",
        "импорт CSV",
        "импорт локальных данных"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import local files or client-side local data into Apache Doris -->

В этом документе описано, как импортировать данные из локальных файлов в Apache Doris. Doris предоставляет три способа импорта локальных файлов. Выберите подходящий способ с учётом объёма данных, количества файлов и клиентского окружения.

## Выбор способа {#choosing-a-method}

В следующей таблице приведены характеристики и области применения трёх способов локального импорта, чтобы помочь вам быстро выбрать подходящий вариант:

| Способ импорта | Протокол/основа | Синхронный/асинхронный | Поддерживаемые форматы | Типичные сценарии | Справка |
|---------|----------|----------|---------|---------|---------|
| **Stream Load** | HTTP | Синхронный | CSV, JSON, Parquet, ORC | Один файл, импорт с помощью скриптов | [Stream Load](../import-way/stream-load-manual.md) |
| **Streamloader** | На основе Stream Load | Синхронный | CSV, JSON, Parquet, ORC | Несколько файлов, параллельный импорт больших объёмов данных | [Streamloader](../../../connection-integration/data-integration/doris-streamloader) |
| **MySQL Load** | Протокол MySQL | Синхронный | CSV | Импорт локальных файлов CSV через клиент MySQL | [MySQL Load](../import-way/mysql-load-manual.md) |

Краткое описание каждого способа:

- **Stream Load**: импортирует локальные файлы или потоки данных в Doris по HTTP. Результат импорта возвращается сразу после выполнения. По возвращаемому значению можно определить, завершился ли импорт успешно.
- **Streamloader**: официальный клиентский инструмент Doris на основе Stream Load. Поддерживает параллельный импорт нескольких файлов, что позволяет значительно сократить время импорта больших объёмов данных.
- **MySQL Load**: совместим со стандартным синтаксисом MySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) и используется главным образом для импорта локальных файлов CSV через клиент MySQL.

## Импорт с помощью Stream Load {#import-using-stream-load}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data}

Создайте файл CSV `streamload_example.csv` со следующим содержимым:

```SQL
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

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database}

Создайте целевую таблицу в Doris, используя следующий синтаксис:

```SQL
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Импортируйте данные с помощью Stream Load {#step-3-import-data-using-stream-load}

Отправьте задание импорта Stream Load с помощью `curl`:

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

Stream Load выполняет импорт синхронно, и результат импорта возвращается непосредственно пользователю:

```SQL
{
    "TxnId": 3,
    "Label": "123",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 118,
    "LoadTimeMs": 173,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 70,
    "ReadDataTimeMs": 2,
    "WriteDataTimeMs": 48,
    "CommitAndPublishTimeMs": 52
}
```

### Шаг 4: Проверьте импортированные данные {#step-4-check-the-imported-data}

```SQL
select count(*) from testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Импорт с помощью инструмента Streamloader {#import-using-the-streamloader-tool}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-1}

Создайте файл CSV `streamloader_example.csv` со следующим содержимым:

```SQL
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

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database-1}

Создайте целевую таблицу в Doris, используя следующий синтаксис:

```SQL
CREATE TABLE testdb.test_streamloader(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Шаг 3: Импортируйте данные с помощью инструмента Streamloader {#step-3-import-data-using-the-streamloader-tool}

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamloader"
```

Этот способ выполняет импорт синхронно, и результат импорта возвращается непосредственно пользователю:

```SQL
Load Result: {
        "Status": "Success",
        "TotalRows": 10,
        "FailLoadRows": 0,
        "LoadedRows": 10,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 118,
        "LoadTimeMs": 623,
        "LoadFiles": [
                "streamloader_example.csv"
        ]
}
```

### Шаг 4: Проверьте импортированные данные {#step-4-check-the-imported-data-1}

```SQL
select count(*) from testdb.test_streamloader;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Импорт локальных данных с помощью MySQL Load {#import-local-data-using-mysql-load}

### Шаг 1: Подготовьте данные {#step-1-prepare-the-data-2}

Создайте файл с именем `client_local.csv`, содержащий следующие примеры данных:

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### Шаг 2: Создайте таблицу в базе данных {#step-2-create-a-table-in-the-database-2}

Перед выполнением команды `LOAD DATA` сначала подключитесь с помощью клиента MySQL:

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

Для корректной работы MySQL Load при подключении необходимо указать следующие параметры:

1. При подключении с помощью клиента MySQL необходимо добавить параметр `--local-infile`, иначе может возникнуть ошибка.
2. При подключении через JDBC укажите `allowLoadLocalInfile=true` в URL.

Затем создайте целевую таблицу в Doris:

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### Шаг 3: Импортируйте данные с помощью MySQL Load {#step-3-import-data-using-mysql-load}

После подключения с помощью клиента MySQL создайте задание импорта следующей командой:

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### Шаг 4: Проверьте импортированные данные {#step-4-check-the-imported-data-2}

MySQL Load выполняет импорт синхронно. После завершения импорта результат возвращается пользователю в командной строке. Если импорт завершился неудачно, отображается конкретное сообщение об ошибке.

Ниже приведён результат успешного импорта с указанием количества импортированных строк:

```SQL
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

## Часто задаваемые вопросы (FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting failures of local file imports -->

**Вопрос 1: Как выбрать один из трёх способов импорта?**

- Для одного файла или импорта с помощью скриптов выберите Stream Load.
- Для нескольких файлов с большим объёмом данных, когда нужно ускорить импорт за счёт параллельного выполнения, выберите Streamloader.
- Если вы уже используете клиент MySQL и вам нужно импортировать локальный файл CSV, выберите MySQL Load.

**Вопрос 2: При выполнении MySQL Load возникает ошибка `The used command is not allowed with this MySQL version`.**

Проверьте следующие два пункта:

1. Добавлен ли параметр `--local-infile` при подключении через командную строку MySQL.
2. Добавлен ли параметр `allowLoadLocalInfile=true` в URL при подключении через JDBC.

**Вопрос 3: Какие форматы данных поддерживает Stream Load?**

Поддерживаются четыре формата: CSV, JSON, Parquet и ORC. Параметр `format` можно указать в HTTP-заголовке.

**Вопрос 4: Как определить, завершился ли импорт Stream Load успешно?**

Проверьте поле `Status` в возвращённом результате: значение `Success` указывает на успешное выполнение. Также можно проверить поля `NumberLoadedRows` и `NumberFilteredRows`, чтобы уточнить количество импортированных и отфильтрованных строк.
