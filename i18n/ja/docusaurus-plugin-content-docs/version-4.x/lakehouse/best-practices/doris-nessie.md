---
{
    "title": "Nessie との連携",
    "language": "ja",
    "description": "この記事では、Apache Doris と Nessie を連携させ、Iceberg データを効率的にクエリ・管理する方法を説明します。環境の準備から最後のクエリまで、手順を追って紹介します。"
}
---

[Nessie](https://projectnessie.org/) は、データレイク向けのオープンソースのトランザクションカタログです。データに対して Git に似たバージョン管理機能を提供します。Iceberg REST Catalog 仕様を実装し、Apache Iceberg を含む複数のテーブル形式でブランチ、タグ、タイムトラベルなどの機能をサポートします。

この記事では、Apache Doris と Nessie を連携させ、Iceberg データを効率的にクエリ・管理する方法を説明します。環境の準備から最後のクエリまで、手順を追って紹介します。

**このドキュメントで学べること：**

* **AWS 環境の準備**：AWS で S3 ストレージバケットを作成・設定し、Nessie 用の IAM ロールとポリシーを準備する方法。これにより、Nessie が S3 にアクセスし、Doris にアクセス認証情報を配布できるようになります。

* **Nessie のデプロイと設定**：Docker Compose で Nessie サービスをデプロイし、Doris がメタデータにアクセスできるエンドポイントを提供するように Warehouse を設定する方法。

* **Doris から Nessie への接続**：Nessie を介して Doris から Iceberg データにアクセスし、読み書きする方法。

## 1. AWS 環境の準備

まず、AWS 上に S3 ストレージバケットと対応する IAM ロールを準備します。これが、Nessie によるデータ管理と Doris によるデータアクセスの基盤になります。

### 1.1 S3 ストレージバケットの作成

後で作成する Iceberg テーブルのデータを保存するために、`nessie-doris-demo` という名前の S3 バケットを作成します。

```bash
# Create S3 storage bucket
aws s3 mb s3://nessie-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep nessie-doris-demo
```

### 1.2 オブジェクトストレージにアクセスするための IAM ロールの作成（任意）

Credential Vending モードを使用する場合は、Nessie が STS AssumeRole を介して使用する IAM ロールを作成する必要があります。この設計は、最小権限と職務分離のセキュリティ上のベストプラクティスに従います。

1. 信頼ポリシーファイルを作成する

    `nessie-trust-policy.json` ファイルを作成します。

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

    > 注：YOUR\_ACCOUNT\_ID は実際の AWS アカウント ID に置き換えてください。ID は `aws sts get-caller-identity --query Account --output text` で取得できます。YOUR\_USER は実際の IAM ユーザー名に置き換えてください。

2. IAM ロールを作成する

    ```bash
    aws iam create-role \
        --role-name nessie-sts-role \
        --assume-role-policy-document file://nessie-trust-policy.json \
        --description "IAM Role for Nessie to access S3 storage"
    ```

3. S3 アクセス権限ポリシーをアタッチする

    `nessie-s3-policy.json` ファイルを作成します。

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

    ポリシーをロールにアタッチします。

    ```bash
    aws iam put-role-policy \
        --role-name nessie-sts-role \
        --policy-name nessie-s3-access \
        --policy-document file://nessie-s3-policy.json
    ```

4. ユーザーに AssumeRole 権限を付与する

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

5. 作成結果を確認する

    ```bash
    aws iam get-role --role-name nessie-sts-role
    aws iam list-role-policies --role-name nessie-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role \
        --role-session-name nessie-test
    ```

## 2. Nessie のデプロイと Warehouse の設定

環境の準備が完了したら、Nessie サービスをデプロイし、Warehouse を設定します。

### 2.1 Docker Compose による Nessie のデプロイ（Credential Vending モード）

これは、**最も推奨される**デプロイ方法です。一時的な認証情報を使用することでセキュリティを高めます。

AWS 認証情報を保存する `.env` ファイルを作成します。

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

`docker-compose.yml` ファイルを作成します。

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

**Credential Vending の主な設定パラメータ：**

| パラメータ | 説明 |
| --------- | ----------- |
| `nessie.version.store.type` | バージョンストアの種類。PostgreSQL バックエンドには JDBC2 を使用します。 |
| `nessie.catalog.default-warehouse` | デフォルトの Warehouse 名。 |
| `nessie.catalog.warehouses.<name>.location` | Iceberg テーブルのデータを保存する S3 の場所。 |
| `server-iam.enabled` | `true` に設定すると Credential Vending が有効になります。 |
| `server-iam.assume-role` | Nessie が S3 にアクセスするために引き受ける IAM ロールの ARN。 |
| `server-iam.role-session-name` | 引き受けたロールのセッション名。 |
| `auth-type` | アプリケーションレベルの認証情報を使用する場合は `APPLICATION_GLOBAL` に設定します。 |

Nessie を起動します。

```bash
docker compose up -d
```

起動後、`http://YOUR_HOST_IP:19120` から Nessie API にアクセスできます。

### 2.2 Docker Compose による Nessie のデプロイ（静的認証情報モード）

Credential Vending が不要な場合は、簡単なテスト用に静的認証情報モードを使用できます。

AWS 認証情報を保存する `.env` ファイルを作成します。

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

`docker-compose.yml` ファイルを作成します。

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

**主な設定パラメータ：**

| パラメータ | 説明 |
| --------- | ----------- |
| `nessie.version.store.type` | バージョンストアの種類。PostgreSQL バックエンドには JDBC2 を使用します。 |
| `nessie.catalog.default-warehouse` | デフォルトの Warehouse 名。 |
| `nessie.catalog.warehouses.<name>.location` | Iceberg テーブルのデータを保存する S3 の場所。 |
| `nessie.catalog.service.s3.default-options.region` | S3 バケットの AWS リージョン。 |

## 3. Doris から Nessie への接続

ここでは、Nessie サービスに接続する Iceberg Catalog を Doris で作成します。

### 方法 1：一時的なストレージ認証情報（Credential Vending）

これは**最も推奨される**方法です。S3 上のデータファイルを読み書きする際、Doris は Nessie に対して、権限を最小限に抑えた一時的な S3 アクセス認証情報を要求します。

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

> 注：Nessie REST Catalog の URI 形式は `http://HOST:PORT/iceberg/{branch}` です。`main` はデフォルトのブランチ名です。

### 方法 2：静的なストレージ認証情報（AK/SK）

この方法では、Doris は設定に直接記述した静的な AK/SK を使ってオブジェクトストレージにアクセスします。設定は簡単で、簡単なテストに適していますが、セキュリティは低くなります。

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

## 4. Doris での接続確認

どちらの方法で Catalog を作成した場合でも、次の SQL でエンドツーエンドの接続を確認できます。

```sql
-- Switch to the Catalog
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

上記の操作がすべて成功すれば、Doris -> Nessie -> S3 という一連のデータレイクパイプラインが構築できています。

Doris での Iceberg テーブルの管理について詳しくは、次のページを参照してください。

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
