---
{
    "title": "Apache Doris IAM Assume Role의 작동 방식",
    "language": "ko",
    "description": "Apache Doris가 AWS IAM Assume Role을 사용하여 S3 액세스를 인증하는 방식을 설명합니다. 장기 AK/SK 자격 증명을 STS 임시 자격 증명으로 대체하여 클라우드 리소스에 안전하게 액세스합니다.",
    "keywords": [
        "Apache Doris",
        "AWS IAM",
        "Assume Role",
        "STS temporary credentials",
        "S3 authentication",
        "Doris access S3",
        "AK SK replacement",
        "IAM Role",
        "External ID",
        "EC2 Instance Profile",
        "Trust Relationship",
        "principle of least privilege",
        "bucket access",
        "S3 Load",
        "Storage Vault"
    ]
}
---

# Apache Doris IAM Assume Role의 작동 방식 {#how-apache-doris-iam-assume-role-works}

<!-- Knowledge type: Architecture principle / Authentication mechanism description -->
<!-- Applicable scenarios: Security compliance refactor / Replacing long-term AK/SK credentials / Cross-account S3 access -->

이 문서는 Apache Doris가 AWS IAM Assume Role 메커니즘을 통해 S3 리소스에 액세스하는 방식을 설명합니다. 기존 AK/SK 방식 대비 장점, STS 임시 자격 증명을 사용하는 인증 흐름, EC2에 배포된 Doris가 이 메커니즘과 연동하는 방식을 다룹니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
|------|------|
| 장기 AK/SK 자격 증명 대체 | STS가 동적으로 발급하는 임시 자격 증명을 사용하여 하드코딩된 키의 유출 위험 제거 |
| 계정 간 S3 액세스 | 소스 계정의 엔터티가 대상 계정의 역할을 수임하며, External ID를 통해 안전한 격리 보장 |
| 최소 권한 원칙 준수 감사 | 역할 기반으로 권한을 부여하고, AWS가 실제 작업 수행자와 작업에 대한 감사 추적 기록 제공 |
| EC2에 배포된 Doris 클러스터 | FE/BE 노드가 EC2 Instance Profile을 통해 자동으로 Assume Role 수행 |

## 사전 요구 사항 {#prerequisites}

- Apache Doris **3.0.6 이상** 버전(S3 Load, TVF, Export, Resource, Repository, Storage Vault 등의 기능에서 모두 Assume Role 지원)
- FE 및 BE 프로세스가 IAM Role이 연결된 AWS EC2 인스턴스에 배포되어 있어야 합니다.
- 소스 계정과 대상 계정 모두에서 IAM 역할과 신뢰 관계가 사전에 설계되어 있어야 합니다.
- STS 서비스에 액세스할 수 있어야 합니다.

## 1. 기존 AK/SK 방식으로 AWS 리소스에 액세스할 때의 문제점 {#1-problems-with-the-traditional-aksk-approach-for-accessing-aws-resources}

<!-- Knowledge type: Background analysis -->

고정 AK/SK를 사용하는 액세스 방식은 키 관리, 감사 추적, 권한 제어 측면에서 상당한 취약점이 있습니다.

| 위험 유형 | 구체적인 문제 |
|----------|----------|
| **장기 노출 위험** | 고정 AK/SK는 구성 파일에 하드코딩해야 합니다. 코드 공개, 실수로 인한 커밋, 악의적인 탈취 등으로 키가 유출되면 공격자가 키 소유자와 동일한 전체 권한을 지속적으로 갖게 되어 데이터 유출, 리소스 변조, 금전적 손실의 위험이 계속됩니다. |
| **감사 사각지대** | 여러 사용자나 서비스가 동일한 키를 공유하면 클라우드 작업 로그에는 키의 식별 정보만 기록됩니다. 작업을 특정 사용자와 연결할 수 없어 실제 책임자나 비즈니스 모듈을 추적할 수 없습니다. |
| **높은 운영 비용** | 키 교체는 큰 부담입니다. 비즈니스 모듈의 키를 수동으로 교체해야 하므로 오류가 발생하기 쉽고 서비스 중단으로 이어지기 쉽습니다. |
| **권한 제어의 한계** | 계정 수준의 포괄적인 권한 부여로는 서비스 또는 인스턴스 수준의 최소 권한 요구 사항을 충족할 수 없습니다. |

## 2. AWS IAM Assume Role 메커니즘 소개 {#2-introduction-to-the-aws-iam-assume-role-mechanism}

<!-- Knowledge type: Concept definition -->

### 2.1 AWS IAM Assume Role이란 {#21-what-is-aws-iam-assume-role}

AWS Assume Role은 신뢰할 수 있는 엔터티(예: IAM 사용자, EC2 인스턴스, 외부 계정)가 STS(Security Token Service)를 통해 대상 역할의 권한을 임시로 얻을 수 있게 하는 안전한 신원 전환 메커니즘입니다. 동작 흐름은 다음과 같습니다.

![AWS IAM Assume Role 흐름도](/images/integrations/aws_iam_role_flow.png)

### 2.2 AWS IAM Assume Role 사용의 장점 {#22-advantages-of-using-aws-iam-assume-role}

