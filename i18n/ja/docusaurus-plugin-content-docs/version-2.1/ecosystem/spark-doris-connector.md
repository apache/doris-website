---
{
  "title": "Spark Doris Connector",
  "language": "ja",
  "description": "Spark Doris ConnectorはSparkを通じてDorisに格納されたデータの読み取りとDorisへのデータの書き込みをサポートできます。"
}
---
# Spark Doris Connector

Spark Doris Connectorは、Sparkを通してDorisに格納されたデータの読み取りとDorisへのデータの書き込みをサポートできます。

Github: https://github.com/apache/doris-spark-connector

- `RDD`、`DataFrame`、`Spark SQL`を通して`Doris`からバッチモードでデータを読み取ることをサポートします。`DataFrame`または`Spark SQL`の使用を推奨します
- DataFrame APIとSpark SQLでバッチまたはストリーミングモードで`Doris`へのデータ書き込みをサポートします。
- `Doris`テーブルを`DataFrame`または`RDD`にマップできます。`DataFrame`の使用を推奨します。
- `Doris`側でのデータフィルタリングの完了をサポートし、データ転送量を削減します。

## バージョン互換性

| Connector | Spark               | Doris       | Java | Scala      |
|-----------|---------------------|-------------|------|------------|
| 25.2.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.1.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.1    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 25.0.0    | 3.5 - 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 24.0.0    | 3.5 ~ 3.1, 2.4      | 1.0 +       | 8    | 2.12, 2.11 |
| 1.3.2     | 3.4 ~ 3.1, 2.4, 2.3 | 1.0 ~ 2.1.6 | 8    | 2.12, 2.11 |
| 1.3.1     | 3.4 ~ 3.1, 2.4, 2.3 | 1.0 ~ 2.1.0 | 8    | 2.12, 2.11 |
| 1.3.0     | 3.4 ~ 3.1, 2.4, 2.3 | 1.0 ~ 2.1.0 | 8    | 2.12, 2.11 |
| 1.2.0     | 3.2, 3.1, 2.3       | 1.0 ~ 2.0.2 | 8    | 2.12, 2.11 |
| 1.1.0     | 3.2, 3.1, 2.3       | 1.0 ~ 1.2.8 | 8    | 2.12, 2.11 |
| 1.0.1     | 3.1, 2.3            | 0.12 - 0.15 | 8    | 2.12, 2.11 |

## 使用方法

### Maven

```
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>spark-doris-connector-spark-3.5</artifactId>
    <version>25.2.0</version>
</dependency>
``` 
::: tip

バージョン24.0.0から、Dorisコネクタパッケージの命名規則が調整されました：
1. Scalaバージョン情報が含まれなくなりました。
2. Spark 2.xバージョンでは、`spark-doris-connector-spark-2`という名前のパッケージを統一的に使用し、デフォルトではScala 2.11バージョンベースでのみコンパイルします。Scala 2.12バージョンが必要な場合は、自分でコンパイルしてください。
3. Spark 3.xバージョンでは、具体的なSparkバージョンに応じて`spark-doris-connector-spark-3.x`という名前のパッケージを使用します。Spark 3.0バージョンベースのアプリケーションは、`spark-doris-connector-spark-3.1`パッケージを使用できます。

:::

**注意**

1. 異なるSparkおよびScalaバージョンに応じて、対応するConnectorバージョンを置き換えてください。

