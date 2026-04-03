---
{
  "title": "Kafka",
  "language": "ja",
  "description": "DorisはKafkaからデータを読み込むために以下の方法を提供します："
}
---
Dorisでは、Kafkaからデータを読み込むために以下の方法を提供しています：

- **Routine Loadを使用してKafkaデータを消費する**

DorisはRoutine LoadによってKafka Topicsからデータを継続的に消費します。Routine Loadジョブを投入した後、DorisはKafkaクラスター内の指定されたTopicからメッセージを消費するロードタスクをリアルタイムで生成します。Routine LoadはCSVおよびJSON形式をサポートし、Exactly-Onceセマンティクスにより、データの損失や重複を防ぎます。詳細なドキュメントについては、[Routine Load](../import-way/routine-load-manual.md)を参照してください。

- **Doris Kafka ConnectorでKafkaデータを消費する**

Doris Kafka Connectorは、KafkaデータストリームをDorisデータベースにロードするためのツールです。ユーザーはKafka Connectプラグインを通じて様々なシリアライゼーション形式（JSON、Avro、Protobufなど）を簡単にロードでき、Debeziumコンポーネントからのデータ形式の解析もサポートしています。詳細なドキュメントについては、[Doris Kafka Connector](../../../ecosystem/doris-kafka-connector.md)を参照してください。

多くの場合、外部コンポーネントを統合してKafkaデータを消費する必要なく、データをロードするためにRoutine Loadを直接選択できます。AvroやProtobuf形式のデータ、またはDebeziumを介して上流データベースから収集されたデータをロードする必要がある場合は、Doris Kafka Connectorを使用できます。

## Routine Loadを使用してKafkaデータを消費する

### 使用制限

1. サポートされているメッセージ形式はCSVとJSONです。各CSVメッセージは1行で、行末に改行文字を含みません；
2. デフォルトでは、Kafkaバージョン0.10.0.0以上をサポートしています。古いバージョン（0.9.0、0.8.2、0.8.1、0.8.0など）を使用する必要がある場合は、BE設定を変更して`kafka_broker_version_fallback`を互換性のある古いバージョンに設定するか、Routine Load作成時に`property.broker.version.fallback`を設定する必要があります。古いバージョンを使用すると、時間に基づいたKafkaパーティションオフセット設定など、一部の新機能が使用できない場合があります。

### 操作例

DorisでCREATE ROUTINE LOADコマンドを通じて永続的なRoutine Loadロードタスクを作成できます。これは単一テーブルロードと複数テーブルロードに分かれます。詳細な構文については、[CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)を参照してください。

#### 単一テーブルロード

**ステップ1：データの準備**

Kafkaでは、サンプルデータは以下の通りです：

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```
**ステップ2: データベースでのテーブル作成**

Dorisにロードするテーブルを以下の構文で作成します：

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
**ステップ3: 単一テーブルにデータをロードするRoutine Loadジョブを作成する**

Dorisでは、CREATE ROUTINE LOADコマンドを使用してロードジョブを作成します：

```SQL
CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
COLUMNS TERMINATED BY ",",
COLUMNS(user_id, name, age)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-routine-load-csv",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```
**Step 4: 読み込まれたデータの確認**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```
#### マルチテーブルロード

複数のテーブルを同時にロードする必要があるシナリオでは、Kafka内のデータにはテーブル名情報を含める必要があり、フォーマットは `table_name|data` です。例えば、CSVデータをロードする場合、フォーマットは `table_name|val1,val2,val3` とする必要があります。テーブル名はDoris内のテーブル名と完全に一致する必要があることに注意してください。そうでなければロードは失敗し、後で紹介するcolumn_mapping設定はサポートされません。

**ステップ1: データの準備**

Kafka内のサンプルデータは以下の通りです：

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```
**ステップ2: データベースでテーブルを作成**

Dorisにロードするテーブルを以下の構文で作成します：

テーブル1：

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User Name",
    age                INT                   COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
表 2:

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User Name",
    age                INT                   COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
**ステップ3: 複数のテーブルにデータをロードするためのRoutine Loadジョブを作成する**

