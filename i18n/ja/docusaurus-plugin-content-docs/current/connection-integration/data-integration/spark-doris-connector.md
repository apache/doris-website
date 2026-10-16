---
{
    "title": "Spark Doris Connector",
    "language": "ja",
    "description": "Spark Doris Connector を使用して、Apache Spark から Doris のデータをバッチで読み書きしたり、ストリーミングで書き込んだりできます。DataFrame、Spark SQL、Catalog、Arrow Flight SQL に対応しています。",
    "keywords": [
        "Spark Doris Connector",
        "Apache Spark で Doris を読み書き",
        "Doris DataFrame",
        "Doris Spark SQL",
        "Spark Doris Catalog",
        "Arrow Flight SQL"
    ]
}
---

# Spark Doris Connector

<!-- Knowledge type: Operation guide + Configuration parameters + FAQ -->
<!-- Applicable scenarios: Spark reading Doris / Spark writing Doris / Spark SQL integration / Streaming write / Arrow Flight SQL high-speed read -->

Spark Doris Connector は、Apache Doris と Apache Spark を接続するコネクタです。Spark から Doris に保存されたデータを読み取り、Spark から Doris にデータを書き込めます。リポジトリ: [apache/doris-spark-connector](https://github.com/apache/doris-spark-connector)。

主な機能は次のとおりです。

| ユースケース | 推奨する方法 | 説明 |
| --- | --- | --- |
| Doris データのバッチ読み取り | DataFrame、Spark SQL | RDD にも対応しています。DataFrame または Spark SQL を推奨します。 |
| Doris データのバッチ書き込み | DataFrame、Spark SQL | 書き込む列を指定できます。バージョン 1.3.0 以降は Overwrite モードにも対応しています。 |
| Doris データのストリーミング書き込み | Structured Streaming | 通常の構造化データの書き込みに加え、DataFrame の最初の列をそのまま書き込めます。 |
| Doris データの高速読み取り | Arrow Flight SQL | バージョン 24.0.0 以降で対応しています。Doris バージョン 2.1.0 以降が必要です。 |
| Catalog 経由での Doris へのアクセス | Spark Doris Catalog | バージョン 24.0.0 以降で対応しています。Spark Catalog から Doris のデータベースとテーブルを管理できます。 |

## はじめる前に

<!-- Knowledge type: Version compatibility + Installation -->
<!-- Applicable scenarios: Pre-integration preparation / Dependency selection -->

### バージョンの互換性

まず、使用する Spark、Doris、Java、Scala のバージョンに対応する Connector のバージョンを選択します。

| Connector | Spark | Doris | Java | Scala |
| --- | --- | --- | --- | --- |
| 26.1.0 | 4.1, 3.5 - 3.1, 2.4 | 1.0 + | 17 (4.1), 8 (3.x, 2.x) | 2.13 (4.1), 2.12 (3.x), 2.11 (2.x) |
| 26.0.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.2.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.1.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.0.1 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 25.0.0 | 3.5 - 3.1, 2.4 | 1.0 + | 8 | 2.12, 2.11 |
| 1.3.2 | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.6 | 8 | 2.12, 2.11 |
| 1.3.1 | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8 | 2.12, 2.11 |
| 1.3.0 | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8 | 2.12, 2.11 |
| 1.2.0 | 3.2, 3.1, 2.3 | 1.0 - 2.0.2 | 8 | 2.12, 2.11 |
| 1.1.0 | 3.2, 3.1, 2.3 | 1.0 - 1.2.8 | 8 | 2.12, 2.11 |
| 1.0.1 | 3.1, 2.3 | 0.12 - 0.15 | 8 | 2.12, 2.11 |

### Maven で依存関係を追加する

プロジェクトの `pom.xml` に Spark Doris Connector の依存関係を追加します。使用する Spark と Connector のバージョンに応じて、`artifactId` と `version` を変更してください。

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>26.1.0</version>
</dependency>
```

:::tip

バージョン 24.0.0 以降、Doris Connector のパッケージ命名規則が変更されています。

1. Scala のバージョン情報はパッケージ名に含まれなくなりました。
2. Spark 2.x では、共通のパッケージ名 `spark-doris-connector-spark-2` を使用します。デフォルトでは Scala 2.11 向けにのみコンパイルされます。Scala 2.12 版が必要な場合は、自分でコンパイルしてください。
3. Spark 3.x では、使用する Spark のバージョンに対応する `spark-doris-connector-spark-3.x` パッケージを使用します。Spark 3.0 では `spark-doris-connector-spark-3.1` パッケージを使用できます。

:::

対応するバージョンの Jar ファイルは [Maven リポジトリ](https://repo.maven.apache.org/maven2/org/apache/doris/)からダウンロードすることもできます。

### ソースからコンパイルする

ソースコードを自分でコンパイルする場合は、ソースディレクトリで `sh build.sh` を実行し、プロンプトに従って必要な Scala と Spark のバージョンを入力します。

コンパイルに成功すると、`dist` ディレクトリに対象の Jar ファイル（例: `spark-doris-connector-spark-3.5-26.1.0.jar`）が生成されます。このファイルを Spark の `classpath` に配置すると、Spark Doris Connector を使用できます。

| Spark の実行モード | Jar ファイルの配置方法 |
| --- | --- |
| ローカルモード | Jar ファイルを `jars/` ディレクトリに配置します。 |
| Yarn クラスターモード | Jar ファイルを事前にデプロイするパッケージに配置します。 |

たとえば、`spark-doris-connector-spark-3.5-26.1.0.jar` を HDFS にアップロードし、`spark.yarn.jars` で依存関係を追加します。

```shell
# 1. Upload spark-doris-connector-spark-3.5-26.1.0.jar to HDFS
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-26.1.0.jar /spark-jars/

# 2. Add the spark-doris-connector-spark-3.5-26.1.0.jar dependency in the cluster
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-26.1.0.jar
```

## シナリオ 1: Doris データをバッチで読み取る

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch reading Doris data -->

Spark Doris Connector は、DataFrame、Spark SQL、RDD、PySpark による Doris データの読み取りに対応しています。Doris データの読み取りには DataFrame または Spark SQL を推奨します。

### DataFrame で読み取る

```scala
val dorisSparkDF = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .load()

dorisSparkDF.show(5)
```

### Spark SQL で読み取る

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
);

SELECT * FROM spark_doris;
```

### RDD で読み取る

```scala
import org.apache.doris.spark._

val dorisSparkRDD = sc.dorisRDD(
    tableIdentifier = Some("$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME"),
    cfg = Some(Map(
        "doris.fenodes" -> "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
        "doris.request.auth.user" -> "$YOUR_DORIS_USERNAME",
        "doris.request.auth.password" -> "$YOUR_DORIS_PASSWORD"
    ))
)

dorisSparkRDD.collect()
```

### PySpark で読み取る

```python
dorisSparkDF = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .load()

# Show 5 rows of data
dorisSparkDF.show(5)
```

### Arrow Flight SQL で高速に読み取る

バージョン 24.0.0 以降、Spark Doris Connector は Arrow Flight SQL によるデータ読み取りに対応しています。この方法には Doris バージョン 2.1.0 以降が必要です。

次のパラメータを設定します。

| パラメータ | 説明 |
| --- | --- |
| `doris.read.mode` | `arrow` に設定すると、Arrow Flight SQL でデータを読み取ります。 |
| `doris.read.arrow-flight-sql.port` | FE に設定された Arrow Flight SQL ポートを指定します。 |

サーバー側の設定については、[Arrow Flight SQL に基づく高速データ転送リンク](../arrow-flight-sql.md)を参照してください。

```scala
val df = spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("doris.user", "$YOUR_DORIS_USERNAME")
    .option("doris.password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.mode", "arrow")
    .option("doris.read.arrow-flight-sql.port", "12345")
    .load()

df.show()
```

## シナリオ 2: Doris データをバッチで書き込む

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark batch writing Doris data -->

Spark Doris Connector は、DataFrame と Spark SQL による Doris データのバッチ書き込みに対応しています。

### DataFrame で書き込む

```scala
val mockDataDF = List(
    (3, "440403001005", "21.cn"),
    (1, "4404030013005", "22.cn"),
    (33, null, "23.cn")
).toDF("id", "mi_code", "mi_name")

mockDataDF.show(5)

mockDataDF.write.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    // Specify the columns to write
    .option("doris.write.fields", "$YOUR_FIELDS_TO_WRITE")
    // Overwrite is supported starting from version 1.3.0
    // .mode(SaveMode.Overwrite)
    .save()
```

### Spark SQL で書き込む

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
);

