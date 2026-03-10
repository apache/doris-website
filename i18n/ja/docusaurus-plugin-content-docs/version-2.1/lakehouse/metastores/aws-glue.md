---
{
  "title": "AWS Glue",
  "language": "ja",
  "description": "このドキュメントは、CREATE CATALOGを通じてIcebergテーブルやHiveテーブルにアクセスするためにAWS Glue Catalogを使用する際のパラメータ設定について説明します。"
}
---
この文書では、`CREATE CATALOG`を使用して**AWS Glue Catalog**経由で**Icebergテーブル**または**Hiveテーブル**にアクセスする際のパラメータ設定について説明します。

## サポートされているGlue Catalogタイプ

AWS Glue Catalogは現在3つのタイプのCatalogをサポートしています：

| Catalogタイプ | タイプ識別子（`type`） | 説明                                    |
|-------------|-------------------------|------------------------------------------------|
| Hive        | glue                    | Hive Metastoreに接続するためのCatalog      |
| Iceberg     | glue                    | Icebergテーブル形式に接続するためのCatalog |
| Iceberg     | rest                    | Glue Rest Catalog経由でIcebergテーブル形式に接続するためのCatalog |

この文書では、ユーザーの設定を容易にするために、各タイプの詳細なパラメータ説明を提供します。

## 共通パラメータ概要
| パラメータ名            | 説明                                                   | 必須 | デフォルト値 |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `glue.region`            | AWS Glueリージョン、例：`us-east-1`                          | Yes      | None          |
| `glue.endpoint`          | AWS Glueエンドポイント、例：`https://glue.us-east-1.amazonaws.com` | Yes      | None          |
| `glue.access_key`        | AWS Access Key ID                                            | Yes      | Empty         |
| `glue.secret_key`        | AWS Secret Access Key                                        | Yes      | Empty         |
| `glue.catalog_id`        | Glue Catalog ID（まだサポートされていません）                         | No       | Empty         |
| `glue.role_arn`          | GlueにアクセスするためのIAM Role ARN（3.1.2+以降サポート）   | No       | Empty         |
| `glue.external_id`       | GlueにアクセスするためのIAM External ID（3.1.2+以降サポート） | No       | Empty         |

### 認証パラメータ

Glueへのアクセスには認証情報が必要で、以下の2つの方法をサポートしています：

1. Access Key認証

   `glue.access_key`と`glue.secret_key`で提供されるAccess Key経由でGlueへのアクセスを認証します。

2. IAM Role認証（3.1.2+以降サポート）

   `glue.role_arn`で提供されるIAM Role経由でGlueへのアクセスを認証します。

   この方法では、DorisがAWS EC2上にデプロイされている必要があり、EC2インスタンスにはGlueにアクセスする権限を持つIAM Roleがバインドされている必要があります。

   External ID経由でのアクセスが必要な場合は、`glue.external_id`も設定する必要があります。

注意：

- 2つの方法のうち少なくとも1つを設定する必要があります。両方の方法が設定されている場合、Access Key認証が優先されます。

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
### Hive Glue Catalog

Hive Glue CatalogはAWS GlueのHive Metastore互換インターフェースを通じてHiveテーブルにアクセスするために使用されます。設定は以下の通りです：

| パラメータ名            | 説明                                                   | 必須 | デフォルト値 |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `type`                   | `hms`に固定                                               | はい      | なし          |
| `hive.metastore.type`    | `glue`に固定                                              | はい      | なし          |
| `glue.region`            | AWS Glueリージョン、例：`us-east-1`                          | はい      | なし          |
| `glue.endpoint`          | AWS Glueエンドポイント、例：`https://glue.us-east-1.amazonaws.com` | はい      | なし          |
| `glue.access_key`        | AWS Access Key ID                                            | いいえ       | 空         |
| `glue.secret_key`        | AWS Secret Access Key                                        | いいえ       | 空         |
| `glue.catalog_id`        | Glue Catalog ID（まだサポートされていません）                         | いいえ       | 空         |
| `glue.role_arn`          | GlueにアクセスするためのIAM Role ARN                             | いいえ       | 空         |
| `glue.external_id`       | GlueにアクセスするためのIAM External ID                          | いいえ       | 空         |

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

