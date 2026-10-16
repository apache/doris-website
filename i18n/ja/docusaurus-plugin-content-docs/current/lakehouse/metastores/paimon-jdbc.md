---
{
    "title": "Paimon JDBC カタログ",
    "language": "ja",
    "description": "JDBC インターフェースを使用して Paimon Catalog のメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` 文を使用し、JDBC インターフェース経由で Paimon Catalog のメタデータサービスに接続してアクセスする際にサポートされるパラメータについて説明します。

:::tip 注記
この機能は実験的な機能で、バージョン 4.1.0 以降でサポートされています。
:::

## パラメータの概要

| プロパティ名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- |
| paimon.jdbc.uri | JDBC 接続 URI を指定します | - | はい |
| paimon.jdbc.user | JDBC 接続のユーザー名 | - | はい |
| paimon.jdbc.password | JDBC 接続のパスワード | - | はい |
| warehouse | Paimon ウェアハウスを指定します | - | はい |
| paimon.jdbc.driver_class | JDBC ドライバーのクラス名。例: `org.postgresql.Driver`、`com.mysql.cj.jdbc.Driver` など | - | いいえ |
| paimon.jdbc.driver_url | JDBC ドライバーの JAR ファイルへのパス | - | いいえ |

> 注記:
>
> 1. Paimon JDBC カタログは、PostgreSQL や MySQL など、さまざまなリレーショナルデータベースをバックエンドストレージとしてサポートしています。
>
> 2. JDBC ドライバーの JAR ファイルにアクセスできることを確認してください。`paimon.jdbc.driver_url` でドライバーの場所を指定できます。

## 設定例

### PostgreSQL をメタデータストレージとして使用する場合

PostgreSQL データベースを使用して Paimon のメタデータを保存する例:

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

### MySQL をメタデータストレージとして使用する場合

MySQL データベースを使用して Paimon のメタデータを保存する例:

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
