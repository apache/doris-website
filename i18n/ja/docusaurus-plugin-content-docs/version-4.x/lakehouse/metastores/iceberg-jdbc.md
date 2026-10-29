---
{
    "title": "Iceberg JDBC Catalog",
    "language": "ja",
    "description": "このドキュメントでは、JDBC インターフェースを使用して Iceberg Catalog のメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` 文を通じて JDBC インターフェースを使用し、Iceberg Catalog のメタデータサービスに接続してアクセスする際にサポートされるパラメータについて説明します。

:::tip 注記
これはバージョン 4.1.0 からサポートされている実験的な機能です。
:::

## パラメータの概要 {#parameter-overview}

| プロパティ名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- |
| iceberg.jdbc.uri | JDBC 接続 URI を指定します | - | はい |
| iceberg.jdbc.catalog_name | Iceberg JDBC のメタデータテーブルにおける `catalog_name` 分離キーを指定します。この値は Doris のカタログ名と異なっていてもかまいません。 | - | はい |
| iceberg.jdbc.user | JDBC 接続のユーザー名 | - | いいえ |
| iceberg.jdbc.password | JDBC 接続のパスワード | - | いいえ |
| warehouse | Iceberg のウェアハウスを指定します | - | はい |
| iceberg.jdbc.init-catalog-tables | 初回使用時に Catalog 関連のテーブル構造を自動的に初期化するかどうか | `true` | いいえ |
| iceberg.jdbc.schema-version | JDBC Catalog で使用するスキーマバージョン。`V0` と `V1` をサポートします | `V0` | いいえ |
| iceberg.jdbc.strict-mode | メタデータをより厳密に検証する厳格モードを有効にするかどうか | `false` | いいえ |
| iceberg.jdbc.driver_class | JDBC ドライバーのクラス名。`org.postgresql.Driver`、`com.mysql.cj.jdbc.Driver` など | - | いいえ |
| iceberg.jdbc.driver_url | JDBC ドライバーの JAR ファイルへのパス | - | いいえ |

> 注記:
>
> 1. Iceberg JDBC Catalog は、PostgreSQL、MySQL、SQLite など、さまざまなリレーショナルデータベースをバックエンドストレージとしてサポートします。
>
> 2. JDBC ドライバーの JAR ファイルにアクセスできることを確認してください。`iceberg.jdbc.driver_url` でドライバーの場所を指定できます。
>
> 3. `iceberg.jdbc.catalog_name` は、書き込み側が使用する Iceberg JDBC Catalog の名前と一致させる必要があります。たとえば、Spark が書き込んだメタデータでは `spark_catalog` です。
>
> 4. `iceberg.jdbc.driver_url` を指定する場合は、`iceberg.jdbc.driver_class` も指定する必要があります。

バージョン 4.1.5 以降、Catalog の作成時と変更時に、JDBC ドライバーの場所が同じ基準で検証されます。URI スキームを持たない値は、`[A-Za-z0-9._-]+.jar` に一致するファイル名である必要があります。絶対パスには `file:///...` を使用してください。URL デコード後のパスに、親ディレクトリを表す `..` セグメントを含めることはできません。既存の安全なドライバーパスに関する制限と URL 許可リストの制限も引き続き適用されます。

## 設定例 {#example-configurations}

### メタデータストレージとして PostgreSQL を使用する {#postgresql-as-metadata-storage}

PostgreSQL データベースを使用して Iceberg のメタデータを保存する場合:

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

### メタデータストレージとして MySQL を使用する {#mysql-as-metadata-storage}

MySQL データベースを使用して Iceberg のメタデータを保存する場合:

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

### メタデータストレージとして SQLite を使用する {#sqlite-as-metadata-storage}

SQLite データベースを使用して Iceberg のメタデータを保存する場合（テスト環境に適しています）:

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
