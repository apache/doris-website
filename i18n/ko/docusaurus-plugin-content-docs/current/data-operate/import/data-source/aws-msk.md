---
{
    "title": "AWS MSK",
    "language": "ko",
    "description": "Routine Load를 사용하여 AWS MSK의 데이터를 Doris에 실시간으로 적재합니다. IAM 인증, AK/SK, Assume Role 등 다양한 자격 증명 방식을 지원합니다.",
    "keywords": [
        "AWS MSK",
        "Routine Load",
        "Kafka 데이터 적재",
        "IAM 인증",
        "Assume Role",
        "Doris 데이터 적재",
        "SASL_SSL",
        "OAUTHBEARER"
    ]
}
---

> 이 기능은 Doris 4.1.0부터 지원됩니다.

<!-- Knowledge type: Operation guide + Configuration parameters -->
<!-- Applicable scenarios: Import data from AWS MSK into Doris / IAM authentication configuration / Public network access troubleshooting -->

Amazon Managed Streaming for Apache Kafka (AWS MSK)는 AWS에서 제공하는 완전관리형 Apache Kafka 서비스입니다. Doris는 Routine Load를 통해 AWS MSK의 데이터를 실시간으로 적재할 수 있으며, AWS MSK용 IAM 인증 메커니즘을 제공합니다. CSV 및 JSON 형식을 지원하고 Exactly-Once 의미 체계를 제공하여 데이터가 유실되거나 중복되지 않도록 보장합니다. 자세한 내용은 Routine Load를 참조하세요.

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Pre-deployment checks -->

Routine Load를 사용하여 AWS MSK의 데이터를 적재하기 전에 다음 조건을 충족하는지 확인하세요.

1. AWS MSK 클러스터가 생성되어 있고 IAM 인증이 활성화되어 있어야 합니다.
2. MSK 클러스터에 액세스할 수 있도록 적절한 AWS IAM 권한이 구성되어 있어야 합니다.
3. Doris 클러스터에서 AWS MSK의 Bootstrap Servers에 액세스할 수 있어야 합니다.

## 인증 매개변수 {#authentication-parameters}

<!-- Knowledge type: Configuration parameters -->

다음 테이블은 AWS MSK의 데이터를 적재할 때 구성해야 하는 인증 관련 매개변수입니다.

| 매개변수 | 설명 | 예시 |
| :--- | :--- | :--- |
| `aws.region` | AWS 리전 | `"us-east-1"` |
| `aws.access_key` | AWS Access Key ID | - |
| `aws.secret_key` | AWS Secret Access Key | - |
| `aws.role_arn` | 교차 계정 액세스 자격 증명에 사용되는 역할 | `"arn:aws:iam::123456789012:role/MyRole"` |
| `aws.profile_name` | `~/.aws/credentials`에 구성된 AWS Profile 이름 | - |
| `aws.credentials_provider` | AWS SDK의 표준 자격 증명 공급자. 다양한 공급자 유형 지원 | `"INSTANCE_PROFILE"` |
| `aws.external_id` | AssumeRole의 "호출 컨텍스트 식별자"로 사용 | - |
| `property.security.protocol` | IAM 인증 제약으로 인해 `SASL_SSL`로 고정 | `"SASL_SSL"` |
| `property.sasl.mechanism` | librdkafka 라이브러리 제약으로 인해 `OAUTHBEARER`로 고정 | `"OAUTHBEARER"` |

### `aws.credentials_provider`에서 사용할 수 있는 값 {#available-values-for-awscredentials_provider}

| 값 | 설명 |
| :--- | :--- |
| `DEFAULT` | 기본 공급자 체인 사용 |
| `ENV` | 환경 변수에서 자격 증명 읽기 |
| `INSTANCE_PROFILE` | EC2 Instance Profile 자격 증명 사용 |

## 인증 구성 예시 {#authentication-configuration-examples}

<!-- Knowledge type: Operation steps -->

Doris는 다음과 같은 IAM 인증 방식을 지원합니다. 실제 배포 환경에 맞는 방식을 선택하세요.

