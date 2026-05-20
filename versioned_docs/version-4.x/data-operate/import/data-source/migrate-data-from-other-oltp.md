---
{
    "title": "Migrating Data from Other TP Systems",
    "language": "en",
    "description": "How to migrate data from OLTP systems such as MySQL, SQL Server, Oracle, and PostgreSQL into Apache Doris, covering both offline and real-time synchronization options.",
    "keywords": [
        "MySQL to Doris migration",
        "Oracle to Doris migration",
        "SQL Server to Doris migration",
        "PostgreSQL to Doris sync",
        "OLTP data migration",
        "Flink CDC Doris",
        "JDBC Catalog",
        "whole-database sync"
    ]
}
---

<!-- Knowledge type: Architecture selection decision / Operational steps -->
<!-- Applicable scenario: Migrating or synchronizing data from OLTP databases (MySQL / SQL Server / Oracle / PostgreSQL) to Apache Doris -->

This document describes how to migrate data from traditional transactional (OLTP / TP) databases such as MySQL, SQL Server, Oracle, and PostgreSQL into Apache Doris. Doris provides several data ingestion options that cover one-time migration, offline batch synchronization, and real-time incremental synchronization.

## Overview of Migration Options

The following table summarizes the main migration options that Doris supports. You can choose one based on data volume, synchronization latency requirements, and whether CDC (Change Data Capture) is needed.

| Option | Applicable scenario | Sync mode | Whole-database supported | Incremental / CDC supported |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | One-time migration, ad-hoc queries, CTAS table creation | Offline / on-demand | Implement with SQL | No |
| Flink Doris Connector (JDBC) | Offline batch synchronization in the Flink stack | Offline | No | No |
| Flink Doris Connector (CDC) | Real-time full + incremental synchronization | Real-time | Supported | Supported (INSERT / UPDATE / DELETE) |
| Spark Connector | Batch data writes in the Spark stack | Offline | No | No |
| Streaming Job | Built-in continuous synchronization from MySQL / PostgreSQL in Doris | Streaming (continuous) | Supported | Supported |
| Third-party tools (DataX / SeaTunnel / CloudCanal) | Existing synchronization platforms, visual operations | Offline / real-time | Supported | Depends on the tool |

> Note: If you need to complete the migration without introducing an external compute engine, use **Multi-Catalog** or **Streaming Job**. If you need real-time incremental synchronization, use **Flink Doris Connector + CDC** or **Streaming Job**.

---

## Option 1: Multi-Catalog (Recommended for One-Time Migration)

Use a JDBC Catalog to map tables in the TP database as external tables in Doris, then use `INSERT INTO` or `CREATE TABLE AS SELECT (CTAS)` to load the data.

### Steps

1. Create a JDBC Catalog that points to the source TP database.
2. Use `INSERT INTO` to write into an existing Doris table, or use `CTAS` to create the table and load data in a single step.
3. Verify row counts and field consistency.

### Example: Migrating Data from MySQL

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

For more details, see [Catalog Data Import](../../../lakehouse/catalog-overview.md#data-ingestion).

---

## Option 2: Flink Doris Connector

With Flink, you can run TP-system synchronization in either offline batch mode or real-time incremental mode.

### 2.1 Offline Synchronization: Flink JDBC Source + Doris Sink

This option suits offline data movement in the Flink stack. The following Flink SQL example shows the pattern:

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

For more details, see [Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8).

### 2.2 Real-Time Synchronization: Flink CDC

With Flink CDC, you can perform a full data read and incremental capture in a single job, and synchronize INSERT / UPDATE / DELETE events.

#### Single-Table Real-Time Synchronization Example

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

#### Whole-Database / Multi-Table Synchronization

For whole-database or multi-table synchronization from a TP database, the Flink Doris Connector provides an out-of-the-box whole-database sync feature that performs schema synchronization and data writes in one step:

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

For more details, see [Whole-Database Synchronization](../../../connection-integration/data-integration/flink-doris-connector.md#case-4-full-database-cdc-synchronization).

---

## Option 3: Spark Connector

This option suits scenarios where you already use Spark for batch processing. You can use the Spark Connector's JDBC Source to read from the TP database and the Doris Sink to write into Doris.

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

Related documents:

- [JDBC To Other Databases](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector Batch Write](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## Option 4: Streaming Job (Built-in Continuous Synchronization in Doris)

Doris provides a built-in Streaming Job capability that continuously synchronizes data from MySQL or PostgreSQL without depending on an external compute engine.

### Multi-Table Synchronization Example

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

For more details, see [Postgres / MySQL Continuous Load](../import-way/streaming-job/continuous-load-overview.md).

---

## Option 5: Third-Party Synchronization Tools

In addition to the native options above, you can use common third-party synchronization tools from the community. These suit scenarios where you already have a synchronization platform or want to manage tasks through a visual interface:

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## FAQ

**Q1: Which option should you choose for a one-time migration of a few MySQL tables to Doris?**

Use **Multi-Catalog**. After creating a JDBC Catalog, run `INSERT INTO` or `CTAS` to complete the migration without any extra component.

**Q2: How do you synchronize incremental data (including UPDATE / DELETE) from MySQL to Doris in real time?**

Use **Flink Doris Connector + Flink CDC** and enable `sink.enable-delete = true` in the Doris Sink, or use the built-in **Streaming Job** in Doris for continuous synchronization.

**Q3: How do you synchronize an entire MySQL database to Doris in one step?**

Use the `mysql-sync-database` whole-database sync feature in the Flink Doris Connector, or the multi-table synchronization capability of Streaming Job. Either option synchronizes both schema and data in one step.

**Q4: Are Oracle, SQL Server, and PostgreSQL also supported as source databases?**

Yes. Multi-Catalog and the Flink / Spark Connectors support TP databases such as Oracle, SQL Server, and PostgreSQL through their respective JDBC drivers. Streaming Job currently supports MySQL and PostgreSQL.

**Q5: How do you specify the replication count for the Doris table during migration?**

Specify `PROPERTIES('replication_num' = 'N')` in the `CTAS` statement, or pass `--table-conf replication_num=N` in the Flink whole-database sync command.
