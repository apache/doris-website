---
{
    "title": "AWS の認証と認可",
    "language": "ja",
    "description": "Doris から AWS S3 にアクセスするための四つの認証方式（IAM ユーザー、Assumed Role、EKS の IRSA／Pod Identity、バケットポリシー）を、IAM ポリシーと SQL の例とともに説明します。",
    "keywords": [
        "Doris の AWS 認証",
        "Doris の S3 認可",
        "AWS IAM ユーザー",
        "AWS Assumed Role",
        "AWS sts AssumeRole",
        "EKS IRSA",
        "EKS Pod Identity",
        "S3 バケットポリシー",
        "AWSCredentialsProviderChain",
        "access_key secret_key",
        "role_arn external_id",
        "S3 Load の認証",
        "TVF の S3 認証",
        "External Catalog の S3 認可",
        "Storage Vault S3"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters / Architecture decision -->
<!-- Applicable scenario: Configure Doris to access AWS S3 / Cross-account S3 access / Doris credential management in EKS -->

Doris では、AWS と連携するための認証・認可方式を複数利用できます。これらの方式は、S3 Load、TVF、External Catalog、Storage Vault、Export、Repository、Resource など、AWS S3 リソースへのアクセスが必要な機能に適用されます。このドキュメントでは、AWS のセキュリティ認証情報を設定し、Doris から AWS サービスのリソースにアクセスする方法を説明します。

## 適用シナリオ

Doris は、次の四つの AWS 認証・認可方式をサポートします。デプロイ環境とセキュリティ要件に応じて選択してください。

| 認証方式 | 適用シナリオ | 利点 | 欠点 |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| IAM ユーザー（AK/SK） | セキュリティを管理できるオンプレミス環境、または AWS 以外の S3 互換オブジェクトストア（Load／Export／Storage Vault など） | 設定が簡単。AWS S3 プロトコル互換のオブジェクトストアで使用可能 | キーが漏えいするリスクがある。キーを手動でローテーションする必要がある |
| Assumed Role（IAM ロール） | Doris を AWS EC2 にデプロイし、アカウントをまたいで S3 にアクセスする必要がある、高いセキュリティが求められる環境 | セキュリティが高い。AWS 認証情報が自動的にローテーションされ、権限を一元管理できる | 信頼ポリシーと権限ポリシーの設定が比較的複雑 |
| EKS IAM ロール（IRSA／Pod Identity） | Doris を Amazon EKS クラスターにデプロイする場合 | Kubernetes ServiceAccount を通じて認証情報が自動的に注入される | EKS と IAM の連携に関する知識が必要 |
| バケットポリシー | AWS EC2 上で、少数のバケットに対して Load／Export／Storage Vault を使用する場合 | 最小権限の原則に従える。Doris が AWS 認証情報を自動的に検出する | 権限が各バケットに分散し、一元管理しにくい |

## 前提条件

- Doris FE/BE がデプロイされ、正常に稼働していること
- 対象の AWS アカウントとアクセス先の S3 バケットがあること
- そのアカウントで IAM を設定する権限（ユーザー／ロールの作成、ポリシーの変更）があること
- Assumed Role またはバケットポリシーを使用する場合は、Doris FE/BE が AWS EC2（または EKS クラスター）にデプロイされていること

---

## IAM ユーザーによる認証と認可

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: On-premise deployment / S3-protocol compatible object stores -->

Doris は、AWS IAM ユーザーの `access_key` と `secret_key` を使用して外部データソースにアクセスできます。背景情報については、AWS 公式ドキュメントの [IAM ユーザー](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html) を参照してください。

### ステップ 1：IAM ユーザーを作成し、ポリシーを設定する

1. AWS コンソールにサインインし、IAM サービスを開いて `Create user` をクリックします。

    ![](/images/integrations/create_iam_user.png)

2. IAM ユーザー名を入力します。`Set permissions` セクションで、ポリシーを直接アタッチする方法を選択します。

    ![](/images/integrations/iam_user_attach_policy1.png)

3. ポリシーエディターに、対象の AWS リソースポリシーを入力します。以下は、S3 バケットにアクセスするための一般的な読み取り／書き込みポリシーのテンプレートです。

    ![](/images/integrations/iam_user_attach_policy2.png)

    **注：**

    - **バケット名とプレフィックスパスを実際の値に置き換えてください**
    - **余分な「/」区切り文字を追加しないでください**

    S3 バケットの**読み取りポリシーのテンプレート**。S3 Load、TVF、External Catalog など、バケット内のオブジェクトの読み取りと一覧表示のみが必要な Doris の機能に使用します。

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

    S3 バケットの**書き込みポリシーのテンプレート**。Export、Storage Vault、Resource、Repository など、バケット内のオブジェクトの読み取り、一覧表示、書き込みが必要な Doris の機能に使用します。

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

4. IAM ユーザーを作成したら、そのユーザーの `access_key` と `secret_key` のキーペアを作成します。

    ![](/images/integrations/iam_user_create_ak_sk.png)

### ステップ 2：Doris SQL でアクセスキーを使用する

ステップ 1 が完了すると、`access_key` と `secret_key` が得られます。このキーペアを使用すると、Doris の各機能を利用できます。以下の SQL は代表的な使用例です。主な設定項目は次のとおりです。

```sql
"s3.access_key" = "<your-access-key>",
"s3.secret_key" = "<your-secret-key>"
```

**S3 Load**

```sql
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
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key" = "<your-secrety-key>"
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      'uri' = 's3://your_bucket/path/to/tvf_test/test.parquet',
      'format' = 'parquet',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  )
```

**External Catalog（外部カタログ）**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      'type' = 'iceberg',
      'iceberg.catalog.type' = 'hadoop',
      'warehouse' = 's3://your_bucket/dir/key',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  );
```

**Storage Vault（ストレージボールト）**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export（エクスポート）**

```sql
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
)
```

**Repository（リポジトリ）**

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

**Resource（リソース）**

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

業務ごとに異なる IAM ユーザーの `access_key` と `secret_key` を指定することで、外部データへのアクセスを細かく制御できます。

---

## Assumed Role による認証と認可

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: AWS EC2 deployment / Cross-account S3 access / Automatic credential rotation -->

Assumed Role は、AWS IAM ロールを引き受けて外部データソースへのアクセスを認証・認可します。背景情報については、AWS 公式ドキュメントの [IAM ロールへの切り替え](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html) を参照してください。次の図は、Assumed Role の設定全体の流れを示しています。

![](/images/integrations/assumed_role_flow.png)

### 用語の定義

| 用語 | 意味 |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------ |
| ソースアカウント | Assume Role を開始する AWS アカウント（この例では、Doris FE/BE をホストする EC2 インスタンスを所有するアカウント） |
| ターゲットアカウント | アクセス先の S3 バケットを所有する AWS アカウント |
| `ec2_role` | ソースアカウントに作成するロール。Doris FE/BE をホストするすべての EC2 インスタンスに関連付ける必要がある |
| `bucket_role` | ターゲットアカウントに作成するロール。対象バケットへのアクセス権限を付与する必要がある |

**注：**

1. **ソースアカウントとターゲットアカウントは、同じ AWS アカウントでも構いません。**
2. **スケールアウト時も含め、Doris FE/BE をホストするすべての EC2 インスタンスに `ec2_role` が関連付けられていることを確認してください。**

操作のデモは次のとおりです。

<a href="https://www.bilibili.com/video/BV1U3uezjEPW/?vd_source=20479f0462e74fcf98f1df731639610f">
  <img src="/images/iam-role-doris-demo.png" alt="AWS IAM ロール" />
</a>

### ステップ 1：準備

1. ソースアカウントで `ec2_role` を作成し、Doris FE/BE をホストするすべての EC2 インスタンスに関連付けます。
2. ターゲットアカウントで `bucket_role` と対応する S3 バケットを作成します。

EC2 インスタンスに `ec2_role` を関連付けると、次に示すようにコンソールで `role_arn` を確認できます。

![](/images/integrations/ec2_instance.png)

### ステップ 2：ソースアカウントの IAM ロールに権限ポリシーを追加する

EC2 インスタンスに関連付けたソースアカウントのロールに、`sts:AssumeRole` を許可するインラインポリシーを追加します。

1. [AWS IAM コンソール](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)にサインインし、左側のナビゲーションで `Access management > Roles` を選択します。
2. EC2 インスタンスに関連付けたロールを探し、そのロール名をクリックします。
3. ロールの詳細ページの `Permissions` セクションで `Add permissions` をクリックし、`Create inline policy` を選択します。
4. `Specify permissions` ステップで JSON タブに切り替え、次のポリシーを入力してから `Review policy` をクリックして保存します。

![](/images/integrations/source_role_permission.png)

```json
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

