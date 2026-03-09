---
{
  "title": "Delta Lake カタログ",
  "language": "ja",
  "description": "Apache Doris Delta Lake Catalog ユーザーガイド：Trino Connector フレームワークを通じてDelta Lakeデータレイクに接続し、Delta Lakeテーブルデータのクエリと統合を行います。Hive Metastore、複数のデータ型マッピング、およびDelta LakeとDoris間の迅速な統合をサポートします。"
}
---
## 概要

Delta Lake Catalogは、Delta Lakeテーブルにアクセスするために、Trino Delta Lake Connectorと[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークを使用します。

:::note
- これは実験的機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスター環境に依存せず、Trino互換性プラグインのみを使用します。
:::

### 使用例

| シナリオ | サポート状況 |
| -------- | ------------ |
| データ統合 | Delta Lakeデータを読み取り、Doris内部テーブルに書き込み |
| データ書き戻し | サポートされていません |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **Delta Lakeバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

以下のいずれかの方法でDelta Lake Connectorプラグインを取得できます：

**方法1: プリコンパイル済みパッケージの使用（推奨）**

プリコンパイル済みの[trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz)と[hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz)をダウンロードして解凍します。

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
コンパイル後、`trino/plugin/trino-delta-lake/target/`の下に`trino-delta-lake-435`ディレクトリが、`trino/lib/trino-hdfs/target/`の下に`hdfs`ディレクトリが作成されます。

### ステップ2: プラグインのデプロイ

1. すべてのFEおよびBEデプロイメントパスの`connectors/`ディレクトリの下に`trino-delta-lake-435/`ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）:

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```
> `fe.conf`の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることもできます。例：`trino_connector_plugin_dir=/path/to/connectors/`

2. コネクタが正しく読み込まれるように、すべてのFEおよびBEノードを再起動してください。

### ステップ 3: Catalogの作成

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
**設定の説明**

- `trino.hive.metastore`: メタデータサービスタイプ、`thrift` (Hive Metastore) などをサポート
- `trino.hive.metastore.uri`: Hive Metastore サービスアドレス
- `trino.hive.config.resources`: Hadoop 設定ファイルパス、複数ファイルはカンマ区切り

その他の設定オプションについては、以下の「設定の説明」セクションまたは [Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html) を参照してください。

### ステップ 4: データのクエリ

Catalog 作成後、以下の3つの方法のいずれかを使用してDelta Lakeテーブルデータをクエリできます：

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

### Catalog設定パラメータ

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

TrinoPropertiesは、Trino Delta Lake Connector固有のプロパティを設定するために使用され、これらのプロパティには`trino.`のプレフィックスが付けられます。一般的なパラメータには以下があります：

| パラメータ名 | 必須 | デフォルト値 | 説明 |
| -------------- | -------- | ------------- | ----------- |
| `trino.hive.metastore` | はい | - | メタデータサービスタイプ（例：`thrift`） |
| `trino.hive.metastore.uri` | はい | - | Hive Metastoreサービスアドレス |
| `trino.hive.config.resources` | いいえ | - | Hadoop設定ファイルのパス、複数ファイルはカンマ区切り |
| `trino.delta.hide-non-delta-tables` | いいえ | false | 非Delta Lakeテーブルを非表示にするかどうか |

Delta Lake Connectorのその他の設定パラメータについては、[Trino公式ドキュメント](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

#### CommonPropertiesパラメータ

CommonPropertiesは、メタデータ更新ポリシー、権限制御など、Catalogの共通プロパティを設定するために使用されます。詳細については、[Catalog概要](../catalog-overview.md)の「共通プロパティ」セクションを参照してください。

## データタイプマッピング

Delta Lake Catalogを使用する際、データタイプは以下のルールに従ってマッピングされます：

| Delta Lakeタイプ | Trinoタイプ | Dorisタイプ | 備考 |
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
