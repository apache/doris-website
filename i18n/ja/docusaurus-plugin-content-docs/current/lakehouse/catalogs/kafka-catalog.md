---
{
  "title": "Kafkaカタログ",
  "language": "ja",
  "description": "Apache Doris Kafka Catalogガイド：Trino Connector frameworkを通じてKafkaデータストリームに接続し、Kafka Topicデータのクエリと統合を行います。Schema Registry、複数のデータフォーマットをサポートし、KafkaとDorisの迅速なデータ統合を実現します。"
}
---
## 概要

Kafka CatalogはTrino Kafka Connectorを[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワーク経由で使用し、Kafka Topicデータにアクセスします。

:::note
- これは実験的な機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスタ環境に依存せず、Trino互換プラグインのみを使用します。
:::

### 使用事例

| シナリオ | サポート状況 |
| -------- | -------------- |
| データ統合 | Kafka Topicデータを読み取り、Doris内部テーブルに書き込み |
| データ書き戻し | サポートされていません |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以降
- **Trino Connectorバージョン**: 435
- **Kafkaバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/kafka.html)を参照してください

## クイックスタート

### Step 1: Connectorプラグインの準備

以下のいずれかの方法でKafka Connectorプラグインを取得できます:

**方法1: コンパイル済みパッケージを使用（推奨）**

