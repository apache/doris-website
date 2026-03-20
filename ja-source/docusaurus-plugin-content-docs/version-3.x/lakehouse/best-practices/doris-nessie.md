---
{
  "title": "Nessieとの統合",
  "description": "この記事では、Apache DorisとNessieを統合してIcebergデータの効率的なクエリと管理を実現する方法をガイドします。環境準備から最終的なクエリまでの全プロセスを段階的に説明します。",
  "language": "ja"
}
---
[Nessie](https://projectnessie.org/)は、データレイク用のオープンソーストランザクショナルカタログであり、データに対してGitライクなバージョン管理機能を提供します。Iceberg REST カタログの仕様を実装し、Apache Icebergを含む複数のtableフォーマットにわたってブランチ作成、タグ付け、タイムトラベルなどの機能をサポートします。

この記事では、Apache DorisとNessieを統合してIcebergデータの効率的なクエリと管理を実現する方法をガイドします。環境準備から最終的なクエリまでの全プロセスを段階的に説明します。

**この文書を通じて、以下を学習します：**

* **AWS環境の準備**: AWSでS3ストレージバケットを作成・設定する方法、およびNessie用の必要なIAMロールとポリシーを準備し、NessieがS3にアクセスしてDorisにアクセス認証情報を配布できるようにする方法。

* **Nessieのデプロイと設定**: Docker Composeを使用してNessieサービスをデプロイし、Dorisにメタデータアクセスエンドポイントを提供するためのWarehouseを設定する方法。

* **DorisのNessie接続**: DorisがNessie経由でIcebergデータにアクセスして読み書き操作を行う方法。

## 1. AWS環境の準備

開始前に、AWS上でS3ストレージバケットと対応するIAMロールを準備する必要があります。これは、Nessieがデータを管理し、Dorisがデータにアクセスするための基盤となります。

### 1.1 S3ストレージバケットの作成

まず、後で作成するIcebergTableデータを格納するために、`nessie-doris-demo`という名前のS3 バケットを作成します。

```bash
# Create S3 storage bucket
aws s3 mb s3://nessie-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep nessie-doris-demo
```
### 1.2 Object Storage アクセス用のIAMロールの作成（オプション）

Credential Vendingモードを使用する予定の場合、STS AssumeRoleメカニズムを通じてNessieが使用するIAMロールを作成する必要があります。この設計は、最小権限の原則と職務分離というセキュリティのベストプラクティスに従っています。

1. 信頼ポリシーファイルを作成する

    `nessie-trust-policy.json`ファイルを作成します：

    ```bash
    cat > nessie-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USER"
            },
            "Action": "sts:AssumeRole"
        }
        ]
    }
    EOF
    ```
> 注意: YOUR\_ACCOUNT\_IDを実際のAWSアカウントIDに置き換えてください。AWSアカウントIDは`aws sts get-caller-identity --query Account --output text`で取得できます。YOUR\_USERを実際のIAMユーザー名に置き換えてください。

2. IAMロールを作成する

    ```bash
    aws iam create-role \
        --role-name nessie-sts-role \
        --assume-role-policy-document file://nessie-trust-policy.json \
        --description "IAM Role for Nessie to access S3 storage"
    ```
3. S3アクセス許可ポリシーをアタッチする

    `nessie-s3-policy.json`ファイルを作成してください：

    ```bash
    cat > nessie-s3-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListBucketMultipartUploads",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::nessie-doris-demo",
                "arn:aws:s3:::nessie-doris-demo/*"
            ]
        }]
    }
    EOF
    ```
ロールにポリシーをアタッチします：

    ```bash
    aws iam put-role-policy \
        --role-name nessie-sts-role \
        --policy-name nessie-s3-access \
        --policy-document file://nessie-s3-policy.json
    ```
4. ユーザーにAssumeRole権限を付与する

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-nessie-role \
        --policy-document file://user-assume-policy.json
    ```
5. 作成結果の確認

    ```bash
    aws iam get-role --role-name nessie-sts-role
    aws iam list-role-policies --role-name nessie-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role \
        --role-session-name nessie-test
    ```
## 2. Nessie デプロイメントとWarehouse設定

環境準備が完了した後、NessieサービスのデプロイメントとWarehouseの設定を開始します。

### 2.1 Docker Composeを使用したNessieのデプロイ（Credential Vending Mode）

これは**最も推奨される**デプロイメント手法で、一時的な認証情報によってセキュリティを強化します。

AWS認証情報を保存するための`.env`ファイルを作成します：

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```
`docker-compose.yml`ファイルを作成します：

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie
        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse
        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.auth-type=APPLICATION_GLOBAL
        -Dnessie.catalog.service.s3.default-options.server-iam.enabled=true
        -Dnessie.catalog.service.s3.default-options.server-iam.assume-role=arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role
        -Dnessie.catalog.service.s3.default-options.server-iam.role-session-name=nessie-doris
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}

