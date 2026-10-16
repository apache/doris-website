---
{
    "title": "データベース全体の同期（Flink CDC）",
    "language": "ja",
    "description": "Flink Doris Connector を使用して MySQL、Oracle、PostgreSQL、SQLServer、DB2、MongoDB のデータベースを Doris に同期する方法を説明します。データベース全体の同期ツール、FlinkSQL による単一テーブルの同期、DDL の同期、キー列の更新を扱います。"
}
---

# データベース全体の同期（Flink CDC） {#full-database-sync-flink-cdc}

Flink Doris Connector は [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/) と連携し、MySQL などのリレーショナルデータベースを Doris に容易に同期できます。テーブルの自動作成やスキーマ変更などに対応しています。現在対応しているデータベースは MySQL、Oracle、PostgreSQL、SQLServer、MongoDB、DB2 です。

次の二つの方法を使用できます。

- **データベース全体の同期ツール**：Connector に組み込まれた `CdcTools` エントリーポイントです。一つの `flink run` コマンドでデータベース全体（または正規表現で選択したテーブル）を同期し、Doris にテーブルを作成して、上流の DDL も自動的に同期します。[データベース全体の同期ツール](#full-database-sync-tool)を参照してください。
- **FlinkSQL による単一テーブルの同期**：Flink CDC のソーステーブルと Doris のシンクテーブルを組み合わせ、テーブルごとに `INSERT INTO` を記述します。同期中に Flink で追加の処理を行う場合に適しています。[FlinkSQL による単一テーブルの同期](#single-table-sync)を参照してください。

## 前提条件 {#prerequisites}

1. データベース全体を同期する場合は、対応する Flink CDC の依存ファイル（**Fat Jar**）を `$FLINK_HOME/lib` に配置する必要があります。たとえば、`flink-sql-connector-mysql-cdc-${version}.jar` や `flink-sql-connector-oracle-cdc-${version}.jar` です。Flink CDC は 3.1 以降、以前のバージョンと互換性がありません。ダウンロード先：[Flink CDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)、[Flink CDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/)。
2. Connector 24.0.0 より後のバージョンでは、依存する Flink CDC のバージョンは 3.1 以上である必要があります。[ダウンロード先](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)。Flink CDC で MySQL や Oracle を同期する場合は、対応する JDBC ドライバーも `$FLINK_HOME/lib` に配置する必要があります。

## データベース全体の同期ツール {#full-database-sync-tool}

Flink クラスターを起動したら、データソースに対応するコマンドを実行します。構文とパラメータの詳細は[パラメータ](#options)を参照してください。

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
AWS Aurora MySQL または RDS MySQL にも同じコマンドを使用します。`hostname` にインスタンスのエンドポイント（例：`xxx.us-east-1.rds.amazonaws.com`）を指定し、`--mysql-conf server-time-zone=UTC` を追加してください。
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

### パラメータ {#options}

**構文**

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

**設定項目**

| キー | 説明 |
| --- | --- |
| --job-name | Flink ジョブ名。省略可能です。 |
| --database | 同期先となる Doris データベースの名前。 |
| --table-prefix | Doris テーブル名の接頭辞。例：`--table-prefix ods_`。 |
| --table-suffix | Doris テーブル名の接尾辞。使い方は上記と同じです。 |
| --including-tables | 同期する MySQL テーブル。複数のテーブルは `\|` で区切ることができ、正規表現にも対応しています。例：`--including-tables table1`。 |
| --excluding-tables | 同期しないテーブル。使い方は上記と同じです。 |
| --mysql-conf | MySQL CDCSource の設定。例：`--mysql-conf hostname=127.0.0.1`。すべての設定項目については [MySQL CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/) を参照してください。hostname/username/password/database-name は必須です。同期するデータベースやテーブルに主キーのないテーブルが含まれる場合は、`scan.incremental.snapshot.chunk.key-column` を設定する必要があり、単一の NULL 不可フィールドのみを選択できます。例：`scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`。異なるデータベースやテーブルの列はコンマで区切ります。 |
| --oracle-conf | Oracle CDCSource の設定。例：`--oracle-conf hostname=127.0.0.1`。すべての設定項目については [Oracle CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/) を参照してください。hostname/username/password/database-name/schema-name は必須です。 |
| --postgres-conf | Postgres CDCSource の設定。例：`--postgres-conf hostname=127.0.0.1`。すべての設定項目については [Postgres CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/) を参照してください。hostname/username/password/database-name/schema-name/slot.name は必須です。 |
| --sqlserver-conf | SQLServer CDCSource の設定。例：`--sqlserver-conf hostname=127.0.0.1`。すべての設定項目については [SQLServer CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/) を参照してください。hostname/username/password/database-name/schema-name は必須です。 |
| --db2-conf | DB2 CDCSource の設定。例：`--db2-conf hostname=127.0.0.1`。すべての設定項目については [DB2 CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/) を参照してください。hostname/username/password/database-name/schema-name は必須です。 |
| --mongodb-conf | MongoDB CDCSource の設定。例：`--mongodb-conf hosts=127.0.0.1:27017`。すべての設定項目については [Mongo CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/) を参照してください。hosts/username/password/database は必須です。`--mongodb-conf schema.sample-percent` は Doris テーブルを作成するために MongoDB のデータを自動サンプリングする設定で、デフォルト値は 0.2 です。 |
| --sink-conf | Doris Sink の設定項目。すべての設定項目については[シンクの設定](./write.md#options)を参照してください。 |
| --table-conf | Doris テーブルの設定項目。properties に含まれる内容です（ただし、table-buckets は properties 属性ではありません）。例：`--table-conf replication_num=1`。`--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"` では、正規表現の順序に従って各テーブルのバケット数を指定します。一致するものがない場合は、`BUCKETS AUTO` を使用してテーブルを作成します。 |
| --schema-change-mode | スキーマ変更の解析モード。`debezium_structure` と `sql_parser` の二つの解析モードに対応しています。デフォルトは `debezium_structure` です。`debezium_structure` は上流の CDC データを同期する際に使用されるデータ構造を解析し、DDL の変更操作を判定します。`sql_parser` は上流の CDC データを同期する際に DDL 文を解析して変更操作を判定するため、より正確です。使用例：`--schema-change-mode debezium_structure`。Connector 24.0.0 より後のバージョンで対応しています。 |
| --single-sink | すべてのテーブルの同期に単一の Sink を使用するかどうか。有効にすると、上流で新しく作成されたテーブルも自動検出され、テーブルが自動作成されます。 |
| --multi-to-one-origin | 上流の複数のテーブルを同じテーブルに書き込む際のソーステーブルの設定。例：`--multi-to-one-origin "a_.*\|b_.*"`。詳細は [#208](https://github.com/apache/doris-flink-connector/pull/208) を参照してください。 |
| --multi-to-one-target | `--multi-to-one-origin` と併用するターゲットテーブルの設定。例：`--multi-to-one-target "a\|b"`。 |
| --create-table-only | テーブル構造のみを同期するかどうか。 |

## FlinkSQL による単一テーブルの同期 {#single-table-sync}

Flink CDC の `mysql-cdc` ソーステーブルを通じて MySQL の変更を読み取り、Doris のシンクテーブルに書き込みます。対応する Flink CDC の Fat Jar を `$FLINK_HOME/lib` に配置する必要があります（[前提条件](#prerequisites)を参照）。削除イベントは `sink.enable-delete` を使用して同期します。

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

上流のデータが Debezium 形式の場合は、DataStream API と `JsonDebeziumSchemaSerializer` を使用して書き込むこともできます。[Debezium 形式](./datastream-api.md#debezium)を参照してください。

## 同期の動作 {#synchronization-behavior}

### DDL とスキーマ変更の同期 {#schema-change}

MySQL などの上流データソースを同期する際、上流でフィールドが追加または削除された場合は、Doris でもスキーマ変更操作を実行する必要があります。

この場合、通常は DataStream API のプログラムを作成し、DorisSink が提供する `JsonDebeziumSchemaSerializer` を使用してシリアライズします。これにより、スキーマ変更が自動的に実行されます。[Debezium 形式](./datastream-api.md#debezium)を参照してください。

Connector が提供するデータベース全体の同期ツールでは、追加の設定は不要です。上流の DDL が自動的に同期され、Doris でスキーマ変更操作が実行されます。DDL の解析方法は `--schema-change-mode` で制御します。[パラメータ](#options)を参照してください。

### キー列の更新 {#update-key-columns}

業務用データベースでは、通常、ID をテーブルの主キーとして使用します。たとえば、Student テーブルは ID（id）を主キーとして使用します。ただし、業務の変化に伴い、データに対応する ID が変更される場合があります。このような場合、Flink CDC と Doris Connector を使用してデータを同期すると、Doris の主キー列のデータも自動的に更新されます。

**仕組み**

Flink CDC の基盤となる収集ツールは Debezium です。Debezium は内部で `op` フィールドを使用して操作を識別します。`op` フィールドの値 `c`、`u`、`d`、`r` は、それぞれ作成、更新、削除、読み取りに対応します。主キー列が更新されると、Flink CDC は下流に DELETE イベントと INSERT イベントを送信します。データが Doris に同期されると、主キー列のデータが自動的に更新されます。

**使用方法**

Flink プログラムは、上記の CDC 同期例を参考にできます。ジョブの送信に成功したら、MySQL 側の主キー列に対して Update 文（例：`update student set id = '1002' where id = '1001'`）を実行し、Doris のデータを変更します。
