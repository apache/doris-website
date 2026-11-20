---
{
    "title": "FoundationDB 배포",
    "language": "ko",
    "description": "Kubernetes에 버전이 고정된 FoundationDB Operator와 데이터베이스를 설치하고, 미러링된 이미지, 리소스 계획, 클라이언트 호환성 및 준비 상태를 확인합니다.",
    "keywords": [
        "Doris",
        "Kubernetes",
        "FoundationDB",
        "fdb-kubernetes-operator",
        "resources",
        "VeloDB"
    ]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview)(FDB)는 강한 일관성을 제공하는 분산 데이터베이스입니다. Doris는 컴퓨팅과 스토리지가 분리된 모드에서 FoundationDB를 사용해 메타데이터를 저장합니다.

Doris를 배포하기 전에 FoundationDB 서비스를 준비하세요. 환경에 맞는 배포 방법을 선택하세요.

- [수동 배포 가이드](../../deploy-manually/separating-storage-compute-deploy-manually.md)에 따라 머신에 직접 배포합니다. 배포 후 MetaService가 FoundationDB에 접근할 수 있는지 확인하세요.
- 아래 단계에 따라 fdb-kubernetes-operator를 사용해 Kubernetes에 배포합니다.

## 시작하기 전에 {#before-you-start}

Kubernetes에 FoundationDB를 배포하려면 다음을 준비하세요.

- CRD, RBAC 리소스 및 워크로드를 생성할 권한이 있는 Kubernetes 계정.
- 쓰기가 가능한 SSD 기반 StorageClass와 아래에 나열된 리소스를 수용할 충분한 용량이 있는 노드.
- 정상적으로 작동하는 클러스터 DNS와 MetaService에서 FDB Pod로의 네트워크 연결.

