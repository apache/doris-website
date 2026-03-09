---
{
  "title": "BigQuery カタログ",
  "language": "ja",
  "description": "Apache DorisでBigQuery Catalogを設定・使用してGoogle BigQueryデータウェアハウスに接続する方法を学習します。Trino Connectorフレームワークを通じてBigQueryテーブルデータのクエリ、データ統合、リアルタイム分析を実装します。Google Cloud ADC認証と様々なデータ型マッピング（ARRAY、MAP、STRUCTなどの複合型を含む）をサポートします。BigQueryとDoris間のデータ相互運用性を迅速に実現するための完全なインストール、デプロイメント、設定パラメータ、および使用例を提供します。"
}
---
## 概要

BigQuery Catalogは、[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークを通じてBigQueryテーブルにアクセスするためにTrino BigQuery Connectorを使用します。

:::note
- この機能は実験的機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスタ環境に依存せず、Trino互換性プラグインのみを使用します。
:::

### ユースケース

| シナリオ | サポート状況 |
| ---------------- | ------------------------------------------------- |
| データ統合 | BigQueryデータを読み取り、Doris内部テーブルに書き込み |
| データ書き戻し | サポートされていません |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **BigQueryバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/bigquery.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

BigQuery Connectorプラグインを取得するには、以下のいずれかの方法を選択できます：

**方法1: プリコンパイル済みパッケージの使用（推奨）**

[こちら](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からプリコンパイル済みプラグインパッケージを直接ダウンロードして展開します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-bigquery
mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-bigquery/target/`の下に`trino-bigquery-435/`ディレクトリが作成されます。

### ステップ2: プラグインのデプロイ

1. すべてのFEおよびBEノードのデプロイパス下の`connectors/`ディレクトリに`trino-bigquery-435/`ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-bigquery-435
   ...
   ```
> `fe.conf`の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることも可能です。例: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connectorが適切に読み込まれるように、すべてのFEおよびBEノードを再起動します。

### ステップ3: Google Cloud認証の準備

Catalogを作成する前に、Google Cloud認証を設定する必要があります。推奨される方法はApplication Default Credentials (ADC)です:

1. gcloud CLIをインストールします: <https://cloud.google.com/sdk/docs/install>

2. 初期化と認証のために以下のコマンドを実行します:

    ```shell
    gcloud init --console-only --skip-diagnostics
    gcloud auth login
    gcloud auth application-default login
    ```
3. 認証が成功すると、ADC認証情報ファイルが`~/.config/gcloud/application_default_credentials.json`に生成されます。

### ステップ4: Catalogの作成

**基本設定例**

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json'
);
```
### ステップ5: データのクエリ

Catalogを作成した後、BigQueryテーブルデータを3つの方法でクエリできます:

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

### カタログ設定パラメータ

BigQuery Catalogを作成するための基本的な構文は以下の通りです：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',             -- Required, fixed value
    'trino.connector.name' = 'bigquery',    -- Required, fixed value
    {TrinoProperties},                      -- Trino Connector related properties
    {CommonProperties}                      -- Common properties
);
```
#### TrinoProperties パラメータ

TrinoPropertiesは、`trino.`プレフィックスが付いたTrino BigQuery Connector固有のプロパティを設定するために使用されます。一般的なパラメータは以下の通りです：

| パラメータ名                        | 必須 | デフォルト | 説明                                    |
| ------------------------------------- | -------- | ------- | ---------------------------------------------- |
| `trino.bigquery.project-id`           | Yes      | -       | BigQueryプロジェクトID                            |
| `trino.bigquery.credentials-file`     | Yes      | -       | Google Cloud認証情報ファイルパス             |
| `trino.bigquery.views-enabled`        | No       | false   | ビューサポートを有効にするかどうか                 |
| `trino.bigquery.arrow-serialization.enabled` | No       | true    | パフォーマンス向上のためArrowシリアライゼーションを有効にするかどうか |

その他のBigQuery Connector設定パラメータについては、[Trino Official Documentation](https://trino.io/docs/435/connector/bigquery.html)を参照してください。

#### CommonProperties パラメータ

CommonPropertiesは、メタデータ更新ポリシーやアクセス制御などの共通Catalogプロパティを設定するために使用されます。詳細な情報については、[Catalog Overview](../catalog-overview.md)の「Common Properties」セクションを参照してください。

## データ型マッピング

BigQuery Catalogを使用する際、データ型は以下のルールに従ってマッピングされます：

| BigQuery Type | Trino Type                      | Doris Type    |
| ------------- | ------------------------------- | ------------- |
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
