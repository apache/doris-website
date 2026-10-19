---
{
    "title": "Apache Gravitino와의 통합",
    "language": "ko",
    "description": "데이터 레이크 기술이 빠르게 발전함에 따라 통합되고 안전한,"
}
---

데이터 레이크 기술이 빠르게 발전하면서 통합되고 안전하며 효율적인 레이크하우스 아키텍처를 구축하는 일이 기업 디지털 전환의 핵심 과제가 되었습니다. 차세대 통합 메타데이터 관리 플랫폼인 Apache Gravitino는 멀티 클라우드 및 멀티 엔진 환경에서 데이터 거버넌스를 위한 포괄적인 솔루션을 제공합니다. 다양한 데이터 소스와 컴퓨팅 엔진의 통합 관리를 지원할 뿐 아니라, credential vending 메커니즘을 통해 데이터 접근의 보안과 제어 가능성을 보장합니다.

이 문서에서는 Apache Doris와 Apache Gravitino를 긴밀하게 통합하여 Iceberg REST Catalog 기반의 최신 레이크하우스 아키텍처를 구축하는 방법을 자세히 설명합니다. Gravitino의 통합 메타데이터 관리와 동적 자격 증명 배포 기능을 활용하면 S3에 저장된 Iceberg 데이터에 효율적이고 안전하게 접근할 수 있습니다.

**이 문서에서 다음 내용을 빠르게 파악할 수 있습니다.**

* **AWS 환경 준비**: AWS에서 S3 버킷과 IAM 역할을 생성하고, Gravitino를 위한 안전한 자격 증명 관리 시스템을 구성하며, 임시 자격 증명의 동적 배포를 구현하는 방법을 설명합니다.

* **Gravitino 배포 및 설정**: Gravitino 서비스를 빠르게 배포하고, Iceberg REST Catalog를 설정하며, vended-credentials 기능을 활성화하는 방법을 설명합니다.

* **Doris와 Gravitino 연결**: Doris가 Gravitino의 REST API를 통해 Iceberg 데이터에 접근하는 방법을 자세히 설명합니다.

## 실습 가이드 {#hands-on-guide}

### 1. AWS 환경 준비 {#1-aws-environment-preparation}

시작하기 전에 S3 버킷과 체계적으로 설계된 IAM 역할 체계 등 필요한 인프라를 AWS에 준비해야 합니다. 이는 안전하고 안정적인 레이크하우스 아키텍처를 구축하는 기반입니다.

### 1.1 S3 버킷 생성 {#11-create-s3-bucket}

먼저 Iceberg 데이터를 저장할 전용 S3 버킷을 생성합니다.

```bash
# Create S3 bucket
aws s3 mb s3://gravitino-iceberg-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep gravitino-iceberg-demo
```

### 1.2 IAM 역할 아키텍처 설계 {#12-design-iam-role-architecture}

안전한 자격 증명 관리를 구현하려면 Gravitino가 STS AssumeRole 메커니즘을 통해 사용할 IAM 역할을 생성해야 합니다. 이 설계는 최소 권한과 직무 분리라는 보안 모범 사례를 따릅니다.

**데이터 접근 역할 생성**

1. 신뢰 정책 파일 생성

   `gravitino-trust-policy.json` 파일을 생성합니다.

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

2. IAM 역할 생성

   실습을 간소화하기 위해 AWS 관리형 정책을 그대로 사용합니다. 프로덕션 환경에서는 더 세분화된 권한 제어를 적용해야 합니다.

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

3. IAM 설정 확인

    역할이 올바르게 설정되었는지 확인합니다.

    ```bash
    # Test role assumption functionality
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access \
        --role-session-name gravitino-test
    ```

    성공 응답 예시:

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

## 2. Gravitino 배포 및 설정 {#2-gravitino-deployment-and-configuration}

### 2.1 Gravitino 다운로드 및 설치 {#21-download-and-install-gravitino}

미리 컴파일된 Gravitino 버전을 사용하여 환경을 빠르게 구성합니다.

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

### 2.2 필수 의존성 설치 {#22-install-required-dependencies}

AWS S3와 자격 증명 관리 기능을 지원하려면 JAR 패키지를 추가로 설치해야 합니다.

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

### 2.3 Gravitino 서비스 설정 {#23-configure-gravitino-service}

1. 메인 서비스 설정

    `conf/gravitino.conf` 파일을 생성하거나 편집합니다.

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

2. 서비스 시작

    ```bash
    # Start Gravitino service
    ./bin/gravitino.sh start

    # Check service status
    ./bin/gravitino.sh status

    # View logs
    tail -f logs/gravitino-server.log
    ```

3. 서비스 상태 확인

    ```bash
    # Verify main service
    curl -v http://localhost:8090/api/version

    # Verify Iceberg REST service
    curl -v http://localhost:9001/iceberg/v1/config
    ```

### 2.4 Gravitino 메타데이터 구조 생성 {#24-create-gravitino-metadata-structure}

REST API를 통해 필요한 메타데이터 구조를 생성합니다.

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

## 3. Doris와 Gravitino 연결 {#3-doris-connection-to-gravitino}

### 3.1 Vended Credentials 사용 {#31-using-vended-credentials}

Gravitino는 임시 자격 증명을 동적으로 생성하여 Doris에 배포합니다.

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

### 3.2 연결 및 데이터 작업 확인 {#32-verify-connection-and-data-operations}

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

## 요약 {#summary}

이 가이드를 따라 Gravitino와 Doris 기반의 최신 레이크하우스 아키텍처를 성공적으로 구축할 수 있습니다. 이 아키텍처는 높은 성능과 가용성을 제공할 뿐 아니라, 고급 보안 메커니즘을 통해 데이터 접근의 보안과 규정 준수를 보장합니다. 데이터 규모가 커지고 비즈니스 요구 사항이 변해도 다양한 기업 수준의 요구 사항을 충족하도록 유연하게 확장할 수 있습니다.
