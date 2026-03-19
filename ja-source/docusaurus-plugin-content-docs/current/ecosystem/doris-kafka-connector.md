---
{
  "title": "Doris Kafka Connector",
  "language": "ja",
  "description": "Kafka Connectは、Apache Kafkaと他のシステム間でのデータ伝送のためのスケーラブルで信頼性の高いツールです。"
}
---
[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html)は、Apache Kafkaと他のシステム間でのデータ伝送のための、スケーラブルで信頼性の高いツールです。コネクタを定義してKafkaに大量のデータを出し入れすることができます。

Dorisコミュニティは[doris-kafka-connector](https://github.com/apache/doris-kafka-connector)プラグインを提供しており、Kafkaトピック内のデータをDorisに書き込むことができます。

## バージョン説明

| Connector Version | Kafka Version                 | Doris Version | Java Version | 
| ----------------- | ----------------------------- | ------------- | ------------ |
| 1.0.0             | 2.4+                          | 2.0+          | 8            | 
| 1.1.0             | 2.4+                          | 2.0+          | 8            | 
| 24.0.0            | 2.4+                          | 2.0+          | 8            | 
| 25.0.0            | 2.4+                          | 2.0+          | 8            | 

## 使用方法

### ダウンロード
[doris-kafka-connector](https://doris.apache.org/download)

maven dependencies

```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>doris-kafka-connector</artifactId>
  <version>25.0.0</version>
</dependency>
```
### スタンドアロンモード起動
$KAFKA_HOME配下にpluginsディレクトリを作成し、ダウンロードしたdoris-kafka-connectorのjarパッケージをその中に配置する
<br />
config/connect-standalone.propertiesを設定する

```properties
# Modify broker address
bootstrap.servers=127.0.0.1:9092

# Modify to the created plugins directory
# Note: Please fill in the direct path to Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase the max.poll.interval.ms time of Kafka to more than 30 minutes, the default is 5 minutes
# Avoid Stream Load import data consumption timeout and consumers being kicked out of the consumer group
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```
doris-connector-sink.propertiesを設定する

configディレクトリにdoris-connector-sink.propertiesを作成し、以下の内容を設定します：

```properties
name=test-doris-sink
connector.class=org.apache.doris.kafka.connector.DorisSinkConnector
topics=topic_test
doris.topic2table.map=topic_test:test_kafka_tbl
doris.urls=10.10.10.1
doris.http.port=8030
doris.query.port=9030
doris.user=root
doris.password=
doris.database=test_db
buffer.count.records=10000
buffer.flush.time=120
buffer.size.bytes=5000000
enable.combine.flush=true
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=false
```
スタンドアロンを開始

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```
:::note
注意: 本番環境ではスタンドアローンモードの使用は一般的に推奨されません。
:::

### 分散モード起動
$KAFKA_HOME配下にpluginsディレクトリを作成し、ダウンロードしたdoris-kafka-connectorのjarパッケージをその中に配置します

config/connect-distributed.propertiesを設定します

```properties
# Modify kafka server address
bootstrap.servers=127.0.0.1:9092

# Modify group.id, the same cluster needs to be consistent
group.id=connect-cluster

# Modify to the created plugins directory
# Note: Please fill in the direct path to Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase the max.poll.interval.ms time of Kafka to more than 30 minutes, the default is 5 minutes
# Avoid Stream Load import data consumption timeout and consumers being kicked out of the consumer group
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```
分散処理を開始

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```
コネクターを追加

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "topics":"topic_test",
    "doris.topic2table.map": "topic_test:test_kafka_tbl",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "enable.combine.flush": "true",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false"
  }
}'
```
オペレーションコネクター

```shell
# View connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET
# Delete connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE
# Pause connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT
# Restart connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT
# Restart tasks within the connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```
参照: [Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)

