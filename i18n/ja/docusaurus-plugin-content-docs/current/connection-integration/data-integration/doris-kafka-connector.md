---
{
    "title": "Doris Kafka Connector",
    "language": "ja",
    "description": "Doris Kafka Connector を使用して Kafka トピックのデータを Apache Doris にリアルタイムで書き込む方法を説明します。デプロイモード、設定項目、型マッピング、Debezium による同期、トラブルシューティングを扱います。",
    "keywords": [
        "Doris Kafka Connector",
        "Kafka Connect",
        "Kafka から Doris へのデータ連携",
        "Apache Doris へのリアルタイム取り込み",
        "Debezium から Doris へのデータ連携"
    ]
}
---

<!-- Knowledge type: Operations guide / Configuration reference -->
<!-- Applicable scenarios: Real-time ingestion of Kafka data into Doris / Kafka Connect Sink Connector deployment and troubleshooting -->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) は、Apache Kafka とほかのシステム間でデータを移動するための、拡張性と信頼性の高いデータ連携ツールです。Doris コミュニティは、Kafka トピックのデータを Doris に書き込む [doris-kafka-connector](https://github.com/apache/doris-kafka-connector) プラグインを提供しています。

## 適用シナリオ

Kafka から Doris にデータを継続的に書き込むには、データソースと実行環境に合った設定を選択します。

| 利用シナリオ | 使用する機能 | 参照セクション |
| --- | --- | --- |
| ローカルでの検証や開発テスト | Kafka Connect を Standalone モードで起動し、ローカル設定ファイルで Doris Sink Connector を作成する | [Standalone モードでのデプロイ](#standalone-mode-deployment) |
| 本番環境やクラスターへのデプロイ | Kafka Connect を Distributed モードで起動し、REST API で Connector を管理する | [Distributed モードでのデプロイ](#distributed-mode-deployment) |
| 通常の JSON データの同期 | `JsonConverter` または `StringConverter` で Kafka トピックを消費し、Doris テーブルに書き込む | [通常の JSON データの同期](#synchronizing-plain-json-data) |
| Debezium が取得した CDC データの同期 | `converter.mode=debezium_ingestion` を設定し、必要に応じて削除の同期を有効にする | [Debezium が取得したデータの同期](#synchronizing-data-captured-by-debezium) |
| Avro または Protobuf でシリアライズされたデータの同期 | Confluent Avro Converter または Protobuf Converter を使用し、Schema Registry のアドレスを設定する | [Avro でシリアライズされたデータの同期](#synchronizing-avro-serialized-data)、[Protobuf でシリアライズされたデータの同期](#synchronizing-protobuf-serialized-data) |
| 書き込み前の Kafka メッセージの変換 | Kafka Connect SMT を使用してメッセージにフィールドを追加したり、日時形式を変換したりする | [Kafka Connect SMT によるデータ変換](#transforming-data-with-kafka-connect-smt) |
| SSL 認証を使用する Kafka クラスターへのアクセス | Kafka Connect Worker と組み込みコンシューマーに SSL パラメータを設定する | [SSL 認証を使用する Kafka クラスターへのアクセス](#accessing-an-ssl-authenticated-kafka-cluster) |
| 変換に失敗したレコードの記録 | Kafka Connect のデッドレターキューを設定する | [デッドレターキューの設定](#configuring-a-dead-letter-queue) |

## バージョン情報

| Connector のバージョン | Kafka のバージョン | Doris のバージョン | Java のバージョン |
| --- | --- | --- | --- |
| 1.0.0 | 2.4+ | 2.0+ | 8 |
| 1.1.0 | 2.4+ | 2.0+ | 8 |
| 24.0.0 | 2.4+ | 2.0+ | 8 |
| 25.0.0 | 2.4+ | 2.0+ | 8 |
| 26.0.0 | 2.4+ | 2.0+ | 8 |
| 26.1.0 | 2.4+ | 2.0+ | 8 |

## Doris Kafka Connector の準備

Doris Kafka Connector は、JAR パッケージをダウンロードするか、Maven の依存関係に追加して利用できます。

### JAR パッケージのダウンロード

[Doris のダウンロードページ](https://doris.apache.org/download)から doris-kafka-connector の JAR パッケージを取得します。Kafka Connect をデプロイするときに、JAR パッケージを `$KAFKA_HOME/plugins` ディレクトリに配置します。

### Maven 依存関係の使用

Maven プロジェクトに次の依存関係を追加します。

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>doris-kafka-connector</artifactId>
    <version>26.1.0</version>
</dependency>
```

## Standalone モードでのデプロイ

Standalone モードは、ローカルでの検証や開発テストに適しています。通常、本番環境には推奨されません。

### 1. プラグインディレクトリの準備

`plugins` ディレクトリを `$KAFKA_HOME` の下に作成し、ダウンロードした doris-kafka-connector の JAR パッケージを配置します。

### 2. Kafka Connect Worker の設定

`$KAFKA_HOME/config/connect-standalone.properties` を編集します。

```properties
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Set this to the plugins directory you created
# Note: use Kafka's direct path here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load consumption timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. Doris Sink Connector の設定

`doris-connector-sink.properties` を `$KAFKA_HOME/config` ディレクトリに作成します。

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

### 4. Standalone モードの起動

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```

## Distributed モードでのデプロイ

Distributed モードは、複数ノードの Kafka Connect クラスターに適しています。このモードでは、先に Kafka Connect Worker を起動し、REST API を使用して Connector を作成・管理します。

### 1. プラグインディレクトリの準備

`plugins` ディレクトリを `$KAFKA_HOME` の下に作成し、ダウンロードした doris-kafka-connector の JAR パッケージを配置します。

### 2. Kafka Connect Worker の設定

`$KAFKA_HOME/config/connect-distributed.properties` を編集します。

```properties
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Modify group.id; it must be the same across the same cluster
group.id=connect-cluster

# Set this to the plugins directory you created
# Note: use Kafka's direct path here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load consumption timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. Distributed モードの起動

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

:::note
Kafka Connect の初回起動時には、Kafka クラスターに `config.storage.topic`、`offset.storage.topic`、`status.storage.topic` の 3 つのトピックが作成されます。これらは共有 Connector 設定、オフセットデータ、ステータス更新の記録に使用されます。詳しくは [Kafka Connect の使い方: はじめに](https://docs.confluent.io/platform/current/connect/userguide.html)を参照してください。
:::

### 4. Connector の作成

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"test-doris-sink-cluster",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"topic_test",
        "doris.topic2table.map":"topic_test:test_kafka_tbl",
        "doris.urls":"10.10.10.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test_db",
        "enable.combine.flush":"true",
        "buffer.count.records":"10000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"5000000",
        "key.converter":"org.apache.kafka.connect.storage.StringConverter",
        "value.converter":"org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable":"false"
    }
}'
```

### 5. Connector の管理

Kafka Connect REST API を使用して、Connector の状態確認、一時停止、再開、削除、再起動ができます。API の詳細は [Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)を参照してください。

```shell
# View Connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET

# Delete the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE

# Pause the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT

# Resume the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT

# Restart a task within the Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```

## 本番環境向けの設定

### SSL 認証を使用する Kafka クラスターへのアクセス

Kafka Connect から SSL 認証を使用する Kafka クラスターにアクセスする場合は、`client.truststore.jks` など、Kafka ブローカーの公開鍵を検証するための証明書ファイルが必要です。`connect-distributed.properties` に次の設定を追加します。

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

Kafka Connect から SSL 認証を使用する Kafka クラスターへの接続について詳しくは、[Kafka Connect の設定](https://docs.confluent.io/platform/current/security/security_tutorial.html#configure-kafka-connect)を参照してください。

### デッドレターキューの設定

デフォルトでは、変換中にエラーが発生すると Connector は失敗します。次の設定を使用すると、これらのエラーを許容し、問題のレコードとともに各エラーおよび失敗した処理の詳細をデッドレターキューに書き込めます。

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```

## 設定項目

以下の設定項目は Doris Sink Connector の作成に使用します。Kafka Connect Sink に共通するその他の設定項目については、[connect_configuring](https://kafka.apache.org/documentation/#connect_configuring)を参照してください。

| キー | 選択肢 | デフォルト値 | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `name` | - | - | Y | Connect アプリケーションの名前。Kafka Connect 環境内で一意である必要があります。 |
| `connector.class` | - | - | Y | `org.apache.doris.kafka.connector.DorisSinkConnector`。 |
| `topics` | - | - | Y | 購読するトピックの一覧。複数のトピックは `topic1,topic2` のようにカンマで区切ります。 |
| `doris.urls` | - | - | Y | Doris FE の接続先アドレス。複数のアドレスは `10.20.30.1,10.20.30.2,10.20.30.3` のようにカンマで区切ります。 |
| `doris.http.port` | - | - | Y | Doris の HTTP プロトコルのポート。 |
| `doris.query.port` | - | - | Y | Doris の MySQL プロトコルのポート。 |
| `doris.user` | - | - | Y | Doris のユーザー名。 |
| `doris.password` | - | - | Y | Doris のパスワード。 |
| `doris.database` | - | - | Y | 書き込み先データベース。複数のデータベースに書き込む場合は空にできます。その場合、データベース名を `topic2table.map` で指定する必要があります。 |
| `doris.enable.tls` | `true`,<br />`false` | false | N | Doris の HTTP 接続と MySQL 接続で TLS を有効にするかどうか。 |
| `doris.tls.ca-certificate-path` | - | 空文字列 | N | Worker のローカルにある PEM 形式の CA 証明書チェーンのパス。空の場合、Connector は独自の CA を読み込まず、対応するクライアントのデフォルトのトラストストアを使用します。 |
| `doris.tls.skip-hostname-verification` | `true`,<br />`false` | false | N | CA 検証を維持したまま、ホスト名の検証を省略するかどうか。 |
| `doris.tls.excluded-protocols` | `http`,<br />`mysql` | 空文字列 | N | TLS を使用しない Doris プロトコルをカンマで区切って指定します。 |
| `doris.topic2table.map` | - | - | Y | トピックとテーブルの対応付け。例: `topic1:tb1,topic2:tb2`。空の場合、デフォルトではトピック名が書き込み先テーブル名として使用されます。複数のデータベースを使用する場合の形式は `topic1:db1.tbl1,topic2:db2.tbl2` です。 |
| `load.model` | `stream_load`,<br />`tvf` | stream_load | N | Doris への書き込みモード。S3 TVF 経由で書き込むには `tvf` に設定します。 |
| `buffer.count.records` | - | 50000 | N | 1 回の Stream Load で書き込むレコード数。 |
| `buffer.flush.time` | - | 120 | N | バッファをフラッシュする間隔（秒）。デフォルトは 120 秒です。 |
| `buffer.size.bytes` | - | 104857600(100MB) | N | 1 回の Stream Load で書き込むデータサイズ。 |
| `enable.combine.flush` | `true`,<br />`false` | false | N | すべてのパーティションのデータを 1 回の書き込みにまとめるかどうか。デフォルトは `false` です。有効にした場合、保証できるのは `at_least_once` セマンティクスのみです。 |
| `jmx` | - | true | N | JMX を使用して Connector 内部の監視メトリクスを取得するかどうか。[Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md)を参照してください。 |
| `label.prefix` | - | `${name}` | N | データ取り込み時の Stream Load ラベルのプレフィックス。デフォルトは Connector アプリケーション名です。 |
| `auto.redirect` | - | true | N | Stream Load リクエストをリダイレクトするかどうか。有効にすると、FE を経由して書き込み先の BE に Stream Load がリダイレクトされ、BE の情報は表示されなくなります。 |
| `sink.properties.*` | - | `'sink.properties.format':'json'`,<br />`'sink.properties.read_json_by_line':'true'` | N | Stream Load の取り込みパラメータ。たとえば列区切り文字は `'sink.properties.column_separator':','` で指定します。詳しくは [Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。<br /><br />Group Commit を有効にする場合、たとえば `sync_mode` を有効にするには `"sink.properties.group_commit":"sync_mode"` を指定します。Group Commit では `off_mode`、`sync_mode`、`async_mode` の 3 モードをサポートします。詳しくは [Group Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/)を参照してください。<br /><br />一部の列のみを更新する場合、たとえば `col2` 列を更新するには `"sink.properties.partial_columns":"true"` と `"sink.properties.columns":"col2"` を指定します。 |
| `sink.s3.endpoint` | - | - | TVF 書き込みモードのみ | S3 互換オブジェクトストレージの絶対 HTTP または HTTPS エンドポイント。 |
| `sink.s3.region` | - | - | TVF 書き込みモードのみ | オブジェクトストレージのリージョン。 |
| `sink.s3.bucket` | - | - | TVF 書き込みモードのみ | データの一時保存に使用するバケット。 |
| `sink.s3.prefix` | - | - | TVF 書き込みモードのみ | データの一時保存に使用するオブジェクトキーのプレフィックス。 |
| `sink.s3.access-key` | - | - | TVF 書き込みモードのみ | オブジェクトストレージのアクセスキー。 |
| `sink.s3.secret-key` | - | - | TVF 書き込みモードのみ | オブジェクトストレージのシークレットキー。 |
| `sink.s3.path-style-access` | `true`,<br />`false` | false | N | TVF 書き込みモードでパス形式のオブジェクトストレージアクセスを使用するかどうか。 |
| `delivery.guarantee` | `at_least_once`,<br />`exactly_once` | at_least_once | N | Kafka データの消費から Doris への取り込みまでのデータ整合性保証。`at_least_once` と `exactly_once` をサポートします。デフォルトは `at_least_once` です。`exactly_once` を保証するには Doris を 2.1.0 以降にアップグレードする必要があります。 |
| `converter.mode` | `normal`,<br />`debezium_ingestion` | normal | N | Connector が Kafka データを消費するときに使用する、上流データ型の変換モード。`normal` は特別な型変換を行わずに Kafka データを通常どおり消費します。`debezium_ingestion` は、Debezium などの CDC（変更データキャプチャ）ツールで上流の Kafka データを収集した場合に、特別な型変換を行います。 |
| `debezium.schema.evolution` | `none`,<br />`basic` | none | N | Debezium を使用して MySQL などの上流データベースからデータを収集する際、スキーマが変更された場合に追加されたフィールドを Doris に同期できます。`none` は上流データベースのスキーマ変更を Doris に同期しません。`basic` は上流データベースのデータ変更操作を同期します。列スキーマの変更は危険を伴い、Doris テーブルのスキーマから列が誤って削除されるおそれがあるため、現在は上流での列追加のみをサポートします。列名を変更した場合、古い列はそのまま残り、Connector は書き込み先テーブルに新しい列を追加して、名前を変更したデータをその列に書き込みます。 |
| `enable.delete` | - | false | N | Debezium による同期で削除レコードを同期するかどうか。デフォルトは `false` です。Debezium を使用しない同期では、メッセージに削除マーカーを追加する必要があります。 |
| `database.time_zone` | - | UTC | N | `converter.mode` を `normal` 以外に設定した場合、`datetime`、`date`、`timestamp` などの日時データ型に適用するタイムゾーン変換を指定します。デフォルトは UTC です。 |
| `avro.topic2schema.filepath` | - | - | N | ローカルの Avro スキーマファイルを読み込んでトピック内の Avro ファイルの内容を解析し、Confluent Schema Registry への依存をなくします。この設定は `key.converter` または `value.converter` のプレフィックスとともに使用する必要があります。たとえば `avro-user` と `avro-product` トピックにローカルの Avro スキーマファイルを設定するには、`"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"` を指定します。詳しくは [#32](https://github.com/apache/doris-kafka-connector/pull/32)を参照してください。 |
| `record.tablename.field` | - | - | N | この項目を有効にすると、1 つのトピックから複数の Doris テーブルにデータを流せます。設定の詳細は [#58](https://github.com/apache/doris-kafka-connector/pull/58)を参照してください。 |
| `max.retries` | - | 10 | N | タスクが失敗するまでにエラーを再試行する最大回数。 |
| `retry.interval.ms` | - | 6000 | N | エラー発生後、再試行するまでの待機時間（ミリ秒）。デフォルトは 6000 ミリ秒です。 |
| `behavior.on.null.values` | `ignore`,<br />`fail` | ignore | N | `null` 値を持つレコードの処理方法。デフォルトではスキップします。 |

## 型マッピング

Doris Kafka Connector は、Kafka Connect のプリミティブ型または論理型を使用して列のデータ型を解析します。プリミティブ型は Kafka Connect の `Schema` で表される単純なデータ型です。論理型は通常、`Struct` を使用して複合型や日時型を表します。

### Kafka のプリミティブ型

| Kafka のプリミティブ型 | Doris の型 |
| --- | --- |
| INT8 | TINYINT |
| INT16 | SMALLINT |
| INT32 | INT |
| INT64 | BIGINT |
| FLOAT32 | FLOAT |
| FLOAT64 | DOUBLE |
| BOOLEAN | BOOLEAN |
| STRING | STRING |
| BYTES | STRING |

### Kafka の論理型

| Kafka の論理型 | Doris の型 |
| --- | --- |
| `org.apache.kafka.connect.data.Decimal` | DECIMAL |
| `org.apache.kafka.connect.data.Date` | DATE |
| `org.apache.kafka.connect.data.Time` | STRING |
| `org.apache.kafka.connect.data.Timestamp` | DATETIME |

### Debezium の論理型

| Debezium の論理型 | Doris の型 |
| --- | --- |
| `io.debezium.time.Date` | DATE |
| `io.debezium.time.Time` | String |
| `io.debezium.time.MicroTime` | DATETIME |
| `io.debezium.time.NanoTime` | DATETIME |
| `io.debezium.time.ZonedTime` | DATETIME |
| `io.debezium.time.Timestamp` | DATETIME |
| `io.debezium.time.MicroTimestamp` | DATETIME |
| `io.debezium.time.NanoTimestamp` | DATETIME |
| `io.debezium.time.ZonedTimestamp` | DATETIME |
| `io.debezium.data.VariableScaleDecimal` | DOUBLE |

## データシナリオ別の Connector 設定

### 通常の JSON データの同期

このシナリオでは、Kafka トピック内の通常の JSON メッセージを Doris テーブルに書き込みます。

1. Kafka のサンプルデータを確認します。

    ```bash
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

2. Doris に書き込み先テーブルを作成します。

    ```sql
    CREATE TABLE test_db.test_kafka_connector_tbl (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. Kafka Connect をデプロイしたマシンで、`curl` を使用して取り込みタスクを送信します。

    ```shell
    curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
        "name":"test-doris-sink-cluster",
        "config":{
            "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
            "tasks.max":"10",
            "topics":"test-data-topic",
            "doris.topic2table.map":"test-data-topic:test_kafka_connector_tbl",
            "doris.urls":"10.10.10.1",
            "doris.user":"root",
            "doris.password":"",
            "doris.http.port":"8030",
            "doris.query.port":"9030",
            "doris.database":"test_db",
            "buffer.count.records":"10000",
            "buffer.flush.time":"120",
            "buffer.size.bytes":"5000000",
            "enable.combine.flush":"true",
            "key.converter":"org.apache.kafka.connect.storage.StringConverter",
            "value.converter":"org.apache.kafka.connect.json.JsonConverter",
            "value.converter.schemas.enable":"false"
        }
    }'
    ```

### Debezium が取得したデータの同期

このシナリオでは、Debezium が取得した MySQL の CDC データを Kafka 経由で Doris に書き込みます。

1. MySQL データベースには次のテーブルとデータがあるものとします。

    ```sql
    CREATE TABLE test.test_user (
        user_id int NOT NULL,
        name varchar(20),
        age int,
        PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    INSERT INTO test.test_user VALUES (1, 'zhangsan', 20);
    INSERT INTO test.test_user VALUES (2, 'lisi', 21);
    INSERT INTO test.test_user VALUES (3, 'wangwu', 22);
    ```

2. Doris に書き込み先テーブルを作成します。

    ```sql
    CREATE TABLE test_db.test_user (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    UNIQUE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. MySQL 用の Debezium connector コンポーネントをデプロイします。手順の詳細は [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)を参照してください。

4. doris-kafka-connector の取り込みタスクを作成します。Debezium が取得した MySQL テーブルのデータは `mysql_debezium.test.test_user` トピックにあるものとします。

    ```shell
    curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
        "name":"test-debezium-doris-sink",
        "config":{
            "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
            "tasks.max":"10",
            "topics":"mysql_debezium.test.test_user",
            "doris.topic2table.map":"mysql_debezium.test.test_user:test_user",
            "doris.urls":"10.10.10.1",
            "doris.user":"root",
            "doris.password":"",
            "doris.http.port":"8030",
            "doris.query.port":"9030",
            "doris.database":"test_db",
            "buffer.count.records":"10000",
            "buffer.flush.time":"30",
            "buffer.size.bytes":"5000000",
            "enable.combine.flush":"true",
            "converter.mode":"debezium_ingestion",
            "enable.delete":"true",
            "key.converter":"org.apache.kafka.connect.json.JsonConverter",
            "value.converter":"org.apache.kafka.connect.json.JsonConverter"
        }
    }'
    ```

### Avro でシリアライズされたデータの同期

このシナリオでは、Avro でシリアライズされた Kafka トピックを消費し、Confluent Avro Converter でデータを解析します。

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"doris-avro-test",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"avro_topic",
        "tasks.max":"10",
        "doris.topic2table.map":"avro_topic:avro_tab",
        "doris.urls":"127.0.0.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test",
        "buffer.count.records":"100000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"10000000",
        "enable.combine.flush":"true",
        "key.converter":"io.confluent.connect.avro.AvroConverter",
        "key.converter.schema.registry.url":"http://127.0.0.1:8081",
        "value.converter":"io.confluent.connect.avro.AvroConverter",
        "value.converter.schema.registry.url":"http://127.0.0.1:8081"
    }
}'
```

### Protobuf でシリアライズされたデータの同期

このシナリオでは、Protobuf でシリアライズされた Kafka トピックを消費し、Confluent Protobuf Converter でデータを解析します。

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"doris-protobuf-test",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"proto_topic",
        "tasks.max":"10",
        "doris.topic2table.map":"proto_topic:proto_tab",
        "doris.urls":"127.0.0.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test",
        "buffer.count.records":"100000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"10000000",
        "enable.combine.flush":"true",
        "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
        "key.converter.schema.registry.url":"http://127.0.0.1:8081",
        "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
        "value.converter.schema.registry.url":"http://127.0.0.1:8081"
    }
}'
```

### Kafka Connect SMT によるデータ変換

このシナリオでは、Doris に書き込む前に個々の Kafka メッセージにフィールドを追加したり、形式を変換したりします。次の例では `InsertField` で静的フィールドを追加し、`TimestampConverter` で Bigint のタイムスタンプを日時文字列に変換します。

元データの例:

```json
{
    "registertime": 1513885135404,
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE"
}
```

Connector を作成します。

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"insert_field_tranform",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "tasks.max":"1",
        "topics":"users",
        "doris.topic2table.map":"users:kf_users",
        "buffer.count.records":"10000",
        "buffer.flush.time":"10",
        "buffer.size.bytes":"5000000",
        "doris.urls":"127.0.0.1:8030",
        "doris.user":"root",
        "doris.password":"123456",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"testdb",
        "key.converter":"org.apache.kafka.connect.storage.StringConverter",
        "value.converter":"org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable":"false",
        "transforms":"InsertField,TimestampConverter",
        "transforms.InsertField.type":"org.apache.kafka.connect.transforms.InsertField$Value",
        "transforms.InsertField.static.field":"repo",
        "transforms.InsertField.static.value":"Apache Doris",
        "transforms.TimestampConverter.type":"org.apache.kafka.connect.transforms.TimestampConverter$Value",
        "transforms.TimestampConverter.field":"registertime",
        "transforms.TimestampConverter.format":"yyyy-MM-dd HH:mm:ss.SSS",
        "transforms.TimestampConverter.target.type":"string"
    }
}'
```

SMT による処理後、サンプルデータは次のようになります。

```json
{
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE",
    "repo": "Apache Doris",
    "registertime": "2017-12-21 03:38:55.404"
}
```

ここでは、`repo` は `InsertField` によって追加された静的フィールドで、`registertime` は `TimestampConverter` によって変換された日時文字列です。Kafka Connect の Single Message Transforms（SMT）のその他の例は、[SMT ドキュメント](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html)を参照してください。

## ベストプラクティス

### Kafka Connect から TLS を有効にした Doris 環境にアクセスする

TLS を有効にした Doris クラスターに書き込む場合は、Connector の設定に次の項目を追加します。

```json
{
"doris.urls":"doris-fe.example.com",
"doris.http.port":"8040",
"doris.query.port":"9030",
"doris.enable.tls":"true",
"doris.tls.ca-certificate-path":"/etc/kafka-connect/certs/doris-ca.pem"
}
```

`doris.urls` にはホスト名のみを指定し、スキームやポートは追加しないでください。CA のパスを設定しない場合、Connector は独自の CA を読み込まず、対応するクライアントのデフォルトのトラストストアを使用します。

Kafka Connect のデプロイモードに応じて、CA ファイルを次のように配置します。

- **Standalone**: Worker ホストに CA ファイルを配置し、そのローカルパスを設定します。
- **Distributed**: タスクはどの Worker にも割り当てられる可能性があるため、すべての Worker の同じローカルパスに CA ファイルを配置します。
- **Kubernetes**: すべての Kafka Connect Worker Pod に同じ Secret またはボリュームをマウントし、そのマウント先のパスを設定します。

### S3 TVF 書き込みモードの使用

TVF 書き込みモードでは、データを JSON として S3 互換オブジェクトストレージに保存した後、S3 TVF を通じて Doris に書き込みます。Kafka Connect と Doris の両方からオブジェクトストレージにアクセスでき、書き込み先の Doris テーブルがすでに存在することを確認してください。Connector の設定に次の項目を追加します。

```json
{
"load.model":"tvf",
"enable.combine.flush":"true",
"delivery.guarantee":"at_least_once",
"sink.properties.columns":"id,name,age",
"sink.s3.endpoint":"$YOUR_S3_ENDPOINT",
"sink.s3.region":"$YOUR_S3_REGION",
"sink.s3.bucket":"$YOUR_S3_BUCKET",
"sink.s3.prefix":"$YOUR_S3_PREFIX",
"sink.s3.access-key":"$YOUR_S3_ACCESS_KEY",
"sink.s3.secret-key":"$YOUR_S3_SECRET_KEY"
}
```

`sink.properties.columns` には、書き込み順に書き込み先テーブルの列を指定する必要があります。Connector は一時保存したオブジェクトを自動的に削除しないため、必要に応じてオブジェクトストレージのライフサイクルポリシーを設定してください。

## よくある質問

### JSON データの読み取り時に `JsonConverter with schemas.enable requires "schema" and "payload" fields` が報告される

**エラーメッセージ:**

```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
    at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
    at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```

**原因:**

`org.apache.kafka.connect.json.JsonConverter` を使用する場合、データは `schema` フィールドと `payload` フィールドに一致する必要があります。

**解決方法:**

次のいずれかの方法を使用します。

1. `org.apache.kafka.connect.json.JsonConverter` を `org.apache.kafka.connect.storage.StringConverter` に置き換えます。
2. 対応する設定ファイルで `value.converter.schemas.enable` または `key.converter.schemas.enable` を `false` に設定します。
    - Standalone モード: `config/connect-standalone.properties` を変更します。
    - Distributed モード: `config/connect-distributed.properties` を変更します。

### 消費のタイムアウトによりコンシューマーがコンシューマーグループから除外される

**エラーメッセージ:**

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

利用シナリオに応じて Kafka の `max.poll.interval.ms` を増やします。デフォルト値は `300000` です。

- Standalone モード: `max.poll.interval.ms` と `consumer.max.poll.interval.ms` を `config/connect-standalone.properties` に追加し、値を設定します。
- Distributed モード: `max.poll.interval.ms` と `consumer.max.poll.interval.ms` を `config/connect-distributed.properties` に追加し、値を設定します。

パラメータを調整した後、Kafka Connect を再起動します。

### Doris Kafka Connector を 1.0.0 または 1.1.0 から 24.0.0 にアップグレードすると `cleanup.policy=compact` エラーが報告される

**エラーメッセージ:**

```shell
org.apache.kafka.common.config.ConfigException: Topic 'connect-status' supplied via the 'status.storage.topic' property is required to have 'cleanup.policy=compact' to guarantee consistency and durability of connector and task statuses, but found the topic currently has 'cleanup.policy=delete'. Continuing would likely result in eventually losing connector and task statuses and problems restarting this Connect cluster in the future. Change the 'status.storage.topic' property in the Connect worker configurations to use a topic with 'cleanup.policy=compact'.
    at org.apache.kafka.connect.util.TopicAdmin.verifyTopicCleanupPolicyOnlyCompact(TopicAdmin.java:581)
    at org.apache.kafka.connect.storage.KafkaTopicBasedBackingStore.lambda$topicInitializer$0(KafkaTopicBasedBackingStore.java:47)
    at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:247)
    at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:231)
    at org.apache.kafka.connect.storage.KafkaStatusBackingStore.start(KafkaStatusBackingStore.java:228)
    at org.apache.kafka.connect.runtime.AbstractHerder.startServices(AbstractHerder.java:164)
    at org.apache.kafka.connect.runtime.distributed.DistributedHerder.run
```

**解決方法:**

`connect-configs` と `connect-status` トピックのクリーンアップポリシーを `compact` に変更します。

```shell
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```

### `debezium_ingestion` 変換モードでスキーマ変更に失敗する

**エラーメッセージ:**

```shell
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

`debezium_ingestion` 変換モードでは、デフォルトでスキーマ変更が無効になっています。スキーマ変更を有効にするには `debezium.schema.evolution=basic` を設定します。

スキーマ変更を有効にしても、変更した列だけが Doris テーブルに存在することは厳密には保証されません。具体的な制限事項については、`debezium.schema.evolution` パラメータの説明を参照してください。上流と下流で列を 1 つだけに保つには、先に Doris テーブルに変更後の列を手動で追加してから Connector タスクを再起動することを推奨します。Connector は最後に未消費だった `offset` から消費を続け、データの整合性を維持します。
