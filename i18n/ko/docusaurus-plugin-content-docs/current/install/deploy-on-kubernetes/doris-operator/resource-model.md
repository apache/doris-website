---
{
    "title": "Doris Operator 리소스 모델",
    "sidebar_label": "리소스 모델",
    "language": "ko",
    "description": "DorisCluster와 DorisDisaggregatedCluster의 리소스 모델, 그리고 Doris 컴포넌트가 StatefulSet, Service, PVC, ConfigMap, Secret, HPA에 매핑되는 방식을 설명합니다.",
    "keywords": ["Doris Operator 리소스 모델", "DorisCluster", "DorisDisaggregatedCluster", "StatefulSet", "Service", "PVC"]
}
---

Doris Operator 리소스 모델은 Doris 클러스터 컴포넌트가 Kubernetes 기본 리소스에 매핑되는 방식을 설명합니다. 이 매핑을 이해하면 각 필드가 어떤 기반 리소스에 영향을 주는지 판단할 수 있으며, 문제를 더 쉽게 해결할 수 있습니다.

이 문서에서는 모든 필드를 나열하지 않습니다. 필드별 구성은 해당 배포 및 구성 문서를 참조하세요.

## 최소 예제 {#minimal-example}

다음은 최소한으로 구성한 `DorisCluster` 예제입니다. FE와 BE는 각각 해당하는 `StatefulSet`, `Service`, PVC 및 관련 리소스에 매핑됩니다.

```yaml
apiVersion: doris.apache.com/v1
kind: DorisCluster
metadata:
  name: demo
  namespace: doris
spec:
  feSpec:
    replicas: 3
    image: apache/doris:fe-2.1.8
  beSpec:
    replicas: 3
    image: apache/doris:be-2.1.8
```

## 개요 {#overview}

배포 모드에 관계없이 사용자는 Doris 사용자 정의 리소스를 직접 관리합니다. Operator는 이 리소스를 기반으로 Kubernetes 기본 리소스를 생성하며, 생성된 리소스에서 Doris 컴포넌트가 실행됩니다.

![Doris Operator 리소스 모델 개요](/images/doris-operator/mermaid/06-resource-model-overview.jpg)

## DorisCluster {#doriscluster}

`DorisCluster`는 컴퓨팅-스토리지 통합형 배포에 사용됩니다. 일반적으로 FE, BE, CN, Broker 컴포넌트를 포함합니다.

![DorisCluster 리소스 모델](/images/doris-operator/mermaid/07-resource-model-doriscluster.jpg)

| 컴포넌트 | 설명 | 주요 Kubernetes 리소스 |
| --- | --- | --- |
| FE | 메타데이터 관리, SQL 접속 및 쿼리 조정 | `StatefulSet`, 내부 Service, 외부 Service, PVC |
| BE | 데이터 저장 및 실행 | `StatefulSet`, 내부 Service, 외부 Service, PVC |
| CN | 탄력적 컴퓨팅 환경에서의 연산 실행 | `StatefulSet`, 내부 Service, 외부 Service, PVC, HPA |
| Broker | 외부 스토리지 접근 프록시. 필요 여부는 Doris 버전과 워크로드에 따라 달라짐 | `StatefulSet`, 내부 Service |

## DorisDisaggregatedCluster {#dorisdisaggregatedcluster}

`DorisDisaggregatedCluster`는 컴퓨팅-스토리지 분리형 배포에 사용됩니다. 일반적으로 MetaService, FE 및 하나 이상의 ComputeGroups를 포함합니다.

![DorisDisaggregatedCluster 리소스 모델](/images/doris-operator/mermaid/08-resource-model-disaggregatedcluster.jpg)

| 컴포넌트 | 설명 | 주요 Kubernetes 리소스 |
| --- | --- | --- |
| MetaService | 컴퓨팅-스토리지 분리형 클러스터의 메타데이터 서비스 | `StatefulSet`, Service, PVC |
| FE | SQL 접속, 쿼리 조정 및 메타데이터 접근 진입점 | `StatefulSet`, 내부 Service, 외부 Service, PVC |
| ComputeGroup | 컴퓨팅 작업을 실행하는 독립적인 컴퓨팅 리소스 그룹 | `StatefulSet`, 내부 Service, 외부 Service, PVC |
| FoundationDB | 컴퓨팅-스토리지 분리형 클러스터가 메타데이터 관리를 위해 의존하는 구성 요소 | 외부 서비스 또는 `fdb-kubernetes-operator`로 관리 |

## Service 유형 {#service-types}

Doris Operator는 용도에 따라 Service를 생성합니다.

