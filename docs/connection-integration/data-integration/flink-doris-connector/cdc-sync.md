---
{
    "title": "Full-Database Sync (Flink CDC)",
    "language": "en",
    "description": "Sync MySQL, Oracle, PostgreSQL, SQLServer, DB2, and MongoDB databases to Doris with Flink Doris Connector: the full-database sync tool, single-table sync with FlinkSQL, DDL sync, and key column updates."
}
---

# Full-Database Sync (Flink CDC)

Flink Doris Connector integrates [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/) to easily synchronize relational databases such as MySQL into Doris, supporting automatic table creation, Schema Change, and so on. The currently supported databases include: MySQL, Oracle, PostgreSQL, SQLServer, MongoDB, and DB2.

There are two ways to use it:

- **Full-database sync tool**: the `CdcTools` entry point built into the Connector. One `flink run` command syncs an entire database (or the tables selected by a regular expression), creates the tables in Doris, and syncs upstream DDL automatically. See [Full-Database Sync Tool](#full-database-sync-tool).
- **Single-table sync with FlinkSQL**: pair a Flink CDC source table with a Doris sink table and write an `INSERT INTO` per table. Suitable when you need additional Flink processing logic during synchronization. See [Single-Table Sync with FlinkSQL](#single-table-sync).

## Prerequisites {#prerequisites}

1. When using full-database synchronization, you need to add the corresponding Flink CDC dependency (**Fat Jar**) under `$FLINK_HOME/lib`, such as `flink-sql-connector-mysql-cdc-${version}.jar` or `flink-sql-connector-oracle-cdc-${version}.jar`. Flink CDC is incompatible with previous versions starting from 3.1. Download addresses: [Flink CDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/), [Flink CDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/).
2. After Connector 24.0.0, the dependent Flink CDC version must be 3.1 or above. [Download address](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/). If you need to use Flink CDC to synchronize MySQL and Oracle, you also need to add the relevant JDBC drivers under `$FLINK_HOME/lib`.

## Full-Database Sync Tool {#full-database-sync-tool}

After the Flink cluster is started, run the command that matches your data source. The full syntax and parameters are described in [Parameters](#options).

### MySQL

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

:::tip AWS Aurora MySQL / RDS MySQL
Use the same command for AWS Aurora MySQL or RDS MySQL: set `hostname` to the instance endpoint (for example `xxx.us-east-1.rds.amazonaws.com`) and add `--mysql-conf server-time-zone=UTC`.
:::

### Oracle

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    oracle-sync-database \
    --database test_db \
    --oracle-conf hostname=127.0.0.1 \
    --oracle-conf port=1521 \
    --oracle-conf username=admin \
    --oracle-conf password="password" \
    --oracle-conf database-name=XE \
    --oracle-conf schema-name=ADMIN \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=\
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### PostgreSQL

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    postgres-sync-database \
    --database db1 \
    --postgres-conf hostname=127.0.0.1 \
    --postgres-conf port=5432 \
    --postgres-conf username=postgres \
    --postgres-conf password="123456" \
    --postgres-conf database-name=postgres \
    --postgres-conf schema-name=public \
    --postgres-conf slot.name=test \
    --postgres-conf decoding.plugin.name=pgoutput \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=\
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### SQLServer

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    sqlserver-sync-database \
    --database db1 \
    --sqlserver-conf hostname=127.0.0.1 \
    --sqlserver-conf port=1433 \
    --sqlserver-conf username=sa \
    --sqlserver-conf password="123456" \
    --sqlserver-conf database-name=CDC_DB \
    --sqlserver-conf schema-name=dbo \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=\
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### DB2

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-24.0.1.jar \
    db2-sync-database \
    --database db2_test \
    --db2-conf hostname=127.0.0.1 \
    --db2-conf port=50000 \
    --db2-conf username=db2inst1 \
    --db2-conf password=doris123456 \
    --db2-conf database-name=testdb \
    --db2-conf schema-name=DB2INST1 \
    --including-tables "FULL_TYPES|CUSTOMERS" \
    --single-sink true \
    --use-new-schema-change true \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### MongoDB

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.18-24.0.1.jar \
    mongodb-sync-database \
    --database doris_db \
    --schema-change-mode debezium_structure \
    --mongodb-conf hosts=127.0.0.1:27017 \
    --mongodb-conf username=flinkuser \
    --mongodb-conf password=flinkpwd \
    --mongodb-conf database=test \
    --mongodb-conf scan.startup.mode=initial \
    --mongodb-conf schema.sample-percent=0.2 \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --sink-conf sink.enable-2pc=false \
    --table-conf replication_num=1
```

### Parameters {#options}

**Syntax**

```shell
<FLINK_HOME>bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-1.6.1.jar \
    <mysql-sync-database|oracle-sync-database|postgres-sync-database|sqlserver-sync-database|db2-sync-database|mongodb-sync-database> \
    --database <doris-database-name> \
    [--job-name <flink-job-name>] \
    [--table-prefix <doris-table-prefix>] \
    [--table-suffix <doris-table-suffix>] \
    [--including-tables <mysql-table-name|name-regular-expr>] \
    [--excluding-tables <mysql-table-name|name-regular-expr>] \
    --mysql-conf <mysql-cdc-source-conf> [--mysql-conf <mysql-cdc-source-conf> ...] \
    --oracle-conf <oracle-cdc-source-conf> [--oracle-conf <oracle-cdc-source-conf> ...] \
    --postgres-conf <postgres-cdc-source-conf> [--postgres-conf <postgres-cdc-source-conf> ...] \
    --sqlserver-conf <sqlserver-cdc-source-conf> [--sqlserver-conf <sqlserver-cdc-source-conf> ...] \
    --db2-conf <db2-cdc-source-conf> [--db2-conf <db2-cdc-source-conf> ...] \
    --mongodb-conf <mongodb-cdc-source-conf> [--mongodb-conf <mongodb-cdc-source-conf> ...] \
    --sink-conf <doris-sink-conf> [--sink-conf <doris-sink-conf> ...] \
    [--table-conf <doris-table-conf> [--table-conf <doris-table-conf> ...]]
```

**Configuration Items**

| Key                   | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --job-name            | The Flink job name, optional.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --database            | The name of the database to synchronize to Doris.                                                                                                                                                                                                                                                                                                                                                                                                        |
| --table-prefix        | The Doris table prefix, for example `--table-prefix ods_`.                                                                                                                                                                                                                                                                                                                                                                                               |
| --table-suffix        | Same as above, the Doris table suffix.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --including-tables    | The MySQL tables to synchronize. Multiple tables can be separated with `\|`, and regular expressions are supported. For example: `--including-tables table1`.                                                                                                                                                                                                                                                                                            |
| --excluding-tables    | Tables that do not need to be synchronized. Same usage as above.                                                                                                                                                                                                                                                                                                                                                                                         |
| --mysql-conf          | MySQL CDCSource configuration, for example `--mysql-conf hostname=127.0.0.1`. For all configurations, see [MySQL CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/). hostname/username/password/database-name are required. When the synchronized library/table contains tables without primary keys, you must set `scan.incremental.snapshot.chunk.key-column` and can only choose a single non-null field. For example: `scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`. Different library/table columns are separated by commas. |
| --oracle-conf         | Oracle CDCSource configuration, for example `--oracle-conf hostname=127.0.0.1`. For all configurations, see [Oracle CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/). hostname/username/password/database-name/schema-name are required.                                                                                                                                                    |
| --postgres-conf       | Postgres CDCSource configuration, for example `--postgres-conf hostname=127.0.0.1`. For all configurations, see [Postgres CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/). hostname/username/password/database-name/schema-name/slot.name are required.                                                                                                                                  |
| --sqlserver-conf      | SQLServer CDCSource configuration, for example `--sqlserver-conf hostname=127.0.0.1`. For all configurations, see [SQLServer CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/). hostname/username/password/database-name/schema-name are required.                                                                                                                                        |
| --db2-conf            | DB2 CDCSource configuration, for example `--db2-conf hostname=127.0.0.1`. For all configurations, see [DB2 CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/). hostname/username/password/database-name/schema-name are required.                                                                                                                                                                |
| --mongodb-conf        | MongoDB CDCSource configuration, for example `--mongodb-conf hosts=127.0.0.1:27017`. For all configurations, see [Mongo CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/). hosts/username/password/database are required. `--mongodb-conf schema.sample-percent` is the configuration for automatically sampling MongoDB data to create Doris tables; the default is 0.2.                   |
| --sink-conf           | All configurations for Doris Sink. For the complete list of configuration items, see [Sink Configuration](./write.md#options).                                                                                                                                                                                                                                                                                                                          |
| --table-conf          | Configuration items for the Doris table, that is, the content contained in properties (with the exception of table-buckets, which is not a properties attribute). For example `--table-conf replication_num=1`; `--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"` specifies the number of buckets for different tables in regular-expression order. If no match is found, `BUCKETS AUTO` is used to create the table.                    |
| --schema-change-mode  | The mode for parsing schema changes. Two parsing modes are supported: `debezium_structure` and `sql_parser`. The default is `debezium_structure`. `debezium_structure` parses the data structure used when synchronizing CDC data from upstream and determines DDL change operations by parsing this structure. `sql_parser` determines DDL change operations by parsing the DDL statements when synchronizing CDC data from upstream, so it is more accurate. Usage example: `--schema-change-mode debezium_structure`. Supported after Connector 24.0.0.                              |
| --single-sink         | Whether to use a single Sink to synchronize all tables. When enabled, newly created tables in upstream are also automatically detected, and tables are automatically created.                                                                                                                                                                                                                                                                            |
| --multi-to-one-origin | When writing multiple upstream tables into the same table, the configuration of the source tables. For example `--multi-to-one-origin "a_.*\|b_.*"`. For details, see [#208](https://github.com/apache/doris-flink-connector/pull/208).                                                                                                                                                                                                                  |
| --multi-to-one-target | Used together with `--multi-to-one-origin`, the configuration of the target tables. For example `--multi-to-one-target "a\|b"`.                                                                                                                                                                                                                                                                                                                          |
| --create-table-only   | Whether to synchronize only the table structure.                                                                                                                                                                                                                                                                                                                                                                                                         |

## Single-Table Sync with FlinkSQL {#single-table-sync}

Read MySQL changes through a Flink CDC `mysql-cdc` source table and write them to a Doris sink table. The corresponding Flink CDC Fat Jar must be placed under `$FLINK_HOME/lib` (see [Prerequisites](#prerequisites)). Delete events are synchronized through `sink.enable-delete`.

```sql
-- Enable checkpoint
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
    id int,
    name VARCHAR,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = '127.0.0.1',
    'port' = '3306',
    'username' = 'root',
    'password' = 'password',
    'database-name' = 'database',
    'table-name' = 'table'
);

-- Supports synchronizing insert/update/delete events
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

insert into doris_sink select id, name from cdc_mysql_source;
```

When the upstream is Debezium-format data, you can also write it with the DataStream API using `JsonDebeziumSchemaSerializer`. See [Debezium Format](./datastream-api.md#debezium).

## Synchronization Behavior

### DDL and Schema Change Sync {#schema-change}

When synchronizing upstream data sources such as MySQL, Schema Change operations need to be performed in Doris in sync whenever fields are added or removed in upstream.

For this scenario, you typically need to write a DataStream API program and use the `JsonDebeziumSchemaSerializer` provided by DorisSink for serialization. Schema Change is then performed automatically. See [Debezium Format](./datastream-api.md#debezium).

In the full-database synchronization tool provided by Connector, no additional configuration is required; upstream DDL is automatically synchronized and Schema Change operations are performed in Doris. How DDL is parsed is controlled by `--schema-change-mode`; see [Parameters](#options).

### Updating Key Columns {#update-key-columns}

In business databases, an ID is typically used as the primary key of a table. For example, the Student table uses the ID (id) as its primary key. As the business evolves, however, the ID corresponding to a piece of data may change. In this scenario, using Flink CDC + Doris Connector to synchronize data automatically updates the data in the Doris primary key column.

**Principle**

The underlying collection tool of Flink CDC is Debezium. Internally, Debezium uses the `op` field to identify the corresponding operation: the values of the `op` field are `c`, `u`, `d`, and `r`, corresponding to create, update, delete, and read, respectively. For updates to the primary key column, Flink CDC sends DELETE and INSERT events to downstream. After the data is synchronized to Doris, the data in the primary key column is automatically updated.

**Usage**

The Flink program can refer to the CDC synchronization example above. After the job is successfully submitted, run an Update statement on the primary key column on the MySQL side (for example, `update student set id = '1002' where id = '1001'`) to modify the data in Doris.
