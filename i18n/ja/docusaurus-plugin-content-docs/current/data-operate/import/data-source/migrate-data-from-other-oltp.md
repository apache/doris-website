---
{
    "title": "他の TP システムからのデータ移行",
    "language": "ja",
    "description": "MySQL、SQL Server、Oracle、PostgreSQL などの OLTP システムから Apache Doris にデータを移行する方法について説明し、オフライン同期とリアルタイム同期の両方を扱います。",
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

このドキュメントでは、MySQL、SQL Server、Oracle、PostgreSQL などの従来のトランザクション処理（OLTP / TP）データベースから Apache Doris にデータを移行する方法について説明します。Doris には、1 回限りの移行、オフラインバッチ同期、リアルタイム増分同期など、さまざまなシナリオに対応する複数のデータ取り込みオプションがあります。

## 移行オプションの概要 {#overview-of-migration-options}

次の表に、Doris がサポートする主な移行オプションをまとめます。データ量、同期レイテンシの要件、CDC（変更データキャプチャ）が必要かどうかに基づいて選択できます。

| オプション | 適用シナリオ | 同期モード | データベース全体をサポート | 増分 / CDC をサポート |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | 1 回限りの移行、アドホッククエリ、CTAS によるテーブル作成 | オフライン / オンデマンド | SQL で実装 | いいえ |
| Flink Doris Connector (JDBC) | Flink スタックでのオフラインバッチ同期 | オフライン | いいえ | いいえ |
| Flink Doris Connector (CDC) | リアルタイムの全量 + 増分同期 | リアルタイム | はい | サポート（INSERT / UPDATE / DELETE） |
| Spark Connector | Spark スタックでのバッチデータ書き込み | オフライン | いいえ | いいえ |
| Streaming Job | Doris に組み込まれた MySQL / PostgreSQL からの継続同期 | ストリーミング（継続） | はい | サポート |
| サードパーティツール（NineData / DataX / SeaTunnel / CloudCanal） | 既存の同期プラットフォーム、ビジュアル運用 | オフライン / リアルタイム | はい | サポート |

> 注: 外部計算エンジンを導入せずに移行を完了する必要がある場合は、**Multi-Catalog** または **Streaming Job** を使用します。リアルタイム増分同期が必要な場合は、**Flink Doris Connector + CDC**、**Streaming Job**、または MySQL 互換ソースから Doris への同期に **NineData** を使用します。

---

## オプション 1：Multi-Catalog（1 回限りの移行に推奨） {#option-1-multi-catalog-recommended-for-one-time-migration}

JDBC Catalog を使用して TP データベースのテーブルを Doris の外部テーブルとしてマッピングし、`INSERT INTO` または `CREATE TABLE AS SELECT (CTAS)` を使用してデータをロードします。

### 手順 {#steps}

1. ソース TP データベースを参照する JDBC Catalog を作成します。
2. `INSERT INTO` を使用して既存の Doris テーブルに書き込むか、`CTAS` を使用してテーブルを作成し、データを 1 回の操作でロードします。
3. 行数とフィールドの整合性を確認します。

### 例：MySQL からのデータ移行 {#example-migrating-data-from-mysql}

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

詳細については、[Catalog データロード](../../../lakehouse/catalog-overview.md#data-ingestion)を参照してください。

---

## オプション 2：Flink Doris Connector {#option-2-flink-doris-connector}

Flink を使用すると、TP システムの同期をオフラインバッチモードまたはリアルタイム増分モードで実行できます。

### 2.1 オフライン同期：Flink JDBC Source + Doris Sink {#21-offline-synchronization-flink-jdbc-source--doris-sink}

このオプションは、Flink スタックでのオフラインデータ移送に適しています。次の Flink SQL の例にパターンを示します。

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

### 2.2 リアルタイム同期：Flink CDC {#22-real-time-synchronization-flink-cdc}

Flink CDC を使用すると、1 つのジョブで全量データの読み取りと増分キャプチャを実行し、INSERT / UPDATE / DELETE イベントを同期できます。

#### 単一テーブルのリアルタイム同期例 {#single-table-real-time-synchronization-example}

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

#### データベース全体 / 複数テーブルの同期 {#whole-database--multi-table-synchronization}

TP データベース全体または複数テーブルを同期する場合、Flink Doris Connector にはすぐに使用できるデータベース全体の同期機能が用意されており、スキーマの同期とデータの書き込みを 1 回の操作で実行できます。

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

## オプション 3：Spark Connector {#option-3-spark-connector}

このオプションは、すでに Spark をバッチ処理に使用しているシナリオに適しています。Spark Connector の JDBC Source を使用して TP データベースから読み取り、Doris Sink を使用して Doris に書き込めます。

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

関連ドキュメント：

- [他のデータベースへの JDBC](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector のバッチ書き込み](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## オプション 4：Streaming Job（Doris 組み込みの継続同期） {#option-4-streaming-job-built-in-continuous-synchronization-in-doris}

Doris には組み込みの Streaming Job 機能があり、外部計算エンジンに依存せずに MySQL または PostgreSQL からデータを継続的に同期できます。

### 複数テーブル同期の例 {#multi-table-synchronization-example}

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

詳細については、[Postgres / MySQL Continuous Load](../import-way/streaming-job/continuous-load-overview.md)を参照してください。

---

## オプション 5：サードパーティ同期ツール {#option-5-third-party-synchronization-tools}

上記のネイティブオプションに加えて、コミュニティプロジェクトやベンダーが提供するサードパーティ同期ツールを使用してデータを移行できます。特に、すでに同期プラットフォームを使用している場合や、ビジュアルインターフェイスでタスクを管理したい場合に適しています。

- [NineData](https://docs.ninedata.cloud/en/replication/mysql_to_others/mysql_to_doris/)
- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## FAQ {#faq}

**Q1：MySQL の数個のテーブルを Doris に 1 回だけ移行する場合、どのオプションを選択すべきですか？**

**Multi-Catalog** を使用します。JDBC Catalog を作成した後、`INSERT INTO` または `CTAS` を実行すれば、追加コンポーネントなしで移行を完了できます。

**Q2：MySQL から Doris に増分データ（UPDATE / DELETE を含む）をリアルタイムで同期するにはどうすればよいですか？**

**Flink Doris Connector + Flink CDC** を使用し、Doris Sink で `sink.enable-delete = true` を有効にするか、Doris に組み込まれた **Streaming Job** を使用して継続的に同期します。

**Q3：MySQL データベース全体を Doris に 1 回の操作で同期するにはどうすればよいですか？**

Flink Doris Connector の `mysql-sync-database` データベース全体同期機能、または Streaming Job の複数テーブル同期機能を使用します。どちらのオプションでも、スキーマとデータを 1 回の操作で同期できます。

**Q4：Oracle、SQL Server、PostgreSQL もソースデータベースとしてサポートされますか？**

はい。Multi-Catalog と Flink / Spark Connector は、それぞれの JDBC ドライバを通じて Oracle、SQL Server、PostgreSQL などの TP データベースをサポートします。Streaming Job は現在、MySQL と PostgreSQL をサポートしています。

**Q5：移行中に Doris テーブルのレプリケーション数を指定するにはどうすればよいですか？**

`CTAS` ステートメントで `PROPERTIES('replication_num' = 'N')` を指定するか、Flink のデータベース全体同期コマンドで `--table-conf replication_num=N` を渡します。
