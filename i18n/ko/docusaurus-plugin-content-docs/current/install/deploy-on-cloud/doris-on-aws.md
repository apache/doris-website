---
{
    "title": "AWS에서 Doris 사용",
    "language": "ko",
    "description": "AWS에서 Doris를 빠르게 체험할 수 있도록 클러스터를 손쉽게 시작하고 실행할 수 있는 CloudFormation Template (CFT)을 제공합니다. 이 템플릿을 사용하면 AWS 리소스가 자동으로 구성되며, 최소한의 설정으로 Doris 클러스터를 시작할 수 있습니다."
}
---

이 문서에서는 최신 Doris 기능을 체험할 수 있도록 AWS에 Doris 클러스터를 빠르게 배포하는 방법을 설명합니다.

## 사용 사례 {#use-cases}

AWS에서 Doris를 빠르게 사용해 보려면 다음 두 가지 배포 방법 중 하나를 선택할 수 있습니다.

| 배포 방법 | 대상 사용자 | 특징 |
| --- | --- | --- |
| CloudFormation Template (CFT)으로 배포 | Doris를 빠르게 시작하고 사용해 보려는 사용자 | AWS 리소스를 자동으로 구성하고 최소한의 설정으로 클러스터 시작 |
| AWS 리소스를 직접 구매하고 수동으로 배포 | 배포 아키텍처를 직접 구성하려는 사용자 | 리소스 선택과 구성 과정을 완전히 제어 가능 |

이 문서에서는 **CloudFormation 템플릿 기반**의 빠른 배포 방법을 중점적으로 설명합니다.

:::tip
스토리지와 컴퓨팅이 분리된 모드의 컴파일 및 배포는 아직 지원하지 않습니다.
:::

:::caution
- 현재 CloudFormation 템플릿은 **us-east-1**, **us-west-1**, **us-west-2**의 세 리전만 지원합니다.
- Doris on AWS CloudFormation은 주로 Doris를 테스트하거나 체험하는 데 사용합니다. **프로덕션 환경에서는 사용하지 마세요**.
:::

## 기본 개념 {#background-concepts}

### AWS CloudFormation이란? {#what-is-aws-cloudformation}

CloudFormation을 사용하면 한 번에 "리소스 스택"을 생성할 수 있습니다. 각 용어의 의미는 다음과 같습니다.

- **리소스**: EC2 인스턴스, VPC, 서브넷 등 사용자가 생성하는 항목입니다.
- **스택**: 이러한 리소스의 집합입니다.

요구 사항에 맞게 템플릿을 작성하면 리소스 스택을 한 번에 생성할 수 있습니다. 수동으로 생성하고 구성하는 방식과 비교하면 CloudFormation은 다음과 같은 장점이 있습니다.

- 더 빠른 생성
- 일관성 있게 반복 실행 가능
- 템플릿을 소스 관리 시스템에서 버전별로 관리하고 필요할 때 언제든지 재사용 가능

### Doris on AWS CloudFormation이란? {#what-is-doris-on-aws-cloudformation}

Doris는 공식 Doris CloudFormation Template을 제공합니다. 이 템플릿을 바로 사용하여 AWS에 지정된 버전의 Doris 클러스터를 빠르게 생성하고 최신 기능을 손쉽게 체험할 수 있습니다.

## 배포 전 준비 {#preparation-before-deployment}

배포를 시작하기 전에 다음 정보를 미리 확인하세요.

- 배포할 **VPC** 및 **서브넷** 결정
- 노드에 로그인할 때 사용할 **키 페어** 결정
- 배포 중에 **S3 VPC Endpoint Interface**가 생성된다는 점 확인

## 배포 단계 {#deployment-steps}

### 1단계: CloudFormation에서 스택 생성 {#step-1-enter-cloudformation-and-create-a-stack}

AWS 콘솔에서 CloudFormation으로 이동한 다음 **스택 생성**을 클릭합니다.

![배포 시작 - AWS 콘솔에서 CloudFormation으로 이동](/images/start-deployment.jpeg)

템플릿 소스로 **Amazon S3 URL**을 선택하고 Amazon S3 URL에 다음 템플릿 링크를 입력합니다.

```
https://sdb-cloud-third-party.s3.amazonaws.com/doris-cf/cloudformation_doris.template.yaml
```

### 2단계: 템플릿 매개변수 구성 {#step-2-configure-template-parameters}

![템플릿의 세부 매개변수 구성](/images/configure-specific-parameters-1.jpeg)

![템플릿의 세부 매개변수 구성](/images/configure-specific-parameters-2.jpeg)

![템플릿의 세부 매개변수 구성](/images/configure-specific-parameters-3.jpeg)

주요 매개변수는 다음과 같습니다.

| 매개변수 | 설명 | 참고 사항 |
| --- | --- | --- |
| VPC ID | 배포할 VPC | 필수 |
| 서브넷 ID | 배포할 서브넷 | 필수 |
| 키 페어 이름 | 배포된 BE 및 FE 노드에 연결할 때 사용할 공개 키/개인 키 페어 | 필수 |
| Doris 버전 | 배포할 Doris 버전 | 예: 2.1.0, 2.0.6 등 |
| Doris FE 수 | FE 개수 | 템플릿은 기본적으로 FE 1개만 허용 |
| Fe 인스턴스 유형 | FE의 인스턴스 유형 | 기본값 사용 가능 |
| Doris Be 수 | BE 노드 개수 | 1 또는 3 선택 가능 |
| Be 인스턴스 유형 | BE의 인스턴스 유형 | 기본값 사용 가능 |
| 메타데이터 디렉터리 | FE 노드의 메타데이터 디렉터리 | 기본값 사용 가능 |
| 시스템 로그 수준 | 시스템 로그 수준 | 기본값인 `info` 사용 가능 |
| Be 노드의 볼륨 유형 | BE 노드에 연결된 EBS의 볼륨 유형 | 기본적으로 각 노드에 디스크 하나가 연결됨. 기본값 사용 가능 |
| Be 노드의 볼륨 크기 | BE 노드에 연결된 EBS의 크기(단위: GB) | 기본값 사용 가능 |

## Doris 클러스터에 연결 {#connect-to-the-doris-cluster}

### 1단계: 배포 성공 여부 확인 {#step-1-confirm-successful-deployment}

배포에 성공하면 CloudFormation에 다음 결과가 표시됩니다.

![데이터베이스 연결 방법](/images/how-to-connect-to-the-database.jpeg)

### 2단계: FE 연결 주소 확인 {#step-2-get-the-fe-connection-address}

아래 스크린샷의 순서에 따라 스택의 **출력** 탭으로 이동한 다음 FE 출력에서 FE 연결 주소를 확인합니다. 다음 예제에서 FE 주소는 `172.16.0.97`입니다.

![FE 연결 주소 확인](/images/find-connection-address-for-fe-1.jpeg)

![FE 연결 주소 확인](/images/find-connection-address-for-fe-2.jpeg)

![FE 연결 주소 확인](/images/find-connection-address-for-fe-3.jpeg)

### 3단계: Doris 클러스터에 연결 {#step-3-connect-to-the-doris-cluster}

CloudFormation을 통한 배포가 완료되면 Doris 클러스터의 기본 연결 정보는 다음과 같습니다.

| 항목 | 기본값 |
| --- | --- |
| FE IP | 2단계에서 확인한 FE IP 주소 |
| FE MySQL 프로토콜 포트 | 9030 |
| FE HTTP 프로토콜 포트 | 8030 |
| 기본 root 비밀번호 | 비어 있음 |
| 기본 admin 비밀번호 | 비어 있음 |
