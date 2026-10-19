---
{
    "title": "AWS 인증 및 권한 부여",
    "language": "ko",
    "description": "Doris가 AWS S3에 액세스하는 네 가지 인증 방식인 IAM User, Assumed Role, EKS IRSA/Pod Identity, Bucket Policy를 다루며, 전체 IAM 정책과 SQL 예제를 제공합니다.",
    "keywords": [
        "Doris AWS 인증",
        "Doris S3 권한 부여",
        "AWS IAM User",
        "AWS Assumed Role",
        "AWS sts AssumeRole",
        "EKS IRSA",
        "EKS Pod Identity",
        "S3 Bucket Policy",
        "AWSCredentialsProviderChain",
        "access_key secret_key",
        "role_arn external_id",
        "S3 Load 인증",
        "TVF S3 인증",
        "External Catalog S3 권한 부여",
        "Storage Vault S3"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters / Architecture decision -->
<!-- Applicable scenario: Configure Doris to access AWS S3 / Cross-account S3 access / Doris credential management in EKS -->

Doris는 AWS와 연동하여 인증 및 권한 부여를 수행하는 여러 방식을 제공합니다. 이러한 방식은 S3 Load, TVF, External Catalog, Storage Vault, Export, Repository, Resource를 비롯해 AWS S3 리소스에 액세스해야 하는 모든 기능에 적용됩니다. 이 문서에서는 AWS 보안 자격 증명을 구성하고 이를 사용하여 Doris에서 AWS 서비스 리소스에 액세스하는 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

Doris는 다음 네 가지 AWS 인증 및 권한 부여 방식을 지원합니다. 배포 환경과 보안 규정 준수 요구 사항에 맞는 방식을 선택하세요.

| 인증 방식                           | 적용 시나리오                                                                                                | 장점                                                                      | 단점                                                                |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| IAM User (AK/SK)                    | 보안을 직접 관리할 수 있는 온프레미스 배포 또는 AWS 이외의 S3 호환 객체 스토리지(Load/Export/Storage Vault 등) | 구성이 간단함. AWS S3 프로토콜과 호환되는 모든 객체 스토리지에서 사용 가능 | 키 유출 위험이 있음. 키를 수동으로 교체해야 함                      |
| Assumed Role (IAM Role)             | Doris를 AWS EC2에 배포하고 계정 간 S3 액세스가 필요한 높은 보안 수준의 시나리오                               | 보안성이 높음. AWS 자격 증명이 자동으로 교체됨. 권한을 중앙에서 관리함 | 신뢰 정책 및 권한 정책 구성이 비교적 복잡함                         |
| EKS IAM Role (IRSA / Pod Identity)  | Amazon EKS 클러스터에 Doris를 배포하는 경우                                                                   | Kubernetes ServiceAccount를 통해 자격 증명이 자동으로 주입됨 | EKS / IAM 연동에 대한 이해가 필요함                                 |
| Bucket Policy                       | 버킷 수가 적고 AWS EC2에서 Load/Export/Storage Vault를 사용하는 시나리오                                      | 최소 권한 원칙을 따름. Doris가 AWS 자격 증명을 자동으로 감지함 | 권한이 개별 버킷에 분산되어 중앙 관리가 어려움 |

## 사전 요구 사항 {#prerequisites}

- Doris FE/BE가 배포되어 정상적으로 실행 중이어야 합니다.
- 대상 AWS 계정과 액세스할 S3 버킷이 있어야 합니다.
- 해당 계정에 대한 IAM 구성 권한(User / Role 생성, 정책 수정)이 있어야 합니다.
- Assumed Role 또는 Bucket Policy를 사용하려면 Doris FE/BE를 AWS EC2 또는 EKS 클러스터에 배포해야 합니다.

---

## IAM User 인증 및 권한 부여 {#iam-user-authentication-and-authorization}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: On-premise deployment / S3-protocol compatible object stores -->

Doris는 AWS IAM User의 `access_key`와 `secret_key`를 사용하여 외부 데이터 소스에 액세스할 수 있습니다. 자세한 배경 정보는 AWS 공식 문서 [IAM 사용자](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)를 참조하세요.

### 1단계: IAM User 생성 및 정책 구성 {#step-1-create-an-iam-user-and-configure-a-policy}

1. AWS 콘솔에 로그인하고 IAM 서비스를 연 다음 `Create user`를 클릭합니다.

    ![](/images/integrations/create_iam_user.png)

2. IAM User 이름을 입력합니다. `Set permissions` 섹션에서 정책을 직접 연결하는 옵션을 선택합니다.

    ![](/images/integrations/iam_user_attach_policy1.png)

3. 정책 편집기에 해당 AWS 리소스 정책을 입력합니다. 다음 예제는 S3 버킷에 액세스할 때 일반적으로 사용하는 읽기/쓰기 정책 템플릿입니다.

    ![](/images/integrations/iam_user_attach_policy2.png)

    **참고:**

    - **버킷 이름과 접두사 경로를 실제 값으로 바꾸세요.**
    - **"/" 구분자를 추가로 넣지 마세요.**

    S3 버킷 **읽기 정책 템플릿**입니다. S3 Load, TVF, External Catalog처럼 버킷의 객체를 읽고 목록을 조회하기만 하면 되는 Doris 기능에 사용합니다.

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                  "s3:GetObject",
                  "s3:GetObjectVersion",
                ],
                "Resource": "arn:aws:s3:::<your-bucket>/your-prefix/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket",
                    "s3:GetBucketLocation"
                ],
                "Resource": "arn:aws:s3:::<your-bucket>"
            }    
        ]
    }
    ```

    S3 버킷 **쓰기 정책 템플릿**입니다. Export, Storage Vault, Resource, Repository처럼 버킷 객체의 읽기, 목록 조회 및 쓰기가 필요한 Doris 기능에 사용합니다.

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                  "s3:PutObject",
                  "s3:GetObject",
                  "s3:GetObjectVersion",
                  "s3:DeleteObject",
                  "s3:DeleteObjectVersion",
                  "s3:AbortMultipartUpload",      
                  "s3:ListMultipartUploadParts"
                ],
                "Resource": "arn:aws:s3:::<your-bucket>/<your-prefix>/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                    "s3:GetBucketVersioning",
                    "s3:GetLifecycleConfiguration"
                ],
                "Resource": "arn:aws:s3:::<your-bucket>"
            }    
        ]
    }
    ```

