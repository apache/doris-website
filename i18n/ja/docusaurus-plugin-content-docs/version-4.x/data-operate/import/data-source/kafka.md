---
{
    "title": "Kafka からのデータインポート",
    "language": "ja",
    "description": "Kafka から Apache Doris にデータをインポートする方法を、Routine Load と Doris Kafka Connector の選択、設定、使用例とともに説明します。",
    "keywords": [
        "Kafka インポート",
        "Routine Load",
        "Doris Kafka Connector",
        "Kafka Connect",
        "Debezium",
        "Avro",
        "Protobuf",
        "CDC 同期"
    ]
}
---

<!-- Knowledge type: Operational steps / Architecture selection decision -->
<!-- Applicable scenarios: Real-time data ingestion / Importing Kafka data into Doris -->

Apache Doris は Kafka からのデータをリアルタイムで取り込めます。これはログ、注文、IoT イベント、CDC 同期など、リアルタイムのデータ取り込みによく使われます。このドキュメントでは、主な二つの方法について、選択の指針、利用上の制限、操作例を説明します。

## 方法の選択

Doris では、Kafka からデータをインポートする方法として次の二つを利用できます。

| 方法 | 適したシナリオ | 対応形式 | 特徴 |
| --- | --- | --- | --- |
| [Routine Load](../import-way/routine-load-manual.md) | 外部コンポーネントを追加する必要がない一般的なシナリオ | CSV、JSON | Kafka Topic を継続的に読み取り、リアルタイムでインポートタスクを生成します。exactly-once セマンティクスを提供し、データの欠落や重複を防ぎます |
| [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md) | Avro や Protobuf などのシリアライズ形式のデータ、または Debezium が収集した上流データベースの CDC データを取り込む場合 | JSON、Avro、Protobuf、Debezium | Kafka Connect のプラグイン機構を基盤とし、水平スケーリングと耐障害性に対応します |

選択の指針:

- 通常は、Doris が Kafka を直接読み取る **Routine Load** を選びます。デプロイが最も簡単です。
- **Avro / Protobuf** などの形式を取り込む場合や、**Debezium** など Kafka Connect エコシステムのコンポーネントと連携する場合は、**Doris Kafka Connector** を選びます。

## 方法 1: Routine Load で Kafka データを取り込む

Routine Load は、指定した Kafka Topic のメッセージを継続的に読み取り、Doris テーブルにリアルタイムで書き込む長時間実行ジョブを Doris に登録します。

### 利用上の制限

1. メッセージ形式は **CSV** と **JSON** のみをサポートします。CSV では、各メッセージが一行に相当し、その行の末尾に改行を含めません。
2. デフォルトでは **Kafka 0.10.0.0 以降**をサポートします。0.9.0、0.8.2、0.8.1、0.8.0 などの古いバージョンを使うには、BE 設定の `kafka_broker_version_fallback` を互換性のある古いバージョンに変更するか、Routine Load の作成時に `property.broker.version.fallback` を設定します。古いバージョンでは、時刻による Kafka パーティションオフセットの指定など、一部の新機能が利用できない場合があります。

### 操作例

`CREATE ROUTINE LOAD` コマンドで、長時間実行する Routine Load のインポートタスクを作成します。単一テーブルと複数テーブルへのインポートの二つのシナリオがあります。構文の詳細は [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD) を参照してください。

#### シナリオ 1: 単一テーブルへのインポート

一つの Kafka Topic から Doris の一つのテーブルにデータをインポートします。

**手順 1: Kafka データを用意する**

Kafka のサンプルデータは次のとおりです。

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**手順 2: Doris にインポート先テーブルを作成する**

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**手順 3: Routine Load ジョブを作成する**

`CREATE ROUTINE LOAD` コマンドでインポートジョブを作成します。

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

**手順 4: インポート結果を確認する**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### シナリオ 2: 複数テーブルへのインポート

同じ Kafka Topic から複数の Doris テーブルにデータを同時にインポートする場合に使用します。

要件と制限:

- Kafka のデータには、`table_name|data` 形式でテーブル名を含める必要があります。たとえば、CSV 形式では `table_name|val1,val2,val3` とします。
- **テーブル名は Doris のテーブル名と完全に一致する必要があります**。一致しない場合、インポートは失敗します。
- 複数テーブルへのインポートは、後述の `column_mapping` 設定を**サポートしません**。

**手順 1: Kafka データを用意する**

Kafka のサンプルデータは次のとおりです（先頭の部分がインポート先テーブル名です）。

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**手順 2: Doris にインポート先テーブルを作成する**

テーブル 1:

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

テーブル 2:

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**手順 3: 複数テーブル用の Routine Load ジョブを作成する**

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**手順 4: インポート結果を確認する**

```SQL
mysql> select * from test_multi_table_load1;
+---------+----------------+------+
| user_id | name           | age  |
+---------+----------------+------+
|  1      | Emily          | 25   |
+---------+----------------+------+

mysql> select * from test_multi_table_load2;
+---------+----------------+------+
| user_id | name           | age  |
+---------+----------------+------+
|  2      | Benjamin       | 35   |
+---------+----------------+------+
```

### セキュリティ認証の設定

