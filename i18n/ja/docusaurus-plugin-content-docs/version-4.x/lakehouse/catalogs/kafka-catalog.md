---
{
    "title": "Kafka Catalog",
    "language": "ja",
    "description": "Apache Doris Kafka Catalog のガイド。Trino Connector フレームワークを通じて Kafka のデータストリームに接続し、Kafka Topic のデータをクエリ・統合する方法を説明します。Schema Registry と複数のデータ形式に対応し、Kafka と Doris のデータをすばやく統合できます。"
}
---

## 概要

Kafka Catalog は、[Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 互換フレームワークを通じて Trino Kafka Connector を使用し、Kafka Topic のデータにアクセスします。

:::note
- この機能は実験的な機能で、バージョン 3.0.1 以降でサポートされています。
- この機能に Trino クラスター環境は不要です。Trino 互換プラグインのみを使用します。
:::

### ユースケース

| シナリオ | 対応状況 |
| -------- | -------------- |
| データ統合 | Kafka Topic のデータを読み取り、Doris の内部テーブルに書き込む |
| データの書き戻し | サポートされていません |

### バージョンの互換性

- **Doris のバージョン**: 3.0.1 以降
- **Trino Connector のバージョン**: 435
- **Kafka のバージョン**: サポートされるバージョンについては、[Trino のドキュメント](https://trino.io/docs/435/connector/kafka.html)を参照してください

## クイックスタート

### ステップ 1: Connector プラグインを準備する

Kafka Connector プラグインは、次のいずれかの方法で入手できます。

**方法 1: ビルド済みパッケージを使用する（推奨）**

[こちら](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からビルド済みのプラグインパッケージをダウンロードし、展開します。

**方法 2: 手動でビルドする**

独自にビルドする必要がある場合は、次の手順に従ってください（JDK 17 が必要です）。

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```

ビルド後、`trino-kafka-435/` ディレクトリが `trino/plugin/trino-kafka/target/` の下に作成されます。

### ステップ 2: プラグインを配置する

1. `trino-kafka-435/` ディレクトリを、すべての FE と BE のデプロイ先にある `connectors/` ディレクトリに配置します（存在しない場合は手動で作成します）。

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```

   > `trino_connector_plugin_dir` の設定を `fe.conf` で変更して、プラグインのパスを指定することもできます。例: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connector が正しく読み込まれるように、すべての FE と BE ノードを再起動します。

### ステップ 3: Catalog を作成する

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

**設定ファイルを使用する**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**デフォルトのスキーマを設定する**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.default-schema' = 'default_db',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### ステップ 4: データをクエリする

Catalog を作成したら、次の三つの方法のいずれかで Kafka Topic のデータをクエリできます。

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

## Schema Registry との連携

Kafka Catalog は Confluent Schema Registry からのスキーマ自動取得に対応しているため、テーブル構造を手動で定義する必要がありません。

### Schema Registry を設定する

**基本認証**

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

### Schema Registry のパラメーター

| パラメーター名 | 必須 | デフォルト | 説明 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.table-description-supplier` | いいえ | - | Schema Registry を有効にするには `CONFLUENT` を指定します |
| `trino.kafka.confluent-schema-registry-url` | はい* | - | Schema Registry サービスのアドレス |
| `trino.kafka.confluent-schema-registry-auth-type` | いいえ | NONE | 認証方式: NONE、BASIC_AUTH、BEARER |
| `trino.kafka.confluent-schema-registry.basic-auth.username` | いいえ | - | Basic Auth のユーザー名 |
| `trino.kafka.confluent-schema-registry.basic-auth.password` | いいえ | - | Basic Auth のパスワード |
| `trino.kafka.confluent-schema-registry-subject-mapping` | いいえ | - | Subject 名のマッピング。形式: `<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>` |

:::tip
Schema Registry を使用すると、Doris が Topic のスキーマ情報を Schema Registry から自動的に取得するため、テーブル構造を手動で作成する必要がありません。
:::

### Subject のマッピング

Schema Registry に登録された Subject 名が Kafka の Topic 名と一致せず、データをクエリできない場合があります。その場合は、`confluent-schema-registry-subject-mapping` を使用してマッピングを手動で指定する必要があります。

```sql
-- Map schema.topic to SCHEMA.topic Subject in Schema Registry
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```

ここで、`db1` と `tbl1` は Doris から見える実際の Database 名と Table 名、`topic_name1` は Kafka の実際の Topic 名です（大文字と小文字が区別されます）。

複数のマッピングはカンマで区切ります。

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```

## 設定

### Catalog の設定パラメーター

Kafka Catalog を作成する基本的な構文は次のとおりです。

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kafka',    -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### TrinoProperties パラメーター

TrinoProperties は、`trino.` プレフィックスが付く Trino Kafka Connector 固有のプロパティーを設定するために使用します。主なパラメーターは次のとおりです。

| パラメーター名 | 必須 | デフォルト | 説明 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.nodes` | はい | - | Kafka Broker ノードのアドレス一覧。形式: `host1:port1,host2:port2` |
| `trino.kafka.table-names` | いいえ | - | マッピングする Topic の一覧。形式: `schema.topic1,schema.topic2` |
| `trino.kafka.default-schema` | いいえ | default | デフォルトのスキーマ名 |
| `trino.kafka.hide-internal-columns` | いいえ | true | Kafka の内部カラム（`_partition_id`、`_partition_offset` など）を非表示にするかどうか |
| `trino.kafka.config.resources` | いいえ | - | Kafka クライアントの設定ファイルのパス |
| `trino.kafka.table-description-supplier` | いいえ | - | テーブル構造の取得元。Schema Registry を使用するには `CONFLUENT` を指定します |
| `trino.kafka.confluent-schema-registry-url` | いいえ | - | Schema Registry サービスのアドレス |

Kafka Connector のその他の設定パラメーターについては、[Trino の公式ドキュメント](https://trino.io/docs/435/connector/kafka.html)を参照してください。

#### CommonProperties パラメーター

CommonProperties は、メタデータの更新ポリシーや権限制御など、Catalog に共通するプロパティーの設定に使用します。詳細は、[Catalog の概要](../catalog-overview.md)の「共通プロパティー」セクションを参照してください。

### Kafka クライアントの設定

セキュリティー認証や SSL など、Kafka クライアントの詳細なパラメーターを設定する必要がある場合は、設定ファイルで指定できます。設定ファイル（例: `kafka-client.properties`）を作成します。

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

次に、Catalog の作成時に設定ファイルを指定します。

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties'
);
```

## データ型のマッピング

Kafka Catalog を使用する際、データ型は次の規則に従ってマッピングされます。

| Kafka/Avro の型 | Trino の型 | Doris の型 | 備考 |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | integer | int | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| bytes | varbinary | string | `HEX(col)` 関数を使用してクエリします |
| string | varchar | string | |
| array | array | array | |
| map | map | map | |
| record | row | struct | 複雑なネスト構造 |
| enum | varchar | string | |
| fixed | varbinary | string | |
| null | - | - | |

:::tip
- `bytes` 型を十六進数形式で表示するには、`HEX()` 関数を使用します。
- Kafka Catalog でサポートされるデータ型は、使用するシリアライズ形式（JSON、Avro、Protobuf など）と Schema Registry の設定によって異なります。
:::

## Kafka の内部カラム

Kafka Connector は、Kafka メッセージのメタデータにアクセスするための内部カラムを提供します。

| カラム名 | 型 | 説明 |
| ----------- | ---- | ----------- |
| `_partition_id` | bigint | メッセージが属するパーティションの ID |
| `_partition_offset` | bigint | パーティション内のメッセージのオフセット |
| `_message_timestamp` | timestamp | メッセージのタイムスタンプ |
| `_key` | varchar | メッセージのキー |
| `_key_corrupt` | boolean | キーが破損しているかどうか |
| `_key_length` | bigint | キーのバイト長 |
| `_message` | varchar | メッセージの生データ |
| `_message_corrupt` | boolean | メッセージが破損しているかどうか |
| `_message_length` | bigint | メッセージのバイト長 |
| `_headers` | map | メッセージのヘッダー情報 |

デフォルトでは、これらの内部カラムは非表示です。クエリする必要がある場合は、Catalog の作成時に次のように設定します。

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

1. **読み取り専用アクセス**: Kafka Catalog はデータの読み取りのみをサポートします。書き込み操作（INSERT、UPDATE、DELETE）はサポートされていません。

2. **テーブル名の設定**: Schema Registry を使用しない場合は、`trino.kafka.table-names` パラメーターでアクセスする Topic の一覧を明示的に指定する必要があります。

3. **スキーマ定義**:
   - Schema Registry を使用する場合、スキーマ情報は Schema Registry から自動的に取得されます。
   - Schema Registry を使用しない場合、テーブル定義を手動で作成するか、Trino の Topic 記述ファイルを使用する必要があります。

4. **データ形式**: サポートされるデータ形式は、Topic で使用されるシリアライズ方式（JSON、Avro、Protobuf など）によって異なります。詳細は、[Trino の公式ドキュメント](https://trino.io/docs/435/connector/kafka.html)を参照してください。

5. **パフォーマンス上の注意**:
   - Kafka Catalog は Kafka のデータをリアルタイムで読み取るため、大量のデータをクエリするとパフォーマンスに影響する場合があります。
   - スキャンするデータ量を抑えるために、`LIMIT` 句や時間で絞り込む条件を使用することを推奨します。

## 機能のデバッグ

機能の検証用に Kafka 環境をすばやく構築するには、[こちら](https://github.com/morningman/demo-env/tree/main/kafka)を参照してください。

## 参考資料

- [Trino Kafka Connector の公式ドキュメント](https://trino.io/docs/435/connector/kafka.html)
- [Trino Connector 開発ガイド](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/)
- [Confluent Schema Registry のドキュメント](https://docs.confluent.io/platform/current/schema-registry/index.html)