4. IAM User를 생성한 후 이 사용자의 `access_key`와 `secret_key` 액세스 키 쌍을 생성합니다.

    ![](/images/integrations/iam_user_create_ak_sk.png)

### 2단계: Doris SQL에서 액세스 키 사용 {#step-2-use-the-access-key-in-doris-sql}

1단계를 완료하면 `access_key`와 `secret_key`를 얻게 됩니다. 이 키 쌍으로 모든 Doris 기능을 사용할 수 있습니다. 다음 SQL 예제는 일반적인 사용 방법을 보여줍니다. 핵심 필드는 다음과 같습니다.

```sql
"s3.access_key" = "<your-access-key>",
"s3.secret_key" = "<your-secret-key>"
```

**S3 Load**

```sql
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key" = "<your-secrety-key>"
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      'uri' = 's3://your_bucket/path/to/tvf_test/test.parquet',
      'format' = 'parquet',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  )
```

**External Catalog**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      'type' = 'iceberg',
      'iceberg.catalog.type' = 'hadoop',
      'warehouse' = 's3://your_bucket/dir/key',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  );
```

**Storage Vault**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export**

```sql
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
)
```

**Repository**

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

**Resource**

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

비즈니스 로직별로 서로 다른 IAM User의 `access_key`와 `secret_key`를 지정하여 외부 데이터에 대한 세분화된 액세스 제어를 구현할 수 있습니다.

---

## Assumed Role 인증 및 권한 부여 {#assumed-role-authentication-and-authorization}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: AWS EC2 deployment / Cross-account S3 access / Automatic credential rotation -->

Assumed Role은 AWS IAM Role을 수임하여 외부 데이터 소스에 대한 액세스를 인증하고 권한을 부여합니다. 배경 정보는 AWS 공식 문서 [IAM 역할로 전환](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html)을 참조하세요. 다음 다이어그램은 Assumed Role의 전체 구성 흐름을 보여줍니다.

![](/images/integrations/assumed_role_flow.png)

### 용어 정의 {#term-definitions}

| 용어                          | 의미                                                                                                          |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------ |
| 소스 계정                     | Assume Role을 시작하는 AWS 계정(이 예제에서는 Doris FE/BE를 호스팅하는 EC2 머신을 소유한 계정) |
| 대상 계정                     | 대상 S3 버킷을 소유한 AWS 계정                                                                                |
| `ec2_role`                    | 소스 계정에 생성하는 Role로, Doris FE/BE를 호스팅하는 모든 EC2 머신에 연결해야 함                              |
| `bucket_role`                 | 대상 계정에 생성하는 Role로, 대상 버킷에 대한 권한을 연결해야 함                                               |

**참고:**

1. **소스 계정과 대상 계정은 동일한 AWS 계정일 수 있습니다.**
2. **특히 확장 시에는 Doris FE/BE를 호스팅하는 모든 EC2 머신에 `ec2_role`이 연결되어 있는지 확인하세요.**

설정 데모는 다음과 같습니다.

<a href="https://www.bilibili.com/video/BV1U3uezjEPW/?vd_source=20479f0462e74fcf98f1df731639610f">
  <img src="/images/iam-role-doris-demo.png" alt="AWS IAM Role" />
</a>

### 1단계: 준비 {#step-1-preparation}

1. 소스 계정에서 `ec2_role`을 생성하고 Doris FE/BE를 호스팅하는 모든 EC2 머신에 연결합니다.
2. 대상 계정에서 `bucket_role`과 해당 S3 버킷을 생성합니다.

EC2 머신에 `ec2_role`을 연결하면 다음과 같이 콘솔에서 `role_arn`을 확인할 수 있습니다.

![](/images/integrations/ec2_instance.png)

### 2단계: 소스 계정 IAM Role에 권한 정책 추가 {#step-2-add-a-permission-policy-to-the-source-account-iam-role}

EC2 인스턴스에 연결된 소스 계정의 역할에 `sts:AssumeRole`을 허용하는 인라인 정책을 추가합니다.

1. [AWS IAM 콘솔](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)에 로그인하고 왼쪽 탐색 창에서 `Access management > Roles`를 선택합니다.
2. EC2 인스턴스에 연결된 역할을 찾아 역할 이름을 클릭합니다.
3. 역할 세부 정보 페이지의 `Permissions` 섹션에서 `Add permissions`를 클릭하고 `Create inline policy`를 선택합니다.
4. `Specify permissions` 단계에서 JSON 탭으로 전환하고 다음 정책을 입력한 후 `Review policy`를 클릭하여 저장합니다.

![](/images/integrations/source_role_permission.png)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["sts:AssumeRole"],
            "Resource": "*"
        }
    ]
}
```

