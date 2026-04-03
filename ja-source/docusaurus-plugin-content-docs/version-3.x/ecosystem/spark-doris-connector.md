---
{
  "title": "Spark Doris Connector",
  "language": "ja",
  "description": "Spark Doris ConnectorはApache DorisとApache Sparkを接続するコネクタで、RDD、DataFrame、Spark SQLを通じてDorisデータの読み書きをサポートします。バッチおよびストリーミング書き込み、データフィルタプッシュダウン、Arrow Flight SQL高速伝送などの機能をサポートし、Spark 2.xおよび3.xバージョンと互換性があります。"
}
---
# Spark Doris Connector

Spark Doris Connectorは、Sparkを通じてDorisに保存されたデータの読み取り、およびSparkを通じてDorisへのデータ書き込みをサポートします。

コードリポジトリ: https://github.com/apache/doris-spark-connector

- `RDD`、`DataFrame`、`Spark SQL`メソッドを通じて`Doris`からのバッチデータ読み取りをサポートします。`DataFrame`または`Spark SQL`の使用を推奨します。
- `DataFrame`と`Spark SQL`を使用した`Doris`へのバッチまたはストリーミングデータ書き込みをサポートします。
- データ転送量を削減するため、`Doris`側でのデータフィルタリングをサポートします。

## バージョン互換性

| Connector | Spark               | Doris       | Java | Scala      |
|-----------|---------------------|-------------|------|------------|
| 25.2.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.1.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.1    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 1.3.2     | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.6 | 8    | 2.12, 2.11 |
| 1.3.1     | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8    | 2.12, 2.11 |
| 1.3.0     | 3.4 - 3.1, 2.4, 2.3 | 1.0 - 2.1.0 | 8    | 2.12, 2.11 |
| 1.2.0     | 3.2, 3.1, 2.3       | 1.0 - 2.0.2 | 8    | 2.12, 2.11 |
| 1.1.0     | 3.2, 3.1, 2.3       | 1.0 - 1.2.8 | 8    | 2.12, 2.11 |
| 1.0.1     | 3.1, 2.3            | 0.12 - 0.15 | 8    | 2.12, 2.11 |

## 使用方法

### Maven

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.2.0</version>
</dependency>
```
:::tip

バージョン24.0.0から、Doris Connectorパッケージの命名規則が調整されました：

1. Scalaバージョン情報は含まれなくなりました。
2. Spark 2.xバージョンでは、`spark-doris-connector-spark-2`という名前のパッケージを統一して使用します。これはデフォルトでScala 2.11に基づいてコンパイルされています。Scala 2.12バージョンが必要な場合は、ご自身でコンパイルしてください。
3. Spark 3.xバージョンでは、具体的なSparkバージョンに応じて`spark-doris-connector-spark-3.x`という名前のパッケージを使用します。Spark 3.0の場合は、`spark-doris-connector-spark-3.1`パッケージを使用できます。

:::

**注意事項**

1. 異なるSparkおよびScalaバージョンに応じて、対応するConnectorバージョンを置き換えてください。
2. [こちら](https://repo.maven.apache.org/maven2/org/apache/doris/)から関連するバージョンのjarパッケージをダウンロードすることもできます。

### コンパイル

ソースコードディレクトリで`sh build.sh`を実行し、プロンプトに従ってコンパイルに必要なScalaおよびSparkバージョンを入力します。

コンパイルが成功すると、`dist`ディレクトリにターゲットjarパッケージが生成されます。例：`spark-doris-connector-spark-3.5-25.2.0.jar`。このファイルを`Spark`の`ClassPath`にコピーして`Spark-Doris-Connector`を使用します。

例えば、`Local`モードで実行している`Spark`の場合、このファイルを`jars/`フォルダに配置します。`Yarn`クラスターモードで実行している`Spark`の場合、このファイルを事前デプロイメントパッケージに配置します。

例えば、`spark-doris-connector-spark-3.5-25.2.0.jar`をHDFSにアップロードし、HDFS上のjarパッケージパスを`spark.yarn.jars`パラメータに追加します：

```shell
# 1. Upload spark-doris-connector-spark-3.5-25.2.0.jar to HDFS
hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.2.0.jar /spark-jars/

