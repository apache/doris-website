---
{
    "title": "Compute Group 구성",
    "language": "ko",
    "description": "복제본 구성, 여러 Compute Group 구성, 리소스 구성, 접근 모드 구성, 시작 매개변수 구성, 영구 스토리지 구성을 포함한 Compute Group 구성 상세 가이드입니다.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

Compute Group은 동일한 작업을 처리하는 BE 노드의 모음입니다. 이 문서에서는 사용 사례별로 `DorisDisaggregatedCluster` 리소스에서 Compute Group을 구성하는 방법을 설명하며, 주로 다음 내용을 다룹니다:

- **기본 배포**: 단일 Compute Group 또는 여러 Compute Group을 빠르게 설정
- **리소스 제어**: CPU, 메모리 등의 컴퓨팅 리소스 제한
- **접근 제어**: 다양한 방법으로 클러스터 내부 또는 외부에서 BE 서비스에 접근
- **시작 설정 사용자 지정**: ConfigMap을 통해 BE 시작 매개변수 사용자 지정
- **데이터 영구 저장**: 캐시, 로그, StreamLoad 임시 저장 데이터의 영구 저장

## 시나리오 1: 단일 Compute Group 빠르게 설정하기 {#scenario-1-quickly-set-up-a-single-compute-group}

### 최소 구성 {#minimal-configuration}

가장 간단한 Compute Group 구성에는 다음 3개 필드만 포함됩니다:

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
| `uniqueId` | Compute Group의 고유 식별자이며, Compute Group의 이름으로도 사용됩니다. 한 번 설정하면 수정할 수 없습니다. 이름은 `[a-zA-Z][0-9a-zA-Z_]+` 규칙을 따라야 합니다 |
| `image` | BE 서비스를 배포할 이미지 주소입니다. [Apache Doris 공식 이미지 레지스트리](https://hub.docker.com/r/apache/doris)에서 제공하는 이미지를 사용하세요 |
| `replicas` | Compute Group에 포함된 BE 서비스 노드 수 |

## 시나리오 2: 업무 격리를 위해 여러 Compute Group 배포하기 {#scenario-2-deploy-multiple-compute-groups-for-business-isolation}

`DorisDisaggregatedCluster` 리소스는 여러 Compute Group의 배포를 지원하며, 각 Compute Group은 서로 독립적입니다. 다음 예시는 이름이 `cg1`과 `cg2`인 두 Compute Group을 배포하는 구성을 보여줍니다:

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

각 Compute Group의 복제본 수는 다음과 같습니다:

| Compute Group 이름 | 복제본 수 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

여기서 `${beImage}`는 배포할 BE 서비스 이미지를 나타냅니다.

:::tip 팁
Compute Group은 서로 독립적이지만, 동일한 스토리지-컴퓨팅 분리 클러스터에 속한 모든 Compute Group에서 같은 BE 서비스 이미지를 사용하는 것이 좋습니다.
:::

## 시나리오 3: Compute Group의 컴퓨팅 리소스 제한하기 {#scenario-3-limit-the-compute-resources-of-a-compute-group}

스토리지-컴퓨팅 분리를 위한 [기본 배포 예시](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)에서는 BE 서비스가 사용하는 컴퓨팅 리소스를 제한하지 않습니다. `DorisDisaggregatedCluster`는 Kubernetes의 [resources.requests와 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits)를 사용하여 CPU 및 메모리 리소스를 지정합니다.

예를 들어, 이름이 `cg1`인 Compute Group의 BE가 8c 8Gi의 리소스를 사용하도록 구성하려면 다음과 같이 설정합니다:

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

위 구성을 배포할 [`DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#2-modify-key-configurations)에 반영하면 설정이 적용됩니다.

## 시나리오 4: Compute Group의 접근 방식 구성하기 {#scenario-4-configure-the-access-method-of-a-compute-group}

기본적으로 Compute Group은 서비스를 외부에 직접 노출하지 않습니다. Doris Operator는 `DorisDisaggregatedCluster` 리소스에 Compute Group의 접근 프록시 역할을 하는 Service를 제공합니다. Service는 세 가지 외부 노출 모드를 지원합니다. 접근 위치에 맞는 모드를 선택하세요:

| 접근 모드 | 적용 시나리오 | 특징 |
|------|------|------|
| `ClusterIP` | Kubernetes 클러스터 내부에서 접근 | 기본 모드로, 클러스터 내부 주소 제공 |
| `NodePort` | 자체 관리 Kubernetes 클러스터 외부에서 접근 | 호스트 머신의 포트를 통해 서비스 노출 |
| `LoadBalancer` | 클라우드 플랫폼의 Kubernetes 클러스터 외부에서 접근 | 클라우드 서비스 제공업체가 제공하는 로드 밸런서 사용 |

### 4.1 ClusterIP(클러스터 내부 접근) {#41-clusterip-access-within-the-cluster}

[ClusterIP 접근 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)는 Kubernetes 클러스터 내부 주소를 제공하며, 이 주소는 Kubernetes 내부에서 서비스에 접근하는 진입점으로 사용됩니다.

#### 1단계: Service 유형을 ClusterIP로 구성하기 {#step-1-configure-clusterip-as-the-service-type}

Doris는 Kubernetes에서 기본적으로 ClusterIP 접근 모드를 활성화합니다. 추가 구성 없이 사용할 수 있습니다.

#### 2단계: Service 접근 주소 확인하기 {#step-2-get-the-service-access-address}

클러스터를 배포한 후 다음 명령으로 Compute Group이 노출하는 Service를 확인합니다:

```shell
kubectl -n doris get svc
```

결과는 다음과 같습니다:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

위 결과에서 `uniqueId`가 `cg1`이고 네임스페이스가 `doris`인 Compute Group의 외부 접근에 사용할 수 있는 Service를 확인할 수 있습니다.

### 4.2 NodePort(자체 관리 클러스터의 외부 접근) {#42-nodeport-external-access-for-self-managed-clusters}

Kubernetes 클러스터 외부에서 Doris에 접근하려면 [NodePort 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)를 선택하세요. NodePort 모드는 두 가지 포트 할당 방식을 제공합니다:

| 할당 방식 | 설명 |
|------|------|
| 동적 호스트 포트 할당 | 포트 매핑을 명시적으로 설정하지 않으면, Kubernetes가 Pod를 생성할 때 사용하지 않는 호스트 포트를 자동으로 할당합니다(기본 범위 30000-32767) |
| 정적 호스트 포트 할당 | 포트 매핑을 명시적으로 지정하면, 해당 호스트 포트가 사용 중이 아니고 충돌이 없을 때 Kubernetes가 지정된 고정 포트를 할당합니다 |

정적 할당을 사용하려면 포트 매핑을 미리 계획해야 합니다. Doris는 외부와 통신하기 위해 다음 포트를 제공합니다:

**표 1: BE 서비스 포트 설명**

| 포트 이름 | 기본 포트 | 포트 설명 |
|------|------|------|
| 웹 서버 포트 | 8040 | BE 정보를 확인하는 데 사용하는 BE의 HTTP 서버 포트 |

#### 정적 할당 구성 {#static-allocation-configuration}

다음 예시는 이름이 `cg1`인 Compute Group에서 BE의 8040 포트를 호스트의 31012 포트에 매핑합니다:

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

이름이 `cg1`인 Compute Group에서 동적 NodePort 접근 모드를 사용하는 구성은 다음과 같습니다:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer(클라우드 환경의 외부 접근) {#43-loadbalancer-external-access-in-cloud-environments}

[LoadBalancer 모드](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)는 클라우드 플랫폼의 Kubernetes 환경에 적합하며, 클라우드 서비스 제공업체가 제공하는 로드 밸런서를 사용합니다. 유형을 `LoadBalancer`로 설정할 위치는 `computeGroup.service`이며, 다음과 같이 구성합니다:

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

기본 배포에서는 각 Compute Group의 BE 서비스가 이미지 내부의 기본 구성 파일로 시작됩니다. Doris Operator는 Kubernetes ConfigMap을 사용하여 사용자 지정 시작 구성 파일을 마운트합니다. 전체 흐름은 다음과 같습니다:

| 단계 | 설명 |
|------|------|
| 입력 | 사용자 지정 `be.conf` 구성 파일 |
| 작업 | ConfigMap을 생성하고 `/etc/doris` 디렉터리에 마운트 |
| 출력 | Compute Group의 BE 서비스가 사용자 지정 구성으로 시작 |

### 1단계: 시작 정보를 포함하는 ConfigMap 생성하기 {#step-1-create-a-configmap-that-contains-the-startup-information}

다음은 BE 서비스에서 사용할 수 있는 ConfigMap 예시입니다:

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
스토리지-컴퓨팅 분리 클러스터에서 BE 서비스의 시작 구성에는 `file_cache_path`를 반드시 설정해야 합니다. 형식은 [스토리지-컴퓨팅 분리 환경의 `be.conf` 구성](../../deploy-manually/separating-storage-compute-deploy-manually) 섹션을 참조하세요.
:::

### 2단계: ConfigMap 배포하기 {#step-2-deploy-the-configmap}

다음 명령으로 사용자 지정 시작 구성이 포함된 ConfigMap을 Kubernetes 클러스터에 배포합니다:

```shell
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
```

매개변수 설명:

| 매개변수 | 설명 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster`가 배포된 네임스페이스 |
| `${beConfigMapFileName}` | 사용자 지정 ConfigMap이 포함된 파일 이름 |

### 3단계: DorisDisaggregatedCluster 리소스 업데이트하기 {#step-3-update-the-dorisdisaggregatedcluster-resource}

[`DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#2-modify-key-configurations)를 업데이트하여 ConfigMap을 마운트합니다. 구성은 다음과 같습니다:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip 팁
시작 구성은 반드시 `/etc/doris` 디렉터리에 마운트해야 합니다.
:::

## 시나리오 6: Compute Group의 영구 스토리지 구성하기 {#scenario-6-configure-persistent-storage-for-a-compute-group}

기본 배포에서 BE 서비스는 Kubernetes의 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir)를 서비스 캐시로 사용합니다. `EmptyDir` 모드는 비영구 스토리지 모드입니다. 서비스가 다시 시작되면 캐시된 데이터가 손실되며, 그에 따라 쿼리 효율이 저하됩니다.

BE 서비스가 다시 시작된 후에도 캐시된 데이터를 유지하고 쿼리 효율이 저하되지 않도록 하려면 캐시된 데이터를 영구 저장해야 합니다. BE 서비스와 관련된 주요 저장 경로는 다음과 같습니다:

| 저장 경로 | 용도 |
|------|------|
| BE 로그 디렉터리 | BE 서비스 로그는 표준 출력으로 출력되며, 시작 구성의 `LOG_DIR`에 지정된 디렉터리에도 기록됩니다 |
| `/opt/apache-doris/be/storage` | StreamLoad 방식으로 데이터 적재 시 데이터를 임시 저장하는 위치로, 비정상적인 서비스 재시작 후 임시 저장된 데이터의 손실을 방지하는 데 사용됩니다 |
| BE 캐시 디렉터리 | 쿼리 캐시입니다. 재시작 후 데이터가 손실되면 쿼리 효율이 저하됩니다 |

### 6.1 영구 스토리지 예시 {#61-persistent-storage-example}

다음은 영구 저장이 필요한 데이터를 위해 영구 스토리지를 마운트하는 구성 예시입니다:

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

위 구성에 대한 설명:

- 로그 디렉터리는 사용자 지정 스토리지 구성을 사용하며, 300Gi 스토리지 디스크를 마운트합니다
- WAL 및 StreamLoad 데이터 적재에 사용하는 디렉터리는 300Gi 스토리지 디스크를 마운트하도록 구성됩니다
- 캐시 디렉터리는 스토리지 템플릿을 사용하며, 500Gi 스토리지 디스크를 마운트합니다

:::tip 팁
`mountPaths` 배열이 비어 있으면 현재 스토리지 구성을 템플릿 구성으로 처리합니다.
:::

### 6.2 로그를 영구 저장하지 않기 {#62-do-not-persist-logs}

로그를 영구 저장하지 않고 표준 출력으로만 출력하려면 다음과 같이 구성합니다:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
