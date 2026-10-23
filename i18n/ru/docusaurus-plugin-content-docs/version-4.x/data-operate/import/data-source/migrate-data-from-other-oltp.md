---
{
    "title": "Миграция данных из других систем TP",
    "language": "ru",
    "description": "Как перенести данные из систем OLTP, таких как MySQL, SQL Server, Oracle и PostgreSQL, в Apache Doris: варианты офлайн-синхронизации и синхронизации в реальном времени.",
    "keywords": [
        "миграция из MySQL в Doris",
        "миграция из Oracle в Doris",
        "миграция из SQL Server в Doris",
        "синхронизация PostgreSQL с Doris",
        "миграция данных OLTP",
        "Flink CDC Doris",
        "JDBC Catalog",
        "синхронизация всей базы данных"
    ]
}
---

<!-- Knowledge type: Architecture selection decision / Operational steps -->
<!-- Applicable scenario: Migrating or synchronizing data from OLTP databases (MySQL / SQL Server / Oracle / PostgreSQL) to Apache Doris -->

В этом документе описано, как перенести данные из традиционных транзакционных баз данных (OLTP / TP), таких как MySQL, SQL Server, Oracle и PostgreSQL, в Apache Doris. Doris предоставляет несколько способов загрузки данных для разовой миграции, пакетной офлайн-синхронизации и инкрементальной синхронизации в реальном времени.

## Обзор способов миграции {#overview-of-migration-options}

В таблице ниже приведены основные способы миграции, которые поддерживает Doris. Выбор зависит от объёма данных, требований к задержке синхронизации и необходимости использования CDC (Change Data Capture).

| Способ | Сценарий применения | Режим синхронизации | Поддержка синхронизации всей базы данных | Поддержка инкрементальной синхронизации / CDC |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | Разовая миграция, нерегулярные запросы, создание таблиц с помощью CTAS | Офлайн / по запросу | Реализуется с помощью SQL | Нет |
| Flink Doris Connector (JDBC) | Пакетная офлайн-синхронизация в стеке Flink | Офлайн | Нет | Нет |
| Flink Doris Connector (CDC) | Полная + инкрементальная синхронизация в реальном времени | В реальном времени | Поддерживается | Поддерживается (INSERT / UPDATE / DELETE) |
| Spark Connector | Пакетная запись данных в стеке Spark | Офлайн | Нет | Нет |
| Streaming Job | Встроенная в Doris непрерывная синхронизация из MySQL / PostgreSQL | Потоковая (непрерывная) | Поддерживается | Поддерживается |
| Сторонние инструменты (DataX / SeaTunnel / CloudCanal) | Существующие платформы синхронизации, управление через визуальный интерфейс | Офлайн / в реальном времени | Поддерживается | Зависит от инструмента |

> Примечание: если нужно выполнить миграцию без подключения внешнего вычислительного движка, используйте **Multi-Catalog** или **Streaming Job**. Если нужна инкрементальная синхронизация в реальном времени, используйте **Flink Doris Connector + CDC** или **Streaming Job**.

---

## Способ 1: Multi-Catalog (рекомендуется для разовой миграции) {#option-1-multi-catalog-recommended-for-one-time-migration}

Используйте JDBC Catalog, чтобы представить таблицы базы данных TP как внешние таблицы в Doris, а затем загрузите данные с помощью `INSERT INTO` или `CREATE TABLE AS SELECT (CTAS)`.

### Порядок действий {#steps}

1. Создайте JDBC Catalog, указывающий на исходную базу данных TP.
2. Используйте `INSERT INTO` для записи в существующую таблицу Doris или `CTAS`, чтобы создать таблицу и загрузить данные за один шаг.
3. Проверьте количество строк и соответствие полей.

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

Подробнее см. в разделе [Импорт данных через Catalog](../../../lakehouse/catalog-overview.md#data-ingestion).

---

## Способ 2: Flink Doris Connector {#option-2-flink-doris-connector}

С помощью Flink можно синхронизировать данные из систем TP как в пакетном офлайн-режиме, так и в инкрементальном режиме реального времени.

### 2.1 Офлайн-синхронизация: Flink JDBC Source + Doris Sink {#21-offline-synchronization-flink-jdbc-source--doris-sink}

Этот способ подходит для переноса данных в офлайн-режиме в стеке Flink. Следующий пример Flink SQL показывает, как это сделать:

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

С помощью Flink CDC можно выполнить полное чтение данных и инкрементальный захват изменений в одном задании, а также синхронизировать события INSERT / UPDATE / DELETE.

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

Для синхронизации всей базы данных TP или нескольких её таблиц Flink Doris Connector предоставляет готовую функцию, которая синхронизирует схему и записывает данные за один шаг:

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

## Способ 3: Spark Connector {#option-3-spark-connector}

Этот способ подходит, если вы уже используете Spark для пакетной обработки. С помощью JDBC Source в Spark Connector можно читать данные из базы данных TP, а с помощью Doris Sink записывать их в Doris.

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
- [Пакетная запись с помощью Spark Doris Connector](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## Способ 4: Streaming Job (встроенная непрерывная синхронизация в Doris) {#option-4-streaming-job-built-in-continuous-synchronization-in-doris}

Doris предоставляет встроенную возможность Streaming Job для непрерывной синхронизации данных из MySQL или PostgreSQL без зависимости от внешнего вычислительного движка.

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

Подробнее см. в разделе [Непрерывная загрузка из Postgres / MySQL](../import-way/streaming-job/continuous-load-overview.md).

---

## Способ 5: Сторонние инструменты синхронизации {#option-5-third-party-synchronization-tools}

Помимо перечисленных выше встроенных способов, можно использовать распространённые сторонние инструменты синхронизации, поддерживаемые сообществом. Они подходят, если у вас уже есть платформа синхронизации или вы хотите управлять заданиями через визуальный интерфейс:

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## Часто задаваемые вопросы {#faq}

**Вопрос 1: какой способ выбрать для разовой миграции нескольких таблиц MySQL в Doris?**

Используйте **Multi-Catalog**. После создания JDBC Catalog выполните `INSERT INTO` или `CTAS`, чтобы завершить миграцию без дополнительных компонентов.

**Вопрос 2: как синхронизировать инкрементальные данные (включая UPDATE / DELETE) из MySQL в Doris в реальном времени?**

Используйте **Flink Doris Connector + Flink CDC** и включите `sink.enable-delete = true` в Doris Sink либо используйте встроенный в Doris **Streaming Job** для непрерывной синхронизации.

**Вопрос 3: как синхронизировать всю базу данных MySQL с Doris за один шаг?**

Используйте функцию синхронизации всей базы данных `mysql-sync-database` в Flink Doris Connector или возможность синхронизации нескольких таблиц в Streaming Job. Оба способа синхронизируют схему и данные за один шаг.

**Вопрос 4: поддерживаются ли Oracle, SQL Server и PostgreSQL в качестве исходных баз данных?**

Да. Multi-Catalog и коннекторы Flink / Spark поддерживают базы данных TP, такие как Oracle, SQL Server и PostgreSQL, через соответствующие драйверы JDBC. Streaming Job в настоящее время поддерживает MySQL и PostgreSQL.

**Вопрос 5: как указать число реплик для таблицы Doris при миграции?**

Укажите `PROPERTIES('replication_num' = 'N')` в операторе `CTAS` или передайте `--table-conf replication_num=N` в команде Flink для синхронизации всей базы данных.
