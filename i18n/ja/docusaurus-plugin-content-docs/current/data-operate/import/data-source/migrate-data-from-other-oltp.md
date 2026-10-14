---
{
    "title": "他の TP システムからのデータ移行",
    "language": "ja",
    "description": "MySQL、SQL Server、Oracle、PostgreSQL などの OLTP システムから Apache Doris にデータを移行する方法を、オフライン同期とリアルタイム同期の両方について説明します。",
    "keywords": [
        "MySQL から Doris への移行",
        "Oracle から Doris への移行",
        "SQL Server から Doris への移行",
        "PostgreSQL から Doris への同期",
        "OLTP データ移行",
        "Flink CDC Doris",
        "JDBC Catalog",
        "データベース全体の同期"
    ]
}
---

<!-- Knowledge type: Architecture selection decision / Operational steps -->
<!-- Applicable scenario: Migrating or synchronizing data from OLTP databases (MySQL / SQL Server / Oracle / PostgreSQL) to Apache Doris -->

このドキュメントでは、MySQL、SQL Server、Oracle、PostgreSQL などの従来のトランザクションデータベース（OLTP / TP）から Apache Doris にデータを移行する方法を説明します。Doris には、一度限りの移行、オフラインでのバッチ同期、リアルタイムの増分同期に対応する複数のデータ取り込み方法があります。

## 移行方法の概要

次の表に、Doris がサポートする主な移行方法をまとめます。データ量、必要な同期遅延、CDC（Change Data Capture）の要否に応じて選択してください。

| 方法 | 適した場面 | 同期モード | データベース全体の同期 | 増分同期 / CDC |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | 一度限りの移行、アドホッククエリ、CTAS によるテーブル作成 | オフライン / オンデマンド | SQL で実装可能 | 非対応 |
| Flink Doris Connector（JDBC） | Flink を使用したオフラインのバッチ同期 | オフライン | 非対応 | 非対応 |
| Flink Doris Connector（CDC） | リアルタイムの全量同期と増分同期 | リアルタイム | 対応 | 対応（INSERT / UPDATE / DELETE） |
| Spark Connector | Spark を使用したバッチデータ書き込み | オフライン | 非対応 | 非対応 |
| Streaming Job | Doris に組み込まれた MySQL / PostgreSQL からの継続的な同期 | ストリーミング（継続的） | 対応 | 対応 |
| サードパーティツール（DataX / SeaTunnel / CloudCanal） | 既存の同期プラットフォーム、GUI を使った操作 | オフライン / リアルタイム | 対応 | ツールによって異なる |

> 注: 外部のコンピューティングエンジンを導入せずに移行する場合は、**Multi-Catalog** または **Streaming Job** を使用します。リアルタイムの増分同期が必要な場合は、**Flink Doris Connector + CDC** または **Streaming Job** を使用します。

---

## 方法 1: Multi-Catalog（一度限りの移行に推奨）

JDBC Catalog を使用して TP データベースのテーブルを Doris の外部テーブルとしてマッピングし、`INSERT INTO` または `CREATE TABLE AS SELECT (CTAS)` でデータを取り込みます。

### 手順

1. 移行元の TP データベースを参照する JDBC Catalog を作成します。
2. `INSERT INTO` で既存の Doris テーブルに書き込むか、`CTAS` でテーブルの作成とデータの取り込みを一度に行います。
3. 行数とフィールドの整合性を確認します。

### 例: MySQL からのデータ移行

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

詳細については、[Catalog のデータインポート](../../../lakehouse/catalog-overview.md#data-ingestion)を参照してください。

---

## 方法 2: Flink Doris Connector

Flink を使用すると、TP システムからの同期をオフラインのバッチモードまたはリアルタイムの増分モードで実行できます。

### 2.1 オフライン同期: Flink JDBC Source + Doris Sink

この方法は、Flink を使用してオフラインでデータを移動する場合に適しています。次の Flink SQL の例は、その基本的な構成を示しています。

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

詳細については、[Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)を参照してください。

### 2.2 リアルタイム同期: Flink CDC

Flink CDC を使用すると、単一のジョブでデータの全量読み取りと増分変更のキャプチャを行い、INSERT / UPDATE / DELETE イベントを同期できます。

#### 単一テーブルのリアルタイム同期の例

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

#### データベース全体 / 複数テーブルの同期

TP データベースの全体または複数のテーブルを同期する場合、Flink Doris Connector には、スキーマの同期とデータの書き込みを一度に行うデータベース全体の同期機能が用意されています。

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

詳細については、[データベース全体の同期](../../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)を参照してください。

---

## 方法 3: Spark Connector

この方法は、すでに Spark でバッチ処理を行っている場合に適しています。Spark Connector の JDBC Source で TP データベースから読み取り、Doris Sink で Doris に書き込めます。

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

関連ドキュメント:

- [JDBC を使用した他のデータベースへの接続](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector のバッチ書き込み](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## 方法 4: Streaming Job（Doris に組み込まれた継続的な同期）

Doris には、外部のコンピューティングエンジンに依存せず、MySQL または PostgreSQL からデータを継続的に同期する Streaming Job 機能があります。

### 複数テーブルの同期の例

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

詳細については、[Postgres / MySQL の継続的なロード](../import-way/streaming-job/continuous-load-overview.md)を参照してください。

---

## 方法 5: サードパーティの同期ツール

上記の Doris が提供する方法に加えて、コミュニティの一般的なサードパーティ同期ツールも使用できます。既存の同期プラットフォームがある場合や、GUI でタスクを管理したい場合に適しています。

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## よくある質問

**Q1: 少数の MySQL テーブルを Doris に一度だけ移行する場合、どの方法を選べばよいですか？**

**Multi-Catalog** を使用します。JDBC Catalog を作成した後、`INSERT INTO` または `CTAS` を実行すれば、追加のコンポーネントなしで移行できます。

**Q2: MySQL から Doris に増分データ（UPDATE / DELETE を含む）をリアルタイムで同期するにはどうすればよいですか？**

**Flink Doris Connector + Flink CDC** を使用し、Doris Sink で `sink.enable-delete = true` を有効にします。または、Doris に組み込まれた **Streaming Job** を使用して継続的に同期します。

**Q3: MySQL データベース全体を Doris に一度に同期するにはどうすればよいですか？**

Flink Doris Connector の `mysql-sync-database` 機能、または Streaming Job の複数テーブル同期機能を使用します。どちらもスキーマとデータを一度に同期します。

**Q4: Oracle、SQL Server、PostgreSQL も移行元データベースとしてサポートされていますか？**

はい。Multi-Catalog と Flink / Spark Connector は、それぞれに対応する JDBC ドライバーを介して Oracle、SQL Server、PostgreSQL などの TP データベースをサポートします。現在、Streaming Job は MySQL と PostgreSQL をサポートします。

**Q5: 移行時に Doris テーブルのレプリカ数を指定するにはどうすればよいですか？**

`PROPERTIES('replication_num' = 'N')` を `CTAS` ステートメントで指定するか、Flink のデータベース全体の同期コマンドで `--table-conf replication_num=N` を渡します。