Kafka クラスターで SSL、SASL などのセキュリティ認証を有効にしている場合は、[Kafka のセキュリティ認証](../import-way/routine-load-manual.md#kafka-security-authentication) を参照して、対応する認証パラメータを設定してください。

## 方法 2: Doris Kafka Connector で Kafka データを取り込む

Doris Kafka Connector は Kafka Connect フレームワークを基盤とし、Kafka のデータストリームを Doris に書き込むツールです。プラグイン機構を通じて JSON、Avro、Protobuf など複数のシリアライズ形式を取り込めるほか、Debezium が収集した CDC データの解析にも対応します。

### 分散モードでの起動

[分散モード](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) は、Kafka Connect にスケーラビリティと自動的な耐障害性を提供します。このモードでは、同じ `group.id` を持つ複数のワーカープロセスを起動でき、それらがコネクターとタスクのスケジューリングを調整します。

**手順 1: プラグイン JAR を配置する**

`plugins` ディレクトリを `$KAFKA_HOME` の下に作成し、ダウンロードした `doris-kafka-connector` の JAR を配置します。

**手順 2: `config/connect-distributed.properties` を設定する**

```Bash
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Modify the group.id; it must be the same within the same cluster
group.id=connect-cluster

# Change to the plugins directory you created
# Note: enter the direct path under Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load import timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

**手順 3: Kafka Connect を起動する**

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

**手順 4: インポートタスクを登録する（Kafka データの取り込み）**

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

**よく使う Kafka Connect の操作コマンド**

| 操作 | コマンド |
| --- | --- |
| コネクターの状態を確認 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET` |
| 現在のコネクターを削除 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE` |
| 現在のコネクターを一時停止 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT` |
| 現在のコネクターを再起動 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT` |
| コネクター内のタスクを再起動 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST` |

分散モードの詳細は、[分散ワーカー](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) を参照してください。

### プレーン JSON データの取り込み

Kafka にプレーン JSON メッセージが保存されている場合に使用します。

**手順 1: Kafka データを用意する**

Kafka のサンプルデータは次のとおりです。

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

**手順 2: Doris にインポート先テーブルを作成する**

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**手順 3: インポートタスクを登録する**

Kafka Connect をデプロイしたマシンで、`curl` を使って次のインポートタスクを登録します。

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

### Debezium が収集したデータの取り込み

Debezium が MySQL や PostgreSQL などの上流データベースから変更データ（CDC）をリアルタイムで収集し、Doris に書き込む場合に使用します。

**手順 1: MySQL にソーステーブルとデータを用意する**

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

**手順 2: Doris にインポート先テーブルを作成する**

CDC シナリオでは、主キーによる重複排除と削除に対応するため、`UNIQUE KEY` テーブルモデルが必要です。

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**手順 3: Debezium MySQL Connector をデプロイする**

Debezium の MySQL 用コネクターをデプロイします。[Debezium の MySQL コネクター](https://debezium.io/documentation/reference/stable/connectors/mysql.html) を参照してください。

**手順 4: doris-kafka-connector のインポートタスクを作成する**

Debezium が収集した MySQL テーブルのデータが `mysql_debezium.test.test_user` Topic に保存されているとします。

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

主なパラメータ:

- `converter.mode=debezium_ingestion`: Debezium データ形式の解析を有効にします。
- `enable.delete=true`: Doris で削除操作を同期的に実行します。

### Avro シリアライズ形式のデータの取り込み

Kafka が Schema Registry とともに Avro 形式のデータを保存している場合に使用します。

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

### Protobuf シリアライズ形式のデータの取り込み

Kafka が Schema Registry とともに Protobuf 形式のデータを保存している場合に使用します。

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

## よくある質問

**Q1: Routine Load と Doris Kafka Connector はどう選べばよいですか？**

- ほとんどのシナリオでは Routine Load で十分です。追加のコンポーネントは不要で、CSV と JSON に対応します。
- Avro / Protobuf 形式のデータを取り込む場合や、Debezium など Kafka Connect エコシステムのコンポーネントと連携する場合は、Doris Kafka Connector を使用します。

**Q2: Routine Load はどのバージョンの Kafka に対応していますか？**

デフォルトでは Kafka 0.10.0.0 以降に対応します。古いバージョン（0.9.0、0.8.x）から取り込むには、BE 設定の `kafka_broker_version_fallback` を変更するか、ジョブ作成時に `property.broker.version.fallback` を設定します。古いバージョンでは、時刻による Kafka パーティションオフセットの指定など、一部の新機能が利用できなくなる点に注意してください。

**Q3: 複数テーブルへのインポートでは、Kafka データをどの形式にすればよいですか？**

データ形式は `table_name|data` にする必要があります。たとえば、CSV で複数テーブルにインポートする場合は `table_name|val1,val2,val3` とし、`table_name` を Doris のテーブル名と完全に一致させます。一致しない場合、インポートは失敗します。複数テーブルへのインポートは `column_mapping` 設定をサポートしません。

**Q4: Kafka Connect で取り込む場合、`max.poll.interval.ms` を長くする必要があるのはなぜですか？**

Stream Load による Doris への書き込みには時間がかかることがあります。`max.poll.interval.ms`（デフォルトは 5 分）が短すぎると、コンシューマーがコンシューマーグループから除外されます。**30 分を超える**値に増やし、`consumer.max.poll.interval.ms` もそれに合わせて設定することを推奨します。

**Q5: Debezium が収集した DELETE 操作を Doris に同期するにはどうすればよいですか？**

Doris Kafka Connector の設定で `converter.mode=debezium_ingestion` と `enable.delete=true` を指定し、Doris では `UNIQUE KEY` テーブルモデルに CDC データを保存します。

## 関連リンク

- [CREATE ROUTINE LOAD の構文リファレンス](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- [Routine Load 操作マニュアル](../import-way/routine-load-manual.md)
- [Doris Kafka Connector のドキュメント](../../../connection-integration/data-integration/doris-kafka-connector.md)
- [Kafka のセキュリティ認証の設定](../import-way/routine-load-manual.md#kafka-security-authentication)
- [Kafka Connect の分散ワーカー](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)
- [Debezium の MySQL コネクター](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