### ステップ 3：ターゲットアカウントの IAM ロールに信頼ポリシーと権限ポリシーを設定する

#### 3.1 信頼ポリシーを設定する

1. [AWS IAM コンソール](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)にサインインし、左側のナビゲーションで `Access management > Roles` を選択します。`Assumed Target Role`（`bucket_role`）を探し、ロール名をクリックして詳細ページを開きます。
2. `Trust relationships` タブに切り替えて `Edit trust policy` をクリックします。編集ページで次の JSON を入力し、`<ec2_iam_role_arn>` を EC2 インスタンスに関連付けたロールの ARN に置き換えてから、`Update policy` をクリックします。

![](/images/integrations/target_role_trust_policy.png)

**注：** `ExternalId` フィールドは `Condition` 内で省略できます。同じロールを複数のソースユーザーが引き受ける場合に、それぞれを区別するために使用します。`ExternalId` を設定した場合は、対応する Doris SQL 文でもその値を渡してください。`ExternalId` の詳細については、[AWS 公式ドキュメント](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)を参照してください。

```json
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

#### 3.2 権限ポリシーを設定する

ロールの詳細ページの `Permissions` セクションで `Add permissions` をクリックし、`Create inline policy` を選択します。`Specify permissions` ステップで JSON タブに切り替え、以下のポリシーを入力して `Review policy` をクリックして保存します。

![](/images/integrations/target_role_permission2.png)

**注：**

- **バケット名とプレフィックスパスを実際の値に置き換えてください**
- **余分な「/」区切り文字を追加しないでください**

S3 バケットの**読み取りポリシーのテンプレート**。S3 Load、TVF、External Catalog など、バケット内のオブジェクトの読み取りと一覧表示のみが必要な Doris の機能に使用します。

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

S3 バケットの**書き込みポリシーのテンプレート**。Export、Storage Vault、Resource、Repository など、バケット内のオブジェクトの読み取りと書き込みが必要な Doris の機能に使用します。

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

### ステップ 4：Doris SQL で `role_arn` と `external_id` を使用する

前のステップを完了すると、ターゲットアカウントの `role_arn` と、必要に応じて `external_id` が得られます。Doris SQL では、次の二つが主な設定項目です。

```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- Optional parameter
```

**S3 Load**

```sql
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
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  )
```

**External Catalog（外部カタログ）**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  );
```

