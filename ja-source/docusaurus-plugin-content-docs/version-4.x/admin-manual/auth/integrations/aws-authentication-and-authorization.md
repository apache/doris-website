---
{
  "title": "AWSの認証と認可",
  "language": "ja",
  "description": "DorisはAWSサービスリソースへのアクセスを2つの認証方式でサポートしています：IAM UserとAssumed Role。"
}
---
Dorisは2つの認証方式でAWSサービスリソースにアクセスすることをサポートします：`IAM User`と`​​Assumed Role`​​です。本記事では、両方の方式でセキュリティ認証情報を設定し、Dorisの機能を使用してAWSサービスと連携する方法について説明します。

# 認証方式の概要

## IAM User認証

Dorisは`AWS IAM User`認証情報（`access_key`と`secret_key`に相当）を設定することで外部データソースにアクセスできます。以下に詳細な設定手順を示します（詳細については、AWS文書[IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)を参照してください）：

### Step1 IAM Userの作成とポリシーの設定

1. `AWS Console`にログインして`IAM User`​を作成します

![](/images/integrations/create_iam_user.png)

2. IAM User名を入力し、ポリシーを直接アタッチします​

![](/images/integrations/iam_user_attach_policy1.png)

3. ポリシーエディターでAWSリソースポリシーを定義します​​。以下はS3バケットにアクセスするための読み取り/書き込みポリシーテンプレートです

![](/images/integrations/iam_user_attach_policy2.png)

S3読み取りポリシーテンプレート​。読み取り/リストアクセスを必要とするDoris機能に適用されます。例：S3 Load、TVF、External カタログ

**注意:&#x20;**

1. **`your-bucket`と`your-prefix`を実際の値に置き換えてください。**

2. **余分な`/`区切り文字を追加しないでください。**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion",
            ],
            "Resource": "arn:aws:s3:::<your-bucket>/your-prefix/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<your-bucket>"
        }    
    ]
}
```
S3書き込みポリシーテンプレート（読み書きアクセスを必要とするDoris機能に適用、例：Export、Storage Vault、Repository）

**注意:**

1. **`your-bucket`と`your-prefix`を実際の値に置き換えてください。**

2. **余分な`/`セパレーターを追加しないでください。**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:AbortMultipartUpload",      
              "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<your-bucket>/<your-prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning",
                "s3:GetLifecycleConfiguration"
            ],
            "Resource": "arn:aws:s3:::<your-bucket>"
        }    
    ]
}
```
4. IAMユーザーの作成が完了したら、access/secret keyペアを作成します

![](/images/integrations/iam_user_create_ak_sk.png)

### Step2 SQLを使用してaccess/secret keyペアでdoris機能を使用する

Step 1のすべての設定が完了すると、`access_key`と`secret_key`が取得できます。以下の例に示すように、これらの認証情報を使用してdoris機能にアクセスします：

#### S3 Load

```SQL
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key" = "<your-secrety-key>"
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```
#### TVF

```SQL
  SELECT * FROM S3 (
      'uri' = 's3://your_bucket/path/to/tvf_test/test.parquet',
      'format' = 'parquet',
      's3.endpoint' = 's3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  )
```
#### 外部カタログ

```SQL
  CREATE CATALOG iceberg_catalog PROPERTIES (
      'type' = 'iceberg',
      'iceberg.catalog.type' = 'hadoop',
      'warehouse' = 's3://your_bucket/dir/key',
      's3.endpoint' = 's3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  );
```
#### Storage Vault

```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```
#### エクスポート

```SQL
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
)
```
#### リポジトリ

```SQL
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```
#### リソース

```SQL
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```
外部データに対するアクセス制御を実装するために、異なるビジネスロジック間で異なるIAM Userクレデンシャル（`access_key`と`secret_key`）を指定できます。

## Assumed Role認証

Assumed Roleは、AWS IAM Roleを引き受けることで外部データソースにアクセスできます（詳細については、AWSドキュメントの[assume role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html)を参照）。以下の図は設定ワークフローを示しています：

![](/images/integrations/assumed_role_flow.png)