INSERT INTO spark_doris VALUES ("VALUE1", "VALUE2", ...);

-- insert into select
INSERT INTO spark_doris SELECT * FROM YOUR_TABLE;

-- insert overwrite
INSERT OVERWRITE spark_doris SELECT * FROM YOUR_TABLE;
```

## シナリオ 3: Doris データをストリーミングで書き込む

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Spark Structured Streaming writing Doris data -->

Spark Doris Connector は、Structured Streaming から Doris への書き込みに対応しています。データが Doris テーブルのスキーマに適合しているかどうかに応じて、構造化データとして書き込む方法と、最初の列をそのまま書き込む方法を選べます。

### 構造化データを書き込む

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.writeStream
    .format("doris")
    .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .start()
    .awaitTermination()
```

### データストリームの最初の列をそのまま書き込む

データストリームの最初の列が Doris テーブルのスキーマに適合している場合、たとえば列順が同じ CSV データや、フィールド名が一致する JSON データの場合は、`doris.sink.streaming.passthrough` を `true` に設定します。これにより、内容を複数の DataFrame 列に展開せず、最初の列をそのまま書き込めます。

次の例では Kafka をソースとして使用します。書き込み先の Doris テーブルに次のスキーマがあるとします。

```sql
CREATE TABLE `t2` (
    `c0` int NULL,
    `c1` varchar(10) NULL,
    `c2` date NULL
) ENGINE=OLAP
DUPLICATE KEY(`c0`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`c0`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

Kafka メッセージの `value` は、`{"c0":1,"c1":"a","c2":"2024-01-01"}` 形式の JSON データです。

```scala
val kafkaSource = spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "$YOUR_KAFKA_SERVERS")
    .option("startingOffsets", "latest")
    .option("subscribe", "$YOUR_KAFKA_TOPICS")
    .load()