:::note
kafka-connectが初回起動時に、kafka-connectの共有コネクタ設定を記録するために、kafkaクラスタ内に3つのトピック `config.storage.topic` `offset.storage.topic` `status.storage.topic` が作成されることに注意してください。オフセットデータとステータス更新。[How to Use Kafka Connect - Get Started](https://docs.confluent.io/platform/current/connect/userguide.html)
:::

### SSL証明書付きKafkaクラスタへのアクセス
kafka-connectを通じてSSL証明書付きKafkaクラスタにアクセスするには、ユーザーがKafka Brokerの公開鍵を認証するために使用される証明書ファイル（client.truststore.jks）を提供する必要があります。`connect-distributed.properties`ファイルに以下の設定を追加できます：

```properties
# Connect worker
security.protocol=SSL
ssl.truststore.location=/var/ssl/private/client.truststore.jks
ssl.truststore.password=test1234

# Embedded consumer for sink connectors
consumer.security.protocol=SSL
consumer.ssl.truststore.location=/var/ssl/private/client.truststore.jks
consumer.ssl.truststore.password=test1234
```
kafka-connectを通じてSSL認証に接続されたKafkaクラスターの設定手順については、以下を参照してください：[Configure Kafka Connect](https://docs.confluent.io/5.1.2/tutorials/security_tutorial.html#configure-kconnect-long)


### Dead letter queue
デフォルトでは、変換中または変換時に発生したエラーはコネクターを失敗させます。各コネクター設定では、エラーをスキップすることでそのようなエラーを許容することもでき、オプションで各エラーと失敗した操作の詳細、および問題のあるレコード（詳細レベルは様々）をdead-letter queueに書き込んでログ記録できます。

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```
## 設定項目


| Key                         | Enum                                 | Default Value                                                                        | **Required** | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|-----------------------------|--------------------------------------|--------------------------------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name                        | -                                    | -                                                                                    | Y            | Connect アプリケーション名。Kafka Connect 環境内で一意である必要があります                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| connector.class             | -                                    | -                                                                                    | Y            | org.apache.doris.kafka.connector.DorisSinkConnector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| topics                      | -                                    | -                                                                                    | Y            | サブスクライブするトピックのリスト。カンマで区切ります。例：topic1, topic2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| doris.urls                  | -                                    | -                                                                                    | Y            | Doris FE 接続アドレス。複数ある場合はカンマで区切ります。例：10.20.30.1,10.20.30.2,10.20.30.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| doris.http.port             | -                                    | -                                                                                    | Y            | Doris HTTPプロトコルポート                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| doris.query.port            | -                                    | -                                                                                    | Y            | Doris MySQLプロトコルポート                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| doris.user                  | -                                    | -                                                                                    | Y            | Doris ユーザー名                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| doris.password              | -                                    | -                                                                                    | Y            | Doris パスワード                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| doris.database              | -                                    | -                                                                                    | Y            | 書き込み先のデータベース。複数のライブラリがある場合は空にできます。同時に、topic2table.map に具体的なライブラリ名を設定する必要があります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| doris.topic2table.map       | -                                    | -                                                                                    | Y            | topic とテーブルの対応関係。例：topic1:tb1,topic2:tb2<br />空白の場合、topic がデフォルトのテーブル名として書き込みに使用されます。<br />複数ライブラリの形式は topic1:db1.tbl1,topic2:db2.tbl2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| buffer.count.records        | -                                    | 50000                                                                                | N            | flush がトリガーされる前にメモリにバッファリングされるレコード数。デフォルト 50000 レコード                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| buffer.flush.time           | -                                    | 120                                                                                  | N            | バッファのリフレッシュ間隔（秒単位）。デフォルト 120 秒                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| buffer.size.bytes           | -                                    | 104857600(100MB)                                                                      | N            | flush がトリガーされる前にメモリにバッファリングされるレコードの累積サイズ。デフォルト 100MB          |
| enable.combine.flush | `true`,<br/> `false` | false | N | すべてのパーティションからのデータを一緒にマージして書き込むかどうか。デフォルト値は false。有効にした場合、at_least_once セマンティクスのみが保証されます。|
| jmx                         | -                                    | true                                                                                 | N            | JMX を通じてコネクタの内部監視指標を取得するには、以下を参照してください：[Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| label.prefix                | -                                    | ${name}                                                                              | N            | データインポート時の Stream load ラベルプレフィックス。デフォルトは Connector アプリケーション名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| auto.redirect               | -                                    | true                                                                                 | N            | StreamLoad リクエストをリダイレクトするかどうか。有効にすると、StreamLoad は FE を通じてデータを書き込む必要がある BE にリダイレクトし、BE 情報は表示されなくなります。       |
| sink.properties.*           | -                                    | `'sink.properties.format':'json'`, <br/>`'sink.properties.read_json_by_line':'true'` | N            | Stream Load のインポートパラメータ。<br />例：列区切り文字を定義 `'sink.properties.column_separator':','`<br />詳細なパラメータリファレンス[こちら](https://doris.apache.org/docs/data-operate/import/stream-load-manual)<br/><br/>**Group Commit を有効にする**。例：sync_mode モードで group commit を有効にする：`"sink.properties.group_commit":"sync_mode"`。Group Commit は 3 つのモードで設定可能：`off_mode`、`sync_mode`、`async_mode`。具体的な使用方法については[Group-Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/)を参照してください<br/><br/>**部分列更新を有効にする**。例：指定した col2 の部分列更新を有効にする：`"sink.properties.partial_columns":"true"`、`"sink.properties.columns": " col2",` |
| delivery.guarantee          | `at_least_once`,<br/> `exactly_once` | at_least_once                                                                        | N            | Kafka データを消費して Doris にインポートする際のデータ整合性の保証方法。`at_least_once` `exactly_once` をサポート。デフォルトは `at_least_once`。データ `exactly_once` を保証するには Doris を 2.1.0 以上にアップグレードする必要があります   |
| converter.mode              | `normal`,<br/> `debezium_ingestion`  | normal                                                                               | N            | Connector を使用して Kafka データを消費する際のアップストリームデータの型変換モード。<br/>```normal``` は Kafka のデータを通常通り消費し、型変換は行いません。<br/>```debezium_ingestion``` は Kafka アップストリームデータが Debezium などの CDC (Changelog Data Capture) ツールを通じて収集される場合、アップストリームデータをサポートするために特別な型変換を行う必要があることを意味します。                                                                                                                                                                                                                                                                                                                                                                                    |
| debezium.schema.evolution   | `none`,<br/> `basic`                 | none                                                                                 | N            | Debezium を使用してアップストリームデータベースシステム（MySQL など）を収集し、構造変更が発生した場合、追加されたフィールドを Doris に同期できます。<br/>`none` はアップストリームデータベースシステムの構造が変更されても、変更された構造は Doris に同期されないことを意味します。<br/>`basic` はアップストリームデータベースのデータ変更操作を同期することを意味します。列構造の変更は危険な操作（Doris テーブル構造の列を誤って削除する可能性がある）であるため、現在はアップストリームの列追加操作のみを同期的にサポートします。列が改名された場合、古い列は変更されず、Connector はターゲットテーブルに新しい列を追加し、改名された新しいデータを新しい列にシンクします。       |
| enable.delete               | -                                    | false                                                                                | N            | レコードを同期的に削除するかどうか。デフォルト false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| database.time_zone          | -                                    | UTC                                                                                  | N            | `converter.mode` が `normal` モード以外の場合、日付データ型（datetime、date、timestamp など）のタイムゾーン変換を指定する方法を提供します。デフォルトは UTC タイムゾーン。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| avro.topic2schema.filepath  | -                                    | -                                                                                    | N            | ローカルに提供された Avro Schema ファイルを読み込むことで、Topic 内の Avro ファイルコンテンツを解析し、Confluent が提供する Schema 登録センターからの分離を実現します。<br/>この設定は `key.converter` または `value.converter` プレフィックスと組み合わせて使用する必要があります。例：avro-user および avro-product Topic のローカル Avro Schema ファイルを設定：`"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"`<br/>具体的な使用方法については[#32](https://github.com/apache/doris-kafka-connector/pull/32)を参照してください                                                                                                                                                                  |
| record.tablename.field      | -                                    | -                                                                                    | N            | このパラメータを設定すると、1 つの kafka topic からのデータを複数の doris テーブルに流すことができます。設定の詳細については[#58](https://github.com/apache/doris-kafka-connector/pull/58)を参照してください                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| max.retries                 | -                                    | 10                                                                                   | N            | タスクが失敗する前にエラー時に再試行する最大回数。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| retry.interval.ms           | -                                    | 6000                                                                                 | N            | エラー後に再試行を試みる前に待機する時間（ミリ秒）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| behavior.on.null.values     | `ignore`,<br/> `fail`                | ignore                                                                               | N            | null 値を持つレコードの処理方法を定義します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

その他の Kafka Connect Sink 共通設定項目については、以下を参照してください：[connect_configuring](https://kafka.apache.org/documentation/#connect_configuring)

## 型マッピング
Doris-kafka-connector は論理型またはプリミティブ型マッピングを使用して列のデータ型を解決します。
<br />プリミティブ型は Kafka connect の `Schema` を使用して表現される単純なデータ型を指します。論理データ型は通常 `Struct` 構造を使用して複合型、または日付と時刻型を表現します。


| Kafka Primitive Type     | Doris Type |
|--------------------------|----------|
| INT8                     | TINYINT  |
| INT16                    | SMALLINT |
| INT32                    | INT      |
| INT64                    | BIGINT   |
| FLOAT32                  | FLOAT    |
| FLOAT64                  | DOUBLE   |
| BOOLEAN                  | BOOLEAN  |
| STRING                   | STRING   |
| BYTES                    | STRING   |

| Kafka Logical Type                        | Doris Type |
|-------------------------------------------|----------|
| org.apache.kafka.connect.data.Decimal     | DECIMAL  |
| org.apache.kafka.connect.data.Date        | DATE     |
| org.apache.kafka.connect.data.Time        | STRING   |
| org.apache.kafka.connect.data.Timestamp   | DATETIME |

| Debezium Logical Type                   | Doris Type  |
|-----------------------------------------|-----------|
| io.debezium.time.Date                   | DATE      |
| io.debezium.time.Time                   | String    |
| io.debezium.time.MicroTime              | DATETIME  |
| io.debezium.time.NanoTime               | DATETIME  |
| io.debezium.time.ZonedTime              | DATETIME  |
| io.debezium.time.Timestamp              | DATETIME  |
| io.debezium.time.MicroTimestamp         | DATETIME  |
| io.debezium.time.NanoTimestamp          | DATETIME  |
| io.debezium.time.ZonedTimestamp         | DATETIME  |
| io.debezium.data.VariableScaleDecimal   | DOUBLE    |


## ベストプラクティス
### プレーン JSON データの読み込み

1. データインポートサンプル<br />
   Kafka に以下のサンプルデータがあります

   ```shell
   kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-data-topic --from-beginning
   {"user_id":1,"name":"Emily","age":25}
   {"user_id":2,"name":"Benjamin","age":35}
   {"user_id":3,"name":"Olivia","age":28}
   {"user_id":4,"name":"Alexander","age":60}
   {"user_id":5,"name":"Ava","age":17}
   {"user_id":6,"name":"William","age":69}
   {"user_id":7,"name":"Sophia","age":32}
   {"user_id":8,"name":"James","age":64}
   {"user_id":9,"name":"Emma","age":37}
   {"user_id":10,"name":"Liam","age":64}
   ```
2. インポートする必要があるテーブルを作成する<br />
   Dorisで、インポートテーブルを作成します。具体的な構文は以下の通りです

    ```sql
   CREATE TABLE test_db.test_kafka_connector_tbl(
   user_id            BIGINT       NOT NULL COMMENT "user id",
   name               VARCHAR(20)           COMMENT "name",
   age                INT                   COMMENT "age"
   )
   DUPLICATE KEY(user_id)
   DISTRIBUTED BY HASH(user_id) BUCKETS 12;
   ```
3. インポートタスクを作成する<br />
   Kafka-connectがデプロイされているマシンで、curlコマンドを通じて以下のインポートタスクを送信する

    ```shell
   curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
   "name":"test-doris-sink-cluster",
   "config":{
   "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
   "tasks.max":"10",
   "topics":"test-data-topic",
   "doris.topic2table.map": "test-data-topic:test_kafka_connector_tbl",
   "doris.urls":"10.10.10.1",
   "doris.user":"root",
   "doris.password":"",
   "doris.http.port":"8030",
   "doris.query.port":"9030",
   "doris.database":"test_db",
   "buffer.count.records":"10000",
   "buffer.flush.time":"120",
   "buffer.size.bytes":"5000000",
   "enable.combine.flush": "true",
   "key.converter":"org.apache.kafka.connect.storage.StringConverter",
   "value.converter": "org.apache.kafka.connect.json.JsonConverter",
   "value.converter.schemas.enable": "false"
   }
   }'
   ```
### Debeziumコンポーネントによって収集されたデータを読み込む
1. MySQLデータベースには以下のテーブルがあります

```sql
   CREATE TABLE test.test_user (
   user_id int NOT NULL ,
   name varchar(20),
   age int,
   PRIMARY KEY (user_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

insert into test.test_user values(1,'zhangsan',20);
insert into test.test_user values(2,'lisi',21);
insert into test.test_user values(3,'wangwu',22);
```
2. Dorisでインポートテーブルを作成する

```sql
   CREATE TABLE test_db.test_user(
   user_id            BIGINT       NOT NULL COMMENT "user id",
   name               VARCHAR(20)           COMMENT "name",
   age                INT                   COMMENT "age"
   )
   UNIQUE KEY(user_id)
   DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```
3. MySQL用のDebezium connectorコンポーネントをデプロイします。参照: [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
4. doris-kafka-connectorインポートタスクを作成します<br />
   DebeziumによってキャプチャされたMySQLテーブルデータが`mysql_debezium.test.test_user` Topicにあると仮定します

```shell
   curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
   "name":"test-debezium-doris-sink",
   "config":{
   "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
   "tasks.max":"10",
   "topics":"mysql_debezium.test.test_user",
   "doris.topic2table.map": "mysql_debezium.test.test_user:test_user",
   "doris.urls":"10.10.10.1",
   "doris.user":"root",
   "doris.password":"",
   "doris.http.port":"8030",
   "doris.query.port":"9030",
   "doris.database":"test_db",
   "buffer.count.records":"10000",
   "buffer.flush.time":"30",
   "buffer.size.bytes":"5000000",
   "enable.combine.flush": "true",
   "converter.mode":"debezium_ingestion",
   "enable.delete":"true",
   "key.converter":"org.apache.kafka.connect.json.JsonConverter",
   "value.converter":"org.apache.kafka.connect.json.JsonConverter"
   }
   }'
```
### Avroシリアライズされたデータの読み込み

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-avro-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"avro_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "avro_topic:avro_tab", 
    "doris.urls":"127.0.0.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "enable.combine.flush": "true",
    "key.converter":"io.confluent.connect.avro.AvroConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.avro.AvroConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```
### Protobufシリアル化データの読み込み

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-protobuf-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"proto_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "proto_topic:proto_tab", 
    "doris.urls":"127.0.0.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000",
    "enable.combine.flush": "true", 
    "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```
### Kafka Connect Single Message Transformsを使用したデータの読み込み

例えば、以下の形式のデータを考えてみましょう：

```shell
{
  "registertime": 1513885135404,
  "userid": "User_9",
  "regionid": "Region_3",
  "gender": "MALE"
}
```
Kafkaメッセージにハードコードされた列を追加するには、InsertFieldを使用できます。さらに、TimestampConverterを使用してBigint型のタイムスタンプを時刻文字列に変換できます。

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name": "insert_field_tranform",
  "config": {
    "connector.class": "org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max": "1",  
    "topics": "users",  
    "doris.topic2table.map": "users:kf_users",  
    "buffer.count.records": "10000",    
    "buffer.flush.time": "10",       
    "buffer.size.bytes": "5000000",  
    "doris.urls": "127.0.0.1:8030", 
    "doris.user": "root",                
    "doris.password": "123456",           
    "doris.http.port": "8030",           
    "doris.query.port": "9030",          
    "doris.database": "testdb",          
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false",  
    "transforms": "InsertField,TimestampConverter",  
    // Insert Static Field
    "transforms.InsertField.type": "org.apache.kafka.connect.transforms.InsertField$Value",
    "transforms.InsertField.static.field": "repo",    
    "transforms.InsertField.static.value": "Apache Doris",  
    // Convert Timestamp Format
    "transforms.TimestampConverter.type": "org.apache.kafka.connect.transforms.TimestampConverter$Value",
    "transforms.TimestampConverter.field": "registertime",  
    "transforms.TimestampConverter.format": "yyyy-MM-dd HH:mm:ss.SSS",
    "transforms.TimestampConverter.target.type": "string"
  }
}'
```
InsertField と TimestampConverter の変換後、データは以下のようになります：

```shell
{
  "userid": "User_9",
  "regionid": "Region_3",
  "gender": "MALE",
  "repo": "Apache Doris",// Static field added   
   "registertime": "2017-12-21 03:38:55.404"  // Unix timestamp converted to string
}
```
Kafka Connect Single Message Transforms (SMT) のより多くの例については、[SMT documentation](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html) を参照してください。


## FAQ
**1. Json型データを読み取る際に以下のエラーが発生します:**

```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
	at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
	at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
	at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
	at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```
**原因:**
これは、`org.apache.kafka.connect.json.JsonConverter`コンバーターを使用する際に「schema」と「payload」フィールドの一致が必要なためです。

**2つの解決策から1つを選択してください:**
  1. `org.apache.kafka.connect.json.JsonConverter`を`org.apache.kafka.connect.storage.StringConverter`に置き換える
  2. 起動モードが**Standalone**モードの場合、config/connect-standalone.propertiesの`value.converter.schemas.enable`または`key.converter.schemas.enable`をfalseに変更する；
   起動モードが**Distributed**モードの場合、config/connect-distributed.propertiesの`value.converter.schemas.enable`または`key.converter.schemas.enable`をfalseに変更する

**2. 消費がタイムアウトし、コンシューマーが消費グループから除外される:**

```shell
org.apache.kafka.clients.consumer.CommitFailedException: Offset commit cannot be completed since the consumer is not part of an active group for auto partition assignment; it is likely that the consumer was kicked out of the group.
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.sendOffsetCommitRequest(ConsumerCoordinator.java:1318)
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.doCommitOffsetsAsync(ConsumerCoordinator.java:1127)
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.commitOffsetsAsync(ConsumerCoordinator.java:1093)
        at org.apache.kafka.clients.consumer.KafkaConsumer.commitAsync(KafkaConsumer.java:1590)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.doCommitAsync(WorkerSinkTask.java:361)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.doCommit(WorkerSinkTask.java:376)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.commitOffsets(WorkerSinkTask.java:467)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.commitOffsets(WorkerSinkTask.java:381)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:221)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.execute(WorkerSinkTask.java:206)
        at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:204)
        at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:259)
        at org.apache.kafka.connect.runtime.isolation.Plugins.lambda$withClassLoader$1(Plugins.java:181)
        at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:539)
        at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
        at java.base/java.lang.Thread.run(Thread.java:833)
