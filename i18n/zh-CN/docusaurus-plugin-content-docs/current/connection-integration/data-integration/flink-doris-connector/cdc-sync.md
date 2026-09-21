---
{
    "title": "整库同步（Flink CDC）",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 将 MySQL、Oracle、PostgreSQL、SQLServer、DB2、MongoDB 数据库同步到 Doris：整库同步工具、FlinkSQL 单表同步、DDL 同步与主键列更新。"
}
---

# 整库同步（Flink CDC）

Flink Doris Connector 集成了 [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)，可便捷地将 MySQL 等关系型数据库同步到 Doris，支持自动建表、Schema Change 等。目前支持的数据库包括：MySQL、Oracle、PostgreSQL、SQLServer、MongoDB、DB2。

有两种使用方式：

- **整库同步工具**：Connector 内置的 `CdcTools`，一条 `flink run` 命令同步整个数据库（或按正则表达式选择的多张表），自动在 Doris 建表并同步上游 DDL，见 [整库同步工具](#full-database-sync-tool)。
- **FlinkSQL 单表同步**：用 Flink CDC 的 Source 表配合 Doris Sink 表，逐表编写 `INSERT INTO`，适合需要在同步过程中加入 Flink 处理逻辑的场景，见 [FlinkSQL 单表同步](#single-table-sync)。

## 准备工作 {#prerequisites}

1. 使用整库同步时，需要在 `$FLINK_HOME/lib` 目录下添加对应的 Flink CDC 依赖（**Fat Jar**），如 `flink-sql-connector-mysql-cdc-${version}.jar`、`flink-sql-connector-oracle-cdc-${version}.jar`。Flink CDC 从 3.1 版本起与之前版本不兼容，下载地址：[Flink CDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)、[Flink CDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/)。
2. Connector 24.0.0 之后依赖的 Flink CDC 版本需要在 3.1 以上，[下载地址](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)。如果需使用 Flink CDC 同步 MySQL 和 Oracle，还需要在 `$FLINK_HOME/lib` 下增加相关的 JDBC 驱动。

## 整库同步工具 {#full-database-sync-tool}

启动 Flink 集群后，根据数据源类型运行对应命令。命令的完整语法和参数见 [参数说明](#options)。

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
同步 AWS Aurora MySQL 或 RDS MySQL 时命令与上面相同：`hostname` 填写实例的 endpoint（例如 `xxx.us-east-1.rds.amazonaws.com`），并增加 `--mysql-conf server-time-zone=UTC`。
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

### 参数说明 {#options}

**语法**

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

**配置项**

| Key                   | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --job-name            | Flink 任务名称，非必需                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --database            | 同步到 Doris 的数据库名                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --table-prefix        | Doris 表前缀名，例如 `--table-prefix ods_`                                                                                                                                                                                                                                                                                                                                                                                                               |
| --table-suffix        | 同上，Doris 表的后缀名                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --including-tables    | 需要同步的 MySQL 表，可以使用 `\|` 分隔多个表，并支持正则表达式。例如 `--including-tables table1`                                                                                                                                                                                                                                                                                                                                                        |
| --excluding-tables    | 不需要同步的表，用法同上                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --mysql-conf          | MySQL CDCSource 配置，例如 `--mysql-conf hostname=127.0.0.1`，所有配置可参考 [MySQL CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/)。其中 hostname/username/password/database-name 是必需的。同步的库表中含有非主键表时，必须设置 `scan.incremental.snapshot.chunk.key-column`，且只能选择非空类型的一个字段。例如：`scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`，不同的库表列之间用逗号隔开。 |
| --oracle-conf         | Oracle CDCSource 配置，例如 `--oracle-conf hostname=127.0.0.1`，所有配置可参考 [Oracle CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/)。其中 hostname/username/password/database-name/schema-name 是必需的。                                                                                                                                                                                |
| --postgres-conf       | Postgres CDCSource 配置，例如 `--postgres-conf hostname=127.0.0.1`，所有配置可参考 [Postgres CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/)。其中 hostname/username/password/database-name/schema-name/slot.name 是必需的。                                                                                                                                                              |
| --sqlserver-conf      | SQLServer CDCSource 配置，例如 `--sqlserver-conf hostname=127.0.0.1`，所有配置可参考 [SQLServer CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/)。其中 hostname/username/password/database-name/schema-name 是必需的。                                                                                                                                                                     |
| --db2-conf            | DB2 CDCSource 配置，例如 `--db2-conf hostname=127.0.0.1`，所有配置可参考 [DB2 CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/)。其中 hostname/username/password/database-name/schema-name 是必需的。                                                                                                                                                                                            |
| --mongodb-conf        | MongoDB CDCSource 配置，例如 `--mongodb-conf hosts=127.0.0.1:27017`，所有配置可参考 [Mongo CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/)。其中 hosts/username/password/database 是必须的。`--mongodb-conf schema.sample-percent` 为自动采样 MongoDB 数据为 Doris 建表的配置，默认为 0.2                                                                                                    |
| --sink-conf           | Doris Sink 的所有配置，可在 [Sink 配置项](./write.md#options) 查看完整的配置项                                                                                                                                                                                                                                                                                                                                                                                  |
| --table-conf          | Doris 表的配置项，即 properties 中包含的内容（其中 table-buckets 例外，非 properties 属性）。例如 `--table-conf replication_num=1`；`--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"` 表示按照正则表达式顺序指定不同表的 buckets 数量，如果没有匹配到则采用 `BUCKETS AUTO` 建表。                                                                                                                                                          |
| --schema-change-mode  | 解析 schema change 的模式，支持 `debezium_structure`、`sql_parser` 两种解析模式，默认采用 `debezium_structure`。`debezium_structure` 解析上游 CDC 同步数据时所使用的数据结构，通过解析该结构判断 DDL 变更操作。`sql_parser` 通过解析上游 CDC 同步数据时的 DDL 语句判断 DDL 变更操作，因此该解析模式更加准确。使用例子：`--schema-change-mode debezium_structure`。Connector 24.0.0 后支持。                                                                  |
| --single-sink         | 是否使用单个 Sink 同步所有表，开启后也可自动识别上游新创建的表，自动创建表                                                                                                                                                                                                                                                                                                                                                                               |
| --multi-to-one-origin | 将上游多张表写入同一张表时，源表的配置，例如 `--multi-to-one-origin "a_.*\|b_.*"`，具体参考 [#208](https://github.com/apache/doris-flink-connector/pull/208)                                                                                                                                                                                                                                                                                              |
| --multi-to-one-target | 与 `--multi-to-one-origin` 搭配使用，目标表的配置，例如 `--multi-to-one-target "a\|b"`                                                                                                                                                                                                                                                                                                                                                                    |
| --create-table-only   | 是否只仅仅同步表的结构                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## FlinkSQL 单表同步 {#single-table-sync}

通过 Flink CDC 的 `mysql-cdc` Source 表读取 MySQL 变更，再写入 Doris Sink 表。需要先在 `$FLINK_HOME/lib` 下放置对应的 Flink CDC Fat Jar（见 [准备工作](#prerequisites)）。删除事件通过 `sink.enable-delete` 同步。

```sql
-- 启用 checkpoint
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

-- 支持同步 insert/update/delete 事件
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
    'sink.enable-delete' = 'true',  -- 同步删除事件
    'sink.label-prefix' = 'doris_label'
);

insert into doris_sink select id, name from cdc_mysql_source;
```

上游是 Debezium 格式数据时，也可以通过 DataStream API 使用 `JsonDebeziumSchemaSerializer` 写入，见 [Debezium 格式](./datastream-api.md#debezium)。

## 同步行为说明

### DDL 与 Schema Change 同步 {#schema-change}

同步 MySQL 等上游数据源时，上游增加或删除字段时需要在 Doris 中同步进行 Schema Change 操作。

针对此场景，通常需要编写 DataStream API 的程序，并使用 DorisSink 提供的 `JsonDebeziumSchemaSerializer` 序列化即可自动完成 Schema Change，见 [Debezium 格式](./datastream-api.md#debezium)。

在 Connector 提供的整库同步工具中，无需额外配置，会自动同步上游 DDL 并在 Doris 进行 Schema Change 操作。DDL 的解析方式由 `--schema-change-mode` 控制，见 [参数说明](#options)。

### 主键列更新 {#update-key-columns}

业务数据库中通常会使用编号作为表的主键，例如 Student 表会使用编号（id）作为主键，但随着业务发展，数据对应的编号可能会发生变化。在这种场景下，使用 Flink CDC + Doris Connector 同步数据可自动更新 Doris 主键列的数据。

**原理**

Flink CDC 底层的采集工具是 Debezium，Debezium 内部使用 `op` 字段来标识对应的操作：`op` 字段的取值分别为 `c`、`u`、`d`、`r`，分别对应 create、update、delete 和 read。对于主键列的更新，Flink CDC 会向下游发送 DELETE 和 INSERT 事件，数据同步到 Doris 中后会自动更新主键列的数据。

**使用**

Flink 程序可参考上面 CDC 同步的示例，成功提交任务后，在 MySQL 侧执行 Update 主键列的语句（例如 `update student set id = '1002' where id = '1001'`），即可修改 Doris 中的数据。
