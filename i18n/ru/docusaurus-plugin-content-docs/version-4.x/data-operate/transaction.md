---
{
    "title": "Транзакции",
    "language": "ru",
    "description": "Транзакция представляет собой операцию, содержащую один или несколько операторов SQL. Эти операторы либо полностью выполняются успешно, либо полностью завершаются с ошибкой, образуя неделимую единицу работы."
}
---

Транзакция представляет собой операцию, содержащую один или несколько операторов SQL. Эти операторы либо полностью выполняются успешно, либо полностью завершаются с ошибкой, образуя неделимую единицу работы.

## Обзор {#overview}

Отдельный запрос или оператор DDL представляет собой неявную транзакцию. Транзакции из нескольких операторов, содержащие запросы или DDL, не поддерживаются. По умолчанию каждая отдельная операция записи представляет собой неявную транзакцию, а несколько операций записи можно объединить в явную транзакцию. В настоящее время Doris не поддерживает вложенные транзакции.

### Явная транзакция {#explicit-transaction}

Явная транзакция требует, чтобы пользователь самостоятельно начинал, фиксировал или откатывал её. Операторы DDL и запросы внутри такой транзакции в настоящее время не поддерживаются.

```sql
BEGIN; 
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```

### Неявная транзакция {#implicit-transaction}

При неявной транзакции пользователь не добавляет явные операторы начала и фиксации транзакции до и после выполняемого оператора SQL или набора операторов.

В Doris, за исключением [Group Commit](./import/load-best-practices/group-commit-manual.md), каждый оператор загрузки открывает транзакцию в начале своего выполнения. После успешного выполнения оператора транзакция автоматически фиксируется, а при ошибке автоматически откатывается. Каждый запрос или оператор DDL также представляет собой неявную транзакцию.

### Уровень изоляции {#isolation-level}
Единственный уровень изоляции, который в настоящее время поддерживает Doris, — READ COMMITTED. При уровне изоляции READ COMMITTED оператор видит только данные, зафиксированные до начала его выполнения; незафиксированные данные ему недоступны.

В начале выполнения отдельного оператора создаётся снимок таблиц, к которым он обращается. Таким образом, отдельный оператор видит только результаты фиксации других транзакций, завершившихся до его запуска; результаты фиксации других транзакций во время выполнения оператора ему недоступны.

Если оператор выполняется внутри транзакции из нескольких операторов:

* Он видит только данные, зафиксированные до начала его выполнения. Если другая транзакция фиксируется между первым и вторым операторами, два последовательных оператора одной транзакции могут видеть разные данные.
* В настоящее время он не видит изменения, внесённые предыдущими операторами той же транзакции.

### Без потерь и дублирования {#no-loss-no-duplication}

Doris предоставляет два механизма для записи без потерь и дублирования. Механизм Label гарантирует отсутствие дублирования в пределах одной транзакции, а двухфазная фиксация позволяет координировать предотвращение дублирования между несколькими транзакциями.

#### Механизм Label {#label-mechanism}

Для транзакции или загрузки Doris можно задать Label. Обычно это определяемая пользователем строка, имеющая смысл в контексте бизнес-логики; если она не задана, генерируется внутренняя строка UUID. Основное назначение Label заключается в однозначной идентификации транзакции или задания загрузки и обеспечении того, чтобы транзакции или загрузки с одинаковым Label успешно выполнялись только один раз. Механизм Label гарантирует, что загружаемые данные не будут потеряны или продублированы. Если вышестоящий источник данных гарантирует семантику At-Least-Once, то совместно с механизмом Label в Doris можно обеспечить семантику Exactly-Once. Label уникален в пределах базы данных.

Doris удаляет Label с учётом времени хранения и количества. По умолчанию удаление запускается, когда количество Label превышает 2000; кроме того, по умолчанию удаляются Label старше 3 дней. После удаления Label операция с тем же именем Label может снова успешно выполниться, то есть семантика дедупликации больше не действует.

Обычно Label задаётся в формате `business logic + time`, например `my_business1_20220330_125000`. Такое значение Label обычно обозначает пакет данных, сформированный бизнес-процессом `my_business1` в `2022-03-30 12:50:00`. При такой схеме Label бизнес-приложение может запрашивать состояние задания загрузки по Label и однозначно определять, были ли данные за этот пакет и момент времени уже успешно загружены. Если нет, загрузку можно повторить с тем же Label.

