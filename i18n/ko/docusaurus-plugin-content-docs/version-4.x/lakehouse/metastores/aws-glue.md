---
{
    "title": "AWS Glue",
    "language": "ko",
    "description": "이 문서는 CREATE CATALOG를 통해 AWS Glue Catalog를 사용하여 Iceberg 테이블 또는 Hive 테이블에 액세스할 때의 매개변수 구성을 설명합니다."
}
---

이 문서는 **AWS Glue Catalog**를 사용하여 **Iceberg 테이블** 또는 **Hive 테이블**에 액세스할 때 `CREATE CATALOG`에 설정할 매개변수를 설명합니다.

## 지원되는 Glue Catalog 유형 {#supported-glue-catalog-types}

AWS Glue Catalog는 현재 세 가지 유형의 Catalog를 지원합니다:

| Catalog 유형 | 유형 식별자 (`type`) | 설명                                    |
|-------------|-------------------------|------------------------------------------------|
| Hive        | glue                    | Hive Metastore에 연결하는 Catalog      |
| Iceberg     | glue                    | Iceberg 테이블 형식에 연결하는 Catalog |
| Iceberg     | rest                    | Glue Rest Catalog를 통해 Iceberg 테이블 형식에 연결하는 Catalog |

이 문서는 사용자가 쉽게 구성할 수 있도록 각 유형의 매개변수를 자세히 설명합니다.

## 공통 매개변수 개요 {#common-parameters-overview}
| 매개변수 이름            | 설명                                                   | 필수 여부 | 기본값 |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `glue.region`            | AWS Glue 리전. 예: `us-east-1`                          | 예      | 없음          |
| `glue.endpoint`          | AWS Glue 엔드포인트. 예: `https://glue.us-east-1.amazonaws.com` | 예      | 없음          |
| `glue.access_key`        | AWS Access Key ID                                            | 예      | 비어 있음         |
| `glue.secret_key`        | AWS Secret Access Key                                        | 예      | 비어 있음         |
| `glue.catalog_id`        | Glue Catalog ID(아직 지원되지 않음)                         | 아니요       | 비어 있음         |
| `glue.role_arn`          | Glue에 액세스하기 위한 IAM Role ARN(3.1.2+부터 지원)   | 아니요       | 비어 있음         |
| `glue.external_id`       | Glue에 액세스하기 위한 IAM External ID(3.1.2+부터 지원) | 아니요       | 비어 있음         |

### 인증 매개변수 {#authentication-parameters}

Glue에 액세스하려면 인증 정보가 필요하며, 다음 두 가지 방식을 지원합니다:

1. Access Key 인증

   `glue.access_key`와 `glue.secret_key`로 제공한 Access Key를 통해 Glue 액세스를 인증합니다.

2. IAM Role 인증(3.1.2+부터 지원)

   `glue.role_arn`으로 제공한 IAM Role을 통해 Glue 액세스를 인증합니다.

   이 방식을 사용하려면 Doris를 AWS EC2에 배포해야 하며, EC2 인스턴스에 Glue 액세스 권한이 있는 IAM Role이 연결되어 있어야 합니다.

   External ID를 통한 액세스가 필요한 경우 `glue.external_id`도 구성해야 합니다.

참고 사항:

- 두 가지 방식 중 하나 이상을 구성해야 합니다. 두 방식을 모두 구성하면 Access Key 인증이 우선 적용됩니다.

예제:

    ```sql
    CREATE CATALOG hive_glue_catalog PROPERTIES (
      'type' = 'hms',
      'hive.metastore.type' = 'glue',
      'glue.region' = 'us-east-1',
      'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
      -- Using Access Key authentication
      'glue.access_key' = '<YOUR_ACCESS_KEY>',
      'glue.secret_key' = '<YOUR_SECRET_KEY>'
      -- Or using IAM Role authentication
      -- 'glue.role_arn' = '<YOUR_ROLE_ARN>',
      -- 'glue.external_id' = '<YOUR_EXTERNAL_ID>'
    );
    ```

AWS 인증 및 권한 부여 구성 방법은 [AWS 인증 및 권한 부여](../../admin-manual/auth/integrations/aws-authentication-and-authorization.md) 문서를 참조하세요.

### Hive Glue Catalog {#hive-glue-catalog}

Hive Glue Catalog는 AWS Glue의 Hive Metastore 호환 인터페이스를 통해 Hive 테이블에 액세스하는 데 사용합니다. 구성은 다음과 같습니다:

| 매개변수 이름            | 설명                                                   | 필수 여부 | 기본값 |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `type`                   | `hms`로 고정                                               | 예      | 없음          |
| `hive.metastore.type`    | `glue`로 고정                                              | 예      | 없음          |
| `glue.region`            | AWS Glue 리전. 예: `us-east-1`                          | 예      | 없음          |
| `glue.endpoint`          | AWS Glue 엔드포인트. 예: `https://glue.us-east-1.amazonaws.com` | 예      | 없음          |
| `glue.access_key`        | AWS Access Key ID                                            | 아니요       | 비어 있음         |
| `glue.secret_key`        | AWS Secret Access Key                                        | 아니요       | 비어 있음         |
| `glue.catalog_id`        | Glue Catalog ID(아직 지원되지 않음)                         | 아니요       | 비어 있음         |
| `glue.role_arn`          | Glue에 액세스하기 위한 IAM Role ARN                             | 아니요       | 비어 있음         |
| `glue.external_id`       | Glue에 액세스하기 위한 IAM External ID                          | 아니요       | 비어 있음         |