```
**解決方法:**

シナリオに応じてKafkaの`max.poll.interval.ms`を増加させてください。デフォルト値は`300000`です。
- Standaloneモードで起動する場合、config/connect-standalone.propertiesの設定ファイルに`max.poll.interval.ms`と`consumer.max.poll.interval.ms`パラメータを追加し、パラメータ値を設定してください。
- Distributedモードで起動する場合、config/connect-distributed.propertiesの設定ファイルに`max.poll.interval.ms`と`consumer.max.poll.interval.ms`パラメータを追加し、パラメータ値を設定してください。

パラメータを調整した後、kafka-connectを再起動してください。

**3. Doris-kafka-connectorでバージョン1.0.0または1.1.0から24.0.0にアップグレードする際にエラーが報告される**

```
org.apache.kafka.common.config.ConfigException: Topic 'connect-status' supplied via the 'status.storage.topic' property is required to have 'cleanup.policy=compact' to guarantee consistency and durability of connector and task statuses, but found the topic currently has 'cleanup.policy=delete'. Continuing would likely result in eventually losing connector and task statuses and problems restarting this Connect cluster in the future. Change the 'status.storage.topic' property in the Connect worker configurations to use a topic with 'cleanup.policy=compact'.
	at org.apache.kafka.connect.util.TopicAdmin.verifyTopicCleanupPolicyOnlyCompact(TopicAdmin.java:581)
	at org.apache.kafka.connect.storage.KafkaTopicBasedBackingStore.lambda$topicInitializer$0(KafkaTopicBasedBackingStore.java:47)
	at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:247)
	at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:231)
	at org.apache.kafka.connect.storage.KafkaStatusBackingStore.start(KafkaStatusBackingStore.java:228)
	at org.apache.kafka.connect.runtime.AbstractHerder.startServices(AbstractHerder.java:164)
	at org.apache.kafka.connect.runtime.distributed.DistributedHerder.run
