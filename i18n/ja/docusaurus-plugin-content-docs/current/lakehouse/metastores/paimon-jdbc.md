---
{
    "title": "Paimon JDBC Catalog",
    "language": "ja",
    "description": "このドキュメントでは、JDBC インターフェースを使用して Paimon Catalog のメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` 文を通じて JDBC インターフェースを使用し、Paimon Catalog のメタデータサービスに接続してアクセスする際にサポートされるパラメータについて説明します。

:::tip 注記
これはバージョン 4.1.0 以降でサポートされる実験的な機能です。
:::

## パラメータの概要 {#parameter-overview}

| プロパティ名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- |
| paimon.jdbc.uri | JDBC 接続 URI を指定します | - | はい |
| paimon.jdbc.user | JDBC 接続のユーザー名 | - | はい |
| paimon.jdbc.password | JDBC 接続のパスワード | - | はい |
| warehouse | Paimon の warehouse を指定します | - | はい |
| paimon.jdbc.driver_class | JDBC ドライバーのクラス名（`org.postgresql.Driver`、`com.mysql.cj.jdbc.Driver` など） | - | いいえ |
| paimon.jdbc.driver_url | JDBC ドライバーの JAR ファイルへのパス | - | いいえ |

> 注記:
>
> 1. Paimon JDBC Catalog は、PostgreSQL や MySQL など、さまざまなリレーショナルデータベースをバックエンドストレージとしてサポートしています。
>
> 2. JDBC ドライバーの JAR ファイルにアクセスできることを確認してください。ドライバーの場所は `paimon.jdbc.driver_url` で指定できます。

バージョン 4.1.5 以降、Catalog の作成時と変更時には、JDBC ドライバーの場所が一貫した方法で検証されます。URI スキームを含まない値は、`[A-Za-z0-9._-]+.jar` に一致するファイル名でなければなりません。絶対パスには `file:///...` を使用してください。URL デコード後のパスに、親ディレクトリを表す `..` セグメントを含めることはできません。既存の安全なドライバーパスに関する制限と URL の許可リストに関する制限も引き続き適用されます。

## 設定例 {#example-configurations}

### PostgreSQL をメタデータストレージとして使用する {#postgresql-as-metadata-storage}

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

### MySQL をメタデータストレージとして使用する {#mysql-as-metadata-storage}

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
