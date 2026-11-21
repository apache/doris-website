---
{
    "title": "FE 구성",
    "language": "ko",
    "description": "스토리지와 컴퓨팅이 분리된 클러스터에서 FE(FrontEnd)를 구성하는 방법을 자세히 설명합니다. 컴퓨팅 리소스, Follower 수, 시작 매개변수, 액세스 모드(ClusterIP/NodePort/LoadBalancer), 영구 스토리지 구성을 다룹니다.",
    "keywords": ["Doris", "storage-compute separation", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "persistent storage"]
}
---

## 이 장에서 배울 내용 {#what-you-will-learn-in-this-chapter}

- FE 구성 요소의 컴퓨팅 리소스(CPU 및 메모리)를 구성하는 방법
- FE Follower의 수와 역할을 구성하는 방법
- ConfigMap으로 FE 시작 매개변수를 사용자 지정하는 방법
- 액세스 환경에 따라 FE 서비스의 액세스 모드(ClusterIP/NodePort/LoadBalancer)를 선택하는 방법
- 메타데이터 손실을 방지하도록 FE의 영구 스토리지를 구성하는 방법

## 구성 개요 {#configuration-overview}

스토리지와 컴퓨팅이 분리된 모드에서 FE(Frontend)는 주로 쿼리 파싱과 계획을 담당합니다. 이 장에서는 다음 순서로 FE 구성을 설명합니다.

| 구성 항목 | 해결하는 문제 |
| --- | --- |
| 컴퓨팅 리소스 구성 | FE에 CPU와 메모리를 명시적으로 할당 |
| Follower 노드 수 구성 | 분산 배포에서 메타데이터 관리 노드 계획 |
| 사용자 지정 시작 구성 | ConfigMap을 통해 기본 시작 매개변수 재정의 |
| 액세스 모드 구성 | 액세스 환경(클러스터 내부, 클러스터 외부 또는 클라우드 플랫폼)에 맞게 FE 서비스 노출 |
| 영구 스토리지 구성 | FE 재시작 후 메타데이터 손실 방지 |

## 컴퓨팅 리소스 구성 {#configure-compute-resources}

Doris-Operator 저장소에서 제공하는 [배포 예제](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)에서는 기본적으로 FE에 리소스 제한이 없습니다. 프로덕션 환경에서는 Kubernetes의 [requests 및 limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)를 통해 FE 컴퓨팅 리소스를 명시적으로 구성하는 것이 좋습니다.

다음 예제는 FE에 8c8Gi의 컴퓨팅 리소스를 할당합니다.

```yaml
spec:
    feSpec:
        requests:
            cpu: 8
            memory: 8Gi
        limits:
            cpu: 8
            memory: 8Gi
```

