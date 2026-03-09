---
{
  "title": "Delta Lake Catalog",
  "language": "ja",
  "description": "Apache Doris Delta Lake カタログユーザーガイド：Trino Connector フレームワークを通じて Delta Lake データレイクに接続し、Delta Lake テーブルデータをクエリおよび統合します。Hive Metastore、複数のデータ型マッピング、および Delta Lake と Doris 間の迅速な統合をサポートします。"
}
---
## 概要

Delta Lake Catalogは[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークとTrino Delta Lake Connectorを使用してDelta Lakeテーブルにアクセスします。

:::note
- これは実験的な機能で、バージョン3.0.1からサポートされています。
- この機能はTrinoクラスター環境に依存せず、Trino互換性プラグインのみを使用します。
:::

### ユースケース

| シナリオ | サポート状況 |
| -------- | -------------- |
| データ統合 | Delta Lakeデータを読み取り、Doris内部テーブルに書き込み |
| データ書き戻し | サポートされていません |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **Delta Lakeバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

以下のいずれかの方法でDelta Lake Connectorプラグインを入手できます：

**方法1: プリコンパイル済みパッケージを使用（推奨）**

プリコンパイル済みの[trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz)と[hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz)をダウンロードして展開します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）：

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

1. すべてのFEおよびBEデプロイメントパスの`connectors/`ディレクトリ配下に`trino-delta-lake-435/`ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）：

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

2. コネクターが正しく読み込まれるように、すべてのFEおよびBEノードを再起動してください。

### ステップ3：カタログの作成

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
- `trino.hive.config.resources`: Hadoop設定ファイルパス、複数ファイルはカンマで区切る

その他の設定オプションについては、下記の「設定項目説明」セクションまたは[Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

### ステップ4: データクエリ

Catalogを作成した後、以下の3つの方法のいずれかを使用してDelta Lakeテーブルデータをクエリできます:

```sql
-- Method 1: Switch to Catalog then query
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

Delta Lake Catalogを作成するための基本構文は以下の通りです：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- Required, fixed value
    'trino.connector.name' = 'delta_lake', -- Required, fixed value
    {TrinoProperties},                     -- Trino Connector related properties
    {CommonProperties}                     -- Common properties
);
```
#### TrinoPropertiesパラメータ

TrinoPropertiesは、Trino Delta Lake Connector固有のプロパティを設定するために使用され、これらのプロパティには`trino.`のプレフィックスが付きます。一般的なパラメータには以下があります：

| パラメータ名 | 必須 | デフォルト値 | 説明 |
| ------------ | ---- | ------------ | ---- |
| `trino.hive.metastore` | Yes | - | メタデータサービスタイプ、`thrift`など |
| `trino.hive.metastore.uri` | Yes | - | Hive Metastoreサービスアドレス |
| `trino.hive.config.resources` | No | - | Hadoop設定ファイルパス、複数ファイルはカンマで区切る |
| `trino.delta.hide-non-delta-tables` | No | false | 非Delta Lakeテーブルを非表示にするかどうか |

さらなるDelta Lake Connector設定パラメータについては、[Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

#### CommonPropertiesパラメータ

CommonPropertiesは、メタデータリフレッシュポリシー、権限制御などの共通のCatalogプロパティを設定するために使用されます。詳細については、[Catalog Overview](../catalog-overview.md)の「Common Properties」セクションを参照してください。

## データ型マッピング

Delta Lake Catalogを使用する際、データ型は以下のルールに従ってマッピングされます：

| Delta Lake Type | Trino Type | Doris Type | Notes |
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
