---
{
  "title": "Iceberg JDBC カタログ",
  "language": "ja",
  "description": "このドキュメントは、JDBCインターフェースを使用してIceberg Catalogメタデータサービスに接続およびアクセスする際にサポートされるパラメータについて説明します。"
}
---
この文書では、`CREATE CATALOG`文を通じてJDBCインターフェースを使用してIceberg Catalogメタデータサービスに接続およびアクセスする際にサポートされるパラメータについて説明します。

:::tip Note
これは実験的機能で、バージョン4.1.0以降でサポートされています。
:::

## パラメータ概要

| Property Name | Description | Default Value | Required |
| --- | --- | --- | --- | 
| iceberg.jdbc.uri | JDBC接続URIを指定 | - | Yes |
| iceberg.jdbc.user | JDBC接続ユーザー名 | - | Yes |
| iceberg.jdbc.password | JDBC接続パスワード | - | Yes |
| warehouse | icebergウェアハウスを指定 | - | Yes |
| iceberg.jdbc.init-catalog-tables | 初回使用時にCatalog関連のテーブル構造を自動的に初期化するかどうか | `true` | No |
| iceberg.jdbc.schema-version | JDBC Catalogで使用されるスキーマバージョン、`V0`と`V1`をサポート | `V0` | No |
| iceberg.jdbc.strict-mode | 厳密モードを有効にするかどうか、メタデータのより厳密な検証を実行 | `false` | No |
| iceberg.jdbc.driver_class | JDBCドライバークラス名、例：`org.postgresql.Driver`、`com.mysql.cj.jdbc.Driver`など | - | No |
| iceberg.jdbc.driver_url | JDBCドライバーJARファイルへのパス | - | No |

> 注意:
>
> 1. Iceberg JDBC CatalogはPostgreSQL、MySQL、SQLiteなどの様々なリレーショナルデータベースをバックエンドストレージとしてサポートします。
>
> 2. JDBCドライバーJARファイルにアクセスできることを確認してください。`iceberg.jdbc.driver_url`でドライバーの場所を指定できます。

## 設定例

### メタデータストレージとしてのPostgreSQL

PostgreSQLデータベースを使用してIcebergメタデータを保存する場合：

```sql
CREATE CATALOG iceberg_jdbc_postgresql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.postgresql.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
### メタデータストレージとしてのMySQL

Icebergメタデータを保存するためのMySQLデータベースの使用:

```sql
CREATE CATALOG iceberg_jdbc_mysql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>'
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
### SQLite as Metadata Storage

SQLite データベースを使用して Iceberg メタデータを保存する（テスト環境に適している）:

```sql
CREATE CATALOG iceberg_jdbc_sqlite PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:sqlite:/tmp/iceberg_catalog.db',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.sqlite.JDBC',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>'
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