**Storage Vault（ストレージボールト）**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- Optional parameter
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export（エクスポート）**

```sql
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
)
```

**Repository（リポジトリ）**

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

**Resource（リソース）**

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

---

## EKS クラスターでの IAM ロールによる認証と認可

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Doris deployed on Amazon EKS / Kubernetes -->

Amazon EKS クラスターで稼働する Apache Doris に AWS Identity and Access Management（IAM）の権限を付与する方法として、Amazon EKS は主に次の二つを提供しています。

1. **サービスアカウント用 IAM ロール（IRSA）**
2. **EKS Pod Identity**

どちらの方法でも、EKS クラスターで IAM ロール、その信頼ポリシー、IAM ポリシーを正しく設定する必要があります。詳細な設定手順については、AWS 公式ドキュメントの [Amazon Elastic Kubernetes Service クラスター上のワークロードに AWS Identity and Access Management 権限を付与する方法](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam)を参照してください。

EKS 側の設定が完了すると、Doris FE/BE は `AWSCredentialsProviderChain` を通じて認証情報を自動的に取得します。SQL で `access_key`／`secret_key` や `role_arn` を明示的に指定する必要はありません。

---

## バケットポリシーによる認証と認可

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: AWS EC2 deployment / Restrict S3 access to a specific account / Load, Export, TVF -->

