---
{
    "title": "Iceberg JDBC カタログ",
    "language": "ja",
    "description": "JDBC インターフェースを使用して Iceberg Catalog のメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` 文を使用し、JDBC インターフェース経由で Iceberg Catalog のメタデータサービスに接続してアクセスする際にサポートされるパラメータについて説明します。

:::tip 注記
この機能は実験的な機能で、バージョン 4.1.0 からサポートされています。
:::

## パラメータ一覧

| プロパティ名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- |
| iceberg.jdbc.uri | JDBC 接続 URI を指定します | - | はい |
| iceberg.jdbc.catalog_name | Iceberg JDBC のメタデータテーブルで使用する `catalog_name` 分離キーを指定します。この値は Doris のカタログ名と異なっていてもかまいません。 | - | はい |
| iceberg.jdbc.user | JDBC 接続のユーザー名 | - | いいえ |
| iceberg.jdbc.password | JDBC 接続のパスワード | - | いいえ |
| warehouse | Iceberg のウェアハウスを指定します | - | はい |
| iceberg.jdbc.init-catalog-tables | 初回使用時にカタログ関連のテーブル構造を自動的に初期化するかどうか | `true` | いいえ |
| iceberg.jdbc.schema-version | JDBC カタログで使用するスキーマのバージョン。`V0` と `V1` をサポートします | `V0` | いいえ |
| iceberg.jdbc.strict-mode | メタデータをより厳密に検証する厳格モードを有効にするかどうか | `false` | いいえ |
| iceberg.jdbc.driver_class | JDBC ドライバーのクラス名。例: `org.postgresql.Driver`、`com.mysql.cj.jdbc.Driver` など | - | いいえ |
| iceberg.jdbc.driver_url | JDBC ドライバーの JAR ファイルへのパス | - | いいえ |

> 注記:
>
> 1. Iceberg JDBC カタログは、PostgreSQL、MySQL、SQLite など、さまざまなリレーショナルデータベースをバックエンドストレージとしてサポートします。
>
> 2. JDBC ドライバーの JAR ファイルにアクセスできることを確認してください。ドライバーの場所は `iceberg.jdbc.driver_url` で指定できます。
>
> 3. `iceberg.jdbc.catalog_name` は、Spark が書き込んだメタデータでの `spark_catalog` など、書き込み側が使用する Iceberg JDBC カタログ名と一致している必要があります。
>
> 4. `iceberg.jdbc.driver_url` を指定する場合は、`iceberg.jdbc.driver_class` も指定する必要があります。

## 設定例

### PostgreSQL をメタデータストレージとして使用

PostgreSQL データベースに Iceberg のメタデータを保存する場合:

```sql
CREATE CATALOG iceberg_jdbc_postgresql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_postgresql',
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

### MySQL をメタデータストレージとして使用

MySQL データベースに Iceberg のメタデータを保存する場合:

```sql
CREATE CATALOG iceberg_jdbc_mysql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_mysql',
    'iceberg.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### SQLite をメタデータストレージとして使用

SQLite データベースに Iceberg のメタデータを保存する場合（テスト環境に適しています）:

```sql
CREATE CATALOG iceberg_jdbc_sqlite PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_sqlite',
    'iceberg.jdbc.uri' = 'jdbc:sqlite:/tmp/iceberg_catalog.db',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.sqlite.JDBC',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
