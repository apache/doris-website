---
{
    "title": "MetaService 구성",
    "language": "ko",
    "description": "FoundationDB 접속 구성, 이미지 구성, 리소스 구성, 시작 매개변수 구성, 서비스 프로브 타임아웃 구성을 포함하여 메타데이터 관리 컴포넌트인 MetaService를 구성하는 방법을 자세히 안내합니다.",
    "keywords": ["Doris", "스토리지-컴퓨트 분리", "Kubernetes", "MetaService", "FoundationDB", "메타데이터", "구성"]
}
---

## 이 장에서 배울 내용 {#what-you-will-learn-in-this-chapter}

- MetaService가 FoundationDB에 접속하는 데 사용하는 연결 정보 구성
- MetaService 이미지 버전 사용자 지정
- MetaService에 적절한 컴퓨팅 리소스 할당
- ConfigMap을 통한 MetaService 시작 매개변수 사용자 지정
- MetaService의 활성 프로브 타임아웃 및 시작 타임아웃 구성

## 개요 {#overview}

MetaService는 Doris 스토리지-컴퓨트 분리 클러스터의 메타데이터 관리 컴포넌트입니다. 클러스터 내부에서만 사용되며 외부에 노출되지 않습니다. 상태를 저장하지 않는 서비스이며, 일반적으로 active-standby 모드로 배포됩니다. 이 장에서는 `DorisDisaggregatedCluster` 리소스에서 MetaService를 구성하는 방법을 설명합니다.

전체 구성 항목은 다음과 같습니다.

| 구성 시나리오 | 구성 필드 | 필수 여부 | 적용 시나리오 |
|----------|----------|----------|----------|
| FoundationDB 연결 | `fdb.configMapNamespaceName` 또는 `fdb.address` | 필수 | 모든 시나리오 |
| 이미지 사용자 지정 | `image` | 선택 | 배포 예시의 이미지 버전이 요구 사항에 맞지 않는 경우 |
| 컴퓨팅 리소스 할당 | `requests` / `limits` | 선택 | CPU 및 메모리 사용량을 제한해야 하는 경우 |
| 시작 매개변수 사용자 지정 | `configMaps` | 선택 | 기본 시작 매개변수를 수정해야 하는 경우 |
| 활성 프로브 타임아웃 | `liveTimeout` | 선택 | 기본값인 180초가 요구 사항에 맞지 않는 경우 |
| 시작 타임아웃 | `startTimeout` | 선택 | 기본값인 300초가 요구 사항에 맞지 않는 경우 |

## 1. FoundationDB 연결 {#1-connect-to-foundationdb}

MetaService는 FoundationDB에 메타데이터를 저장하므로 FoundationDB 접속 정보를 구성해야 합니다. FoundationDB 배포 방식에 따라 두 가지 구성 방법을 사용할 수 있습니다.

| FoundationDB 배포 방식 | 권장 구성 방법 | 구성 필드 |
|----------------------|--------------|----------|
| `fdb-kubernetes-operator`를 통해 Kubernetes에 배포 | Operator가 자동으로 생성한 ConfigMap 참조 | `fdb.configMapNamespaceName` |
| 물리 서버에 직접 배포 | 접속 주소 직접 지정 | `fdb.address` |

### 방법 1: ConfigMap을 통한 접속 정보 구성 {#method-1-configure-access-information-through-a-configmap}

FoundationDB 클러스터를 `fdb-kubernetes-operator`를 통해 배포한 경우, Operator가 자동으로 생성한 ConfigMap을 바로 사용할 수 있습니다. 이 ConfigMap에는 FoundationDB 접속 주소가 포함되어 있습니다.

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}
        namespace: ${namespace}
```

매개변수 설명:

- `${foundationdbConfigMapName}`: ConfigMap의 이름
- `${namespace}`: FoundationDB가 배포된 네임스페이스

`fdb-kubernetes-operator`가 생성한 ConfigMap을 찾으려면 FoundationDB 배포 장의 [FoundationDB 접속 정보가 포함된 ConfigMap 가져오기](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)를 참조하세요.

### 방법 2: 접속 주소 직접 구성 {#method-2-configure-the-access-address-directly}

FoundationDB가 물리 서버에 배포된 경우, MetaService 구성에서 접속 주소를 직접 지정할 수 있습니다.

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

매개변수 설명:

- `${fdbEndpoint}`: FoundationDB에 접속하는 데 사용하는 주소

물리 서버에 배포된 환경에서 이 주소를 찾으려면 스토리지-컴퓨트 분리 장의 [MetaService 배포를 위한 `fdb_cluster` 확인 방법 소개](../../deploy-manually/separating-storage-compute-deploy-manually)를 참조하세요.

## 2. 이미지 사용자 지정 {#2-customize-the-image}

배포 예시에서 MetaService에 구성된 이미지는 최신 버전이 아닐 수 있습니다. 이미지 버전을 지정하려면 다음 형식을 사용하세요.

```yaml
spec:
  metaService:
    image: ${msImage}
