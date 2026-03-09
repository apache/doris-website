---
{
  "title": "Apache Polarisとの統合",
  "language": "ja",
  "description": "データレイク技術が進歩し続ける中、オブジェクトストレージ（AWS S3など）上で大量のデータを効率的かつ安全に管理しながら"
}
---
データレイクテクノロジーが継続的に進化する中で、オブジェクトストレージ（AWS S3など）上の膨大な量のデータを効率的かつ安全に管理し、上流の分析エンジン（Apache Dorisなど）に統一されたアクセスポイントを提供することが、現代のデータアーキテクチャにおける中核的な課題となっています。Apache PolarisはIcebergのオープンで標準化されたREST Catalogサービスとして、この課題に対する完璧なソリューションを提供します。集中的なメタデータ管理を処理するだけでなく、きめ細かなアクセス制御と柔軟なクレデンシャル管理メカニズムを通じて、データレイクのセキュリティと管理性を大幅に向上させます。

本記事では、Apache DorisとPolarisを統合してS3上のIcebergデータの効率的なクエリと管理を実現する方法について詳細に説明します。環境準備から最終的なクエリまでのプロセス全体を段階的にガイドします。

**このドキュメントを通じて、以下を迅速に学習できます：**

* **AWS環境の準備**: AWSでS3ストレージバケットを作成・設定し、PolarisとDoris両方に必要なIAMロールとポリシーを準備して、PolarisがS3にアクセスし、Dorisにアクセスクレデンシャルを配布できるようにする方法。

* **Polarisの展開と設定**: サーバー上でPolarisサービスをダウンロード・起動し、Polaris内でIceberg Catalog、Namespace、および対応するPrincipal/Role/権限を作成してDorisに安全なメタデータアクセスエンドポイントを提供する方法。

* **DorisのPolarisへの接続**: DorisがOAuth2を通じてPolarisからメタデータアクセストークンを取得する方法を説明し、2つの中核的な基盤ストレージアクセス方式を実演します：

  1. Polarisが発行する一時的なAK/SK（Credential Vendingメカニズム）
  2. Dorisが静的なAK/SKを直接使用してS3にアクセス

> Dorisバージョン3.1+が必要

## 1. AWS環境の準備

開始する前に、AWS上でS3ストレージバケットと対応するIAMロールを準備する必要があります。これはPolarisがデータを管理し、Dorisがデータにアクセスするための基盤となります。

### 1.1 S3ストレージバケットの作成

まず、後で作成するIcebergテーブルデータを保存するために、`polaris-doris-demo`という名前のS3 Bucketを作成します。

```bash
# Create S3 storage bucket
aws s3 mb s3://polaris-doris-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep polaris-doris-demo
```
### 1.2 オブジェクトストレージアクセス用のIAMロール作成

安全な認証情報管理を実装するために、PolarisがSTS AssumeRoleメカニズムを通じて使用するIAMロールを作成する必要があります。この設計は、最小権限の原則と職務分離というセキュリティのベストプラクティスに従っています。

1. 信頼ポリシーファイルの作成

    `polaris-trust-policy.json`ファイルを作成します：

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
> 注意: YOUR_ACCOUNT_IDを実際のAWS Account IDに置き換えてください。AWS Account IDは`aws sts get-caller-identity --query Account --output text`で取得できます。

2. IAM Roleを作成する

    ```bash
    aws iam create-role \
        --role-name polaris-doris-demo \
        --assume-role-policy-document file:///path/to/polaris-trust-policy.json \
        --description "IAM Role for Polaris to access S3 storage"
    ```
3. S3アクセス権限ポリシーをアタッチする

    ```bash
    aws iam attach-role-policy \
        --role-name polaris-doris-demo \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```
4. 作成結果の確認

    ```bash
    aws iam get-role --role-name polaris-doris-demo
    aws iam list-attached-role-policies --role-name polaris-doris-demo
    ```
### 1.3 IAMロールをEC2インスタンスにバインドする（オプション）

> この手順を実行しない場合、Polarisを開始する前にAWS_ACCESS_KEY_IDとAWS_SECRET_ACCESS_KEYを設定する必要があります

PolarisサービスがEC2インスタンス上で実行される場合、アクセスキーを使用するよりも、そのEC2インスタンスにIAMロールをバインドすることがベストプラクティスです。これにより、コード内に認証情報をハードコーディングすることを避け、セキュリティが向上します。

1. EC2インスタンスロール用の信頼ポリシーを作成する

    まず、EC2サービスがこのロールを引き受けることを許可する信頼ポリシーファイルを作成します：

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
2. EC2インスタンスロールを作成する

    ```bash
    aws iam create-role \
        --role-name polaris-ec2-role \
        --assume-role-policy-document file:///path/to/ec2-trust-policy.json \
        --description "IAM Role for EC2 instance running Polaris service"
    ```
3. S3アクセス権限ポリシーをアタッチする

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
5. EC2インスタンスにインスタンスプロファイルをアタッチする

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
## 2. Polaris デプロイメントとカタログ作成

環境準備が完了した後、Polaris サービスのデプロイとカタログの設定を開始します。

> このドキュメントではソースコードクイックスタート方法を使用します。その他のデプロイメントオプションについては、https://polaris.apache.org/releases/1.0.1/getting-started/deploying-polaris/ を参照してください。

### 2.1 ソースコードのクローンと Polaris の起動

