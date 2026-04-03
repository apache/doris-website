---
{
  "title": "AWS Glue",
  "description": "この文書は、CREATE CATALOG を通じて AWS Glue カタログ を使用して Iceberg tableまたは Hive tableにアクセスする際のパラメータ設定について説明します。",
  "language": "ja"
}
---
この文書では、`CREATE CATALOG`を通じて**Iceberg tables**または**Hive tables**にアクセスするために**AWS Glue カタログ**を使用する際のパラメータ設定について説明します。

## サポートされているGlue カタログタイプ

AWS Glue カタログは現在3つのタイプのカタログをサポートしています：

| カタログ タイプ | タイプ Identifier (`type`) | デスクリプション                                    |
|-------------|-------------------------|------------------------------------------------|
| Hive        | glue                    | カタログ for connecting to Hive Metastore      |
| Iceberg     | glue                    | カタログ for connecting to Iceberg table format |
| Iceberg     | rest                    | カタログ for connecting to Iceberg table format via Glue Rest カタログ |

この文書では、ユーザーの設定を容易にするため、各タイプの詳細なパラメータの説明を提供します。

## 共通パラメータの概要
| パラメータ名            | デスクリプション                                                   | Required | デフォルト値 |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `glue.region`            | AWS Glue region, e.g., `us-east-1`                          | Yes      | None          |
| `glue.endpoint`          | AWS Glue endpoint, e.g., `https://glue.us-east-1.amazonaws.com` | Yes      | None          |
| `glue.access_key`        | AWS Access Key ID                                            | Yes      | Empty         |
| `glue.secret_key`        | AWS Secret Access Key                                        | Yes      | Empty         |
| `glue.catalog_id`        | Glue カタログ ID (not supported yet)                         | No       | Empty         |
| `glue.role_arn`          | IAM Role ARN for accessing Glue (supported since 3.1.2+)   | No       | Empty         |
| `glue.external_id`       | IAM External ID for accessing Glue (supported since 3.1.2+) | No       | Empty         |

### 認証パラメータ

Glueにアクセスするには認証情報が必要で、以下の2つの方法をサポートしています：

1. Access Key認証

   `glue.access_key`と`glue.secret_key`で提供されるAccess Keyを通じてGlueへのアクセスを認証します。

2. IAM Role認証（3.1.2+以降でサポート）

   `glue.role_arn`で提供されるIAM Roleを通じてGlueへのアクセスを認証します。

   この方法では、DorisがAWS EC2上にデプロイされている必要があり、EC2インスタンスにはGlueへのアクセス権限を持つIAM Roleがバインドされている必要があります。

   External IDを通じたアクセスが必要な場合は、`glue.external_id`も設定する必要があります。

注意事項：

- 2つの方法のうち少なくとも1つは設定する必要があります。両方の方法が設定されている場合、Access Key認証が優先されます。

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
AWSの認証と認可の設定手順については、ドキュメントaws-authentication-and-authorizationを参照してください。

### Hive Glue カタログ

Hive Glue カタログはAWS GlueのHive Metastore互換インターフェースを通じてHiveTableにアクセスするために使用されます。設定は以下の通りです：

| パラメータ名 | 説明 | 必須 | デフォルト値 |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `type` | `hms`に固定 | Yes | None |
| `hive.metastore.type` | `glue`に固定 | Yes | None |
| `glue.region` | AWS Glueリージョン、例：`us-east-1` | Yes | None |
| `glue.endpoint` | AWS Glueエンドポイント、例：`https://glue.us-east-1.amazonaws.com` | Yes | None |
| `glue.access_key` | AWS Access Key ID | No | Empty |
| `glue.secret_key` | AWS Secret Access Key | No | Empty |
| `glue.catalog_id` | Glue カタログ ID（まだサポートされていません） | No | Empty |
| `glue.role_arn` | GlueアクセスのためのIAM Role ARN | No | Empty |
| `glue.external_id` | GlueアクセスのためのIAM External ID | No | Empty |

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
### Iceberg Glue カタログ