Dorisでは、CREATE ROUTINE LOADコマンドを使用してロードジョブを作成します：

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```
**ステップ4: 読み込まれたデータの確認**

```SQL
select * from test_multi_table_load1;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|  1   | Emily          | 25   |
+------+----------------+------+

select * from test_multi_table_load2;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|  2   | Benjamin       | 35   |
+------+----------------+------+
```
#### **セキュリティ認証の設定**

認証付きKafkaの設定方法については、[Kafka Security Authentication](../import-way/routine-load-manual.md#kafka-security-authentication)を参照してください。

## Doris Kafka Connectorを使用したKafkaデータの取得

Doris Kafka Connectorは、KafkaデータストリームをDorisデータベースに読み込むためのツールです。ユーザーはKafka Connectプラグインを通じて、様々なシリアライゼーション形式（JSON、Avro、Protobufなど）を簡単に読み込むことができ、Debeziumコンポーネントからのデータ形式の解析もサポートしています。

### 分散モードでの開始

[分散](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)モードは、Kafka Connectにスケーラビリティと自動フォルトトレラント機能を提供します。このモードでは、同じ`group.id`を使用して複数のワーカープロセスを開始でき、利用可能なすべてのワーカープロセス間でコネクタとタスクの実行を調整します。

1. `$KAFKA_HOME`の下にpluginsディレクトリを作成し、ダウンロードしたdoris-kafka-connector jarパッケージを配置します。
2. `config/connect-distributed.properties`を設定します：

```Bash
# Modify kafka server address
bootstrap.servers=127.0.0.1:9092

# Modify group.id, which needs to be consistent across the same cluster
group.id=connect-cluster

# Modify to the created plugins directory
# Note: Please fill in the direct path of Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms time to over 30 minutes, default is 5 minutes
# To avoid Stream Load data load consumption timeout, causing the consumer to be kicked out of the consumption group
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```
3. 開始:

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```
4. Kafkaデータを消費する:

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "topics":"topic_test",
    "doris.topic2table.map": "topic_test:test_kafka_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.storage.StringConverter"
  }
}'
```
**Kafka Connectの操作**

```Bash
# View connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET
# Delete current connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE
# Pause current connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT
# Resume current connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT
# Restart tasks within the connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```
Distributed モードの概要については、[Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) を参照してください。

### 通常のデータを読み込む

1. サンプルデータを読み込む：

Kafka では、サンプルデータは以下の通りです：

```Bash
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
2. ロードするテーブルを作成する：

以下の構文を使用して、Dorisでロードするテーブルを作成します：

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```
3. ロードタスクを作成する:

Kafka Connectがデプロイされているマシン上で、curlコマンドを使用して以下のロードタスクを送信します:

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max":"10",
    "topics":"test-data-topic",
    "doris.topic2table.map": "test-data-topic:test_kafka_connector_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.storage.StringConverter"
  }
}'
```
### Debeziumコンポーネントによって収集されたデータの読み込み

1. MySQLデータベースには以下のテーブルがあります：

```SQL
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
2. Dorisに読み込むテーブルを作成します：

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```
3. MySQL用のDebeziumコネクターコンポーネントをデプロイします。参照: [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)。

4. doris-kafka-connectorロードタスクを作成します:

Debeziumによって収集されたMySQLテーブルからのデータが`mysql_debezium.test.test_user` Topicにあると仮定します:

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-debezium-doris-sink",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max":"10",
    "topics":"mysql_debezium.test.test_user",
    "doris.topic2table.map": "mysql_debezium.test.test_user:test_user",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "converter.mode":"debezium_ingestion",
    "enable.delete":"true",
    "key.converter":"org.apache.kafka.connect.json.JsonConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter"
  }
}'
```
### AVRO シリアライゼーション形式でのデータ読み込み

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-avro-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"avro_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "avro_topic:avro_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"10.10.10.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"io.confluent.connect.avro.AvroConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.avro.AvroConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```
### Protobuf シリアライゼーション形式でのデータ読み込み

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-protobuf-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"proto_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "proto_topic:proto_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"10.10.10.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```
