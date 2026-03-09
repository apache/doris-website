---
{
  "title": "Flink Doris コネクター",
  "language": "ja",
  "description": "Flink Doris ConnectorはFlinkを通じてDorisクラスターからデータを読み取り、データを書き込むために使用されます。また、FlinkCDCも統合しています。"
}
---
[Flink Doris Connector](https://github.com/apache/doris-flink-connector)は、Flinkを通じてDorisクラスターからデータを読み取り、データを書き込むために使用されます。また、MySQL等の上流データベースとのより便利な全データベース同期を可能にする[FlinkCDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)も統合されています。

Flink Connectorを使用することで、以下の操作を実行できます：

- **Dorisからのデータ読み取り**: Flink ConnectorはBEからの並列読み取りをサポートし、データ取得効率を向上させます。

- **Dorisへのデータ書き込み**: Flinkでバッチ処理した後、Stream Loadを使用してデータを一括でDorisにインポートします。

- **Lookup Joinを使用したディメンションテーブル結合**: バッチ処理と非同期クエリによりディメンションテーブル結合を高速化します。

- **全データベース同期**: Flink CDCを使用して、MySQL、Oracle、PostgreSQL等のデータベース全体を同期でき、自動テーブル作成やDDL操作も含まれます。

## バージョン説明

| Connector Version | Flink Version             | Doris Version | Java Version | Scala Version |
| ----------------- | ------------------------- | ------------- | ------------ | ------------- |
| 1.0.3             | 1.11,1.12,1.13,1.14       | 0.15+         | 8            | 2.11,2.12     |
| 1.1.1             | 1.14                      | 1.0+          | 8            | 2.11,2.12     |
| 1.2.1             | 1.15                      | 1.0+          | 8            | -             |
| 1.3.0             | 1.16                      | 1.0+          | 8            | -             |
| 1.4.0             | 1.15 - 1.17               | 1.0+          | 8            | -             |
| 1.5.2             | 1.15 - 1.18               | 1.0+          | 8            | -             |
| 1.6.1             | 1.15 - 1.19               | 1.0+          | 8            | -             |
| 24.0.1            | 1.15 - 1.20               | 1.0+          | 8            | -             |
| 24.1.0            | 1.15 - 1.20               | 1.0+          | 8            | -             |
| 25.0.0            | 1.15 - 1.20               | 1.0+          | 8            | -             |
| 25.1.0            | 1.15 - 1.20               | 1.0+          | 8            | -             |
| 26.0.0            | 1.15 - 1.20,2.0 - 2.2     | 1.0+          | 8(1.x),17(2.x) | -             |

## 使用方法

Flink Doris ConnectorはJarまたはMavenの2つの方法で使用できます。

#### Jar

対応するバージョンのFlink Doris Connector Jarファイルを[こちら](https://doris.apache.org/download#doris-ecosystem)からダウンロードし、このファイルを`Flink`セットアップの`classpath`にコピーして`Flink-Doris-Connector`を使用できます。`Standalone`モードのFlinkデプロイメントの場合は、このファイルを`lib/`フォルダー下に配置してください。`Yarn`モードで動作するFlinkクラスターの場合は、デプロイ前パッケージにファイルを配置してください。

#### Maven

Mavenで使用するには、Pomファイルに以下の依存関係を追加するだけです：

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-${flink.version}</artifactId>
  <version>${connector.version}</version>
</dependency> 
```
例えば：

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-1.16</artifactId>
  <version>25.1.0</version>
</dependency> 
```
## 動作原理

### Dorisからのデータ読み取り

![Flink Connector Principles JDBC Doris](/images/ecomsystem/flink-connector/FlinkConnectorPrinciples-JDBC-Doris.png)

データ読み取り時、Flink Doris ConnectorはFlink JDBC Connectorと比較して高いパフォーマンスを提供するため、使用を推奨します：

- **Flink JDBC Connector**: DorisはMySQLプロトコルと互換性がありますが、Dorisクラスターへの読み書きにFlink JDBC Connectorを使用することは推奨されません。このアプローチは単一のFEノードでのシリアルな読み書き操作となり、ボトルネックを生成してパフォーマンスに影響します。

- **Flink Doris Connector**: Doris 2.1以降、ADBCがFlink Doris Connectorのデフォルトプロトコルです。読み取り処理は以下の手順に従います：

  a. Flink Doris Connectorはまずクエリプランに基づいてFEからTablet ID情報を取得します。

  b. クエリ文を生成します：`SELECT * FROM tbs TABLET(id1, id2, id3)`。

  c. クエリはFEのADBCポートを通じて実行されます。

  d. データはFEを迂回してBEから直接返され、シングルポイントボトルネックを排除します。

### Dorisへのデータ書き込み

データ書き込みにFlink Doris Connectorを使用する場合、Flinkのメモリ内でバッチ処理が実行され、その後Stream Loadによる一括インポートが行われます。Doris Flink Connectorは2つのバッチモードを提供し、Flink Checkpointベースのストリーミング書き込みがデフォルトです：

|          | ストリーミング書き込み | バッチ書き込み |
|----------|----------------|-------------|
| **トリガー条件** | Flink Checkpointに依存し、Flinkのcheckpointサイクルに従ってDorisに書き込み | コネクタで定義された時間またはデータ量の閾値に基づく定期的な送信 |
| **一貫性** | Exactly-Once | At-Least-Once；プライマリキーモデルでExactly-Onceを保証可能 |
| **レイテンシ** | Flink checkpointインターバルによって制限され、一般的により高い | 独立したバッチメカニズムで柔軟な調整が可能 |
| **障害許容性と回復** | Flinkステート回復と完全に一致 | 外部重複排除ロジックに依存（例：Dorisプライマリキー重複排除） |


## クイックスタート

#### 準備

#### Flinkクラスターのデプロイメント

Standaloneクラスターを例にします：

1. Flinkインストールパッケージをダウンロード、例：[Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz)；
2. 展開後、Flink Doris Connectorパッケージを`<FLINK_HOME>/lib`に配置；
3. `<FLINK_HOME>`ディレクトリに移動し、`bin/start-cluster.sh`を実行してFlinkクラスターを起動；
4. `jps`コマンドを使用してFlinkクラスターが正常に起動したかを確認できます。

#### Dorisテーブルの初期化

以下の文を実行してDorisテーブルを作成します：

```sql
CREATE DATABASE test;

CREATE TABLE test.student (
  `id` INT,
  `name` VARCHAR(256),
  `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

INSERT INTO test.student values(1,"James",18);
INSERT INTO test.student values(2,"Emily",28);

CREATE TABLE test.student_trans (
  `id` INT,
  `name` VARCHAR(256),
  `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);
```
#### FlinkSQLタスクの実行

**FlinkSQLクライアントの開始**

```bash
bin/sql-client.sh
```
**FlinkSQLの実行**

```sql
CREATE TABLE Student (
    id STRING,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.student',
      'username' = 'root',
      'password' = ''
);

CREATE TABLE StudentTrans (
    id STRING,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.student_trans',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO StudentTrans SELECT id, concat('prefix_',name), age+1 FROM Student;
```
#### クエリデータ

```sql
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```
## シナリオと操作

### Dorisからのデータ読み取り

FlinkがDorisからデータを読み取る際、Doris Sourceは現在有界ストリームであり、CDC方式での継続的な読み取りはサポートしていません。DorisからのデータはThriftまたはArrowFlightSQL（バージョン24.0.0以降でサポート）を使用して読み取ることができます。バージョン2.1以降、ArrowFlightSQLが推奨される方法です。

- **Thrift**: BEのThriftインターフェースを呼び出してデータを読み取ります。詳細な手順については、[Thriftインターフェースによるデータ読み取り](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md)を参照してください。
- **ArrowFlightSQL**: Doris 2.1をベースとし、この方法ではArrow Flight SQLプロトコルを使用して大容量データの高速読み取りが可能です。詳細については、[Arrow Flight SQLによる高速データ転送](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/)を参照してください。

#### FlinkSQLを使用したデータ読み取り

##### Thrift方式

```SQL
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',  -- Fe的host:HttpPort
      'table.identifier' = 'test.student',
      'username' = 'root',
      'password' = ''
);

SELECT * FROM student;
```
##### ArrowFlightSQL

```SQL
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '{fe.conf:http_port}', 
      'table.identifier' = 'test.student',
      'source.use-flight-sql' = 'true',
      'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
      'username' = 'root',
      'password' = ''
);

SELECT * FROM student;
```
#### DataStream APIを使用したデータの読み取り

DataStream APIを使用してデータを読み取る場合は、「Usage」セクションで説明されているように、事前にプログラムのPOMファイルに依存関係を含める必要があります。

```Java
final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
DorisOptions option = DorisOptions.builder()
        .setFenodes("127.0.0.1:8030")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("")
        .build();

DorisReadOptions readOptions = DorisReadOptions.builder().build();
DorisSource<List<?>> dorisSource = DorisSource.<List<?>>builder()
        .setDorisOptions(option)
        .setDorisReadOptions(readOptions)
        .setDeserializer(new SimpleListDeserializationSchema())
        .build();

env.fromSource(dorisSource, WatermarkStrategy.noWatermarks(), "doris source").print();
env.execute("Doris Source Test");
```
完全なコードについては、[DorisSourceDataStream.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSourceDataStream.java)を参照してください。

### DorisへのデータWriting

FlinkはStream Load方式を使用してDorisにデータを書き込み、ストリーミングとバッチ挿入の両方のモードをサポートしています。

:::info ストリーミングとバッチ挿入の違い

Connector 1.5.0以降、バッチ挿入がサポートされています。バッチ挿入はCheckpointに依存せず、データをメモリにバッファリングし、バッチパラメータに基づいて書き込みタイミングを制御します。ストリーミング挿入はCheckpointの有効化が必要で、Checkpoint期間全体を通して上流データをDorisに継続的に書き込み、データをメモリに継続的に保持しません。

:::

#### FlinkSQLを使用したデータWriting

テスト用に、FlinkのDatagenを使用して継続的に生成される上流データをシミュレートします。

```SQL
-- enable checkpoint
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT
) WITH (
  'connector' = 'datagen',
  'rows-per-second' = '1',
  'fields.name.length' = '20',
  'fields.id.min' = '1',
  'fields.id.max' = '100000',
  'fields.age.min' = '3',
  'fields.age.max' = '30'
);

-- doris sink
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.student',
      'username' = 'root',
      'password' = 'password',
      'sink.label-prefix' = 'doris_label'
      --'sink.enable.batch-mode' = 'true'  Adding this configuration enables batch writing
);

INSERT INTO student_sink SELECT * FROM student_source;
```
#### DataStream APIを使用したデータの書き込み

DataStream APIを使用してデータを書き込む際は、異なるシリアライゼーション方法を使用して、アップストリームのデータをDorisテーブルに書き込む前にシリアライズできます。

:::info

Connectorには既にHttpClient4.5.13バージョンが含まれています。プロジェクトでHttpClientを別途参照する場合は、バージョンの一貫性を確保する必要があります。

:::

##### 標準String形式

アップストリームデータがCSVまたはJSON形式の場合、`SimpleStringSerializer`を直接使用してデータをシリアライズできます。

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(30000);
DorisSink.Builder<String> builder = DorisSink.builder();

DorisOptions dorisOptions = DorisOptions.builder()
        .setFenodes("10.16.10.6:28737")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("")
        .build();

Properties properties = new Properties();
// When the upstream data is in json format, the following configuration needs to be enabled
properties.setProperty("read_json_by_line", "true");
properties.setProperty("format", "json");
    
// When writing csv data from the upstream, the following configurations need to be enabled
//properties.setProperty("format", "csv");
//properties.setProperty("column_separator", ",");
    
DorisExecutionOptions executionOptions = DorisExecutionOptions.builder()
       .setLabelPrefix("label-doris")
       .setDeletable(false)
       //.setBatchMode(true)  Enable batch writing
       .setStreamLoadProp(properties)
       .build();

builder.setDorisReadOptions(DorisReadOptions.builder().build())
       .setDorisExecutionOptions(executionOptions)
       .setSerializer(new SimpleStringSerializer())
       .setDorisOptions(dorisOptions);

List<String> data = new ArrayList<>();
data.add("{\"id\":3,\"name\":\"Michael\",\"age\":28}");
data.add("{\"id\":4,\"name\":\"David\",\"age\":38}");

env.fromCollection(data).sinkTo(builder.build());
env.execute("doris test");
```
完全なコードについては、[DorisSinkExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkExample.java)を参照してください。

##### RowData Format

RowDataはFlinkの内部フォーマットです。上流のデータがRowDataフォーマットの場合、`RowDataSerializer`を使用してデータをシリアライズする必要があります。

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(10000);
env.setParallelism(1);

DorisSink.Builder<RowData> builder = DorisSink.builder();

Properties properties = new Properties();
properties.setProperty("column_separator", ",");
properties.setProperty("line_delimiter", "\n");
properties.setProperty("format", "csv");
// When writing json data from the upstream, the following configuration needs to be enabled
// properties.setProperty("read_json_by_line", "true");
// properties.setProperty("format", "json");
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder
        .setFenodes("10.16.10.6:28737")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("");
DorisExecutionOptions.Builder executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix(UUID.randomUUID().toString()).setDeletable(false).setStreamLoadProp(properties);

// flink rowdata‘s schema
String[] fields = {"id","name", "age"};
DataType[] types = {DataTypes.INT(), DataTypes.VARCHAR(256), DataTypes.INT()};

builder.setDorisExecutionOptions(executionBuilder.build())
        .setSerializer(
                RowDataSerializer.builder() // serialize according to rowdata
                        .setType(LoadConstants.CSV)
                        .setFieldDelimiter(",")
                        .setFieldNames(fields)
                        .setFieldType(types)
                        .build())
        .setDorisOptions(dorisBuilder.build());

// mock rowdata source
DataStream<RowData> source =
        env.fromElements("")
                .flatMap(
                        new FlatMapFunction<String, RowData>() {
                            @Override
                            public void flatMap(String s, Collector<RowData> out)
                                    throws Exception {
                                GenericRowData genericRowData = new GenericRowData(3);
                                genericRowData.setField(0, 1);
                                genericRowData.setField(1, StringData.fromString("Michael"));
                                genericRowData.setField(2, 18);
                                out.collect(genericRowData);

                                GenericRowData genericRowData2 = new GenericRowData(3);
                                genericRowData2.setField(0, 2);
                                genericRowData2.setField(1, StringData.fromString("David"));
                                genericRowData2.setField(2, 38);
                                out.collect(genericRowData2);
                            }
                        });

source.sinkTo(builder.build());
env.execute("doris test");
```
完全なコードについては、[DorisSinkExampleRowData.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkExampleRowData.java) を参照してください。

##### Debezium Format

FlinkCDCからのデータやKafkaのDebezium formatなど、Debezium形式の上流データについては、`JsonDebeziumSchemaSerializer`を使用してデータをシリアライズできます。

```Java
// enable checkpoint
env.enableCheckpointing(10000);

Properties props = new Properties();
props.setProperty("format", "json");
props.setProperty("read_json_by_line", "true");
DorisOptions dorisOptions = DorisOptions.builder()
        .setFenodes("127.0.0.1:8030")
        .setTableIdentifier("test.student")
        .setUsername("root")
        .setPassword("").build();

DorisExecutionOptions.Builder  executionBuilder = DorisExecutionOptions.builder();
executionBuilder.setLabelPrefix("label-prefix")
        .setStreamLoadProp(props)
        .setDeletable(true);

DorisSink.Builder<String> builder = DorisSink.builder();
builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setDorisOptions(dorisOptions)
        .setSerializer(JsonDebeziumSchemaSerializer.builder().setDorisOptions(dorisOptions).build());

env.fromSource(mySqlSource, WatermarkStrategy.noWatermarks(), "MySQL Source")
        .sinkTo(builder.build());
```
完全なコードについては、[CDCSchemaChangeExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)を参照してください。

##### マルチテーブル書き込みフォーマット

現在、DorisSinkは単一のSinkで複数のテーブルの同期をサポートしています。データとデータベース/テーブル情報の両方をSinkに渡し、`RecordWithMetaSerializer`を使用してシリアライズする必要があります。

```Java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.setParallelism(1);
DorisSink.Builder<RecordWithMeta> builder = DorisSink.builder();
Properties properties = new Properties();
properties.setProperty("column_separator", ",");
properties.setProperty("line_delimiter", "\n");
properties.setProperty("format", "csv");
DorisOptions.Builder dorisBuilder = DorisOptions.builder();
dorisBuilder
        .setFenodes("10.16.10.6:28737")
        .setTableIdentifier("")
        .setUsername("root")
        .setPassword("");

DorisExecutionOptions.Builder executionBuilder = DorisExecutionOptions.builder();

executionBuilder
        .setLabelPrefix("label-doris")
        .setStreamLoadProp(properties)
        .setDeletable(false)
        .setBatchMode(true);

builder.setDorisReadOptions(DorisReadOptions.builder().build())
        .setDorisExecutionOptions(executionBuilder.build())
        .setDorisOptions(dorisBuilder.build())
        .setSerializer(new RecordWithMetaSerializer());

RecordWithMeta record = new RecordWithMeta("test", "student_1", "1,David,18");
RecordWithMeta record1 = new RecordWithMeta("test", "student_2", "1,Jack,28");
env.fromCollection(Arrays.asList(record, record1)).sinkTo(builder.build());
```
完全なコードについては、[DorisSinkMultiTableExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/DorisSinkMultiTableExample.java)を参照してください。

### Lookup Join

Lookup Joinを使用することで、FlinkにおけるディメンションテーブルのJOINを最適化できます。ディメンションテーブルのJOINにFlink JDBC Connectorを使用する場合、以下の問題が発生する可能性があります：

- Flink JDBC Connectorは同期クエリモードを使用するため、上流データ（Kafkaなど）がレコードを送信した後、即座にDorisディメンションテーブルに対してクエリを実行します。これにより、高並行性のシナリオではクエリレイテンシが高くなります。

- JDBCを介して実行されるクエリは通常、レコードごとのポイントルックアップですが、Dorisでは効率性を向上させるためにバッチクエリが推奨されます。

Flink Doris ConnectorでディメンションテーブルのJOINに[Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join)を使用することで、以下の利点が得られます：

- **上流データのバッチキャッシュ**により、レコードごとのクエリによって引き起こされる高レイテンシとデータベース負荷を回避します。

- **JOINクエリの非同期実行**により、データスループットを向上させ、Dorisに対するクエリ負荷を削減します。

```SQL
CREATE TABLE fact_table (
  `id` BIGINT,
  `name` STRING,
  `city` STRING,
  `process_time` as proctime()
) WITH (
  'connector' = 'kafka',
  ...
);

create table dim_city(
  `city` STRING,
  `level` INT ,
  `province` STRING,
  `country` STRING
) WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
  'table.identifier' = 'dim.dim_city',
  'username' = 'root',
  'password' = ''
);

SELECT a.id, a.name, a.city, c.province, c.country,c.level 
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```
### 完全なデータベース同期

Flink Doris Connectorは**Flink CDC** ([Flink CDC Documentation](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/))を統合しており、MySQLのようなリレーショナルデータベースをDorisに同期することを簡単にします。この統合には、自動テーブル作成、スキーマ変更なども含まれています。同期をサポートするデータベースには次のものがあります：MySQL、Oracle、PostgreSQL、SQLServer、MongoDB、DB2。

:::info Note

1. 完全なデータベース同期を使用する場合は、`$FLINK_HOME/lib`ディレクトリに対応するFlink CDC依存関係（Fat Jar）を追加する必要があります。例えば**flink-sql-connector-mysql-cdc-${version}.jar**、**flink-sql-connector-oracle-cdc-${version}.jar**です。FlinkCDCバージョン3.1以降は以前のバージョンと互換性がありません。依存関係は以下のリンクからダウンロードできます：[FlinkCDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)、[FlinkCDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/)。
2. Connector 24.0.0以降のバージョンでは、必要なFlink CDCバージョンは3.1以上である必要があります。[ここ](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/)からダウンロードできます。Flink CDCを使用してMySQLとOracleを同期する場合は、`$FLINK_HOME/lib`の下に関連するJDBCドライバーも追加する必要があります。

#### MySQL全データベース同期

Flinkクラスターを開始した後、以下のコマンドを直接実行できます：

```Shell
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
#### Oracle データベース全体同期

```Shell
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
#### PostgreSQL データベース全体同期

```Shell
<FLINK_HOME>/bin/flink run \
     -Dexecution.checkpointing.interval=10s \
     -Dparallelism.default=1\
     -c org.apache.doris.flink.tools.cdc.CdcTools \
     ./lib/flink-doris-connector-1.16-24.0.1.jar \
     postgres-sync-database \
     --database db1\
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
#### SQLServer データベース全体同期

```Shell
<FLINK_HOME>/bin/flink run \
     -Dexecution.checkpointing.interval=10s \
     -Dparallelism.default=1 \
     -c org.apache.doris.flink.tools.cdc.CdcTools \
     ./lib/flink-doris-connector-1.16-24.0.1.jar \
     sqlserver-sync-database \
     --database db1\
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
#### DB2 データベース全体同期

```Shell
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
#### MongoDB データベース全体の同期

```Shell
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
#### AWS Aurora MySQL 全データベース同期

```Shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.18-25.0.0.jar \
    mysql-sync-database \
    --database testwd \
    --mysql-conf hostname=xxx.us-east-1.rds.amazonaws.com \
    --mysql-conf port=3306 \
    --mysql-conf username=admin \
    --mysql-conf password=123456 \
    --mysql-conf database-name=test \
    --mysql-conf server-time-zone=UTC \
    --including-tables "student" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1 
```
#### AWS RDS MySQL データベース全体同期

```Shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.18-25.0.0.jar \
    mysql-sync-database \
    --database testwd \
    --mysql-conf hostname=xxx.ap-southeast-1.rds.amazonaws.com \
    --mysql-conf port=3306 \
    --mysql-conf username=admin \
    --mysql-conf password=123456 \
    --mysql-conf database-name=test \
    --mysql-conf server-time-zone=UTC \
    --including-tables "student" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1 
```
## 使用手順

### パラメータ設定

#### 全般設定項目

| Key                           | Default Value | Required | Comment                                                      |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| fenodes                       | --            | Y        | Doris FE http アドレス。複数のアドレスがサポートされ、カンマで区切る必要があります。 |
| benodes                       | --            | N        | Doris BE http アドレス。複数のアドレスがサポートされ、カンマで区切る必要があります。 |
| jdbc-url                      | --            | N        | JDBC 接続情報、例：jdbc:mysql://127.0.0.1:9030。 |
| table.identifier              | --            | Y        | Doris テーブル名、例：db.tbl。                            |
| username                      | --            | Y        | Doris にアクセスするためのユーザー名。                                |
| password                      | --            | Y        | Doris にアクセスするためのパスワード。                                |
| auto-redirect                 | TRUE          | N        | StreamLoad リクエストをリダイレクトするかどうか。有効にすると、StreamLoad は FE を通じて書き込みを行い、BE 情報を明示的に取得しなくなります。 |
| doris.request.retries         | 3             | N        | Doris へのリクエスト送信のリトライ回数。         |
| doris.request.connect.timeout | 30s           | N        | Doris へのリクエスト送信の接続タイムアウト。        |
| doris.request.read.timeout    | 30s           | N        | Doris へのリクエスト送信の読み取りタイムアウト。              |

#### Source 設定

| Key                           | Default Value | Required | Comment                                                      |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| doris.request.query.timeout   | 21600s        | N        | Doris クエリのタイムアウト。デフォルト値は6時間です。 |
| doris.request.tablet.size     | 1             | N        | 1つの Partition に対応する Doris Tablets の数。この値を小さく設定するほど、より多くの Partitions が生成され、Flink 側の並列性を向上させることができます。ただし、Doris にもより多くの負荷をかけることになります。 |
| doris.batch.size              | 4064          | N        | BE から一度に読み取る行の最大数。この値を増やすことで、Flink と Doris 間で確立される接続数を減らし、ネットワーク遅延によって生じる追加の時間オーバーヘッドを削減できます。 |
| doris.exec.mem.limit          | 8192mb        | N        | 単一クエリのメモリ制限。デフォルトは8GB、バイト単位。 |
| source.use-flight-sql         | FALSE         | N        | 読み取りに Arrow Flight SQL を使用するかどうか。                 |
| source.flight-sql-port        | -             | N        | Arrow Flight SQL を使用して読み取りを行う際の FE の arrow_flight_sql_port。 |

**DataStream 固有の設定**

| Key                | Default Value | Required | Comment                                                      |
| ------------------ | ------------- | -------- | ------------------------------------------------------------ |
| doris.read.field   | --            | N        | Doris テーブルを読み取るためのカラム名のリスト。複数のカラムはカンマで区切る必要があります。 |
| doris.filter.query | --            | N        | 読み取りデータをフィルタリングするための式。この式は Doris に渡されます。Doris はこの式を使用してソースデータフィルタリングを完了します。例：age=18。 |

#### Sink 設定

| Key                         | Default Value | Required | Comment                                                      |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| sink.label-prefix           | --            | Y        | Stream load インポートに使用されるラベルプレフィックス。2pc シナリオでは、Flink の EOS セマンティクスを保証するためにグローバルに一意である必要があります。 |
| sink.properties.*           | --            | N        | Stream Load のインポートパラメータ。例：'sink.properties.column_separator' = ', ' はカラム区切り文字を定義し、'sink.properties.escape_delimiters' = 'true' は \x01 のような区切り文字としての特殊文字がバイナリ 0x01 に変換されることを意味します。JSON 形式のインポートの場合、'sink.properties.format' = 'json', 'sink.properties.read_json_by_line' = 'true'。詳細なパラメータについては、[こちら](../data-operate/import/import-way/stream-load-manual.md#load-configuration-parameters)を参照してください。Group Commit モードの場合、例：'sink.properties.group_commit' = 'sync_mode' は group commit を同期モードに設定します。Flink connector はバージョン 1.6.2 以降、インポート設定 group commit をサポートしています。詳細な使用方法と制限については、[group commit](../data-operate/import/group-commit-manual.md)を参照してください。 |
| sink.enable-delete          | TRUE          | N        | 削除を有効にするかどうか。このオプションは、Doris テーブルでバッチ削除機能が有効になっている必要があり（Doris 0.15+ バージョンではデフォルトで有効）、Unique モデルのみをサポートします。 |
| sink.enable-2pc             | TRUE          | N        | 2フェーズコミット（2pc）を有効にするかどうか。デフォルトは true で、Exactly-Once セマンティクスを保証します。2フェーズコミットの詳細については、[こちら](../data-operate/transaction.md#streamload-2pc)を参照してください。 |
| sink.buffer-size            | 1MB           | N        | 書き込みデータキャッシュバッファのサイズ、バイト単位。変更は推奨されず、デフォルト設定を使用できます。 |
| sink.buffer-count           | 3             | N        | 書き込みデータキャッシュバッファの数。変更は推奨されず、デフォルト設定を使用できます。 |
| sink.max-retries            | 3             | N        | Commit 失敗後の最大リトライ回数。デフォルトは3回です。 |
| sink.enable.batch-mode      | FALSE         | N        | Doris への書き込みにバッチモードを使用するかどうか。有効にすると、書き込みタイミングは Checkpoint に依存せず、sink.buffer-flush.max-rows、sink.buffer-flush.max-bytes、sink.buffer-flush.interval などのパラメータによって制御されます。一方、有効にすると Exactly-once セマンティクスは保証されませんが、Uniq モデルの助けを借りて冪等性を実現できます。 |
| sink.flush.queue-size       | 2             | N        | バッチモードでのキャッシュキューのサイズ。                   |
| sink.buffer-flush.max-rows  | 500000        | N        | バッチモードで単一バッチで書き込まれる行の最大数。 |
| sink.buffer-flush.max-bytes | 100MB         | N        | バッチモードで単一バッチで書き込まれるバイトの最大数。 |
| sink.buffer-flush.interval  | 10s           | N        | バッチモードでキャッシュを非同期的にフラッシュする間隔。 |
| sink.ignore.update-before   | TRUE          | N        | update-before イベントを無視するかどうか。デフォルトは無視します。 |

#### Lookup Join 設定

| Key                               | Default Value | Required | Comment                                                      |
| --------------------------------- | ------------- | -------- | ------------------------------------------------------------ |
| lookup.cache.max-rows             | -1            | N        | lookup キャッシュの最大行数。デフォルト値は -1 で、キャッシュが有効になっていないことを意味します。 |
| lookup.cache.ttl                  | 10s           | N        | lookup キャッシュの最大時間。デフォルトは10秒です。 |
| lookup.max-retries                | 1             | N        | lookup クエリ失敗後のリトライ回数。            |
| lookup.jdbc.async                 | FALSE         | N        | 非同期 lookup を有効にするかどうか。デフォルトは false です。 |
| lookup.jdbc.read.batch.size       | 128           | N        | 非同期 lookup での各クエリの最大バッチサイズ。 |
| lookup.jdbc.read.batch.queue-size | 256           | N        | 非同期 lookup 中の中間バッファキューのサイズ。 |
| lookup.jdbc.read.thread-size      | 3             | N        | 各タスクでの lookup 用 jdbc スレッドの数。          |

#### 全データベース同期設定

**構文**

```Shell
<FLINK_HOME>bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-1.6.1.jar \
    <mysql-sync-database|oracle-sync-database|postgres-sync-database|sqlserver-sync-database|mongodb-sync-database> \
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
    --sink-conf <doris-sink-conf> [--table-conf <doris-sink-conf> ...] \
    [--table-conf <doris-table-conf> [--table-conf <doris-table-conf> ...]]
```
**設定**

| Key                     | Comment                                                      |
| ----------------------- | ------------------------------------------------------------ |
| --job-name              | Flinkタスクの名前（オプション）。               |
| --database              | Dorisに同期するデータベースの名前。              |
| --table-prefix          | Dorisテーブルのプレフィックス名、例：--table-prefix ods_。 |
| --table-suffix          | Dorisテーブルのサフィックス名、プレフィックスと同様。   |
| --including-tables      | 同期する必要があるMySQLテーブル。複数のテーブルは\|で区切ることができ、正規表現をサポートしています。例：--including-tables table1。 |
| --excluding-tables      | 同期する必要がないテーブル。使用方法は--including-tablesと同様です。 |
| --mysql-conf            | MySQL CDCSourceの設定、例：--mysql-conf hostname=127.0.0.1。MySQL-CDCのすべての設定は[こちら](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/)で確認できます。その中で、hostname、username、password、database-nameは必須です。同期するデータベースとテーブルに主キーのないテーブルが含まれている場合、scan.incremental.snapshot.chunk.key-columnを設定する必要があり、非null型のフィールドを1つだけ選択できます。例：scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...、異なるデータベースとテーブルのカラムはカンマで区切ります。 |
| --oracle-conf           | Oracle CDCSourceの設定、例：--oracle-conf hostname=127.0.0.1。Oracle-CDCのすべての設定は[こちら](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/)で確認できます。その中で、hostname、username、password、database-name、schema-nameは必須です。 |
| --postgres-conf         | Postgres CDCSourceの設定、例：--postgres-conf hostname=127.0.0.1。Postgres-CDCのすべての設定は[こちら](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/)で確認できます。その中で、hostname、username、password、database-name、schema-name、slot.nameは必須です。 |
| --sqlserver-conf        | SQLServer CDCSourceの設定、例：--sqlserver-conf hostname=127.0.0.1。SQLServer-CDCのすべての設定は[こちら](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/)で確認できます。その中で、hostname、username、password、database-name、schema-nameは必須です。 |
| --db2-conf              | SQLServer CDCSourceの設定、例：--db2-conf hostname=127.0.0.1。DB2-CDCのすべての設定は[こちら](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/)で確認できます。その中で、hostname、username、password、database-name、schema-nameは必須です。 |
| --sink-conf             | Doris Sinkのすべての設定は[こちら](./flink-doris-connector.md#general-configuration-items)で確認できます。 |
| --mongodb-conf          | MongoDB CDCSourceの設定、例：--mongodb-conf hosts=127.0.0.1:27017。Mongo-CDCのすべての設定は[こちら](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.0/docs/connectors/flink-sources/mongodb-cdc/)で確認できます。その中で、hosts、username、password、databaseは必須です。--mongodb-conf schema.sample-percentは、MongoDBデータを自動的にサンプリングしてDorisでテーブルを作成するための設定で、デフォルト値は0.2です。 |
| --table-conf            | Dorisテーブルの設定項目、つまりproperties内に含まれる内容（table-bucketsを除く、これはpropertiesの属性ではありません）。例：--table-conf replication_num=1、--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"は正規表現の順序で異なるテーブルのバケット数を指定することを意味します。一致しない場合、BUCKETS AUTOメソッドを使用してテーブルを作成します。 |
| --schema-change-mode    | スキーマ変更を解析するモード、debezium_structureとsql_parserを含みます。デフォルトでdebezium_structureモードが使用されます。debezium_structureモードは、上流CDCがデータを同期する際に使用されるデータ構造を解析し、この構造を解析してDDL変更操作を判断します。sql_parserモードは、上流CDCがデータを同期する際のDDL文を解析してDDL変更操作を判断するため、この解析モードはより正確です。使用例：--schema-change-mode debezium_structure。この機能は24.0.0以降のバージョンで利用可能になります。 |
| --single-sink           | すべてのテーブルを同期するために単一のSinkを使用するかどうか。有効にすると、上流で新しく作成されたテーブルを自動的に識別し、テーブルを自動作成することもできます。 |
| --multi-to-one-origin   | 複数の上流テーブルが同じテーブルに書き込まれる場合のソーステーブルの設定、例：--multi-to-one-origin "a\_.\*\|b_.\*"、[#208](https://github.com/apache/doris-flink-connector/pull/208)を参照 |
| --multi-to-one-target   | multi-to-one-originと組み合わせて使用する、ターゲットテーブルの設定、例：--multi-to-one-target "a\|b" |
| --create-table-only     | テーブルの構造のみを同期するかどうか。      |

### DorisからFlinkへのデータ型マッピング

| Doris Type | Flink Type |
| ---------- | ---------- |
| NULL_TYPE  | NULL       |
| BOOLEAN    | BOOLEAN    |
| TINYINT    | TINYINT    |
| SMALLINT   | SMALLINT   |
| INT        | INT        |
| BIGINT     | BIGINT     |
| FLOAT      | FLOAT      |
| DOUBLE     | DOUBLE     |
| DATE       | DATE       |
| DATETIME   | TIMESTAMP  |
| DECIMAL    | DECIMAL    |
| CHAR       | STRING     |
| LARGEINT   | STRING     |
| VARCHAR    | STRING     |
| STRING     | STRING     |
| DECIMALV2  | DECIMAL    |
| ARRAY      | ARRAY      |
| MAP        | STRING     |
| JSON       | STRING     |
| VARIANT    | STRING     |
| IPV4       | STRING     |
| IPV6       | STRING     |

### FlinkからDorisへのデータ型マッピング
| Flink Type    | Doris Type     |
| ------------- | -------------- |
| BOOLEAN       | BOOLEAN        |
| TINYINT       | TINYINT        |
| SMALLINT      | SMALLINT       |
| INTEGER       | INTEGER        |
| BIGINT        | BIGINT         |
| FLOAT         | FLOAT          |
| DOUBLE        | DOUBLE         |
| DECIMAL       | DECIMAL        |
| CHAR          | CHAR           |
| VARCHAR       | VARCHAR/STRING |
| STRING        | STRING         |
| DATE          | DATE           |
| TIMESTAMP     | DATETIME       |
| TIMESTAMP_LTZ | DATETIME       |
| ARRAY         | ARRAY          |
| MAP           | MAP/JSON       |
| ROW           | STRUCT/JSON    |

### 監視メトリクス

Flinkは、Flinkクラスターの指標を監視するための複数の[Metrics](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics)を提供しています。以下は、Flink Doris Connectorに新しく追加された監視メトリクスです。

| Name                      | Metric Type | Description                                                  |
| ------------------------- | ----------- | ------------------------------------------------------------ |
| totalFlushLoadBytes       | Counter     | フラッシュしてインポートされた総バイト数。 |
| flushTotalNumberRows      | Counter     | インポートして処理された総行数。 |
| totalFlushLoadedRows      | Counter     | 正常にインポートされた総行数。 |
| totalFlushTimeMs          | Counter     | 正常なインポートが完了するまでに要した総時間。     |
| totalFlushSucceededNumber | Counter     | 正常にインポートが完了した回数。 |
| totalFlushFailedNumber    | Counter     | インポートが失敗した回数。                |
| totalFlushFilteredRows    | Counter     | データ品質が不適格な総行数。      |
| totalFlushUnselectedRows  | Counter     | where条件によってフィルタされた総行数。    |
| beginTxnTimeMs            | Histogram   | Feにトランザクション開始を要求するのに要した時間（ミリ秒）。 |
| putDataTimeMs             | Histogram   | Feにインポートデータ実行プランの取得を要求するのに要した時間。 |
| readDataTimeMs            | Histogram   | データ読み取りに要した時間。                                 |
| writeDataTimeMs           | Histogram   | データ書き込み操作の実行に要した時間。          |
| commitAndPublishTimeMs    | Histogram   | Feにトランザクションのコミットと公開を要求するのに要した時間。 |
| loadTimeMs                | Histogram   | インポートの完了に要した時間。                   |

 

## ベストプラクティス

### FlinkSQLでCDC経由でMySQLデータに素早く接続

```SQL
-- enable checkpoint
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

insert into doris_sink select id,name from cdc_mysql_source;
```
### Flinkは部分カラム更新を実行する

```SQL
CREATE TABLE doris_sink (
    id INT,
    name STRING,
    bank STRING,
    age int
) 
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'database.table',
  'username' = 'root',
  'password' = '',
  'sink.properties.format' = 'json',
  'sink.properties.read_json_by_line' = 'true',
  'sink.properties.columns' = 'id,name,bank,age', -- Columns that need to be updated
  'sink.properties.partial_columns' = 'true' -- Enable partial column updates
);
```
### Flink が Bitmap データをインポート

```SQL
CREATE TABLE bitmap_sink (
dt int,
page string,
user_id int 
)
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'test.bitmap_test',
  'username' = 'root',
  'password' = '',
  'sink.label-prefix' = 'doris_label',
  'sink.properties.columns' = 'dt,page,user_id,user_id=to_bitmap(user_id)'
)
```
### FlinkCDCでキー列を更新

一般的に、業務データベースでは、数値がテーブルの主キーとしてよく使用されます。例えば、Studentテーブルでは、番号（id）が主キーとして使用されます。しかし、業務が発展するにつれて、データに対応する番号が変更される場合があります。このシナリオでは、Flink CDC + Doris Connectorを使用してデータを同期する際、Dorisの主キー列のデータを自動的に更新できます。

**原理**

Flink CDCの基盤となる収集ツールはDebeziumです。Debeziumは内部的にopフィールドを使用して対応する操作を識別します。opフィールドの値はc、u、d、rで、それぞれcreate、update、delete、readに対応します。主キー列の更新について、Flink CDCはDELETEとINSERTイベントを下流に送信し、データがDorisに同期された後、Dorisの主キー列のデータが自動的に更新されます。

**使用方法**

FlinkプログラムはCDC同期の例を参照できます。タスクの送信が成功した後、MySQL側で主キー列を更新するステートメントを実行し（例：update student set id = '1002' where id = '1001'）、その後Doris内のデータを変更できます。

### Flinkで指定した列に従ってデータを削除

一般的に、Kafkaのメッセージは特定のフィールドを使用して操作タイプをマークします。例えば、{"op_type":"delete",data:{...}}のようなものです。このようなデータについては、op_type=deleteのデータを削除することが望まれます。



DorisSinkはデフォルトでRowKindに従ってイベントのタイプを区別します。通常、CDCの場合、イベントタイプを直接取得でき、隠し列`__DORIS_DELETE_SIGN__`に値を割り当てて削除の目的を達成できます。しかし、Kafkaの場合、業務ロジックに従って判定し、明示的に隠し列の値を渡す必要があります。

```SQL
-- For example, the upstream data:{"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
CREATE TABLE KAFKA_SOURCE(
  data STRING,
  op_type STRING
) WITH (
  'connector' = 'kafka',
  ...
);

CREATE TABLE DORIS_SINK(
  id INT,
  name STRING,
  __DORIS_DELETE_SIGN__ INT
) WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'db.table',
  'username' = 'root',
  'password' = '',
  'sink.enable-delete' = 'false',        -- false means not to obtain the event type from RowKind
  'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- Explicitly specify the import columns of streamload
);

INSERT INTO DORIS_SINK
SELECT json_value(data,'$.id') as id,
json_value(data,'$.name') as name, 
if(op_type='delete',1,0) as __DORIS_DELETE_SIGN__ 
from KAFKA_SOURCE;
```
### Flink CDC DDL文の同期
一般的に、MySQLなどのアップストリームデータソースを同期する際、アップストリームでフィールドを追加または削除する場合、DorisでSchema Change操作を同期する必要があります。

このシナリオでは、通常DataStream APIのプログラムを作成し、DorisSinkによって提供されるJsonDebeziumSchemaSerializerシリアライザーを使用して、自動的にSchemaChangeを実行する必要があります。詳細については、[CDCSchemaChangeExample.java](https://github.com/apache/doris-flink-connector/blob/master/flink-doris-connector/src/test/java/org/apache/doris/flink/example/CDCSchemaChangeExample.java)を参照してください。

Connectorが提供する全データベース同期ツールでは、追加の設定は必要なく、アップストリームのDDLが自動的に同期され、DorisでSchemaChange操作が実行されます。

## よくある質問（FAQ）

1. **errCode = 2, detailMessage = Label [label_0_1] has already been used, relate to txn [19650]**

   Exactly-Onceシナリオでは、Flink Jobは最新のCheckpoint/Savepointから再起動する必要があります。そうでなければ上記のエラーが報告されます。Exactly-Onceが不要な場合、この問題は2PC提出を無効にする（sink.enable-2pc=false）か、異なるsink.label-prefixに変更することでも解決できます。

2. **errCode = 2, detailMessage = transaction [19650] not found**

   これはCommit段階で発生します。checkpointに記録されたトランザクションIDがFE側で期限切れになっています。この時点で再度コミットすると、上記のエラーが発生します。この時点では、checkpointから開始することは不可能です。その後、`fe.conf`の`streaming_label_keep_max_second`設定を変更して有効期限を延長できます。デフォルトの有効期限は12時間です。dorisバージョン2.0以降では、`fe.conf`の`label_num_threshold`設定（デフォルト2000）によっても制限されるため、これを増加させるか-1に変更できます（-1は時間のみによって制限されることを意味します）。

3. **errCode = 2, detailMessage = current running txns on db 10006 is 100, larger than limit 100**

   これは同一データベースへの同時インポートが100を超えているためです。`fe.conf`の`max_running_txn_num_per_db`パラメータを調整することで解決できます。具体的な詳細については、[max_running_txn_num_per_db](../admin-manual/config/fe-config#max_running_txn_num_per_db)を参照してください。

   同時に、labelの頻繁な変更とタスクの再起動もこのエラーを引き起こす可能性があります。2pcシナリオ（Duplicate/Aggregateモデル用）では、各タスクのlabelは一意である必要があります。そしてcheckpointから再起動する際、Flinkタスクはプリコミットに成功したがまだコミットされていないトランザクションを積極的に中止します。頻繁なlabel変更と再起動により、中止できない大量のプリコミット成功トランザクションが発生し、トランザクションを占有します。Uniqueモデルでは、2pcを無効にしてべき等な書き込みを実現することもできます。

4. **tablet writer write failed, tablet_id=190958, txn_id=3505530, err=-235**

   これは通常Connectorバージョン1.1.0以前で発生し、書き込み頻度が高すぎることによってバージョン数が過多になることが原因です。`sink.batch.size`と`sink.batch.interval`パラメータを設定してStreamloadの頻度を減らすことができます。Connectorバージョン1.1.0以降では、デフォルトの書き込みタイミングはCheckpointによって制御され、Checkpoint間隔を増加させることで書き込み頻度を減らすことができます。

5. **Flinkでインポート時にダーティデータをスキップするには？**

   Flinkがデータをインポートする際、フィールド形式や長さの問題などのダーティデータがある場合、StreamLoadでエラーが発生します。この時、Flinkは継続的にリトライします。そのようなデータをスキップする必要がある場合、StreamLoadの厳密モードを無効にする（`strict_mode=false`と`max_filter_ratio=1`を設定）か、Sinkオペレータの前でデータをフィルタリングできます。

6. **FlinkマシンとBEマシン間のネットワークが接続されていない場合の設定方法は？**

   FlinkがDorisへの書き込みを開始すると、DorisはBEに書き込み操作をリダイレクトします。この時、返されるアドレスはBEの内部ネットワークIPで、これは`show backends`コマンドで見られるIPです。この時FlinkとDorisの間にネットワーク接続がない場合、エラーが報告されます。この場合、`benodes`でBEの外部ネットワークIPを設定できます。

7. **stream load error: HTTP/1.1 307 Temporary Redirect**

   Flinkは最初にFEにリクエストし、307を受信した後、リダイレクト後にBEにリクエストします。FEがFullGC/高負荷/ネットワーク遅延の状態にある場合、HttpClientはデフォルトで一定期間（3秒）内にレスポンスを待たずにデータを送信します。リクエストボディがデフォルトでInputStreamであるため、307レスポンスを受信した時、データを再生できずに直接エラーが報告されます。この問題を解決する方法は3つあります：1. Connector25.1.0以上にアップグレードしてデフォルト時間を増加させる；2. auto-redirect=falseに変更してBEに直接リクエストを開始する（一部のクラウドシナリオでは適用されない）；3. unique keyモデルはbatchモードを有効にできる。
