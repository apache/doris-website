---
{
    "title": "Импорт с помощью INSERT INTO SELECT",
    "language": "ru",
    "description": "INSERT INTO SELECT — способ синхронного импорта в Doris. Он поддерживает ETL между таблицами, импорт из внешних таблиц через Multi-Catalog и импорт файлов через TVF, обеспечивая атомарность импорта.",
    "keywords": [
        "INSERT INTO SELECT",
        "импорт данных в Doris",
        "синхронный импорт",
        "импорт через Multi-Catalog",
        "импорт через TVF",
        "ETL-преобразование",
        "атомарность транзакции",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data import / ETL transformation / External data source integration -->

INSERT INTO позволяет импортировать результат запроса Doris в другую таблицу. Это способ **синхронного импорта**: результат возвращается сразу после выполнения, и по возвращённому значению можно определить, прошёл ли импорт успешно. INSERT INTO гарантирует **атомарность** задачи импорта: либо все данные импортируются, либо не импортируется ничего.

## Сценарии использования {#use-cases}

INSERT INTO SELECT в основном используется в трёх сценариях:

| Сценарий | Описание |
| --- | --- |
| ETL-преобразование между таблицами | Преобразовать данные из таблицы Doris с помощью ETL и записать их в другую таблицу Doris. |
| Импорт данных из внешних таблиц | Подключить таблицы внешних систем, таких как MySQL или Hive, через Multi-Catalog, а затем импортировать данные из них в таблицу Doris с помощью INSERT INTO SELECT. |
| Прямой импорт файлов | Использовать Table Value Function (TVF), чтобы запрашивать файлы в объектном хранилище или HDFS как таблицу с автоматическим определением типов столбцов, а затем записать результат в таблицу Doris. |

## Основные принципы {#basic-principles}

INSERT INTO отправляет задачу импорта на узел FE по протоколу MySQL. Выполнение происходит следующим образом:

1. FE получает SQL и создаёт план выполнения. В начале плана находятся операторы запроса, а последним идёт оператор `OlapTableSink`, который записывает результат запроса в целевую таблицу.
2. План выполнения передаётся узлам BE.
3. Doris выбирает один из узлов BE в качестве узла Coordinator. Он принимает данные и распределяет их между другими узлами BE.

## Быстрый старт {#quick-start}

Команда INSERT INTO отправляется и передаётся по протоколу MySQL. В следующих примерах весь процесс показан с использованием командной строки MySQL.

Подробный синтаксис см. в справке по [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Предварительные условия {#prerequisites}

Перед выполнением команды у вас должно быть право `INSERT` для целевой таблицы. Если его нет, предоставьте его с помощью команды [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO).

### Создание задачи импорта {#create-an-import-job}

**Шаг 1. Создайте исходную таблицу**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Шаг 2. Импортируйте данные в исходную таблицу (на примере INSERT INTO VALUES)**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**Шаг 3. Создайте целевую таблицу (с той же схемой, что и исходная)**

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**Шаг 4. Импортируйте данные в целевую таблицу с помощью INSERT INTO SELECT**

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

**Шаг 5. Просмотрите результат импорта**

```sql
MySQL> SELECT * FROM testdb.test_table2 ORDER BY age;
+---------+--------+------+
| user_id | name   | age  |
+---------+--------+------+
|       5 | Ava    |   17 |
|       1 | Emily  |   25 |
|       3 | Olivia |   28 |
+---------+--------+------+
3 rows in set (0.02 sec)
```

**Дополнительные возможности:**

- Для асинхронного выполнения INSERT можно использовать [JOB](../../../admin-manual/workload-management/job-scheduler).
- Источником данных может быть [TVF](../../../lakehouse/file-analysis.md) или таблица в [Catalog](../../../lakehouse/catalog-overview).

### Просмотр задач импорта {#view-import-jobs}

Для просмотра завершённых задач INSERT INTO используйте команду `SHOW LOAD`:

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### Отмена задачи импорта {#cancel-an-import-job}

Выполняющуюся задачу INSERT INTO можно отменить с помощью `Ctrl-C`.

## Справка {#reference}

### Команда импорта {#import-command}

INSERT INTO SELECT сохраняет результат запроса в целевой таблице. Основной синтаксис:

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

Оператор SELECT используется так же, как в обычном запросе, и может включать `WHERE`, `JOIN` и другие операции.

### Параметры настройки импорта {#import-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

**Параметры конфигурации FE**

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400 (4 часа) | Время ожидания задачи импорта в секундах. Если задача не завершается за это время, система отменяет её, а статус меняется на `CANCELLED`. |

**Переменные сеанса**

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| insert_timeout | 14400 (4 часа) | Время ожидания выполнения INSERT INTO как SQL-оператора, в секундах. |
| enable_insert_strict | true | Если установлено значение true, при обнаружении любых данных, не соответствующих требованиям, импорт завершается ошибкой. Если установлено значение false, такие строки игнорируются, а импорт считается успешным, если хотя бы одна строка импортирована правильно. В версии 2.1.4 и более ранних версиях INSERT INTO не позволяет управлять долей ошибок: с помощью этого параметра можно только включить строгую проверку или полностью игнорировать ошибочные данные. Частые причины несоответствия данных: длина исходного столбца превышает длину целевого, типы столбцов не совпадают, разделы не совпадают или нарушен порядок столбцов. |
| insert_max_filter_ratio | 1.0 | Поддерживается начиная с версии 2.1.5. Действует только при `enable_insert_strict = false`. Задаёт максимально допустимую долю отфильтрованных строк для `INSERT INTO ... VALUES` и `INSERT INTO ... SELECT`, в том числе при чтении из таблиц Doris, внешних таблиц и файловых TVF для S3, HDFS и LOCAL. Диапазон значений — от 0 до 1; значение по умолчанию — 1.0. INSERT завершается ошибкой, если `filtered_rows / (loaded_rows + filtered_rows)` превышает заданное значение. Значение 1.0 допускает фильтрацию всех строк, но не подавляет другие ошибки выполнения. |

### Возвращаемые значения импорта {#import-return-values}

INSERT INTO — SQL-оператор. В зависимости от результата запроса его возвращаемое значение относится к одному из трёх случаев:

#### Пустой набор результатов {#empty-result-set}

Если набор результатов предложения SELECT пуст, возвращается следующее:

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK` означает, что выполнение прошло успешно.
- `0 rows affected` означает, что данные не были импортированы.

#### Непустой набор результатов и успешное выполнение INSERT {#non-empty-result-set-with-successful-insert}

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'INSERT_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 WITH LABEL my_label1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
```

Описание полей:

- `Query OK`: выполнение прошло успешно.
- `4 rows affected`: всего импортировано 4 строки.
- `2 warnings`: количество отфильтрованных строк.

Также возвращается строка JSON:

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

Поля возвращаемого значения описаны ниже:

| Параметр | Описание |
| -------- | ---- |
| TxnId    | Идентификатор транзакции импорта. |
| Label    | Метка задачи импорта. Её можно указать с помощью `INSERT INTO tbl WITH LABEL label ...`. |
| Status   | Показывает, видны ли импортированные данные:<p>- `visible`: импорт прошёл успешно, данные видны.</p><p>- `committed`: импорт завершён; данные могут стать видны с задержкой, повторять попытку не нужно.</p><p>- `Label Already Exists`: метка уже существует, нужно выбрать другую.</p><p>- `Fail`: импорт завершился ошибкой.</p> |
| Err      | Сообщение об ошибке импорта. |

Чтобы просмотреть отфильтрованные строки, используйте оператор [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD):

```sql
SHOW LOAD WHERE label="xxx";
```

Поле `URL` в возвращаемом значении позволяет получить данные об ошибках. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

Состояние `committed` временное: данные гарантированно станут видны. Проверить их видимость можно с помощью оператора [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION):

```sql
SHOW TRANSACTION WHERE id=4005;
```

Когда столбец `TransactionStatus` в возвращаемом значении содержит `visible`, данные видны.

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### Непустой набор результатов и ошибка выполнения INSERT {#non-empty-result-set-with-failed-insert}

Ошибка означает, что данные не были импортированы. Возвращается следующее:

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`: причина ошибки.
- Возвращённый URL позволяет получить данные об ошибках. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

## Рекомендации {#best-practices}

### Импорт больших объёмов данных {#importing-large-volumes-of-data}

INSERT INTO не ограничивает объём данных и поддерживает импорт больших объёмов. Однако при большом объёме необходимо настроить время ожидания так, чтобы выполнялось условие:

> Время ожидания импорта >= Объём данных / Ожидаемая скорость импорта

Можно настроить два параметра:

1. Параметр конфигурации FE `insert_load_default_timeout_second`.
2. Переменную сеанса `insert_timeout`.

### Просмотр строк с ошибками {#view-error-rows}

<!-- Knowledge type: Troubleshooting -->

Если возвращаемое значение INSERT INTO содержит поле `url`, просмотреть строки с ошибками можно следующей командой:

```sql
SHOW LOAD WARNINGS ON "url";
```

Пример:

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**Распространённые причины ошибок:**

- Длина исходного столбца превышает длину целевого.
- Типы столбцов не совпадают.
- Разделы не совпадают.
- Нарушен порядок столбцов.

Переменная сеанса `enable_insert_strict` позволяет задать, будет ли INSERT INTO игнорировать строки с ошибками.

## Импорт данных из внешней таблицы через Multi-Catalog {#importing-external-table-data-via-multi-catalog}

<!-- Applicable scenarios: External data source integration -->

Функция Multi-Catalog позволяет Doris подключаться к распространённым озёрам данных и базам данных, таким как Apache Hive, Apache Iceberg, Apache Hudi, Apache Paimon (Incubating), Elasticsearch, MySQL, Oracle и SQL Server. После создания внешней таблицы её данные можно импортировать с помощью `INSERT INTO SELECT` или запрашивать напрямую с помощью `SELECT`.

Подробнее о Multi-Catalog см. в документации по lakehouse. Следующий пример показывает процесс импорта из внешней таблицы Hive.

### Шаг 1. Создайте Hive Catalog {#step-1-create-a-hive-catalog}

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### Шаг 2. Создайте целевую таблицу Doris {#step-2-create-the-doris-target-table}

```sql
CREATE TABLE `target_tbl` (
  `k1` decimal(9, 3) NOT NULL COMMENT "",
  `k2` char(10) NOT NULL COMMENT "",
  `k3` datetime NOT NULL COMMENT "",
  `k5` varchar(20) NOT NULL COMMENT "",
  `k6` double NOT NULL COMMENT ""
)
COMMENT "Doris Table"
DISTRIBUTED BY HASH(k1) BUCKETS 2
PROPERTIES (
    "replication_num" = "1"
);
```

Подробные сведения о создании таблиц см. в справке по синтаксису [CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE).

### Шаг 3. Выполните импорт {#step-3-execute-the-import}

Импортируйте данные из таблицы `hive.db1.source_tbl` в таблицу `target_tbl`:

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT — синхронная команда. Если она возвращает успешный результат, импорт прошёл успешно.

### Примечания {#notes}

- Убедитесь, что внешний источник данных и кластер Doris могут обмениваться данными по сети, особенно узлы BE и внешний источник.

## Импорт файлов через TVF {#importing-file-data-via-tvf}

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

С помощью Table Value Function (TVF) Doris может напрямую запрашивать и анализировать файлы в объектном хранилище или HDFS как таблицу, автоматически определять типы столбцов и импортировать несколько файлов. Подробнее см. в [документации по lakehouse и TVF](../../../lakehouse/file-analysis).

TVF поддерживает в путях к файлам подстановочные символы (`*`, `?`, `[...]`) и шаблоны диапазонов (`{1..10}`). Полный синтаксис см. в разделе [Шаблоны путей к файлам](../../../sql-manual/basic-element/file-path-pattern).

### Автоматическое определение типов столбцов файла {#automatic-file-column-type-inference}

На примере S3 TVF сначала проверьте схему файла с помощью `DESC FUNCTION`:

```Plain
DESC FUNCTION s3 (
    "URI" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

Примечания:

- В примере указаны путь к файлу, параметры подключения и данные для аутентификации.
- Схему файла можно просмотреть с помощью `DESC FUNCTION`.
- Для файлов Parquet Doris автоматически определяет типы столбцов по метаданным файла.
- В настоящее время Doris поддерживает анализ и определение типов столбцов для форматов Parquet, ORC, CSV и JSON.

### Импорт с помощью INSERT INTO SELECT {#importing-with-insert-into-select}

```Plain
// 1. Create a Doris internal table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. Insert data using the S3 Table Value Function
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true");
```

### Примечания {#notes-1}

- Если URI, указанный для TVF `S3 / hdfs`, не соответствует ни одному файлу или все найденные файлы пусты, TVF возвращает пустой набор результатов. В этом случае `DESC FUNCTION` при просмотре схемы возвращает один фиктивный столбец `__dummy_col`, который можно игнорировать.
- Если для TVF задан формат CSV и возникает ошибка `The first line is empty, can not parse column numbers`, это означает, что схему не удалось определить по первой строке файла.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**Вопрос 1. INSERT INTO выполняется синхронно или асинхронно?**

По умолчанию INSERT INTO выполняется **синхронно** и возвращает результат сразу после выполнения. Для асинхронного выполнения можно использовать [JOB](../../../admin-manual/workload-management/job-scheduler).

**Вопрос 2. Будет ли часть данных записана, если INSERT INTO завершится ошибкой?**

Нет. INSERT INTO гарантирует **атомарность**: либо все данные импортируются, либо не импортируется ничего.

**Вопрос 3. Что делать при превышении времени ожидания импорта?**

Настройте следующие два параметра так, чтобы выполнялось условие `Import timeout >= Data volume / Estimated import speed`:

- Конфигурация FE: `insert_load_default_timeout_second`
- Переменная сеанса: `insert_timeout`

**Вопрос 4. Как настроить допустимую долю ошибочных данных?**

- `enable_insert_strict = true`: при обнаружении любых данных, не соответствующих требованиям, импорт немедленно завершается ошибкой.
- `enable_insert_strict = false`: строки, не соответствующие требованиям, игнорируются (версия 2.1.4 и более ранние).
- Начиная с версии 2.1.5 допустимую долю ошибочных данных можно задавать с помощью `insert_max_filter_ratio` (параметр действует только при `enable_insert_strict = false`). Он применяется как к `INSERT INTO ... VALUES`, так и к `INSERT INTO ... SELECT`, включая чтение из таблиц Doris, внешних таблиц и файловых TVF.

**Вопрос 5. Что делать, если возвращён статус `committed`, а не `visible`?**

`committed` означает, что импорт завершён и данные гарантированно станут видны, поэтому повторять попытку не нужно. С помощью [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) можно проверить, изменился ли `TransactionStatus` на `visible`.

## Дополнительная справка {#more-help}

Подробный синтаксис INSERT INTO см. в справке по команде [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT). Дополнительную информацию также можно получить, введя `HELP INSERT` в командной строке клиента MySQL.
