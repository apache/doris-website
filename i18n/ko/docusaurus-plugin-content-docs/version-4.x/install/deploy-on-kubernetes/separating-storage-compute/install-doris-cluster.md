---
{
    "title": "완전한 Doris 컴퓨팅·스토리지 분리형 클러스터 배포",
    "language": "ko",
    "description": "Kubernetes에서 FoundationDB와 Doris Operator를 배포하고 Doris 클러스터와 Storage Vault를 생성해, 처음부터 사용 가능한 Doris 컴퓨팅·스토리지 분리형 클러스터를 구축하는 종합 튜토리얼입니다.",
    "keywords": ["Doris", "컴퓨팅·스토리지 분리", "Kubernetes", "클러스터 배포", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

이 문서는 Kubernetes에서 Doris 컴퓨팅·스토리지 분리형 클러스터를 처음 구축하는 사용자를 위한 튜토리얼입니다. 처음부터 배포를 시작해 데이터를 쓸 수 있게 되기까지의 전체 과정을 안내합니다. 이 문서를 읽고 나면 다음을 할 수 있습니다.

- FoundationDB(메타데이터 저장소)를 배포하거나 기존 FoundationDB에 연결
- Kubernetes에 Doris Operator 배포
- Doris Operator를 통해 완전한 컴퓨팅·스토리지 분리형 클러스터 배포
- SQL을 통해 객체 스토리지 백엔드(Storage Vault) 생성

## 배포 결과 {#deployment-outcome}

이 튜토리얼을 완료하면 다음 구성 요소로 이루어진 Doris 컴퓨팅·스토리지 분리형 클러스터가 준비됩니다.

| 구성 요소 | 설명 | 기본 복제본 수 |
|------|------|-----------|
| FE | SQL 파싱 및 조정 담당 | 1 |
| MS (MetaService) | 메타데이터 관리 | 1 |
| Compute Group (CG) | 데이터 적재 및 캐싱 | 2 |
| FoundationDB | 메타데이터 저장소 | - |
| Storage Vault | S3 호환 객체 스토리지 | - |

## 배포 과정 개요 {#deployment-path-overview}

전체 과정은 순서대로 진행하는 5단계로 나뉩니다. 각 단계의 입력과 출력은 다음과 같습니다.

| 단계 | 단계별 목표 | 입력 | 출력 |
|------|----------|------|------|
| 단계 1 | FoundationDB 배포 | K8s 클러스터 / 사용 가능한 머신 | 사용 가능한 FDB 클러스터 + 접속 정보 |
| 단계 2 | Doris Operator 배포 | K8s 클러스터 접근 권한 | 실행 중인 Operator + CRD |
| 단계 3 | Doris 컴퓨팅·스토리지 분리형 클러스터 배포 | `ddc-sample.yaml` + FDB 접속 정보 | 실행 중인 컴퓨팅·스토리지 분리형 클러스터 |
| 단계 4 | 원격 스토리지 백엔드 생성 | 실행 중인 클러스터 + S3 호환 객체 스토리지 자격 증명 | 데이터 영속화에 사용할 수 있는 Storage Vault |
| 단계 5 | 클러스터에 연결하고 종합 검증 | 단계 4에서 설정한 MySQL 연결 | 읽기와 쓰기로 사용 가능 여부를 확인한 클러스터 |

단계 4를 완료하면 클러스터에 데이터를 쓸 수 있습니다. 단계 5에서는 SQL을 통해 전체 경로를 검증합니다. FE / MS / Compute Group의 고급 사용자 지정 방법은 문서 끝의 [고급 구성](#advanced-configuration)을 참조하세요.

## 단계 1: FoundationDB 배포 {#step-1-deploy-foundationdb}

컴퓨팅·스토리지 분리형 클러스터는 메타데이터 저장을 위해 FoundationDB(FDB)에 의존합니다. 배포 전에 사용 가능한 FDB를 준비해야 합니다. 현재 인프라에 맞는 배포 방법을 선택하세요.

| 배포 방법 | 적용 상황 | 다음 작업 |
|----------|----------|----------|
| 머신에 직접 배포(권장) | 사용 가능한 물리 머신 / 가상 머신이 이미 있음 | [컴퓨팅·스토리지 분리 - 배포 전 준비](../../deploy-manually/separating-storage-compute-deploy-manually)를 참고해 배포하고, 배포 머신과 K8s 클러스터가 같은 LAN에 있는지 확인 |
| Kubernetes에 배포 | K8s에서 FDB를 통합 관리하려는 경우 | 아래의 "K8s 빠른 배포"를 바로 실행 |

### K8s 빠른 배포(가장 간단한 방법) {#k8s-quick-deployment-simplest-path}

다음 4단계를 순서대로 실행하면 K8s에 최소 구성의 FDB 클러스터(단일 복제본)를 시작할 수 있습니다.

**1. FoundationDB CRD 적용:**

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

**2. fdb-kubernetes-operator 배포:**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

**3. FoundationDB 클러스터 배포(단일 복제본 최소 구성):**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. FDB 상태 확인:**

```shell
kubectl get fdb
```

`AVAILABLE` 열이 `kubectl get fdb`의 결과에서 `true`로 표시되면 FDB 클러스터가 준비된 것입니다.

:::tip 고급 옵션
단일 복제본 모드는 개발과 테스트에만 적합합니다. 프로덕션 환경에는 이중 복제본 모드를 권장하며, Kubernetes 클러스터에는 호스트 머신이 최소 세 대 필요합니다. 다른 배포 형태(이중 복제본, 프로덕션 배포, 비공개 저장소 이미지, FQDN 모드 등)는 [FoundationDB 배포](install-fdb.md)를 참조하세요.
:::

## 단계 2: Doris Operator 배포 {#step-2-deploy-doris-operator}

**입력**: Kubernetes 클러스터 접근 권한
**작업**: CRD 리소스 정의를 적용하고 Operator 및 RBAC 규칙 배포
**출력**: `doris` namespace에서 실행 중인 Doris Operator

### 1. CRD 리소스 정의 적용 {#1-apply-crd-resource-definitions}

현재 클러스터 상태에 맞는 명령을 선택하세요.

- **시나리오 A: 처음 배포하는 경우(또는 컴퓨팅·스토리지 분리형 클러스터만 배포하는 경우)**: 모든 CRD 적용:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **시나리오 B: 컴퓨팅·스토리지 비분리형 클러스터가 이미 배포된 경우**: 컴퓨팅·스토리지 분리와 관련된 CRD만 추가:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Operator와 RBAC 규칙 배포 {#2-deploy-the-operator-and-rbac-rules}

다음 명령을 실행해 Doris Operator와 필요한 RBAC 규칙을 배포합니다.

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

배포 후 Operator Pod의 상태를 확인합니다.

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

`STATUS`가 `Running`이면 Operator가 준비된 것입니다.

## 단계 3: 컴퓨팅·스토리지 분리형 클러스터 배포 {#step-3-deploy-the-compute-storage-decoupled-cluster}

**입력**: 배포 예제 `ddc-sample.yaml` + FoundationDB 접속 정보
**작업**: 예제를 다운로드하고 필요한 주요 필드를 수정한 뒤 클러스터 배포
**출력**: 실행 중인 Doris 컴퓨팅·스토리지 분리형 클러스터

### 1. 배포 예제 다운로드 {#1-download-the-deployment-example}

Doris Operator 저장소에서 기본 배포 예제를 다운로드합니다.

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 주요 설정 수정 {#2-modify-key-configurations}

예제를 다운로드한 뒤 배포 전에 최소한 다음 두 종류의 필드를 수정해야 합니다. 다른 필드는 기본값을 유지하세요.

| 필드 | 필수 / 선택 | 설명 |
|------|-------------|------|
| `spec.metaService.fdb` | **필수** | 단계 1에서 배포한 FDB의 접속 정보(주소 또는 ConfigMap 중 하나 선택) |
| `spec.computeGroups[].image` | **필수** | BE 이미지 버전. 사용하려는 Doris 버전과 일치해야 함 |
| `spec.metaService.image` | 선택 | MetaService 이미지 버전. 기본적으로 예제에 지정된 버전을 사용 |
| `spec.feSpec.electionNumber` | 선택 | FE Follower 수. 기본값은 1이며 **배포 후에는 변경할 수 없음** |
| `spec.computeGroups[].replicas` | 선택 | Compute Group의 복제본 수. 기본적으로 예제의 값을 사용 |
| `spec.feSpec.requests` / `limits` | 선택 | FE 컴퓨팅 리소스 제한(프로덕션 환경에 권장) |

수정한 `spec` 섹션은 대략 다음과 같습니다(**방법 A: 머신에 FDB를 배포한 경우**).

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}      # Required: FDB client access address (machine deployment)
  feSpec:
    electionNumber: 1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
  computeGroups:
    - uniqueId: cg1
      image: ${beImage}            # Required: BE image
      replicas: 2
      requests:
        cpu: 8
        memory: 8Gi
      limits:
        cpu: 8
        memory: 8Gi
```

**방법 B: K8s에 FDB를 배포한 경우**: `metaService.fdb` 섹션을 다음으로 바꿉니다.

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

ConfigMap을 확인하려면 `kubectl get configmap`을 실행하세요. 자세한 내용은 [FoundationDB 배포 - 접속 정보가 포함된 ConfigMap 가져오기](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)를 참조하세요.

매개변수 설명:

| 매개변수 | 설명 |
|------|------|
| `${fdbEndpoint}` | FoundationDB 클라이언트 접속 주소. 기본 Linux VM 배포에서는 `/etc/foundationdb/fdb.cluster`에 저장됩니다. 자세한 내용은 [FoundationDB 클러스터 파일 문서](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)를 참조하세요 |
| `${beImage}` | BE 이미지. [Apache Doris 공식 이미지 저장소](https://hub.docker.com/r/apache/doris)에서 제공하는 이미지를 사용하세요 |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator`가 생성한 ConfigMap 이름 |
| `${namespace}` | ConfigMap이 있는 namespace |

### 3. 배포 및 확인 {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

리소스를 적용한 후 클러스터 구성이 자동으로 완료될 때까지 기다립니다. 다음 명령으로 클러스터 상태를 확인합니다.

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**준비 완료 기준:** `CLUSTERHEALTH`가 `green`이고 `CGAVAILABLECOUNT`가 `CGCOUNT`와 같아야 합니다.

## 단계 4: 원격 스토리지 백엔드 생성 {#step-4-create-the-remote-storage-backend}

**입력**: 실행 중인 Doris 클러스터 + S3 호환 객체 스토리지 자격 증명
**작업**: MySQL 클라이언트에서 SQL을 실행해 Vault 생성 및 활성화
**출력**: 데이터 영속화에 사용할 수 있도록 구성된 스토리지 백엔드

클러스터가 정상적으로 시작되면 SQL을 사용해 객체 스토리지를 영속 스토리지 백엔드(Doris에서는 Vault라고 함)로 등록하고 기본 Vault로 설정해야 합니다. 그래야 기록한 데이터를 영속화할 수 있습니다.

### 1. FE Service 접속 주소 확인 {#1-get-the-access-address-of-the-fe-service}

다음 명령을 실행해 FE에 접속할 수 있는 Service를 찾습니다.

```shell
kubectl get svc
```

출력 예시:

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

`-internal` 접미사가 없는 Service는 외부 접속에 사용됩니다.

### 2. MySQL 클라이언트로 연결 {#2-connect-through-a-mysql-client}

Kubernetes 클러스터에서 MySQL Client가 포함된 임시 Pod를 시작하고 해당 Pod에 접속합니다.

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Pod 안에서 FE Service 이름을 사용해 Doris 클러스터에 연결합니다.

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Storage Vault 생성 {#3-create-a-storage-vault}

SQL을 사용해 S3 프로토콜을 지원하는 객체 스토리지를 Vault로 생성합니다. 다음 예제에서는 Alibaba Cloud OSS를 사용합니다.

```mysql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
        "type"="S3",
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
        "s3.region" = "bj",
        "s3.bucket" = "bucket",
        "s3.root.path" = "big/data/prefix",
        "s3.access_key" = "your-ak",
        "s3.secret_key" = "your-sk",
        "provider" = "OSS"
    );
```

다른 스토리지 백엔드의 생성 방법과 각 필드의 자세한 설명은 컴퓨팅·스토리지 분리 문서의 [Storage Vault 관리](../../deploy-manually/separating-storage-compute-deploy-manually)를 참조하세요.

### 4. 기본 Storage Vault 설정 {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

`${vaultName}`은 사용하려는 Vault의 이름입니다(예: 앞 단계의 `s3_vault`).

이제 클러스터에 데이터를 쓸 수 있습니다. 다음 단계에서는 SQL로 전체 경로를 검증합니다.

## 단계 5: 클러스터에 연결하고 종합 검증 {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**입력**: 단계 4에서 설정한 MySQL 연결
**작업**: 검증용 SQL을 실행해 클러스터가 준비되었고 정상적으로 읽고 쓸 수 있는지 확인
**출력**: 종합 검증을 통과한 사용 가능한 클러스터

단계 4에서 설정한 MySQL 클라이언트 연결을 계속 사용해 다음 명령을 순서대로 실행합니다. 이미 연결을 종료했다면 [단계 4 - MySQL 클라이언트로 연결](#2-connect-through-a-mysql-client)을 다시 수행하세요.

### 1. BE 노드의 실행 상태 확인 {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

출력에서 각 BE 노드의 `Alive` 열이 `true`이면 Compute Group의 BE가 준비되었고 FE에서 이를 인식한 것입니다.

### 2. Storage Vault 적용 여부 확인 {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

출력에 단계 4에서 생성한 Vault(예: `s3_vault`)가 표시되고 `IsDefault`가 `true`이면 스토리지 백엔드가 준비된 것입니다.

### 3. 테스트 데이터 쓰기 및 쿼리 {#3-write-and-query-test-data}

다음 SQL을 실행해 "데이터베이스 생성, 테이블 생성, 쓰기, 쿼리"의 전체 경로를 검증합니다.

```mysql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE IF NOT EXISTS hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO hello VALUES (1, 'hello doris');
SELECT * FROM hello;
```

`SELECT`가 기록한 데이터를 반환하면 FE에서 MetaService, Compute Group, Storage Vault까지 이어지는 전체 경로가 정상 작동하며 클러스터를 사용할 수 있다는 뜻입니다.

## 고급 구성 {#advanced-configuration}

위의 5단계를 완료하면 클러스터를 사용할 수 있습니다. 프로덕션 환경에서는 추가 사용자 지정이 필요한 경우가 많습니다. 다음 목록에서 해당 문서를 찾아보세요.

| 주제 | 참고 문서 | 주요 내용 |
|--------|----------|----------|
| FoundationDB 배포 세부 사항, 이중 복제본/프로덕션 모드, FQDN 배포, 비공개 이미지 저장소 | [FoundationDB 배포](install-fdb.md) | FDB의 배포 원리와 모든 배포 형태 |
| MetaService 이미지 변경, 리소스 조정, 시작 매개변수 사용자 지정, 활성 상태 프로브 시간 초과 조정 | [MetaService 구성](config-ms.md) | `spec.metaService.*` 아래의 모든 필드 |
| FE 리소스 조정, Follower 수 변경, 시작 구성 사용자 지정, 접속 모드(NodePort / LoadBalancer) 구성, 영속 스토리지 | [FE 구성](config-fe.md) | `spec.feSpec.*` 아래의 모든 필드 |
| 단일 그룹/다중 그룹 Compute Group, 리소스 제한, 접속 모드 구성, 캐시 및 로그 영속화 | [Compute Group 구성](config-cg.md) | `spec.computeGroups[*]` 아래의 모든 필드 |
| root / root가 아닌 관리자 계정의 암호 설정, Secret 자격 증명, Kerberos 인증 파일 마운트 | [인증 구성](config-cluster.md) | 클러스터 수준 자격 증명 및 Kerberos |
| BE 노드 확장·축소, Compute Group 추가 또는 제거, 축소 및 PVC 정리 확인 | [컴퓨팅 용량 조정](config-cg.md#scaling-compute-groups) | 작업 단계, 서비스 해제 동작 및 검증 |