用語：

`Source Account`: Assume Roleアクションを開始するAWSアカウント（Doris FE/BE EC2インスタンスが存在する場所）；

`Target Account`: 対象のS3バケットを所有するAWSアカウント；

`ec2_role`: ソースアカウントで作成されたロールで、Doris FE/BEを実行するEC2インスタンスにアタッチされます；

`bucket_role`: ターゲットアカウントで作成されたロールで、対象バケットにアクセスする権限を持ちます；

**注意事項：**

1. **ソースアカウントとターゲットアカウントは同じAWSアカウントでも構いません；**
2. **特にスケーリング操作時において、Doris FE/BEがデプロイされているすべてのEC2インスタンスに`ec_role`がアタッチされていることを確認してください。**

より詳細な設定手順は以下の通りです：

### Step1 前提条件

1. ソースアカウントで`ec2_role`が作成され、Doris FE/BEを実行するすべての`EC2 instances`にアタッチされていることを確認します；

2. ターゲットアカウントで`bucket_role`と対応するバケットが作成されていることを確認します；

`ec2_role`を`EC2 instances`にアタッチした後、以下のように`role_arn`を確認できます：

![](/images/integrations/ec2_instance.png)

### Step2 ソースアカウントのIAM Role（EC2インスタンスロール）の権限設定

1. [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)にログインし、`Access management` > `Roles`に移動します；
2. EC2インスタンスロールを見つけて、その名前をクリックします；
3. ロール詳細ページで`Permissions`タブに移動し、`Add permissions`をクリックしてから`Create inline policy`を選択します；
4. `Specify permissions`セクションで`JSON`タブに切り替え、以下のポリシーを貼り付けて`Review policy`をクリックします：

![](/images/integrations/source_role_permission.png)

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["sts:AssumeRole"],
            "Resource": "*"
        }
    ]
}
```
### Step3 ターゲットアカウントIAMロールの信頼ポリシーと権限を設定する

1. [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)にログインし、Access management > Roles​​に移動し、ターゲットロール（bucket_role）を見つけて、その名前をクリックします。

2. `​​Trust relationships`​​タブに移動し、`​​Edit trust policy`​​をクリックし、以下のJSON（<ec2_iam_role_arn>をあなたのEC2インスタンスロールARNに置き換える）を貼り付けます。​​Update policyをクリックします。

![](/images/integrations/target_role_trust_policy.png)

**注意: `Condition`セクションの`ExternalId`は、複数のソースユーザーが同じロールをassumeする必要がある場合を区別するために使用される任意の文字列パラメータです。設定した場合は、対応するDoris SQLステートメントに含めてください。ExternalIdの詳細な説明については、[aws doc](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)を参照してください。**

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "<ec2_iam_role_arn>"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "sts:ExternalId": "1001"
                }
            }
        }
    ]
}
```
3. ロール詳細ページで、`Permissions`タブに移動し、`Add permissions`をクリックして、`Create inline policy`を選択します。`JSON`タブで、要件に基づいて以下のポリシーのいずれかを貼り付けます；

![](/images/integrations/target_role_permission2.png)

S3読み取りポリシーテンプレート、読み取り/リストアクセスが必要なDoris機能に適用されます。例：S3 Load、TVF、External Catalog

**注意：**

1. **`your-bucket`と`your-prefix`を実際の値に置き換えてください。**

2. **余分な`/`セパレータを追加しないでください。**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```
S3書き込みポリシーテンプレート（読み書きアクセスを必要とするDoris機能に適用されます。例：Export、Storage Vault、Repository）

**注意事項：**

1. **`your-bucket`と`your-prefix`を実際の値に置き換えてください。**

2. **余分な`/`区切り文字を追加しないでください。**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:AbortMultipartUpload",      
              "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>"
        }
    ]
}
```
### Step4 `role_arn`と`external_id`フィールドに従って、SQLを通じてAssumed Roleでdoris機能を使用する

上記の設定を完了した後、ターゲットアカウントの`role_arn`と`external_id`（該当する場合）を取得します。
以下に示すように、これらのパラメータをdoris SQLステートメントで使用します：

