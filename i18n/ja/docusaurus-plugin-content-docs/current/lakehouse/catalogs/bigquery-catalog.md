---
{
    "title": "BigQuery Catalog",
    "language": "ja",
    "description": "Apache Doris で BigQuery Catalog を設定し、Google BigQuery データウェアハウスに接続する方法を説明します。Trino Connector 互換フレームワークを使用して、BigQuery のテーブルデータのクエリ、データ統合、リアルタイム分析を行えます。Google Cloud の ADC 認証と、ARRAY、MAP、STRUCT などの複合型を含む各種データ型のマッピングをサポートします。インストール、デプロイ、設定パラメータ、使用例を通じて、BigQuery と Doris 間のデータ連携を説明します。"
}
---

## 概要

BigQuery Catalog は、[Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 互換フレームワークを通じて Trino BigQuery Connector を使用し、BigQuery のテーブルにアクセスします。

:::note
- この機能は実験的な機能で、バージョン 3.0.1 以降でサポートされています。
- この機能は Trino クラスター環境に依存せず、Trino 互換プラグインのみを使用します。
:::

### ユースケース

| シナリオ | 対応状況 |
| -------- | -------- |
| データ統合 | BigQuery のデータを読み取り、Doris の内部テーブルに書き込む |
| データの書き戻し | サポート対象外 |

### バージョンの互換性

- **Doris のバージョン**: 3.0.1 以降
- **Trino Connector のバージョン**: 435
- **BigQuery のバージョン**: サポート対象のバージョンについては、[Trino のドキュメント](https://trino.io/docs/435/connector/bigquery.html)を参照してください。

## クイックスタート

### ステップ 1: Connector プラグインを準備する

BigQuery Connector プラグインは、次のいずれかの方法で入手できます。

**方法 1: ビルド済みパッケージを使用する（推奨）**

[こちら](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からビルド済みのプラグインパッケージをダウンロードし、展開します。

**方法 2: 手動でビルドする**

カスタムビルドが必要な場合は、次の手順に従ってください（JDK 17 が必要です）。

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-bigquery
mvn clean install -DskipTests
```

ビルド後、`trino-bigquery-435/` ディレクトリが `trino/plugin/trino-bigquery/target/` に生成されます。

### ステップ 2: プラグインをデプロイする

1. すべての FE ノードと BE ノードで、`trino-bigquery-435/` ディレクトリをデプロイ先の `connectors/` ディレクトリに配置します（このディレクトリが存在しない場合は手動で作成します）。

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-bigquery-435
   ...
   ```

   > `trino_connector_plugin_dir` の設定を `fe.conf` で変更して、プラグインのパスを指定することもできます。例: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connector が正しく読み込まれるように、すべての FE ノードと BE ノードを再起動します。

### ステップ 3: Google Cloud 認証を準備する

Catalog を作成する前に、Google Cloud 認証を設定する必要があります。推奨される方法は Application Default Credentials（ADC）です。

1. gcloud CLI をインストールします: <https://cloud.google.com/sdk/docs/install>

2. 次のコマンドを実行して初期化と認証を行います。

    ```shell
    gcloud init --console-only --skip-diagnostics
    gcloud auth login
    gcloud auth application-default login
    ```

3. 認証に成功すると、ADC 認証情報ファイルが `~/.config/gcloud/application_default_credentials.json` に生成されます。

### ステップ 4: Catalog を作成する

**基本的な設定例**

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json'
);
```

### ステップ 5: データをクエリする

Catalog の作成後、次の三通りの方法で BigQuery のテーブルデータをクエリできます。

```sql
-- Method 1: Query after switching to Catalog
SWITCH bigquery_catalog;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 2: Use two-level path
USE bigquery_catalog.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM bigquery_catalog.bigquery_db.bigquery_tbl LIMIT 10;
```

## 設定

### Catalog の設定パラメータ

BigQuery Catalog を作成する基本構文は次のとおりです。

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',             -- Required, fixed value
    'trino.connector.name' = 'bigquery',    -- Required, fixed value
    {TrinoProperties},                      -- Trino Connector related properties
    {CommonProperties}                      -- Common properties
);
```

#### TrinoProperties パラメータ

TrinoProperties は、`trino.` で始まる Trino BigQuery Connector 固有のプロパティを設定するために使用します。主なパラメータは次のとおりです。

| パラメータ名 | 必須 | デフォルト値 | 説明 |
| ------------ | ---- | ------------ | ---- |
| `trino.bigquery.project-id` | はい | - | BigQuery のプロジェクト ID |
| `trino.bigquery.credentials-file` | はい | - | Google Cloud の認証情報ファイルのパス |
| `trino.bigquery.views-enabled` | いいえ | false | ビューのサポートを有効にするかどうか |
| `trino.bigquery.arrow-serialization.enabled` | いいえ | true | パフォーマンス向上のために Arrow シリアル化を有効にするかどうか |

BigQuery Connector のその他の設定パラメータについては、[Trino の公式ドキュメント](https://trino.io/docs/435/connector/bigquery.html)を参照してください。

#### CommonProperties パラメータ

CommonProperties は、メタデータの更新ポリシーやアクセス制御など、Catalog に共通するプロパティを設定するために使用します。詳しくは、[Catalog の概要](../catalog-overview.md)の「共通プロパティ」セクションを参照してください。

## データ型のマッピング

BigQuery Catalog を使用する場合、データ型は次の規則に従ってマッピングされます。

| BigQuery の型 | Trino の型 | Doris の型 |
| ------------ | ---------- | ---------- |
| boolean       | boolean                         | boolean       |
| int64         | bigint                          | bigint        |
| float64       | double                          | double        |
| numeric       | decimal(P, S)                   | decimal(P, S) |
| bignumeric    | decimal(P, S)                   | decimal(P, S) |
| string        | varchar                         | string        |
| bytes         | varbinary                       | string        |
| date          | date                            | date          |
| datetime      | timestamp(6)                    | datetime(6)   |
| time          | time(6)                         | string        |
| timestamp     | timestamp with time zone(6)     | datetime(6)   |
| geography     | varchar                         | string        |
| array         | array                           | array         |
| map           | map                             | map           |
| struct        | row                             | struct        |
