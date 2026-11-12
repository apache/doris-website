---
{
    "title": "Миграция данных из других TP-систем",
    "language": "ru",
    "description": "Как перенести данные из OLTP-систем, таких как MySQL, SQL Server, Oracle и PostgreSQL, в Apache Doris, включая варианты офлайн-синхронизации и синхронизации в реальном времени.",
    "keywords": [
        "Миграция MySQL в Doris",
        "Миграция Oracle в Doris",
        "Миграция SQL Server в Doris",
        "Синхронизация PostgreSQL с Doris",
        "Миграция данных OLTP",
        "Flink CDC Doris",
        "JDBC Catalog",
        "синхронизация всей базы данных"
    ]
}
---

<!-- Knowledge type: Architecture selection decision / Operational steps -->
<!-- Applicable scenario: Migrating or synchronizing data from OLTP databases (MySQL / SQL Server / Oracle / PostgreSQL) to Apache Doris -->

В этом документе описывается перенос данных из традиционных транзакционных (OLTP / TP) баз данных, таких как MySQL, SQL Server, Oracle и PostgreSQL, в Apache Doris. Doris предоставляет несколько вариантов загрузки данных, охватывающих однократную миграцию, пакетную офлайн-синхронизацию и синхронизацию инкрементальных данных в реальном времени.

## Обзор вариантов миграции {#overview-of-migration-options}

В следующей таблице обобщены основные варианты миграции, поддерживаемые Doris. Выберите подходящий вариант с учетом объема данных, требований к задержке синхронизации и необходимости CDC (захвата изменений данных).

| Вариант | Сценарий применения | Режим синхронизации | Поддержка всей базы данных | Поддержка инкрементальных данных / CDC |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | Однократная миграция, специальные запросы, создание таблиц CTAS | Офлайн / по запросу | Реализуется с помощью SQL | Нет |
| Flink Doris Connector (JDBC) | Пакетная офлайн-синхронизация в стеке Flink | Офлайн | Нет | Нет |
| Flink Doris Connector (CDC) | Синхронизация полного набора и инкрементальных данных в реальном времени | Реальное время | Поддерживается | Поддерживается (INSERT / UPDATE / DELETE) |
| Spark Connector | Пакетная запись данных в стеке Spark | Офлайн | Нет | Нет |
| Streaming Job | Встроенная в Doris непрерывная синхронизация из MySQL / PostgreSQL | Потоковый (непрерывный) | Поддерживается | Поддерживается |
| Сторонние инструменты (NineData / DataX / SeaTunnel / CloudCanal) | Существующие платформы синхронизации, визуальное управление | Офлайн / реальное время | Поддерживается | Поддерживается |

> Примечание: если нужно выполнить миграцию без внедрения внешнего вычислительного движка, используйте **Multi-Catalog** или **Streaming Job**. Если требуется синхронизация инкрементальных данных в реальном времени, используйте **Flink Doris Connector + CDC**, **Streaming Job** или **NineData** для источников, совместимых с MySQL, и Doris.

---

## Вариант 1: Multi-Catalog (рекомендуется для однократной миграции) {#option-1-multi-catalog-recommended-for-one-time-migration}

С помощью JDBC Catalog сопоставьте таблицы в TP-базе данных с внешними таблицами в Doris, а затем загрузите данные с помощью `INSERT INTO` или `CREATE TABLE AS SELECT (CTAS)`.

### Шаги {#steps}

1. Создайте JDBC Catalog, указывающий на исходную TP-базу данных.
2. Используйте `INSERT INTO` для записи в существующую таблицу Doris либо используйте `CTAS`, чтобы за один шаг создать таблицу и загрузить данные.
3. Проверьте количество строк и согласованность полей.

### Пример: миграция данных из MySQL {#example-migrating-data-from-mysql}

```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);

-- Load into an existing table with INSERT INTO
INSERT INTO internal.doris_db.tbl1
SELECT * FROM mysql_catalog.mysql_db.table1;

-- Create the table and load data in one step with CTAS
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM mysql_catalog.mysql_db.table1;
```

Подробнее см. в разделе [Импорт данных Catalog](../../../lakehouse/catalog-overview.md#data-ingestion).

---

## Вариант 2: Flink Doris Connector {#option-2-flink-doris-connector}

С помощью Flink синхронизацию TP-системы можно выполнять в пакетном офлайн-режиме или в режиме инкрементальной синхронизации в реальном времени.

### 2.1 Офлайн-синхронизация: Flink JDBC Source + Doris Sink {#21-offline-synchronization-flink-jdbc-source--doris-sink}

Этот вариант подходит для переноса данных в офлайн-режиме в стеке Flink. Ниже показан пример Flink SQL:

```sql
CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT,
  PRIMARY KEY (id) NOT ENFORCED
) WITH (
  'connector' = 'jdbc',
  'url' = 'jdbc:mysql://localhost:3306/mydatabase',
  'table-name' = 'students',
  'username' = 'username',
  'password' = 'password'
);

CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = 'password',
      'sink.label-prefix' = 'doris_label'
);

INSERT into student_sink select * from student_source;
```

Подробнее см. в разделе [Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8).

### 2.2 Синхронизация в реальном времени: Flink CDC {#22-real-time-synchronization-flink-cdc}

С помощью Flink CDC можно в одной задаче выполнить чтение полного набора данных и захват инкрементальных изменений, а также синхронизировать события INSERT / UPDATE / DELETE.

#### Пример синхронизации одной таблицы в реальном времени {#single-table-real-time-synchronization-example}

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
  id int
  ,name VARCHAR
  ,PRIMARY KEY (id) NOT ENFORCED
) WITH (
'connector' = 'mysql-cdc',
'hostname' = '127.0.0.1',
'port' = '3306',
'username' = 'root',
'password' = 'password',
'database-name' = 'database',
'table-name' = 'table'
);