共通の重要なキーパラメータ：

```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- option parameter
```
#### S3 Load

```SQL
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```
#### TVF

```SQL
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  )
```
#### 外部カタログ

```SQL
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  );
```
#### Storage Vault

```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- option parameter
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```
#### エクスポート

```SQL
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
)
```
#### リポジトリ

```SQL
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```
#### リソース

```SQL
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```
### AWS EKS Cluster IAM Role認証と認可

Amazon EKSクラスター内で実行されるアプリケーション（Apache Dorisなど）にAWS Identity and Access Management (IAM)権限を付与する必要がある場合、Amazon EKSでは以下の2つの主要な方法を提供しています：

**1.IAM Roles for Service Accounts (IRSA)​**

**2. EKS Pod Identity​**

どちらの方法も、EKSクラスター内でのIAM Role、対応するトラストポリシー、およびIAMポリシーの正しい設定が必要です。具体的な設定方法については、AWSの公式ドキュメントを参照してください：

[Granting AWS Identity and Access Management permissions to workloads on Amazon Elastic Kubernetes Service clusters](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam)

Doris FE/BEは`AWSCredentialsProviderChain`メソッドによる認証情報の自動検出と取得をサポートしています。

### Bucket Policy認証と認可

IAM Rolesを使用してデプロイされたDorisマシンの場合、インポート、エクスポート、およびTVFシナリオでは、Amazon S3 bucket policyを使用してAWS S3バケット内のオブジェクトへのアクセスを制御することもサポートしています。これにより、EC2マシンに関連付けられたユーザーのみにオブジェクトバケットへのアクセスを制限できます。具体的な手順は以下の通りです：

1、対象バケットのBucket Policyを設定します。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```
`arn:aws:iam::111122223333:root`をEC2マシンにバインドされたアカウントまたはRoleのARNに置き換えてください。

2、データアクセスには対応するSQL構文を使用してください。認証資格情報は自動的に検出されるため、手動でのAK/SKやARNの設定は不要です。

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```
Doris FE/BEは`AWSCredentialsProviderChain`メソッドを介して認証情報を自動的に検出および取得することをサポートしています。

参考ドキュメント：[Bucket Policy](https://docs.aws.amazon.com/zh_cn/AmazonS3/latest/userguide/example-bucket-policies.html)

### 認証方法のベストプラクティス
| 認証方法                                       | 適用シナリオ                                   | メリット | デメリット |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | -------- |
| AK/SK認証 | プライベートに展開され、セキュリティが管理されたストレージまたは非AWS S3オブジェクトストレージでのImport/Export/StorageVaultシナリオ。 | シンプルな設定、AWS S3と互換性のあるオブジェクトストレージをサポート。 | 秘密鍵漏洩のリスク、手動でのキーローテーションが必要。     |
| IAMロール認証 | 高セキュリティ要件を持つAWS S3パブリッククラウドでのImport/Export/StorageVaultシナリオ。 | 高セキュリティ、自動AWS認証情報ローテーション、一元化された権限設定。 | 複雑なBucket Policy/Trust設定プロセス。 |
| Bucket Policy認証 | 少数のバケットを持つAWS S3パブリッククラウドでのImport/Export/StorageVaultシナリオ | 適度な設定複雑さ、最小権限の原則に準拠、AWS認証情報を自動検出。 | 権限設定が様々なバケットポリシーに分散される。     |

### FAQ

#### 1. BEとRecyclerのAWS SDK DEBUGレベルログを設定するには？
be.confとdoris_cloud.confでaws_log_level=5を設定し、変更を適用するためにプロセスを再起動してください。
* タイプ：int32
* 説明：AWS SDKのログレベル

  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* デフォルト値: 2

#### 2.AWS SDK DEBUGレベルログを設定した後、be.log/recycler.logに以下のエラーが表示される:
`OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443 `

AWS VPCネットワーク設定またはファイアウォールポート設定に問題があり、対応するAWSリージョンのSTSサービスへのアクセスが妨げられていないかを確認してください（telnet host:portで接続性を検証）。