| 인증 방식 | 적용 상황 |
| :--- | :--- |
| AK/SK 직접 사용 | 장기간 유효한 Access Key/Secret Key를 이미 보유한 경우 |
| IAM Role (Assume Role) | 교차 계정 액세스가 필요하거나 임시 자격 증명을 사용하려는 경우 |
| `aws.credentials_provider`로 자격 증명 소스 지정 | EC2 Instance Profile을 사용하는 경우처럼 AK/SK를 명시적으로 입력하지 않으려는 경우 |

### 방법 1: Access Key와 Secret Key (AK/SK) 직접 사용 {#method-1-use-access-key-and-secret-key-aksk-directly}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.access_key" = "<your-ak>",
    "aws.secret_key" = "<your-sk>",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

### 방법 2: IAM Role (Assume Role) 방식 {#method-2-iam-role-assume-role-mode}

`aws.role_arn`을 구성하면 `aws.credentials_provider`로 STS AssumeRole 호출에 사용할 소스 자격 증명 공급자를 지정합니다.

#### 예시 2.1: EC2 Instance Profile을 STS 소스 자격 증명으로 사용 {#example-21-ec2-instance-profile-as-the-sts-source-credential}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "INSTANCE_PROFILE",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

#### 예시 2.2: 환경 변수에서 AK/SK를 읽어 STS 소스 자격 증명으로 사용 {#example-22-read-aksk-from-environment-variables-as-the-sts-source-credential}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "ENV",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

#### 예시 2.3: 기본 공급자 체인을 STS 소스 자격 증명으로 사용 {#example-23-use-the-default-provider-chain-as-the-sts-source-credential}

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.role_arn" = "arn:aws:iam::123456789012:role/demo-role",
    "aws.credentials_provider" = "DEFAULT",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

### 방법 3: `aws.credentials_provider`로 자격 증명 소스 지정 {#method-3-specify-the-credential-source-through-awscredentials_provider}

EC2 Instance Profile을 사용하는 경우처럼 AK/SK를 명시적으로 제공하지 않는 환경에 적합합니다.

```sql
CREATE ROUTINE LOAD IAM_Test ON t
COLUMNS TERMINATED BY ",",
COLUMNS(a,b)
FROM KAFKA(
    "kafka_broker_list" = "your_msk_broker_list",
    "kafka_topic" = "your_kafka_topic",

    "aws.region" = "us-west-1",
    "aws.credentials_provider" = "INSTANCE_PROFILE",

    "property.kafka_default_offsets" = "OFFSET_BEGINNING",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "OAUTHBEARER"
);
```

## 자격 증명 결정 규칙 {#credential-resolution-rules}

<!-- Knowledge type: Configuration priority -->

여러 자격 증명 매개변수를 동시에 구성하면 다음 우선순위에 따라 적용됩니다.

1. `aws.access_key`와 `aws.secret_key`를 모두 구성하면 **AK/SK를 우선 사용합니다**.
2. AK/SK를 구성하지 않고 `aws.role_arn`을 구성하면 **IAM Role을 사용합니다**. 이 경우 `aws.credentials_provider`로 STS 소스 자격 증명을 선택합니다.
3. AK/SK와 `aws.role_arn`을 모두 구성하지 않으면 **`aws.credentials_provider`가 AWS 클라이언트에서 사용할 공급자를 직접 결정합니다**.

## 퍼블릭 네트워크 액세스 문제 해결 {#public-network-access-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Authentication failure when accessing AWS MSK from the public network -->

퍼블릭 네트워크 환경에서 AWS MSK에 액세스할 때 데이터 적재 중 AWS 인증 문제가 발생하면 다음 단계에 따라 문제를 해결하세요.

### 단계 1: MSK 클러스터의 퍼블릭 액세스 활성화 여부 확인 {#step-1-ensure-that-the-msk-cluster-has-public-access-enabled}

AWS MSK 콘솔에서 액세스하려는 클러스터를 선택하고, **속성** 아래의 **네트워킹 설정**에서 **퍼블릭 액세스 편집**으로 이동하세요. 퍼블릭 액세스 옵션이 켜져 있는지 확인하세요.

### 단계 2: 서브넷이 퍼블릭 서브넷인지 확인 {#step-2-ensure-that-the-subnet-is-public}

클러스터에 연결된 서브넷은 퍼블릭 서브넷이어야 합니다. AWS VPC 콘솔에서 해당 서브넷의 라우팅 테이블에 `0.0.0.0/0 : igw-xxxx` 항목이 있는지 확인하세요.

