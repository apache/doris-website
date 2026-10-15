---
{
    "title": "Kudu Catalog",
    "language": "ja",
    "description": "Apache Doris の Kudu Catalog ガイド。Trino Connector の互換性フレームワークを通じて Kudu に接続し、Kudu テーブルのデータをクエリして統合します。Kerberos 認証と複数のデータ型のマッピングに対応し、Kudu と Doris 間のデータ統合を簡単に行えます。"
}
---

## 概要

Kudu Catalog は、Trino Kudu Connector を使用し、[Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) の互換性フレームワークを通じて Kudu テーブルにアクセスします。

:::note
- これは実験的な機能で、バージョン 3.0.1 以降でサポートされています。
- この機能は Trino クラスター環境に依存せず、Trino 互換プラグインのみを使用します。
:::

### ユースケース

| シナリオ       | 対応状況                                           |
| -------------- | -------------------------------------------------- |
| データ統合     | Kudu のデータを読み取り、Doris の内部テーブルに書き込む |
| データの書き戻し | サポートされていません                             |

### バージョンの互換性

- **Doris のバージョン**: 3.0.1 以降
- **Trino Connector のバージョン**: 435
- **Kudu のバージョン**: サポート対象のバージョンについては、[Trino のドキュメント](https://trino.io/docs/435/connector/kudu.html)を参照してください。

## クイックスタート

### ステップ 1: Connector プラグインの準備

Kudu Connector プラグインは、次のいずれかの方法で入手できます。

**方法 1: ビルド済みパッケージを使用する（推奨）**

[こちら](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)からビルド済みのプラグインパッケージをダウンロードし、展開します。

**方法 2: 手動でビルドする**

カスタムビルドが必要な場合は、次の手順に従ってください（JDK 17 が必要です）。

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```

ビルド後、`trino-kudu-435/` ディレクトリが `trino/plugin/trino-kudu/target/` に生成されます。

### ステップ 2: プラグインの配置

1. `trino-kudu-435/` ディレクトリを、すべての FE および BE のデプロイ先にある `connectors/` ディレクトリの下に配置します（ディレクトリが存在しない場合は手動で作成してください）。

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kudu-435
   ...
   ```

   > `trino_connector_plugin_dir` 設定を `fe.conf` で変更して、プラグインのパスをカスタマイズすることもできます。例: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connector が正しく読み込まれるように、すべての FE および BE ノードを再起動します。

### ステップ 3: Catalog の作成

**基本設定（認証なし）**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'NONE'
);
```

**Kerberos 認証の設定**

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

### ステップ 4: データのクエリ

Catalog の作成後、次の三つの方法のいずれかで Kudu テーブルのデータをクエリできます。

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

### Catalog の設定パラメータ

Kudu Catalog を作成する際の基本構文は次のとおりです。

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kudu',     -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### TrinoProperties パラメータ

TrinoProperties は、`trino.` で始まる Trino Kudu Connector 固有のプロパティの設定に使用します。主なパラメータは次のとおりです。

| パラメータ名                                        | 必須 | デフォルト値 | 説明                                  |
| --------------------------------------------------- | ---- | ------------ | ------------------------------------- |
| `trino.kudu.client.master-addresses`                 | はい | -            | Kudu Master ノードのアドレス一覧      |
| `trino.kudu.authentication.type`                     | いいえ | NONE       | 認証タイプ: NONE または KERBEROS      |
| `trino.kudu.authentication.client.principal`         | いいえ | -          | Kerberos クライアントのプリンシパル   |
| `trino.kudu.authentication.client.keytab`            | いいえ | -          | Kerberos キータブファイルのパス       |
| `trino.kudu.authentication.config`                   | いいえ | -          | Kerberos 設定ファイルのパス           |
| `trino.kudu.authentication.server.principal.primary` | いいえ | -          | Kudu サーバーのプリンシパルのプレフィックス |

Kudu Connector のその他の設定パラメータについては、[Trino の公式ドキュメント](https://trino.io/docs/435/connector/kudu.html)を参照してください。

#### CommonProperties パラメータ

CommonProperties は、メタデータの更新ポリシーやアクセス制御など、Catalog の共通プロパティの設定に使用します。詳細については、[Catalog の概要](../catalog-overview.md)の「共通プロパティ」セクションを参照してください。

## データ型のマッピング

Kudu Catalog を使用する場合、データ型は次の規則に従ってマッピングされます。

| Kudu の型       | Trino の型    | Doris の型    | 備考                                                                           |
| -------------- | ------------- | ------------- | ------------------------------------------------------------------------------ |
| boolean        | boolean       | boolean       |                                                                                |
| int8           | tinyint       | tinyint       |                                                                                |
| int16          | smallint      | smallint      |                                                                                |
| int32          | integer       | int           |                                                                                |
| int64          | bigint        | bigint        |                                                                                |
| float          | real          | float         |                                                                                |
| double         | double        | double        |                                                                                |
| decimal(P, S)  | decimal(P, S) | decimal(P, S) |                                                                                |
| binary         | varbinary     | string        | Trino と同じ表示結果を得るには、`HEX(col)` 関数を使用してクエリする             |
| string         | varchar       | string        |                                                                                |
| date           | date          | date          |                                                                                |
| unixtime_micros | timestamp(3)  | datetime(3)   |                                                                                |
| other          | UNSUPPORTED   | -             | サポートされていない型                                                         |

:::tip
`binary` 型を十六進数形式で表示するには、`HEX()` 関数で列名を囲みます。例: `SELECT HEX(binary_col) FROM table`。
:::
