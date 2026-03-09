---
{
  "title": "Apache Gravitino との統合",
  "language": "ja",
  "description": "データレイク技術の急速な発展に伴い、統一された安全な"
}
---
データレイク技術の急速な発展に伴い、統一された安全で効率的なlakehouseアーキテクチャの構築は、企業のデジタル変革における中核的な課題となっています。Apache Gravitinoは、次世代の統一メタデータ管理プラットフォームとして、マルチクラウドおよびマルチエンジン環境におけるデータガバナンスの完全なソリューションを提供します。様々なデータソースや計算エンジンの統一管理をサポートするだけでなく、credential vendingメカニズムを通じてデータアクセスのセキュリティと制御性を確保します。

本記事では、Apache DorisとApache Gravitinoを深く統合し、Iceberg REST Catalogに基づくモダンなlakehouseアーキテクチャを構築する方法について詳しく説明します。Gravitinoの統一メタデータ管理と動的なクレデンシャル配布機能により、S3上のIcebergデータへの効率的で安全なアクセスを実現できます。

**このドキュメントを通して、以下を素早く理解できます：**

* **AWS環境の準備**: AWSでS3バケットとIAMロールを作成し、Gravitino用の安全なクレデンシャル管理システムを設定し、一時的なクレデンシャルの動的配布を実装する方法。

* **Gravitinoのデプロイと設定**: Gravitinoサービスを迅速にデプロイし、Iceberg REST Catalogを設定し、vended-credentials機能を有効にする方法。

* **DorisのGravitinoへの接続**: DorisがGravitinoのREST APIを通じてIcebergデータにアクセスする方法の詳細な説明。

## ハンズオンガイド

### 1. AWS環境の準備

開始前に、S3バケットと慎重に設計されたIAMロールシステムを含む、AWS上の完全なインフラストラクチャを準備する必要があります。これは安全で信頼性の高いlakehouseアーキテクチャを構築するための基盤です。

### 1.1 S3バケットの作成

まず、Icebergデータを保存する専用のS3バケットを作成します：

```bash
# Create S3 bucket
aws s3 mb s3://gravitino-iceberg-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep gravitino-iceberg-demo
```
### 1.2 IAM Role アーキテクチャの設計

安全な認証情報管理を実装するために、STS AssumeRole メカニズムを通じて Gravitino が使用する IAM role を作成する必要があります。この設計は、最小権限の原則と職務の分離というセキュリティのベストプラクティスに従います。

**データアクセス Role の作成**

1. Trust Policy ファイルの作成

   `gravitino-trust-policy.json` ファイルを作成します：

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
2. IAM Role を作成する

   デモンストレーションを簡単にするため、AWS 管理ポリシーを直接使用します。本番環境では、より細かい権限制御を使用する必要があります。

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
3. IAM設定の確認

    ロール設定が正しいことを確認します：

    ```bash
    # Test role assumption functionality
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access \
        --role-session-name gravitino-test
    ```
成功レスポンスの例:

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
## 2. Gravitinoの展開と設定

### 2.1 Gravitinoのダウンロードとインストール

環境を迅速にセットアップするために、Gravitinoのプリコンパイル済みバージョンを使用します：

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
### 2.2 必要な依存関係のインストール

AWS S3と認証情報管理機能をサポートするために、追加のJARパッケージをインストールする必要があります：

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

1. メインサービス設定

    `conf/gravitino.conf` ファイルを作成または編集します：

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
2. サービスの開始

    ```bash
    # Start Gravitino service
    ./bin/gravitino.sh start

    # Check service status
    ./bin/gravitino.sh status

    # View logs
    tail -f logs/gravitino-server.log
    ```
3. サービスステータスの確認

    ```bash
    # Verify main service
    curl -v http://localhost:8090/api/version

    # Verify Iceberg REST service
    curl -v http://localhost:9001/iceberg/v1/config
    ```
### 2.4 Gravitino メタデータ構造の作成

REST API を通じて必要なメタデータ構造を作成します：

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
## 3. DorisのGravitinoへの接続

### 3.1 Vended Credentialsの使用

Gravitinoは動的に一時的な認証情報を生成し、Dorisに配布します：

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
## 概要

本ガイドを通じて、GravitinoとDorisをベースとした最新のlakehouseアーキテクチャを正常に構築できるようになります。このアーキテクチャは、高いパフォーマンスと高可用性を提供するだけでなく、高度なセキュリティメカニズムを通じてデータアクセスのセキュリティとコンプライアンスも確保します。データの規模が拡大し、ビジネス要件が変化するにつれて、このアーキテクチャは柔軟にスケールして、さまざまなエンタープライズレベルのニーズを満たすことができます。
