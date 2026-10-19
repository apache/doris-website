---
{
    "title": "Apache Polaris와의 통합",
    "language": "ko",
    "description": "데이터 레이크 기술이 계속 발전함에 따라, 객체 스토리지(예: AWS S3)에 대규모 데이터를 효율적이고 안전하게 관리하면서 "
}
---

데이터 레이크 기술이 계속 발전하면서, 객체 스토리지(예: AWS S3)에 저장된 대규모 데이터를 효율적이고 안전하게 관리하고 상위 분석 엔진(예: Apache Doris)에 통합 액세스 지점을 제공하는 일이 현대 데이터 아키텍처의 핵심 과제가 되었습니다. Apache Polaris는 Iceberg의 개방형 표준 REST Catalog 서비스로서 이 과제에 이상적인 해결책을 제공합니다. 메타데이터를 중앙에서 관리할 뿐만 아니라 세분화된 액세스 제어와 유연한 자격 증명 관리 메커니즘을 통해 데이터 레이크의 보안과 관리 편의성을 크게 높입니다.

이 문서에서는 Apache Doris와 Polaris를 통합하여 S3의 Iceberg 데이터를 효율적으로 쿼리하고 관리하는 방법을 자세히 소개합니다. 환경 준비부터 최종 쿼리까지 전체 과정을 단계별로 안내합니다.

**이 문서를 통해 다음 내용을 빠르게 익힐 수 있습니다:**

* **AWS 환경 준비**: AWS에서 S3 스토리지 버킷을 생성하고 구성하는 방법과 Polaris 및 Doris에 필요한 IAM Role과 정책을 준비하는 방법을 설명합니다. 이를 통해 Polaris가 S3에 직접 액세스하고 Doris에 액세스 자격 증명을 배포할 수 있습니다.

* **Polaris 배포 및 구성**: 서버에서 Polaris 서비스를 다운로드하고 시작하는 방법과 Polaris에서 Iceberg Catalog, Namespace 및 관련 Principal/Role/권한을 생성하여 Doris에 안전한 메타데이터 액세스 엔드포인트를 제공하는 방법을 설명합니다.

* **Doris에서 Polaris에 연결**: Doris가 OAuth2를 통해 Polaris에서 메타데이터 액세스 토큰을 얻는 방법을 설명하고, 다음 두 가지 핵심 기반 스토리지 액세스 방식을 보여 줍니다:

  1. Polaris가 발급한 임시 AK/SK(Credential Vending 메커니즘)
  2. Doris가 정적 AK/SK를 직접 사용하여 S3에 액세스

> Doris 버전 3.1+ 필요

## 1. AWS 환경 준비 {#1-aws-environment-preparation}

시작하기 전에 AWS에서 S3 스토리지 버킷과 관련 IAM Role을 준비해야 합니다. 이는 Polaris의 데이터 관리와 Doris의 데이터 액세스를 위한 기반이 됩니다.

### 1.1 S3 스토리지 버킷 생성 {#11-create-s3-storage-bucket}

먼저 나중에 생성할 Iceberg 테이블 데이터를 저장하기 위해 `polaris-doris-demo`라는 S3 버킷을 생성합니다.

```bash
# Create S3 storage bucket
aws s3 mb s3://polaris-doris-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep polaris-doris-demo
```

### 1.2 객체 스토리지 액세스용 IAM Role 생성 {#12-create-iam-role-for-object-storage-access}

안전한 자격 증명 관리를 구현하려면 Polaris가 STS AssumeRole 메커니즘을 통해 사용할 IAM Role을 생성해야 합니다. 이 설계는 최소 권한 원칙과 직무 분리라는 보안 모범 사례를 따릅니다.

1. 신뢰 정책 파일 생성

    `polaris-trust-policy.json` 파일을 생성합니다:

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

    > 참고: YOUR_ACCOUNT_ID를 실제 AWS 계정 ID로 바꾸세요. 계정 ID는 `aws sts get-caller-identity --query Account --output text` 명령으로 확인할 수 있습니다.

2. IAM Role 생성

    ```bash
    aws iam create-role \
        --role-name polaris-doris-demo \
        --assume-role-policy-document file:///path/to/polaris-trust-policy.json \
        --description "IAM Role for Polaris to access S3 storage"
    ```