volumes:
  pgdata:
```
**Credential Vendingの主要設定パラメータ:**

| パラメータ | 説明 |
| --------- | ----------- |
| `nessie.version.store.type` | バージョンストアタイプ。PostgreSQLバックエンドにはJDBC2を使用。 |
| `nessie.catalog.default-warehouse` | デフォルトのwarehouse名。 |
| `nessie.catalog.warehouses.<name>.location` | IcebergTableデータを格納するS3ロケーション。 |
| `server-iam.enabled` | Credential Vendingを有効にするには`true`に設定。 |
| `server-iam.assume-role` | NessieがS3にアクセスするために引き受けるIAM Role ARN。 |
| `server-iam.role-session-name` | 引き受けたロールのセッション名。 |
| `auth-type` | アプリケーションレベルの認証情報を使用する場合は`APPLICATION_GLOBAL`に設定。 |

Nessieを開始:

```bash
docker compose up -d
```
起動後、Nessie APIに`http://YOUR_HOST_IP:19120`でアクセスできます。

### 2.2 Docker Composeを使用したNessieのデプロイ (Static Credentials Mode)

Credential Vendingが不要な場合は、クイックテストのためにstatic credentials modeを使用できます：

AWS認証情報を保存する`.env`ファイルを作成します：

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```
`docker-compose.yml` ファイルを作成します:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie

        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse

        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.access-key=urn:nessie-secret:quarkus:my-secrets-default
        -Dmy-secrets-default.name=${AWS_ACCESS_KEY_ID}
        -Dmy-secrets-default.secret=${AWS_SECRET_ACCESS_KEY}

    env_file:
      - .env

volumes:
  pgdata:
```
**主要な設定パラメータ:**

| Parameter | デスクリプション |
| --------- | ----------- |
| `nessie.version.store.type` | バージョンストアのタイプ。PostgreSQLバックエンドにはJDBC2を使用。 |
| `nessie.catalog.default-warehouse` | デフォルトのウェアハウス名。 |
| `nessie.catalog.warehouses.<name>.location` | IcebergTableデータを格納するS3の場所。 |
| `nessie.catalog.service.s3.default-options.region` | S3バケット用のAWSリージョン。 |

## 3. DorisからNessieへの接続

ここでは、Nessieサービスに接続するIceberg CatalogをDorisで作成します。

### 方法1: 一時的なストレージクレデンシャル（Credential Vending）

これは**最も推奨される**アプローチです。S3上のデータファイルの読み書きが必要な場合、DorisはNessieから一時的で最小権限のS3アクセスクレデンシャルをリクエストします。

```sql
CREATE CATALOG nessie_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```
> 注意: Nessie REST カタログ URIの形式は`http://HOST:PORT/iceberg/{branch}`であり、`main`がデフォルトのブランチ名です。

### 方法2: 静的ストレージ認証情報 (AK/SK)

このアプローチでは、Dorisが設定にハードコードされた静的なAK/SKを直接使用してオブジェクトストレージにアクセスします。この方法は設定が簡単で迅速なテストに適していますが、セキュリティは低くなります。

```sql
CREATE CATALOG nessie_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
## 4. Dorisでの接続確認

Catalogの作成にどの方法を使用したかに関係なく、以下のSQLを通じてエンドツーエンドの接続性を確認できます。

```sql
-- Switch to the カタログ
USE nessie_vc;

-- Create a namespace (database)
CREATE DATABASE demo;
USE demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'alice'), (2, 'bob');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+-------+
-- | id   | name  |
-- +------+-------+
-- | 1    | alice |
-- | 2    | bob   |
-- +------+-------+
```
上記のすべての操作が正常に完了した場合は、おめでとうございます！完全なデータレイクパイプライン Doris -> Nessie -> S3 の構築に成功しました。

Doris を使用してIcebergTableを管理する方法の詳細については、以下をご覧ください：

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