IAM ロールを使用してデプロイした Doris では、Load、Export、TVF などの機能で Amazon S3 バケットポリシーを使い、S3 内のオブジェクトへのアクセスを保護することもできます。この方法では、EC2 インスタンスを所有するアカウントだけがバケットにアクセスできるように制限します。

### ステップ 1：対象バケットにバケットポリシーを設定する

以下のポリシーにある `arn:aws:iam::111122223333:root` を、EC2 インスタンスに関連付けたアカウントまたはロールの ARN に置き換えます。

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

### ステップ 2：Doris SQL から S3 に直接アクセスする（AK/SK や ARN の指定は不要）

バケットポリシーを設定した後は、SQL に `access_key`、`secret_key`、`role_arn` を指定する必要はありません。Doris FE/BE は `AWSCredentialsProviderChain` を通じて認証情報を自動的に取得します。

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```

参考：[バケットポリシーの例](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html)

---

## 認可方式のベストプラクティス

| 認可方式 | 適用シナリオ | 利点 | 欠点 |
| :-------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| AK/SK による認可 | セキュリティを管理できるオンプレミス環境、または AWS 以外の S3 オブジェクトストアでの Load／Export／Storage Vault | 設定が簡単。AWS S3 プロトコル互換のオブジェクトストアで使用可能 | キーが漏えいするリスクがある。キーを手動でローテーションする必要がある |
| IAM ロールによる認可 | セキュリティ要件の高い、AWS S3 パブリッククラウドでの Load／Export／Storage Vault | セキュリティが高い。AWS 認証情報が自動的にローテーションされ、権限を一元管理できる | バケットポリシーと信頼ポリシーの設定が複雑 |
| バケットポリシーによる認可 | バケット数が少ない、AWS S3 パブリッククラウドでの Load／Export／Storage Vault | 設定の複雑さが中程度。最小権限の原則に従える。AWS 認証情報が自動的に検出される | 権限が各バケットポリシーに分散する |

---

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: AWS authorization debugging / Enabling SDK logs -->

### Q：BE と Recycler の AWS SDK の DEBUG レベルログを有効にするには？

`be.conf` と `doris_cloud.conf` で `aws_log_level=5` を設定し、プロセスを再起動して変更を反映します。

`aws_log_level` パラメーターの説明は次のとおりです。

| 項目 | 説明 |
| :---------- | :------------------------- |
| 型 | int32 |
| 説明 | AWS SDK のログレベル |
| デフォルト | 2（Error） |

有効な値は次のとおりです。

```text
Off   = 0
Fatal = 1
Error = 2
Warn  = 3
Info  = 4
Debug = 5
Trace = 6
```

### Q：AWS SDK の DEBUG ログを有効にした後、be.log／recycler.log に `OpenSSL SSL_connect: Connection reset by peer` と表示される場合は？

エラーの例：

```text
OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443
```

対応するリージョンの STS サービスにアクセスできない原因がないか、AWS VPC のネットワーク設定またはファイアウォールのポート設定を確認します。次のコマンドで検証できます。

```shell
telnet sts.<region>.amazonaws.com 443
```