# 2. Add spark-doris-connector-spark-3.5-25.2.0.jar dependency in the cluster
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.2.0.jar
```
## 使用例

### バッチ読み取り

#### RDD

```scala
import org.apache.doris.spark._

val dorisSparkRDD = sc.dorisRDD(
    tableIdentifier = Some("$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME"),
    cfg = Some(Map(
        "doris.fenodes" -> "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
        "doris.request.auth.user" -> "$YOUR_DORIS_USERNAME",
        "doris.request.auth.password" -> "$YOUR_DORIS_PASSWORD"
    ))
)

dorisSparkRDD.collect()
```
#### DataFrame

```scala
val dorisSparkDF = spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .load()

dorisSparkDF.show(5)
```
#### Spark SQL

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
);

SELECT * FROM spark_doris;
```
#### pySpark

```python
dorisSparkDF = spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .load()
# show 5 lines data 
dorisSparkDF.show(5)
```
#### Arrow Flight SQL経由での読み取り

バージョン24.0.0以降、Arrow Flight SQL経由でのデータ読み取りがサポートされています（Dorisバージョン >= 2.1.0が必要）。

`doris.read.mode`を`arrow`に設定し、`doris.read.arrow-flight-sql.port`をFEで設定されたArrow Flight SQLポートに設定してください。サーバー設定については、[Arrow Flight SQLベースの高速データ転送](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect)を参照してください。

```scala
val df = spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("doris.user", "$YOUR_DORIS_USERNAME")
        .option("doris.password", "$YOUR_DORIS_PASSWORD")
        .option("doris.read.mode", "arrow")
        .option("doris.read.arrow-flight-sql.port", "12345")
        .load()

df.show()
```
### バッチ書き込み

#### DataFrame

```scala
val mockDataDF = List(
    (3, "440403001005", "21.cn"),
    (1, "4404030013005", "22.cn"),
    (33, null, "23.cn")
).toDF("id", "mi_code", "mi_name")
mockDataDF.show(5)

mockDataDF.write.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        // Other options
        // Specify columns to write
        .option("doris.write.fields", "$YOUR_FIELDS_TO_WRITE")
        // Starting from version 1.3.0, overwrite write is supported
        // .mode(SaveMode.Overwrite)
        .save()
```
#### Spark SQL

```sparksql
CREATE TEMPORARY VIEW spark_doris
USING doris
OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
);

INSERT INTO spark_doris VALUES ("VALUE1", "VALUE2", ...);
-- insert into select
INSERT INTO spark_doris SELECT * FROM YOUR_TABLE;
-- insert overwrite
INSERT OVERWRITE SELECT * FROM YOUR_TABLE;
```
### ストリーミング書き込み

#### DataFrame

##### 構造化データ書き込み

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.writeStream
        .format("doris")
        .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .start()
        .awaitTermination()
```
##### Direct Write

データストリームの最初の列が`Doris`テーブル構造に準拠している場合、例えば同じ列順序のCSVデータや一貫したフィールド名を持つJSONデータの場合、`doris.sink.streaming.passthrough`オプションを`true`に設定することで、`DataFrame`に変換せずにこの列のデータを直接書き込むことができます。

Kafkaソースを例に取ります：

書き込み対象のテーブル構造が以下のようになっていると仮定します：

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
メッセージの値はJSON形式です: `{"c0":1,"c1":"a","dt":"2024-01-01"}`。

```scala
val kafkaSource = spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "$YOUR_KAFKA_SERVERS")
        .option("startingOffsets", "latest")
        .option("subscribe", "$YOUR_KAFKA_TOPICS")
        .load()

