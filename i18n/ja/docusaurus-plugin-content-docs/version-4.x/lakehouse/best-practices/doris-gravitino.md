---
{
    "title": "Apache Gravitino との連携",
    "language": "ja",
    "description": "データレイク技術の急速な発展に伴い、統一された安全な、"
}
---

データレイク技術の急速な発展に伴い、統一性、安全性、効率性を備えたレイクハウスアーキテクチャの構築は、企業のデジタルトランスフォーメーションにおける重要な課題となっています。次世代の統合メタデータ管理プラットフォームである Apache Gravitino は、マルチクラウドおよびマルチエンジン環境におけるデータガバナンスのための包括的なソリューションを提供します。さまざまなデータソースやコンピューティングエンジンを一元管理できるだけでなく、認証情報の払い出しの仕組みによって、データアクセスの安全性と制御可能性も確保します。

この記事では、Apache Doris と Apache Gravitino を連携させ、Iceberg REST Catalog に基づく最新のレイクハウスアーキテクチャを構築する方法を詳しく説明します。Gravitino の統合メタデータ管理機能と認証情報の動的な配布機能を利用することで、S3 上の Iceberg データに効率的かつ安全にアクセスできます。

**このドキュメントでは、次の内容を確認できます。**

* **AWS 環境の準備**: AWS で S3 バケットと IAM ロールを作成し、Gravitino 向けの安全な認証情報管理システムを設定して、一時的な認証情報を動的に配布する方法。

* **Gravitino のデプロイと設定**: Gravitino サービスを迅速にデプロイし、Iceberg REST Catalog を設定して、認証情報の払い出し機能を有効にする方法。

* **Doris から Gravitino への接続**: Doris が Gravitino の REST API を介して Iceberg データにアクセスする方法の詳細。

## 実践ガイド

### 1. AWS 環境の準備

始める前に、S3 バケットと適切に設計された IAM ロールの仕組みを含む AWS インフラストラクチャを準備します。これは、安全で信頼性の高いレイクハウスアーキテクチャを構築するための基盤です。

### 1.1 S3 バケットの作成

まず、Iceberg データを保存する専用の S3 バケットを作成します。

```bash
# Create S3 bucket
aws s3 mb s3://gravitino-iceberg-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep gravitino-iceberg-demo
```

### 1.2 IAM ロール構成の設計

認証情報を安全に管理するため、Gravitino が STS AssumeRole の仕組みを通じて使用する IAM ロールを作成します。この設計は、最小権限と職務分離というセキュリティ上のベストプラクティスに従っています。

**データアクセス用ロールの作成**

1. 信頼ポリシーファイルの作成

   `gravitino-trust-policy.json` ファイルを作成します。

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "AWS": [
                       "arn:aws:iam::YOUR_ACCOUNT_ID:root"
                   ]
               },
               "Action": "sts:AssumeRole"
           }
       ]
   }
   ```

2. IAM ロールの作成

   この例では簡潔にするため、AWS のマネージドポリシーをそのまま使用します。本番環境では、より細かく権限を制御してください。

   ```bash
   # Create IAM role
   aws iam create-role \
       --role-name gravitino-iceberg-access \
       --assume-role-policy-document file://gravitino-trust-policy.json \
       --description "Gravitino Iceberg data access role"

   # Attach S3 full access permissions (for testing, use fine-grained permissions in production)
   aws iam attach-role-policy \
       --role-name gravitino-iceberg-access \
       --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

3. IAM 設定の確認

    ロールの設定が正しいことを確認します。

    ```bash
    # Test role assumption functionality
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access \
        --role-session-name gravitino-test
    ```

    成功した場合のレスポンス例:

    ```json
    {
        "Credentials": {
            "AccessKeyId": "ASIA***************",
            "SecretAccessKey": "***************************",
            "SessionToken": "IQoJb3JpZ2luX2VjEOj...",
            "Expiration": "2025-07-23T08:33:30+00:00"
        }
    }
    ```

## 2. Gravitino のデプロイと設定

### 2.1 Gravitino のダウンロードとインストール

Gravitino のビルド済みパッケージを使用して、環境をすばやくセットアップします。

```bash
# Create working directory
mkdir gravitino-deployment && cd gravitino-deployment

# Download Gravitino main program
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-0.9.1-bin.tar.gz

# Download Iceberg REST server component
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-iceberg-rest-server-0.9.1-bin.tar.gz

# Extract and install
tar -xzf gravitino-0.9.1-bin.tar.gz
cd gravitino-0.9.1-bin
tar -xzf ../gravitino-iceberg-rest-server-0.9.1-bin.tar.gz --strip-components=1
```

### 2.2 必要な依存パッケージのインストール

AWS S3 と認証情報管理の機能を利用するには、追加の JAR パッケージをインストールする必要があります。

```bash
# Create necessary directory structure
mkdir -p catalogs/lakehouse-iceberg/libs
mkdir -p iceberg-rest-server/libs
mkdir -p logs
mkdir -p /tmp/gravitino

# Download Iceberg AWS bundle
wget https://repo1.maven.org/maven2/org/apache/iceberg/iceberg-aws-bundle/1.6.1/iceberg-aws-bundle-1.6.1.jar \
  -P catalogs/lakehouse-iceberg/libs/

# Download Gravitino AWS support package (core for vended-credentials functionality)
wget https://repo1.maven.org/maven2/org/apache/gravitino/gravitino-aws/0.9.1/gravitino-aws-0.9.1.jar \
  -P iceberg-rest-server/libs/

# Distribute JAR packages to various directories
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar iceberg-rest-server/libs/
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar libs/
cp iceberg-rest-server/libs/gravitino-aws-0.9.1.jar libs/
```