- **동적 토큰 메커니즘**: 영구 자격 증명을 유효 기간이 15분에서 12시간인 임시 자격 증명으로 대체합니다.
- **계정 간 안전한 격리**: External ID를 사용하여 계정 간에 안전한 격리를 제공하며, AWS 콘솔을 통해 감사할 수 있습니다.
- **최소 권한 원칙**: 최소 권한 원칙에 따라 역할 기반으로 액세스합니다.

### 2.3 AWS IAM Assume Role을 통한 S3 버킷 액세스 인증 흐름 {#23-authentication-flow-for-accessing-an-s3-bucket-via-aws-iam-assume-role}

<!-- Knowledge type: Operation flow / Authentication flow -->

전체 인증 흐름은 소스 사용자의 신원 확인, 대상 역할의 권한 활성화, 리소스 작업 실행의 세 단계로 구성됩니다.

![IAM Role이 S3 버킷에 액세스하는 인증 흐름](/images/integrations/iam_role_access_bucket.png)

#### 1단계: 소스 사용자의 신원 확인 {#stage-1-source-user-identity-verification}

1. **권한 정책 확인**
    - 소스 사용자가 AssumeRole 요청을 시작하면 소스 계정의 IAM 정책 엔진이 먼저 해당 사용자에게 `sts:AssumeRole` 작업을 호출할 권한이 있는지 확인합니다.
    - 확인 기준: 소스 사용자의 IAM 자격 증명에 연결된 IAM Permissions Policies

2. **신뢰 관계 검증**
    - STS를 통해 대상 계정에 요청하여 소스 사용자가 대상 역할의 신뢰 정책 허용 목록에 포함되어 있는지 확인합니다.
    - 확인 기준: 대상 역할에 연결된 IAM Trust Relationships Policies(해당 역할을 수임할 수 있는 계정이나 사용자를 명시적으로 지정)

#### 2단계: 대상 역할의 권한 활성화 {#stage-2-target-role-permission-activation}

3. **임시 자격 증명 생성**

    신뢰 관계 검증을 통과하면 STS가 다음 세 가지 항목으로 구성된 임시 자격 증명을 생성합니다.

    ```json
    {
        "AccessKeyId": "***",
        "SecretAccessKey": "***",
        "SessionToken": "***"
    }
    ```

    자격 증명의 유효 기간은 15분에서 12시간입니다.

4. **대상 역할의 권한 확인**
    - 대상 역할이 임시 자격 증명을 사용하여 S3에 액세스하기 전에, 대상 계정의 IAM 정책 엔진이 해당 역할에 요청된 S3 작업(예: `s3:GetObject` 또는 `s3:PutObject`)을 수행할 권한이 있는지 확인합니다.
    - 확인 기준: 대상 역할에 연결된 IAM Permissions Policies(해당 역할이 수행할 수 있는 작업을 정의)

#### 3단계: 리소스 작업 실행 {#stage-3-resource-operation-execution}

5. **버킷 액세스**: 모든 검증을 통과하면 대상 역할이 S3 API 작업을 실행할 수 있습니다.

## 3. Doris의 AWS IAM Assume Role 메커니즘 적용 방식 {#3-how-doris-applies-the-aws-iam-assume-role-mechanism}

<!-- Knowledge type: Integration solution -->
<!-- Applicable scenarios: Configuring STS authentication for Doris on EC2 clusters -->

### 3.1 연동 원리 {#31-integration-principle}

Doris는 FE 및 BE 프로세스가 배포된 AWS EC2 인스턴스를 소스 계정에 연결하여 AWS IAM Assume Role 기능을 사용합니다. 주요 흐름은 다음 다이어그램과 같습니다.

![Doris IAM Role 연동 흐름](/images/integrations/doris_iam_role.png)

구성을 완료하면 Doris FE 및 BE 프로세스가 EC2 인스턴스의 프로파일을 자동으로 가져오고 Assume Role을 수행하여 버킷에 액세스합니다. 클러스터를 확장할 때 BE 노드는 구성 누락을 방지하기 위해 새 EC2 인스턴스 각각에 IAM Role이 연결되어 있는지 자동으로 확인합니다.

### 3.2 지원 기능 범위 {#32-supported-feature-scope}

S3 Load, TVF, Export, Resource, Repository, Storage Vault 등의 Doris 기능은 **3.0.6 이상** 버전에서 모두 AWS Assume Role 방식을 지원합니다. 이러한 기능의 SQL 문을 실행할 때 연결 가능 여부를 확인합니다.

### 3.3 SQL 구성 예제 {#33-sql-configuration-example}

다음 예제는 S3 Repository를 생성합니다.

```sql
CREATE REPOSITORY `s3_repo`
WITH S3 ON LOCATION "s3://bucket/path/"
PROPERTIES (
  "s3.role_arn" = "arn:aws:iam::1234567890:role/doris-s3-role",
  "s3.external_id" = "doris-external-id",
  "timeout" = "3600"
);
```

주요 매개변수:

| 매개변수 | 필수 여부 | 설명 |
|------|------|------|
| `s3.role_arn` | 예 | AWS IAM Account2에 속한 IAM Role2의 ARN |
| `s3.external_id` | 아니요 | Trust Relationships Policies에 설정된 externalId 값 |
| `timeout` | 아니요 | 작업 제한 시간(초) |

다른 기능의 SQL 문에 대한 자세한 사용법은 [AWS 인증 및 권한 부여](../../../admin-manual/auth/integrations/aws-authentication-and-authorization#assumed-role-authentication-and-authorization)를 참조하세요.