#### 예제 {#example}

```sql
CREATE CATALOG hive_glue_catalog PROPERTIES (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

### Iceberg Glue Catalog {#iceberg-glue-catalog}

Iceberg Glue Catalog는 Glue Client를 통해 Glue에 액세스합니다. 구성은 다음과 같습니다:

| 매개변수 이름          | 설명                                                      | 필수 여부 | 기본값 |
|------------------------|------------------------------------------------------------------|----------|---------------|
| `type`                 | `iceberg`로 고정                                               | 예      | 없음          |
| `iceberg.catalog.type` | `glue`로 고정                                                  | 예      | 없음          |
| `warehouse`            | Iceberg 데이터 웨어하우스 경로. 예: `s3://my-bucket/iceberg-warehouse/` | 예      | s3://doris    |
| `glue.region`          | AWS Glue 리전. 예: `us-east-1`                             | 예      | 없음          |
| `glue.endpoint`        | AWS Glue 엔드포인트. 예: `https://glue.us-east-1.amazonaws.com` | 예      | 없음          |
| `glue.access_key`      | AWS Access Key ID                                               | 아니요       | 비어 있음         |
| `glue.secret_key`      | AWS Secret Access Key                                           | 아니요       | 비어 있음         |
| `glue.catalog_id`      | Glue Catalog ID(아직 지원되지 않음)                            | 아니요       | 비어 있음         |
| `glue.role_arn`        | Glue에 액세스하기 위한 IAM Role ARN(아직 지원되지 않음)            | 아니요       | 비어 있음         |
| `glue.external_id`     | Glue에 액세스하기 위한 IAM External ID(아직 지원되지 않음)         | 아니요       | 비어 있음         |

#### 예제 {#example-1}

```sql
CREATE CATALOG iceberg_glue_catalog PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### Iceberg Glue Rest Catalog {#iceberg-glue-rest-catalog}

Iceberg Glue Rest Catalog는 Glue Rest Catalog 인터페이스를 통해 Glue에 액세스합니다. 현재 AWS S3 Table Bucket에 저장된 Iceberg 테이블만 지원합니다. 구성은 다음과 같습니다:

| 매개변수 이름                   | 설명                                                       | 필수 여부 | 기본값 |
|----------------------------------|-------------------------------------------------------------------|----------|---------------|
| `type`                           | `iceberg`로 고정                                                | 예      | 없음          |
| `iceberg.catalog.type`           | `rest`로 고정                                                   | 예      | 없음          |
| `iceberg.rest.uri`               | Glue Rest 서비스 엔드포인트. 예: `https://glue.ap-east-1.amazonaws.com/iceberg` | 예      | 없음          |
| `warehouse`                      | Iceberg 데이터 웨어하우스 경로. 예: `<account_id>:s3tablescatalog/<bucket_name>` | 예      | 없음          |
| `iceberg.rest.sigv4-enabled`     | V4 서명 형식 활성화. `true`로 고정                      | 예      | 없음          |
| `iceberg.rest.signing-name`      | 서명 유형. `glue`로 고정                                  | 예      | 비어 있음         |
| `iceberg.rest.access-key-id`     | Glue에 액세스하기 위한 Access Key(S3 Bucket 액세스에도 사용) | 예      | 비어 있음         |
| `iceberg.rest.secret-access-key` | Glue에 액세스하기 위한 Secret Key(S3 Bucket 액세스에도 사용) | 예      | 비어 있음         |
| `iceberg.rest.signing-region`    | AWS Glue 리전. 예: `us-east-1`                              | 예      | 비어 있음         |

#### 예제 {#example-2}

```sql
CREATE CATALOG glue_s3 PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'rest',
  'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
  'warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
  'iceberg.rest.sigv4-enabled' = 'true',
  'iceberg.rest.signing-name' = 'glue',
  'iceberg.rest.access-key-id' = '<ak>',
  'iceberg.rest.secret-access-key' = '<sk>',
  'iceberg.rest.signing-region' = '<region>'
);
```


## 권한 정책 {#permission-policies}

사용 시나리오에 따라 **읽기 전용** 정책과 **읽기 및 쓰기** 정책으로 나눌 수 있습니다.

### 1. 읽기 전용 권한 {#1-read-only-permissions}

Glue Catalog에서 데이터베이스와 테이블 정보를 읽는 작업만 허용합니다.

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadOnly",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 2. 읽기 및 쓰기 권한 {#2-read-write-permissions}

읽기 전용 권한에 더해 데이터베이스와 테이블의 생성, 수정, 삭제를 허용합니다.

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadWrite",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions",
        "glue:CreateDatabase",
        "glue:UpdateDatabase",
        "glue:DeleteDatabase",
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:DeleteTable"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 참고 사항 {#notes}

1. 자리 표시자 바꾸기

    - `<region>` → 사용 중인 AWS 리전(예: `us-east-1`).
    - `<account-id>` → 사용자의 AWS 계정 ID(12자리 숫자).

2. 최소 권한 원칙

    - 쿼리만 수행하는 경우 쓰기 권한을 부여하지 마세요.
    - `*`를 특정 데이터베이스 또는 테이블의 ARN으로 바꾸면 권한을 더 제한할 수 있습니다.

3. S3 권한

    - 위 정책은 Glue Catalog에만 적용됩니다.
    - 데이터 파일을 읽으려면 추가 S3 권한(예: `s3:GetObject`, `s3:ListBucket` 등)이 필요합니다.