### 2.3 Gravitino サービスの設定

1. メインサービスの設定

    `conf/gravitino.conf` ファイルを作成または編集します。

    ```properties
    # Gravitino server basic configuration
    gravitino.server.webserver.host = 0.0.0.0
    gravitino.server.webserver.httpPort = 8090

    # Metadata store configuration (PostgreSQL/MySQL recommended for production)
    gravitino.entity.store = relational
    gravitino.entity.store.relational = JDBCBackend
    gravitino.entity.store.relational.jdbcUrl = jdbc:h2:file:/tmp/gravitino/gravitino.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.entity.store.relational.jdbcDriver = org.h2.Driver
    gravitino.entity.store.relational.jdbcUser = gravitino
    gravitino.entity.store.relational.jdbcPassword = gravitino

    # Enable Iceberg REST service
    gravitino.auxService.names = iceberg-rest

    # Iceberg REST service detailed configuration
    gravitino.iceberg-rest.classpath = iceberg-rest-server/libs, iceberg-rest-server/conf
    gravitino.iceberg-rest.host = 0.0.0.0
    gravitino.iceberg-rest.httpPort = 9001

    # Iceberg catalog backend configuration
    gravitino.iceberg-rest.catalog-backend = jdbc
    gravitino.iceberg-rest.uri = jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.iceberg-rest.jdbc-driver = org.h2.Driver
    gravitino.iceberg-rest.jdbc-user = iceberg
    gravitino.iceberg-rest.jdbc-password = iceberg123
    gravitino.iceberg-rest.jdbc-initialize = true
    gravitino.iceberg-rest.warehouse = s3://gravitino-iceberg-demo/warehouse
    gravitino.iceberg-rest.io-impl = org.apache.iceberg.aws.s3.S3FileIO
    gravitino.iceberg-rest.s3-region = us-west-2

    # Enable Vended-Credentials functionality
    # Note: Gravitino uses these AK/SK to call STS AssumeRole and obtain temporary credentials for distribution to clients
    gravitino.iceberg-rest.credential-providers = s3-token
    gravitino.iceberg-rest.s3-access-key-id = YOUR_AWS_ACCESS_KEY_ID
    gravitino.iceberg-rest.s3-secret-access-key = YOUR_AWS_SECRET_ACCESS_KEY
    gravitino.iceberg-rest.s3-role-arn = arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access
    gravitino.iceberg-rest.s3-region = us-west-2
    gravitino.iceberg-rest.s3-token-expire-in-secs = 3600
    ```

2. サービスの起動

    ```bash
    # Start Gravitino service
    ./bin/gravitino.sh start

    # Check service status
    ./bin/gravitino.sh status

    # View logs
    tail -f logs/gravitino-server.log
    ```

3. サービスの状態の確認

    ```bash
    # Verify main service
    curl -v http://localhost:8090/api/version

    # Verify Iceberg REST service
    curl -v http://localhost:9001/iceberg/v1/config
    ```

### 2.4 Gravitino のメタデータ構造の作成

REST API を介して必要なメタデータ構造を作成します。

```bash
# Create MetaLake
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lakehouse",
    "comment": "Gravitino lakehouse for Doris integration",
    "properties": {}
  }' http://localhost:8090/api/metalakes

# Create Iceberg Catalog
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iceberg_catalog",
    "type": "RELATIONAL",
    "provider": "lakehouse-iceberg",
    "comment": "Iceberg catalog with S3 storage and vended credentials",
    "properties": {
      "catalog-backend": "jdbc",
      "uri": "jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL",
      "jdbc-user": "iceberg",
      "jdbc-password": "iceberg123",
      "jdbc-driver": "org.h2.Driver",
      "jdbc-initialize": "true",
      "warehouse": "s3://gravitino-iceberg-demo/warehouse",
      "io-impl": "org.apache.iceberg.aws.s3.S3FileIO",
      "s3-region": "us-west-2"
    }
  }' http://localhost:8090/api/metalakes/lakehouse/catalogs
```

## 3. Doris から Gravitino への接続

### 3.1 払い出された認証情報の使用

Gravitino は一時的な認証情報を動的に生成し、Doris に配布します。

```sql
-- Create dynamic credential mode Catalog
CREATE CATALOG gravitino_vending PROPERTIES (
    'type' = 'iceberg',
    'warehouse' = 'warehouse',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 3.2 接続とデータ操作の確認

```sql
-- Verify connection
SHOW DATABASES FROM gravitino_vending;

-- Switch to vended credentials catalog
SWITCH gravitino_vending;

-- Create database and table
CREATE DATABASE demo;
USE gravitino_vending.demo;

CREATE TABLE gravitino_table (
    id INT,
    name STRING
)
PROPERTIES (
    'write-format' = 'parquet'
);

-- Insert test data
INSERT INTO gravitino_table VALUES (1, 'Doris'), (2, 'Gravitino');

-- Query verification
SELECT * FROM gravitino_table;
```

## まとめ

このガイドに従うことで、Gravitino と Doris に基づく最新のレイクハウスアーキテクチャを構築できます。このアーキテクチャは、高いパフォーマンスと可用性を提供するとともに、高度なセキュリティの仕組みによってデータアクセスの安全性とコンプライアンスを確保します。データ量の増加やビジネス要件の変化に応じて柔軟に拡張し、さまざまな企業のニーズに対応できます。