3. S3 액세스 권한 정책 연결

    ```bash
    aws iam attach-role-policy \
        --role-name polaris-doris-demo \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. 생성 결과 확인

    ```bash
    aws iam get-role --role-name polaris-doris-demo
    aws iam list-attached-role-policies --role-name polaris-doris-demo
    ```

### 1.3 EC2 인스턴스에 IAM Role 연결(선택 사항) {#13-bind-iam-role-to-ec2-instance-optional}

> 이 단계를 수행하지 않으면 Polaris를 시작하기 전에 AWS_ACCESS_KEY_ID와 AWS_SECRET_ACCESS_KEY를 설정해야 합니다

Polaris 서비스를 EC2 인스턴스에서 실행할 경우, 액세스 키를 사용하는 대신 해당 EC2 인스턴스에 IAM Role을 연결하는 것이 모범 사례입니다. 이렇게 하면 코드에 자격 증명을 하드코딩하지 않아도 되므로 보안이 강화됩니다.

1. EC2 인스턴스 Role의 신뢰 정책 생성

    먼저 EC2 서비스가 이 Role을 수임할 수 있도록 허용하는 신뢰 정책 파일을 생성합니다:

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

2. EC2 인스턴스 Role 생성

    ```bash
    aws iam create-role \
        --role-name polaris-ec2-role \
        --assume-role-policy-document file:///path/to/ec2-trust-policy.json \
        --description "IAM Role for EC2 instance running Polaris service"
    ```

3. S3 액세스 권한 정책 연결

    ```bash
    # Attach AmazonS3FullAccess managed policy
    aws iam attach-role-policy \
        --role-name polaris-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. 인스턴스 프로파일 생성

    ```bash
    # Create instance profile
    aws iam create-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile

    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile \
        --role-name polaris-ec2-role
    ```

5. EC2 인스턴스에 인스턴스 프로파일 연결

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

## 2. Polaris 배포 및 Catalog 생성 {#2-polaris-deployment-and-catalog-creation}

환경 준비가 완료되면 Polaris 서비스를 배포하고 Catalog를 구성합니다.

> 이 문서에서는 소스 코드를 이용한 빠른 시작 방식을 사용합니다. 다른 배포 옵션은 다음을 참조하세요: https://polaris.apache.org/releases/1.0.1/getting-started/deploying-polaris/

### 2.1 소스 코드 복제 및 Polaris 시작 {#21-clone-source-code-and-start-polaris}

1. Polaris 저장소 복제 및 특정 버전으로 전환

    ```bash
    git clone https://github.com/apache/polaris.git
    cd polaris
    # Recommend using a released stable version
    git checkout apache-polaris-1.0.1-incubating
    ```

2. AWS 자격 증명 설정(선택 사항)

    Polaris를 EC2에서 실행하지 않거나 EC2에 적절한 IAM Role이 연결되어 있지 않다면, `polaris-doris-demo` Role을 수임할 권한이 있는 AK/SK를 환경 변수로 Polaris에 제공해야 합니다.

    ```bash
    export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    ```

3. Polaris 컴파일 및 실행

    Java 21+와 Docker 27+가 설치되어 있어야 합니다.

    ```bash
    ./gradlew run -Dpolaris.bootstrap.credentials=POLARIS,root,secret
    ```

* `POLARIS`는 realm입니다
* `root`는 `CLIENT_ID`입니다
* `secret`은 `CLIENT_SECRET`입니다
* 자격 증명을 설정하지 않으면 미리 설정된 자격 증명인 `POLARIS,root,s3cr3t`를 사용합니다

이 명령은 Polaris 서비스를 시작하며, 기본적으로 `8181` 포트에서 수신 대기합니다.

### 2.2 Polaris에서 Catalog 및 Namespace 생성 {#22-create-catalog-and-namespace-in-polaris}

1. **ROOT 자격 증명을 환경 변수로 설정**

    ```bash
    export CLIENT_ID=root
    export CLIENT_SECRET=secret
    ```

