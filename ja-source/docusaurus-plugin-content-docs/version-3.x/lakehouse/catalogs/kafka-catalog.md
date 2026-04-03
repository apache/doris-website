---
{
  "title": "Kafka カタログ",
  "description": "Apache Doris Kafka カタログガイド: Trino Connector frameworkを通じてKafkaデータストリームに接続し、Kafka Topicデータをクエリおよび統合します。Schema Registry、複数のデータフォーマットをサポートし、KafkaとDorisの迅速なデータ統合を実現します。",
  "language": "ja"
}
---
## 概要

Kafka カタログはTrino Kafka Connectorを[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換フレームワーク経由で使用してKafka Topicデータにアクセスします。

:::note
- これは実験的機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスタ環境に依存せず、Trino互換プラグインのみを使用します。
:::

### 使用ケース

| シナリオ | サポート状況 |
| -------- | ------------ |
| データ統合 | Kafka Topicデータを読み取り、Doris内部tableに書き込み |
| データライトバック | サポートなし |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **Kafkaバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/kafka.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

以下のいずれかの方法でKafka Connectorプラグインを取得できます。

**方法1: プリコンパイル済みパッケージの使用（推奨）**

[ここ](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からプリコンパイル済みプラグインパッケージをダウンロードして展開します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）。

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```
コンパイル後、`trino/plugin/trino-kafka/target/`の下に`trino-kafka-435/`ディレクトリが生成されます。

### ステップ 2: Deploy Plugin

1. すべてのFEおよびBEデプロイメントパスの`connectors/`ディレクトリに`trino-kafka-435/`ディレクトリを配置します（存在しない場合は手動でディレクトリを作成してください）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```
> `fe.conf`内の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることもできます。例：`trino_connector_plugin_dir=/path/to/connectors/`

2. コネクタが適切にロードされるよう、すべてのFEおよびBEノードを再起動します。

### ステップ 3: Create カタログ

**基本設定**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.table-names' = 'test_db.topic_name',
    'trino.kafka.hide-internal-columns' = 'false'
);
```
**設定ファイルの使用**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.hide-internal-columns' = 'false'
);
```
**デフォルトスキーマの設定**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.default-schema' = 'default_db',
    'trino.kafka.hide-internal-columns' = 'false'
);
```
### ステップ 4: データのクエリ

カタログを作成した後、以下の3つの方法のいずれかを使用してKafka Topicデータをクエリできます：

```sql
-- Method 1: Switch to catalog and query
SWITCH kafka;
USE kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- Method 2: Use two-level path
USE kafka.kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kafka.kafka_schema.topic_name LIMIT 10;
```
## Schema Registry 統合

Kafka CatalogはConfluent Schema Registryを通じた自動スキーマ取得をサポートしており、Table構造を手動で定義する必要がなくなります。

### Schema Registryの設定

**Basic 認証**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.hide-internal-columns' = 'false'
);
```
**完全な設定例**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.default-schema' = 'nrdp',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.confluent-schema-registry-subject-mapping' = 'nrdp.topic1:NRDP.topic1',
    'trino.kafka.hide-internal-columns' = 'false'
);
```
### Schema Registry パラメータ

| パラメータ名 | Required | Default | デスクリプション |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.table-description-supplier` | No | - | Schema Registry サポートを有効にするために `CONFLUENT` に設定 |
| `trino.kafka.confluent-schema-registry-url` | Yes* | - | Schema Registry サービスアドレス |
| `trino.kafka.confluent-schema-registry-auth-type` | No | NONE | 認証タイプ: NONE、BASIC_AUTH、BEARER |
| `trino.kafka.confluent-schema-registry.basic-auth.username` | No | - | Basic Auth ユーザー名 |
| `trino.kafka.confluent-schema-registry.basic-auth.password` | No | - | Basic Auth パスワード |
| `trino.kafka.confluent-schema-registry-subject-mapping` | No | - | Subject 名マッピング、形式: `<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>` |

:::tip
Schema Registry を使用する場合、Doris は Schema Registry から Topic スキーマ情報を自動的に取得するため、手動でTable構造を作成する必要がありません。
:::

### Subject マッピング

場合によっては、Schema Registry に登録された Subject 名が Kafka の Topic 名と一致せず、データクエリができない場合があります。このような場合は、`confluent-schema-registry-subject-mapping` を通じてマッピング関係を手動で指定する必要があります。

```sql
-- Map schema.topic to SCHEMA.topic Subject in Schema Registry
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```
`db1` と `tbl1` は Doris で表示される実際の Database と Table の名前であり、`topic_name1` は Kafka の実際の Topic 名です（大文字小文字を区別します）。

複数のマッピングはカンマで区切ることができます：

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```
## 構成

### カタログ 構成 パラメータ

Kafka Catalogを作成するための基本的な構文は以下の通りです：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kafka',    -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```
#### TrinoPropertiesパラメータ

TrinoPropertiesは、`trino.`プレフィックスが付いたTrino Kafka Connector固有のプロパティを設定するために使用されます。一般的なパラメータには以下があります：