예제에서는 FDB 7.3.69를 사용하며, MetaService에는 호환되는 7.3 클라이언트 라이브러리가 필요합니다. 사용 중인 Doris 버전이 7.1 클라이언트를 사용한다면 [FDB 7.1 지침](#fdb-71)을 따르세요. Operator의 클라이언트는 컨트롤러에서 사용하며 MetaService의 클라이언트 라이브러리를 업데이트하지 않습니다.

:::tip
이 가이드는 FDB를 새로 설치하는 방법을 설명합니다. FDB Operator가 이미 설치되어 있다면 여러 컨트롤러가 동일한 네임스페이스를 관리하지 않도록 기존 Operator를 재사용할 수 있는지 확인하세요. CRD는 클러스터 전체에 적용되므로 업데이트하기 전에 기존 FDB 클러스터와의 호환성을 확인하세요. 기존 클러스터의 업그레이드는 별도로 계획하세요.
:::

## 버전과 이미지 출처 {#versions-and-image-sources}

이 가이드는 [VeloDB FDB Operator에서 제공하는 배포 예제](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/samples/velodb)를 사용합니다. CRD는 Operator v2.35.0과 일치하는 [VeloDB FDB Operator 저장소의 branch-2.35.0](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/crd/bases)에서 다운로드합니다. 호환성과 배포 설정을 사용자 환경에 맞게 변경하는 방법은 [예제 가이드](https://github.com/velodb/fdb-kubernetes-operator/blob/branch-2.35.0/config/samples/velodb/README.md)를 참조하세요. 예제에서는 다음 이미지를 사용합니다.

| 구성 요소 | 버전 | VeloDB 이미지 |
| --- | --- | --- |
| FDB Operator / 일치하는 CRD | v2.35.0 | `velodb/fdb-kubernetes-operator:v2.35.0` |
| 컨트롤러 클라이언트 초기화 컨테이너 / FDB 데이터베이스 | 7.3.69 | `velodb/fdb-kubernetes-monitor:7.3.69` |

이 이미지들은 linux/amd64와 linux/arm64를 지원합니다. 예제에서는 `imageType: unified`를 사용하므로 FDB 메인 컨테이너와 사이드카가 Monitor 이미지를 공유합니다. 컨트롤러도 이 이미지를 사용해 클라이언트를 초기화합니다.

이 가이드에서 제공하는 CRD, Operator 및 클러스터 예제를 함께 사용하세요. `config/samples/` 바로 아래의 일반 예제와 Helm 차트는 별도의 설치 경로입니다. 해당 경로의 컨트롤러, 클라이언트 또는 데이터베이스 설정을 이 버전별 구성과 혼용하지 마세요.

## 리소스 계획 {#resource-planning}

FDB Operator와 FDB 클러스터 모두에 필요한 리소스를 계획하세요. Operator의 requests와 limits는 모두 **500m CPU / 256Mi**이고, 클라이언트 초기화 컨테이너의 requests와 limits는 모두 **10m CPU / 50Mi**입니다.

VeloDB FDB Operator 저장소는 단일 복제본 및 이중 복제본 클러스터 예제를 제공합니다. 용도에 맞게 선택하세요.

| 설정 | 단일 복제본(개발용) | 이중 복제본 |
| --- | --- | --- |
| storage / log / stateless Pod | 1 / 1 / 2 | 3 / 4 / 9 |
| Pod당 메인 컨테이너 requests | 1 CPU / 1Gi | 1 CPU / 8Gi |
| Pod당 메인 컨테이너 limits | 1 CPU / 2Gi | 2 CPU / 8Gi |
| Pod당 사이드카 requests = limits | 100m CPU / 256Mi | 100m CPU / 256Mi |
| storage / log Pod당 PVC | 10Gi / 10Gi | 200Gi / 100Gi |
| 전체 Pod / PVC | 4 / 2 | 16 / 7 |
| 사이드카를 포함한 전체 requests | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| 요청한 전체 PVC 용량 | 20Gi | 1000Gi |

합계에는 사이드카가 포함되지만 Operator, MS/FE/BE 및 Kubernetes 오버헤드는 포함되지 않습니다. Stateless Pod에는 영구 데이터 PVC가 필요하지 않습니다. 롤링 교체에 대비해 추가 Pod와 스토리지 용량을 확보하세요.

단일 복제본 예제는 소규모 기능 테스트를 위한 것입니다. 메모리 설정이 낮으므로 워크로드에 맞는 메모리 및 캐시 설정을 확인하고 OOM 오류가 발생하는지 살펴보세요. 업스트림 기본값은 메인 컨테이너당 1 CPU / 8Gi이며 requests와 limits가 같습니다. [리소스 요구 사항](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements)을 참조하세요.

이중 복제본 클러스터에는 서로 독립적인 호스트 장애 도메인이 최소 세 개 필요합니다. 배포 후 storage, log 및 coordinator 프로세스가 노드 간에 적절히 분산되었는지 확인하세요. 예제에서는 선호되는 안티어피니티를 사용하므로 같은 역할의 Pod 여러 개가 한 노드에 배치될 수 있습니다. 역할별로 각 노드에 Pod를 하나씩만 배치해야 한다면 아홉 개의 stateless Pod를 위해 스케줄링 가능한 노드가 최소 아홉 개 필요합니다. [장애 도메인 설정](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md)을 참조하세요.

프로덕션에서는 SSD 스토리지를 사용하고 메타데이터 크기, 쓰기 부하 및 복구 공간에 맞춰 리소스를 조정하세요. 예제는 storage Pod당 200Gi, log Pod당 100Gi를 할당합니다. 필요에 따라 이 값을 변경하세요. 여러 Doris 클러스터가 FDB를 공유한다면 전체 부하를 기준으로 계획하고 프로덕션 사용 전에 용량을 검증하세요. 각 storage/log Pod는 서버 프로세스 하나를 실행합니다. 프로세스 수를 늘리면 CPU와 메모리를 조정하세요.

## Kubernetes에 FoundationDB 배포 {#deploy-foundationdb-on-kubernetes}

Kubernetes에 FoundationDB를 배포하는 과정은 네 단계로 이루어집니다.

1. 배포 파일을 다운로드합니다.
2. CRD, FDB Operator 및 Monitor RBAC를 배포합니다.
3. FoundationDB 클러스터를 배포합니다.
4. 클러스터 상태를 확인합니다.

다음 단계에서는 `fdb-system` 네임스페이스를 사용합니다. Operator는 이 네임스페이스의 FDB 클러스터만 관리합니다. 다른 네임스페이스를 사용하려면 배포 파일에서 객체의 네임스페이스와 RBAC subject의 네임스페이스를 함께 변경하세요.

### 단계 1: 설치 파일 다운로드 {#step-1-download-the-installation-assets}

`/path/to/kubeconfig`를 Kubernetes 클러스터의 구성 파일 경로로 바꾼 다음 기존 FDB 리소스, 컨트롤러 및 StorageClass를 확인하세요.

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

FDB CRD 또는 컨트롤러가 이미 있다면 재사용할 수 있는지 먼저 확인하세요. 새 환경에서는 다음 명령으로 배포 파일을 다운로드하세요.

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_CRDS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/branch-2.35.0/config/crd/bases
FDB_ASSETS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/branch-2.35.0/config/samples/velodb
for resource in clusters backups restores; do
  curl -fSL "$FDB_CRDS/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# Development profile. Use cluster-double.yaml instead for the double profile.
curl -fSL "$FDB_ASSETS/cluster-single.yaml" -o fdb-cluster.yaml
```

### 단계 2: CRD, 컨트롤러 및 Monitor RBAC 설치 {#step-2-install-crds-the-controller-and-monitor-rbac}

다운로드한 Operator, 초기화 컨테이너 및 데이터베이스 구성에는 위에 나열한 VeloDB 이미지가 이미 설정되어 있습니다.

다음 명령으로 CRD, Operator 및 Monitor RBAC를 배포하세요.

```shell
kubectl --kubeconfig "$KUBECONFIG" create namespace fdb-system
kubectl --kubeconfig "$KUBECONFIG" apply --server-side \
  -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl --kubeconfig "$KUBECONFIG" wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-operator.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-monitor-rbac.yaml
```

세 CRD가 모두 Established 상태가 되고 Operator Deployment의 롤아웃이 성공하면 FDB 클러스터 배포를 계속하세요. CRD 파일은 클라이언트 측 last-applied 어노테이션에 담기에는 너무 크므로 `--server-side`를 사용합니다. 기존 리소스와 충돌하면 `--force-conflicts`로 덮어쓰기 전에 버전과 소유 관계를 확인하세요.

`fdb-monitor-rbac.yaml`은 FDB Pod를 위한 전용 `fdb-monitor` ServiceAccount를 만들고 이 네임스페이스의 Pod에 대한 get/list/watch/patch 권한을 부여합니다.

### 단계 3: 데이터베이스 설정 및 생성 {#step-3-configure-and-create-the-database}

`fdb-cluster.yaml`을 열고 두 곳의 `REPLACE_WITH_SSD_STORAGE_CLASS`를 사용 중인 StorageClass로 바꾸세요. 위의 리소스 계획 섹션을 참고해 CPU, 메모리 및 PVC 용량을 조정하세요. 단일 복제본 예제는 개발용입니다. 프로덕션에서는 이중 복제본을 선택하고 워크로드에 맞게 용량을 설정하세요.

예제에는 Monitor ServiceAccount, 호스트 장애 도메인, FQDN 라우팅 및 Pod당 서버 프로세스 하나가 이미 설정되어 있습니다. 설정을 변경할 때는 다음 사항을 확인하세요.

- `spec.version`, `mainContainer.imageConfigs[].version` 및 `tag`를 이미지에 포함된 FDB 버전과 일치시키세요. 7.1을 사용한다면 먼저 [FDB 7.1 설정](#fdb-71)을 완료하세요.
- 컨테이너는 UID/GID 4059로 실행되며 볼륨 권한에 `fsGroup: 4059`를 사용합니다. CSI 드라이버가 이 그룹의 쓰기를 지원하는지 확인하세요. 사용자 지정 이미지를 사용한다면 이미지에 맞게 사용자 ID와 그룹 ID를 조정하세요.

설정을 변경한 후 클러스터를 배포하세요.

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-cluster.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb
```

단일 복제본 예제는 `fdb-single`을, 이중 복제본 예제는 `fdb-double`을 생성합니다. 다음 명령에서는 `fdb-single`을 사용합니다. 이중 복제본 예제를 사용한다면 `fdb-double`로 바꾸세요.

### 단계 4: 가용성과 조정 상태 확인 {#step-4-verify-availability-and-reconciliation}

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get pods,pvc
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb fdb-single -o yaml
```

배포 후 다음 사항을 확인하세요.

- 볼륨이 바인딩되었고 데이터베이스 컨테이너가 정상적으로 시작되었습니다. Pod가 Running 상태인 것만으로는 충분하지 않습니다.
- `status.configured`, `status.health.available` 및 `status.health.fullReplication`이 `true`입니다.
- `status.generations.reconciled`가 `metadata.generation`에 도달했습니다. 데이터베이스를 사용할 수 있어도 교체 또는 규모 축소 작업을 조정하는 중일 수 있습니다.

이러한 확인을 마치면 생성된 ConfigMap을 사용해 MetaService를 설정하고, 테이블을 만들기 전에 FDB에 연결되는지 확인하세요. 프로덕션 사용 전에는 클러스터 상태, coordinator 배치 및 호스트 장애 시 가용성도 검증하세요.

## FoundationDB 접속 정보가 포함된 ConfigMap 가져오기 {#get-the-configmap-that-contains-foundationdb-access-information}

Operator는 데이터베이스 네임스페이스에 `<FoundationDBCluster name>-config`를 생성합니다.

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get configmap fdb-single-config -o yaml
```

Doris 리소스를 다음과 같이 설정하세요. 이중 복제본 예제에서는 `fdb-double-config`를 사용합니다.

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        namespace: fdb-system
        name: fdb-single-config
```

이 설정을 `DorisDisaggregatedCluster` 리소스에 추가하세요. 자세한 내용은 [MetaService 설정](config-ms.md)을 참조하세요.

:::tip
여러 Doris 클러스터가 하나의 FDB를 공유할 수 있습니다. 개별 Doris 클러스터를 삭제할 때는 공유 FDB를 유지하세요. FDB 리소스나 PVC를 삭제하면 메타데이터가 손실될 수 있으므로 백업 및 복구 계획을 마련하세요.
:::

## FDB 7.1이 필요한 MetaService 빌드를 위한 옵션 {#fdb-71}

MetaService가 7.1 클라이언트를 사용한다면 amd64 노드에 FDB 7.1.67 클러스터를 생성할 수 있습니다. FDB 클러스터를 배포하기 전에 다음 명령으로 Operator에 7.1 클라이언트를 추가하세요.

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

복사한 클러스터 YAML에서 `spec.version`과 메인 이미지 설정의 `version` 및 `tag`를 `7.1.67`로 변경하세요. 7.1.67 이미지는 amd64만 지원합니다. 아키텍처가 혼합된 클러스터에서는 컨트롤러와 모든 데이터베이스 Pod 템플릿에 `nodeSelector: {kubernetes.io/arch: amd64}`를 설정하세요. 이 설정은 MetaService와 호환되는 새 클러스터를 생성하기 위한 것이며, 기존 FDB 클러스터를 다운그레이드하는 절차가 아닙니다.

## 프라이빗 레지스트리 및 문제 해결 {#private-registries-and-troubleshooting}

환경에서 Docker Hub에 접근할 수 없다면 필요한 이미지를 프라이빗 레지스트리에 복사하고 배포 파일을 수정하세요.

- Operator와 초기화 컨테이너: `image`를 변경하세요.
- FDB 클러스터: `mainContainer.imageConfigs[].baseImage`를 변경하고 이미지에 포함된 FDB 버전을 `spec.version`과 일치시키세요. unified 모드에서는 메인 컨테이너와 사이드카가 이 이미지를 공유합니다.
- 레지스트리에 인증이 필요하다면 Operator와 FDB Pod 템플릿 모두에 `imagePullSecrets`를 설정하세요.

사용하는 모든 클라이언트 초기화 컨테이너 이미지를 포함하고 노드에 맞는 플랫폼을 선택하세요. 일반적인 배포 문제와 확인 사항은 다음과 같습니다.

| 증상 | 확인 사항 |
| --- | --- |
| 컨트롤러 초기화 실패 / 이미지 실행 불가 | 미러 접근, 태그, 노드 아키텍처. 선택 사항인 7.1 초기화 컨테이너는 amd64만 지원 |
| PVC 또는 Pod가 Pending 상태 | StorageClass, CSI 프로비저닝, 용량, 리소스 requests, 노드 셀렉터 및 안티어피니티 |
| `File could not be written` | 볼륨 소유권, UID/GID/fsGroup 및 CSI 권한 처리 |
| FDB 조정이 완료되지 않음 | 컨트롤러가 감시하는 네임스페이스와 RBAC, Events, 컨트롤러 로그, 교체에 필요한 용량 및 복구 진행 상태 |
| FDB를 사용할 수 있지만 MS가 연결하지 못함 | MetaService 클라이언트 호환성, 생성된 연결 정보, DNS 및 Pod 네트워크 |

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get events --sort-by=.metadata.creationTimestamp
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system logs \
  deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

문제를 해결하는 동안 기존 클러스터에서 사용하는 데이터를 보호할 수 있도록 공유 CRD, FDB 클러스터 및 PVC를 유지하세요.
