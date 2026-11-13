---
{
    "title": "컴퓨트 그룹 구성",
    "language": "ko",
    "description": "Kubernetes에서 Doris 컴퓨트 그룹을 구성하는 방법을 설명합니다. BE 복제본, CPU와 메모리, 서비스 접근, 시작 옵션, 영구 스토리지, 확장 및 축소 작업을 다룹니다.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

컴퓨트 그룹은 동일한 작업을 처리하는 BE 노드의 집합입니다. 이 문서에서는 사용 사례별로 `DorisDisaggregatedCluster` 리소스에서 컴퓨트 그룹을 구성하는 방법을 설명하며, 주로 다음 내용을 다룹니다.

- **기본 배포**: 단일 컴퓨트 그룹 또는 여러 컴퓨트 그룹을 빠르게 구성
- **리소스 제어**: CPU와 메모리 등 컴퓨팅 리소스 제한
- **접근 제어**: 여러 방법으로 클러스터 내부 또는 외부에서 BE 서비스에 접근
- **시작 설정 사용자 지정**: ConfigMap을 통해 BE 시작 매개변수 사용자 지정
- **데이터 영속화**: 캐시, 로그, StreamLoad 임시 데이터용 영구 스토리지
- **확장 및 축소**: BE 노드와 컴퓨트 그룹을 추가하거나 제거하고 축소 결과 확인

## 시나리오 1: 단일 컴퓨트 그룹 빠르게 구성하기 {#scenario-1-quickly-set-up-a-single-compute-group}

### 최소 구성 {#minimal-configuration}

가장 간단한 컴퓨트 그룹 구성에는 다음 3개 필드만 필요합니다.

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### 필드 설명 {#field-descriptions}

| 필드 | 설명 |
|------|------|
| `uniqueId` | 컴퓨트 그룹의 고유 식별자이자 이름입니다. 설정한 뒤에는 변경할 수 없습니다. 이름은 `[a-zA-Z][0-9a-zA-Z_]+` 규칙과 일치해야 합니다. |
| `image` | BE 서비스 배포에 사용할 이미지 주소입니다. [Apache Doris 공식 이미지 저장소](https://hub.docker.com/r/apache/doris)에서 제공하는 이미지를 사용하세요. |
| `replicas` | 컴퓨트 그룹에 속한 BE 서비스 노드 수입니다. |

## 시나리오 2: 업무 분리를 위해 여러 컴퓨트 그룹 배포하기 {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` 리소스는 여러 컴퓨트 그룹의 배포를 지원하며, 각 컴퓨트 그룹은 서로 독립적입니다. 다음 예시는 이름이 `cg1`과 `cg2`인 두 컴퓨트 그룹의 배포 구성입니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

각 컴퓨트 그룹의 복제본 수는 다음과 같습니다.

| 컴퓨트 그룹 이름 | 복제본 수 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

여기서 `${beImage}`는 배포할 BE 서비스 이미지를 나타냅니다.

:::tip 팁
컴퓨트 그룹은 서로 독립적이지만, 동일한 스토리지·컴퓨팅 분리 클러스터의 모든 컴퓨트 그룹에서 같은 BE 서비스 이미지를 사용하는 것이 좋습니다.
:::

## 시나리오 3: 컴퓨트 그룹의 컴퓨팅 리소스 제한하기 {#scenario-3-limit-the-compute-resources-of-a-compute-group}

스토리지·컴퓨팅 분리 [기본 배포 예시](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)에서는 BE 서비스가 사용하는 컴퓨팅 리소스에 제한을 두지 않습니다. `DorisDisaggregatedCluster`는 Kubernetes의 [resources.requests와 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits)를 사용하여 CPU와 메모리 리소스를 지정합니다.

예를 들어 이름이 `cg1`인 컴퓨트 그룹의 BE에 8c 8Gi의 리소스를 구성하려면 다음과 같이 설정합니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```

위 구성을 배포할 [`DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#2-modify-key-configurations)에 반영하면 적용됩니다.

## 시나리오 4: 컴퓨트 그룹의 접근 방식 구성하기 {#scenario-4-configure-the-access-method-of-a-compute-group}

기본적으로 컴퓨트 그룹은 서비스를 외부에 직접 노출하지 않습니다. Doris Operator는 `DorisDisaggregatedCluster` 리소스에서 컴퓨트 그룹에 접근하기 위한 프록시로 Service를 제공합니다. Service는 세 가지 외부 노출 모드를 지원합니다. 접근 위치에 맞는 모드를 선택하세요.

| 접근 모드 | 적용 시나리오 | 특징 |
|------|------|------|
| `ClusterIP` | Kubernetes 클러스터 내부에서 접근 | 기본 모드이며 클러스터 내부 주소를 제공합니다. |
| `NodePort` | 자체 관리 Kubernetes 클러스터 외부에서 접근 | 호스트 머신의 포트를 통해 서비스를 노출합니다. |
| `LoadBalancer` | 클라우드 플랫폼의 Kubernetes 클러스터 외부에서 접근 | 클라우드 서비스 제공자가 제공하는 로드 밸런서를 사용합니다. |

### 4.1 ClusterIP(클러스터 내부 접근) {#41-clusterip-access-within-the-cluster}

[ClusterIP 접근 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)는 Kubernetes 클러스터 내부 주소를 제공하며, 이 주소가 Kubernetes 내부에서 서비스에 접근하는 진입점이 됩니다.

#### 1단계: Service 유형을 ClusterIP로 구성하기 {#step-1-configure-clusterip-as-the-service-type}

Doris는 Kubernetes에서 ClusterIP 접근 모드를 기본으로 활성화합니다. 추가 구성 없이 사용할 수 있습니다.

#### 2단계: Service 접근 주소 확인하기 {#step-2-get-the-service-access-address}

클러스터를 배포한 뒤 다음 명령으로 컴퓨트 그룹이 노출하는 Service를 확인합니다.

```shell
kubectl -n doris get svc
```

결과는 다음과 같습니다.

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

위 결과에서 `uniqueId`가 `cg1`이고 네임스페이스가 `doris`인 컴퓨트 그룹에 사용할 수 있는 Service를 확인할 수 있습니다.

### 4.2 NodePort(자체 관리 클러스터의 외부 접근) {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes 클러스터 외부에서 Doris에 접근하려면 [NodePort 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)를 선택하세요. NodePort 모드는 두 가지 포트 할당 방법을 제공합니다.

| 할당 방법 | 설명 |
|------|------|
| 동적 호스트 포트 할당 | 포트 매핑을 명시적으로 설정하지 않으면 Kubernetes가 Pod 생성 시 사용하지 않는 호스트 포트를 자동으로 할당합니다. 기본 범위는 30000-32767입니다. |
| 정적 호스트 포트 할당 | 포트 매핑을 명시적으로 지정하면 해당 호스트 포트가 사용 중이지 않고 충돌이 없을 때 Kubernetes가 지정한 고정 포트를 할당합니다. |

정적 할당을 사용하려면 포트 매핑을 계획해야 합니다. Doris는 외부와의 통신을 위해 다음 포트를 제공합니다.

**표 1: BE 서비스 포트 설명**

| 포트 이름 | 기본 포트 | 포트 설명 |
|------|------|------|
| Web Server Port | 8040 | BE의 HTTP 서버 포트로, BE 정보를 확인하는 데 사용합니다. |

#### 정적 할당 구성 {#static-allocation-configuration}

다음 예시는 이름이 `cg1`인 컴퓨트 그룹의 BE 포트 8040을 호스트 포트 31012에 매핑합니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
      portMaps:
      - nodePort: 31012
        targetPort: 8040
```

#### 동적 할당 구성 {#dynamic-allocation-configuration}

이름이 `cg1`인 컴퓨트 그룹에서 동적 NodePort 접근 모드를 사용하는 구성은 다음과 같습니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer(클라우드 환경의 외부 접근) {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer 모드](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)는 클라우드 플랫폼의 Kubernetes 환경에 적합하며, 클라우드 서비스 제공자가 제공하는 로드 밸런서를 사용합니다. 아래와 같이 `LoadBalancer`를 `computeGroup.service`의 유형으로 설정합니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## 시나리오 5: BE 시작 구성 사용자 지정하기 {#scenario-5-customize-the-be-startup-configuration}

기본 배포에서는 각 컴퓨트 그룹의 BE 서비스가 이미지에 포함된 기본 구성 파일로 시작합니다. Doris Operator는 Kubernetes ConfigMap을 사용하여 사용자 지정 시작 구성 파일을 마운트합니다. 전체 과정은 다음과 같습니다.

| 단계 | 설명 |
|------|------|
| 입력 | 사용자 지정 `be.conf` 구성 파일 |
| 작업 | ConfigMap을 생성하여 `/etc/doris` 디렉터리에 마운트 |
| 결과 | 컴퓨트 그룹의 BE 서비스가 사용자 지정 구성으로 시작 |

### 1단계: 시작 정보가 포함된 ConfigMap 생성하기 {#step-1-create-a-configmap-that-contains-the-startup-information}

다음은 BE 서비스에서 사용할 수 있는 ConfigMap 예시입니다.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
    file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
    deploy_mode = cloud
```

:::tip 팁
스토리지·컴퓨팅 분리 클러스터에서 BE 서비스의 시작 구성에는 `file_cache_path`를 반드시 설정해야 합니다. 형식은 [스토리지·컴퓨팅 분리 `be.conf` 구성](../../deploy-manually/separating-storage-compute-deploy-manually) 섹션을 참고하세요.
:::

### 2단계: ConfigMap 배포하기 {#step-2-deploy-the-configmap}

다음 명령으로 사용자 지정 시작 구성이 포함된 ConfigMap을 Kubernetes 클러스터에 배포합니다.

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

매개변수 설명은 다음과 같습니다.

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster`가 배포되는 네임스페이스 |
| `${beConfigMapFileName}` | 사용자 지정 ConfigMap이 포함된 파일의 이름 |

### 3단계: DorisDisaggregatedCluster 리소스 업데이트하기 {#step-3-update-the-dorisdisaggregatedcluster-resource}

ConfigMap을 마운트하도록 [`DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#2-modify-key-configurations)를 업데이트합니다. 구성은 다음과 같습니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip 팁
시작 구성은 `/etc/doris` 디렉터리에 마운트해야 합니다.
:::

## 시나리오 6: 컴퓨트 그룹의 영구 스토리지 구성하기 {#scenario-6-configure-persistent-storage-for-a-compute-group}

기본 배포에서는 BE 서비스가 Kubernetes의 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir)을 서비스 캐시로 사용합니다. `EmptyDir`은 비영구 스토리지 방식입니다. 서비스가 재시작되면 캐시된 데이터가 손실되고 그에 따라 쿼리 효율이 떨어집니다.

BE 서비스가 재시작된 뒤에도 캐시된 데이터를 유지하고 쿼리 효율이 떨어지지 않도록 하려면 캐시 데이터를 영구 스토리지에 저장해야 합니다. BE 서비스와 관련된 주요 스토리지 경로는 다음과 같습니다.

| 스토리지 경로 | 용도 |
|------|------|
| BE 로그 디렉터리 | BE 서비스 로그는 표준 출력으로 출력되며, 시작 구성에서 `LOG_DIR`로 지정한 디렉터리에도 기록됩니다. |
| `/opt/apache-doris/be/storage` | StreamLoad 모드로 데이터를 가져올 때 사용하는 임시 저장 위치입니다. 서비스가 비정상적으로 재시작된 뒤 임시 데이터가 손실되는 것을 방지합니다. |
| BE 캐시 디렉터리 | 쿼리 캐시입니다. 재시작 후 데이터가 손실되면 쿼리 효율이 떨어집니다. |

### 6.1 영구 스토리지 예시 {#61-persistent-storage-example}

다음은 영속화가 필요한 데이터에 영구 스토리지를 마운트하는 구성 예시입니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/be/log
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - mountPaths:
      - /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
```

위 구성의 의미는 다음과 같습니다.

- 로그 디렉터리는 사용자 지정 스토리지 구성을 사용하며 300Gi 스토리지 디스크를 마운트합니다.
- WAL 및 StreamLoad 데이터 적재에 사용하는 디렉터리에는 300Gi 스토리지 디스크를 마운트합니다.
- 캐시 디렉터리는 스토리지 템플릿을 사용하며 500Gi 스토리지 디스크를 마운트합니다.

:::tip 팁
`mountPaths` 배열이 비어 있으면 현재 스토리지 구성을 템플릿 구성으로 취급합니다.
:::

### 6.2 로그를 영구 저장하지 않기 {#62-do-not-persist-logs}

로그를 영구 저장하지 않고 표준 출력으로만 내보내려면 다음과 같이 구성합니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```

## 시나리오 7: 컴퓨팅 용량 확장 및 축소하기 {#scaling-compute-groups}

`DorisDisaggregatedCluster` 리소스를 변경하여 컴퓨트 그룹을 확장하거나 축소합니다. `replicas` 필드는 객체 스토리지에 저장된 데이터의 복사본 수가 아니라 BE 노드 수를 나타냅니다. 이 값을 늘리면 컴퓨팅 용량이 증가하고, 줄이면 BE 노드와 해당 노드의 로컬 캐시가 제거됩니다.

아래 절차는 [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1)을 기준으로 합니다. 동일한 릴리스의 CRD와 Operator 이미지를 사용하세요. 축소 동작은 BE 이미지에도 따라 달라지므로 모든 이미지가 정상 종료를 지원한다고 가정하지 마세요.

### 7.1 클러스터 준비 및 점검 {#71-prepare-and-inspect-the-cluster}

용량을 변경하기 전에 다음을 확인하세요.

- FE, MetaService, FoundationDB 및 현재 BE 노드가 정상 상태인지 확인합니다. Operator가 [인증 구성](config-cluster.md)에서 설정한 관리 자격 증명으로 FE에 연결할 수 있어야 합니다.
- 새로운 PVC를 바인딩할 수 있는지 등 Kubernetes의 CPU, 메모리 및 스토리지 용량을 확인합니다. 남은 워크로드를 처리할 수 있도록 준비 상태인 BE 노드를 충분히 유지하세요.
- 축소할 때는 먼저 트래픽을 줄이거나 다른 곳으로 전환하고 실행 중인 쿼리와 데이터 적재 작업이 완료될 때까지 기다립니다. 작업 후에는 클라이언트 재시도와 데이터 적재 작업 상태를 확인합니다.

다음 예시에서는 네임스페이스 `doris`, 클러스터 `test-disaggregated-cluster`, 컴퓨트 그룹 `cg1`을 사용합니다. 실제 환경의 이름으로 바꾸세요.

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

관리자 계정으로 FE SQL 엔드포인트에 연결하여 현재 컴퓨트 그룹과 BE 노드를 기록합니다.

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

클러스터 배포에 사용한 전체 매니페스트를 수정한 뒤 적용합니다.

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

아래 YAML 조각에는 변경할 필드만 표시합니다. 다른 필드와 `spec.computeGroups`의 다른 모든 항목은 유지하세요. 기존 그룹을 누락하면 해당 그룹의 제거를 요청하게 됩니다. Operator가 Doris 메타데이터와 Kubernetes 리소스를 조정할 수 있도록 StatefulSet의 크기를 직접 변경하는 대신 Doris 사용자 지정 리소스를 변경하세요.

### 7.2 기존 컴퓨트 그룹 확장하기 {#72-scale-out-an-existing-compute-group}

예를 들어 전체 매니페스트에서 `cg1`의 BE 노드 수를 2개에서 3개로 변경합니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

기존 `uniqueId`, 이미지, 리소스 설정, ConfigMap 및 영구 볼륨 구성은 유지하세요. 매니페스트를 적용하면 Operator가 StatefulSet의 복제본 수를 늘리고, 새로운 BE가 시작 중 클러스터에 등록됩니다.

그룹에 준비 상태인 Pod가 3개 있는지, `SHOW BACKENDS`에 새 BE가 `Alive = true`로 표시되는지 확인합니다. 새 노드의 캐시는 처음에 비어 있습니다. 노드를 추가해도 기존 노드와 동일한 캐시가 즉시 생기지는 않습니다.

### 7.3 기존 컴퓨트 그룹 축소하기 {#73-scale-in-an-existing-compute-group}

클러스터 수준의 Boolean 필드 `spec.enableDecommission`은 BE 제거 경로를 선택합니다. 기본값은 `false`입니다.

| 값 | 컴퓨트 그룹의 `replicas`를 줄일 때의 동작 |
| --- | --- |
| `true` | Doris BE 퇴역 작업을 제출하고 퇴역이 진행되는 동안 StatefulSet의 기존 복제본 수를 유지합니다. 선택된 노드의 퇴역이 끝나면 Doris에서 해당 노드를 제거하고 StatefulSet을 축소합니다. |
| `false` | 퇴역 단계 없이 선택된 BE를 Doris에서 제거합니다. Operator 26.0.1은 BE 이미지가 지원할 경우 먼저 정상 축소 절차를 사용하고, 지원하지 않으면 직접 제거 경로로 전환합니다. |

예를 들어 퇴역 경로를 통해 `cg1`을 3개 노드에서 2개 노드로 줄이려면 전체 매니페스트를 다음과 같이 변경한 뒤 적용합니다.

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator는 Pod 서수가 목표 복제본 수 이상인 노드를 선택합니다. 퇴역이 진행되는 동안 해당 Pod를 수동으로 삭제하지 마세요. 다음 명령으로 진행 상황을 확인합니다.

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

Doris에서 `SHOW BACKENDS;`를 실행합니다. Operator의 퇴역 확인 절차는 선택된 BE의 `SystemDecommissioned = true`와 `TabletNum = 0`이 모두 충족되거나 해당 BE가 이미 제거될 때까지 기다립니다. 이 과정에서 그룹이 `Decommissioning` 상태로 남아 있을 수 있습니다. 목표 수만큼의 Pod가 준비 상태이고 Doris의 BE 구성원도 그에 맞아야 작업이 완료된 것입니다.

:::caution 축소 중 로컬 스토리지
Operator 26.0.1은 StatefulSet을 축소한 뒤 제거된 Pod 서수에 해당하는 PVC를 삭제합니다. 실제 스토리지의 처리 방식은 기본 PV의 반환 정책에 따라 결정됩니다. 캐시, 로그 또는 Stream Load 임시 데이터를 영구 저장하더라도 해당 볼륨이 축소 후 유지된다는 보장은 없습니다. BE를 제거하기 전에 관련 데이터 적재 작업을 완료하고 필요한 로그를 보관하세요. 다시 확장하더라도 이전 로컬 데이터의 복원은 보장되지 않습니다.
:::

### 7.4 컴퓨트 그룹 전체 추가 또는 제거하기 {#74-add-or-remove-an-entire-compute-group}

그룹을 추가하려면 기존 그룹을 모두 유지하면서 새로운 `uniqueId`를 가진 항목을 추가합니다. 예를 들면 다음과 같습니다.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

전체 매니페스트를 적용하고 `cg2`가 준비 상태가 되어 `SHOW COMPUTE GROUPS`에 표시될 때까지 기다립니다. 해당 그룹으로 트래픽을 보내기 전에 [컴퓨트 그룹 관리](../../../compute-storage-decoupled/managing-compute-cluster.md)에 설명된 대로 사용자 접근 권한과 워크로드 라우팅을 구성하세요. 그룹을 추가해도 기존 세션은 새 그룹으로 자동 이동하지 않습니다.

그룹을 제거하려면 먼저 해당 그룹의 쿼리와 데이터 적재 작업을 사용 가능한 다른 그룹으로 옮기고, 그 그룹을 참조하는 사용자 기본값이나 애플리케이션 설정을 업데이트합니다. 전체 매니페스트에서 해당 그룹의 항목만 제거한 뒤 적용합니다. Operator는 Doris 메타데이터에서 해당 그룹의 BE를 제거한 다음, 관리 중인 Service와 StatefulSet을 제거합니다.

:::caution 그룹 전체 제거와 그룹 내 복제본 수 감소의 차이
Operator 26.0.1에서는 `computeGroups` 항목 전체를 제거할 때 `enableDecommission`이 `true`여도 BE 직접 제거 경로를 사용합니다. 단계적 퇴역을 요청하기 위해 항목을 제거하지 마세요. 삭제 후 남아 있는 PVC가 있는지 확인하고 보존 정책에 따라 처리하세요. 정리 동작이 기존 그룹 내 축소와 같다고 가정하지 마세요.
:::

### 7.5 리소스 변경 및 다른 구성요소 {#75-resource-changes-and-other-components}

| 변경 사항 | 작업 및 제약 조건 |
| --- | --- |
| BE당 CPU/메모리 증가 또는 감소 | 시나리오 3에 설명된 대로 그룹의 `requests`와 `limits`를 변경한 뒤 전체 매니페스트를 적용합니다. 이 변경으로 Pod 템플릿이 바뀌어 BE가 재시작될 수 있습니다. 적용 전에 스케줄링 용량을 확인하세요. |
| FE 확장 또는 축소 | `spec.feSpec.replicas`를 변경합니다. 값은 `electionNumber` 이상이어야 하며, 초과하는 FE 노드는 Observer입니다. Operator는 StatefulSet을 축소하기 전에 선택된 Observer를 Doris에서 제거합니다. 기존 클러스터의 `electionNumber`는 변경하지 마세요. [FE 구성](config-fe.md)을 참고하세요. |
| MetaService, FoundationDB 또는 Storage Vault 용량 변경 | 컴퓨트 그룹 복제본 수와 별도로 관리합니다. 해당 구성요소의 메타데이터와 스토리지는 유지하세요. BE 축소를 이유로 해당 리소스나 객체 스토리지의 데이터를 삭제할 필요는 없습니다. [MetaService 구성](config-ms.md)과 [FoundationDB 배포](install-fdb.md)를 참고하세요. |

### 7.6 검증 및 문제 해결 {#76-verify-and-troubleshoot}

각 변경 후에는 사용자 지정 리소스에 표시된 컴퓨트 그룹의 단계, Pod 준비 상태 및 `SHOW BACKENDS` 결과를 함께 확인합니다. 목표 노드 수가 맞는지, 유지된 노드의 `Alive = true`인지, 퇴역한 노드가 제거되었는지, 의도한 컴퓨트 그룹을 통해 쿼리와 데이터 적재가 성공하는지 확인하세요.

작업이 멈추면 `kubectl describe ddc`, Pod Events, PVC 바인딩 및 Operator 로그를 확인합니다. Pod가 `Pending` 상태라면 대개 스케줄링이나 스토리지를 확인해야 합니다. `Decommissioning` 상태라면 Doris 퇴역 진행 상황을 확인하고, `ScaleDownFailed` 상태라면 Operator의 SQL 오류와 FE 연결 상태 또는 권한을 확인하세요. 보고된 원인을 해결한 뒤 다시 시도하거나 리소스를 강제로 삭제하세요. [상태 및 문제 해결](../doris-operator/status-and-troubleshooting.md)을 참고하세요.
