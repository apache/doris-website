---
{
  "title": "Kudu カタログ",
  "language": "ja",
  "description": "Kudu CatalogはTrino Connector互換性フレームワークを使用して、Kudu Connectorを通じてKuduテーブルにアクセスします。"
}
---
Kudu Catalog は [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 互換性フレームワークを使用して、Kudu Connector を通じて Kudu テーブルにアクセスします。

:::note
この機能は実験的機能であり、バージョン 3.0.1 からサポートされています。
:::

## 適用シナリオ

| シナリオ       | 説明                          |
| -------------- | ------------------------------------ |
| データ統合 | Kudu データを読み取り、Doris 内部テーブルに書き込みます。 |
| データライトバック  | サポートされていません。                     |

## 環境準備

### Kudu Connector Plugin のコンパイル

> JDK 17 が必要です。

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-kudu
$ mvn clean package -Dmaven.test.skip=true
```
コンパイル後、`trino/plugin/trino-kudu/target/` ディレクトリに `trino-kudu-435` フォルダが含まれます。

また、事前にコンパイルされた [trino-kudu-435-20240724.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-kudu-435-20240724.tar.gz) を直接ダウンロードして展開することもできます。

### Kudu Connector のデプロイ

`trino-kudu-435/` ディレクトリを、全てのFEおよびBEノードのデプロイメントパスの `connectors/` ディレクトリに配置してください。（ディレクトリが存在しない場合は、手動で作成できます。）

```text
├── bin
├── conf
├── connectors
│   ├── trino-kudu-435
...
```
デプロイ後、Connectorが正しくロードされるように、FEおよびBEノードを再起動することを推奨します。

## Catalogの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'kudu', -- required
    {TrinoProperties},
    {CommonProperties}
);
```
* `{TrinoProperties}`

  `TrinoProperties`セクションは、Trino Connectorに渡されるプロパティを指定するために使用されます。これらのプロパティには`trino.`のプレフィックスが付きます。理論的には、Trinoでサポートされているすべてのプロパティがここでもサポートされます。Kuduプロパティの詳細については、[Trinoドキュメント](https://trino.io/docs/current/connector/kudu.html)を参照してください。

* `[CommonProperties]`

  CommonPropertiesセクションは、一般的なプロパティを指定するために使用されます。「Common Properties」セクションの[Catalog Overview](../catalog-overview.md)を参照してください。
  
### サポートされているKuduバージョン

Kuduの詳細については、[Trinoドキュメント](https://trino.io/docs/current/connector/kudu.html)を参照してください。

### サポートされているMetadata Services

Kuduの詳細については、[Trinoドキュメント](https://trino.io/docs/current/connector/kudu.html)を参照してください。

### サポートされているStorage Systems

Kuduの詳細については、[Trinoドキュメント](https://trino.io/docs/current/connector/kudu.html)を参照してください。

## Column Type Mapping

| Kudu Type        | Trino Type    | Doris Type    | Comment                                                                 |
| ---------------- | ------------- | ------------- | ----------------------------------------------------------------------- |
| boolean          | boolean       | boolean       |                                                                         |
| int8             | tinyint       | tinyint       |                                                                         |
| int16            | smallint      | smallint      |                                                                         |
| int32            | integer       | int           |                                                                         |
| int64            | bigint        | bigint        |                                                                         |
| float            | real          | float         |                                                                         |
| double           | double        | double        |                                                                         |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                         |
| binary           | varbinary     | string        | Trinoと同じ表示結果を返すために、クエリで`HEX(col)`を使用する必要があります。 |
| string           | varchar       | string        |                                                                         |
| date             | date          | date          |                                                                         |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                         |
| other            |   |       UNSUPPORTED        |                                                                         |

## Examples

```sql
CREATE CATALOG kudu_catalog PROPERTIES (  
    'type' = 'trino-connector',  
    'trino.connector.name' = 'kudu', 
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3,port3', 
    'trino.kudu.authentication.type' = 'NONE'
);
```
## クエリ操作

Catalogを設定した後、以下の方法を使用してCatalog内のテーブルデータをクエリできます：

```sql
-- 1. switch to catalog, use database and query
SWITCH kudu_ctl;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 2. use kudu database directly
USE kudu_ctl.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM kudu_ctl.kudu_db.kudu_tbl LIMIT 10;
```
