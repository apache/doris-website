---
{
    "title": "Doris Operator 수명 주기 관리",
    "sidebar_label": "수명 주기 관리",
    "language": "ko",
    "description": "클러스터 생성, 확장, 축소, 구성 변경, 롤링 업데이트 및 삭제 시 Doris Operator의 주요 동작을 설명합니다.",
    "keywords": ["Doris Operator 수명 주기", "스케일 아웃", "스케일 인", "롤링 업데이트", "구성 변경", "DorisCluster", "DorisDisaggregatedCluster"]
}
---

Doris Operator는 Reconcile 루프를 통해 Doris 클러스터를 관리합니다. Doris 사용자 정의 리소스가 변경되면 Operator는 새로운 목표 상태에 맞춰 기반 Kubernetes 리소스를 업데이트하고, 필요한 경우 Doris 메타데이터 수준의 작업을 수행합니다.

이 문서에서는 이러한 변경에 따른 운영 동작을 설명합니다.

## 클러스터 생성 {#cluster-creation}

`DorisCluster` 또는 `DorisDisaggregatedCluster`를 생성하면 Operator는 해당 리소스의 구성 요소 설정에 따라 기반 Kubernetes 리소스를 생성합니다.

컴퓨팅·스토리지 통합형 클러스터에서는 일반적으로 FE가 먼저 생성됩니다.

![DorisCluster의 클러스터 생성 흐름](/images/doris-operator/mermaid/11-lifecycle-doriscluster-creation.jpg)

컴퓨팅·스토리지 분리형 클러스터에서는 MetaService가 먼저 생성됩니다.

![DorisDisaggregatedCluster의 클러스터 생성 흐름](/images/doris-operator/mermaid/12-lifecycle-decoupled-cluster-creation.jpg)

종속 구성 요소가 준비되지 않으면 Operator는 계속 대기하며 이후 Reconcile 루프에서 다시 시도합니다.

## 스케일 아웃 {#scale-out}

스케일 아웃은 일반적으로 구성 요소의 `replicas` 필드 값을 늘려 수행합니다. 예를 들면 다음과 같습니다.

```yaml
spec:
  beSpec:
    replicas: 5
```

Operator가 변경을 감지하면 해당 `StatefulSet`을 업데이트합니다. Kubernetes는 새 Pod를 생성하고, Operator는 준비 상태를 계속 확인하며 CR의 `status`를 업데이트합니다.

컴퓨팅·스토리지 분리형 클러스터에서 ComputeGroup을 스케일 아웃하는 방법도 동일합니다.

```yaml
spec:
  computeGroups:
    - uniqueId: adhoc-query
      replicas: 5
```

다음 사항에 유의하세요.

- 클러스터에 CPU, 메모리 및 스토리지가 충분한지 확인합니다.
- 새 Pod를 스케줄링할 수 있는지 확인합니다.
- PVC를 바인딩할 수 있는지 확인합니다.
- 새 노드를 Doris 클러스터에 등록할 수 있는지 확인합니다.

## 스케일 인 {#scale-in}

스케일 인은 데이터 복제본, 메타데이터 정족수, 노드 역할 또는 서비스 처리 용량에 영향을 줄 수 있으므로 스케일 아웃보다 위험이 큽니다.

:::caution 주의
프로덕션 클러스터를 스케일 인하기 전에 Doris 복제본 상태, 서비스 트래픽 및 롤백 방법을 확인하세요.
:::

### 컴퓨팅·스토리지 통합형 클러스터 {#compute-storage-integrated-clusters}

스케일 인의 위험은 구성 요소에 따라 다릅니다.

| 구성 요소 | 주요 고려 사항 |
| --- | --- |
| FE | Follower와 Observer 역할이 메타데이터 정족수에 영향을 줄 수 있습니다 |
| BE | 복제본 마이그레이션과 데이터 가용성을 고려해야 합니다 |
| CN | 데이터 복제본은 없지만 스케일 인이 컴퓨팅 용량과 캐시에 영향을 줍니다 |
| Broker | 외부 접근 작업이 여전히 의존하고 있는지 확인해야 합니다 |