// Select value as the first column of DataFrame
kafkaSource.selectExpr("CAST(value as STRING)")
        .writeStream
        .format("doris")
        .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        // Setting this option to true will directly write the first column of DataFrame
        .option("doris.sink.streaming.passthrough", "true")
        .option("doris.sink.properties.format", "json")
        .start()
        .awaitTermination()
```
#### JSON形式での書き込み

`doris.sink.properties.format`を`json`に設定します。

```scala
val df = spark.readStream.format("your_own_stream_source").load()

df.write.format("doris")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .option("doris.sink.properties.format", "json")
        .save()
```
### Spark Doris Catalog

バージョン24.0.0以降、Spark Catalogを通じてDorisへのアクセスがサポートされています。

#### Catalog Config

| Option Name                                          | Required | Comment                                                                                                                                                              |
|------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| spark.sql.catalog.your_catalog_name                  | Yes      | Catalogプロバイダーのクラス名を設定します。Dorisの場合、有効な値は`org.apache.doris.spark.catalog.DorisTableCatalog`のみです。                                 |
| spark.sql.catalog.your_catalog_name.doris.fenodes    | Yes      | Doris FEノードをfe_ip:fe_http_port形式で設定します。                                                                                                                 |
| spark.sql.catalog.your_catalog_name.doris.query.port | No       | Doris FEクエリポートを設定します。このオプションは`spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch`がtrueの場合は省略できます。                                        |
| spark.sql.catalog.your_catalog_name.doris.user       | Yes      | Dorisユーザーを設定します。                                                                                                                                                      |
| spark.sql.catalog.your_catalog_name.doris.password   | Yes      | Dorisパスワードを設定します。                                                                                                                                                  |
| spark.sql.defaultCatalog                             | No       | Spark SQLデフォルトカタログを設定します。                                                                                                                                      |


:::tip

DataFrameとSpark SQLに適用可能なすべてのコネクタパラメータをカタログに設定できます。  
例えば、データをjson形式で書き込みたい場合は、オプション`spark.sql.catalog.your_catalog_name.doris.sink.properties.format`を`json`に設定できます。

:::

#### DataFrame

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
#### Spark SQL

必要なパラメータを設定し、Spark SQL CLIを開始します：

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```
Spark SQL CLIでクエリを実行する:

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
### Javaの例