### 3단계: 대상 계정 IAM Role의 신뢰 정책 및 권한 정책 구성 {#step-3-configure-the-trust-policy-and-permission-policy-on-the-target-account-iam-role}

#### 3.1 신뢰 정책 구성 {#31-configure-the-trust-policy}

1. [AWS IAM 콘솔](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)에 로그인하고 왼쪽 탐색 창에서 `Access management > Roles`를 선택합니다. `Assumed Target Role`(즉, `bucket_role`)을 찾아 역할 이름을 클릭하여 세부 정보 페이지로 이동합니다.
2. `Trust relationships` 탭으로 전환하고 `Edit trust policy`를 클릭합니다. 편집 페이지에서 다음 JSON을 입력하고 `<ec2_iam_role_arn>`을 EC2 인스턴스에 연결된 역할의 ARN으로 바꾼 다음 `Update policy`를 클릭합니다.

![](/images/integrations/target_role_trust_policy.png)

**참고:** `ExternalId`는 `Condition`의 선택적 필드입니다. 여러 소스 사용자가 동일한 역할을 수임하는 시나리오를 구분하는 데 사용됩니다. `ExternalId`를 구성한 경우 해당 Doris SQL 문에도 이 값을 전달해야 합니다. `ExternalId`에 대한 자세한 내용은 [AWS 공식 문서](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)를 참조하세요.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "<ec2_iam_role_arn>"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "sts:ExternalId": "1001"
                }
            }
        }
    ]
}
```

#### 3.2 권한 정책 구성 {#32-configure-the-permission-policy}

역할 세부 정보 페이지의 `Permissions` 섹션에서 `Add permissions`를 클릭하고 `Create inline policy`를 선택합니다. `Specify permissions` 단계에서 JSON 탭으로 전환하고 아래 정책을 입력한 후 `Review policy`를 클릭하여 저장합니다.

![](/images/integrations/target_role_permission2.png)

**참고:**

- **버킷 이름과 접두사 경로를 실제 값으로 바꾸세요.**
- **"/" 구분자를 추가로 넣지 마세요.**

S3 버킷 **읽기 정책 템플릿**입니다. S3 Load, TVF, External Catalog처럼 버킷의 객체를 읽고 목록을 조회하기만 하면 되는 Doris 기능에 사용합니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```

