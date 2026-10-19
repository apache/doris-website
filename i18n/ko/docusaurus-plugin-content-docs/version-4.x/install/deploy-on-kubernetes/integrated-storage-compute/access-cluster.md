---
{
    "title": "04 Doris 클러스터에 접속하기",
    "language": "ko",
    "description": "ClusterIP, NodePort, LoadBalancer 모드를 통해 Kubernetes의 Doris 클러스터에 접속하는 방법과 MySQL 클라이언트 연결 및 StreamLoad 설정을 알아봅니다.",
    "keywords": ["Doris 클러스터 접속", "MySQL 클라이언트", "ClusterIP", "NodePort", "LoadBalancer", "StreamLoad", "Service", "K8s"]
}
---

Kubernetes는 Service를 사용하여 VIP 및 부하 분산 기능을 제공합니다. Service에는 외부 노출을 위한 세 가지 모드인 `ClusterIP`, `NodePort`, `LoadBalancer`가 있습니다.

## ClusterIP 모드 {#clusterip-mode}

기본적으로 Kubernetes의 Doris는 [ClusterIP 접속 모드](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)를 사용합니다. ClusterIP 접속 모드는 Kubernetes 클러스터 내부 주소를 제공하며, 이 주소는 Kubernetes 내부에서 서비스 주소로 사용됩니다.

최초 배포 후에는 다음과 같이 비밀번호 없이 `root` 사용자로 MySQL 프로토콜을 통해 Doris에 접속할 수 있습니다.

### 1단계: Service 확인 {#step-1-get-the-service}

클러스터를 배포한 후 다음 명령을 실행하여 Doris Operator가 노출하는 Service를 확인합니다:

```shell
kubectl -n doris get svc
```

결과는 다음과 같습니다:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

위 결과에서 FE와 BE에는 각각 `internal`과 `service` 접미사가 붙은 두 가지 유형의 Service가 있습니다:

- 접미사가 `internal`인 Service는 하트비트와 데이터 교환 등 Doris 내부 통신에만 사용되며 외부에 노출되지 않습니다.

- 접미사가 `service`인 Service는 클러스터 서비스에 접속하는 데 사용됩니다.

### 2단계: Doris에 접속 {#step-2-access-doris}

ClusterIP 모드는 Kubernetes 내부에서만 사용할 수 있습니다. 다음 명령을 실행하여 현재 Kubernetes 클러스터에 MySQL 클라이언트가 포함된 Pod를 생성합니다:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

컨테이너 내부에서는 접미사가 `service`인 Service 이름을 사용하여 Doris 클러스터에 접속할 수 있습니다:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## NodePort 모드 {#nodeport-mode}

DorisCluster의 접속 설정 섹션에서 [NodePort 접속 모드를 설정](install-config-cluster.md#nodeport)한 후, 다음 단계에 따라 비밀번호 없이 `root` 사용자로 MySQL 프로토콜을 통해 FE에 접속합니다.

### 1단계: Service 확인 {#step-1-get-the-service-1}

클러스터 배포가 완료되면 다음 명령을 실행하여 `Service`를 확인합니다:

```shell
kubectl get service
```

결과는 다음과 같습니다:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

### 2단계: Doris에 접속 {#step-2-access-doris-1}

MySQL 연결을 예로 들겠습니다. Doris의 기본 Query Port는 9030입니다. 위 예제에서는 포트 9030이 로컬 포트 31545에 매핑됩니다. Doris 클러스터에 접속하려면 클러스터 노드의 IP 주소를 확인해야 합니다. 다음 명령을 실행하여 확인합니다:

```shell
kubectl get nodes -owide
```

결과는 다음과 같습니다:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

NodePort 모드에서는 임의의 노드 IP 주소와 매핑된 호스트 포트를 통해 Kubernetes 클러스터 내부 서비스에 접속할 수 있습니다. 이 예제에서 사용 가능한 노드 IP에는 192.168.88.61, 192.168.88.62, 192.168.88.63이 있습니다. 다음 예제는 192.168.88.62 노드와 `query port`에 매핑된 호스트 포트 31545를 사용하여 Doris에 연결하는 방법을 보여 줍니다:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## LoadBalancer 모드 {#loadbalancer-mode}

퍼블릭 클라우드에서 DorisCluster의 접속 설정 섹션에 있는 [LoadBalancer 접속 모드를 설정](install-config-cluster.md#loadbalancer)한 후, 다음 단계에 따라 비밀번호 없이 `root` 사용자로 MySQL 프로토콜을 통해 FE에 접속합니다.

### 1단계: Service 확인 {#step-1-get-the-service-2}

클러스터를 배포한 후 다음 명령을 실행하여 `Service` 중 `Doris` 접속에 사용할 수 있는 서비스를 확인합니다:

```shell
kubectl get service
```

결과는 다음과 같습니다:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### 2단계: Doris에 접속 {#step-2-access-doris-2}

MySQL 연결을 예로 들겠습니다:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## StreamLoad를 사용하여 Kubernetes에 배포된 Doris에 접속 {#using-streamload-to-access-doris-deployed-on-kubernetes}
Doris는 StreamLoad 모드를 사용한 데이터 적재를 지원합니다. 클라이언트와 Doris 클러스터가 동일한 LAN에 있으면 클라이언트는 FE 주소를 요청 주소로 직접 사용할 수 있습니다. FE 서비스는 요청을 수신하고 접근 가능한 BE 주소와 함께 HTTP 301 상태 코드를 반환하여, 클라이언트가 해당 BE 주소로 데이터 적재 요청을 보내도록 알립니다. Kubernetes에 배포된 Doris 클러스터는 Kubernetes 내부에서만 접근할 수 있는 주소를 통해 통신합니다. StreamLoad에 FE의 접근 가능한 주소를 설정하면 FE가 301 메커니즘을 통해 반환하는 BE 주소는 Kubernetes 내부에서만 접근할 수 있으므로, Kubernetes 외부 클라이언트의 데이터 적재가 실패합니다.

Kubernetes 외부의 클라이언트가 StreamLoad를 사용하여 Kubernetes에 배포된 Doris 클러스터에 데이터를 적재하려면, 외부에서 접근할 수 있는 BE 주소를 StreamLoad 적재 주소로 설정해야 합니다.
### 외부에서 접근할 수 있도록 BE Service 설정 {#configure-the-be-service-to-be-externally-accessible}
BE `Service`를 Kubernetes 클러스터 외부에서 접근할 수 있도록 [NodePort](install-config-cluster.md#nodeport) 또는 [LoadBalancer](install-config-cluster.md#loadbalancer)에 따라 설정합니다. 그런 다음 Doris 클러스터를 배포하는 `DorisCluster` 리소스를 업데이트합니다.

### BE 프록시 주소 설정 {#configure-the-be-proxy-address}
[NodePort 모드](#nodeport-mode) 또는 [LoadBalancer 모드](#loadbalancer-mode)에서 설명하는 접속 주소 확인 방법에 따라 Kubernetes 외부에서 접근할 수 있는 주소와 web_server 서비스의 해당 포트를 확인합니다. 확인한 주소와 포트를 StreamLoad가 데이터를 적재할 때 사용하는 요청 주소로 설정합니다.