```
**解決策:**
`connect-configs` `connect-status` Topicのクリアリング戦略をcompactに調整する

```
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```
**4. `debezium_ingestion`コンバーターモードでテーブルスキーマ変更が失敗しました**

```
[2025-01-07 14:26:20,474] WARN [doris-normal_test_sink-connector|task-0] Table 'test_sink' cannot be altered because schema evolution is disabled. (org.apache.doris.kafka.connector.converter.RecordService:183)
[2025-01-07 14:26:20,475] ERROR [doris-normal_test_sink-connector|task-0] WorkerSinkTask{id=doris-normal_test_sink-connector-0} Task threw an uncaught and unrecoverable exception. Task is being killed and will not recover until manually restarted. Error: Cannot alter table org.apache.doris.kafka.connector.model.TableDescriptor@67cd8027 because schema evolution is disabled (org.apache.kafka.connect.runtime.WorkerSinkTask:612)
org.apache.doris.kafka.connector.exception.SchemaChangeException: Cannot alter table org.apache.doris.kafka.connector.model.TableDescriptor@67cd8027 because schema evolution is disabled
	at org.apache.doris.kafka.connector.converter.RecordService.alterTableIfNeeded(RecordService.java:186)
	at org.apache.doris.kafka.connector.converter.RecordService.checkAndApplyTableChangesIfNeeded(RecordService.java:150)
	at org.apache.doris.kafka.connector.converter.RecordService.processStructRecord(RecordService.java:100)
	at org.apache.doris.kafka.connector.converter.RecordService.getProcessedRecord(RecordService.java:305)
	at org.apache.doris.kafka.connector.writer.DorisWriter.putBuffer(DorisWriter.java:155)
	at org.apache.doris.kafka.connector.writer.DorisWriter.insertRecord(DorisWriter.java:124)
	at org.apache.doris.kafka.connector.writer.StreamLoadWriter.insert(StreamLoadWriter.java:151)
	at org.apache.doris.kafka.connector.service.DorisDefaultSinkService.insert(DorisDefaultSinkService.java:154)
	at org.apache.doris.kafka.connector.service.DorisDefaultSinkService.insert(DorisDefaultSinkService.java:135)
	at org.apache.doris.kafka.connector.DorisSinkTask.put(DorisSinkTask.java:97)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.deliverMessages(WorkerSinkTask.java:583)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.poll(WorkerSinkTask.java:336)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:237)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.execute(WorkerSinkTask.java:206)
	at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:202)
	at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:257)
	at org.apache.kafka.connect.runtime.isolation.Plugins.lambda$withClassLoader$1(Plugins.java:177)
	at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:515)
	at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
	at java.base/java.lang.Thread.run(Thread.java:829)
```
**解決方法:**

`debezium_ingestion`コンバーターモードでは、テーブルスキーマ変更はデフォルトで無効になっています。テーブルスキーマ変更を有効にするには、`debezium.schema.evolution`を`basic`に設定する必要があります。<br />
テーブル構造変更を有効にしても、この変更されたカラムをDorisテーブル内の唯一のカラムとして正確に保持されないことに注意が必要です（詳細は`debezium.schema.evolution`パラメータの説明を参照）。上流と下流で一意のカラムのみを保持する必要がある場合は、変更されたカラムを手動でDorisテーブルに追加し、その後Connectorタスクを再起動することが最適です。Connectorは未消費の`offset`を継続して消費し、データ整合性を維持します。
