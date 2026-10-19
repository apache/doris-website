---
{
    "title": "Lakekeeper 연동",
    "language": "ko"
}
---

[Lakekeeper](https://lakekeeper.io/)는 Rust로 작성된 오픈 소스 Apache Iceberg REST Catalog 구현체입니다. AWS S3, Alibaba Cloud OSS, MinIO 등 다양한 스토리지 백엔드를 지원하는 가볍고 성능이 뛰어난 메타데이터 관리 서비스를 제공합니다.

이 문서에서는 Apache Doris를 Lakekeeper와 연동하여 Iceberg 데이터를 효율적으로 쿼리하고 관리하는 방법을 안내합니다. 환경 준비부터 최종 쿼리 실행까지 전체 과정을 단계별로 설명합니다.

**이 문서에서 배울 내용:**

* **AWS 환경 준비**: AWS에서 S3 스토리지 버킷을 생성하고 구성하는 방법과 Lakekeeper에 필요한 IAM 역할 및 정책을 준비하는 방법을 알아봅니다. 이를 통해 Lakekeeper가 S3에 접근하고 Doris에 접근 자격 증명을 배포할 수 있습니다.

* **Lakekeeper 배포 및 구성**: Docker Compose로 Lakekeeper 서비스를 배포하고 Lakekeeper에 Project와 Warehouse를 생성하여 Doris에 메타데이터 접근 엔드포인트를 제공하는 방법을 알아봅니다.

* **Doris와 Lakekeeper 연결**: Doris를 사용하여 Lakekeeper를 통해 Iceberg 데이터를 읽고 쓰는 방법을 알아봅니다.

## 1. AWS 환경 준비 {#1-aws-environment-preparation}

시작하기 전에 AWS에 S3 스토리지 버킷과 해당 IAM 역할을 준비해야 합니다. 이는 Lakekeeper의 데이터 관리와 Doris의 데이터 접근을 위한 기반이 됩니다.

### 1.1 S3 스토리지 버킷 생성 {#11-create-s3-storage-bucket}

먼저 나중에 생성할 Iceberg 테이블 데이터를 저장할 `lakekeeper-doris-demo`라는 이름의 S3 버킷을 생성합니다.

```bash
# Create S3 storage bucket
aws s3 mb s3://lakekeeper-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep lakekeeper-doris-demo
```

### 1.2 객체 스토리지 접근을 위한 IAM 역할 생성 {#12-create-iam-role-for-object-storage-access}

안전한 자격 증명 관리를 구현하려면 Lakekeeper가 STS AssumeRole 메커니즘을 통해 사용할 IAM 역할을 생성해야 합니다. 이 설계는 최소 권한 원칙과 직무 분리에 관한 보안 모범 사례를 따릅니다.

1. 신뢰 정책 파일 생성

    `lakekeeper-trust-policy.json` 파일을 생성합니다:

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

    > 참고: YOUR\_ACCOUNT\_ID를 실제 AWS 계정 ID로 바꾸세요. 계정 ID는 `aws sts get-caller-identity --query Account --output text`로 확인할 수 있습니다. YOUR\_USER를 실제 IAM 사용자 이름으로 바꾸세요.

2. IAM 역할 생성

    ```bash
    aws iam create-role \
        --role-name lakekeeper-sts-role \
        --assume-role-policy-document file://lakekeeper-trust-policy.json \
        --description "IAM Role for Lakekeeper to access S3 storage"
    ```

3. S3 접근 권한 정책 연결

    `lakekeeper-s3-policy.json` 파일을 생성합니다:

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

    역할에 정책을 연결합니다:

    ```bash
    aws iam put-role-policy \
        --role-name lakekeeper-sts-role \
        --policy-name lakekeeper-s3-access \
        --policy-document file://lakekeeper-s3-policy.json
    ```

4. 사용자에게 AssumeRole 권한 부여

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

5. 생성 결과 확인

    ```bash
    aws iam get-role --role-name lakekeeper-sts-role
    aws iam list-role-policies --role-name lakekeeper-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role \
        --role-session-name lakekeeper-test
    ```

## 2. Lakekeeper 배포 및 Warehouse 생성 {#2-lakekeeper-deployment-and-warehouse-creation}

환경 준비가 완료되면 Lakekeeper 서비스를 배포하고 Warehouse를 구성합니다.

### 2.1 Docker Compose로 Lakekeeper 배포 {#21-deploy-lakekeeper-using-docker-compose}

`docker-compose.yml` 파일을 생성합니다:

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

**주요 구성 매개변수:**

| 매개변수 | 설명 |
| --------- | ----------- |
| `LAKEKEEPER__PG_ENCRYPTION_KEY` | 기본 Postgres 시크릿 백엔드를 사용할 때 Postgres에 저장된 민감한 시크릿을 암호화하는 데 사용합니다. 충분히 긴 무작위 문자열로 설정해야 합니다. |
| `LAKEKEEPER__BASE_URI` | Lakekeeper 서비스의 기본 URI입니다. `YOUR_HOST_IP`를 실제 호스트 IP 주소로 바꾸세요. |
| `LAKEKEEPER__ENABLE_DEFAULT_PROJECT` | `true`로 설정하면 기본 프로젝트 기능이 활성화됩니다. |

Lakekeeper를 시작합니다:

```bash
docker compose up -d
```

시작 후 다음 엔드포인트에 접근할 수 있습니다:

* Swagger UI: `http://YOUR_HOST_IP:8181/swagger-ui/`
* 웹 UI: `http://YOUR_HOST_IP:8181/ui`

### 2.2 Project 및 Warehouse 생성 {#22-create-project-and-warehouse}

1. Project 생성

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/project" \
      -H "Content-Type: application/json" \
      --data '{"project-name":"default"}'
    ```

    확인합니다:

    ```bash
    curl -s "http://localhost:8181/management/v1/project-list"
    ```

    응답의 `project-id`를 기록해 두세요. 이후 단계에서 `PROJECT_ID`로 사용합니다.

2. Warehouse 생성(Credential Vending 모드)

    Credential Vending 모드를 사용하려면 Warehouse 구성 파일 `create-warehouse-vc.json`을 생성합니다:

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

    * `sts-enabled`: `true`로 설정하여 Credential Vending을 활성화합니다.
    * `assume-role-arn`: Lakekeeper가 S3에 접근하기 위해 수임할 IAM 역할의 ARN입니다.

    Warehouse를 생성합니다:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-vc.json
    ```

3. Warehouse 생성(정적 자격 증명 모드)

    Warehouse 구성 파일 `create-warehouse-static.json`을 생성합니다:

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

    Warehouse를 생성합니다:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-static.json
    ```

4. Warehouse 생성 확인

    ```bash
    curl -s "http://localhost:8181/management/v1/warehouse" \
      -H "x-project-id: $PROJECT_ID"
    ```

5. Namespace 생성

    이전 단계의 응답에서 `warehouse-id`를 기록해 두세요. 이 값은 Namespace를 생성할 때 사용합니다:

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

    그러면 Warehouse 아래에 `demo`라는 이름의 Namespace(데이터베이스)가 생성됩니다.

이제 Lakekeeper 측의 모든 구성이 완료되었습니다.

## 3. Doris와 Lakekeeper 연결 {#3-doris-connection-to-lakekeeper}

이제 Doris에 방금 구성한 Lakekeeper 서비스에 연결하는 Iceberg Catalog를 생성합니다.

### 방법 1: 임시 스토리지 자격 증명(Credential Vending) {#method-1-temporary-storage-credentials-credential-vending}

이 방식은 **가장 권장하는** 방법입니다. S3의 데이터 파일을 읽거나 써야 할 때 Doris는 Lakekeeper에 최소 권한을 가진 임시 S3 접근 자격 증명을 요청합니다.

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

### 방법 2: 정적 스토리지 자격 증명(AK/SK) {#method-2-static-storage-credentials-aksk}

이 방식에서는 Doris가 구성에 하드코딩된 정적 AK/SK를 직접 사용하여 객체 스토리지에 접근합니다. 구성이 간단하여 빠르게 테스트하기에 적합하지만 보안 수준은 낮습니다.

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

## 4. Doris에서 연결 확인 {#4-verify-connection-in-doris}

어떤 방법으로 Catalog를 생성했든 다음 SQL로 전체 구간의 연결을 확인할 수 있습니다.

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

위의 모든 작업이 정상적으로 완료되었다면 축하합니다! Doris -> Lakekeeper -> S3로 이어지는 전체 데이터 레이크 파이프라인을 성공적으로 구축했습니다.

Doris를 사용하여 Iceberg 테이블을 관리하는 방법에 대한 자세한 내용은 다음 문서를 참조하세요:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
