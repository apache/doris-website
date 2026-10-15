---
{
    "title": "Apache Polaris との連携",
    "language": "ja",
    "description": "データレイク技術が進化し続ける中、AWS S3 などのオブジェクトストレージ上にある膨大なデータを効率的かつ安全に管理しながら"
}
---

データレイク技術が進化し続ける中、AWS S3 などのオブジェクトストレージ上にある大量のデータを効率的かつ安全に管理し、同時に Apache Doris などの上流の分析エンジンに統一されたアクセスポイントを提供することは、現代のデータアーキテクチャにおける重要な課題となっています。Apache Polaris は、Iceberg 向けのオープンで標準化された REST Catalog サービスとして、この課題に対する有効な解決策を提供します。メタデータを一元管理するだけでなく、きめ細かなアクセス制御と柔軟な認証情報管理の仕組みによって、データレイクのセキュリティと管理性を大きく向上させます。

この記事では、Apache Doris と Polaris を連携させ、S3 上の Iceberg データを効率的にクエリおよび管理する方法を詳しく説明します。環境の準備から最後のクエリまで、手順を追って説明します。

**このドキュメントで学べること：**

* **AWS 環境の準備**：AWS で S3 バケットを作成・設定し、Polaris と Doris に必要な IAM ロールとポリシーを準備する方法。これにより、Polaris 自身が S3 にアクセスし、Doris にアクセス用の認証情報を配布できるようにします。

* **Polaris のデプロイと設定**：サーバー上で Polaris サービスをダウンロードして起動し、Polaris で Iceberg Catalog、Namespace、および対応する Principal／Role／権限を作成して、Doris に安全なメタデータアクセス用エンドポイントを提供する方法。

* **Doris から Polaris への接続**：Doris が OAuth2 を通じて Polaris からメタデータアクセス用トークンを取得する仕組みと、基盤となるストレージにアクセスする次の二つの主な方法。

  1. Polaris が発行する一時的な AK/SK（Credential Vending の仕組み）
  2. Doris が静的な AK/SK を直接使用して S3 にアクセスする方法

> Doris バージョン 3.1+ が必要です。

## 1. AWS 環境の準備

最初に、AWS 上で S3 バケットと対応する IAM ロールを準備します。これらは、Polaris によるデータの管理と Doris によるデータへのアクセスの基盤となります。

### 1.1 S3 バケットを作成する

まず、後で作成する Iceberg テーブルのデータを保存するため、`polaris-doris-demo` という名前の S3 バケットを作成します。

```bash
# Create S3 storage bucket
aws s3 mb s3://polaris-doris-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep polaris-doris-demo
```

### 1.2 オブジェクトストレージへのアクセス用 IAM ロールを作成する

認証情報を安全に管理するため、Polaris が STS AssumeRole の仕組みを通じて使用する IAM ロールを作成します。この設計は、最小権限の原則と職務の分離というセキュリティ上のベストプラクティスに沿っています。

1. 信頼ポリシーファイルを作成する

    `polaris-trust-policy.json` ファイルを作成します。

    ```bash
    cat > polaris-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
            "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
            "StringEquals": {
                "sts:ExternalId": "polaris-doris-demo"
            }
            }
        }
        ]
    }
    EOF
    ```

    > 注：YOUR_ACCOUNT_ID を実際の AWS アカウント ID に置き換えてください。アカウント ID は `aws sts get-caller-identity --query Account --output text` で取得できます。

2. IAM ロールを作成する

    ```bash
    aws iam create-role \
        --role-name polaris-doris-demo \
        --assume-role-policy-document file:///path/to/polaris-trust-policy.json \
        --description "IAM Role for Polaris to access S3 storage"
    ```

