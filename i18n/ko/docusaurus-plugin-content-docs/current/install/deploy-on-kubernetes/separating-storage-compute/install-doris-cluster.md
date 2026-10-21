---
{
    "title": "완전한 Doris 컴퓨팅-스토리지 분리형 클러스터 배포",
    "language": "ko",
    "description": "Kubernetes에서 실제로 동작하는 Doris 컴퓨팅-스토리지 분리형 클러스터를 처음부터 구축하는 전체 과정을 안내합니다. FoundationDB 배포, Doris Operator 배포, Doris 클러스터 배포 및 Storage Vault 생성을 다룹니다.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "deploy cluster", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

이 문서는 Kubernetes에서 Doris 컴퓨팅-스토리지 분리형 클러스터를 처음 구성하는 사용자를 대상으로, 최초 배포부터 데이터를 쓸 수 있는 상태까지의 전체 과정을 안내합니다. 이 문서를 읽으면 다음 작업을 수행할 수 있습니다:

- FoundationDB(메타데이터 스토리지)를 배포하거나 기존 FoundationDB에 연결
- Kubernetes에 Doris Operator 배포
- Doris Operator를 통해 완전한 컴퓨팅-스토리지 분리형 클러스터 배포
- SQL을 통해 객체 스토리지 백엔드(Storage Vault) 생성

## 배포 결과 {#deployment-outcome}

이 튜토리얼을 완료하면 다음 구성 요소로 이루어진 Doris 컴퓨팅-스토리지 분리형 클러스터가 준비됩니다:

| 구성 요소 | 설명 | 기본 복제본 수 |
|------|------|-----------|
| FE | SQL 구문 분석 및 조정 담당 | 1 |
| MS (MetaService) | 메타데이터 관리 | 1 |
| Compute Group (CG) | 데이터 적재 및 캐싱 | 2 |
| FoundationDB | 메타데이터 저장 | - |
| Storage Vault | S3 호환 객체 스토리지 | - |

## 배포 절차 개요 {#deployment-path-overview}

전체 과정은 순서대로 진행하는 5개 단계로 나뉩니다. 각 단계의 입력과 출력은 다음과 같습니다:

| 단계 | 단계별 목표 | 입력 | 출력 |
|------|----------|------|------|
| 1단계 | FoundationDB 배포 | K8s 클러스터 / 사용 가능한 머신 | 사용 가능한 FDB 클러스터 + 접속 정보 |
| 2단계 | Doris Operator 배포 | K8s 클러스터 접근 권한 | 실행 중인 Operator + CRDs |
| 3단계 | Doris 컴퓨팅-스토리지 분리형 클러스터 배포 | `ddc-sample.yaml` + FDB 접속 정보 | 실행 중인 컴퓨팅-스토리지 분리형 클러스터 |
| 4단계 | 원격 스토리지 백엔드 생성 | 실행 중인 클러스터 + S3 호환 객체 스토리지 자격 증명 | 데이터 영속화에 사용할 수 있는 Storage Vault |
| 5단계 | 클러스터 연결 및 전체 동작 검증 | 4단계에서 설정한 MySQL 연결 | 읽기 및 쓰기로 검증된 사용 가능한 클러스터 |

4단계를 마치면 클러스터에서 쓰기 요청을 받을 수 있습니다. 5단계에서는 SQL을 통해 전체 동작을 검증합니다. FE / MS / Compute Group의 고급 사용자 지정 설정은 이 문서 마지막의 [고급 설정](#advanced-configuration) 섹션을 참조하세요.

## 1단계: FoundationDB 배포 {#step-1-deploy-foundationdb}

컴퓨팅-스토리지 분리형 클러스터는 FoundationDB(FDB)에 메타데이터를 저장합니다. 배포 전에 사용 가능한 FDB를 준비해야 합니다. 기존 인프라에 맞는 배포 방법을 선택하세요:

| 배포 방법 | 적용 상황 | 후속 작업 |
|----------|----------|----------|
| 머신에 직접 배포(권장) | 사용 가능한 물리 머신 / 가상 머신이 이미 있는 경우 | [컴퓨팅-스토리지 분리 - 배포 전 준비](../../deploy-manually/separating-storage-compute-deploy-manually)를 참조하여 배포를 완료하고, 배포 머신과 K8s 클러스터가 동일한 LAN에 있는지 확인 |
| Kubernetes에 배포 | K8s 내에서 FDB를 통합 관리하려는 경우 | 아래의 "K8s 빠른 배포"를 바로 실행 |

### K8s 빠른 배포(가장 간단한 방법) {#k8s-quick-deployment-simplest-path}

다음 4개 단계를 순서대로 실행하여 K8s에 최소 구성의 FDB 클러스터(단일 복제본)를 구동하세요:

**1. FoundationDB CRDs 적용:**

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

**2. fdb-kubernetes-operator 배포:**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

**3. FoundationDB 클러스터 배포(단일 복제본 최소 구성 모드):**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. FDB 상태 확인:**

```shell
kubectl get fdb
```

`AVAILABLE` 열이 `kubectl get fdb` 실행 결과에서 `true`로 표시되면 FDB 클러스터가 준비된 것입니다.

:::tip 고급 옵션
단일 복제본 모드는 개발 및 테스트에만 적합합니다. 프로덕션 환경에서는 이중 복제본 모드를 권장하며, Kubernetes 클러스터에 최소 세 대의 호스트 머신이 필요합니다. 다른 배포 방식(이중 복제본, 프로덕션 배포, 비공개 저장소 이미지, FQDN 모드 등)은 [FoundationDB 배포](install-fdb.md)를 참조하세요.
:::

## 2단계: Doris Operator 배포 {#step-2-deploy-doris-operator}

**입력**: Kubernetes 클러스터 접근 권한
**작업**: CRD 리소스 정의 적용, Operator 및 RBAC 규칙 배포
**출력**: `doris` 네임스페이스에서 실행 중인 Doris Operator

### 1. CRD 리소스 정의 적용 {#1-apply-crd-resource-definitions}

현재 클러스터 상태에 맞는 명령을 선택하세요:

- **상황 A: 최초 배포(또는 컴퓨팅-스토리지 분리형만 배포)**: 모든 CRDs를 적용합니다:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **상황 B: 비분리형 클러스터가 이미 배포된 경우**: 컴퓨팅-스토리지 분리형과 관련된 CRDs만 추가합니다:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Operator 및 RBAC 규칙 배포 {#2-deploy-the-operator-and-rbac-rules}

다음 명령을 실행하여 Doris Operator와 이에 필요한 RBAC 규칙을 배포하세요:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

배포 후 Operator Pod의 상태를 확인하세요:

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

`STATUS`가 `Running`이면 Operator가 준비된 것입니다.

## 3단계: 컴퓨팅-스토리지 분리형 클러스터 배포 {#step-3-deploy-the-compute-storage-decoupled-cluster}

**입력**: 배포 예제 `ddc-sample.yaml` + FoundationDB 접속 정보
**작업**: 예제를 다운로드하고 필요에 따라 주요 필드를 수정한 후 클러스터 배포
**출력**: 실행 중인 Doris 컴퓨팅-스토리지 분리형 클러스터

### 1. 배포 예제 다운로드 {#1-download-the-deployment-example}

Doris Operator 저장소에서 기본 배포 예제를 다운로드하세요:

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 주요 설정 수정 {#2-modify-key-configurations}

예제를 다운로드한 후, 배포 전에 최소한 다음 두 범주의 필드를 수정해야 합니다. 나머지 필드는 기본값을 유지하세요:

| 필드 | 필수 / 선택 | 설명 |
|------|-------------|------|
| `spec.metaService.fdb` | **필수** | 1단계에서 배포한 FDB의 접속 정보(address 또는 ConfigMap 중 하나 선택) |
| `spec.computeGroups[].image` | **필수** | BE 이미지 버전. 사용하려는 Doris 버전과 일치해야 함 |
| `spec.metaService.image` | 선택 | MetaService 이미지 버전. 기본적으로 예제의 버전 사용 |
| `spec.feSpec.electionNumber` | 선택 | FE Followers 수. 기본값은 1이며, **배포 후 수정할 수 없음** |
| `spec.computeGroups[].replicas` | 선택 | Compute Group의 복제본 수. 기본적으로 예제의 값 사용 |
| `spec.feSpec.requests` / `limits` | 선택 | FE 컴퓨팅 리소스 제한(프로덕션 환경에서 설정 권장) |

수정한 `spec` 섹션은 대략 다음과 같습니다(**방법 A: 머신에 FDB를 배포한 경우**):

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

**방법 B: K8s에 FDB를 배포한 경우**: `metaService.fdb` 섹션을 다음과 같이 바꾸세요:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

ConfigMap을 확인하려면 `kubectl get configmap`을 실행하세요(자세한 내용은 [FoundationDB 배포 - 접속 정보가 포함된 ConfigMap 가져오기](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)를 참조하세요).

매개변수 설명:

| 매개변수 | 설명 |
|------|------|
| `${fdbEndpoint}` | FoundationDB 클라이언트 접속 주소. 기본 Linux VM 배포에서는 `/etc/foundationdb/fdb.cluster`에 저장됨. 자세한 내용은 [FoundationDB 클러스터 파일 문서](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) 참조 |
| `${beImage}` | BE 이미지. [Apache Doris 공식 이미지 저장소](https://hub.docker.com/r/apache/doris)에서 제공하는 이미지 사용 |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator`가 생성한 ConfigMap 이름 |
| `${namespace}` | ConfigMap이 있는 네임스페이스 |

### 3. 배포 및 검증 {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

리소스를 적용한 후 클러스터가 자동으로 구성될 때까지 기다리세요. 다음 명령으로 클러스터 상태를 확인하세요:

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**준비 완료 기준:** `CLUSTERHEALTH`가 `green`이고 `CGAVAILABLECOUNT`가 `CGCOUNT`와 같아야 합니다.

## 4단계: 원격 스토리지 백엔드 생성 {#step-4-create-the-remote-storage-backend}

**입력**: 실행 중인 Doris 클러스터 + S3 호환 객체 스토리지 자격 증명
**작업**: MySQL 클라이언트에서 SQL을 실행하여 Vault 생성 및 활성화
**출력**: 데이터 영속화에 사용할 수 있도록 설정된 스토리지 백엔드

클러스터가 정상적으로 시작되면, 기록한 데이터를 영속화할 수 있도록 SQL을 통해 객체 스토리지를 영구 스토리지 백엔드(Doris에서는 Vault라고 함)로 등록하고 기본 Vault로 설정해야 합니다.

### 1. FE Service의 접속 주소 확인 {#1-get-the-access-address-of-the-fe-service}

다음 명령을 실행하여 FE에 접속할 수 있는 Service를 찾으세요:

```shell
kubectl get svc
```

출력 예제:

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

`-internal` 접미사가 없는 Service를 외부 접속에 사용합니다.

### 2. MySQL 클라이언트로 연결 {#2-connect-through-a-mysql-client}

Kubernetes 클러스터에서 MySQL 클라이언트가 포함된 임시 Pod를 실행하고 Pod 안으로 진입하세요:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Pod 내부에서 FE Service 이름을 사용하여 Doris 클러스터에 연결하세요:

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Storage Vault 생성 {#3-create-a-storage-vault}

SQL을 사용하여 S3 프로토콜을 지원하는 객체 스토리지를 Vault로 생성하세요. 다음 예제에서는 Alibaba Cloud OSS를 사용합니다:

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

다른 스토리지 백엔드의 생성 방법과 각 필드에 대한 자세한 설명은 컴퓨팅-스토리지 분리형 문서의 [Storage Vault 관리](../../deploy-manually/separating-storage-compute-deploy-manually)를 참조하세요.

### 4. 기본 Storage Vault 설정 {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

여기서 `${vaultName}`은 사용하려는 Vault의 이름입니다(예: 이전 단계의 `s3_vault`).

이제 클러스터에서 쓰기 요청을 받을 수 있습니다. 다음 단계에서는 SQL을 통해 전체 동작을 검증합니다.

## 5단계: 클러스터 연결 및 전체 동작 검증 {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**입력**: 4단계에서 설정한 MySQL 연결
**작업**: 검증 SQL을 실행하여 클러스터가 준비되었고 읽기와 쓰기가 정상적으로 동작하는지 확인
**출력**: 전체 동작 검증을 통과한 사용 가능한 클러스터

4단계에서 설정한 MySQL 클라이언트 연결을 그대로 사용하여(이미 종료했다면 [4단계 - MySQL 클라이언트로 연결](#2-connect-through-a-mysql-client)을 다시 수행), 다음 명령을 순서대로 실행하여 검증을 완료하세요.

### 1. BE 노드의 활성 상태 확인 {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

출력에서 각 BE 노드의 `Alive` 열이 `true`이면 Compute Group의 BE가 준비되었고 FE에서 인식하고 있다는 뜻입니다.

### 2. Storage Vault 적용 여부 확인 {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

출력에 4단계에서 생성한 Vault(예: `s3_vault`)가 표시되고 `IsDefault`가 `true`이면 스토리지 백엔드가 준비된 것입니다.

### 3. 테스트 데이터 쓰기 및 쿼리 {#3-write-and-query-test-data}

다음 SQL을 순서대로 실행하여 "데이터베이스 생성, 테이블 생성, 쓰기, 쿼리"의 전체 과정을 수행하세요:

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

`SELECT`가 기록한 데이터를 반환하면 FE에서 MetaService, Compute Group, Storage Vault로 이어지는 전체 경로가 정상적으로 동작하며 클러스터를 사용할 준비가 된 것입니다.

## 고급 설정 {#advanced-configuration}

위의 5개 단계를 완료하면 클러스터를 사용할 수 있습니다. 프로덕션 환경에서는 일반적으로 추가적인 사용자 지정 설정이 필요합니다. 다음 목록에서 해당 문서를 참조하세요:

| 주제 | 참조 문서 | 주요 내용 |
|--------|----------|----------|
| FoundationDB 배포 세부 사항, 이중 복제본/프로덕션 모드, FQDN 배포, 비공개 이미지 저장소 | [FoundationDB 배포](install-fdb.md) | FDB의 전체 동작 원리와 모든 배포 방식 |
| MetaService 이미지 변경, 리소스 조정, 시작 매개변수 사용자 지정, 활성 상태 프로브 시간 제한 조정 | [MetaService 설정](config-ms.md) | `spec.metaService.*` 아래의 모든 필드 |
| FE 리소스 조정, Followers 수 변경, 시작 설정 사용자 지정, 접속 방식(NodePort / LoadBalancer) 설정, 영구 스토리지 | [FE 설정](config-fe.md) | `spec.feSpec.*` 아래의 모든 필드 |
| 단일 그룹 / 다중 그룹 Compute Group, 리소스 제한, 접속 방식 설정, 캐시 및 로그 영속화 | [Compute Group 설정](config-cg.md) | `spec.computeGroups[*]` 아래의 모든 필드 |
| root / non-root 관리자 계정 비밀번호 설정, Secret 자격 증명, Kerberos 인증 파일 마운트 | [인증 설정](config-cluster.md) | 클러스터 수준 자격 증명 및 Kerberos |