// Select value as the first column of the DataFrame
kafkaSource.selectExpr("CAST(value as STRING)")
    .writeStream
    .format("doris")
    .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    // Setting this option to true writes the first column of the DataFrame directly
    .option("doris.sink.streaming.passthrough", "true")
    .option("doris.sink.properties.format", "json")
    .start()
    .awaitTermination()
```

### JSON 形式で書き込む

`doris.sink.properties.format` を `json` に設定すると、Connector はデータを JSON 形式で Doris に書き込みます。

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.writeStream
    .format("doris")
    .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.sink.properties.format", "json")
    .start()
    .awaitTermination()
```

## シナリオ 4: Spark Doris Catalog 経由で Doris にアクセスする

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Spark Catalog managing Doris databases and tables -->

バージョン 24.0.0 以降、Spark Doris Connector は Spark Catalog 経由での Doris へのアクセスに対応しています。

### Catalog の設定項目

| オプション名 | 必須 | 説明 |
| --- | --- | --- |
| `spark.sql.catalog.your_catalog_name` | はい | Catalog プロバイダーのクラス名を指定します。Doris で有効な値は `org.apache.doris.spark.catalog.DorisTableCatalog` のみです。 |
| `spark.sql.catalog.your_catalog_name.doris.fenodes` | はい | Doris FE ノードを `fe_ip:fe_http_port` 形式で指定します。 |
| `spark.sql.catalog.your_catalog_name.doris.query.port` | いいえ | Doris FE のクエリポートを指定します。`spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch` が `true` の場合は省略できます。 |
| `spark.sql.catalog.your_catalog_name.doris.user` | はい | Doris のユーザーを指定します。 |
| `spark.sql.catalog.your_catalog_name.doris.password` | はい | Doris のパスワードを指定します。 |
| `spark.sql.defaultCatalog` | いいえ | Spark SQL のデフォルト Catalog を指定します。 |

:::tip

DataFrame と Spark SQL に適用できる Connector のパラメータは、すべて Catalog にも設定できます。たとえば、JSON 形式でデータを書き込むには、`spark.sql.catalog.your_catalog_name.doris.sink.properties.format` を `json` に設定します。

:::

### DataFrame プログラムで Catalog を使用する