3. S3 アクセス権限のポリシーをアタッチする

    ```bash
    aws iam attach-role-policy \
        --role-name polaris-doris-demo \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. 作成結果を確認する

    ```bash
    aws iam get-role --role-name polaris-doris-demo
    aws iam list-attached-role-policies --role-name polaris-doris-demo
    ```

### 1.3 IAM ロールを EC2 インスタンスに関連付ける（任意）

> この手順を行わない場合は、Polaris を起動する前に AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY を設定する必要があります。

Polaris サービスを EC2 インスタンスで実行する場合は、アクセスキーを使用するよりも、その EC2 インスタンスに IAM ロールを関連付けることを推奨します。これにより、コード内に認証情報を直接記述せずに済み、セキュリティが向上します。

1. EC2 インスタンスロールの信頼ポリシーを作成する

    まず、EC2 サービスがこのロールを引き受けられるようにする信頼ポリシーファイルを作成します。

    ```json
    cat > ec2-trust-policy.json << 'EOF'
    {
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Principal": {
            "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
        }
    ]
    }
    EOF
    ```

2. EC2 インスタンスロールを作成する

    ```bash
    aws iam create-role \
        --role-name polaris-ec2-role \
        --assume-role-policy-document file:///path/to/ec2-trust-policy.json \
        --description "IAM Role for EC2 instance running Polaris service"
    ```

3. S3 アクセス権限のポリシーをアタッチする

    ```bash
    # Attach AmazonS3FullAccess managed policy
    aws iam attach-role-policy \
        --role-name polaris-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. インスタンスプロファイルを作成する

    ```bash
    # Create instance profile
    aws iam create-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile

    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile \
        --role-name polaris-ec2-role
    ```

5. インスタンスプロファイルを EC2 インスタンスにアタッチする

    ```bash
    # If it's a newly created EC2 instance, specify during launch
    aws ec2 run-instances \
        --image-id ami-xxxxxxxxx \
        --instance-type t3.medium \
        --iam-instance-profile Name=polaris-ec2-instance-profile \
        --other-parameters...

    # If it's an existing EC2 instance, associate instance profile
    aws ec2 associate-iam-instance-profile \
        --instance-id i-xxxxxxxxx \
        --iam-instance-profile Name=polaris-ec2-instance-profile
    ```

## 2. Polaris のデプロイと Catalog の作成

環境の準備ができたら、Polaris サービスをデプロイして Catalog を設定します。

> このドキュメントでは、ソースコードを使用したクイックスタートの方法を説明します。その他のデプロイ方法については、https://polaris.apache.org/releases/1.0.1/getting-started/deploying-polaris/ を参照してください。

### 2.1 ソースコードをクローンして Polaris を起動する

1. Polaris のリポジトリをクローンし、特定のバージョンに切り替える

    ```bash
    git clone https://github.com/apache/polaris.git
    cd polaris
    # Recommend using a released stable version
    git checkout apache-polaris-1.0.1-incubating
    ```

2. AWS 認証情報を設定する（任意）

    Polaris を EC2 上で実行しない場合、または EC2 に適切な IAM ロールが関連付けられていない場合は、環境変数を使用して、`polaris-doris-demo` ロールを引き受ける権限を持つ AK/SK を Polaris に提供する必要があります。

    ```bash
    export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    ```

3. Polaris をビルドして実行する

    Java 21+ と Docker 27+ がインストールされていることを確認してください。

    ```bash
    ./gradlew run -Dpolaris.bootstrap.credentials=POLARIS,root,secret
    ```

* `POLARIS` は realm です。
* `root` は `CLIENT_ID` です。
* `secret` は `CLIENT_SECRET` です。
* 認証情報を設定しない場合は、既定の認証情報 `POLARIS,root,s3cr3t` が使用されます。

このコマンドは Polaris サービスを起動します。既定ではポート `8181` で待ち受けます。

### 2.2 Polaris で Catalog と Namespace を作成する

1. **ROOT 認証情報を環境変数に設定する**

    ```bash
    export CLIENT_ID=root
    export CLIENT_SECRET=secret
    ```

2. Catalog を作成する（S3 ストレージを指定）

    ```bash
    ./polaris catalogs create \
    --storage-type s3 \
    --default-base-location s3://polaris-doris-test/polaris1 \
    --role-arn arn:aws:iam::<account_id>:role/polaris-doris-test \
    --external-id polaris-doris-test \
    doris_catalog
    ```

    * `--storage-type s3`：基盤となるストレージに S3 を指定します。
    * `--default-base-location`：Iceberg テーブルデータの既定のルートパスです。
    * `--role-arn`：Polaris サービスが S3 にアクセスするために引き受ける IAM ロールです。
    * `--external-id`：ロールを引き受ける際に使用する External ID です。IAM ロールの信頼ポリシーの設定と一致させます。

3. Namespace を作成する

    ```bash
    ./polaris namespaces create --catalog doris_catalog doris_demo
    ```

これにより、`doris_demo` という名前のデータベース（Namespace）が `doris_catalog` の下に作成されます。

### 2.3 Polaris のセキュリティロールと権限を設定する

