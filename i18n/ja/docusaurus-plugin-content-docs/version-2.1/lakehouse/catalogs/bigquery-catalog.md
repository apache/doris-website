---
{
  "title": "BigQuery カタログ",
  "language": "ja",
  "description": "BigQuery CatalogはTrino Connector互換性フレームワークを使用して、BigQuery Connectorを通じてBigQueryテーブルにアクセスします。"
}
---
BigQuery CatalogはBigQueryテーブルにBigQuery Connectorを通じてアクセスするために[Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークを使用します。

:::note
この機能は実験的であり、バージョン3.0.1以降でサポートされています。
:::

## 適用シナリオ

| シナリオ       | 説明                          |
| -------------- | ------------------------------------ |
| データ統合 | BigQueryデータを読み取り、Doris内部テーブルに書き込みます。 |
| データライトバック  | サポートされていません。                     |

## 環境準備

### BigQuery Connector Pluginのコンパイル

> JDK 17が必要です。

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-bigquery
$ mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-bigquery/target/` ディレクトリに `trino-bigquery-435` フォルダが含まれます。

また、プリコンパイルされた [trino-bigquery-435-20240724.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-bigquery-435-20240724.tar.gz) を直接ダウンロードして展開することもできます。

### BigQuery Connectorのデプロイ

`trino-bigquery-435/` ディレクトリを、すべてのFEおよびBEノードのデプロイメントパスの `connectors/` ディレクトリに配置してください。（ディレクトリが存在しない場合は、手動で作成することができます。）

```text
├── bin
├── conf
├── connectors
│   ├── trino-bigquery-435
...
```
デプロイ後、Connectorが正しく読み込まれることを確実にするため、FEおよびBEノードを再起動することを推奨します。

## Catalogの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'bigquery', -- required
    {TrinoProperties},
    {CommonProperties}
);
```
* `{TrinoProperties}`

  TrinoPropertiesセクションは、Trino Connectorに渡されるプロパティを指定するために使用されます。これらのプロパティは`trino.`プレフィックスを使用します。理論的には、Trinoでサポートされているすべてのプロパティがここでもサポートされます。BigQueryについての詳細は、[Trino documentation](https://trino.io/docs/435/connector/bigquery.html)を参照してください。

* `[CommonProperties]`

  CommonPropertiesセクションは、一般的なプロパティを指定するために使用されます。「Common Properties」セクションの[Catalog Overview](../catalog-overview.md)を参照してください。
  
### サポートされているBigQueryバージョン

BigQueryプロパティについての詳細は、[Trino documentation](https://trino.io/docs/current/connector/bigquery.html)を参照してください。

## カラムタイプマッピング

| BigQuery Type | Trino Type                  | Doris Type    |
| ------------- | --------------------------- | ------------- |
| boolean       | boolean                     | boolean       |
| int64         | bigint                      | bigint        |
| float64       | double                      | double        |
| numeric       | decimal(P, S)               | decimal(P, S) |
| bignumric     | decimal(P, S)               | decimal(P, S) |
| string        | varchar                     | string        |
| bytes         | varbinary                   | string        |
| date          | date                        | date          |
| datetime      | timestamp(6)                | datetime(6)   |
| time          | time(6)                     | string        |
| timestamp     | timestamp with time zone(6) | datetime(6)   |
| geography     | varchar                     | string        |
| array         | array                       | array         |
| map           | map                         | map           |
| struct        | row                         | struct        |

## 例

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json',
);
```
## クエリ操作

Catalogを設定した後、以下の方法を使用してCatalog内のテーブルデータをクエリできます：

```sql
-- 1. switch to catalog, use database and query
SWITCH bigquery_ctl;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 2. use bigquery database directly
USE bigquery_ctl.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM bigquery_ctl.bigquery_db.bigquery_tbl LIMIT 10;
```