```scala
val conf = new SparkConf()
conf.set("spark.sql.catalog.your_catalog_name", "org.apache.doris.spark.catalog.DorisTableCatalog")
conf.set("spark.sql.catalog.your_catalog_name.doris.fenodes", "192.168.0.1:8030")
conf.set("spark.sql.catalog.your_catalog_name.doris.query.port", "9030")
conf.set("spark.sql.catalog.your_catalog_name.doris.user", "root")
conf.set("spark.sql.catalog.your_catalog_name.doris.password", "")
val spark = builder.config(conf).getOrCreate()
spark.sessionState.catalogManager.setCurrentCatalog("your_catalog_name")

// show all databases
spark.sql("show databases")

// use databases
spark.sql("use your_doris_db")

// show tables in test
spark.sql("show tables")

// query table
spark.sql("select * from your_doris_table")

// write data
spark.sql("insert into your_doris_table values(xxx)")
```

### Spark SQL CLI で Catalog を使用する

必要なパラメータを設定して Spark SQL CLI を起動します。

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```

Spark SQL CLI でクエリを実行します。

```sparksql
-- show all databases
show databases;

-- use databases
use your_doris_db;

-- show tables in test
show tables;

-- query table
select * from your_doris_table;

-- write data
insert into your_doris_table values(xxx);
insert into your_doris_table select * from your_source_table;