| パラメータ名 | 必須 | デフォルト | 説明 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.nodes` | はい | - | Kafka Brokerノードアドレスリスト、フォーマット：`host1:port1,host2:port2` |
| `trino.kafka.table-names` | いいえ | - | マップするTopicのリスト、フォーマット：`schema.topic1,schema.topic2` |
| `trino.kafka.default-schema` | いいえ | default | デフォルトスキーマ名 |
| `trino.kafka.hide-internal-columns` | いいえ | true | Kafka内部カラム（`_partition_id`、`_partition_offset`など）を非表示にするかどうか |
| `trino.kafka.config.resources` | いいえ | - | Kafkaクライアント設定ファイルパス |
| `trino.kafka.table-description-supplier` | いいえ | - | Table構造プロバイダ、Schema Registryを使用する場合は`CONFLUENT`に設定 |
| `trino.kafka.confluent-schema-registry-url` | いいえ | - | Schema Registryサービスアドレス |

Kafka Connectorのその他の設定パラメータについては、[Trino Official Documentation](https://trino.io/docs/435/connector/kafka.html)を参照してください。

#### CommonPropertiesパラメータ

CommonPropertiesは、メタデータ更新ポリシーや権限制御などの一般的なカタログプロパティを設定するために使用されます。詳細については、[カタログ 概要](../catalog-overview.md)の「Common Properties」セクションを参照してください。

### Kafkaクライアント設定

高度なKafkaクライアントパラメータ（セキュリティ認証、SSLなど）を設定する必要がある場合は、設定ファイルを通じて指定できます。設定ファイル（例：`kafka-client.properties`）を作成します：

```properties
# ============================================
# Kerberos/SASL 認証 構成
# ============================================
sasl.mechanism=GSSAPI
sasl.kerberos.service.name=kafka

# JAAS 構成 - Using keytab method
sasl.jaas.config=com.sun.security.auth.module.Krb5LoginModule required \
    useKeyTab=true \
    storeKey=true \
    useTicketCache=false \
    serviceName="kafka" \
    keyTab="/opt/trino/security/keytabs/kafka.keytab" \
    principal="kafka@EXAMPLE.COM";

# ============================================
# Avro Deserializer 構成
# ============================================
key.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
value.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
```
次に、カタログを作成する際に設定ファイルを指定します：

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties'
);
```
## データ型マッピング

Kafka Catalogを使用する際、データ型は以下のルールに従ってマッピングされます：

| Kafka/Avro タイプ | Trino タイプ | Doris タイプ | 注釈 |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | integer | int | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| bytes | varbinary | string | `HEX(col)`関数を使用してクエリ |
| string | varchar | string | |
| array | array | array | |
| map | map | map | |
| record | row | struct | 複雑なネスト構造 |
| enum | varchar | string | |
| fixed | varbinary | string | |
| null | - | - | |

:::tip
- `bytes`型の場合、`HEX()`関数を使用して16進形式で表示します。
- Kafka Catalogでサポートされるデータ型は、使用されるシリアライゼーション形式（JSON、Avro、Protobufなど）とSchema Registry設定に依存します。
:::

## Kafka内部カラム

Kafka ConnectorはKafkaメッセージのメタデータ情報にアクセスするためのいくつかの内部カラムを提供します：

| Column Name | タイプ | デスクリプション |
| ----------- | ---- | ----------- |
| `_partition_id` | bigint | メッセージが配置されているパーティションID |
| `_partition_offset` | bigint | パーティション内のメッセージオフセット |
| `_message_timestamp` | timestamp | メッセージタイムスタンプ |
| `_key` | varchar | メッセージキー |
| `_key_corrupt` | boolean | キーが破損しているかどうか |
| `_key_length` | bigint | キーのバイト長 |
| `_message` | varchar | 生のメッセージ内容 |
| `_message_corrupt` | boolean | メッセージが破損しているかどうか |
| `_message_length` | bigint | メッセージのバイト長 |
| `_headers` | map | メッセージヘッダー情報 |

デフォルトでは、これらの内部カラムは非表示になっています。これらのカラムをクエリする必要がある場合は、カタログ作成時に設定してください：

```sql
'trino.kafka.hide-internal-columns' = 'false'
```
クエリの例:

```sql
SELECT 
    _partition_id,
    _partition_offset,
    _message_timestamp,
    *
FROM kafka.schema.topic_name
LIMIT 10;
```
## 制限事項

1. **読み取り専用アクセス**: Kafka Catalogはデータの読み取りのみをサポートしており、書き込み操作（INSERT、UPDATE、DELETE）はサポートされていません。

2. **Table名の設定**: Schema Registryを使用しない場合、`trino.kafka.table-names`パラメータを通じてアクセスするTopicのリストを明示的に指定する必要があります。

3. **スキーマ定義**:
   - Schema Registryを使用する場合、スキーマ情報はSchema Registryから自動的に取得されます。
   - Schema Registryを使用しない場合、Table定義を手動で作成するか、TrinoのTopic記述ファイルを使用する必要があります。

4. **データフォーマット**: サポートされるデータフォーマットは、Topicで使用されるシリアライゼーション方式（JSON、Avro、Protobufなど）に依存します。詳細については、[Trino Official Documentation](https://trino.io/docs/435/connector/kafka.html)を参照してください。

5. **パフォーマンスに関する考慮事項**:
   - Kafka CatalogはKafkaデータをリアルタイムで読み取ります。大量のデータをクエリするとパフォーマンスに影響を与える可能性があります。
   - スキャンするデータ量を制限するために、`LIMIT`句や時間フィルター条件を使用することを推奨します。

## 機能のデバッグ

機能検証のためのKafka環境を迅速に構築するには、[こちら](https://github.com/morningman/demo-env/tree/main/kafka)を参照してください。

## 参考資料

- [Trino Kafka Connector Official Documentation](https://trino.io/docs/435/connector/kafka.html)
- [Trino Connector Development Guide](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)
- [Confluent Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/index.html)
