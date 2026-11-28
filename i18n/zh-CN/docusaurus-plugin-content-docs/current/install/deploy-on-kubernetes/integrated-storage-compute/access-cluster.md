---
{
    "title": "04 访问 Doris 集群",
    "language": "zh-CN",
    "description": "了解在 Kubernetes 上通过 ClusterIP、NodePort、LoadBalancer 三种模式访问 Doris 存算一体集群的方法，包括在 FE Pod 内连接、kubectl port-forward、节点端口与负载均衡器端口的区别，以及 Stream Load 的访问配置。",
    "keywords": ["访问 Doris 集群", "MySQL 客户端", "ClusterIP", "NodePort", "LoadBalancer", "port-forward", "StreamLoad", "Service", "K8s"]
}
---

Doris Operator 为 FE 和 BE 分别创建 Kubernetes Service。Service 有三种暴露方式：`ClusterIP`、`NodePort` 和 `LoadBalancer`。本页以[部署 Doris 集群](install-doris-cluster.md)中创建的 `doris` 命名空间下的 `doriscluster-sample` 集群为例，介绍各种方式的访问步骤。

首次部署后，`root` 用户没有密码。将 Doris 暴露到 Kubernetes 集群外部之前，请先[设置 root 用户密码](install-config-cluster.md#集群部署后设置-root-用户密码)。

## ClusterIP 模式

Doris 在 Kubernetes 上默认使用 [ClusterIP 访问模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。ClusterIP 访问模式在 Kubernetes 集群内提供一个内部地址，只能在 Kubernetes 集群内访问。

### 第 1 步：获取 Service

部署集群后，通过以下命令查看 Doris Operator 创建的 Service：

```shell
kubectl -n doris get svc
```

返回结果如下：

```text
NAME                              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                               AGE
doris-operator-service            ClusterIP   10.96.125.220   <none>        443/TCP                               37m
doriscluster-sample-be-internal   ClusterIP   None            <none>        9050/TCP                              116s
doriscluster-sample-be-service    ClusterIP   10.96.154.191   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   116s
doriscluster-sample-fe-internal   ClusterIP   None            <none>        9030/TCP                              3m9s
doriscluster-sample-fe-service    ClusterIP   10.96.181.183   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   3m9s
```

FE 和 BE 各有两类 Service：

- 以 `-internal` 为后缀的 Service 供 Doris 内部通信使用（如心跳和数据交换），不用于客户端访问。
- 以 `-service` 为后缀的 Service 用于访问集群服务。`doris-operator-service` 属于 Operator，与 Doris 集群无关。

### 第 2 步：访问 Doris

根据客户端所在位置选择访问方式：

| 客户端位置 | 访问方式 |
| --- | --- |
| 运维人员临时执行 SQL | 在 FE Pod 内使用镜像自带的 MySQL 客户端 |
| Kubernetes 集群内的应用 | 通过 FE Service 的 DNS 名称访问 |
| 本地电脑，且已安装 MySQL 客户端 | 通过 `kubectl port-forward` 将 FE 端口转发到本地 |

**在 FE Pod 内连接**

FE 镜像自带 MySQL 客户端，无需额外拉取客户端镜像：

```shell
kubectl -n doris exec -it doriscluster-sample-fe-0 -- mysql -h doriscluster-sample-fe-service -P 9030 -uroot
```

**集群内的应用访问**

Kubernetes 集群内的应用使用以下地址连接 Doris。同一命名空间内的应用可以只使用 `doriscluster-sample-fe-service:9030`：

```text
doriscluster-sample-fe-service.doris.svc.cluster.local:9030
```

**通过 port-forward 从本地访问**

在本地电脑上执行以下命令，将 FE 的 9030 端口转发到本地。命令会持续运行，请保持该终端窗口打开：

```shell
kubectl -n doris port-forward svc/doriscluster-sample-fe-service 9030:9030
```

在另一个终端中，使用本地的 MySQL 客户端连接：

```shell
mysql -h 127.0.0.1 -P 9030 -uroot
```

`port-forward` 适合临时调试，连接经过 Kubernetes API Server 转发，不适合应用长期访问。

## NodePort 模式

按照[配置 NodePort 访问模式](install-config-cluster.md#nodeport)修改 `DorisCluster` 资源后，使用 MySQL 协议访问 FE 的步骤如下。

### 第 1 步：获取 Service

```shell
kubectl -n doris get svc
```

返回结果如下：

```text
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

`PORT(S)` 中的 `9030:31545/TCP` 表示 Service 端口 9030 映射到节点端口 31545。

### 第 2 步：访问 Doris

要访问 Doris 集群，还需要获取集群的节点 IP 地址：

```shell
kubectl get nodes -o wide
```

返回结果如下：

```text
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

在 NodePort 模式下，可以通过任意节点的 IP 地址和节点端口访问 Doris。以下示例使用节点 192.168.88.62 和 Query Port 对应的节点端口 31545 连接 Doris：

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

客户端需要能访问节点 IP。在 Docker Desktop 等桌面环境中运行的 kind 集群，节点 IP 通常无法从宿主机直接访问，请改用 `port-forward`。

## LoadBalancer 模式

在公有云上按照[配置 LoadBalancer 访问模式](install-config-cluster.md#loadbalancer)修改 `DorisCluster` 资源后，使用 MySQL 协议访问 FE 的步骤如下。

### 第 1 步：获取 Service

```shell
kubectl -n doris get svc
```

返回结果如下：

```text
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

`EXTERNAL-IP` 为负载均衡器分配的地址。`PORT(S)` 中的 `9030:31545/TCP` 表示负载均衡器在 Service 端口 9030 上监听，31545 是同时分配的节点端口。

如果 `EXTERNAL-IP` 一直为 `<pending>`，说明负载均衡器尚未创建成功。请执行以下命令查看 Events：

```shell
kubectl -n doris describe svc doriscluster-sample-fe-service
```

集群中没有负载均衡控制器时（例如自建集群或本地 kind 集群），Events 为空，`EXTERNAL-IP` 会一直保持 `<pending>`，请改用 NodePort 模式。

### 第 2 步：访问 Doris

使用 `EXTERNAL-IP` 和 Service 端口 9030 连接，而不是节点端口 31545：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## StreamLoad 访问部署在 Kubernetes 的 Doris

Doris 提供使用 StreamLoad 模式导入数据。客户端和 Doris 集群在同一个局域网内时，客户端可直接使用 FE 的地址作为请求地址，FE 服务接收请求并返回 HTTP 307 状态码以及 BE 的可访问地址，告诉客户端请求 BE 的地址导入数据。在 Kubernetes 上部署的 Doris 集群使用只在 Kubernetes 内部可访问的地址通信，当使用 StreamLoad 方式配置 FE 的可访问地址时，FE 通过重定向返回的是 BE 只在 Kubernetes 内部可访问的地址，导致在 Kubernetes 外部的客户端导入数据失败。

在 Kubernetes 外部的客户端使用 StreamLoad 模式向部署在 Kubernetes 上的 Doris 集群导入数据时，需要配置可从外部访问的 BE 地址作为 StreamLoad 的导入地址。

### 配置 BE Service 外部可访问

按照 [NodePort](install-config-cluster.md#nodeport) 或者 [LoadBalancer](install-config-cluster.md#loadbalancer) 配置 BE 服务的 `Service`，使其可以从 Kubernetes 集群外部访问，然后更新 `DorisCluster` 资源。

### 配置 BE 代理地址

按照 [NodePort](#nodeport-模式) 或者 [LoadBalancer](#loadbalancer-模式) 中获取访问地址的方式，获取可在 Kubernetes 外部访问的 BE 地址，以及 BE `webserver_port`（默认 8040）对应的端口：NodePort 模式使用节点 IP 和节点端口，LoadBalancer 模式使用 `EXTERNAL-IP` 和 8040。将获取到的地址和端口配置到 StreamLoad 导入请求的地址中。
