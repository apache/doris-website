---
{
    "title": "Синхронизация всей базы данных (Flink CDC)",
    "language": "ru",
    "description": "Синхронизация баз данных MySQL, Oracle, PostgreSQL, SQLServer, DB2 и MongoDB с Doris с помощью Flink Doris Connector: инструмент синхронизации всей базы данных, синхронизация отдельной таблицы с помощью FlinkSQL, синхронизация DDL и обновление ключевых столбцов."
}
---

# Синхронизация всей базы данных (Flink CDC) {#full-database-sync-flink-cdc}

Flink Doris Connector интегрирует [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/), что позволяет легко синхронизировать реляционные базы данных, такие как MySQL, с Doris. Поддерживаются автоматическое создание таблиц, Schema Change и другие возможности. В настоящее время поддерживаются следующие базы данных: MySQL, Oracle, PostgreSQL, SQLServer, MongoDB и DB2.

Использовать его можно двумя способами:

- **Инструмент синхронизации всей базы данных**: встроенная в Connector точка входа `CdcTools`. Одна команда `flink run` синхронизирует всю базу данных (или таблицы, выбранные с помощью регулярного выражения), создаёт таблицы в Doris и автоматически синхронизирует DDL источника. См. [Инструмент синхронизации всей базы данных](#full-database-sync-tool).
- **Синхронизация отдельной таблицы с помощью FlinkSQL**: свяжите исходную таблицу Flink CDC с целевой таблицей Doris и напишите `INSERT INTO` для каждой таблицы. Этот способ подходит, если при синхронизации нужна дополнительная логика обработки во Flink. См. [Синхронизация отдельной таблицы с помощью FlinkSQL](#single-table-sync).

## Предварительные требования {#prerequisites}

1. При синхронизации всей базы данных необходимо добавить соответствующую зависимость Flink CDC (**Fat Jar**) в `$FLINK_HOME/lib`, например `flink-sql-connector-mysql-cdc-${version}.jar` или `flink-sql-connector-oracle-cdc-${version}.jar`. Начиная с версии 3.1, Flink CDC несовместим с предыдущими версиями. Ссылки для скачивания: [Flink CDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/), [Flink CDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/).
2. В версиях после Connector 24.0.0 требуется зависимость Flink CDC версии 3.1 или выше. [Ссылка для скачивания](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/). Если вы используете Flink CDC для синхронизации MySQL и Oracle, необходимо также добавить соответствующие драйверы JDBC в `$FLINK_HOME/lib`.

## Инструмент синхронизации всей базы данных {#full-database-sync-tool}

После запуска кластера Flink выполните команду, соответствующую вашему источнику данных. Полный синтаксис и параметры описаны в разделе [Параметры](#options).

### MySQL {#mysql}

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
Для AWS Aurora MySQL или RDS MySQL используйте ту же команду: задайте для `hostname` адрес экземпляра (например, `xxx.us-east-1.rds.amazonaws.com`) и добавьте `--mysql-conf server-time-zone=UTC`.
:::

### Oracle {#oracle}

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

### PostgreSQL {#postgresql}

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

### SQLServer {#sqlserver}

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

### DB2 {#db2}

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

### MongoDB {#mongodb}

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

### Параметры {#options}

**Синтаксис**

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

**Параметры конфигурации**

| Параметр              | Описание                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --job-name            | Имя задания Flink. Необязательный параметр.                                                                                                                                                                                                                                                                                                                                                                                                              |
| --database            | Имя базы данных Doris, в которую выполняется синхронизация.                                                                                                                                                                                                                                                                                                                                                                                               |
| --table-prefix        | Префикс таблиц Doris, например `--table-prefix ods_`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| --table-suffix        | Аналогично предыдущему параметру, суффикс таблиц Doris.                                                                                                                                                                                                                                                                                                                                                                                                   |
| --including-tables    | Таблицы MySQL для синхронизации. Несколько таблиц можно разделить с помощью `\|`; также поддерживаются регулярные выражения. Например: `--including-tables table1`.                                                                                                                                                                                                                                                                                       |
| --excluding-tables    | Таблицы, которые не нужно синхронизировать. Используется аналогично предыдущему параметру.                                                                                                                                                                                                                                                                                                                                                                |
| --mysql-conf          | Конфигурация MySQL CDCSource, например `--mysql-conf hostname=127.0.0.1`. Полный список параметров см. в [MySQL CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/). Параметры hostname/username/password/database-name обязательны. Если в синхронизируемой базе данных или наборе таблиц есть таблицы без первичных ключей, необходимо задать `scan.incremental.snapshot.chunk.key-column`; при этом можно выбрать только одно поле, не допускающее NULL. Например: `scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`. Столбцы разных баз данных/таблиц разделяются запятыми. |
| --oracle-conf         | Конфигурация Oracle CDCSource, например `--oracle-conf hostname=127.0.0.1`. Полный список параметров см. в [Oracle CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/). Параметры hostname/username/password/database-name/schema-name обязательны.                                                                                                                                                 |
| --postgres-conf       | Конфигурация Postgres CDCSource, например `--postgres-conf hostname=127.0.0.1`. Полный список параметров см. в [Postgres CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/). Параметры hostname/username/password/database-name/schema-name/slot.name обязательны.                                                                                                                                |
| --sqlserver-conf      | Конфигурация SQLServer CDCSource, например `--sqlserver-conf hostname=127.0.0.1`. Полный список параметров см. в [SQLServer CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/). Параметры hostname/username/password/database-name/schema-name обязательны.                                                                                                                                       |
| --db2-conf            | Конфигурация DB2 CDCSource, например `--db2-conf hostname=127.0.0.1`. Полный список параметров см. в [DB2 CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/). Параметры hostname/username/password/database-name/schema-name обязательны.                                                                                                                                                               |
| --mongodb-conf        | Конфигурация MongoDB CDCSource, например `--mongodb-conf hosts=127.0.0.1:27017`. Полный список параметров см. в [Mongo CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/). Параметры hosts/username/password/database обязательны. `--mongodb-conf schema.sample-percent` задаёт автоматическую выборку данных MongoDB для создания таблиц Doris; значение по умолчанию — 0.2.                   |
| --sink-conf           | Все параметры Doris Sink. Полный список параметров конфигурации см. в разделе [Настройка Sink](./write.md#options).                                                                                                                                                                                                                                                                                                                                         |
| --table-conf          | Параметры таблицы Doris, то есть содержимое properties (за исключением table-buckets, который не является атрибутом properties). Например, `--table-conf replication_num=1`; параметр `--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"` задаёт количество бакетов для разных таблиц, проверяя регулярные выражения по порядку. Если совпадение не найдено, для создания таблицы используется `BUCKETS AUTO`.                              |
| --schema-change-mode  | Режим разбора изменений схемы. Поддерживаются два режима разбора: `debezium_structure` и `sql_parser`. По умолчанию используется `debezium_structure`. `debezium_structure` разбирает структуру данных, используемую при синхронизации данных CDC из источника, и по этой структуре определяет операции изменения DDL. `sql_parser` определяет операции изменения DDL путём разбора операторов DDL при синхронизации данных CDC из источника, поэтому он точнее. Пример использования: `--schema-change-mode debezium_structure`. Поддерживается в версиях после Connector 24.0.0. |
| --single-sink         | Использовать ли один Sink для синхронизации всех таблиц. При включении этого режима новые таблицы в источнике также обнаруживаются автоматически, и соответствующие таблицы создаются автоматически.                                                                                                                                                                                                                                                         |
| --multi-to-one-origin | Конфигурация исходных таблиц при записи нескольких таблиц источника в одну таблицу. Например, `--multi-to-one-origin "a_.*\|b_.*"`. Подробности см. в [#208](https://github.com/apache/doris-flink-connector/pull/208).                                                                                                                                                                                                                                       |
| --multi-to-one-target | Конфигурация целевых таблиц; используется вместе с `--multi-to-one-origin`. Например, `--multi-to-one-target "a\|b"`.                                                                                                                                                                                                                                                                                                                                    |
| --create-table-only   | Синхронизировать ли только структуру таблицы.                                                                                                                                                                                                                                                                                                                                                                                                            |

## Синхронизация отдельной таблицы с помощью FlinkSQL {#single-table-sync}

Считывайте изменения MySQL через исходную таблицу Flink CDC `mysql-cdc` и записывайте их в целевую таблицу Doris. Соответствующий Flink CDC Fat Jar необходимо поместить в `$FLINK_HOME/lib` (см. [Предварительные требования](#prerequisites)). События удаления синхронизируются с помощью `sink.enable-delete`.

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

Если данные источника имеют формат Debezium, их также можно записывать через DataStream API с помощью `JsonDebeziumSchemaSerializer`. См. [Формат Debezium](./datastream-api.md#debezium).

## Поведение при синхронизации {#synchronization-behavior}

### Синхронизация DDL и Schema Change {#schema-change}

При синхронизации данных из источников, таких как MySQL, при каждом добавлении или удалении полей в источнике необходимо выполнять соответствующие операции Schema Change в Doris.

В таком сценарии обычно нужно написать программу с использованием DataStream API и применять `JsonDebeziumSchemaSerializer` из DorisSink для сериализации. После этого Schema Change выполняется автоматически. См. [Формат Debezium](./datastream-api.md#debezium).

В инструменте синхронизации всей базы данных, предоставляемом Connector, дополнительная настройка не требуется: DDL источника синхронизируется автоматически, а в Doris выполняются операции Schema Change. Способ разбора DDL определяется параметром `--schema-change-mode`; см. [Параметры](#options).

### Обновление ключевых столбцов {#update-key-columns}

В базах данных бизнес-приложений первичным ключом таблицы обычно служит ID. Например, в таблице Student первичным ключом служит ID (id). Однако по мере развития бизнеса ID, соответствующий записи, может измениться. В таком сценарии синхронизация данных с помощью Flink CDC + Doris Connector автоматически обновляет данные в столбце первичного ключа Doris.

**Принцип работы**

В основе механизма сбора данных Flink CDC лежит Debezium. Внутри Debezium использует поле `op` для определения соответствующей операции: поле `op` принимает значения `c`, `u`, `d` и `r`, соответствующие созданию, обновлению, удалению и чтению. При обновлении столбца первичного ключа Flink CDC передаёт события DELETE и INSERT в целевую систему. После синхронизации с Doris данные в столбце первичного ключа обновляются автоматически.

**Использование**

За основу программы Flink можно взять приведённый выше пример синхронизации CDC. После успешной отправки задания выполните оператор Update для столбца первичного ключа на стороне MySQL (например, `update student set id = '1002' where id = '1001'`), чтобы изменить данные в Doris.