Iceberg Glue CatalogはGlue Clientを通じてGlueにアクセスします。設定は以下の通りです：

| パラメータ名          | デスクリプション                                                      | Required | デフォルト値 |
|------------------------|------------------------------------------------------------------|----------|---------------|
| `type`                 | `iceberg`に固定                                               | Yes      | None          |
| `iceberg.catalog.type` | `glue`に固定                                                  | Yes      | None          |
| `warehouse`            | Icebergデータウェアハウスパス、例：`s3://my-bucket/iceberg-warehouse/` | Yes      | s3://doris    |
| `glue.region`          | AWS Glueリージョン、例：`us-east-1`                             | Yes      | None          |
| `glue.endpoint`        | AWS Glueエンドポイント、例：`https://glue.us-east-1.amazonaws.com` | Yes      | None          |
| `glue.access_key`      | AWS Access Key ID                                               | No       | Empty         |
| `glue.secret_key`      | AWS Secret Access Key                                           | No       | Empty         |
| `glue.catalog_id`      | Glue カタログ ID（まだサポートされていません）                            | No       | Empty         |
| `glue.role_arn`        | Glueアクセス用のIAM Role ARN（まだサポートされていません）                    | No       | Empty         |
| `glue.external_id`     | Glueアクセス用のIAM External ID（まだサポートされていません）                 | No       | Empty         |

#### Example

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
### Iceberg Glue Rest カタログ

Iceberg Glue Rest CatalogはGlue Rest Catalogインターフェースを通じてGlueにアクセスします。現在、AWS S3 Table Bucketに保存されたIcebergTableのみをサポートしています。設定は以下の通りです：

| パラメータ名                        | 説明                                                             | 必須 | デフォルト値 |
|----------------------------------|-------------------------------------------------------------------|------|-------------|
| `type`                           | `iceberg`に固定                                                  | はい | None        |
| `iceberg.catalog.type`           | `rest`に固定                                                     | はい | None        |
| `iceberg.rest.uri`               | Glue Restサービスエンドポイント、例：`https://glue.ap-east-1.amazonaws.com/iceberg` | はい | None        |
| `warehouse`                      | Icebergデータウェアハウスパス、例：`<account_id>:s3tablescatalog/<bucket_name>` | はい | None        |
| `iceberg.rest.sigv4-enabled`     | V4署名形式を有効化、`true`に固定                                    | はい | None        |
| `iceberg.rest.signing-name`      | 署名タイプ、`glue`に固定                                           | はい | Empty       |
| `iceberg.rest.access-key-id`     | Glueアクセス用のAccess Key（S3 Bucketアクセスにも使用）             | はい | Empty       |
| `iceberg.rest.secret-access-key` | Glueアクセス用のSecret Key（S3 Bucketアクセスにも使用）             | はい | Empty       |
| `iceberg.rest.signing-region`    | AWS Glueリージョン、例：`us-east-1`                               | はい | Empty       |

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
## 許可ポリシー

使用シナリオに応じて、**read-only**と**read-write**のポリシーに分けることができます。

### 1. Read-Only Permissions

Glue CatalogからデータベースとTable情報の読み取りのみを許可します。

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

読み取り専用権限に基づいて、データベースとTableの作成/変更/削除を許可します。

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

    - `<region>` → あなたのAWSリージョン（例：`us-east-1`）
    - `<account-id>` → あなたのAWSアカウントID（12桁の数字）

2. 最小権限の原則

    - クエリのみの場合は、書き込み権限を付与しないでください。
    - `*` を特定のデータベース/TableのARNに置き換えることで、権限をさらに制限できます。

3. S3権限

    - 上記のポリシーはGlue Catalogのみに関係します。
    - データファイルを読み取る必要がある場合は、追加のS3権限が必要です（`s3:GetObject`、`s3:ListBucket`など）。
