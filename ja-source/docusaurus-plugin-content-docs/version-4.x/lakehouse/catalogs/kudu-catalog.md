---
{
  "title": "Kudu カタログ",
  "language": "ja",
  "description": "Apache Doris Kudu Catalogガイド：Trino Connectorフレームワークを通じてKuduデータベースに接続し、Kuduテーブルデータをクエリおよび統合します。Kerberos認証、複数のデータ型マッピングをサポートし、KuduとDoris間の迅速なデータ統合を可能にします。"
}
---
## 概要

Kudu CatalogはTrino Kudu Connectorを使用して、[Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)互換性フレームワークを通じてKuduテーブルにアクセスします。

:::note
- これは実験的機能で、バージョン3.0.1以降でサポートされています。
- この機能はTrinoクラスター環境に依存せず、Trino互換性プラグインのみを使用します。
:::

### 使用事例

| シナリオ | サポート状況 |
| ----------------- | ------------------------------------------------- |
| データ統合 | Kuduデータを読み取りDoris内部テーブルに書き込み |
| データライトバック | サポートなし |

### バージョン互換性

- **Dorisバージョン**: 3.0.1以上
- **Trino Connectorバージョン**: 435
- **Kuduバージョン**: サポートされているバージョンについては、[Trino Documentation](https://trino.io/docs/435/connector/kudu.html)を参照してください

## クイックスタート

### ステップ1: Connectorプラグインの準備

Kudu Connectorプラグインを取得するには、以下の方法のいずれかを選択できます：

**方法1: プリコンパイル済みパッケージを使用（推奨）**

プリコンパイル済みプラグインパッケージを[ここ](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からダウンロードして展開します。

**方法2: 手動コンパイル**

カスタムコンパイルが必要な場合は、以下の手順に従ってください（JDK 17が必要）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```
コンパイル後、`trino/plugin/trino-kudu/target/` に `trino-kudu-435/` ディレクトリが生成されます。

### Step 2: プラグインのデプロイ

1. すべてのFEとBEのデプロイメントパスの `connectors/` ディレクトリ下に `trino-kudu-435/` ディレクトリを配置します（ディレクトリが存在しない場合は手動で作成してください）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kudu-435
   ...
   ```
> `fe.conf`の`trino_connector_plugin_dir`設定を変更することで、プラグインパスをカスタマイズすることもできます。例：`trino_connector_plugin_dir=/path/to/connectors/`

2. すべてのFEおよびBEノードを再起動して、Connectorが適切に読み込まれることを確認します。

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
### ステップ4: データのクエリ

Catalogを作成した後、以下の3つの方法のいずれかを使用してKuduテーブルデータをクエリできます：

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

TrinoPropertiesは、`trino.`プレフィックスが付いたTrino Kudu Connector固有のプロパティを設定するために使用されます。一般的なパラメータには以下があります：

| パラメータ名                                          | 必須     | デフォルト | 説明                                   |
| ----------------------------------------------------- | -------- | ------- | -------------------------------------- |
| `trino.kudu.client.master-addresses`                  | Yes      | -       | Kuduマスターノードアドレスのリスト     |
| `trino.kudu.authentication.type`                      | No       | NONE    | 認証タイプ：NONEまたはKERBEROS  |
| `trino.kudu.authentication.client.principal`          | No       | -       | Kerberosクライアントプリンシパル              |
| `trino.kudu.authentication.client.keytab`             | No       | -       | Kerberosキータブファイルパス              |
| `trino.kudu.authentication.config`                    | No       | -       | Kerberos設定ファイルパス       |
| `trino.kudu.authentication.server.principal.primary`  | No       | -       | Kuduサーバープリンシパルプレフィックス           |

その他のKudu Connector設定パラメータについては、[Trino公式ドキュメント](https://trino.io/docs/435/connector/kudu.html)を参照してください。

#### CommonProperties パラメータ

CommonPropertiesは、メタデータ更新ポリシー、アクセス制御などの一般的なCatalogプロパティを設定するために使用されます。詳細については、[Catalog概要](../catalog-overview.md)の「共通プロパティ」セクションを参照してください。

## データ型マッピング

Kudu Catalogを使用する際、データ型は以下のルールに従ってマッピングされます：

| Kudu型        | Trino型    | Doris型    | 備考                                                                                |
| ---------------- | ------------- | ------------- | ------------------------------------------------------------------------------------ |
| boolean          | boolean       | boolean       |                                                                                      |
| int8             | tinyint       | tinyint       |                                                                                      |
| int16            | smallint      | smallint      |                                                                                      |
| int32            | integer       | int           |                                                                                      |
| int64            | bigint        | bigint        |                                                                                      |
| float            | real          | float         |                                                                                      |
| double           | double        | double        |                                                                                      |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                                      |
| binary           | varbinary     | string        | `HEX(col)`関数を使用してTrinoと一致した表示結果でクエリする          |
| string           | varchar       | string        |                                                                                      |
| date             | date          | date          |                                                                                      |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                                      |
| other            | UNSUPPORTED   | -             | サポートされていない型                                                                     |

:::tip
`binary`型の場合、16進数形式で表示する必要がある場合は、`HEX()`関数でカラム名を囲んで使用してください。例：`SELECT HEX(binary_col) FROM table`。
:::