FE의 복제본 수는 선거 참여 노드 수보다 적을 수 없습니다. 이 모드에서 스케일 인할 때는 클러스터 토폴로지와 Doris 수준의 위험을 각각 평가하세요.

### 컴퓨팅·스토리지 분리형 클러스터 {#compute-storage-decoupled-clusters}

ComputeGroup을 스케일 인할 때는 Doris 메타데이터 수준의 작업이 필요할 수 있습니다. 동작은 `enableDecommission`에 따라 달라집니다.

| 구성 | 동작 |
| --- | --- |
| `enableDecommission: true` | 스케일 인 전에 decommission을 수행하고 안전하게 제거할 수 있을 때까지 대기합니다 |
| `enableDecommission: false` | 해당 노드를 직접 삭제합니다 |

![ComputeGroup 스케일 인 흐름](/images/doris-operator/mermaid/13-lifecycle-computegroup-scale-in.jpg)

스케일 인 전에 현재 데이터 분포와 서비스 트래픽을 확인하세요.

## 구성 변경 {#configuration-changes}

Doris 시작 구성은 일반적으로 `ConfigMap`을 통해 마운트됩니다. 변경 시 재시작이 필요한지는 구성 유형과 Operator 설정에 따라 달라집니다.

컴퓨팅·스토리지 통합형 클러스터에서는 다음과 같이 설정합니다.

```yaml
spec:
  enableRestartWhenConfigChange: true
```

이 설정을 활성화하면 핵심 ConfigMap 변경 시 롤링 재시작이 트리거될 수 있습니다.

구성을 변경할 때는 다음 사항을 확인하세요.

- ConfigMap 키가 `fe.conf`와 같은 구성 요소별 요구 사항에 맞는지 확인합니다.
- 설정한 디렉터리가 PVC 마운트 경로와 일치하는지 확인합니다.
- 포트, FQDN 및 인증 설정이 Kubernetes 네트워크 모델에 맞는지 확인합니다.
- 구성 요소를 재시작해야만 변경 사항이 적용되는지 확인합니다.

## 롤링 업데이트 {#rolling-updates}

구성 요소 이미지, 일부 Pod 템플릿 필드 또는 구성 해시를 변경하면 StatefulSet 롤링 업데이트가 트리거될 수 있습니다.

권장 사항은 다음과 같습니다.

- 트래픽이 적은 시간대에 업데이트를 수행하세요.
- 먼저 클러스터에 해결되지 않은 장애가 없는지 확인하세요.
- 클라이언트의 재시도 동작을 확인하세요.
- 업그레이드 순서는 Doris 버전 업그레이드 문서를 따르세요.

## 클러스터 삭제 {#cluster-deletion}

Doris 사용자 정의 리소스가 삭제되면 Operator는 정리 절차를 시작하고 자신이 관리하는 Kubernetes 리소스를 제거합니다.

삭제 전에 다음 사항을 확인하세요.

- PVC를 유지해야 하는지 확인합니다.
- 오브젝트 스토리지, FoundationDB 또는 기타 외부 종속 리소스를 공유하고 있는지 확인합니다.
- 데이터 및 메타데이터 백업이 필요한지 확인합니다.
- 클라이언트가 여전히 연결되어 있는지 확인합니다.

:::caution 주의
CR을 삭제하면 해당 Kubernetes 리소스가 제거될 수 있습니다. 진행하기 전에 정리 범위와 백업 전략을 확인하세요.
:::

## 수명 주기 작업 관찰 {#observing-lifecycle-operations}

수명 주기 작업의 완료 여부는 CR의 `status`, Kubernetes 리소스 상태 및 Doris 구성 요소 상태를 함께 살펴 판단해야 합니다.

```shell
kubectl get dcr -n ${namespace}
kubectl describe dcr ${cluster_name} -n ${namespace}
kubectl get ddc -n ${namespace}
kubectl describe ddc ${cluster_name} -n ${namespace}
kubectl get pod,sts,svc,pvc -n ${namespace}
```

상태가 오랫동안 목표 상태에 도달하지 않으면 Operator 로그와 Kubernetes Events를 추가로 확인하여 문제가 스케줄링, 스토리지 바인딩, 구성 마운트, 노드 등록 또는 Doris 메타데이터 작업 중 어디에 있는지 파악하세요.