-- access table with full name
select * from your_catalog_name.your_doris_db.your_doris_table;
insert into your_catalog_name.your_doris_db.your_doris_table values(xxx);
insert into your_catalog_name.your_doris_db.your_doris_table select * from your_source_table;
```

## Java の例

Java 版の例は `samples/doris-demo/spark-demo/` にあります。[apache/doris のサンプルディレクトリ](https://github.com/apache/doris/tree/master/samples/doris-demo/spark-demo)を参照してください。

## 設定リファレンス

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Parameter lookup / Performance tuning / Write behavior tuning -->

### 共通の設定項目

| キー | デフォルト値 | 説明 |
| --- | --- | --- |
| `doris.fenodes` | -- | Doris FE の HTTP アドレス。複数指定する場合はカンマで区切ります。 |
| `doris.table.identifier` | -- | Doris テーブル名。例: `db1.tbl1`。 |
| `doris.user` | -- | Doris にアクセスするユーザー名。 |
| `doris.password` | 空文字列 | Doris にアクセスするためのパスワード。 |
| `doris.request.retries` | 3 | Doris へのリクエスト送信時の再試行回数。 |
| `doris.request.connect.timeout.ms` | 30000 | Doris へのリクエスト送信時の接続タイムアウト。 |
| `doris.request.read.timeout.ms` | 30000 | Doris へのリクエスト送信時の読み取りタイムアウト。 |
| `doris.request.query.timeout.s` | 21600 | Doris クエリのタイムアウト。デフォルトは 6 時間です。`-1` はタイムアウトなしを意味します。 |
| `doris.request.tablet.size` | 1 | 一つの RDD Partition に対応する Doris Tablet の数。値を小さくすると Partition の数が増え、Spark 側の並列度が上がりますが、Doris への負荷も増えます。 |
| `doris.read.field` | -- | Doris テーブルから読み取る列名のリスト。カンマで区切ります。 |
| `doris.batch.size` | 4064 | 一回のバッチで BE から読み取る行数の上限。値を大きくすると Spark と Doris 間で確立する接続数が減り、ネットワーク遅延による追加の時間的負荷が軽減されます。 |
| `doris.exec.mem.limit` | 8589934592 | 一つのクエリのメモリ上限。デフォルトは 8 GB で、単位はバイトです。 |
| `doris.write.fields` | -- | Doris テーブルに書き込むフィールド、またはフィールドの順序をカンマ区切りで指定します。デフォルトでは、Doris テーブルのフィールド順にすべてのフィールドを書き込みます。 |
| `doris.sink.batch.size` | 500000 | 一回のバッチで BE に書き込む行数の上限。 |
| `doris.sink.max-retries` | 0 | BE への書き込みが失敗した後の再試行回数。バージョン 1.3.0 以降のデフォルトは 0 で、再試行しません。この値が 0 より大きい場合はバッチ単位で再試行し、`doris.sink.batch.size` 件分のデータが Spark Executor のメモリにキャッシュされます。そのため、必要に応じてメモリ割り当てを増やしてください。 |
| `doris.sink.retry.interval.ms` | 10000 | 再試行回数を設定した場合の、再試行間隔（ミリ秒）。 |
| `doris.sink.properties.format` | csv | Stream Load のデータ形式。`csv`、`json`、`arrow` の三形式に対応します。その他のパラメータは[Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。 |
| `doris.sink.properties.*` | -- | Stream Load のインポートパラメータ。たとえば、`'doris.sink.properties.column_separator' = ','` で列区切り文字を指定します。その他のパラメータは[Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。 |
| `doris.sink.task.partition.size` | -- | Doris への書き込みタスクに対応する Partition 数。フィルタリングなどの Spark RDD 操作後は、書き込む Partition 数が多くても、Partition ごとのレコード数は少ない場合があります。その場合、書き込み頻度が上がり、計算リソースが無駄になります。この値を小さくすると Doris への書き込み頻度と compaction の負荷が下がります。`doris.sink.task.use.repartition` と併用します。 |
| `doris.sink.task.use.repartition` | false | Doris に書き込む Partition 数の制御に repartition を使用するかどうか。デフォルトの `false` では coalesce を使用します。書き込み前に Spark の action 演算子がない場合、全体の計算並列度が下がる可能性があります。`true` では repartition を使用します。最終的な Partition 数を設定できますが、追加の shuffle 負荷が発生します。 |
| `doris.sink.batch.interval.ms` | 0 | sink バッチ間の間隔（ミリ秒）。 |
| `doris.sink.enable-2pc` | false | 二相コミットを有効にするかどうか。有効にすると、ジョブの終了時にトランザクションがコミットされ、一部のタスクが失敗した場合は pre-commit 状態のすべてのトランザクションがロールバックされます。 |
| `doris.sink.auto-redirect` | true | Stream Load リクエストをリダイレクトするかどうか。有効にすると Stream Load は FE 経由で書き込まれ、BE の情報を明示的に取得しなくなります。 |
| `doris.enable.tls` | false | Doris への接続で TLS を有効にするかどうか。 |
| `doris.tls.ca-certificate-path` | 空文字列 | PEM 形式の CA 証明書チェーンへのパス。空の場合、Connector はカスタム CA を読み込まず、該当するクライアントのデフォルトのトラストストアを使用します。 |
| `doris.tls.skip-hostname-verification` | false | CA 検証を維持したままホスト名検証をスキップするかどうか。Arrow Flight SQL はこのオプションに対応していません。 |
| `doris.tls.excluded-protocols` | 空文字列 | TLS を使用しないプロトコルをカンマ区切りで指定します。指定できる値は `http`、`mysql`、`thrift`、`arrowflight` です。 |
| `doris.read.mode` | thrift | Doris の読み取りモード。指定できる値は `thrift` と `arrow` です。 |
| `doris.read.arrow-flight-sql.port` | - | Doris FE の Arrow Flight SQL ポート。`doris.read.mode` が `arrow` の場合、Arrow Flight SQL によるデータ読み取りに使用します。サーバー側の設定については、[Arrow Flight SQL に基づく高速データ転送リンク](../arrow-flight-sql.md)を参照してください。 |
| `doris.sink.mode` | stream_load | Doris の書き込みモード。指定できる値は `stream_load` と `tvf` です。 |
| `doris.sink.label.prefix` | spark-doris | Doris への書き込みに使用するラベルのプレフィックス。 |
| `doris.sink.s3.endpoint` | - | S3 互換オブジェクトストレージのエンドポイント。TVF 書き込みモードでは必須です。 |
| `doris.sink.s3.region` | - | オブジェクトストレージのリージョン。TVF 書き込みモードでは必須です。 |
| `doris.sink.s3.bucket` | - | データの一時保存に使用するバケット。TVF 書き込みモードでは必須です。 |
| `doris.sink.s3.prefix` | - | データの一時保存に使用するオブジェクトキーのプレフィックス。TVF 書き込みモードでは必須です。 |
| `doris.sink.s3.access-key` | - | オブジェクトストレージのアクセスキー。TVF 書き込みモードでは必須です。 |
| `doris.sink.s3.secret-key` | - | オブジェクトストレージのシークレットキー。TVF 書き込みモードでは必須です。 |
| `doris.sink.s3.path-style-access` | false | TVF 書き込みモードでパス形式のオブジェクトストレージアクセスを使用するかどうか。 |
| `doris.thrift.max.message.size` | 2147483647 | Thrift によるデータ読み取り時のメッセージサイズの上限。 |
| `doris.fe.auto.fetch` | false | FE 情報を自動取得するかどうか。`true` に設定すると、`doris.fenodes` に設定したノードを基にすべての FE ノード情報を取得するため、複数のノードや `doris.read.arrow-flight-sql.port` と `doris.query.port` を個別に設定する必要はありません。 |
| `doris.read.bitmap-to-string` | false | 読み取り時に Bitmap 型を配列インデックスからなる文字列に変換するかどうか。結果の形式については、関数定義の [BITMAP_TO_STRING](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md) を参照してください。 |
| `doris.read.bitmap-to-base64` | false | 読み取り時に Bitmap 型を Base64 エンコードされた文字列に変換するかどうか。結果の形式については、関数定義の [BITMAP_TO_BASE64](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md) を参照してください。 |
| `doris.query.port` | - | Doris FE のクエリポート。上書き書き込みと Catalog のメタデータ取得に使用します。 |

### SQL と DataFrame 固有の設定

| キー | デフォルト値 | 説明 |
| --- | --- | --- |
| `doris.filter.query.in.max.count` | 10000 | 述語プッシュダウンで `in` 式に指定できる値の最大数。この数を超えると、`in` 式のフィルターは Spark 側で処理されます。 |

### Structured Streaming 固有の設定

| キー | デフォルト値 | 説明 |
| --- | --- | --- |
| `doris.sink.streaming.passthrough` | false | 最初の列の値を処理せずにそのまま書き込みます。 |

### RDD 固有の設定

| キー | デフォルト値 | 説明 |
| --- | --- | --- |
| `doris.request.auth.user` | -- | Doris にアクセスするユーザー名。 |
| `doris.request.auth.password` | -- | Doris にアクセスするためのパスワード。 |
| `doris.filter.query` | -- | 読み取るデータを絞り込む式。この式は Doris にそのまま渡され、Doris がソースデータのフィルタリングに使用します。 |

## 型の対応関係

<!-- Knowledge type: Type mapping reference -->
<!-- Applicable scenarios: Schema design / Read-write type compatibility check -->

### Doris から Spark への列の型の対応関係

| Doris の型 | Spark の型 |
| --- | --- |
| NULL_TYPE | DataTypes.NullType |
| BOOLEAN | DataTypes.BooleanType |
| TINYINT | DataTypes.ByteType |
| SMALLINT | DataTypes.ShortType |
| INT | DataTypes.IntegerType |
| BIGINT | DataTypes.LongType |
| FLOAT | DataTypes.FloatType |
| DOUBLE | DataTypes.DoubleType |
| DATE | DataTypes.DateType |
| DATETIME | DataTypes.TimestampType |
| DECIMAL | DecimalType |
| CHAR | DataTypes.StringType |
| LARGEINT | DecimalType |
| VARCHAR | DataTypes.StringType |
| STRING | DataTypes.StringType |
| JSON | DataTypes.StringType |
| VARIANT | DataTypes.StringType |
| TIME | DataTypes.DoubleType |
| HLL | DataTypes.StringType |
| Bitmap | DataTypes.StringType |

### Spark から Doris へのデータ型の対応関係

| Spark の型 | Doris の型 |
| --- | --- |
| BooleanType | BOOLEAN |
| ShortType | SMALLINT |
| IntegerType | INT |
| LongType | BIGINT |
| FloatType | FLOAT |
| DoubleType | DOUBLE |
| DecimalType | DECIMAL |
| StringType | VARCHAR/STRING |
| DateType | DATE |
| TimestampType | DATETIME |
| ArrayType | ARRAY |
| MapType | MAP/JSON |
| StructType | STRUCT/JSON |

:::tip

バージョン 24.0.0 以降、Bitmap 型を読み取ったときの戻り値の型は string で、デフォルトで返される文字列は `Read unsupported` です。

:::

## ベストプラクティス

### Spark から TLS が有効な Doris 環境にアクセスする

Spark から TLS が有効な Doris クラスターを読み書きする場合は、`doris.enable.tls` を `true` に設定します。

```scala
mockDataDF.write.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTPS_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.enable.tls", "true")
    .option("doris.tls.ca-certificate-path", "/etc/doris-tls/ca.pem")
    .save()
