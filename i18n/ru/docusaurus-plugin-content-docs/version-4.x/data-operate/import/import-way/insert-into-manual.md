---
{
    "title": "Insert Into Select",
    "language": "ru",
    "description": "INSERT INTO SELECT — это синхронный способ импорта в Doris. Он поддерживает ETL-преобразования между таблицами, импорт из внешних таблиц через Multi-Catalog и импорт файлов через TVF, гарантируя атомарность импорта.",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris data import",
        "synchronous import",
        "Multi-Catalog import",
        "TVF import",
        "ETL transformation",
        "transaction atomicity",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data import / ETL transformation / External data source integration -->

INSERT INTO позволяет импортировать результат запроса Doris в другую таблицу. Это **синхронный способ импорта**: результат возвращается сразу после выполнения, и по возвращаемому значению можно определить, завершился ли импорт успешно. INSERT INTO гарантирует **атомарность** задачи импорта: она либо выполняется полностью, либо полностью завершается с ошибкой.

## Сценарии использования {#use-cases}

INSERT INTO SELECT в основном используется в следующих трёх сценариях:

| Сценарий | Описание |
| --- | --- |
| ETL-преобразования между таблицами | Выполнение ETL-преобразований данных из таблицы Doris с записью в другую таблицу Doris. |
| Импорт данных из внешних таблиц | Подключение таблиц из внешних систем, таких как MySQL или Hive, через Multi-Catalog с последующим импортом внешних данных в таблицу Doris с помощью INSERT INTO SELECT. |
| Прямой импорт файлов | Использование Table Value Function (TVF) для запроса файлов в объектном хранилище или HDFS как таблицы с автоматическим определением типов столбцов и последующей записью результата в таблицу Doris. |

## Основные принципы {#basic-principles}

INSERT INTO отправляет задание импорта на узел FE по протоколу MySQL. Выполнение проходит следующим образом:

1. FE получает SQL и формирует план выполнения. Начальная часть плана состоит из операторов запроса, а последний оператор, `OlapTableSink`, записывает результат запроса в целевую таблицу.
2. План выполнения передаётся на узлы BE для выполнения.
3. Doris выбирает один BE в качестве узла Coordinator, который отвечает за получение данных и их распределение между другими узлами BE.

## Быстрый старт {#quick-start}

Команды INSERT INTO отправляются и передаются по протоколу MySQL. В следующих примерах весь процесс показан с помощью командной строки MySQL.

Подробное описание синтаксиса см. в разделе [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Предварительные требования {#prerequisites}

Перед выполнением необходимо иметь привилегию `INSERT` для целевой таблицы. Если её нет, её можно предоставить с помощью команды [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO).

### Создание задания импорта {#create-an-import-job}

**Шаг 1: создайте исходную таблицу**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Шаг 2: импортируйте данные в исходную таблицу (на примере INSERT INTO VALUES)**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**Шаг 3: создайте целевую таблицу (с той же схемой, что и у исходной таблицы)**

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**Шаг 4: используйте INSERT INTO SELECT для импорта в целевую таблицу**

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

**Шаг 5: просмотрите результат импорта**

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

**Расширенные возможности:**

- Для асинхронного выполнения INSERT можно использовать [JOB](../../../admin-manual/workload-management/job-scheduler).
- Источником данных может быть [TVF](../../../lakehouse/file-analysis.md) или таблица в [Catalog](../../../lakehouse/catalog-overview).

### Просмотр заданий импорта {#view-import-jobs}

Используйте команду `SHOW LOAD` для просмотра завершённых задач INSERT INTO:

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### Отмена задания импорта {#cancel-an-import-job}

Выполняющееся задание INSERT INTO можно отменить с помощью `Ctrl-C`.

## Справочная информация {#reference}

### Команда импорта {#import-command}

INSERT INTO SELECT сохраняет результат запроса в целевую таблицу. Базовый синтаксис:

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

Оператор SELECT не отличается от обычного запроса и может включать `WHERE`, `JOIN` и другие операции.

### Параметры настройки импорта {#import-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

**Параметры конфигурации FE**

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400 (4 часа) | Тайм-аут задачи импорта в секундах. Если задача не завершается за это время, система отменяет её, и статус меняется на `CANCELLED`. |

**Переменные сеанса**

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| insert_timeout | 14400 (4 часа) | Тайм-аут выполнения INSERT INTO как SQL-оператора в секундах. |
| enable_insert_strict | true | Если установлено значение true, импорт завершается с ошибкой при обнаружении любых данных, не соответствующих требованиям. Если установлено значение false, строки, не соответствующие требованиям, игнорируются, и импорт считается успешным, если хотя бы одна строка импортирована корректно. В версии 2.1.4 и более ранних версиях INSERT INTO не позволяет управлять допустимой долей ошибок; с помощью этого параметра можно только включить строгую проверку или полностью игнорировать ошибочные данные. Распространённые причины несоответствия данных: длина исходного столбца превышает длину целевого, несовпадение типов столбцов, несоответствие разделу и несовпадение порядка столбцов. |
| insert_max_filter_ratio | 1.0 | Поддерживается начиная с версии 2.1.5. Действует только тогда, когда `enable_insert_strict` имеет значение false. Управляет допустимой долей ошибок для `INSERT INTO FROM S3/HDFS/LOCAL()`. Значение по умолчанию 1.0 означает, что допускаются любые ошибки. Диапазон значений — от 0 до 1; задача INSERT завершается с ошибкой, если доля ошибочных строк превышает это значение. |

### Возвращаемые значения импорта {#import-return-values}

INSERT INTO является SQL-оператором, и в зависимости от результата запроса его возвращаемое значение соответствует одному из следующих трёх случаев:

#### Пустой набор результатов {#empty-result-set}

Если набор результатов SELECT пуст, возвращается следующий ответ:

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK` означает, что выполнение завершилось успешно.
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

- `Query OK`: выполнение завершилось успешно.
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
| Label    | Метка задания импорта. Её можно задать с помощью `INSERT INTO tbl WITH LABEL label ...`. |
| Status   | Показывает, видны ли импортированные данные:<p>- `visible`: импорт завершился успешно, данные видны.</p><p>- `committed`: импорт завершён; данные могут стать видимыми с некоторой задержкой, повторять импорт не требуется.</p><p>- `Label Already Exists`: метка уже существует, необходимо использовать другую метку.</p><p>- `Fail`: импорт завершился с ошибкой.</p> |
| Err      | Сообщение об ошибке импорта. |

Чтобы просмотреть отфильтрованные строки, используйте оператор [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD):

```sql
SHOW LOAD WHERE label="xxx";
```

Поле `URL` в возвращаемом значении позволяет получить ошибочные данные. См. раздел [Просмотр ошибочных строк](#view-error-rows) ниже.

Состояние `committed` является временным: гарантируется, что данные в конечном итоге станут видимыми. Проверить состояние видимости можно с помощью оператора [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION):

```sql
SHOW TRANSACTION WHERE id=4005;
```

Если столбец `TransactionStatus` в возвращаемом значении имеет значение `visible`, данные видны.

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### Непустой набор результатов и ошибка выполнения INSERT {#non-empty-result-set-with-failed-insert}

Ошибка означает, что никакие данные не были успешно импортированы. Возвращается следующий ответ:

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`: причина ошибки.
- Возвращённый URL позволяет получить ошибочные данные. См. раздел [Просмотр ошибочных строк](#view-error-rows) ниже.

## Рекомендации {#best-practices}

### Импорт больших объёмов данных {#importing-large-volumes-of-data}

INSERT INTO не ограничивает объём данных и поддерживает импорт больших объёмов. Однако при большом объёме данных необходимо настроить тайм-аут так, чтобы выполнялось условие:

> Тайм-аут импорта >= Объём данных / Расчётная скорость импорта

Можно настроить следующие два параметра:

1. Параметр конфигурации FE `insert_load_default_timeout_second`.
2. Переменная сеанса `insert_timeout`.

### Просмотр ошибочных строк {#view-error-rows}

<!-- Knowledge type: Troubleshooting -->

Если возвращаемое значение INSERT INTO содержит поле `url`, ошибочные строки можно просмотреть с помощью следующей команды:

```sql
SHOW LOAD WARNINGS ON "url";
```

Пример:

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**Распространённые причины ошибок:**

- Длина исходного столбца превышает длину целевого столбца.
- Несовпадение типов столбцов.
- Несоответствие разделу.
- Несовпадение порядка столбцов.

С помощью переменной сеанса `enable_insert_strict` можно управлять тем, будет ли INSERT INTO игнорировать ошибочные строки.

## Импорт данных внешних таблиц через Multi-Catalog {#importing-external-table-data-via-multi-catalog}

<!-- Applicable scenarios: External data source integration -->

Благодаря Multi-Catalog Doris поддерживает подключение к распространённым озёрам данных и базам данных, таким как Apache Hive, Apache Iceberg, Apache Hudi, Apache Paimon (Incubating), Elasticsearch, MySQL, Oracle и SQL Server. После создания внешней таблицы её данные можно импортировать с помощью `INSERT INTO SELECT` или запрашивать напрямую с помощью `SELECT`.

Подробнее о Multi-Catalog см. в документации по Lakehouse. Следующий пример с внешней таблицей Hive иллюстрирует процесс импорта.

### Шаг 1: создайте Catalog Hive {#step-1-create-a-hive-catalog}

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

### Шаг 2: создайте целевую таблицу Doris {#step-2-create-the-doris-target-table}

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

Подробные инструкции по созданию таблиц см. в справочнике по синтаксису [CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE).

### Шаг 3: выполните импорт {#step-3-execute-the-import}

Импортируйте данные из таблицы `hive.db1.source_tbl` в таблицу `target_tbl`:

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT — синхронная команда. Успешный ответ означает, что импорт завершился успешно.

### Примечания {#notes}

- Необходимо обеспечить сетевую связность между внешним источником данных и кластером Doris, особенно между узлами BE и внешним источником данных.

## Импорт данных из файлов через TVF {#importing-file-data-via-tvf}

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

С помощью Table Value Function (TVF) Doris может напрямую запрашивать и анализировать файлы в объектном хранилище или HDFS как таблицу, автоматически определять типы столбцов и импортировать несколько файлов. Подробнее см. в [документации Lakehouse / TVF](../../../lakehouse/file-analysis).

TVF поддерживает подстановочные символы (`*`, `?`, `[...]`) и шаблоны диапазонов (`{1..10}`) в путях к файлам. Полное описание синтаксиса см. в разделе [Шаблоны путей к файлам](../../../sql-manual/basic-element/file-path-pattern).

### Автоматическое определение типов столбцов файлов {#automatic-file-column-type-inference}

На примере TVF S3 сначала просмотрите схему файла с помощью `DESC FUNCTION`:

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

- В примере указаны путь к файлу, сведения о подключении и данные аутентификации.
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

- Если URI, указанный для TVF `S3 / hdfs`, не соответствует ни одному файлу или все найденные файлы пусты, TVF возвращает пустой набор результатов. В этом случае при просмотре схемы с помощью `DESC FUNCTION` возвращается единственный фиктивный столбец с именем `__dummy_col`, который можно игнорировать.
- Если для TVF указан формат CSV и возникает ошибка `The first line is empty, can not parse column numbers`, это означает, что не удалось определить схему по первой строке файла.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**Вопрос 1: INSERT INTO выполняется синхронно или асинхронно?**

По умолчанию INSERT INTO выполняется **синхронно** и возвращает результат сразу после выполнения. Для асинхронного выполнения его можно использовать вместе с [JOB](../../../admin-manual/workload-management/job-scheduler).

**Вопрос 2: Будет ли записана часть данных, если INSERT INTO завершится с ошибкой?**

Нет. INSERT INTO гарантирует **атомарность**: операция либо выполняется полностью, либо полностью завершается с ошибкой.

**Вопрос 3: Что делать при превышении тайм-аута импорта?**

Настройте следующие два параметра так, чтобы выполнялось условие `Import timeout >= Data volume / Estimated import speed`:

- Параметр конфигурации FE: `insert_load_default_timeout_second`
- Переменная сеанса: `insert_timeout`

**Вопрос 4: Как управлять допустимыми ошибками в данных?**

- `enable_insert_strict = true`: немедленно завершать импорт с ошибкой при обнаружении любых данных, не соответствующих требованиям.
- `enable_insert_strict = false`: игнорировать строки, не соответствующие требованиям (версия 2.1.4 и более ранние).
- Начиная с версии 2.1.5, можно использовать `insert_max_filter_ratio` (действует только при `enable_insert_strict = false`) для управления допустимой долей ошибок. Применяется только к `INSERT INTO FROM S3/HDFS/LOCAL()`.

**Вопрос 5: Что делать, если возвращается статус `committed`, а не `visible`?**

`committed` означает, что импорт завершён, и гарантируется, что данные в конечном итоге станут видимыми, поэтому повторять импорт не требуется. С помощью [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) можно проверить, изменилось ли значение `TransactionStatus` на `visible`.

## Дополнительная справка {#more-help}

Подробное описание синтаксиса INSERT INTO см. в справочнике по команде [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT). Для получения дополнительной справки также можно ввести `HELP INSERT` в командной строке клиента MySQL.