S3 버킷 **쓰기 정책 템플릿**입니다. Export, Storage Vault, Resource, Repository처럼 버킷에 대한 읽기와 쓰기가 필요한 Doris 기능에 사용합니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:AbortMultipartUpload",      
              "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>"
        }
    ]
}
```

### 4단계: Doris SQL에서 `role_arn`과 `external_id` 사용 {#step-4-use-role_arn-and-external_id-in-doris-sql}

앞의 단계를 완료하면 대상 계정의 `role_arn`과 선택적으로 `external_id`를 얻게 됩니다. Doris SQL에서는 다음 두 필드가 핵심입니다.

```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- Optional parameter
```

**S3 Load**

```sql
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  )
```

**External Catalog**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- Optional parameter
  );
```

**Storage Vault**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- Optional parameter
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export**

```sql
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
)
```

**Repository**

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

**Resource**

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

---

## EKS 클러스터의 IAM Role 인증 및 권한 부여 {#iam-role-authentication-and-authorization-in-eks-clusters}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Doris deployed on Amazon EKS / Kubernetes -->

Amazon EKS 클러스터에서 실행되는 Apache Doris에 AWS Identity and Access Management(IAM) 권한을 부여하는 주요 방식은 다음 두 가지입니다.

1. **IAM Roles for Service Accounts (IRSA)**
2. **EKS Pod Identity**

두 방식 모두 EKS 클러스터에서 IAM Role과 해당 신뢰 정책 및 IAM 정책을 올바르게 구성해야 합니다. 자세한 구성 단계는 AWS 공식 문서 [Amazon Elastic Kubernetes Service 클러스터의 워크로드에 AWS Identity and Access Management 권한 부여](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam)를 참조하세요.

EKS 측 구성을 완료하면 Doris FE/BE가 `AWSCredentialsProviderChain`을 통해 자격 증명을 자동으로 가져옵니다. SQL에서 `access_key` / `secret_key` 또는 `role_arn`을 명시적으로 지정할 필요가 없습니다.

---

## Bucket Policy 인증 및 권한 부여 {#bucket-policy-authentication-and-authorization}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: AWS EC2 deployment / Restrict S3 access to a specific account / Load, Export, TVF -->