2. [こちら](https://repo.maven.apache.org/maven2/org/apache/doris/)から関連バージョンのjarパッケージをダウンロードすることもできます。

### コンパイル

コンパイル時には、`sh build.sh`を直接実行できます。詳細については、こちらを参照してください。

コンパイルが成功すると、`dist`ディレクトリにターゲットjarパッケージが生成されます。例：spark-doris-connector-spark-3.5-25.2.0.jar。このファイルを`Spark`の`ClassPath`にコピーして`Spark-Doris-Connector`を使用します。例えば、`Spark`が`Local`モードで動作している場合は、このファイルを`jars/`フォルダに置きます。`Spark`が`Yarn`クラスタモードで動作している場合は、このファイルを事前デプロイメントパッケージに置きます。
次のこともできます

ソースコードディレクトリで実行：

`sh build.sh`

プロンプトに従って、コンパイルが必要なScalaおよびSparkバージョンを入力します。

コンパイルが成功すると、`dist`ディレクトリにターゲットjarパッケージが生成されます。例：`spark-doris-connector-spark-3.5-25.2.0.jar`。
このファイルを`Spark`の`ClassPath`にコピーして`Spark-Doris-Connector`を使用します。

例えば、`Spark`が`Local`モードで動作している場合は、このファイルを`jars/`フォルダに置きます。`Spark`が`Yarn`クラスタモードで動作している場合は、このファイルを事前デプロイメントパッケージに置きます。

例えば、`spark-doris-connector-spark-3.5-25.2.0.jar`をhdfsにアップロードし、hdfs上のJarパッケージパスを`spark.yarn.jars`パラメータに追加します

```shell

1. Upload `spark-doris-connector-spark-3.5-25.2.0.jar` to hdfs.

hdfs dfs -mkdir /spark-jars/
hdfs dfs -put /your_local_path/spark-doris-connector-spark-3.5-25.2.0.jar /spark-jars/

2. Add the `spark-doris-connector-spark-3.5-25.2.0.jar` dependency in the cluster.
spark.yarn.jars=hdfs:///spark-jars/spark-doris-connector-spark-3.5-25.2.0.jar

```
## 例

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

```scala
dorisSparkDF = spark.read.format("doris")
  .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
  .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
  .option("user", "$YOUR_DORIS_USERNAME")
  .option("password", "$YOUR_DORIS_PASSWORD")
  .load()
// show 5 lines data 
dorisSparkDF.show(5)
```
#### Arrow Flight SQLによる読み取り

バージョン24.0.0以降、Arrow Flight SQLを介してデータを読み取ることができます（Dorisバージョン>= 2.1.0が必要です）。

`doris.read.mode`をarrowに設定し、`doris.read.arrow-flight-sql.port`をFEで設定されたArrow Flight SQLポートに設定してください。

サーバー設定については、[Arrow Flight SQLベースの高速データ転送リンク](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect)を参照してください。

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
  //other options
  //specify the fields to write
  .option("doris.write.fields", "$YOUR_FIELDS_TO_WRITE")
  // Support setting Overwrite mode to overwrite data
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
### Streaming Write

#### DataFrame

##### 構造化データの書き込み

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
##### 直接書き込み

データストリーム内のデータの最初の列が、同じ列順序のCSV形式データや同じフィールド名のJSON形式データなど、`Doris`テーブル構造に適合するフォーマット済みデータの場合、`doris.sink.streaming.passthrough`オプションを`true`に設定することで、`DataFrame`に変換することなく直接`Doris`に書き込むことができます。

kafkaを例に挙げます。

そして、書き込むテーブル構造が次のようであると仮定します：

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
messageの値は`{"c0":1,"c1":"a","dt":"2024-01-01"}`のjson形式です。

```scala
val kafkaSource = spark.readStream
  .format("kafka")
  .option("kafka.bootstrap.servers", "$YOUR_KAFKA_SERVERS")
  .option("startingOffsets", "latest")
  .option("subscribe", "$YOUR_KAFKA_TOPICS")
  .load()

// Select the value of the message as the first column of the DataFrame.
kafkaSource.selectExpr("CAST(value as STRING)")
  .writeStream
  .format("doris")
  .option("checkpointLocation", "$YOUR_CHECKPOINT_LOCATION")
  .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
  .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
  .option("user", "$YOUR_DORIS_USERNAME")
  .option("password", "$YOUR_DORIS_PASSWORD")
  // Set this option to true, and the first column will be written directly without processing.
  .option("doris.sink.streaming.passthrough", "true")
  .option("doris.sink.properties.format", "json")
  .start()
  .awaitTermination()
```
#### JSON形式で書き込む

`doris.sink.properties.format`をjsonに設定します

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

バージョン24.0.0以降、Spark Catalogを通じてdorisへのアクセスをサポートしています。

#### Catalog Config

| Key                                                  | Required | Comment                                                                                                                         |
|------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------|
| spark.sql.catalog.your_catalog_name                  | true     | catalogプロバイダーのクラス名を設定します。Dorisの有効な値は`org.apache.doris.spark.catalog.DorisTableCatalog`のみです        |
| spark.sql.catalog.your_catalog_name.doris.fenodes    | true     | fe_ip:fe_http_port形式でDoris FEノードを設定します                                                                              |
| spark.sql.catalog.your_catalog_name.doris.query.port | false    | Doris FEクエリポートを設定します。`spark.sql.catalog.your_catalog_name.doris.fe.auto.fetch`がtrueに設定されている場合、このオプションは不要です |
| spark.sql.catalog.your_catalog_name.doris.user       | true     | Dorisユーザーを設定します                                                                                                                  |
| spark.sql.catalog.your_catalog_name.doris.password   | true     | Dorisパスワードを設定します                                                                                                              |
| spark.sql.defaultCatalog                             | false    | Spark SQLデフォルトcatalogを設定します                                                                                                   |

:::tip

DataFrameとSpark SQLに適用されるすべてのコネクタパラメータをcatalogに設定できます。  
例えば、データをjson形式で書き込む場合は、オプション`spark.sql.catalog.your_catalog_name.doris.sink.properties.format`を`json`に設定できます。

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

必要な設定でSpark SQL CLIを開始します。

```shell
spark-sql \
--conf "spark.sql.catalog.your_catalog_name=org.apache.doris.spark.catalog.DorisTableCatalog" \
--conf "spark.sql.catalog.your_catalog_name.doris.fenodes=192.168.0.1:8030" \
--conf "spark.sql.catalog.your_catalog_name.doris.query.port=9030" \
--conf "spark.sql.catalog.your_catalog_name.doris.user=root" \
--conf "spark.sql.catalog.your_catalog_name.doris.password=" \
--conf "spark.sql.defaultCatalog=your_catalog_name"
```
Spark SQL CLIでクエリを実行します。

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
## Configuration

### General

| Key                              | Default Value | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|----------------------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.fenodes                    | --            | Doris FE HTTPアドレス、複数のアドレスをサポート、カンマで区切る                                                                                                                                                                                                                                                                                                                                                                                                                          |
| doris.table.identifier           | --            | Dorisテーブル識別子、例：db1.tbl1                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| doris.user                       | --            | Dorisユーザー名                                                                                                                                                                                 |
| doris.password                   | Empty string  | Dorisパスワード                                                                                                                                                                                 |
| doris.request.retries            | 3             | Dorisへリクエストを送信する際のリトライ回数                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| doris.request.connect.timeout.ms | 30000         | Dorisへリクエストを送信する際の接続タイムアウト                                                                                                                                                                                                                                                                                                                                                                                                                                |
| doris.request.read.timeout.ms    | 30000         | Dorisへリクエストを送信する際の読み取りタイムアウト                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.request.query.timeout.s    | 21600          | dorisクエリのタイムアウト時間、デフォルトは6時間、-1はタイムアウト制限なしを意味する                                                                                                                                                                                                                                                                                                                                                                                               |
| doris.request.tablet.size        | 1             | 1つのRDD Partitionに対応するDoris Tabletの数。この値を小さく設定すると、より多くのパーティションが生成される。これによりSpark側の並列性が向上するが、同時にDorisに対してより大きな負荷をかけることになる。                                                                                                                                                                                                                                                                           |
| doris.read.field                 | --            | Dorisテーブル内のカラム名リスト、カンマで区切る                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| doris.batch.size                 | 4064          | BEから一度に読み取るデータの最大行数。この値を増やすことで、SparkとDoris間の接続数を減らすことができる。これにより、ネットワーク遅延によって発生する余分な時間オーバーヘッドを削減できる。                                                                                                                                                                                                                                                                                              |
| doris.exec.mem.limit             | 8589934592    | 単一クエリのメモリ制限。デフォルトは8GB、単位はバイト。                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| doris.write.fields               | --            | Dorisテーブルに書き込むフィールド（またはフィールドの順序）を指定する、フィールドはカンマで区切る。<br/>デフォルトでは、すべてのフィールドがDorisテーブルフィールドの順序で書き込まれる。                                                                                                                                                                                                                                                                                           |
| doris.sink.batch.size            | 500000        | 単一書き込みBEでの最大行数                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| doris.sink.max-retries           | 0             | BE書き込み後のリトライ回数、バージョン1.3.0以降、デフォルト値は0でリトライを行わないことを意味する。このパラメータが0より大きく設定されると、バッチレベルの失敗リトライが実行され、`doris.sink.batch.size`で設定されたサイズのデータがSpark Executorメモリにキャッシュされる。適切にメモリ割り当てを増やす必要がある場合がある。                                                                               |
| doris.sink.retry.interval.ms           | 10000             | リトライ回数を設定した後の各リトライ間の間隔、単位はms    |      
| doris.sink.properties.format     | --            | stream loadのデータフォーマット。<br/>サポートされる形式: csv、json、arrow <br/> [その他のマルチパラメータ詳細](../data-operate/import/import-way/stream-load-manual)                                                                                                                                                                                                                                                                                                                      |
| doris.sink.properties.*          | --            | Stream Loadのインポートパラメータ。<br/>例：<br/>カラム区切り文字の指定: `'doris.sink.properties.column_separator' = ','`。<br/>[その他のパラメータ詳細](../data-operate/import/import-way/stream-load-manual)                                                                                                                                                                                                                                                                                 | 
| doris.sink.task.partition.size   | --            | 書き込みタスクに対応するパーティション数。フィルタリング等の操作後、Spark RDDで書き込まれるパーティション数は多くなる可能性があるが、各Partitionに対応するレコード数は比較的少なく、書き込み頻度の増加と計算リソースの無駄につながる。この値を小さく設定すると、Doris書き込み頻度が少なくなりDorisのマージ負荷が軽減される。一般的にdoris.sink.task.use.repartitionと併用される。 |
| doris.sink.task.use.repartition  | false         | Dorisによる書き込みパーティション数を制御するためにrepartitionモードを使用するかどうか。デフォルト値はfalseでcoalesceが使用される（注：書き込み前にSparkアクションがない場合、全体の計算の並列性が低くなる）。trueに設定された場合はrepartitionが使用される（注：shuffleのコストで最終的なパーティション数を設定できる）。                                                                                                             |
| doris.sink.batch.interval.ms     | 0            | 各バッチsinkの間隔時間、単位ms。                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| doris.sink.enable-2pc            | false         | 2段階コミットを有効にするかどうか。有効にした場合、トランザクションはジョブの最後にコミットされ、一部のタスクが失敗した場合はすべてのプリコミットトランザクションがロールバックされる。                                                                                                                                                                                                                                                                                               |
| doris.sink.auto-redirect         | true          | StreamLoadリクエストをリダイレクトするかどうか。オンにした場合、StreamLoadはFE経由で書き込みを行い、明示的にBE情報を取得しなくなる。                                                                                                                                                                                                                                                                                                                                                |
| doris.enable.https               | false         | FE Httpsリクエストを有効にするかどうか。                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| doris.https.key-store-path       | -             | Httpsキーストアパス。                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| doris.https.key-store-type       | JKS           | Httpsキーストアタイプ。                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| doris.https.key-store-password   | -             | Httpsキーストアパスワード。                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.read.mode                  | thrift        | Doris読み取りモード、`thrift`と`arrow`の選択肢がある。                                                                                                                                                                                                                                                                                                                                                                                                                            |
| doris.read.arrow-flight-sql.port | -             | Doris FEのArrow Flight SQLポート。`doris.read.mode`が`arrow`の場合、Arrow Flight SQL経由でデータを読み取るために使用される。サーバー設定については、[Arrow Flight SQLベースの高速データ転送リンク](https://doris.apache.org/zh-CN/docs/dev/db-connect/arrow-flight-sql-connect)を参照                                                                                                                                                                                    |
| doris.sink.label.prefix          | spark-doris   | Stream Loadモードで書き込む際のインポートラベルプレフィックス。                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.thrift.max.message.size    | 2147483647    | Thrift経由でデータを読み取る際のメッセージの最大サイズ。                                                                                                                                                                                                                                                                                                                                                                                                                     |
| doris.fe.auto.fetch              | false         | FE情報を自動取得するかどうか。trueに設定した場合、`doris.fenodes`で設定されたノードに従ってすべてのFEノード情報が要求される。複数のノードを設定したり、`doris.read.arrow-flight-sql.port`と`doris.query.port`を個別に設定する必要がない。                                                                                                                                                                              |
| doris.read.bitmap-to-string      | false         | Bitmapタイプを配列インデックスで構成される文字列に変換して読み取るかどうか。具体的な結果フォーマットについては、関数定義[BITMAP_TO_STRING](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap-to-string)を参照。                                                                                                                                                                                       |
| doris.read.bitmap-to-base64      | false         | BitmapタイプをBase64エンコードされた文字列に変換して読み取るかどうか。具体的な結果フォーマットについては、関数定義[BITMAP_TO_BASE64](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap-to-base64)を参照。                                                                                                                                                                                                                  |
| doris.query.port                 | -             | Doris FEクエリポート、Catalogのメタデータ上書きと取得に使用される。                                                                                                                                                                                                                                                                                                                                                                                                                |


### SQL & Dataframe Configuration

| Key                             | Default Value | Comment                                                                                                                                                                                        |
|---------------------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.filter.query.in.max.count | 100           | 述語プッシュダウンにおいて、in式値リスト内の要素の最大数。この数を超えると、in式条件フィルタリングがSpark側で処理される。 |

### Structured Streaming Configuration

| Key                              | Default Value | Comment                                                          |
| -------------------------------- | ------------- | ---------------------------------------------------------------- |
| doris.sink.streaming.passthrough | false         | 処理を行わずに最初のカラムの値を直接書き込む。 |

### RDD Configuration

| Key                         | Default Value | Comment                                                                                                                                         |
|-----------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| doris.request.auth.user     | --            | Dorisユーザー名                                                                                                                                  |
| doris.request.auth.password | --            | Dorisパスワード                                                                                                                                  |
| doris.filter.query          | --            | クエリのフィルタ式、Dorisに透過的に送信される。DorisはこのはまたこのexpressionーVectorドを使用してソース側データフィルタリングを完了する。 |


## DorisからSparkへのデータタイプマッピング

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


## SparkからDorisへのデータタイプマッピング

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

バージョン24.0.0以降、Bitmapタイプの戻り値はstring型となり、デフォルトの戻り値は文字列値 `Read unsupported` です。

:::

## FAQ

1. Bitmapタイプの書き込み方法

   Spark SQLにおいて、insert intoを通じてデータを書き込む際、dorisのターゲットテーブルが`BITMAP`または`HLL`タイプのデータを含む場合、オプション`doris.ignore-type`を対応するタイプに設定し、`doris.write.fields`を通じてカラムをマップする必要がある。使用方法は以下の通り：

   **BITMAP**

    ```sql
    CREATE TEMPORARY VIEW spark_doris
    USING doris
    OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
    "doris.ignore-type"="bitmap",
    "doris.write.fields"="col1,col2,col3,bitmap_col2=to_bitmap(col2),bitmap_col3=bitmap_hash(col3)"
    );
    ```
**HLL**

    ```sql
    CREATE TEMPORARY VIEW spark_doris
    USING doris
    OPTIONS(
    "table.identifier"="$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME",
    "fenodes"="$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT",
    "user"="$YOUR_DORIS_USERNAME",
    "password"="$YOUR_DORIS_PASSWORD"
    "doris.ignore-type"="hll",
    "doris.write.fields"="col1,hll_col1=hll_hash(col1)"
    );
    ```
:::tip

バージョン24.0.0以降、`doris.ignore-type`は非推奨となり、書き込み時にこのパラメータを追加する必要はありません。

:::

2. **overwriteを使用して書き込む方法は？**

   バージョン1.3.0以降、overwriteモードでの書き込みがサポートされています（全テーブルレベルでのデータ上書きのみサポート）。具体的な使用方法は以下の通りです：

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
    INSERT OVERWRITE your_target_table SELECT * FROM your_source_table
    ```
3. **Bitmap型の読み取り方法**

   バージョン24.0.0から、Arrow Flight SQLを通じて変換されたBitmapデータの読み取りをサポートしています（Dorisバージョン >= 2.1.0が必要です）。

   **Bitmapから文字列へ**

   `DataFrame`の例は以下の通りです。`doris.read.bitmap-to-string`をtrueに設定してください。具体的な結果形式については、オプション定義を参照してください。

   ```scala
   spark.read.format("doris")
   .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
   .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
   .option("user", "$YOUR_DORIS_USERNAME")
   .option("password", "$YOUR_DORIS_PASSWORD")
   .option("doris.read.bitmap-to-string","true")
   .load()
   ```
**Bitmap to base64**

`DataFrame`の例は以下の通りです。`doris.read.bitmap-to-base64`をtrueに設定してください。具体的な結果フォーマットについては、オプションの定義を参照してください。

   ```scala
   spark.read.format("doris")
   .option("doris.table.identifier", "$YOUR_DORIS_DATABASE_NAME.$YOUR_DORIS_TABLE_NAME")
   .option("doris.fenodes", "$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT")
   .option("user", "$YOUR_DORIS_USERNAME")
   .option("password", "$YOUR_DORIS_PASSWORD")
   .option("doris.read.bitmap-to-base64","true")
   .load()
   ```
4. **DataFrame モードで書き込み時にエラーが発生する: `org.apache.spark.sql.AnalysisException: TableProvider implementation doris cannot be written with ErrorIfExists mode, please use Append or Overwrite modes instead.`**

   save mode を append に追加する必要があります。

    ```scala 
    resultDf.format("doris")
      .option("doris.fenodes","$YOUR_DORIS_FE_HOSTNAME:$YOUR_DORIS_FE_RESFUL_PORT") 
      // your own options 
      .mode(SaveMode.Append)
      .save() 
   ```
