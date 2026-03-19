---
{
  "title": "Delta Lake カタログ",
  "language": "ja",
  "description": "Delta Lake カタログはTrino Connector互換性フレームワークを使用して、Delta Lake Connectorを通じてDelta Lakeテーブルにアクセスします。"
}
---
Delta Lake カタログは[Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークを使用して、Delta Lake Connectorを通じてDelta Lakeテーブルにアクセスします。

:::note
この機能は実験的であり、バージョン3.0.1以降でサポートされています。
:::

## 適用シナリオ

| シナリオ       | 説明                          |
| -------------- | ------------------------------------ |
| データ統合 | Delta Lakeデータを読み込み、Doris内部テーブルに書き込みます。 |
| データライトバック  | サポートされていません。                     |

## 環境準備

### Delta Lake Connectorプラグインのコンパイル

> JDK 17が必要です。

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-delta-lake
$ mvn clean install -DskipTests
$ cd ../../lib/trino-hdfs
$ mvn clean install -DskipTests
```
コンパイル後、`trino/plugin/trino-delta-lake/target/`の下に`trino-delta-lake-435`ディレクトリが、`trino/lib/trino-hdfs/target/`の下に`hdfs`ディレクトリが見つかります。

また、事前にコンパイルされた[trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz)と[hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz)を直接ダウンロードして展開することもできます。

### Delta Lake Connectorのデプロイ

すべてのFEおよびBEデプロイメントパスの`connectors/`ディレクトリに`trino-delta-lake-435/`ディレクトリを配置し（存在しない場合は手動で作成できます）、`hdfs.tar.gz`を`trino-delta-lake-435/`ディレクトリに展開します。

```text
├── bin
├── conf
├── connectors
│   ├── trino-delta-lake-435
│   │   ├── hdfs
...
```
デプロイ後、Connectorが正しくロードされることを確実にするため、FEおよびBEノードを再起動することを推奨します。

## Catalogの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'delta_lake', -- required
    {TrinoProperties},
    {CommonProperties}
);
```
* `{TrinoProperties}`

  TrinoPropertiesセクションは、Trino Connectorに渡されるプロパティを指定するために使用されます。これらのプロパティは `trino.` プレフィックスを使用します。理論的には、Trinoでサポートされているすべてのプロパティがここでもサポートされています。Delta Lakeの詳細については、[Trino documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

* `[CommonProperties]`

  CommonPropertiesセクションは、一般的なプロパティを指定するために使用されます。「Common Properties」セクションの[Catalog Overview](../catalog-overview.md)を参照してください。
  
### サポートされているDelta Lakeバージョン

Delta Lakeの詳細については、[Trino documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

### サポートされているMetadataサービス

Delta Lakeの詳細については、[Trino documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

### サポートされているStorageシステム

Delta Lakeの詳細については、[Trino documentation](https://trino.io/docs/435/connector/delta-lake.html)を参照してください。

## カラム型マッピング

| Delta Lake Type | Trino Type                  | Doris Type    | Comment |
| --------------- | --------------------------- | ------------- | ------- |
| boolean         | boolean                     | boolean       |         |
| int             | int                         | int           |         |
| byte            | tinyint                     | tinyint       |         |
| short           | smallint                    | smallint      |         |
| long            | bigint                      | bigint        |         |
| float           | real                        | float         |         |
| double          | double                      | double        |         |
| decimal(P, S)   | decimal(P, S)               | decimal(P, S) |         |
| string          | varchar                     | string        |         |
| bianry          | varbinary                   | string        |         |
| date            | date                        | date          |         |
| timestamp\_ntz  | timestamp(N)                | datetime(N)   |         |
| timestamp       | timestamp with time zone(N) | datetime(N)   |         |
| array           | array                       | array         |         |
| map             | map                         | map           |         |
| struct          | row                         | struct        |         |

## 例

```sql
CREATE CATALOG delta_lake_hms properties ( 
    'type' = 'trino-connector', 
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri'= 'thrift://ip:port',
    'trino.hive.config.resources'='/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```
## クエリ操作

Catalogを設定した後、以下の方法を使用してCatalog内のテーブルデータをクエリできます：

```sql
-- 1. Switch to the catalog, use the database, and query
SWITCH delta_lake_ctl;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 2. Use the Delta Lake database directly
USE delta_lake_ctl.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 3. Use the fully qualified name to query
SELECT * FROM delta_lake_ctl.delta_lake_db.delta_lake_tbl LIMIT 10;
```