コンパイル済みプラグインパッケージを[ここ](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からダウンロードして展開します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）:

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```
コンパイル後、`trino/plugin/trino-kafka/target/`の下に`trino-kafka-435/`ディレクトリが作成されます。

### ステップ2: プラグインのデプロイ

1. すべてのFEおよびBEデプロイパスの`connectors/`ディレクトリに`trino-kafka-435/`ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```
> また、`fe.conf`の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることもできます。例：`trino_connector_plugin_dir=/path/to/connectors/`

2. コネクタが適切にロードされるように、すべてのFEおよびBEノードを再起動してください。

### ステップ3：カタログの作成

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
### ステップ4: データのクエリ

カタログの作成後、3つの方法のいずれかを使用してKafka Topicデータをクエリできます：

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
## Schema Registry統合

Kafka CatalogはConfluent Schema Registryを通じた自動スキーマ取得をサポートしており、テーブル構造を手動で定義する必要がありません。

### Schema Registryの設定

**Basic認証**

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
### Schema Registryパラメータ

| パラメータ名 | 必須 | デフォルト | 説明 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.table-description-supplier` | いいえ | - | Schema Registryサポートを有効にするには`CONFLUENT`に設定 |
| `trino.kafka.confluent-schema-registry-url` | はい* | - | Schema Registryサービスアドレス |
| `trino.kafka.confluent-schema-registry-auth-type` | いいえ | NONE | 認証タイプ: NONE、BASIC_AUTH、BEARER |
| `trino.kafka.confluent-schema-registry.basic-auth.username` | いいえ | - | Basic Auth ユーザー名 |
| `trino.kafka.confluent-schema-registry.basic-auth.password` | いいえ | - | Basic Auth パスワード |
| `trino.kafka.confluent-schema-registry-subject-mapping` | いいえ | - | Subject名マッピング、形式: `<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>` |

:::tip
Schema Registryを使用する場合、DorisはSchema RegistryからTopicスキーマ情報を自動的に取得するため、テーブル構造を手動で作成する必要がありません。
:::

### Subjectマッピング

場合によっては、Schema Registryに登録されているSubject名がKafkaのTopic名と一致しない可能性があり、データクエリができなくなります。このような場合、`confluent-schema-registry-subject-mapping`を通じてマッピング関係を手動で指定する必要があります。

```sql
-- Map schema.topic to SCHEMA.topic Subject in Schema Registry
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```
`db1` と `tbl1` が Doris で表示される実際の Database と Table の名前で、`topic_name1` が Kafka の実際の Topic 名です（大文字小文字を区別します）。

複数のマッピングはカンマで区切ることができます：

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```
## Configuration

### Catalog Configuration Parameters

Kafka Catalogを作成するための基本的な構文は以下の通りです：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kafka',    -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```
#### TrinoProperties パラメータ

TrinoPropertiesは、`trino.`プレフィックスを持つTrino Kafka Connector固有のプロパティを設定するために使用されます。一般的なパラメータは以下の通りです：

| パラメータ名 | 必須 | デフォルト | 説明 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.nodes` | Yes | - | Kafka Brokerノードアドレスリスト、形式：`host1:port1,host2:port2` |
| `trino.kafka.table-names` | No | - | マッピングするTopicのリスト、形式：`schema.topic1,schema.topic2` |
| `trino.kafka.default-schema` | No | default | デフォルトスキーマ名 |
| `trino.kafka.hide-internal-columns` | No | true | Kafka内部カラム（`_partition_id`、`_partition_offset`など）を非表示にするかどうか |
| `trino.kafka.config.resources` | No | - | Kafkaクライアント設定ファイルのパス |
| `trino.kafka.table-description-supplier` | No | - | テーブル構造プロバイダ、Schema Registryを使用する場合は`CONFLUENT`に設定 |
| `trino.kafka.confluent-schema-registry-url` | No | - | Schema Registryサービスアドレス |

より多くのKafka Connector設定パラメータについては、[Trino Official Documentation](https://trino.io/docs/435/connector/kafka.html)を参照してください。

#### CommonProperties パラメータ

CommonPropertiesは、メタデータ更新ポリシーや権限制御などの一般的なカタログプロパティを設定するために使用されます。詳細情報については、[Catalog Overview](../catalog-overview.md)の「Common Properties」セクションを参照してください。

### Kafkaクライアント設定

高度なKafkaクライアントパラメータ（セキュリティ認証、SSLなど）を設定する必要がある場合は、設定ファイルを通じて指定できます。設定ファイル（例：`kafka-client.properties`）を作成してください：

```properties
# ============================================
# Kerberos/SASL Authentication Configuration
# ============================================
sasl.mechanism=GSSAPI
sasl.kerberos.service.name=kafka

# JAAS Configuration - Using keytab method
sasl.jaas.config=com.sun.security.auth.module.Krb5LoginModule required \
    useKeyTab=true \
    storeKey=true \
    useTicketCache=false \
    serviceName="kafka" \
    keyTab="/opt/trino/security/keytabs/kafka.keytab" \
    principal="kafka@EXAMPLE.COM";

# ============================================
# Avro Deserializer Configuration
# ============================================
key.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
value.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
```
カタログを作成する際に設定ファイルを指定します：

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

| Kafka/Avro Type | Trino Type | Doris Type | Notes |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | integer | int | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| bytes | varbinary | string | クエリには `HEX(col)` 関数を使用 |
| string | varchar | string | |
| array | array | array | |
| map | map | map | |
| record | row | struct | 複雑なネストされた構造 |
| enum | varchar | string | |
| fixed | varbinary | string | |
| null | - | - | |

:::tip
- `bytes`型の場合は、16進数形式で表示するために `HEX()` 関数を使用してください。
- Kafka Catalogでサポートされるデータ型は、使用されるシリアル化形式（JSON、Avro、Protobufなど）とSchema Registry設定に依存します。
:::

## Kafka内部カラム

Kafka Connectorは、Kafkaメッセージのメタデータ情報にアクセスするための内部カラムを提供します：

| Column Name | Type | Description |
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

デフォルトでは、これらの内部カラムは非表示です。これらのカラムをクエリする必要がある場合は、catalog作成時に以下を設定してください：

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

1. **読み取り専用アクセス**: Kafka Catalogはデータの読み取りのみをサポートし、書き込み操作（INSERT、UPDATE、DELETE）はサポートされません。

2. **テーブル名の設定**: Schema Registryを使用しない場合、`trino.kafka.table-names`パラメータを通じてアクセスするTopicのリストを明示的に指定する必要があります。

3. **スキーマ定義**:
   - Schema Registryを使用する場合、スキーマ情報はSchema Registryから自動的に取得されます。
   - Schema Registryを使用しない場合、テーブル定義を手動で作成するか、TrinoのTopic記述ファイルを使用する必要があります。

4. **データ形式**: サポートされるデータ形式は、Topicで使用されるシリアライゼーション方式（JSON、Avro、Protobufなど）に依存します。詳細については、[Trino Official Documentation](https://trino.io/docs/435/connector/kafka.html)を参照してください。

5. **パフォーマンスの考慮事項**:
   - Kafka CatalogはKafkaデータをリアルタイムで読み取るため、大量のデータをクエリするとパフォーマンスに影響する可能性があります。
   - スキャンするデータ量を制限するために、`LIMIT`句や時間フィルター条件の使用を推奨します。

## 機能のデバッグ

機能検証のためのKafka環境を迅速に構築するには、[here](https://github.com/morningman/demo-env/tree/main/kafka)を参照してください。

## 参考資料

- [Trino Kafka Connector Official Documentation](https://trino.io/docs/435/connector/kafka.html)
- [Trino Connector Development Guide](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)
- [Confluent Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/index.html)