#### StreamLoad 2PC {#streamload-2pc}

[StreamLoad 2PC](#stream-load-2pc) используется главным образом для обеспечения семантики EOS при записи из Flink в Doris.

## Операции с явными транзакциями {#explicit-transaction-operations}

### Начало транзакции {#begin-a-transaction}

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```

Если этот оператор выполняется, когда в текущем сеансе Session уже открыта транзакция, Doris игнорирует его. Иными словами, транзакции не могут быть вложенными.

### Фиксация транзакции {#commit-a-transaction}

```sql 
COMMIT;
```

Этот оператор фиксирует все изменения, внесённые в текущей транзакции.

### Откат транзакции {#roll-back-a-transaction}

```sql
ROLLBACK;
```

Этот оператор отменяет все изменения в текущей транзакции.

Транзакция действует на уровне сеанса Session. Если сеанс Session прерывается или закрывается, транзакция также автоматически откатывается.

## Запись с помощью нескольких операторов SQL {#writing-multiple-sql-statements}

В настоящее время Doris поддерживает два способа записи в рамках транзакции.

### Несколько операций записи `INSERT INTO VALUES` в одну таблицу {#multiple-insert-into-values-writes-to-a-single-table}

Предположим, что таблица имеет следующую структуру:

```sql
CREATE TABLE `dt` (
    `id` INT(11) NOT NULL,
    `name` VARCHAR(50) NULL,
    `score` INT(11) NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

Запишем данные:

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.01 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt (id, name, score) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':'10013'}

mysql> INSERT INTO dt VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);
Query OK, 5 rows affected (0.00 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':'10013'}

mysql> COMMIT;
Query OK, 0 rows affected (1.02 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'VISIBLE', 'txnId':'10013'}
```

Этот способ записи обеспечивает атомарность и повышает производительность записи через `INSERT INTO VALUES` в Doris.

Если пользователь включает одновременно `Group Commit` и транзакционную запись, применяется транзакционная запись.

### Несколько операций записи `INSERT INTO SELECT`, `UPDATE` и `DELETE` в разные таблицы {#multiple-insert-into-select-update-and-delete-writes-across-tables}

Предположим, что существуют три таблицы `dt1`, `dt2` и `dt3` с той же схемой, что и выше. Они содержат следующие данные:

```sql
mysql> SELECT * FROM dt1;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    60 |
|    5 | Ava       |    17 |
+------+-----------+-------+
5 rows in set (0.04 sec)

mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
|    9 | Emma    |    37 |
|   10 | Liam    |    64 |
+------+---------+-------+
5 rows in set (0.03 sec)

mysql> SELECT * FROM dt3;
Empty set (0.03 sec)
```

Выполним транзакционную запись, которая загружает данные из `dt1` и `dt2` в `dt3`, одновременно обновляя оценки в таблице `dt1` и удаляя данные из таблицы `dt2`:

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':''}

# The status of the load task is PREPARE
mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11024'}

mysql> INSERT INTO dt3 SELECT * FROM dt2;
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11025'}

mysql> UPDATE dt1 SET score = score + 10 WHERE id >= 4;
Query OK, 2 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11026'}

mysql> DELETE FROM dt2 WHERE id >= 9;
Query OK, 0 rows affected (0.01 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11027'}

mysql> COMMIT;
Query OK, 0 rows affected (0.03 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'VISIBLE', 'txnId':'11024'}
```

Запросим данные:

```sql
# Scores for rows with id >= 4 are increased by 10
mysql> SELECT * FROM dt1;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    70 |
|    5 | Ava       |    27 |
+------+-----------+-------+
5 rows in set (0.01 sec)

# Rows with id >= 9 are deleted
mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
+------+---------+-------+
3 rows in set (0.02 sec)

# The committed data from dt1 and dt2 is written into dt3
mysql> SELECT * FROM dt3;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    60 |
|    5 | Ava       |    17 |
|    6 | William   |    69 |
|    7 | Sophia    |    32 |
|    8 | James     |    64 |
|    9 | Emma      |    37 |
|   10 | Liam      |    64 |
+------+-----------+-------+
10 rows in set (0.01 sec)
```

#### Уровень изоляции {#isolation-level-1}

Транзакционная запись в Doris обеспечивает уровень изоляции `READ COMMITTED`. Обратите внимание на следующие два момента:

* В транзакции из нескольких операторов каждый оператор читает данные, зафиксированные к моменту начала его выполнения. Например:

    ```sql
     timestamp | ------------ Session 1 ------------  |  ------------ Session 2 ------------
       t1      | BEGIN;                               | 
       t2      | # read n rows from dt1 table         |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t3      |                                      | # write 2 rows to dt1 table
               |                                      | INSERT INTO dt1 VALUES(...), (...);
       t4      | # read n + 2 rows from dt1 table     |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t5      | COMMIT;                              |
    ```

* В транзакции из нескольких операторов каждый оператор не может прочитать изменения, внесённые другими операторами той же транзакции. Например:

    Предположим, что до начала транзакции таблица `dt1` содержит 5 строк, таблица `dt2` содержит 5 строк, а таблица `dt3` пуста. Следующая схема показывает структуру транзакции (исполняемый скрипт, который сначала создаёт таблицы и загружает исходные строки, приведён ниже в конкретном примере):

    ```sql
    BEGIN;
    # 5 rows are written into dt2; after the transaction commits, dt2 has 10 rows in total
    INSERT INTO dt2 SELECT * FROM dt1;
    # 5 rows are written into dt3; the rows newly written to dt2 in the previous step cannot be read here
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```

    Конкретный пример, который можно выполнить целиком:

    ```sql
    # Create tables and write data
    CREATE TABLE `dt1` (
        `id` INT(11) NOT NULL,
        `name` VARCHAR(50) NULL,
        `score` INT(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );
    CREATE TABLE dt2 LIKE dt1;
    CREATE TABLE dt3 LIKE dt1;
    INSERT INTO dt1 VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
    INSERT INTO dt2 VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);

    # Transactional writes
    BEGIN;
    INSERT INTO dt2 SELECT * FROM dt1;
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;

    # Query
    mysql> SELECT * FROM dt2;
    +------+-----------+-------+
    | id   | name      | score |
    +------+-----------+-------+
    |    6 | William   |    69 |
    |    7 | Sophia    |    32 |
    |    8 | James     |    64 |
    |    9 | Emma      |    37 |
    |   10 | Liam      |    64 |
    |    1 | Emily     |    25 |
    |    2 | Benjamin  |    35 |
    |    3 | Olivia    |    28 |
    |    4 | Alexander |    60 |
    |    5 | Ava       |    17 |
    +------+-----------+-------+
    10 rows in set (0.01 sec)

    mysql> SELECT * FROM dt3;
    +------+---------+-------+
    | id   | name    | score |
    +------+---------+-------+
    |    6 | William |    69 |
    |    7 | Sophia  |    32 |
    |    8 | James   |    64 |
    |    9 | Emma    |    37 |
    |   10 | Liam    |    64 |
    +------+---------+-------+
    5 rows in set (0.01 sec)
    ```

#### Операторы, завершившиеся с ошибкой в транзакции {#failed-statements-in-a-transaction}

Если оператор в транзакции завершается с ошибкой, соответствующая операция уже автоматически откатывается. Однако другие операторы транзакции, выполненные успешно, по-прежнему можно зафиксировать или откатить. После успешной фиксации транзакции изменения, внесённые успешно выполненными операторами, вступают в силу.

Например:

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':'11058'}

# A failed write is automatically rolled back
mysql> INSERT INTO dt3 SELECT * FROM dt2;
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=http://172.21.16.12:9082/api/_load_error_log?file=__shard_3/error_log_insert_stmt_3d1fed266ce443f2-b54d2609c2ea6b11_3d1fed266ce443f2_b54d2609c2ea6b11

mysql> INSERT INTO dt3 SELECT * FROM dt2 WHERE id = 7;
Query OK, 1 row affected (0.07 sec)

mysql> COMMIT;
Query OK, 0 rows affected (0.02 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'VISIBLE', 'txnId':'11058'}
```

Выполним запрос:

```sql
# The data from dt1 is written into dt3, the row with id = 7 from dt2 is written successfully, and the other writes failed
mysql> SELECT * FROM dt3;
+------+----------+-------+
| id   | name     | score |
+------+----------+-------+
|    1 | Emily    |    25 |
|    2 | Benjamin |    35 |
|    3 | Olivia   |    28 |
|    4 | Alexander |    60 |
|    5 | Ava      |    17 |
|    7 | Sophia   |    32 |
+------+----------+-------+
6 rows in set (0.01 sec)
```

#### Распространённые проблемы {#common-issues}

* Все таблицы, в которые выполняется запись, должны принадлежать одной базе данных, иначе возникнет ошибка `Transaction insert must be in the same database`.

* Два режима транзакционной записи, `INSERT INTO SELECT` / `UPDATE` / `DELETE` и `INSERT INTO VALUES`, нельзя смешивать, иначе возникнет ошибка `Transaction insert can not insert into values and insert into select at the same time`.

* [Операция удаления](delete/delete-manual.md) предоставляет два способа удаления: по предикату и с помощью предложения Using. Для сохранения уровня изоляции удаление из таблицы внутри транзакции должно выполняться до записи в ту же таблицу; иначе возникнет ошибка `Can not delete because there is a insert operation for the same table`.

* Если загрузка, начатая с `BEGIN`, превышает время ожидания, настроенное в Doris, транзакция откатывается, а загрузка завершается с ошибкой. В качестве текущего времени ожидания используется максимальное из значений переменных сеанса Session `insert_timeout` и `query_timeout`.

* При подключении к Doris через JDBC для выполнения транзакционных операций добавьте `useLocalSessionState=true` в URL JDBC; иначе может возникнуть ошибка `This is in a transaction, only insert, update, delete, commit, rollback is acceptable.`.

## Stream Load 2PC {#stream-load-2pc}

**1. Задайте `two_phase_commit:true` в заголовке HTTP, чтобы включить двухфазную фиксацию.**

```shell
curl  --location-trusted -u user:passwd -H "two_phase_commit:true" -T test.txt http://fe_host:http_port/api/{db}/{table}/_stream_load
{
    "TxnId": 18036,
    "Label": "55c8ffc9-1c40-4d51-b75e-f2265b3602ef",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 100,
    "NumberLoadedRows": 100,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 1031,
    "LoadTimeMs": 77,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 58,
    "CommitAndPublishTimeMs": 0
}
```

**2. Инициируйте операцию фиксации транзакции (запрос можно отправить на FE или BE).**

- Транзакцию можно указать по её идентификатору:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```

- Транзакцию также можно указать по Label:

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```

**3. Инициируйте операцию прерывания транзакции (запрос можно отправить на FE или BE).**

- Транзакцию можно указать по её идентификатору:

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- Транзакцию также можно указать по Label:

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

## Транзакции Broker Load для нескольких таблиц {#broker-load-multi-table-transactions}

Все задания загрузки Broker Load применяются атомарно. Для загрузок в несколько таблиц в рамках одного задания также гарантируется атомарность. Механизм Label также позволяет обеспечить загрузку данных без потерь и дублирования.

В следующем примере данные загружаются из HDFS: подстановочные символы используются для выбора двух групп файлов и их загрузки в две таблицы.

```sql
LOAD LABEL example_db.label2
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
    INTO TABLE `my_table1`
    PARTITION (p1)
    COLUMNS TERMINATED BY ","
    (k1, tmp_k2, tmp_k3)
    SET (
        k2 = tmp_k2 + 1,
        k3 = tmp_k3 + 1
    )
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
    INTO TABLE `my_table2`
    COLUMNS TERMINATED BY ","
    (k1, k2, k3)
)
WITH BROKER hdfs
(
    "username"="hdfs_user",
    "password"="hdfs_password"
);
```

Подстановочные символы используются для выбора и загрузки двух групп файлов, `file-10*` и `file-20*`, в две таблицы, `my_table1` и `my_table2`, соответственно. При этом данные для `my_table1` загружаются в раздел `p1`, а значения второго и третьего столбцов исходного файла перед загрузкой увеличиваются на 1.
