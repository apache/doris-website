---
{
    "title": "Doris Operator 개요",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "Doris Operator의 개념, 적용 범위, 사용 사례, 기능의 한계를 소개합니다.",
    "keywords": ["Doris Operator", "Kubernetes", "DorisCluster", "DorisDisaggregatedCluster", "Kubernetes에 Doris 배포"]
}
---

[Doris Operator](https://github.com/apache/doris-operator)는 Apache Doris의 공식 Kubernetes Operator입니다. Doris 운영 경험과 Kubernetes 네이티브 리소스 관리를 결합하여 Kubernetes에서 Doris를 더 간단하고 효율적이며 편리하게 배포하고 운영할 수 있도록 합니다.

Doris Operator는 CustomResourceDefinitions(CRDs)를 통해 Kubernetes API를 확장합니다. Doris 사용자 정의 리소스를 제출하면 Operator가 이에 해당하는 `StatefulSet`, `Service`, `PersistentVolumeClaim` 등의 Kubernetes 리소스를 생성하고 유지 관리하며, 일부 상황에서는 노드 등록, 디커미셔닝, 정리와 같은 Doris 메타데이터 수준의 작업도 수행합니다.

이 문서는 Doris Operator의 역할과 관리 대상, 사용하기 적합한 상황을 설명합니다. 먼저 기본 개념을 올바르게 이해하는 데 도움을 주기 위한 문서입니다. 설치 및 배포 절차는 컴퓨팅-스토리지 통합 모드와 컴퓨팅-스토리지 분리 모드의 배포 문서를 참조하세요.

## Doris Operator를 사용하는 이유 {#why-use-doris-operator}

Kubernetes에 Doris를 배포하려면 여러 컴포넌트의 조정, 서비스 검색, 설정 마운트, 스토리지 바인딩, 노드 등록, 확장 및 축소, 상태 검사를 함께 관리해야 합니다. 클러스터가 커지거나 환경이 복잡해질수록 이러한 리소스를 수동으로 관리하면 설정이 분산되고 운영 단계가 많아지며 상태를 추적하기 어려워질 수 있습니다.

Doris Operator를 사용하면 Doris 사용자 정의 리소스로 원하는 클러스터 상태를 선언적으로 정의할 수 있습니다. Operator는 이를 바탕으로 다음 기능을 제공합니다.

- 단일 리소스로 클러스터 토폴로지 정의.
- `StatefulSet`, `Service`, PVC 및 관련 리소스의 자동 생성과 유지 관리.
- 의존 관계에 따른 순차적 컴포넌트 시작 및 변경.
- 컴포넌트 상태를 CR의 `status`에 집계.
- 설정 변경, 확장 및 축소, 롤링 업데이트 등 일반적인 운영 작업 지원.
- 일부 상황에서 Doris 메타데이터 수준의 노드 등록, 디커미셔닝 또는 정리.

## 작동 방식 {#how-it-works}

Doris Operator는 CRDs를 통해 Kubernetes API를 확장합니다. `kubectl`, Helm 또는 다른 릴리스 도구로 Doris 클러스터 리소스를 제출하면 Operator가 해당 리소스를 감시하고 이를 `StatefulSet`, `Service`, `PersistentVolumeClaim` 등의 Kubernetes 네이티브 리소스로 변환합니다.

![Doris Operator 작동 방식](/images/doris-operator/mermaid/01-overview-how-doris-operator-works.jpg)

이 모델에서는 사용자가 원하는 상태를 관리하고, Operator는 실제 상태가 해당 목표에 맞도록 지속적으로 조정합니다.

## 아키텍처 {#architecture}

Doris Operator는 컨트롤 플레인과 데이터 플레인의 두 계층으로 볼 수 있습니다. 컨트롤 플레인에는 Doris Operator, Reconciler, 선택적 Webhook 로직, 상태 집계 기능이 포함됩니다. 이 계층은 Doris 사용자 정의 리소스를 감시하고 실제 상태가 원하는 상태에 맞도록 조정합니다. 데이터 플레인에는 `StatefulSet`, `Service`, PVC, HPA, Doris Pod 등의 Kubernetes 네이티브 리소스가 포함되며, 실제 Doris 컴포넌트를 실행합니다.

![Doris Operator 아키텍처 계층](/images/doris-operator/mermaid/02-architecture-layers.jpg)

사용자가 `kubectl`, Helm 또는 다른 릴리스 도구로 Doris 사용자 정의 리소스를 제출하면 Kubernetes API Server가 원하는 상태를 저장합니다. Doris Operator는 리소스 변경을 감시하고 Reconcile 로직을 실행한 다음, 기반 Kubernetes 리소스를 생성하거나 업데이트합니다. 이러한 계층 모델은 다수의 하위 수준 리소스를 직접 관리하는 복잡성을 줄이고, Doris 배포가 표준 Kubernetes 플랫폼의 방식에 부합하도록 합니다.

## 지원하는 클러스터 리소스 {#supported-cluster-resources}

Doris Operator는 주로 두 가지 클러스터 리소스 유형을 지원합니다.

| 리소스 | 배포 모드 | 주요 컴포넌트 | 일반적인 사용 사례 |
| --- | --- | --- | --- |
| `DorisCluster` | 컴퓨팅-스토리지 통합 | FE, BE, CN, Broker | 더 간단한 운영 모델을 사용하는 표준 Doris 클러스터 배포 |
| `DorisDisaggregatedCluster` | 컴퓨팅-스토리지 분리 | MetaService, FE, ComputeGroup | 탄력적인 컴퓨팅 그룹 또는 컴퓨팅 격리가 필요한 워크로드 |

- `DorisCluster`는 컴퓨팅-스토리지 통합 배포에 사용됩니다. 단일 리소스로 FE, BE, CN, Broker의 이미지, 복제본 수, 리소스, 스토리지, 설정, 접근 방식을 정의할 수 있습니다.
- `DorisDisaggregatedCluster`는 컴퓨팅-스토리지 분리 배포에 사용됩니다. 클러스터를 MetaService, FE, 하나 이상의 ComputeGroup으로 나누며, 각각을 독립적으로 설정하고 운영할 수 있습니다.

## 관리 대상 {#managed-objects}

사용자 관점에서 Doris Operator가 주로 관리하는 대상은 다음과 같습니다.

| 대상 | 설명 |
| --- | --- |
| Doris 사용자 정의 리소스 | `DorisCluster` 또는 `DorisDisaggregatedCluster` 등으로 정의하는 원하는 클러스터 상태 |
| `StatefulSet` | Doris 컴포넌트 Pod의 복제본 수, 고정된 네트워크 식별자, 롤링 업데이트 |
| `Service` | 내부 통신 및 외부 접근 |
| PVC | 상태를 유지하는 컴포넌트의 영구 스토리지 |
| `ConfigMap` / `Secret` | 설정, 자격 증명, 외부 의존성 정보 |
| HPA | 지원되는 컴포넌트의 자동 확장 및 축소 |
| `status` | 컴포넌트 상태, 가용성, 클러스터의 정상 동작 여부 |

## 배포 모드 선택 {#choosing-a-deployment-mode}

Kubernetes에 Doris를 처음 배포한다면 대부분의 경우 컴퓨팅-스토리지 통합 모드로 시작하세요. 탄력적인 컴퓨팅 그룹, 컴퓨팅 격리 또는 객체 스토리지 기반 아키텍처가 명확히 필요한 경우에는 컴퓨팅-스토리지 분리 모드를 선택하세요.

| 요구 사항 | 권장 선택 |
| --- | --- |
| 표준 Doris 클러스터를 빠르게 배포 | `DorisCluster` |
| 적은 개념만으로 검증 | `DorisCluster` |
| 워크로드별로 서로 다른 컴퓨팅 리소스 사용 | `DorisDisaggregatedCluster` |
| 컴퓨팅 리소스를 더 유연하게 확장 및 축소 | `DorisDisaggregatedCluster` |
| 객체 스토리지와 FoundationDB를 사용할 계획이 이미 있음 | `DorisDisaggregatedCluster` |

## 기능 범위와 한계 {#capability-boundaries}

Doris Operator는 Doris 클러스터 리소스와 수명 주기 관리에 중점을 둡니다. Doris의 데이터베이스 수준 관리 기능을 대체하지는 않습니다.

다음 항목은 직접 관리하지 않습니다.

- 데이터베이스, 테이블, 파티션, 인덱스 등의 SQL 객체.
- 데이터 가져오기, 내보내기 또는 워크로드 오케스트레이션 정책.
- 사용자 권한 모델 설계.
- 모든 장애에 대한 자동 복구.
- 모든 Kubernetes, 스토리지 또는 네트워크 문제에 대한 완전한 추상화.

클러스터가 비정상 상태일 때는 Operator 상태, Kubernetes 리소스 상태, Doris 컴포넌트 로그를 함께 살펴보고 문제의 원인을 찾아야 합니다.

## 다음 단계 {#next-steps}

Doris Operator를 처음 사용한다면 다음 문서들을 순서대로 읽어보세요. 특정 문제를 해결하고 있다면 관련 페이지로 바로 이동하세요.

| 목표 | 권장 문서 |
| --- | --- |
| 컨트롤 플레인, 데이터 플레인, Reconcile 모델 이해 | [Doris Operator 아키텍처](./architecture) |
| Doris 사용자 정의 리소스가 `StatefulSet`, `Service`, PVC 및 기타 리소스에 어떻게 매핑되는지 이해 | [Doris Operator 리소스 모델](./resource-model) |
| 생성, 확장 및 축소, 설정 변경, 삭제 시 동작 이해 | [Doris Operator 수명 주기 관리](./lifecycle) |
| 상태 필드와 문제 해결 절차 이해 | [Doris Operator 상태 및 문제 해결](./status-and-troubleshooting) |