-- Supports synchronization of INSERT / UPDATE / DELETE events
CREATE TABLE doris_sink (
id INT,
name STRING
)
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'database.table',
  'username' = 'root',
  'password' = '',
  'sink.properties.format' = 'json',
  'sink.properties.read_json_by_line' = 'true',
  'sink.enable-delete' = 'true',  -- Synchronize delete events
  'sink.label-prefix' = 'doris_label'
);

insert into doris_sink select id,name from cdc_mysql_source;
```

#### Синхронизация всей базы данных / нескольких таблиц {#whole-database--multi-table-synchronization}

Для синхронизации всей базы данных или нескольких таблиц из TP-базы данных Flink Doris Connector предоставляет готовую функцию синхронизации всей базы данных, которая за один шаг выполняет синхронизацию схемы и запись данных:

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-24.0.1.jar \
    mysql-sync-database \
    --database test_db \
    --mysql-conf hostname=127.0.0.1 \
    --mysql-conf port=3306 \
    --mysql-conf username=root \
    --mysql-conf password=123456 \
    --mysql-conf database-name=mysql_db \
    --including-tables "tbl1|test.*" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

Подробнее см. в разделе [Синхронизация всей базы данных](../../../connection-integration/data-integration/flink-doris-connector.md#case-4-full-database-cdc-synchronization).

---

## Вариант 3: Spark Connector {#option-3-spark-connector}

Этот вариант подходит для сценариев, в которых Spark уже используется для пакетной обработки. Используйте JDBC Source Spark Connector для чтения из TP-базы данных, а Doris Sink — для записи в Doris.

```java
val jdbcDF = spark.read
  .format("jdbc")
  .option("url", "jdbc:postgresql:dbserver")
  .option("dbtable", "schema.tablename")
  .option("user", "username")
  .option("password", "password")
  .load()

 jdbcDF.write.format("doris")
  .option("doris.table.identifier", "db.table")
  .option("doris.fenodes", "127.0.0.1:8030")
  .option("user", "root")
  .option("password", "")
  .save()
```

Связанные документы:

- [JDBC для других баз данных](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Пакетная запись данных с помощью Spark Doris Connector](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## Вариант 4: Streaming Job (встроенная в Doris непрерывная синхронизация) {#option-4-streaming-job-built-in-continuous-synchronization-in-doris}

Doris предоставляет встроенную возможность Streaming Job, которая непрерывно синхронизирует данные из MySQL или PostgreSQL без зависимости от внешнего вычислительного движка.

### Пример синхронизации нескольких таблиц {#multi-table-synchronization-example}

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-j-8.0.31.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"
)
```

Подробнее см. в разделе [Непрерывная загрузка Postgres / MySQL](../import-way/streaming-job/continuous-load-overview.md).

---

## Вариант 5: Сторонние инструменты синхронизации {#option-5-third-party-synchronization-tools}

Помимо перечисленных встроенных вариантов, для миграции данных можно использовать распространенные сторонние инструменты синхронизации из экосистемы сообщества. Они подходят для сценариев, в которых уже есть платформа синхронизации или требуется управлять задачами через визуальный интерфейс:

- [NineData](https://docs.ninedata.cloud/en/replication/mysql_to_others/mysql_to_doris/)
- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## Часто задаваемые вопросы {#faq}

**Q1: Какой вариант выбрать для однократной миграции нескольких таблиц MySQL в Doris?**

Используйте **Multi-Catalog**. После создания JDBC Catalog выполните `INSERT INTO` или `CTAS`, чтобы завершить миграцию без дополнительных компонентов.

**Q2: Как в реальном времени синхронизировать инкрементальные данные (включая UPDATE / DELETE) из MySQL в Doris?**

Используйте **Flink Doris Connector + Flink CDC** и включите `sink.enable-delete = true` в Doris Sink либо используйте встроенный в Doris **Streaming Job** для непрерывной синхронизации.

**Q3: Как одним шагом синхронизировать всю базу данных MySQL с Doris?**

Используйте функцию синхронизации всей базы данных `mysql-sync-database` в Flink Doris Connector или возможность синхронизации нескольких таблиц в Streaming Job. Оба варианта за один шаг синхронизируют схему и данные.

**Q4: Поддерживаются ли также Oracle, SQL Server и PostgreSQL в качестве исходных баз данных?**

Да. Multi-Catalog и коннекторы Flink / Spark поддерживают TP-базы данных, такие как Oracle, SQL Server и PostgreSQL, через соответствующие JDBC-драйверы. Streaming Job в настоящее время поддерживает MySQL и PostgreSQL.

**Q5: Как указать количество реплик таблицы Doris во время миграции?**

Укажите `PROPERTIES('replication_num' = 'N')` в операторе `CTAS` или передайте `--table-conf replication_num=N` в команде синхронизации всей базы данных Flink.
