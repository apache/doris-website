---
{
  "title": "Delta Lake カタログ",
  "language": "ja",
  "description": "Apache Doris Delta Lake カタログユーザーガイド: Trino Connector フレームワークを通じて Delta Lake データレイクに接続し、Delta Lake テーブルデータのクエリと統合を行います。Hive Metastore、複数のデータ型マッピング、および Delta Lake と Doris 間の迅速な統合をサポートします。"
}
---
## 概要

Delta Lake Catalog は [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/) 互換性フレームワークと Trino Delta Lake Connector を使用して Delta Lake テーブルにアクセスします。

:::note
- これは実験的機能で、バージョン 3.0.1 以降でサポートされています。
- この機能は Trino クラスター環境に依存せず、Trino 互換性プラグインのみを使用します。
:::

### 使用ケース

| シナリオ | サポート状況 |
| -------- | -------------- |
| データ統合 | Delta Lake データを読み取り、Doris 内部テーブルに書き込み |
| データライトバック | サポートされていません |

### バージョン互換性

- **Doris バージョン**: 3.0.1 以上
- **Trino Connector バージョン**: 435
- **Delta Lake バージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/delta-lake.html) を参照してください

## クイックスタート

### ステップ 1: Connector プラグインの準備

以下のいずれかの方法で Delta Lake Connector プラグインを入手できます：

**方法 1: プリコンパイル済みパッケージを使用（推奨）**

プリコンパイル済みの [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) と [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz) をダウンロードし、展開します。

**方法 2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17 が必要）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-delta-lake/target/`以下に`trino-delta-lake-435`ディレクトリ、および`trino/lib/trino-hdfs/target/`以下に`hdfs`ディレクトリが作成されます。

### ステップ2: プラグインのデプロイ

1. すべてのFEとBEのデプロイパスの`connectors/`ディレクトリ以下に`trino-delta-lake-435/`ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）：

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

2. コネクターが正しく読み込まれるよう、すべてのFEおよびBEノードを再起動してください。

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
**設定の説明**

- `trino.hive.metastore`: メタデータサービスタイプ、`thrift` (Hive Metastore) などをサポート
- `trino.hive.metastore.uri`: Hive Metastoreサービスアドレス
- `trino.hive.config.resources`: Hadoop設定ファイルパス、複数ファイルはカンマで区切る

その他の設定オプションについては、以下の「設定の説明」セクションまたは[Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

### ステップ4: データのクエリ

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
| `trino.hive.metastore` | Yes | - | メタデータサービスタイプ、例：`thrift` |
| `trino.hive.metastore.uri` | Yes | - | Hive Metastoreサービスアドレス |
| `trino.hive.config.resources` | No | - | Hadoop設定ファイルパス、複数ファイルはカンマ区切り |
| `trino.delta.hide-non-delta-tables` | No | false | 非Delta Lakeテーブルを非表示にするかどうか |

その他のDelta Lake Connector設定パラメータについては、[Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

#### CommonProperties パラメータ

CommonPropertiesは、メタデータ更新ポリシーや権限制御など、共通のCatalogプロパティを設定するために使用されます。詳細については、[Catalog Overview](../catalog-overview.md)の「Common Properties」セクションを参照してください。

## データ型マッピング

Delta Lake Catalogを使用する際、データ型は以下のルールに従ってマッピングされます：

| Delta Lake Type | Trino Type | Doris Type | 備考 |
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
