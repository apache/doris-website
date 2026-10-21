---
{
    "title": "FE 설정",
    "language": "ko",
    "description": "스토리지-컴퓨팅 분리 클러스터에서 FE(FrontEnd)를 설정하는 자세한 가이드로, 컴퓨팅 리소스, Follower 수, 시작 매개변수, 접근 모드(ClusterIP/NodePort/LoadBalancer), 영구 스토리지 설정을 다룹니다.",
    "keywords": ["Doris", "스토리지-컴퓨팅 분리", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "영구 스토리지"]
}
---

## 이 장에서 배울 내용 {#what-you-will-learn-in-this-chapter}

- FE 구성 요소의 컴퓨팅 리소스(CPU 및 메모리)를 설정하는 방법
- FE Follower 수와 역할을 설정하는 방법
- ConfigMap으로 FE 시작 매개변수를 사용자 지정하는 방법
- 접근 시나리오에 따라 FE 서비스의 접근 모드(ClusterIP/NodePort/LoadBalancer)를 선택하는 방법
- 메타데이터 손실을 방지하도록 FE의 영구 스토리지를 설정하는 방법

## 설정 개요 {#configuration-overview}

스토리지-컴퓨팅 분리 모드에서 FE(Frontend)는 주로 쿼리 구문 분석과 계획 수립을 담당합니다. 이 장에서는 다음 순서로 FE 설정을 설명합니다.

| 설정 항목 | 해결하는 문제 |
| --- | --- |
| 컴퓨팅 리소스 설정 | FE에 CPU와 메모리를 명시적으로 할당 |
| Follower 노드 수 설정 | 분산 배포 환경에서 메타데이터 관리 노드를 계획 |
| 시작 설정 사용자 지정 | ConfigMap으로 기본 시작 매개변수를 재정의 |
| 접근 모드 설정 | 접근 시나리오(클러스터 내부, 클러스터 외부 또는 클라우드 플랫폼)에 따라 FE 서비스를 노출 |
| 영구 스토리지 설정 | FE 재시작 후 메타데이터 손실 방지 |

## 컴퓨팅 리소스 설정 {#configure-compute-resources}

Doris-Operator 저장소에서 제공하는 [배포 예제](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)에서는 기본적으로 FE의 리소스 제한이 설정되어 있지 않습니다. 프로덕션 환경에서는 Kubernetes의 [요청 및 제한](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)을 통해 FE 컴퓨팅 리소스를 명시적으로 설정하는 것이 좋습니다.

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

