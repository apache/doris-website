---
{
    "title": "AWS Glue",
    "language": "ja",
    "description": "CREATE CATALOG を使用して AWS Glue Catalog 経由で Iceberg テーブルまたは Hive テーブルにアクセスする際のパラメータ設定について説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` を使用して **AWS Glue Catalog** 経由で **Iceberg テーブル**または **Hive テーブル**にアクセスする際のパラメータ設定について説明します。

## サポートされる Glue Catalog の種類

AWS Glue Catalog は現在、次の三種類の Catalog をサポートしています。

| Catalog の種類 | 種類の識別子（`type`） | 説明 |
|-------------|-------------------------|------|
| Hive        | glue                    | Hive Metastore に接続する Catalog |
| Iceberg     | glue                    | Iceberg テーブル形式に接続する Catalog |
| Iceberg     | rest                    | Glue Rest Catalog 経由で Iceberg テーブル形式に接続する Catalog |

設定できるように、種類ごとのパラメータを詳しく説明します。

## 共通パラメータの概要

| パラメータ名 | 説明 | 必須 | デフォルト値 |
|-------------|------|------|--------------|
| `glue.region` | AWS Glue のリージョン（例：`us-east-1`） | はい | なし |
| `glue.endpoint` | AWS Glue のエンドポイント（例：`https://glue.us-east-1.amazonaws.com`） | はい | なし |
| `glue.access_key` | AWS Access Key ID | はい | 空文字列 |
| `glue.secret_key` | AWS Secret Access Key | はい | 空文字列 |
| `glue.catalog_id` | Glue Catalog ID（現時点では未対応） | いいえ | 空文字列 |
| `glue.role_arn` | Glue へのアクセスに使用する IAM Role ARN（3.1.2 以降でサポート） | いいえ | 空文字列 |
| `glue.external_id` | Glue へのアクセスに使用する IAM External ID（3.1.2 以降でサポート） | いいえ | 空文字列 |

### 認証パラメータ

Glue へのアクセスには認証情報が必要です。次の二つの方法をサポートしています。

1. Access Key 認証

   `glue.access_key` と `glue.secret_key` で指定した Access Key を使用して Glue へのアクセスを認証します。

2. IAM Role 認証（3.1.2 以降でサポート）

   `glue.role_arn` で指定した IAM Role を使用して Glue へのアクセスを認証します。

   この方法を使用するには、Doris を AWS EC2 上にデプロイし、Glue へのアクセス権限を持つ IAM Role を EC2 インスタンスに関連付ける必要があります。

   External ID を使用したアクセスが必要な場合は、`glue.external_id` も設定してください。

注意事項：

- 二つの方法のうち、少なくとも一つを設定する必要があります。両方を設定した場合は、Access Key 認証が優先されます。

例：

    ```sql
    CREATE CATALOG hive_glue_catalog PROPERTIES (
      'type' = 'hms',
      'hive.metastore.type' = 'glue',
      'glue.region' = 'us-east-1',
      'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
      -- Using Access Key authentication
      'glue.access_key' = '<YOUR_ACCESS_KEY>',
      'glue.secret_key' = '<YOUR_SECRET_KEY>'
      -- Or using IAM Role authentication
      -- 'glue.role_arn' = '<YOUR_ROLE_ARN>',
      -- 'glue.external_id' = '<YOUR_EXTERNAL_ID>'
    );
    ```

AWS の認証と認可の設定手順については、[AWS の認証と認可](../../admin-manual/auth/integrations/aws-authentication-and-authorization.md)を参照してください。

### Hive Glue Catalog

Hive Glue Catalog は、AWS Glue の Hive Metastore 互換インターフェース経由で Hive テーブルにアクセスするために使用します。設定は次のとおりです。

| パラメータ名 | 説明 | 必須 | デフォルト値 |
|-------------|------|------|--------------|
| `type` | `hms` に固定 | はい | なし |
| `hive.metastore.type` | `glue` に固定 | はい | なし |
| `glue.region` | AWS Glue のリージョン（例：`us-east-1`） | はい | なし |
| `glue.endpoint` | AWS Glue のエンドポイント（例：`https://glue.us-east-1.amazonaws.com`） | はい | なし |
| `glue.access_key` | AWS Access Key ID | いいえ | 空文字列 |
| `glue.secret_key` | AWS Secret Access Key | いいえ | 空文字列 |
| `glue.catalog_id` | Glue Catalog ID（現時点では未対応） | いいえ | 空文字列 |
| `glue.role_arn` | Glue へのアクセスに使用する IAM Role ARN | いいえ | 空文字列 |
| `glue.external_id` | Glue へのアクセスに使用する IAM External ID | いいえ | 空文字列 |

#### 例

```sql
CREATE CATALOG hive_glue_catalog PROPERTIES (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

### Iceberg Glue Catalog

Iceberg Glue Catalog は、Glue Client 経由で Glue にアクセスします。設定は次のとおりです。

| パラメータ名 | 説明 | 必須 | デフォルト値 |
|-------------|------|------|--------------|
| `type` | `iceberg` に固定 | はい | なし |
| `iceberg.catalog.type` | `glue` に固定 | はい | なし |
| `warehouse` | Iceberg データウェアハウスのパス（例：`s3://my-bucket/iceberg-warehouse/`） | はい | s3://doris |
| `glue.region` | AWS Glue のリージョン（例：`us-east-1`） | はい | なし |
| `glue.endpoint` | AWS Glue のエンドポイント（例：`https://glue.us-east-1.amazonaws.com`） | はい | なし |
| `glue.access_key` | AWS Access Key ID | いいえ | 空文字列 |
| `glue.secret_key` | AWS Secret Access Key | いいえ | 空文字列 |
| `glue.catalog_id` | Glue Catalog ID（現時点では未対応） | いいえ | 空文字列 |
| `glue.role_arn` | Glue へのアクセスに使用する IAM Role ARN（現時点では未対応） | いいえ | 空文字列 |
| `glue.external_id` | Glue へのアクセスに使用する IAM External ID（現時点では未対応） | いいえ | 空文字列 |

#### 例

```sql
CREATE CATALOG iceberg_glue_catalog PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### Iceberg Glue Rest Catalog

Iceberg Glue Rest Catalog は、Glue Rest Catalog インターフェース経由で Glue にアクセスします。現在、AWS S3 Table Bucket に保存された Iceberg テーブルのみをサポートしています。設定は次のとおりです。

| パラメータ名 | 説明 | 必須 | デフォルト値 |
|-------------|------|------|--------------|
| `type` | `iceberg` に固定 | はい | なし |
| `iceberg.catalog.type` | `rest` に固定 | はい | なし |
| `iceberg.rest.uri` | Glue Rest サービスのエンドポイント（例：`https://glue.ap-east-1.amazonaws.com/iceberg`） | はい | なし |
| `warehouse` | Iceberg データウェアハウスのパス（例：`<account_id>:s3tablescatalog/<bucket_name>`） | はい | なし |
| `iceberg.rest.sigv4-enabled` | V4 署名形式を有効にする。`true` に固定 | はい | なし |
| `iceberg.rest.signing-name` | 署名の種類。`glue` に固定 | はい | 空文字列 |
| `iceberg.rest.access-key-id` | Glue へのアクセスに使用する Access Key（S3 Bucket へのアクセスにも使用） | はい | 空文字列 |
| `iceberg.rest.secret-access-key` | Glue へのアクセスに使用する Secret Key（S3 Bucket へのアクセスにも使用） | はい | 空文字列 |
| `iceberg.rest.signing-region` | AWS Glue のリージョン（例：`us-east-1`） | はい | 空文字列 |

#### 例

```sql
CREATE CATALOG glue_s3 PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'rest',
  'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
  'warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
  'iceberg.rest.sigv4-enabled' = 'true',
  'iceberg.rest.signing-name' = 'glue',
  'iceberg.rest.access-key-id' = '<ak>',
  'iceberg.rest.secret-access-key' = '<sk>',
  'iceberg.rest.signing-region' = '<region>'
);
```


## 権限ポリシー

使用場面に応じて、**読み取り専用**と**読み書き可能**の二種類のポリシーがあります。

### 1. 読み取り専用権限

Glue Catalog からデータベースとテーブルの情報を読み取ることのみを許可します。

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadOnly",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 2. 読み書き権限

読み取り専用権限に加えて、データベースとテーブルの作成、変更、削除を許可します。

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadWrite",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions",
        "glue:CreateDatabase",
        "glue:UpdateDatabase",
        "glue:DeleteDatabase",
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:DeleteTable"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 注意事項

1. プレースホルダーの置き換え

    - `<region>` → AWS リージョン（例：`us-east-1`）に置き換えます。
    - `<account-id>` → AWS アカウント ID（12 桁の数字）に置き換えます。

2. 最小権限の原則

    - クエリの実行のみが必要な場合は、書き込み権限を付与しないでください。
    - `*` を特定のデータベースまたはテーブルの ARN に置き換えると、権限をさらに制限できます。

3. S3 の権限

    - 上記のポリシーは Glue Catalog のみを対象としています。
    - データファイルを読み取るには、追加の S3 権限（`s3:GetObject`、`s3:ListBucket` など）が必要です。