| Service 유형 | 목적 | 일반적인 용도 |
| --- | --- | --- |
| 내부 Service | 안정적인 네트워크 식별 정보 및 내부 통신 | StatefulSet DNS, 컴포넌트 검색, Pod 간 접근 |
| 외부 Service | 외부 접근 진입점 | 클라이언트 연결 및 외부 시스템 접근 |

내부 Service는 일반적으로 업무용 접근 진입점으로 사용되지 않습니다. 사용 환경에 따라 외부 Service를 `ClusterIP`, `NodePort` 또는 `LoadBalancer`로 구성할 수 있습니다.

## 스토리지 {#storage}

Doris는 상태를 유지하는 시스템입니다. FE, BE, CN, MetaService 및 ComputeGroups는 모두 영구 디렉터리가 필요할 수 있습니다. Operator는 PVC 템플릿을 통해 영구 스토리지를 바인딩합니다.

다음 사항을 확인하세요.

- Kubernetes 클러스터에 사용 가능한 StorageClass가 있는지 확인합니다.
- 데이터와 로그 증가량을 수용할 만큼 PVC 용량이 충분한지 확인합니다.
- 접근 모드가 워크로드에 적합한지 확인합니다.
- 구성된 Doris 디렉터리가 PVC 마운트 경로와 일치하는지 확인합니다.

PVC가 바인딩되지 않으면 Operator는 계속 대기하며 해당 Pod는 시작할 수 없습니다.

## 구성 및 인증 리소스 {#configuration-and-authentication-resources}

Doris Operator는 구성 및 민감한 데이터를 위해 `ConfigMap`과 `Secret`을 지원합니다.

| 리소스 | 일반적인 용도 |
| --- | --- |
| `ConfigMap` | FE, BE, CN, Broker, MetaService 및 ComputeGroups의 시작 구성 |
| `Secret` | 비밀번호, 접근 자격 증명 및 keytab |
| `authSecret` | Doris Operator가 노드 등록, 제거 및 관련 관리 작업에 사용하는 자격 증명 |
| `kerberosInfo` | Kerberos 구성 및 keytab 마운트 |
| `serviceAccount` | 컴포넌트가 클라우드 또는 외부 서비스에 접근해야 할 때 사용하는 Kubernetes ServiceAccount |

구성 업데이트가 재시작을 유발하는지는 해당 필드와 Operator 설정에 따라 달라집니다. 예를 들어 컴퓨팅-스토리지 통합형 모드에서는 `enableRestartWhenConfigChange`가 핵심 ConfigMap 변경 시 롤링 재시작을 수행할지 제어합니다.

## 이름 지정 {#naming}

Operator가 관리하는 리소스는 일반적으로 클러스터 이름과 컴포넌트 이름을 접두사로 사용하므로, 어느 클러스터와 컴포넌트에 속하는지 쉽게 식별할 수 있습니다.

컴퓨팅-스토리지 통합형 클러스터의 이름이 `demo`인 경우 일반적인 리소스 이름은 다음과 같습니다.

```text
demo-fe
demo-fe-internal
demo-fe-service
demo-be
demo-be-internal
demo-be-service
demo-cn
demo-cn-internal
demo-cn-service
demo-broker
demo-broker-internal
```

컴퓨팅-스토리지 분리형 클러스터의 이름이 `demo`이고 ComputeGroup의 이름이 `adhoc-query`인 경우 일반적인 리소스 이름은 다음과 같습니다.

```text
demo-ms
demo-fe
demo-fe-internal
demo-adhoc-query
demo-adhoc-query-external
```

실제 이름은 버전이나 구성에 따라 약간 다를 수 있습니다. `kubectl get` 출력을 기준으로 확인하세요.

## 컴포넌트 간 의존 관계 {#dependencies-between-components}

리소스 모델에는 컴포넌트 간 의존 관계도 반영되어 있습니다.

컴퓨팅-스토리지 통합형 클러스터에서 FE는 다른 컴포넌트가 등록하고 Doris 메타데이터에 접근하는 진입점입니다.

![DorisCluster의 컴포넌트 간 의존 관계](/images/doris-operator/mermaid/09-resource-model-integrated-dependencies.jpg)

컴퓨팅-스토리지 분리형 클러스터에서는 MetaService가 먼저 준비되고, FE는 MetaService에 의존하며, ComputeGroups는 FE에 의존합니다.

![DorisDisaggregatedCluster의 컴포넌트 간 의존 관계](/images/doris-operator/mermaid/10-resource-model-decoupled-dependencies.jpg)

상위 컴포넌트가 준비되지 않으면 하위 컴포넌트는 계속 대기하거나 조정을 반복할 수 있습니다. 이는 정상적인 동작입니다. 생성 및 변경 작업의 실행 순서는 [Doris Operator 수명 주기 관리](./lifecycle)를 참조하세요.
