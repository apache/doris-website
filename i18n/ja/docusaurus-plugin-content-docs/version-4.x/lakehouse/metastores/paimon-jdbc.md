---
{
    "title": "Paimon JDBC Catalog",
    "language": "ja",
    "description": "このドキュメントでは、JDBC インターフェースを使用して Paimon Catalog のメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` 文から JDBC インターフェースを使用して Paimon Catalog のメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。

:::tip 注
これは実験的な機能で、バージョン 4.1.0 以降でサポートされています。
:::

## パラメータの概要 {#parameter-overview}

| プロパティ名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- |
| paimon.jdbc.uri | JDBC 接続 URI を指定します | - | はい |
| paimon.jdbc.user | JDBC 接続のユーザー名 | - | はい |
| paimon.jdbc.password | JDBC 接続のパスワード | - | はい |
| warehouse | Paimon warehouse を指定します | - | はい |
| paimon.jdbc.driver_class | `org.postgresql.Driver`、`com.mysql.cj.jdbc.Driver` などの JDBC ドライバーのクラス名 | - | いいえ |
| paimon.jdbc.driver_url | JDBC ドライバーの JAR ファイルへのパス | - | いいえ |

> 注:
>
> 1. Paimon JDBC Catalog は、PostgreSQL や MySQL など、バックエンドストレージとしてさまざまなリレーショナルデータベースをサポートしています。
>
> 2. JDBC ドライバーの JAR ファイルにアクセスできることを確認してください。`paimon.jdbc.driver_url` でドライバーの場所を指定できます。

4.1.5 以降、Catalog の作成時と変更時に、JDBC ドライバーの場所が同じ基準で検証されます。URI スキームがない値は、`[A-Za-z0-9._-]+.jar` に一致するファイル名でなければなりません。絶対パスには `file:///...` を使用してください。URL デコード後のパスに、親ディレクトリを表す `..` セグメントを含めることはできません。安全なドライバーパスに関する既存の制限と、URL 許可リストの制限も引き続き適用されます。

## 設定例 {#example-configurations}

### メタデータの保存先として PostgreSQL を使用 {#postgresql-as-metadata-storage}

PostgreSQL データベースに Paimon のメタデータを保存する場合:

```sql
CREATE CATALOG paimon_jdbc_postgresql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'org.postgresql.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### メタデータの保存先として MySQL を使用 {#mysql-as-metadata-storage}

MySQL データベースに Paimon のメタデータを保存する場合:

```sql
CREATE CATALOG paimon_jdbc_mysql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
