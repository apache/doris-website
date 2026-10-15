---
{
    "title": "他の TP システムからのデータ移行",
    "language": "ja",
    "description": "MySQL、SQL Server、Oracle、PostgreSQL などの OLTP システムから Apache Doris にデータを移行する方法を、オフライン同期とリアルタイム同期の両方を含めて説明します。",
    "keywords": [
        "MySQL から Doris への移行",
        "Oracle から Doris への移行",
        "SQL Server から Doris への移行",
        "PostgreSQL から Doris への同期",
        "OLTP データの移行",
        "Flink CDC Doris",
        "JDBC Catalog",
        "データベース全体の同期"
    ]
}
---

<!-- Knowledge type: Architecture selection decision / Operational steps -->
<!-- Applicable scenario: Migrating or synchronizing data from OLTP databases (MySQL / SQL Server / Oracle / PostgreSQL) to Apache Doris -->

このドキュメントでは、MySQL、SQL Server、Oracle、PostgreSQL などの従来型トランザクションデータベース（OLTP / TP）から Apache Doris にデータを移行する方法を説明します。Doris は、一度限りの移行、オフラインのバッチ同期、リアルタイムの増分同期に対応する複数のデータ取り込み方法を提供しています。

## 移行方法の概要

次の表は、Doris がサポートする主な移行方法をまとめたものです。データ量、同期遅延の要件、CDC（Change Data Capture）が必要かどうかに応じて選択してください。

| 方法 | 適した用途 | 同期モード | データベース全体の同期 | 増分同期 / CDC |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | 一度限りの移行、アドホッククエリ、CTAS によるテーブル作成 | オフライン / オンデマンド | SQL で実装 | 非対応 |
| Flink Doris Connector (JDBC) | Flink 環境でのオフラインバッチ同期 | オフライン | 非対応 | 非対応 |
| Flink Doris Connector (CDC) | 全量データと増分データのリアルタイム同期 | リアルタイム | 対応 | 対応（INSERT / UPDATE / DELETE） |
| Spark Connector | Spark 環境でのバッチ書き込み | オフライン | 非対応 | 非対応 |
| Streaming Job | Doris に組み込まれた MySQL / PostgreSQL からの継続的な同期 | ストリーミング（継続的） | 対応 | 対応 |
| サードパーティツール（DataX / SeaTunnel / CloudCanal） | 既存の同期プラットフォーム、GUI での操作 | オフライン / リアルタイム | 対応 | ツールによる |

> 注: 外部の計算エンジンを導入せずに移行する場合は、**Multi-Catalog** または **Streaming Job** を使用してください。リアルタイムの増分同期が必要な場合は、**Flink Doris Connector + CDC** または **Streaming Job** を使用してください。

---

## 方法 1: Multi-Catalog（一度限りの移行に推奨）

JDBC Catalog を使用して TP データベースのテーブルを Doris の外部テーブルとしてマッピングし、`INSERT INTO` または `CREATE TABLE AS SELECT (CTAS)` でデータを読み込みます。

### 手順

1. 移行元の TP データベースを指す JDBC Catalog を作成します。
2. `INSERT INTO` で既存の Doris テーブルに書き込むか、`CTAS` でテーブルの作成とデータの読み込みを一度に行います。
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

詳細は、[Catalog によるデータの取り込み](../../../lakehouse/catalog-overview.md#data-ingestion)を参照してください。

---

## 方法 2: Flink Doris Connector

Flink を使用すると、TP システムからの同期をオフラインのバッチモードまたはリアルタイムの増分モードで実行できます。

### 2.1 オフライン同期: Flink JDBC Source + Doris Sink

この方法は、Flink 環境でのオフラインデータ転送に適しています。次の Flink SQL の例は、その構成を示しています。

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

詳細は、[Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)を参照してください。

### 2.2 リアルタイム同期: Flink CDC

Flink CDC を使用すると、単一のジョブで全量データの読み取りと増分変更の取得を行い、INSERT / UPDATE / DELETE イベントを同期できます。

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

TP データベースからデータベース全体または複数のテーブルを同期する場合、Flink Doris Connector には、スキーマの同期とデータの書き込みを一度に行う組み込みのデータベース全体の同期機能があります。

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

詳細は、[データベース全体の同期](../../../connection-integration/data-integration/flink-doris-connector.md#case-4-full-database-cdc-synchronization)を参照してください。

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

- [JDBC から他のデータベースへの接続](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector によるバッチ書き込み](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## 方法 4: Streaming Job（Doris に組み込まれた継続的な同期）

Doris には、外部の計算エンジンに依存せずに MySQL または PostgreSQL からデータを継続的に同期する Streaming Job 機能が組み込まれています。

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

詳細は、[Postgres / MySQL の継続的な読み込み](../import-way/streaming-job/continuous-load-overview.md)を参照してください。

---

## 方法 5: サードパーティの同期ツール

上記の標準機能に加えて、コミュニティで一般的に使われているサードパーティの同期ツールも利用できます。これらは、すでに同期プラットフォームがある場合や、GUI でタスクを管理したい場合に適しています。

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## よくある質問

**Q1: 少数の MySQL テーブルを Doris に一度だけ移行する場合、どの方法を選べばよいですか？**

**Multi-Catalog** を使用します。JDBC Catalog を作成した後、`INSERT INTO` または `CTAS` を実行すれば、追加のコンポーネントなしで移行できます。

**Q2: MySQL から Doris に増分データ（UPDATE / DELETE を含む）をリアルタイムで同期するには、どうすればよいですか？**

**Flink Doris Connector + Flink CDC** を使用して Doris Sink で `sink.enable-delete = true` を有効にするか、Doris に組み込まれた **Streaming Job** を使用して継続的に同期します。

**Q3: MySQL データベース全体を一度に Doris に同期するには、どうすればよいですか？**

Flink Doris Connector のデータベース全体の同期機能 `mysql-sync-database`、または Streaming Job の複数テーブル同期機能を使用します。どちらの方法でも、スキーマとデータを一度に同期できます。

**Q4: Oracle、SQL Server、PostgreSQL も移行元データベースとしてサポートされていますか？**

はい。Multi-Catalog と Flink / Spark Connector は、それぞれの JDBC ドライバーを介して Oracle、SQL Server、PostgreSQL などの TP データベースをサポートしています。現在、Streaming Job がサポートするのは MySQL と PostgreSQL です。

**Q5: 移行時に Doris テーブルのレプリカ数を指定するには、どうすればよいですか？**

`PROPERTIES('replication_num' = 'N')` を `CTAS` 文で指定するか、Flink のデータベース全体の同期コマンドで `--table-conf replication_num=N` を渡します。