```

CA ファイルは Spark ドライバーとすべての executor から利用できる必要があります。`doris.tls.ca-certificate-path` を設定していない場合、Connector はカスタム CA を読み込まず、該当するクライアントのデフォルトのトラストストアを使用します。

Spark のデプロイモードに応じて CA ファイルを配布します。

- **YARN**: `--files /local/path/ca.pem` を `spark-submit` に追加し、`doris.tls.ca-certificate-path` を `ca.pem` に設定します。
- **Kubernetes**: ドライバーと executor の両方の Pod に同じ Secret またはボリュームをマウントします。たとえば、`--conf spark.kubernetes.driver.secrets.doris-tls=/etc/doris-tls` と `--conf spark.kubernetes.executor.secrets.doris-tls=/etc/doris-tls` を `spark-submit` に追加し、CA のパスを `/etc/doris-tls/ca.pem` に設定します。

### S3 TVF 書き込みモードを使用する

TVF 書き込みモードでは、データを JSON として S3 互換オブジェクトストレージに保存してから、S3 TVF 経由で Doris に書き込みます。バッチ書き込みにのみ対応しています。Spark と Doris の両方からオブジェクトストレージにアクセスでき、書き込み先の Doris テーブルがすでに存在することを確認してください。

```scala
mockDataDF.write.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("doris.query.port", "$YOUR_DORIS_FE_QUERY_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.sink.mode", "tvf")
    .option("doris.sink.s3.endpoint", "$YOUR_S3_ENDPOINT")
    .option("doris.sink.s3.region", "$YOUR_S3_REGION")
    .option("doris.sink.s3.bucket", "$YOUR_S3_BUCKET")
    .option("doris.sink.s3.prefix", "$YOUR_S3_PREFIX")
    .option("doris.sink.s3.access-key", "$YOUR_S3_ACCESS_KEY")
    .option("doris.sink.s3.secret-key", "$YOUR_S3_SECRET_KEY")
    .mode(SaveMode.Append)
    .save()