### 단계 3: 올바른 Bootstrap 퍼블릭 엔드포인트 사용 {#step-3-use-the-correct-bootstrap-public-endpoint}

AWS MSK 콘솔에서 액세스하려는 클러스터를 선택하고 **클라이언트 정보 보기**를 클릭하세요. Routine Load를 생성할 때 사용하는 `kafka_broker_list` 속성에 **프라이빗 엔드포인트**가 아닌 **퍼블릭 엔드포인트**가 입력되어 있는지 확인하세요.

### 단계 4: 보안 그룹의 인바운드 및 아웃바운드 규칙이 올바르게 구성되어 있는지 확인 {#step-4-ensure-that-the-security-group-is-configured-with-correct-inbound-and-outbound-rules}

MSK에 구성된 보안 그룹의 **인바운드 규칙**에서 **포트 9198**에 적절한 소스 IP가 구성되어 있는지 확인하세요.

> 참고: IAM 액세스 제어를 통해 브로커와 통신하는 경우 포트 9198을 통한 액세스를 허용해야 합니다.

### 참고 문서 {#reference-documents}

자세한 내용은 관련 AWS 문서를 참조하세요.

- [인터넷을 통해 Amazon Managed Streaming for Apache Kafka (Amazon MSK) 클러스터에 안전하게 액세스하는 방법](https://docs.aws.amazon.com/msk/latest/developerguide/public-access.html)
- [AWS 내부에서 클러스터의 VPC 외부로부터 액세스](https://docs.aws.amazon.com/msk/latest/developerguide/aws-access.html)
- [인터넷 게이트웨이를 사용하여 VPC의 인터넷 액세스 활성화](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Frequently asked questions -->

### Q1: `property.security.protocol`과 `property.sasl.mechanism`을 고정된 값으로 설정해야 하는 이유는 무엇인가요? {#q1-why-must-propertysecurityprotocol-and-propertysaslmechanism-be-fixed-values}

AWS MSK IAM 인증 메커니즘과 기반 librdkafka 라이브러리의 제약으로 인해 이 두 매개변수는 각각 `SASL_SSL`과 `OAUTHBEARER`로 고정해야 합니다. 그렇지 않으면 IAM 인증 핸드셰이크를 정상적으로 완료할 수 없습니다.

### Q2: AK/SK와 `aws.role_arn`을 동시에 구성하면 어떤 자격 증명을 사용하나요? {#q2-when-aksk-and-awsrole_arn-are-configured-at-the-same-time-which-credential-is-used}

AK/SK를 우선 사용합니다. 자세한 내용은 [자격 증명 결정 규칙](#credential-resolution-rules)을 참조하세요.

### Q3: 퍼블릭 네트워크에서 MSK에 액세스할 때 인증이 계속 실패합니다. 어떻게 해결해야 하나요? {#q3-authentication-always-fails-when-accessing-msk-from-the-public-network-how-should-this-be-troubleshot}

[퍼블릭 네트워크 액세스 문제 해결](#public-network-access-troubleshooting)의 네 단계에 따라 각 항목을 확인하세요. 퍼블릭 액세스가 활성화되어 있는지, 서브넷이 퍼블릭 서브넷인지, Bootstrap 엔드포인트가 퍼블릭 엔드포인트를 사용하는지, 보안 그룹이 포트 9198을 허용하는지 확인하세요.

### Q4: EC2에서 Doris를 실행할 때 AK/SK를 구성하지 않으려면 어떻게 해야 하나요? {#q4-when-running-doris-on-ec2-how-can-aksk-configuration-be-avoided}

MSK 액세스 권한이 있는 IAM Role을 EC2 인스턴스에 연결한 다음, `aws.credentials_provider`를 `INSTANCE_PROFILE`로 설정하면 됩니다. [방법 3](#method-3-specify-the-credential-source-through-awscredentials_provider)을 참조하세요.

### Q5: Routine Load를 통해 MSK의 데이터를 적재할 때 Doris는 데이터 유실이나 중복이 없음을 보장하나요? {#q5-does-doris-guarantee-no-data-loss-or-duplication-when-importing-data-from-msk-through-routine-load}

네. Routine Load는 Exactly-Once 의미 체계를 제공하여 데이터가 유실되거나 중복되지 않도록 보장합니다.
