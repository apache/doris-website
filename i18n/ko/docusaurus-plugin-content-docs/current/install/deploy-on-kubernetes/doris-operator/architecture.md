---
{
    "title": "Doris Operator 아키텍처",
    "sidebar_label": "아키텍처",
    "language": "ko",
    "description": "Doris Operator의 컨트롤 플레인, 데이터 플레인, Reconcile 모델과 컴퓨팅-스토리지 통합형 및 컴퓨팅-스토리지 분리형 클러스터의 제어 경로를 설명합니다.",
    "keywords": ["Doris Operator 아키텍처", "Kubernetes Operator", "Reconcile", "DorisCluster", "DorisDisaggregatedCluster"]
}
---

Doris Operator는 표준 Kubernetes Operator 패턴을 따릅니다. 사용자는 CRD를 통해 원하는 상태를 선언하고, Operator는 실제 상태를 지속적으로 관찰하면서 Kubernetes 리소스를 생성, 업데이트 또는 삭제하여 두 상태의 차이를 조정합니다.

이 문서는 전체 아키텍처를 중심으로 설명합니다. 필드 정의와 배포 절차는 해당 설치 및 구성 문서를 참조하세요.

## 아키텍처 계층 {#architecture-layers}

Doris Operator는 컨트롤 플레인과 데이터 플레인의 두 계층으로 나누어 볼 수 있습니다.

![Doris Operator 아키텍처 계층](/images/doris-operator/mermaid/02-architecture-layers.jpg)

컨트롤 플레인은 Doris 사용자 정의 리소스를 읽고 Reconcile 흐름을 실행합니다. 데이터 플레인은 Doris 구성 요소를 실제로 실행하는 Kubernetes 네이티브 리소스로 구성됩니다.

## Reconcile 모델 {#reconcile-model}

Reconcile 루프는 Doris Operator의 핵심입니다. Doris 사용자 정의 리소스가 생성되거나 업데이트될 때, 또는 관련 리소스의 상태가 변경될 때마다 Operator는 원하는 상태와 실제 상태의 차이를 다시 계산한 후 필요한 작업을 수행합니다.

일반적인 흐름은 다음과 같습니다.

1. Doris 사용자 정의 리소스를 읽습니다.
2. 리소스가 삭제 중인지 확인합니다.
3. 구성 요소, 스토리지, 인증 및 접근 구성을 분석합니다.
4. 해당 `StatefulSet`, `Service`, PVC 및 관련 리소스를 생성하거나 업데이트합니다.
5. 구성 요소의 상태를 집계하여 CR의 `status`에 기록합니다.
6. 클러스터가 준비되지 않았다면 다음 Reconcile 루프를 기다립니다.

![Doris Operator Reconcile 모델](/images/doris-operator/mermaid/03-architecture-reconcile-model.jpg)

## 컴퓨팅-스토리지 통합형 클러스터의 제어 경로 {#control-path-for-compute-storage-integrated-clusters}

`DorisCluster`는 컴퓨팅-스토리지 통합형 배포에 사용됩니다. 단일 리소스에 FE, BE, CN 및 Broker 구성을 포함할 수 있습니다.

![컴퓨팅-스토리지 통합형 클러스터의 제어 경로](/images/doris-operator/mermaid/04-architecture-integrated-control-path.jpg)

이 경로에서 주 Reconciler는 CR 읽기, 구성 요소 작업의 순서 지정, 유효하지 않은 리소스 정리, 상태 집계를 담당합니다. 구성 요소별 컨트롤러는 자신이 담당하는 구성 요소의 리소스를 생성하고 점검합니다.

## 컴퓨팅-스토리지 분리형 클러스터의 제어 경로 {#control-path-for-compute-storage-decoupled-clusters}

`DorisDisaggregatedCluster`는 컴퓨팅-스토리지 분리형 배포에 사용됩니다. 단일 리소스에 MetaService, FE 및 하나 이상의 ComputeGroups가 포함됩니다.

![컴퓨팅-스토리지 분리형 클러스터의 제어 경로](/images/doris-operator/mermaid/05-architecture-decoupled-control-path.jpg)

컴퓨팅-스토리지 통합형 모드와 비교하면, 이 경로에는 Doris 메타데이터 수준의 작업이 더 많이 포함됩니다. 예를 들어 ComputeGroup을 축소할 때 Operator는 먼저 decommission 또는 drop 작업을 수행한 후 Kubernetes 리소스를 업데이트해야 할 수 있습니다.

## Webhook 및 유효성 검사 {#webhook-and-validation}

Doris Operator는 선택적으로 Webhook을 활성화하여 기본값을 적용하고, 명백히 잘못된 구성이 Reconcile 흐름에 진입하기 전에 이를 거부할 수 있습니다.

일반적인 검사 항목은 다음과 같습니다.

- FE 복제본 설정과 선출 관련 설정이 서로 호환되는지 여부.
- 리소스 필드 형식이 CRD 제약 조건을 충족하는지 여부.
- 구성 요소의 구성이 Operator에서 지원하는 모델과 일치하는지 여부.

Webhook 활성화 여부는 배포 방식과 환경에 따라 달라집니다. Webhook이 없어도 CRD 스키마 유효성 검사와 Reconcile 상태 피드백을 통해 기본적인 제약 조건이 적용됩니다.

## 상태 집계 {#status-aggregation}

Operator는 리소스를 생성하는 것뿐만 아니라 구성 요소의 상태를 Doris 사용자 정의 리소스에 다시 기록합니다. `kubectl get` 또는 `kubectl describe`를 사용하면 구성 요소가 사용 가능한지, 확장 또는 축소 중인지, 스케줄링을 기다리는지, 오류가 발생했는지 확인할 수 있습니다.

컴퓨팅-스토리지 통합형 클러스터에서는 FE, BE, CN 및 Broker별로 상태를 집계합니다. 컴퓨팅-스토리지 분리형 클러스터에서는 MetaService, FE 및 ComputeGroups별로 상태를 집계하며, 전체 상태 요약도 추가로 제공합니다.
