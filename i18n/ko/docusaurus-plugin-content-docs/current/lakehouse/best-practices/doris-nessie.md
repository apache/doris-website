---
{
    "title": "Nessie 연동",
    "language": "ko",
    "description": "이 문서에서는 Apache Doris를 Nessie와 연동하여 Iceberg 데이터를 효율적으로 쿼리하고 관리하는 방법을 안내합니다. 환경 준비부터 최종 쿼리 실행까지 전체 과정을 단계별로 설명합니다."
}
---

[Nessie](https://projectnessie.org/)는 데이터 레이크를 위한 오픈 소스 트랜잭션 Catalog로, 데이터에 Git과 유사한 버전 관리 기능을 제공합니다. Iceberg REST Catalog 사양을 구현하며 Apache Iceberg를 비롯한 여러 테이블 형식에서 branching, tagging, time travel 같은 기능을 지원합니다.

이 문서에서는 Apache Doris를 Nessie와 연동하여 Iceberg 데이터를 효율적으로 쿼리하고 관리하는 방법을 안내합니다. 환경 준비부터 최종 쿼리 실행까지 전체 과정을 단계별로 설명합니다.

**이 문서에서 배울 내용:**

* **AWS 환경 준비**: AWS에서 S3 스토리지 버킷을 생성하고 구성하는 방법과 Nessie에 필요한 IAM 역할 및 정책을 준비하는 방법을 알아봅니다. 이를 통해 Nessie가 S3에 접근하고 Doris에 접근 자격 증명을 제공할 수 있습니다.

* **Nessie 배포 및 구성**: Docker Compose를 사용하여 Nessie 서비스를 배포하고, Doris에 메타데이터 접근 엔드포인트를 제공하도록 Warehouse를 구성하는 방법을 알아봅니다.

* **Doris와 Nessie 연결**: Doris에서 Nessie를 통해 Iceberg 데이터에 접근하여 읽기 및 쓰기 작업을 수행하는 방법을 알아봅니다.

## 1. AWS 환경 준비 {#1-aws-environment-preparation}

시작하기 전에 AWS에서 S3 스토리지 버킷과 해당 IAM 역할을 준비해야 합니다. 이는 Nessie가 데이터를 관리하고 Doris가 데이터에 접근하기 위한 기반이 됩니다.

### 1.1 S3 스토리지 버킷 생성 {#11-create-s3-storage-bucket}

먼저, 나중에 생성할 Iceberg 테이블 데이터를 저장할 `nessie-doris-demo`라는 이름의 S3 버킷을 생성합니다.

```bash
# Create S3 storage bucket
aws s3 mb s3://nessie-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep nessie-doris-demo
```

### 1.2 객체 스토리지 접근용 IAM 역할 생성(선택 사항) {#12-create-iam-role-for-object-storage-access-optional}

Credential Vending 모드를 사용하려면 Nessie가 STS AssumeRole 메커니즘을 통해 사용할 IAM 역할을 생성해야 합니다. 이 설계는 최소 권한 원칙과 역할 분리라는 보안 모범 사례를 따릅니다.

1. 신뢰 정책 파일 생성

    `nessie-trust-policy.json` 파일을 생성합니다.

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

    > 참고: YOUR\_ACCOUNT\_ID를 실제 AWS 계정 ID로 바꾸세요. 계정 ID는 `aws sts get-caller-identity --query Account --output text`로 확인할 수 있습니다. YOUR\_USER는 실제 IAM 사용자 이름으로 바꾸세요.

2. IAM 역할 생성

    ```bash
    aws iam create-role \
        --role-name nessie-sts-role \
        --assume-role-policy-document file://nessie-trust-policy.json \
        --description "IAM Role for Nessie to access S3 storage"
    ```

3. S3 접근 권한 정책 연결

    `nessie-s3-policy.json` 파일을 생성합니다.

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

    역할에 정책을 연결합니다.

    ```bash
    aws iam put-role-policy \
        --role-name nessie-sts-role \
        --policy-name nessie-s3-access \
        --policy-document file://nessie-s3-policy.json
    ```

4. 사용자에게 AssumeRole 권한 부여

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

5. 생성 결과 확인

    ```bash
    aws iam get-role --role-name nessie-sts-role
    aws iam list-role-policies --role-name nessie-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role \
        --role-session-name nessie-test
    ```

## 2. Nessie 배포 및 Warehouse 구성 {#2-nessie-deployment-and-warehouse-configuration}

환경 준비를 마쳤으면 Nessie 서비스를 배포하고 Warehouse를 구성합니다.

### 2.1 Docker Compose를 사용한 Nessie 배포(Credential Vending 모드) {#21-deploy-nessie-using-docker-compose-credential-vending-mode}

임시 자격 증명을 통해 보안을 강화하는 **가장 권장되는** 배포 방식입니다.

AWS 자격 증명을 저장할 `.env` 파일을 생성합니다.

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

`docker-compose.yml` 파일을 생성합니다.

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

**Credential Vending의 주요 구성 매개변수:**

| 매개변수 | 설명 |
| --------- | ----------- |
| `nessie.version.store.type` | 버전 저장소 유형입니다. PostgreSQL 백엔드에 JDBC2를 사용합니다. |
| `nessie.catalog.default-warehouse` | 기본 Warehouse 이름입니다. |
| `nessie.catalog.warehouses.<name>.location` | Iceberg 테이블 데이터를 저장할 S3 위치입니다. |
| `server-iam.enabled` | `true`로 설정하면 Credential Vending이 활성화됩니다. |
| `server-iam.assume-role` | Nessie가 S3에 접근하기 위해 수임할 IAM 역할의 ARN입니다. |
| `server-iam.role-session-name` | 수임한 역할의 세션 이름입니다. |
| `auth-type` | `APPLICATION_GLOBAL`로 설정하면 애플리케이션 수준의 자격 증명을 사용합니다. |

Nessie를 시작합니다.

```bash
docker compose up -d
```

시작한 후 `http://YOUR_HOST_IP:19120`에서 Nessie API에 접근할 수 있습니다.

### 2.2 Docker Compose를 사용한 Nessie 배포(정적 자격 증명 모드) {#22-deploy-nessie-using-docker-compose-static-credentials-mode}

Credential Vending이 필요하지 않다면 정적 자격 증명 모드를 사용하여 빠르게 테스트할 수 있습니다.

AWS 자격 증명을 저장할 `.env` 파일을 생성합니다.

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

`docker-compose.yml` 파일을 생성합니다.

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

**주요 구성 매개변수:**

| 매개변수 | 설명 |
| --------- | ----------- |
| `nessie.version.store.type` | 버전 저장소 유형입니다. PostgreSQL 백엔드에 JDBC2를 사용합니다. |
| `nessie.catalog.default-warehouse` | 기본 Warehouse 이름입니다. |
| `nessie.catalog.warehouses.<name>.location` | Iceberg 테이블 데이터를 저장할 S3 위치입니다. |
| `nessie.catalog.service.s3.default-options.region` | S3 버킷의 AWS 리전입니다. |

## 3. Doris와 Nessie 연결 {#3-doris-connection-to-nessie}

이제 Doris에서 Nessie 서비스에 연결하는 Iceberg Catalog를 생성합니다.

### 방법 1: 임시 스토리지 자격 증명(Credential Vending) {#method-1-temporary-storage-credentials-credential-vending}

**가장 권장되는** 방식입니다. Doris는 S3의 데이터 파일을 읽거나 써야 할 때 Nessie에 최소 권한의 임시 S3 접근 자격 증명을 요청합니다.

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

> 참고: Nessie REST Catalog URI 형식은 `http://HOST:PORT/iceberg/{branch}`이며, `main`은 기본 브랜치 이름입니다.

### 방법 2: 정적 스토리지 자격 증명(AK/SK) {#method-2-static-storage-credentials-aksk}

이 방식에서는 Doris가 구성에 하드코딩된 정적 AK/SK를 직접 사용하여 객체 스토리지에 접근합니다. 구성이 간단하고 빠른 테스트에 적합하지만 보안 수준은 낮습니다.

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

## 4. Doris에서 연결 확인 {#4-verify-connection-in-doris}

어떤 방식으로 Catalog를 생성했든 다음 SQL로 전체 구간의 연결을 확인할 수 있습니다.

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

위 작업이 모두 성공적으로 완료되었다면 축하합니다! Doris -> Nessie -> S3로 이어지는 전체 데이터 레이크 파이프라인을 성공적으로 구축했습니다.

Doris로 Iceberg 테이블을 관리하는 방법에 대한 자세한 내용은 다음 문서를 참고하세요.

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
