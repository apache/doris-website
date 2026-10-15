---
{
    "title": "Delta Lake Catalog",
    "language": "ja",
    "description": "Apache Doris Delta Lake Catalog ユーザーガイド。Trino Connector フレームワークを通じて Delta Lake データレイクに接続し、Delta Lake テーブルのデータをクエリして連携する方法を説明します。Hive Metastore、複数のデータ型のマッピング、および Delta Lake と Doris の迅速な連携をサポートします。"
}
---

## 概要

Delta Lake Catalog は、[Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 互換フレームワークと Trino Delta Lake Connector を使用して、Delta Lake テーブルにアクセスします。

:::note
- この機能は実験的な機能で、バージョン 3.0.1 以降でサポートされています。
- この機能に Trino クラスター環境は不要です。Trino 互換プラグインのみを使用します。
:::

### ユースケース

| シナリオ | サポート状況 |
| -------- | -------------- |
| データ連携 | Delta Lake のデータを読み取り、Doris の内部テーブルに書き込む |
| データの書き戻し | サポートされていません |

### バージョンの互換性

- **Doris のバージョン**: 3.0.1 以降
- **Trino Connector のバージョン**: 435
- **Delta Lake のバージョン**: サポートされるバージョンについては、[Trino のドキュメント](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

## クイックスタート

### ステップ 1: Connector プラグインを準備する

Delta Lake Connector プラグインは、次のいずれかの方法で入手できます。

**方法 1: ビルド済みパッケージを使用する（推奨）**

ビルド済みの [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) と [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz) をダウンロードし、展開します。

**方法 2: 手動でビルドする**

独自にビルドする必要がある場合は、次の手順に従ってください（JDK 17 が必要です）。

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```

ビルド後、`trino-delta-lake-435` ディレクトリが `trino/plugin/trino-delta-lake/target/` の下に、`hdfs` ディレクトリが `trino/lib/trino-hdfs/target/` の下に作成されます。

### ステップ 2: プラグインを配置する

1. すべての FE および BE のデプロイ先で、`trino-delta-lake-435/` ディレクトリを `connectors/` ディレクトリの下に配置します（ディレクトリが存在しない場合は手動で作成します）。

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```

   > `trino_connector_plugin_dir` 設定（`fe.conf` 内）を変更して、プラグインのパスをカスタマイズすることもできます。例: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connector が正しく読み込まれるように、すべての FE および BE ノードを再起動します。

### ステップ 3: Catalog を作成する

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

**設定項目の説明**

- `trino.hive.metastore`: メタデータサービスの種類。`thrift`（Hive Metastore）などをサポートします。
- `trino.hive.metastore.uri`: Hive Metastore サービスのアドレス。
- `trino.hive.config.resources`: Hadoop 設定ファイルのパス。複数のファイルはカンマで区切ります。

その他の設定項目については、以下の「設定項目の説明」セクションまたは [Trino の公式ドキュメント](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

### ステップ 4: データをクエリする

Catalog の作成後、次の三つの方法のいずれかで Delta Lake テーブルのデータをクエリできます。

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

## 設定項目の説明

### Catalog の設定パラメータ

Delta Lake Catalog を作成する基本構文は次のとおりです。

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- Required, fixed value
    'trino.connector.name' = 'delta_lake', -- Required, fixed value
    {TrinoProperties},                     -- Trino Connector related properties
    {CommonProperties}                     -- Common properties
);
```

#### TrinoProperties パラメータ

TrinoProperties は Trino Delta Lake Connector 固有のプロパティの設定に使用します。これらのプロパティには `trino.` というプレフィックスが付きます。主なパラメータは次のとおりです。

| パラメータ名 | 必須 | デフォルト値 | 説明 |
| -------------- | -------- | ------------- | ----------- |
| `trino.hive.metastore` | はい | - | メタデータサービスの種類。`thrift` など |
| `trino.hive.metastore.uri` | はい | - | Hive Metastore サービスのアドレス |
| `trino.hive.config.resources` | いいえ | - | Hadoop 設定ファイルのパス。複数のファイルはカンマで区切ります |
| `trino.delta.hide-non-delta-tables` | いいえ | false | Delta Lake 以外のテーブルを非表示にするかどうか |

その他の Delta Lake Connector の設定パラメータについては、[Trino の公式ドキュメント](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

#### CommonProperties パラメータ

CommonProperties は、メタデータの更新ポリシーや権限制御など、Catalog に共通するプロパティの設定に使用します。詳しくは、[Catalog の概要](../catalog-overview.md)の「共通プロパティ」セクションを参照してください。

## データ型のマッピング

Delta Lake Catalog を使用する場合、データ型は次の規則に従ってマッピングされます。

| Delta Lake の型 | Trino の型 | Doris の型 | 備考 |
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