IAM Role을 연결하여 배포한 Doris 머신에서는 Load, Export, TVF 등의 시나리오에서도 Amazon S3 Bucket Policy를 사용하여 S3 객체에 대한 액세스를 보호할 수 있습니다. 이 방식은 EC2 머신을 소유한 계정만 버킷에 액세스할 수 있도록 제한합니다.

### 1단계: 대상 버킷에 Bucket Policy 설정 {#step-1-set-a-bucket-policy-on-the-target-bucket}

아래 정책의 `arn:aws:iam::111122223333:root`를 EC2 머신에 연결된 계정 또는 Role의 ARN으로 바꿉니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```

### 2단계: Doris SQL에서 S3에 직접 액세스(AK/SK 또는 ARN 불필요) {#step-2-access-s3-directly-in-doris-sql-no-aksk-or-arn-required}

Bucket Policy를 설정한 후에는 SQL에서 `access_key`, `secret_key` 또는 `role_arn`을 제공할 필요가 없습니다. Doris FE/BE가 `AWSCredentialsProviderChain`을 통해 자격 증명을 자동으로 가져옵니다.

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```

참고: [Bucket Policy 예제](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html)

---

## 권한 부여 방식별 모범 사례 {#best-practices-for-authorization-methods}

| 권한 부여 방식              | 적용 시나리오                                                                                        | 장점                                                                      | 단점                                                                |
| :-------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| AK/SK 권한 부여             | 보안을 직접 관리할 수 있는 온프레미스 배포 또는 AWS 이외의 S3 객체 스토리지에서 Load/Export/Storage Vault를 사용하는 경우 | 구성이 간단함. AWS S3 프로토콜과 호환되는 모든 객체 스토리지에서 사용 가능 | 키 유출 위험이 있음. 키를 수동으로 교체해야 함                      |
| IAM Role 권한 부여          | 보안 요구 사항이 높은 AWS S3 퍼블릭 클라우드 Load/Export/Storage Vault 시나리오                         | 보안성이 높음. AWS 자격 증명이 자동으로 교체됨. 권한을 중앙에서 관리함 | Bucket Policy/신뢰 구성 과정이 복잡함                               |
| Bucket Policy 권한 부여     | 버킷 수가 적은 AWS S3 퍼블릭 클라우드 Load/Export/Storage Vault 시나리오                                | 구성 복잡도가 중간 수준임. 최소 권한 원칙을 따름. AWS 자격 증명이 자동으로 감지됨 | 권한이 개별 버킷 정책에 분산됨                                      |

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: AWS authorization debugging / Enabling SDK logs -->

### 질문: BE와 Recycler의 AWS SDK DEBUG 수준 로그를 활성화하려면 어떻게 해야 하나요? {#q-how-do-i-enable-aws-sdk-debug-level-logs-for-be-and-recycler}

`be.conf`와 `doris_cloud.conf`에서 `aws_log_level=5`를 설정하고 프로세스를 다시 시작하면 변경 사항이 적용됩니다.

`aws_log_level` 매개변수에 대한 설명은 다음과 같습니다.

| 항목        | 설명                       |
| :---------- | :------------------------- |
| 유형        | int32                      |
| 설명        | AWS SDK 로그 수준          |
| 기본값      | 2 (Error)                  |

유효한 값:

```text
Off   = 0
Fatal = 1
Error = 2
Warn  = 3
Info  = 4
Debug = 5
Trace = 6
```

### 질문: AWS SDK DEBUG 로그를 활성화한 후 be.log / recycler.log에 `OpenSSL SSL_connect: Connection reset by peer`가 기록되는 이유는 무엇인가요? {#q-after-enabling-aws-sdk-debug-logs-belog--recyclerlog-reports-openssl-ssl_connect-connection-reset-by-peer}

오류 예제:

```text
OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443
```

AWS VPC 네트워크 구성이나 방화벽 포트 구성에 해당 리전의 STS 서비스 액세스를 차단하는 문제가 있는지 확인하세요. 다음 명령으로 확인할 수 있습니다.

```shell
telnet sts.<region>.amazonaws.com 443
```