```

매개변수 설명:

- `${msImage}`: 배포할 MetaService 이미지입니다. Doris 공식 [MetaService 이미지](https://hub.docker.com/r/apache/doris)를 사용하세요(이미지 태그에는 `ms` 접두사가 포함됩니다).

## 3. 컴퓨팅 리소스 할당 {#3-allocate-compute-resources}

Kubernetes 리소스 제한을 사용하여 MetaService에 적절한 CPU와 메모리를 할당하세요. 예를 들어 다음 구성은 MetaService의 리소스를 CPU 코어 4개와 메모리 4Gi로 제한합니다.

```yaml
spec:
  metaService:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

위 구성을 [배포할 DorisDisaggregatedCluster 리소스](./install-doris-cluster.md#2-modify-key-configurations)에 적용하세요.

## 4. 시작 구성 사용자 지정 {#4-customize-startup-configuration}

기본 시작 매개변수가 요구 사항에 맞지 않으면 ConfigMap을 통해 사용자 지정 시작 구성 파일을 마운트할 수 있습니다. Doris-Operator는 ConfigMap을 통해 각 컴포넌트의 시작 구성 파일을 마운트하는 방식으로 사용자 지정을 지원합니다.

전체 흐름은 다음과 같습니다.

| 단계 | 설명 |
|------|------|
| 입력 | 사용자 지정 `doris_cloud.conf` 구성 파일 |
| 작업 | ConfigMap을 생성하고 `/etc/doris` 디렉터리에 마운트 |
| 출력 | MetaService가 사용자 지정 구성으로 시작 |

:::tip 팁
Doris-Operator는 MetaService 시작 구성에서 FoundationDB 관련 설정을 자동으로 채우므로, 시작 구성을 사용자 지정할 때 `fdb_cluster`를 설정할 필요가 없으며 설정해서도 안 됩니다.
:::

### 단계 1: 사용자 지정 ConfigMap 생성 {#step-1-create-a-custom-configmap}

시작 구성 파일의 이름은 반드시 `doris_cloud.conf`여야 합니다. 다음은 그 예시입니다.

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    # // meta_service
    brpc_listen_port = 5000
    brpc_num_threads = -1
    brpc_idle_timeout_sec = 30
    http_token = greedisgood9999

    # // doris txn config
    label_keep_max_second = 259200
    expired_txn_scan_key_nums = 1000

    # // logging
    log_dir = ./log/
    # info warn error
    log_level = info
    log_size_mb = 1024
    log_filenum_quota = 10
    log_immediate_flush = false
    # log_verbose_modules = *

    # //max stage num
    max_num_stages = 40
kind: ConfigMap
metadata:
  name: doris-metaservice
  namespace: default
```

### 단계 2: 사용자 지정 시작 구성 마운트 {#step-2-mount-the-custom-startup-configuration}

`DorisDisaggregatedCluster` 리소스에서 `metaService.configMaps`를 통해 위의 ConfigMap을 마운트하세요.

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

매개변수 설명:

- `${msConfigMapName}`: MetaService 시작 구성이 포함된 ConfigMap의 이름
- `mountPath`: 마운트 지점은 반드시 `/etc/doris`여야 함

위 구성을 배포할 [DorisDisaggregatedCluster 리소스](./install-doris-cluster.md#2-modify-key-configurations)에 적용하세요.

## 5. 서비스 프로브 타임아웃 구성 {#5-configure-service-probe-timeouts}

Doris Operator는 스토리지-컴퓨트 분리 클러스터 서비스에 두 가지 타임아웃 매개변수를 제공합니다.

| 프로브 유형 | 구성 필드 | 기본값 | 단계 | 트리거 조건 |
|----------|----------|--------|----------|----------|
| 활성 프로브(LivenessProbe) | `liveTimeout` | 180초 | 서비스 실행 중 | 프로브 실패 상태가 임계 시간을 초과하여 지속되면 서비스를 강제로 재시작 |
| 시작 타임아웃 | `startTimeout` | 300초 | 서비스 시작 중 | 시작 시간이 임계 시간을 초과하면 서비스를 강제로 재시작 |

### 활성 프로브 타임아웃 구성 {#liveness-probe-timeout-configuration}

활성 프로브는 서비스의 실행 상태를 모니터링합니다. 예를 들어 활성 프로브 타임아웃을 30초로 설정하려면 다음과 같이 구성하세요.

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### 시작 타임아웃 구성 {#startup-timeout-configuration}

시작 타임아웃은 서비스 시작에 시간이 너무 오래 걸리는 경우를 처리합니다. 예를 들어 시작 타임아웃을 120초로 설정하려면 다음과 같이 구성하세요.

```yaml
spec:
  metaService:
    startTimeout: 120
```