Iceberg Glue CatalogはGlue Clientを通じてGlueにアクセスします。設定は以下の通りです：

| パラメータ名 | 説明 | 必須 | デフォルト値 |
|------------------------|------------------------------------------------------------------|----------|---------------|
| `type` | `iceberg`で固定 | はい | なし |
| `iceberg.catalog.type` | `glue`で固定 | はい | なし |
| `warehouse` | Icebergデータウェアハウスパス、例：`s3://my-bucket/iceberg-warehouse/` | はい | s3://doris |
| `glue.region` | AWS Glueリージョン、例：`us-east-1` | はい | なし |
| `glue.endpoint` | AWS Glueエンドポイント、例：`https://glue.us-east-1.amazonaws.com` | はい | なし |
| `glue.access_key` | AWS Access Key ID | いいえ | 空 |
| `glue.secret_key` | AWS Secret Access Key | いいえ | 空 |
| `glue.catalog_id` | Glue Catalog ID（まだサポートされていません） | いいえ | 空 |
| `glue.role_arn` | GlueにアクセスするためのIAM Role ARN（まだサポートされていません） | いいえ | 空 |
| `glue.external_id` | Glueにアクセスするためのイン External ID（まだサポートされていません） | いいえ | 空 |

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

Iceberg Glue Rest CatalogはGlue Rest Catalogインターフェースを通じてGlueにアクセスします。現在はAWS S3 Table Bucketに保存されたIcebergテーブルのみをサポートしています。設定は以下の通りです：

| パラメータ名                        | 説明                                                            | 必須 | デフォルト値 |
|----------------------------------|-------------------------------------------------------------------|------|---------------|
| `type`                           | `iceberg`に固定                                                | はい | None          |
| `iceberg.catalog.type`           | `rest`に固定                                                   | はい | None          |
| `iceberg.rest.uri`               | Glue Restサービスエンドポイント、例：`https://glue.ap-east-1.amazonaws.com/iceberg` | はい | None          |
| `warehouse`                      | Icebergデータウェアハウスパス、例：`<account_id>:s3tablescatalog/<bucket_name>` | はい | None          |
| `iceberg.rest.sigv4-enabled`     | V4署名形式を有効にする、`true`に固定                              | はい | None          |
| `iceberg.rest.signing-name`      | 署名タイプ、`glue`に固定                                        | はい | Empty         |
| `iceberg.rest.access-key-id`     | Glueにアクセスするためのアクセスキー（S3 Bucketアクセスにも使用）      | はい | Empty         |
| `iceberg.rest.secret-access-key` | Glueにアクセスするためのシークレットキー（S3 Bucketアクセスにも使用）   | はい | Empty         |
| `iceberg.rest.signing-region`    | AWS Glueリージョン、例：`us-east-1`                             | はい | Empty         |

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
## Permission Policies

使用シナリオに応じて、**読み取り専用**と**読み書き**ポリシーに分けることができます。

### 1. 読み取り専用権限

Glue Catalogからデータベースとテーブル情報の読み取りのみを許可します。

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
### 2. Read-Write Permissions

読み取り専用権限に基づいて、データベースとテーブルの作成/変更/削除を許可します。

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

1. プレースホルダーの置換

    - `<region>` → あなたのAWSリージョン（例：`us-east-1`）
    - `<account-id>` → あなたのAWSアカウントID（12桁の番号）

2. 最小権限の原則

    - クエリのみを実行する場合は、書き込み権限を付与しない。
    - `*`を特定のデータベース/テーブルARNに置き換えることで、権限をさらに制限できる。

3. S3権限

    - 上記のポリシーはGlue Catalogのみに関連している。
    - データファイルを読み取る必要がある場合は、追加のS3権限が必要（`s3:GetObject`、`s3:ListBucket`など）。
