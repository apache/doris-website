---
{
    "title": "Lakekeeper との連携",
    "language": "ja"
}
---

[Lakekeeper](https://lakekeeper.io/) は、Rust で書かれたオープンソースの Apache Iceberg REST Catalog 実装です。AWS S3、Alibaba Cloud OSS、MinIO など、複数のストレージバックエンドに対応する軽量で高性能なメタデータ管理サービスを提供します。

この記事では、Apache Doris と Lakekeeper を連携させ、Iceberg データを効率的にクエリおよび管理する方法を説明します。環境の準備から最終的なクエリまで、手順を追って進めます。

**この記事で学べること：**

* **AWS 環境の準備**：AWS で S3 バケットを作成・設定し、Lakekeeper に必要な IAM ロールとポリシーを用意して、Lakekeeper が S3 にアクセスし、Doris にアクセス認証情報を提供できるようにする方法。

* **Lakekeeper のデプロイと設定**：Docker Compose を使って Lakekeeper サービスをデプロイし、Lakekeeper に Project と Warehouse を作成して、Doris にメタデータへのアクセスエンドポイントを提供する方法。

* **Doris から Lakekeeper への接続**：Doris から Lakekeeper を介して Iceberg データにアクセスし、読み書きする方法。

## 1. AWS 環境の準備

まず、AWS で S3 バケットと対応する IAM ロールを準備します。これらは、Lakekeeper によるデータ管理と Doris によるデータアクセスの基盤となります。

### 1.1 S3 バケットの作成

後で作成する Iceberg テーブルのデータを保存するために、`lakekeeper-doris-demo` という名前の S3 バケットを作成します。

```bash
# Create S3 storage bucket
aws s3 mb s3://lakekeeper-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep lakekeeper-doris-demo
```

### 1.2 オブジェクトストレージにアクセスするための IAM ロールの作成

認証情報を安全に管理するため、Lakekeeper が STS AssumeRole を通じて使用する IAM ロールを作成します。この設計は、最小権限の原則と職務の分離というセキュリティのベストプラクティスに沿っています。

1. 信頼ポリシーファイルの作成

    `lakekeeper-trust-policy.json` ファイルを作成します：

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

    > 注：YOUR\_ACCOUNT\_ID を実際の AWS アカウント ID に置き換えてください。アカウント ID は `aws sts get-caller-identity --query Account --output text` で確認できます。YOUR\_USER は実際の IAM ユーザー名に置き換えてください。

2. IAM ロールの作成

    ```bash
    aws iam create-role \
        --role-name lakekeeper-sts-role \
        --assume-role-policy-document file://lakekeeper-trust-policy.json \
        --description "IAM Role for Lakekeeper to access S3 storage"
    ```

3. S3 アクセス権限ポリシーのアタッチ

    `lakekeeper-s3-policy.json` ファイルを作成します：

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

    ポリシーをロールにアタッチします：

    ```bash
    aws iam put-role-policy \
        --role-name lakekeeper-sts-role \
        --policy-name lakekeeper-s3-access \
        --policy-document file://lakekeeper-s3-policy.json
    ```

4. ユーザーへの AssumeRole 権限の付与

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

## 2. Lakekeeper のデプロイと Warehouse の作成

環境の準備が完了したら、Lakekeeper サービスをデプロイし、Warehouse を設定します。

### 2.1 Docker Compose を使った Lakekeeper のデプロイ

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

**主な設定パラメータ：**

| パラメータ | 説明 |
| --------- | ----------- |
| `LAKEKEEPER__PG_ENCRYPTION_KEY` | デフォルトの Postgres シークレットバックエンドを使用する場合に、Postgres に保存される機密情報の暗号化に使用します。十分に長いランダムな文字列を設定してください。 |
| `LAKEKEEPER__BASE_URI` | Lakekeeper サービスのベース URI です。`YOUR_HOST_IP` を実際のホスト IP アドレスに置き換えてください。 |
| `LAKEKEEPER__ENABLE_DEFAULT_PROJECT` | `true` に設定すると、デフォルト Project 機能が有効になります。 |

Lakekeeper を起動します：

```bash
docker compose up -d
```

起動後、次のエンドポイントにアクセスできます：

* Swagger UI: `http://YOUR_HOST_IP:8181/swagger-ui/`
* Web UI: `http://YOUR_HOST_IP:8181/ui`

### 2.2 Project と Warehouse の作成

1. Project の作成

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/project" \
      -H "Content-Type: application/json" \
      --data '{"project-name":"default"}'
    ```

    確認します：

    ```bash
    curl -s "http://localhost:8181/management/v1/project-list"
    ```

    レスポンス内の `project-id` を控えてください。後続の手順では、これを `PROJECT_ID` として使用します。

2. Warehouse の作成（Credential Vending モード）

    Credential Vending モードを使用する場合は、Warehouse 設定ファイル `create-warehouse-vc.json` を作成します：

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

    * `sts-enabled`：`true` に設定すると、Credential Vending が有効になります。
    * `assume-role-arn`：Lakekeeper が S3 にアクセスするために引き受ける IAM ロールの ARN です。

    Warehouse を作成します：

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-vc.json
    ```

3. Warehouse の作成（静的認証情報モード）

    Warehouse 設定ファイル `create-warehouse-static.json` を作成します：

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

    Warehouse を作成します：

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-static.json
    ```

4. Warehouse の作成結果の確認

    ```bash
    curl -s "http://localhost:8181/management/v1/warehouse" \
      -H "x-project-id: $PROJECT_ID"
    ```

5. Namespace の作成

    前の手順のレスポンス内の `warehouse-id` を控えてください。これを使って Namespace を作成します：

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

    これにより、Warehouse 内に `demo` という名前の Namespace（データベース）が作成されます。

これで、Lakekeeper 側の設定はすべて完了です。

## 3. Doris から Lakekeeper への接続

次に、設定した Lakekeeper サービスに接続する Iceberg Catalog を Doris に作成します。

### 方法 1：一時的なストレージ認証情報（Credential Vending）

これは**最も推奨される**方法です。S3 上のデータファイルを読み書きする際、Doris は Lakekeeper に一時的な最小権限の S3 アクセス認証情報を要求します。

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

### 方法 2：静的なストレージ認証情報（AK/SK）

この方法では、Doris が設定に直接記述された静的な AK/SK を使ってオブジェクトストレージにアクセスします。設定が簡単で手早いテストに適していますが、セキュリティは低くなります。

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

## 4. Doris での接続確認

Catalog の作成に使用した方法にかかわらず、次の SQL でエンドツーエンドの接続を確認できます。

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

上記の操作がすべて成功すれば、Doris -> Lakekeeper -> S3 という一連のデータレイクパイプラインが構築されています。

Doris による Iceberg テーブルの管理について詳しくは、次を参照してください：

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