이 구성을 [배포할 `DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#2-modify-key-configurations)에 적용합니다.

### JVM 힙과 Pod 메모리 {#fe-jvm-memory}

Kubernetes의 `requests.memory`는 스케줄링에 사용되고, `limits.memory`는 컨테이너의 전체 메모리를 제한합니다. Doris Operator는 어느 값으로도 FE JVM 힙 크기를 계산하지 않습니다. 힙, Metaspace, 스레드 스택, 직접 메모리 및 기타 네이티브 메모리 할당량을 모두 컨테이너 메모리 제한 내에 맞춰야 합니다.

메모리 제한을 낮추기 전에 배포할 이미지에서 `fe.conf`를 복사하고 JVM 옵션의 `-Xms`와 `-Xmx`를 모두 조정합니다. JDK 17 이미지에서는 `JAVA_OPTS_FOR_JDK_17`을 수정하고 다른 옵션은 유지합니다. 예를 들어 아래 ConfigMap은 위의 8 GiB 컨테이너 제한 내에서 4 GiB 힙을 사용합니다. 프로덕션 환경에서는 메타데이터와 워크로드에 맞춰 힙 크기를 정하세요. 사용자 지정 시작 구성에서 설명하는 대로 `feSpec.configMaps`를 통해 파일을 마운트한 다음 FE를 재시작하여 적용합니다.

Kubernetes에서 `OOMKilled`가 보고되면 실제 적용된 JVM 옵션과 Pod 메모리 제한을 비교하세요. 제한을 높일 때는 힙 외 메모리를 위한 여유 공간을 남기고, 힙을 줄일 때는 `-Xmx`만 낮추고 `-Xms`를 더 큰 값으로 유지하지 마세요.

## Follower 노드 수 구성 {#configure-the-number-of-follower-nodes}

FE 서비스에는 다음과 같은 책임을 맡는 두 가지 역할이 있습니다.

| 역할 | 책임 |
| --- | --- |
| Follower | SQL 파싱을 처리하고 메타데이터를 관리 및 저장 |
| Observer | SQL 파싱을 처리하고 Follower의 쿼리 및 쓰기 부하를 분담 |

Doris는 bdbje 스토리지 시스템을 사용해 메타데이터를 관리합니다. bdbje의 내부 구현은 Paxos 프로토콜 알고리즘과 유사합니다. 분산 배포에서는 여러 Follower 노드를 구성하여 함께 메타데이터 관리에 참여하도록 해야 합니다.

`DorisDisaggregatedCluster` 리소스로 스토리지와 컴퓨팅이 분리된 Doris 클러스터를 배포하면 기본 Follower 수는 1입니다. `electionNumber` 필드로 Follower 노드 수를 조정할 수 있습니다. 다음 예제에서는 Follower 수를 3으로 설정합니다.

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip 팁

스토리지와 컴퓨팅이 분리된 클러스터를 배포한 후에는 `electionNumber`를 변경할 수 없습니다. 배포 전에 Follower 수를 계획하세요.

:::

## 사용자 지정 시작 구성 {#custom-startup-configuration}

Doris Operator는 Kubernetes ConfigMap을 통해 FE 시작 구성을 마운트합니다. 구성 절차는 다음과 같습니다.

### 1단계: FE 시작 ConfigMap 작성 {#step-1-write-the-fe-startup-configmap}

다음과 같이 FE 시작 구성이 포함된 ConfigMap을 정의합니다.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: fe-configmap
    namespace: default
    labels:
        app.kubernetes.io/component: fe
data:
    fe.conf: |
        CUR_DATE=`date +%Y%m%d-%H%M%S`
        # Log dir
        LOG_DIR = ${DORIS_HOME}/log
        # For jdk 17, this JAVA_OPTS will be used as default JVM options
        JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx4096m -Xms4096m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
        # INFO, WARN, ERROR, FATAL
        sys_log_level = INFO
        # NORMAL, BRIEF, ASYNC
        sys_log_mode = NORMAL
        # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
        # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers
        http_port = 8030
        rpc_port = 9020
        query_port = 9030
        edit_log_port = 9010
        enable_fqdn_mode=true
        deploy_mode = cloud
```

### 2단계: 대상 네임스페이스에 ConfigMap 배포 {#step-2-deploy-the-configmap-to-the-target-namespace}

다음 명령으로 `DorisDisaggregatedCluster`가 있는 네임스페이스에 ConfigMap을 배포합니다.

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

매개변수 설명:

- `${namespace}`: `DorisDisaggregatedCluster`가 있는 네임스페이스
- `${feConfigMapName}`: 위 구성이 포함된 파일의 이름

### 3단계: DorisDisaggregatedCluster에서 ConfigMap 참조 {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

[`DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#2-modify-key-configurations)를 업데이트하고 다음과 같이 `feSpec.configMaps` 배열을 통해 ConfigMap을 마운트합니다.

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip 팁

Kubernetes 배포에서 시작 구성을 사용자 지정할 때는 다음 두 가지에 유의하세요.

1. `meta_service_endpoint` 또는 `cluster_id` 구성을 **추가하지 마세요**. Doris-Operator가 이 값을 자동으로 주입합니다.
2. `enable_fqdn_mode=true`를 **반드시 설정하세요**.

:::

## 액세스 구성 {#access-configuration}

Doris-Operator는 Kubernetes Service를 사용해 VIP 및 로드 밸런싱 기능을 제공합니다. 액세스 환경에 따라 다음 세 가지 서비스 노출 모드 중 하나를 선택할 수 있습니다.

| 액세스 모드 | 적용 환경 | 설명 |
| --- | --- | --- |
| ClusterIP | Kubernetes 클러스터 내부에서만 액세스 | 기본 모드이며 추가 구성이 필요 없음 |
| NodePort | Kubernetes 클러스터 외부에서 액세스(자체 구축 클러스터에서 주로 사용) | 호스트 포트를 통해 서비스 노출 |
| LoadBalancer | 클라우드 플랫폼 환경에서 클라우드 로드 밸런서를 통해 액세스 | 클라우드 서비스 제공업체가 로드 밸런서 제공 |

다음 절에서는 각 모드의 구성을 설명합니다.

### ClusterIP 모드 {#clusterip-mode}

Kubernetes는 기본적으로 [ClusterIP 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)를 사용합니다. 이 모드는 Kubernetes 클러스터 내부에서만 액세스할 수 있는 내부 주소를 제공합니다.

#### 1단계: ClusterIP 구성 {#step-1-configure-clusterip}

ClusterIP는 기본 액세스 모드이므로 사용하기 위해 **추가로 변경할 사항이 없습니다**.

#### 2단계: Service 액세스 주소 확인 {#step-2-get-the-service-access-address}

클러스터를 배포한 후 다음 명령으로 FE가 노출하는 Service를 확인합니다.

```shell
kubectl -n doris get svc
```

결과 예시는 다음과 같습니다.

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

결과에는 두 종류의 Service가 있습니다.

- `internal` 접미사가 있는 Service: 하트비트 및 데이터 교환과 같은 Doris 내부 통신에만 사용되며 외부에 노출되지 않음
- `internal` 접미사가 없는 Service: FE 서비스에 대한 외부 액세스에 사용됨

#### 3단계: 컨테이너 내부에서 Doris에 액세스 {#step-3-access-doris-from-inside-a-container}

다음 명령으로 현재 Kubernetes 클러스터에 MySQL 클라이언트가 포함된 Pod를 생성합니다.

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

컨테이너 안에서 `internal` 접미사가 없는 Service 이름으로 Doris 클러스터에 연결합니다.

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### NodePort 모드 {#nodeport-mode}

Kubernetes 클러스터 외부에서 Doris에 액세스하려면 [NodePort 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)를 사용합니다. NodePort 모드에서는 다음 두 가지 방법으로 포트를 할당할 수 있습니다.

| 할당 방법 | 설명 |
| --- | --- |
| 동적 호스트 포트 할당 | 포트 매핑을 명시적으로 설정하지 않으면 Kubernetes가 사용하지 않는 호스트 포트를 자동으로 할당(기본 범위 30000-32767) |
| 정적 호스트 포트 할당 | 포트 매핑을 명시적으로 지정하며, 호스트 포트가 사용 중이지 않고 충돌이 없으면 해당 포트로 고정 |

정적 할당에는 포트 매핑 계획이 필요합니다. Doris는 기본적으로 외부 통신에 다음 포트를 제공합니다.

**표 1: FE 서비스 포트 설명**

| 포트 이름  | 기본 포트 | 포트 설명                       |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | MySQL 프로토콜로 Doris 클러스터에 액세스하는 데 사용 |
| HTTP Port  | 8030    | FE 정보를 확인하는 데 사용되는 FE의 HTTP Server 포트 |

#### 1단계: FE NodePort 구성 {#step-1-configure-fe-nodeport}

필요에 따라 다음 구성 중 하나를 선택합니다.

- **동적 포트 할당**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **정적 포트 할당**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
                portMaps:
                    - nodePort: 31001
                      targetPort: 8030
                    - nodePort: 31002
                      targetPort: 9030
    ```

#### 2단계: Service 확인 {#step-2-get-the-service}

클러스터를 배포한 후 다음 명령으로 `Service`를 확인합니다.

```shell
kubectl get service
```

결과는 다음과 같습니다.

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### 3단계: NodePort를 통해 Doris에 액세스 {#step-3-access-doris-through-nodeport}

MySQL 연결을 예로 들어 보겠습니다. Doris Query Port가 호스트 포트 31545에 매핑되었다고 가정하면 절차는 다음과 같습니다.

1. Kubernetes 클러스터에 있는 노드 중 하나의 IP 주소를 확인합니다.

    ```shell
    kubectl get nodes -owide
    ```

    결과 예시:

    ```shell
    NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
    r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    ```

2. 노드 중 하나의 IP(예: 192.168.88.62)와 매핑된 포트를 사용하여 Doris 클러스터에 연결합니다.

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer 모드 {#loadbalancer-mode}

[LoadBalancer 모드](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)는 클라우드 플랫폼의 Kubernetes 환경에 적합하며, 로드 밸런서는 클라우드 서비스 제공업체가 제공합니다.

#### 1단계: LoadBalancer 모드 구성 {#step-1-configure-loadbalancer-mode}

`feSpec.service`에서 유형을 `LoadBalancer`로 설정합니다.

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### 2단계: Service 확인 {#step-2-get-the-service-1}

클러스터를 배포한 후 다음 명령으로 `Service`를 확인합니다.

```shell
kubectl get service
```

결과 예시:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### 3단계: LoadBalancer를 통해 액세스 {#step-3-access-through-the-loadbalancer}

MySQL 연결을 예로 들어 보겠습니다. Query Port가 9030에서 수신 대기한다고 가정하면 다음 명령으로 Doris 클러스터에 연결합니다.

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 영구 스토리지 {#persistent-storage}

[기본 배포](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)에서 FE 서비스는 메타데이터 저장 방식으로 Kubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)를 사용합니다. `EmptyDir`는 비영구 스토리지이므로 **서비스가 재시작되면 메타데이터가 손실됩니다**.

재시작 후에도 FE 메타데이터가 손실되지 않도록 FE의 영구 스토리지를 구성하세요. Doris Operator는 다음 세 가지 옵션을 제공합니다. 필요에 맞는 옵션을 선택하세요.

| 옵션 | 적용 환경 |
| --- | --- |
| 스토리지 템플릿을 사용해 자동 생성 | 로그와 메타데이터에 동일한 스토리지 구성을 사용하여 설정 간소화 |
| 사용자 지정 마운트 지점 구성 | 디렉터리마다 다른 스토리지 사양이 필요함 |
| 로그를 영구 저장하지 않음 | 로그를 표준 출력에만 기록하며 영구 저장이 필요하지 않음 |

### 스토리지 템플릿을 사용해 자동 생성 {#auto-generate-using-a-storage-template}

다음과 같이 스토리지 템플릿을 통해 로그와 메타데이터의 영구 저장을 일괄 구성합니다.

```yaml
spec:
    feSpec:
        persistentVolumes:
            - persistentVolumeClaimSpec:
                # storageClassName: ${storageclass_name}
                accessModes:
                    - ReadWriteOnce
                resources:
                    requests:
                        storage: 200Gi
```

이 구성으로 클러스터를 배포하면 다음과 같이 적용됩니다.

- Doris Operator가 로그 디렉터리(기본값 `/opt/apache-doris/fe/log`)와 메타데이터 디렉터리(기본값 `/opt/apache-doris/fe/doris-meta`)에 영구 스토리지를 자동으로 마운트합니다.
- [사용자 지정 시작 구성](#custom-startup-configuration)에서 로그 또는 메타데이터 디렉터리를 명시적으로 지정하면 Doris Operator가 이를 자동으로 해석하고 해당 위치에 스토리지를 마운트합니다.
- 영구 스토리지는 [StorageClass 방식](https://kubernetes.io/docs/concepts/storage/storage-classes/)을 사용합니다. `storageClassName`으로 원하는 StorageClass를 지정할 수 있습니다.

### 사용자 지정 마운트 지점 구성 {#custom-mount-point-configuration}

Doris Operator는 디렉터리별 스토리지 구성을 지원합니다. 예를 들어 사용자 지정 스토리지 구성으로 로그 디렉터리에 300Gi 디스크를 마운트하고, 스토리지 템플릿으로 메타데이터 디렉터리에 200Gi 디스크를 마운트할 수 있습니다.

```yaml
spec:
    feSpec:
        persistentVolumes:
            - mountPaths:
                - /opt/apache-doris/fe/log
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
                        storage: 200Gi
```

:::tip 팁

`mountPaths` 배열이 비어 있으면 해당 스토리지 구성을 템플릿 구성으로 취급합니다. 즉, 별도로 구성하지 않은 모든 디렉터리에 적용됩니다.

:::

### 로그를 영구 저장하지 않음 {#do-not-persist-logs}

로그를 영구 저장하지 않고 표준 출력에만 기록하려면 다음 구성을 사용합니다.

```yaml
spec:
    feSpec:
        logNotStore: true
```