Doris が `root` 以外のユーザーとしてアクセスできるよう、新しいユーザーとロールを作成して適切な権限を付与します。

1. Principal Role と Catalog Role を作成する

    ```bash
    # Create a Principal Role for aggregating permissions
    ./polaris principal-roles create doris_pr_role

    # Create a Catalog Role under doris_catalog
    ./polaris catalog-roles create --catalog doris_catalog doris_catalog_role
    ```

2. Catalog Role に権限を付与する

    ```bash
    # Grant doris_catalog_role permission to manage content within this Catalog
    ./polaris privileges catalog grant \
        --catalog doris_catalog \
        --catalog-role doris_catalog_role \
        CATALOG_MANAGE_CONTENT
    ```

3. Principal Role と Catalog Role を関連付ける

    ```bash
    # Assign doris_catalog_role to doris_pr_role
    ./polaris catalog-roles grant \
    --catalog doris_catalog \
    --principal-role doris_pr_role \
    doris_catalog_role
    ```

4. 新しい Principal（ユーザー）を作成し、Role を関連付ける

    ```bash
    # Create a new user (Principal) named doris_user
    ./polaris principals create doris_user
    # Example output: {"clientId": "6e155b128dc06c13", "clientSecret": "ce9fbb4cc91c43ff2955f2c6545239d7"}
    # Please note down this new client_id and client_secret pair, as Doris will use it for connection.

    # Bind doris_user to doris_pr_role
    ./polaris principal-roles grant \
    doris_pr_role \
    --principal doris_user
    ```

これで Polaris 側の設定はすべて完了です。作成した `doris_user` は、`doris_catalog` を管理する権限を `doris_pr_role` を通じて取得します。

## 3. Doris から Polaris への接続

ここでは、設定した Polaris サービスに接続する Iceberg Catalog を Doris で作成します。Doris は複数の認証方法の組み合わせに対応しています。

> **注：** この例では、OAuth2 の認証情報を使用して Polaris の REST サービスに接続します。また、Doris は `iceberg.rest.oauth2.token` を使用し、あらかじめ取得した Bearer Token を直接指定する方法にも対応しています。

### 方法 1：OAuth2 と一時的なストレージ認証情報（Credential Vending）

この方法を**最も推奨します**。Doris は OAuth2 の認証情報を使用して Polaris で認証し、メタデータを取得します。S3 上のデータファイルの読み書きが必要な場合は、Polaris に最小権限の一時的な S3 アクセス認証情報を要求します。

生成された `clientId` と `clientSecret` を `doris_user` 用の認証情報として使用します。

```sql
CREATE CATALOG polaris_vended PROPERTIES (
    'type' = 'iceberg',
    -- Catalog name in Polaris
    'warehouse' = 'doris_catalog',
    'iceberg.catalog.type' = 'rest',
    -- Polaris service address
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    -- Metadata authentication method
    'iceberg.rest.security.type' = 'oauth2',
    -- Replace with doris_user's client_id:client_secret
    'iceberg.rest.oauth2.credential' = 'client_id:client_secret',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 方法 2：OAuth2 と静的なストレージ認証情報（AK/SK）

この方法でも、Doris は OAuth2 を使用して Polaris のメタデータにアクセスしますが、S3 データへのアクセスには Doris Catalog の設定に直接記述した静的な AK/SK を使用します。設定は簡単で簡易的なテストに適していますが、セキュリティは低下します。

```sql
CREATE CATALOG polaris_aksk PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    'iceberg.rest.warehouse' = 'doris_catalog',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '6e155b128dc06c13:ce9fbb4cc91c43ff2955f2c6545239d7',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_S3_ACCESS_KEY',
    's3.secret_key' = 'YOUR_S3_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
    's3.region' = 'us-west-2'
);
```

## 4. Doris で接続を確認する

どちらの方法で Catalog を作成した場合でも、次の SQL を使用してエンドツーエンドの接続を確認できます。

```sql
-- Switch to the Catalog you created and the Namespace configured in Polaris
USE polaris_vended.doris_demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Polaris');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+---------+
-- | id   | name    |
-- +------+---------+
-- | 1    | Doris   |
-- | 2    | Polaris |
-- +------+---------+
```

上記の操作がすべて正常に完了すれば、Doris -> Polaris -> S3 というデータレイクの一連の処理を構築できています。

Doris を使用した Iceberg テーブルの管理について詳しくは、次を参照してください。

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