2. Catalog 생성(S3 스토리지 지정)

    ```bash
    ./polaris catalogs create \
    --storage-type s3 \
    --default-base-location s3://polaris-doris-test/polaris1 \
    --role-arn arn:aws:iam::<account_id>:role/polaris-doris-test \
    --external-id polaris-doris-test \
    doris_catalog
    ```

    * `--storage-type s3`: 기반 스토리지를 S3로 지정합니다.
    * `--default-base-location`: Iceberg 테이블 데이터의 기본 루트 경로입니다.
    * `--role-arn`: Polaris 서비스가 S3에 액세스하기 위해 수임하는 IAM Role입니다.
    * `--external-id`: Role을 수임할 때 사용하는 외부 ID이며, IAM Role 신뢰 정책의 설정과 일치해야 합니다.

3. Namespace 생성

    ```bash
    ./polaris namespaces create --catalog doris_catalog doris_demo
    ```

이 명령은 `doris_demo`라는 데이터베이스(Namespace)를 `doris_catalog` 아래에 생성합니다.

### 2.3 Polaris 보안 Role 및 권한 구성 {#23-polaris-security-role-and-permission-configuration}

Doris가 `root` 이외의 사용자로 액세스할 수 있도록 새 사용자와 Role을 생성하고 적절한 권한을 부여해야 합니다.

1. Principal Role 및 Catalog Role 생성

    ```bash
    # Create a Principal Role for aggregating permissions
    ./polaris principal-roles create doris_pr_role

    # Create a Catalog Role under doris_catalog
    ./polaris catalog-roles create --catalog doris_catalog doris_catalog_role
    ```

2. Catalog Role에 권한 부여

    ```bash
    # Grant doris_catalog_role permission to manage content within this Catalog
    ./polaris privileges catalog grant \
        --catalog doris_catalog \
        --catalog-role doris_catalog_role \
        CATALOG_MANAGE_CONTENT
    ```

3. Principal Role과 Catalog Role 연결

    ```bash
    # Assign doris_catalog_role to doris_pr_role
    ./polaris catalog-roles grant \
    --catalog doris_catalog \
    --principal-role doris_pr_role \
    doris_catalog_role
    ```

4. 새 Principal(사용자) 생성 및 Role 연결

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

이제 Polaris 측 구성이 모두 완료되었습니다. 생성한 사용자 `doris_user`는 `doris_catalog` 관리 권한을 `doris_pr_role`을 통해 얻습니다.

## 3. Doris에서 Polaris에 연결 {#3-doris-connection-to-polaris}

이제 Doris에서 방금 구성한 Polaris 서비스에 연결하는 Iceberg Catalog를 생성합니다. Doris는 다양한 인증 방식을 유연하게 조합하여 사용할 수 있습니다.

> **참고:** 이 예제에서는 OAuth2 인증 자격 증명을 사용하여 Polaris의 REST 서비스에 연결합니다. 또한 Doris는 `iceberg.rest.oauth2.token`을 사용하여 미리 발급받은 Bearer Token을 직접 제공하는 방식도 지원합니다.

### 방법 1: OAuth2 + 임시 스토리지 자격 증명(Credential Vending) {#method-1-oauth2--temporary-storage-credentials-credential-vending}

이 방식이 **가장 권장하는** 방식입니다. Doris는 OAuth2 자격 증명으로 Polaris에 인증하고 메타데이터를 가져옵니다. S3의 데이터 파일을 읽거나 써야 할 때는 Polaris에 최소 권한이 부여된 임시 S3 액세스 자격 증명을 요청합니다.

`clientId`와 `clientSecret`은 `doris_user`에 대해 생성된 값을 사용합니다.

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

### 방법 2: OAuth2 + 정적 스토리지 자격 증명(AK/SK) {#method-2-oauth2--static-storage-credentials-aksk}

이 방식에서도 Doris는 OAuth2를 사용하여 Polaris 메타데이터에 액세스하지만, S3 데이터에 액세스할 때는 Doris Catalog 구성에 하드코딩된 정적 AK/SK를 사용합니다. 구성이 간단하여 빠른 테스트에 적합하지만 보안 수준은 더 낮습니다.

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

## 4. Doris에서 연결 확인 {#4-verify-connection-in-doris}

어떤 방식으로 Catalog를 생성했든 다음 SQL을 통해 전체 경로의 연결을 확인할 수 있습니다.

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

위 작업이 모두 정상적으로 완료되었다면 축하합니다! Doris -> Polaris -> S3로 이어지는 전체 데이터 레이크 파이프라인을 성공적으로 구축한 것입니다.

Doris를 사용한 Iceberg 테이블 관리에 관한 자세한 내용은 다음을 참조하세요:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