이 설정을 [배포할 `DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource)에 적용합니다.

## Follower 노드 수 설정 {#configure-the-number-of-follower-nodes}

FE 서비스에는 두 가지 역할이 있으며, 각각의 책임은 다음과 같습니다.

| 역할 | 책임 |
| --- | --- |
| Follower | SQL 구문 분석을 처리하고 메타데이터를 관리 및 저장 |
| Observer | SQL 구문 분석을 처리하고 Follower의 쿼리 및 쓰기 부하를 분담 |

Doris는 bdbje 스토리지 시스템을 사용하여 메타데이터를 관리합니다. bdbje의 내부 구현은 Paxos 프로토콜 알고리즘과 유사합니다. 분산 배포 환경에서는 여러 Follower 노드가 함께 메타데이터 관리에 참여하도록 설정해야 합니다.

`DorisDisaggregatedCluster` 리소스로 Doris 스토리지-컴퓨팅 분리 클러스터를 배포할 때 기본 Follower 수는 1입니다. `electionNumber` 필드로 Follower 노드 수를 조정할 수 있습니다. 다음 예제는 Follower 수를 3으로 설정합니다.

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip 팁

스토리지-컴퓨팅 분리 클러스터를 배포한 후에는 `electionNumber`를 수정할 수 없습니다. 배포 전에 Follower 수를 계획하세요.

:::

## 시작 설정 사용자 지정 {#custom-startup-configuration}

Doris Operator는 Kubernetes ConfigMap을 통해 FE 시작 설정을 마운트합니다. 설정 절차는 다음과 같습니다.

### 1단계: FE 시작 ConfigMap 작성 {#step-1-write-the-fe-startup-configmap}

다음과 같이 FE 시작 설정을 포함하는 ConfigMap을 정의합니다.

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
        JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
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

다음 명령으로 `DorisDisaggregatedCluster`가 속한 네임스페이스에 ConfigMap을 배포합니다.

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

매개변수 설명:

- `${namespace}`: `DorisDisaggregatedCluster`가 속한 네임스페이스
- `${feConfigMapName}`: 위 설정을 포함하는 파일 이름

### 3단계: DorisDisaggregatedCluster에서 ConfigMap 참조 {#step-3-reference-the-configmap-in-dorisdisaggregatedcluster}

[`DorisDisaggregatedCluster` 리소스](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource)를 업데이트하고 다음과 같이 `feSpec.configMaps` 배열을 통해 ConfigMap을 마운트합니다.

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip 팁

Kubernetes 배포 환경에서 시작 설정을 사용자 지정할 때는 다음 두 가지 사항에 유의하세요.

1. `meta_service_endpoint` 또는 `cluster_id` 설정을 **추가하지 마세요**. Doris-Operator가 이 값을 자동으로 주입합니다.
2. `enable_fqdn_mode=true`를 **반드시 설정해야 합니다**.

:::

## 접근 설정 {#access-configuration}

Doris-Operator는 Kubernetes Service를 사용하여 VIP 및 로드 밸런싱 기능을 제공합니다. 접근 시나리오에 따라 다음 세 가지 노출 모드 중 하나를 선택할 수 있습니다.

| 접근 모드 | 적용 시나리오 | 설명 |
| --- | --- | --- |
| ClusterIP | Kubernetes 클러스터 내부에서만 접근 | 기본 모드로, 추가 설정이 필요하지 않음 |
| NodePort | Kubernetes 클러스터 외부에서 접근(주로 직접 구축한 클러스터에서 사용) | 호스트 포트를 통해 서비스를 노출 |
| LoadBalancer | 클라우드 플랫폼 환경에서 클라우드 로드 밸런서를 통해 접근 | 클라우드 서비스 제공업체가 로드 밸런서를 제공 |

다음 절에서는 각 모드의 설정 방법을 설명합니다.

### ClusterIP 모드 {#clusterip-mode}

Kubernetes는 기본적으로 [ClusterIP 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)를 사용합니다. 이 모드는 Kubernetes 클러스터 내부 주소를 제공하며, 해당 주소는 클러스터 내부에서만 접근할 수 있습니다.

#### 1단계: ClusterIP 설정 {#step-1-configure-clusterip}

ClusterIP는 기본 접근 모드이므로 사용하기 위해 **추가로 변경할 필요가 없습니다**.

#### 2단계: Service 접근 주소 확인 {#step-2-get-the-service-access-address}

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

결과에는 두 종류의 Service가 포함됩니다.

- `internal` 접미사가 있는 Service: Doris 내부 통신(예: 하트비트 및 데이터 교환)에만 사용되며 외부에 노출되지 않습니다.
- `internal` 접미사가 없는 Service: FE 서비스에 대한 외부 접근에 사용됩니다.

#### 3단계: 컨테이너 내부에서 Doris에 접근 {#step-3-access-doris-from-inside-a-container}

다음 명령을 실행하여 현재 Kubernetes 클러스터에 MySQL 클라이언트가 포함된 Pod를 생성합니다.

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

컨테이너 내부에서 `internal` 접미사가 없는 Service 이름으로 Doris 클러스터에 연결합니다.

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe
```

### NodePort 모드 {#nodeport-mode}

Kubernetes 클러스터 외부에서 Doris에 접근하려면 [NodePort 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)를 사용합니다. NodePort 모드는 두 가지 포트 할당 방식을 지원합니다.

| 할당 방식 | 설명 |
| --- | --- |
| 동적 호스트 포트 할당 | 포트 매핑을 명시적으로 설정하지 않으면 Kubernetes가 사용하지 않는 호스트 포트를 자동으로 할당(기본 범위 30000-32767) |
| 정적 호스트 포트 할당 | 포트 매핑을 명시적으로 지정. 호스트 포트가 사용 중이 아니고 충돌이 없으면 해당 포트로 고정됨 |

정적 할당을 사용하려면 포트 매핑을 계획해야 합니다. Doris는 기본적으로 외부 통신을 위해 다음 포트를 제공합니다.

**표 1: FE 서비스 포트 설명**

| 포트 이름  | 기본 포트 | 포트 설명                       |
|---------- | ------- | -------------------------------------- |
| 쿼리 포트 | 9030    | MySQL 프로토콜을 통해 Doris 클러스터에 접근하는 데 사용 |
| HTTP 포트  | 8030    | FE 정보를 확인하는 데 사용하는 FE의 HTTP Server 포트 |

#### 1단계: FE NodePort 설정 {#step-1-configure-fe-nodeport}

필요에 따라 다음 설정 중 하나를 선택합니다.

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

#### 3단계: NodePort를 통해 Doris에 접근 {#step-3-access-doris-through-nodeport}

MySQL 연결을 예로 들어 설명합니다. Doris 쿼리 포트가 호스트 포트 31545에 매핑되어 있다고 가정합니다. 절차는 다음과 같습니다.

1. Kubernetes 클러스터에 속한 임의 노드의 IP 주소를 확인합니다.

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

2. 임의 노드의 IP(예: 192.168.88.62)와 매핑된 포트를 사용하여 Doris 클러스터에 연결합니다.

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer 모드 {#loadbalancer-mode}

[LoadBalancer 모드](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)는 클라우드 플랫폼의 Kubernetes 환경에 적합하며, 클라우드 서비스 제공업체가 로드 밸런서를 제공합니다.

#### 1단계: LoadBalancer 모드 설정 {#step-1-configure-loadbalancer-mode}

`LoadBalancer`를 `feSpec.service`의 유형으로 설정합니다.

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

#### 3단계: LoadBalancer를 통해 접근 {#step-3-access-through-the-loadbalancer}

MySQL 연결을 예로 들어 설명합니다. 쿼리 포트가 9030에서 수신 대기한다고 가정합니다. 다음 명령으로 Doris 클러스터에 연결합니다.

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 영구 스토리지 {#persistent-storage}

[기본 배포](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)에서 FE 서비스는 메타데이터 저장 방식으로 Kubernetes의 [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)를 사용합니다. `EmptyDir`는 비영구 스토리지 방식이므로 **서비스가 재시작되면 메타데이터가 손실됩니다**.

재시작 후에도 FE 메타데이터가 손실되지 않도록 FE에 영구 스토리지를 설정합니다. Doris Operator는 다음 세 가지 옵션을 제공합니다. 필요에 따라 하나를 선택하세요.

| 옵션 | 적용 시나리오 |
| --- | --- |
| 스토리지 템플릿을 사용한 자동 생성 | 로그와 메타데이터에 동일한 스토리지 설정을 사용하여 설정을 간소화 |
| 사용자 지정 마운트 지점 설정 | 디렉터리마다 서로 다른 스토리지 사양이 필요한 경우 |
| 로그를 영구 저장하지 않음 | 로그를 표준 출력에만 기록하며 영구 저장할 필요가 없는 경우 |

### 스토리지 템플릿을 사용한 자동 생성 {#auto-generate-using-a-storage-template}

다음과 같이 스토리지 템플릿을 통해 로그와 메타데이터의 영구 저장을 동일하게 설정합니다.

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

이 설정으로 클러스터를 배포하면 다음과 같이 적용됩니다.

- Doris Operator가 로그 디렉터리(기본값 `/opt/apache-doris/fe/log`)와 메타데이터 디렉터리(기본값 `/opt/apache-doris/fe/doris-meta`)에 영구 스토리지를 자동으로 마운트합니다.
- [사용자 지정 시작 설정](#custom-startup-configuration)에서 로그 또는 메타데이터 디렉터리를 명시적으로 지정하면 Doris Operator가 이를 자동으로 파싱하고 그에 맞게 스토리지를 마운트합니다.
- 영구 스토리지는 [StorageClass 모드](https://kubernetes.io/docs/concepts/storage/storage-classes/)를 사용합니다. `storageClassName`으로 원하는 StorageClass를 지정할 수 있습니다.

### 사용자 지정 마운트 지점 설정 {#custom-mount-point-configuration}

Doris Operator는 디렉터리별 스토리지 설정을 지원합니다. 예를 들어, 사용자 지정 스토리지 설정으로 로그 디렉터리에 300Gi 디스크를 마운트하고, 스토리지 템플릿으로 메타데이터 디렉터리에 200Gi 디스크를 마운트할 수 있습니다.

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

`mountPaths` 배열이 비어 있으면 해당 스토리지 설정은 템플릿 설정으로 처리됩니다(즉, 별도로 설정되지 않은 모든 디렉터리에 적용됩니다).

:::

### 로그를 영구 저장하지 않음 {#do-not-persist-logs}

로그를 영구 저장하지 않고 표준 출력에만 기록하려면 다음 설정을 사용합니다.

```yaml
spec:
    feSpec:
        logNotStore: true
```
