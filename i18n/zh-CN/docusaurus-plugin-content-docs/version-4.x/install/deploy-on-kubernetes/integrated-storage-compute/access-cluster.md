---
{
    "title": "访问 Doris 集群",
    "language": "zh-CN",
    "description": "Kubernetes 通过 Service 作为 vip 和负载均衡器的能力，Service 有三种对外暴漏模式 ClusterIP 、 NodePort 、 LoadBalancer。"
}
---

Kubernetes 通过 Service 作为 vip 和负载均衡器的能力，Service 有三种对外暴漏模式 `ClusterIP` 、 `NodePort` 、 `LoadBalancer`。

## ClusterIP 模式

Doris 在 Kubernetes 上默认使用 [ClusterIP 访问模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。ClusterIP 访问模式在 Kubernetes 集群内提供了一个内部地址，该地址作为服务在 Kubernetes 内部的。

首次部署后，通过 MySQL 协议，使用 root 用户无密码的模式访问部署如下。

### 第 1 步：获取 Service

部署集群后，通过以下命令可以查看 Doris Operator 暴露的 service：

```shell
kubectl -n doris get svc
```

返回结果如下：

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

在上述结果中，FE 与 BE 各自有两类 Service，分别以 internal 与 service 作为后缀：

- 以 internal 后缀的 Service 仅供 Doris 内部通信使用，如心跳，数据交换等，不对外暴漏。

- 以 service 后缀的 Service 用于访问集群服务。

### 第 2 步：访问 Doris

ClusterIP 模式只能在 Kubernetes 内部使用，使用如下命令在当前的 Kubernetes 集群中创建一个包含 MySQL 客户端 的 Pod：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

在容器内部，可以通过访问带有 `service` 后缀的 Service 名称连接 Doris 集群：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## NodePort 模式

按照 DorisCluster 访问配置章节，[配置使用 NodePort 访问模式](install-config-cluster.md#nodeport)后，使用 MySQL 协议，通过 root 无密码模式访问 FE 步骤如下。

### 第 1 步：获取 Service

集群部署完成后，通过以下命令查看 `Service` ：

```shell
kubectl get service
```

返回结果如下：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

### 第 2 步：访问 Doris

以 mysql 连接为例，Doris 的 Query Port 默认端口 9030，在上述示例中，端口  9030 被映射到本地端口 31545。要访问 Doris 集群，需要获取到集群的节点 IP 地址，可以使用以下命令查看：

```shell
kubectl get nodes -owide
```

返回结果如下：

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

在 NodePort 模式下，可以通过任意 node 节点的 IP 地址与映射的宿主机端口方位 Kubernetes 集群内的服务。在本例中，可以使用的 node 节点 IP 包括 192.168.88.61、192.168.88.62、192.168.88.63。以下示例展示了如何使用节点 192.168.88.62 和 `query port` 映射的宿主机端口 31545 连接 Doris：

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## LoadBalancer 模式

按照 DorisCluster 访问配置章节，在公有云上，[配置使用 LoadBalancer 访问模式](install-config-cluster.md#loadbalancer)后，使用 MySQL 协议，通过 root 无密码模式访问 FE 步骤如下。

### 第 1 步：获取 Service

在部署集群后，通过以下命令可以查看可访问 `Doris` 的 `Service`：

```shell
kubectl get service
```

返回结果如下：

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### 第 2 步：访问 Doris

以 MySQL 连接为例：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## StreamLoad 访问部署在 Kubernetes 的 Doris
Doris 提供使用 StreamLoad 模式导入数据。客户端和 Doris 集群在同一个局域网内，客户端可直接使用 FE 的地址作为请求地址，FE 服务接收请求并返回 HTTP 301 的状态码以及 BE 的可访问地址，告诉客户端请求 BE 的地址导入数据。在 Kubernetes 上部署的 Doris 集群使用只在 Kubernetes 内部可访问的地址通信，当使用 StreamLoad 方式配置 FE 的可访问地址时，
FE 通过 301 机制返回的是 BE 只在 Kubernetes 内部可访问的地址，导致在 Kubernetes 外部的客户端导入数据失败。

在 Kubernetes 外部的客户端使用 StreamLoad 模式向部署在 Kubernetes 上的 Doris 集群导入数据时，需要配置可从外部访问的 BE 地址作为 StreamLoad 的导入地址。
### 配置 BE Service 外部可访问
按照 [NodePort](install-config-cluster.md#nodeport) 或者 [LoadBalancer](install-config-cluster.md#loadbalancer) 配置 BE 服务的 `Service` 可以从 Kubernetes 集群外部访问。更新部署 Doris 集群的 `DorisCluster` 资源。

### 配置 BE 代理地址
根据 [NodePort](#nodeport-模式) 或者 [LoadBalancer](#loadbalancer-模式) 获取访问地址的方式，获取可在 Kubernetes 外部访问的地址以及对应的可访问 web_server 服务的端口。将获取到的地址和访问端口配置到使用 StreamLoad 导入数据的请求地址中。