```

Connector は一時保存したオブジェクトを自動削除しません。必要に応じてオブジェクトストレージのライフサイクルポリシーを設定してください。

## FAQ とトラブルシューティング

<!-- Knowledge type: FAQ + Troubleshooting -->
<!-- Applicable scenarios: Bitmap/HLL writing / Overwrite writing / ErrorIfExists error handling -->

### Bitmap 型を書き込むには？

Spark SQL で `INSERT INTO` を使って書き込むとき、書き込み先の Doris テーブルに `BITMAP` 型または `HLL` 型のデータが含まれる場合は、`doris.ignore-type` を該当する型に設定し、`doris.write.fields` で列の対応付けと変換を指定します。

**BITMAP**

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD",
    "doris.ignore-type"="bitmap",
    "doris.write.fields"="col1,col2,col3,bitmap_col2=to_bitmap(col2),bitmap_col3=bitmap_hash(col3)"
);
```

**HLL**

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD",
    "doris.ignore-type"="hll",
    "doris.write.fields"="col1,hll_col1=hll_hash(col1)"
);
```

:::tip

バージョン 24.0.0 以降、`doris.ignore-type` は非推奨です。書き込み時にこのパラメータを追加する必要はありません。

:::

### Overwrite 書き込みを使用するには？

バージョン 1.3.0 以降、Connector は書き込み時の Overwrite モードに対応しています。Overwrite で置き換えられるのはテーブル全体のデータのみです。使用方法は次のとおりです。

**DataFrame**

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Overwrite)
    .save()
```

**SQL**

```sparksql
INSERT OVERWRITE your_target_table SELECT * FROM your_source_table;
```

### Bitmap 型を読み取るには？

バージョン 24.0.0 以降、Connector は Arrow Flight SQL を使った変換済み Bitmap データの読み取りに対応しています。この機能には Doris バージョン 2.1.0 以降が必要です。

**Bitmap から String への変換**

DataFrame の場合、`doris.read.bitmap-to-string` を `true` に設定します。結果の形式については、オプションの定義を参照してください。

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-string", "true")
    .load()
```

**Bitmap から Base64 への変換**

DataFrame の場合、`doris.read.bitmap-to-base64` を `true` に設定します。結果の形式については、オプションの定義を参照してください。

```scala
spark.read.format("doris")
    .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    .option("user", "$YOUR_DORIS_USERNAME")
    .option("password", "$YOUR_DORIS_PASSWORD")
    .option("doris.read.bitmap-to-base64", "true")
    .load()
```

### DataFrame の書き込み中に ErrorIfExists エラーが発生した場合は？

DataFrame の書き込みが `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.` というエラーで失敗した場合は、保存モードを `Append` に設定します。

```scala
resultDf.write.format("doris")
    .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_HTTP_PORT")
    // your own options
    .mode(SaveMode.Append)
    .save()
```
