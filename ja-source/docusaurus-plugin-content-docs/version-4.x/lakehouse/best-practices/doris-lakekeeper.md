---
{
  "title": "Lakekeeperとの統合",
  "language": "ja"
}
---
[Lakekeeper](https://lakekeeper.io/)は、Rustで書かれたオープンソースのApache Iceberg REST Catalogの実装です。AWS S3、Alibaba Cloud OSS、MinIOを含む複数のストレージバックエンドをサポートする軽量で高性能なメタデータ管理サービスを提供します。

この記事では、Apache DorisとLakekeeperを統合してIcebergデータの効率的なクエリと管理を実現する方法をガイドします。環境準備から最終的なクエリまでの全プロセスを段階的に説明します。

**この文書を通じて、以下を学習できます:**

* **AWS環境準備**: AWSでS3ストレージバケットを作成・設定し、Lakekeeper用に必要なIAMロールとポリシーを準備して、LakekeeperがS3にアクセスし、Dorisにアクセス認証情報を配布できるようにする方法。

* **Lakekeeperのデプロイと設定**: Docker Composeを使用してLakekeeperサービスをデプロイし、LakekeeperでProjectとWarehouseを作成してDoris用のメタデータアクセスエンドポイントを提供する方法。

* **DorisのLakekeeperへの接続**: DorisでLakekeeper経由でIcebergデータにアクセスして読み書き操作を行う方法。

## 1. AWS環境準備

開始前に、AWSでS3ストレージバケットと対応するIAMロールを準備する必要があります。これはLakekeeperがデータを管理し、Dorisがデータにアクセスするための基盤となります。

### 1.1 S3ストレージバケットの作成

まず、後で作成するIcebergテーブルデータを保存するために、`lakekeeper-doris-demo`という名前のS3 Bucketを作成します。

```bash
# Create S3 storage bucket
aws s3 mb s3://lakekeeper-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep lakekeeper-doris-demo
```
### 1.2 Object Storage アクセス用のIAMロールの作成

セキュアな認証情報管理を実装するため、LakekeeperがSTS AssumeRoleメカニズムを通じて使用するIAMロールを作成する必要があります。この設計は、最小権限の原則と職務の分離というセキュリティベストプラクティスに従っています。

1. 信頼ポリシーファイルの作成

    `lakekeeper-trust-policy.json`ファイルを作成してください：

    ```bash
    cat > lakekeeper-trust-policy.json << 'EOF'
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
> 注意: YOUR\_ACCOUNT\_IDを実際のAWSアカウントIDに置き換えてください。これは`aws sts get-caller-identity --query Account --output text`で取得できます。YOUR\_USERを実際のIAMユーザー名に置き換えてください。

2. IAM Roleの作成

    ```bash
    aws iam create-role \
        --role-name lakekeeper-sts-role \
        --assume-role-policy-document file://lakekeeper-trust-policy.json \
        --description "IAM Role for Lakekeeper to access S3 storage"
    ```
3. S3アクセス権限ポリシーをアタッチする

    `lakekeeper-s3-policy.json`ファイルを作成します：

    ```bash
    cat > lakekeeper-s3-policy.json << 'EOF'
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
                "arn:aws:s3:::lakekeeper-doris-demo",
                "arn:aws:s3:::lakekeeper-doris-demo/*"
            ]
        }]
    }
    EOF
    ```
ポリシーをロールにアタッチします:

    ```bash
    aws iam put-role-policy \
        --role-name lakekeeper-sts-role \
        --policy-name lakekeeper-s3-access \
        --policy-document file://lakekeeper-s3-policy.json
    ```
4. ユーザーにAssumeRole権限を付与する

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-lakekeeper-role \
        --policy-document file://user-assume-policy.json
    ```
5. 作成結果の確認

    ```bash
    aws iam get-role --role-name lakekeeper-sts-role
    aws iam list-role-policies --role-name lakekeeper-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role \
        --role-session-name lakekeeper-test
    ```
## 2. Lakekeeper Deployment と Warehouse 作成

環境準備が完了した後、Lakekeeper サービスのデプロイと Warehouse の設定を開始します。

### 2.1 Docker Compose を使用した Lakekeeper のデプロイ

`docker-compose.yml` ファイルを作成します：

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -p 5432 -d postgres"]
      interval: 2s
      timeout: 10s
      retries: 10

  migrate:
    image: quay.io/lakekeeper/catalog:latest-main
    restart: "no"
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - RUST_LOG=info
    command: ["migrate"]
    depends_on:
      db:
        condition: service_healthy

  lakekeeper:
    image: quay.io/lakekeeper/catalog:latest-main
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - LAKEKEEPER__BASE_URI=http://YOUR_HOST_IP:8181
      - LAKEKEEPER__ENABLE_DEFAULT_PROJECT=true
      - RUST_LOG=info
    command: ["serve"]
    ports:
      - "8181:8181"
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy

volumes:
  pgdata:
```
**主要な設定パラメータ:**

| Parameter | Description |
| --------- | ----------- |
| `LAKEKEEPER__PG_ENCRYPTION_KEY` | デフォルトのPostgresシークレットバックエンドを使用する際に、Postgresに保存される機密シークレットを暗号化するために使用されます。十分に長いランダム文字列に設定する必要があります。 |
| `LAKEKEEPER__BASE_URI` | LakekeeperサービスのベースURIです。`YOUR_HOST_IP`を実際のホストIPアドレスに置き換えてください。 |
| `LAKEKEEPER__ENABLE_DEFAULT_PROJECT` | `true`に設定すると、デフォルトプロジェクト機能を有効にします。 |

Lakekeeperを開始:

```bash
docker compose up -d
```
起動後、以下のエンドポイントにアクセスできます：

* Swagger UI: `http://YOUR_HOST_IP:8181/swagger-ui/`
* Web UI: `http://YOUR_HOST_IP:8181/ui`

### 2.2 Projectとwarehouseの作成

1. Projectの作成

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/project" \
      -H "Content-Type: application/json" \
      --data '{"project-name":"default"}'
    ```
検証:

    ```bash
    curl -s "http://localhost:8181/management/v1/project-list"
    ```
レスポンスから`project-id`を記録してください。これは後続の手順で`PROJECT_ID`として使用されます。

2. Warehouseの作成（Credential Vendingモード）

    Credential Vendingモードを使用する必要がある場合は、warehouse設定ファイル`create-warehouse-vc.json`を作成してください：

    ```bash
    cat > create-warehouse-vc.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-vc-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse-vc",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": true,
        "flavor": "aws",
        "assume-role-arn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```
* `sts-enabled`: Credential Vendingを有効にするには`true`に設定します。
    * `assume-role-arn`: LakekeeperがS3にアクセスするために引き受けるIAM Role ARNです。

    warehouseを作成します：

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-vc.json
    ```
3. ウェアハウスの作成（Static Credentialsモード）

    ウェアハウス設定ファイル`create-warehouse-static.json`を作成します：

    ```bash
    cat > create-warehouse-static.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": false,
        "flavor": "aws"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```
ウェアハウスを作成する:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-static.json
    ```
4. Warehouseの作成を確認する

    ```bash
    curl -s "http://localhost:8181/management/v1/warehouse" \
      -H "x-project-id: $PROJECT_ID"
    ```
5. Namespaceの作成

    前のステップのレスポンスから`warehouse-id`を記録してください。これはNamespaceの作成に使用されます：

    ```bash
    curl -sS -X POST \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      "http://localhost:8181/catalog/v1/$WAREHOUSE_ID/namespaces" \
      -d '{
        "namespace": ["demo"],
        "properties": {}
      }'
    ```
これにより、Warehouse の下に `demo` という名前の Namespace（データベース）が作成されます。

この時点で、Lakekeeper 側の設定はすべて完了です。

## 3. Doris から Lakekeeper への接続

次に、新しく設定した Lakekeeper サービスに接続する Iceberg Catalog を Doris で作成します。

### 方法 1: 一時的なストレージ認証情報（Credential Vending）

これは**最も推奨される**アプローチです。S3 上のデータファイルの読み書きが必要な場合、Doris は Lakekeeper から一時的で最小権限の S3 アクセス認証情報を要求します。

```sql
CREATE CATALOG lakekeeper_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-vc-warehouse',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```
### 方法 2: 静的ストレージ認証情報 (AK/SK)

このアプローチでは、Dorisは設定にハードコードされた静的なAK/SKを直接使用してオブジェクトストレージにアクセスします。この方法は設定が簡単で迅速なテストに適していますが、セキュリティは低くなります。

```sql
CREATE CATALOG lakekeeper_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-warehouse',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
## 4. Dorisでの接続の確認

Catalogの作成にどの方法を使用した場合でも、以下のSQLを通じてエンドツーエンドの接続性を確認できます。

```sql
-- Switch to the Catalog and Namespace configured in Lakekeeper
USE lakekeeper_static.demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Lakekeeper');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+------------+
-- | id   | name       |
-- +------+------------+
-- | 1    | Doris      |
-- | 2    | Lakekeeper |
-- +------+------------+
```
上記のすべての操作が正常に完了した場合、おめでとうございます！完全なデータレイクパイプラインが正常に構築されました：Doris -> Lakekeeper -> S3。

DorisでIcebergテーブルを管理する方法の詳細については、以下をご覧ください：

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
