---
{
  "title": "Kudu カタログ",
  "language": "ja",
  "description": "Apache Doris Kudu Catalogガイド：Trino Connectorフレームワークを通じてKuduデータベースに接続し、Kuduテーブルデータのクエリと統合を行います。Kerberos認証、複数のデータタイプマッピングをサポートし、KuduとDoris間の迅速なデータ統合を可能にします。"
}
---
## 概要

Kudu Catalogは、Trino Kudu Connectorを使用して[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワーク経由でKuduテーブルにアクセスします。

:::note
- これは実験的機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスタ環境に依存せず、Trino互換性プラグインのみを使用します。
:::

### 使用例

| シナリオ          | サポート状況                                    |
| ----------------- | ------------------------------------------------- |
| データ統合  | Kuduデータを読み取り、Doris内部テーブルに書き込み |
| データ書き戻し   | サポートされていません                                     |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **Kuduバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/kudu.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

Kudu Connectorプラグインを取得するには、以下のいずれかの方法を選択できます：

**方法1: プリコンパイル済みパッケージの使用（推奨）**

[こちら](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からプリコンパイル済みプラグインパッケージをダウンロードして展開します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```
コンパイル後、`trino/plugin/trino-kudu/target/`内に`trino-kudu-435/`ディレクトリが作成されます。

### Step 2: Deploy Plugin

1. すべてのFEおよびBEデプロイメントパスの`connectors/`ディレクトリ下に`trino-kudu-435/`ディレクトリを配置します（存在しない場合は手動でディレクトリを作成してください）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kudu-435
   ...
   ```
> `fe.conf`内の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることもできます。例：`trino_connector_plugin_dir=/path/to/connectors/`

2. すべてのFEおよびBEノードを再起動して、Connectorが適切にロードされることを確認してください。

### ステップ3：カタログの作成

**基本設定（認証なし）**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'NONE'
);
```
**Kerberos認証設定**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'KERBEROS',
    'trino.kudu.authentication.client.principal' = 'user@DOMAIN.COM',
    'trino.kudu.authentication.client.keytab' = '/path/to/kudu.keytab',
    'trino.kudu.authentication.config' = '/etc/krb5.conf',
    'trino.kudu.authentication.server.principal.primary' = 'kudu'
);
```
### Step 4: データのクエリ

Catalogを作成後、以下の3つの方法のいずれかを使用してKuduテーブルデータをクエリできます：

```sql
-- Method 1: Query after switching to Catalog
SWITCH kudu_catalog;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 2: Use two-level path
USE kudu_catalog.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kudu_catalog.kudu_db.kudu_tbl LIMIT 10;
```
## 設定

### カタログ設定パラメータ

Kudu Catalogを作成するための基本的な構文は以下の通りです：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kudu',     -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```
#### TrinoProperties パラメータ

TrinoPropertiesは、`trino.`というプレフィックスを付けたTrino Kudu Connector固有のプロパティを設定するために使用されます。一般的なパラメータには以下があります：

| パラメータ名                                           | 必須 | デフォルト | 説明                                    |
| ----------------------------------------------------- | ---- | ---------- | -------------------------------------- |
| `trino.kudu.client.master-addresses`                  | はい | -          | Kudu Masterノードアドレスのリスト        |
| `trino.kudu.authentication.type`                      | いいえ | NONE      | 認証タイプ：NONEまたはKERBEROS          |
| `trino.kudu.authentication.client.principal`          | いいえ | -         | Kerberosクライアントプリンシパル        |
| `trino.kudu.authentication.client.keytab`             | いいえ | -         | Kerberosキータブファイルパス            |
| `trino.kudu.authentication.config`                    | いいえ | -         | Kerberos設定ファイルパス               |
| `trino.kudu.authentication.server.principal.primary`  | いいえ | -         | Kuduサーバープリンシパルプレフィックス   |

その他のKudu Connector設定パラメータについては、[Trino公式ドキュメント](https://trino.io/docs/435/connector/kudu.html)を参照してください。

#### CommonPropertiesパラメータ

CommonPropertiesは、メタデータ更新ポリシー、アクセス制御などの一般的なCatalogプロパティを設定するために使用されます。詳細については、[Catalogの概要](../catalog-overview.md)の「Common Properties」セクションを参照してください。

## データ型マッピング

Kudu Catalogを使用する場合、データ型は以下のルールに従ってマッピングされます：

| Kuduタイプ       | Trinoタイプ   | Dorisタイプ   | 備考                                                                                 |
| ---------------- | ------------- | ------------- | ------------------------------------------------------------------------------------ |
| boolean          | boolean       | boolean       |                                                                                      |
| int8             | tinyint       | tinyint       |                                                                                      |
| int16            | smallint      | smallint      |                                                                                      |
| int32            | integer       | int           |                                                                                      |
| int64            | bigint        | bigint        |                                                                                      |
| float            | real          | float         |                                                                                      |
| double           | double        | double        |                                                                                      |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                                      |
| binary           | varbinary     | string        | Trinoと一貫した表示結果を得るために`HEX(col)`関数を使用してクエリする               |
| string           | varchar       | string        |                                                                                      |
| date             | date          | date          |                                                                                      |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                                      |
| other            | UNSUPPORTED   | -             | サポートされていないタイプ                                                           |

:::tip
`binary`タイプの場合、16進数形式で表示する必要がある場合は、`HEX()`関数を使用してカラム名を囲んでください。例：`SELECT HEX(binary_col) FROM table`。
:::