Javaバージョンの例は、参考として`samples/doris-demo/spark-demo/`の下に提供されています。[こちら](https://github.com/apache/incubator-doris/tree/master/samples/doris-demo/spark-demo)を参照してください。

## 設定

### 一般設定

| Key                              | Default Value  | Comment                                                                                                                                                                                                            |
|----------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.fenodes                    | --             | Doris FEのhttpアドレス、カンマで区切られた複数のアドレスをサポート                                                                                                                                                                             |
| doris.table.identifier           | --             | Dorisテーブル名、例：db1.tbl1                                                                                                                                                                                   |
| doris.user                       | --             | Dorisにアクセスするためのユーザー名                                                                                                                                                                                           |
| doris.password                   | Empty string   | Dorisにアクセスするためのパスワード                                                                                                                                                                                           |
| doris.request.retries            | 3              | Dorisに送信されるリクエストの再試行回数                                                                                                                                                                                       |
| doris.request.connect.timeout.ms | 30000          | Dorisに送信されるリクエストの接続タイムアウト                                                                                                                                                                                      |
| doris.request.read.timeout.ms    | 30000          | Dorisに送信されるリクエストの読み取りタイムアウト                                                                                                                                                                                            |
| doris.request.query.timeout.s    | 21600          | Dorisのクエリタイムアウト、デフォルト値は6時間、-1はタイムアウト制限なしを意味します                                                                                                                                     |
| doris.request.tablet.size        | 1              | 1つのRDD Partitionに対応するDoris Tabletの数<br />この値が小さいほど、より多くのPartitionが生成され、Sparkの並列性が向上しますが、Dorisにより多くの圧迫を与えます      |
| doris.read.field                 | --             | Dorisテーブルから読み取るカラム名のリスト、カンマ区切り                                                                                                                                                                 |
| doris.batch.size                 | 4064           | BEから一度に読み取る行の最大数。この値を増やすと、SparkとDoris間で確立される接続数を減らすことができます<br />それにより、ネットワーク遅延による余分な時間オーバーヘッドを削減します |
| doris.exec.mem.limit             | 8589934592     | 単一クエリのメモリ制限。デフォルトは8GB、バイト単位                                                                                                                                                          |
| doris.write.fields               | --             | Dorisテーブルに書き込むフィールドまたはフィールド順序を指定、カンマ区切り<br />デフォルトでは、すべてのフィールドがDorisテーブルフィールドの順序で書き込まれます                                                       |
| doris.sink.batch.size            | 500000         | BEに一度に書き込まれる行の最大数                                                                                                                                                                       |
| doris.sink.max-retries           | 0              | BEへの書き込みが失敗した後の再試行回数。バージョン1.3.0以降、デフォルト値は0で、デフォルトでは再試行しません。このパラメータが0より大きく設定された場合、バッチレベルの失敗再試行が実行され、`doris.sink.batch.size`で設定されたサイズのデータがSpark Executorメモリにキャッシュされるため、メモリ割り当てを適切に増やす必要がある場合があります |
| doris.sink.retry.interval.ms     | 10000          | 再試行回数を設定した後の、各再試行間の間隔、ms単位                                                                                                                                   |       
| doris.sink.properties.format     | csv            | Stream LoadのデータフォーマットCSV、json、arrowの3つのフォーマットをサポート<br/> [より詳細なパラメータ](https://doris.apache.org/docs/data-operate/import/stream-load-manual/)                                       |
| doris.sink.properties.*          | --             | Stream Loadのインポートパラメータ<br/>例：<br/>カラム区切り文字を指定：`'doris.sink.properties.column_separator' = ','`など<br/> [より詳細なパラメータ](https://doris.apache.org/docs/data-operate/import/stream-load-manual/) |
| doris.sink.task.partition.size   | --             | Doris書き込みタスクに対応するPartitionの数。Spark RDDがフィルタリングやその他の操作を経た後、最終的に書き込まれるPartitionの数は比較的多くなる可能性がありますが、各Partitionに対応するレコード数は比較的少なく、書き込み頻度の増加とコンピューティングリソースの無駄を招きます<br/>この値を小さく設定するほど、Doris書き込み頻度を低くでき、Dorisマージ圧力を軽減できます。このパラメータはdoris.sink.task.use.repartitionと組み合わせて使用されます |
| doris.sink.task.use.repartition  | false          | repartition方法を使用してDoris書き込みPartitionの数を制御するかどうか。デフォルト値はfalseで、coalesce方法を使用して制御します（注意：書き込み前にSpark actionオペレータがない場合、全体の計算並列性が低下する可能性があります）<br/>trueに設定すると、repartition方法が使用されます（注意：最終的なPartition数は設定できますが、shuffle オーバーヘッドが追加で増加します） |
| doris.sink.batch.interval.ms     | 0              | 各バッチSinkの間隔時間、ms単位                                                                                                                                                                          |
| doris.sink.enable-2pc            | false          | 2フェーズコミットを有効にするかどうか。有効にすると、ジョブの終了時にトランザクションがコミットされ、一部のタスクが失敗した場合、事前コミット状態のすべてのトランザクションがロールバックされます                    |
| doris.sink.auto-redirect         | true           | StreamLoadリクエストをリダイレクトするかどうか。有効にすると、StreamLoadは明示的にBE情報を取得せずにFE経由で書き込みます                                                                             |
| doris.enable.https               | false          | FE Httpsリクエストを有効にするかどうか                                                                                                                                                                               |
| doris.https.key-store-path       | -              | Httpsキーストアパス                                                                                                                                                                                              |
| doris.https.key-store-type       | JKS            | Httpsキーストアタイプ                                                                                                                                                                                              |
| doris.https.key-store-password   | -              | Httpsキーストアパスワード                                                                                                                                                                                          |
| doris.read.mode                  | thrift         | Doris読み取りモード、オプションは`thrift`と`arrow`                                                                                                                                                                 |
| doris.read.arrow-flight-sql.port | -              | Doris FEのArrow Flight SQLポート。`doris.read.mode`が`arrow`の場合、Arrow Flight SQL経由でデータを読み取るために使用されます。サーバー設定については、[Arrow Flight SQLベースの高速データ転送](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect)を参照 |
| doris.sink.label.prefix          | spark-doris    | Stream Load モードで書き込む際のインポートラベルプレフィックス                                                                                                                                                              |
| doris.thrift.max.message.size    | 2147483647     | Thrift経由でデータを読み取る際の最大メッセージサイズ                                                                                                                                                             |
| doris.fe.auto.fetch              | false          | FE情報を自動取得するかどうか。trueに設定すると、`doris.fenodes`で設定されたノードに基づいてすべてのFEノード情報がリクエストされ、複数のノードを追加で設定したり、`doris.read.arrow-flight-sql.port`と`doris.query.port`を個別に設定する必要がありません |
| doris.read.bitmap-to-string      | false          | 読み取り時にBitmapタイプを配列インデックスで構成された文字列に変換するかどうか。具体的な結果フォーマットについては、関数定義[BITMAP_TO_STRING](../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md)を参照 |
| doris.read.bitmap-to-base64      | false          | 読み取り時にBitmapタイプをBase64エンコード文字列に変換するかどうか。具体的な結果フォーマットについては、関数定義[BITMAP_TO_BASE64](../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md)を参照 |
| doris.query.port                 | -              | Doris FEクエリポート、overwrite書き込みとCatalogメタデータ取得に使用                                                                                                                                     |

### SQLとDataframe固有設定

| Key                             | Default Value | Comment                                                                |
|---------------------------------|--------------|------------------------------------------------------------------------|
| doris.filter.query.in.max.count | 10000        | 述語プッシュダウンのin式の値リストの要素の最大数。この数を超えると、in式条件フィルタリングはSpark側で処理されます |

### Structured Streaming固有設定

| Key                              | Default Value | Comment                                                          |
| -------------------------------- | ------------- | ---------------------------------------------------------------- |
| doris.sink.streaming.passthrough | false         | 処理せずに最初のカラムの値を直接書き込む |

### RDD固有設定

| Key                         | Default Value | Comment                                      |
|-----------------------------|---------------|----------------------------------------------|
| doris.request.auth.user     | --            | Dorisにアクセスするためのユーザー名                     |
| doris.request.auth.password | --            | Dorisにアクセスするためのパスワード                     |
| doris.filter.query          | --            | 読み取りデータをフィルタリングする式、この式はDorisに透過的に送信されます。DorisはこのでDorisはこの式を使用してソースデータフィルタリングを完了します |


## DorisからSparkカラムタイプマッピング

| Doris Type | Spark Type              |
|------------|-------------------------|
| NULL_TYPE  | DataTypes.NullType      |
| BOOLEAN    | DataTypes.BooleanType   |
| TINYINT    | DataTypes.ByteType      |
| SMALLINT   | DataTypes.ShortType     |
| INT        | DataTypes.IntegerType   |
| BIGINT     | DataTypes.LongType      |
| FLOAT      | DataTypes.FloatType     |
| DOUBLE     | DataTypes.DoubleType    |
| DATE       | DataTypes.DateType      |
| DATETIME   | DataTypes.TimestampType |
| DECIMAL    | DecimalType             |
| CHAR       | DataTypes.StringType    |
| LARGEINT   | DecimalType             |
| VARCHAR    | DataTypes.StringType    |
| STRING     | DataTypes.StringType    |
| JSON       | DataTypes.StringType    |
| VARIANT    | DataTypes.StringType    |
| TIME       | DataTypes.DoubleType    |
| HLL        | DataTypes.StringType    |
| Bitmap     | DataTypes.StringType    |

## SparkからDorisデータタイプマッピング

| Spark Type     | Doris Type     |
|----------------|----------------|
| BooleanType    | BOOLEAN        |
| ShortType      | SMALLINT       |
| IntegerType    | INT            |
| LongType       | BIGINT         |
| FloatType      | FLOAT          |
| DoubleType     | DOUBLE         |
| DecimalType    | DECIMAL        |
| StringType     | VARCHAR/STRING |
| DateType       | DATE           |
| TimestampType  | DATETIME       |
| ArrayType      | ARRAY          |
| MapType        | MAP/JSON       |
| StructType     | STRUCT/JSON    |

:::tip

バージョン24.0.0以降、Bitmapタイプの読み取り戻り値タイプは文字列で、デフォルトで文字列値「Read unsupported」を返します。

:::

## FAQ

1. **Bitmapタイプの書き込み方法は？**

    Spark SQLで、INSERT INTO方法でデータを書き込む際、DorisのターゲットテーブルにBITMAP`またはHLL`タイプのデータが含まれている場合、パラメータ`doris.ignore-type`を対応するタイプに設定し、`doris.write.fields`を通してカラムをマッピングおよび変換する必要があります。使用方法は以下の通りです：

    **BITMAP**

    ```sparksql
    CREATE TEMPORARY VIEW spark_doris
    USING doris
    OPTIONS(
        "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
        "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
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
        "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
        "user"="$YOUR_DORIS_USERNAME",
        "password"="$YOUR_DORIS_PASSWORD",
        "doris.ignore-type"="hll",
        "doris.write.fields"="col1,hll_col1=hll_hash(col1)"
    );
    ```
:::tip

バージョン 24.0.0 から、`doris.ignore-type` は非推奨となり、書き込み時に追加する必要がありません。

:::

2. **Overwrite書き込みの使用方法**

バージョン 1.3.0 から、Overwriteモード書き込みがサポートされています（全テーブルレベルのデータ上書きのみサポート）。具体的な使用方法は以下の通りです：

**DataFrame**

    ```scala
    resultDf.format("doris")
        .option("doris.fenodes","$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        // your own options
        .mode(SaveMode.Overwrite)
        .save()
    ```
**SQL**

    ```sparksql
    INSERT OVERWRITE your_target_table SELECT * FROM your_source_table;
    ```
3. **Bitmap型の読み込み方法**

    バージョン24.0.0以降、Arrow Flight SQLを通じて変換されたBitmapデータの読み込みがサポートされています（Dorisバージョン >= 2.1.0が必要）。

    **BitmapからStringへ**

    `DataFrame`メソッドを例として、`doris.read.bitmap-to-string`を`true`に設定します。具体的な結果フォーマットについては、オプション定義を参照してください。

    ```scala
    spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .option("doris.read.bitmap-to-string", "true")
        .load()
    ```
**Bitmap to Base64**

    `DataFrame`メソッドを例として、`doris.read.bitmap-to-base64`を`true`に設定します。具体的な結果形式については、オプション定義を参照してください。

    ```scala
    spark.read.format("doris")
        .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
        .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        .option("user", "$YOUR_DORIS_USERNAME")
        .option("password", "$YOUR_DORIS_PASSWORD")
        .option("doris.read.bitmap-to-base64", "true")
        .load()
    ```
4. **DataFrame経由で書き込み時のエラー: `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`**

    保存モードをAppendとして追加する必要があります:

    ```scala
    resultDf.format("doris")
        .option("doris.fenodes","$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
        // your own options
        .mode(SaveMode.Append)
        .save()
    ```