1. Polaris リポジトリをクローンし、特定のバージョンに切り替える

    ```bash
    git clone https://github.com/apache/polaris.git
    cd polaris
    # Recommend using a released stable version
    git checkout apache-polaris-1.0.1-incubating
    ```
2. AWS認証情報の設定（オプション）

    PolarisをEC2上で実行していない場合、またはEC2に適切なIAM Roleがバインドされていない場合は、環境変数を通じて`polaris-doris-demo`ロールを引き受ける権限を持つAK/SKをPolarisに提供する必要があります。

    ```bash
    export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    ```
3. Polarisをコンパイルして実行する

    Java 21+とDocker 27+がインストールされていることを確認してください。

    ```bash
    ./gradlew run -Dpolaris.bootstrap.credentials=POLARIS,root,secret
    ```
* `POLARIS` はrealm
* `root` は `CLIENT_ID`
* `secret` は `CLIENT_SECRET`
* 認証情報が設定されていない場合、事前設定された認証情報 `POLARIS,root,s3cr3t` を使用します

このコマンドはPolarisサービスを開始し、デフォルトでポート `8181` でリッスンします。

### 2.2 PolarisでCatalogとNamespaceを作成

1. **ROOT認証情報をエクスポート**

    ```bash
    export CLIENT_ID=root
    export CLIENT_SECRET=secret
    ```
2. カタログを作成する（S3ストレージを指すように）

    ```bash
    ./polaris catalogs create \
    --storage-type s3 \
    --default-base-location s3://polaris-doris-test/polaris1 \
    --role-arn arn:aws:iam::<account_id>:role/polaris-doris-test \
    --external-id polaris-doris-test \
    doris_catalog
    ```
* `--storage-type s3`: 基盤となるストレージをS3として指定します。
    * `--default-base-location`: Icebergテーブルデータのデフォルトルートパス。
    * `--role-arn`: PolarisサービスがS3アクセスのために引き受けるIAMロール。
    * `--external-id`: ロールを引き受ける際に使用される外部ID。IAMロール信頼ポリシーの設定と一致している必要があります。

3. Namespaceの作成

    ```bash
    ./polaris namespaces create --catalog doris_catalog doris_demo
    ```
これにより、`doris_catalog`の下に`doris_demo`という名前のデータベース（Namespace）が作成されます。

### 2.3 Polaris セキュリティロールと権限設定

Dorisが非`root`ユーザーとしてアクセスできるようにするために、新しいユーザーとロールを作成し、適切な権限を付与する必要があります。

1. Principal RoleとCatalog Roleの作成

    ```bash
    # Create a Principal Role for aggregating permissions
    ./polaris principal-roles create doris_pr_role

    # Create a Catalog Role under doris_catalog
    ./polaris catalog-roles create --catalog doris_catalog doris_catalog_role
    ```
2. Catalog Roleに権限を付与する

    ```bash
    # Grant doris_catalog_role permission to manage content within this Catalog
    ./polaris privileges catalog grant \
        --catalog doris_catalog \
        --catalog-role doris_catalog_role \
        CATALOG_MANAGE_CONTENT
    ```
3. Associate Principal ロールと Catalog ロールの関連付け

    ```bash
    # Assign doris_catalog_role to doris_pr_role
    ./polaris catalog-roles grant \
    --catalog doris_catalog \
    --principal-role doris_pr_role \
    doris_catalog_role
    ```
4. 新しいPrincipal（ユーザー）を作成してRoleをバインドする

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
この時点で、Polaris側の設定はすべて完了しています。`doris_pr_role`を通じて`doris_catalog`を管理する権限を取得する`doris_user`という名前のユーザーを作成しました。

## 3. DorisのPolarisへの接続

次に、新しく設定したPolarisサービスに接続するIceberg CatalogをDorisで作成します。Dorisは複数の柔軟な認証の組み合わせをサポートしています。

> **注意:** この例では、Polarisのrestサービスに接続するためにOAuth2認証クレデンシャルを使用します。さらに、Dorisは`iceberg.rest.oauth2.token`を使用して、事前に取得したBearer Tokenを直接提供することもサポートしています。

### 方法1: OAuth2 + 一時ストレージクレデンシャル（Credential Vending）

これは**最も推奨される**アプローチです。DorisはOAuth2クレデンシャルを使用してPolarisで認証し、メタデータを取得します。S3上のデータファイルの読み取り/書き込みが必要な場合、DorisはPolarisから一時的で最小権限のS3アクセスクレデンシャルを要求します。

`doris_user`用に生成された`clientId`と`clientSecret`を使用してください。

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
### 方法2: OAuth2 + 静的ストレージ認証情報 (AK/SK)

このアプローチでは、DorisはPolarisメタデータへのアクセスにOAuth2を使用しますが、S3データにアクセスする際は、Doris Catalog設定にハードコードされた静的なAK/SKを使用します。この方法は設定が簡単で迅速なテストに適していますが、セキュリティは低くなります。

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
## 4. Doris での接続確認

Catalog の作成にどの方法を使用した場合でも、以下の SQL を通じてエンドツーエンドの接続を確認できます。

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
上記のすべての操作が正常に完了した場合、おめでとうございます！完全なデータレイクパイプラインの構築に成功しました：Doris -> Polaris -> S3。

DorisでIcebergテーブルを管理する方法の詳細については、以下をご覧ください：

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
