---
{
  "title": "Delta Lake カタログ",
  "description": "Apache Doris Delta Lake カタログ ユーザーガイド：Trino Connector フレームワークを通じて Delta Lake データレイクに接続し、Delta Lake tableデータのクエリと統合を行います。Hive Metastore、複数のデータ型マッピング、および Delta Lake と Doris 間の迅速な統合をサポートしています。",
  "language": "ja"
}
---
## 概要

Delta Lake カタログは、Delta LakeTableにアクセスするために、Trino Delta Lake Connectorと[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークを使用します。

:::note
- これは実験的機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスター環境に依存せず、Trino互換性プラグインのみを使用します。
:::

### ユースケース

| シナリオ | サポート状況 |
| -------- | -------------- |
| データ統合 | Delta Lakeデータを読み取り、Doris内部tableに書き込み |
| データ書き戻し | サポートされていません |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **Delta Lakeバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

以下のいずれかの方法でDelta Lake Connectorプラグインを取得できます。

**方法1: プリコンパイル済みパッケージの使用（推奨）**

プリコンパイル済みの[trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz)と[hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz)をダウンロードして解凍します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）:

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-delta-lake/target/`配下に`trino-delta-lake-435`ディレクトリが、`trino/lib/trino-hdfs/target/`配下に`hdfs`ディレクトリが生成されます。

### ステップ2: プラグインのデプロイ

1. すべてのFEとBEのデプロイパス配下の`connectors/`ディレクトリに`trino-delta-lake-435/`ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```
> `fe.conf`内の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることもできます。例：`trino_connector_plugin_dir=/path/to/connectors/`

2. コネクタが正しく読み込まれることを確実にするため、すべてのFEおよびBEノードを再起動してください。

### ステップ 3: カタログの作成

**基本設定**

```sql
CREATE CATALOG delta_lake_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri' = 'thrift://ip:port',
    'trino.hive.config.resources' = '/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```
**設定項目説明**

- `trino.hive.metastore`: メタデータサービスタイプ、`thrift` (Hive Metastore) などをサポート
- `trino.hive.metastore.uri`: Hive Metastoreサービスアドレス
- `trino.hive.config.resources`: Hadoop設定ファイルパス、複数のファイルはカンマで区切る

その他の設定オプションについては、以下の「設定項目説明」セクションまたは[Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

### ステップ 4: データクエリ

Catalogを作成した後、以下の3つの方法のいずれかを使用してDelta LakeTableデータをクエリできます：

```sql
-- Method 1: Switch to カタログ then query
SWITCH delta_lake_catalog;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 2: Use two-level path
USE delta_lake_catalog.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM delta_lake_catalog.delta_lake_db.delta_lake_tbl LIMIT 10;
```
## 設定の説明

### カタログ設定パラメータ

Delta Lake Catalogを作成するための基本的な構文は以下の通りです：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- Required, fixed value
    'trino.connector.name' = 'delta_lake', -- Required, fixed value
    {TrinoProperties},                     -- Trino Connector related properties
    {CommonProperties}                     -- Common properties
);
```
#### TrinoProperties パラメータ

TrinoPropertiesは、Trino Delta Lake Connector固有のプロパティを設定するために使用され、これらのプロパティには`trino.`のプレフィックスが付きます。一般的なパラメータには以下があります：

| パラメータ名 | 必須 | デフォルト値 | 説明 |
| -------------- | -------- | ------------- | ----------- |
| `trino.hive.metastore` | はい | - | メタデータサービスタイプ、例：`thrift` |
| `trino.hive.metastore.uri` | はい | - | Hive Metastoreサービスアドレス |
| `trino.hive.config.resources` | いいえ | - | Hadoop設定ファイルパス、複数ファイルはカンマ区切り |
| `trino.delta.hide-non-delta-tables` | いいえ | false | Delta Lake以外のTableを非表示にするかどうか |

Delta Lake Connectorの設定パラメータの詳細については、[Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

#### CommonProperties パラメータ

CommonPropertiesは、メタデータの更新ポリシーや権限制御などの一般的なCatalogプロパティを設定するために使用されます。詳細については、[カタログ 概要](../catalog-overview.md)の「Common Properties」セクションを参照してください。

## データ型マッピング

Delta Lake Catalogを使用する場合、データ型は以下のルールに従ってマッピングされます：

| Delta Lake タイプ | Trino タイプ | Doris タイプ | 備考 |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | int | int | |
| byte | tinyint | tinyint | |
| short | smallint | smallint | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| decimal(P, S) | decimal(P, S) | decimal(P, S) | |
| string | varchar | string | |
| binary | varbinary | string | |
| date | date | date | |
| timestamp_ntz | timestamp(N) | datetime(N) | |
| timestamp | timestamp with time zone(N) | datetime(N) | |
| array | array | array | |
| map | map | map | |
| struct | row | struct | |
