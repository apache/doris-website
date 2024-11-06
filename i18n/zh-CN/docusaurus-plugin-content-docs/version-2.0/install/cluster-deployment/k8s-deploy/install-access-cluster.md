---
{
"title": "访问 Doris 集群 ",
"language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 使用 ClusterIP 模式访问

Doris 在 Kubernetes 上默认提供 ClusterIP 访问模式。ClusterIP 访问模式在 Kubernetes 集群内提供了一个内部 IP 地址，通过这个内部 IP 暴露服务。使用 ClusterIP 模式，只能在集群内部访问。

1. 配置使用 ClusterIP 作为 Service 类型

Doris 在 Kubernetes 上默认提供 ClusterIP 访问模式。无需进行修改即可使用 ClusterIP 访问模式。

2. 获取 Service

在部署集群后，通过以下命令可以查看 Doris Operator 暴露的 service：

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

在以上结果中，FE 与 BE 有两类 Service，后缀分别为 internal 与 service：

- 以 internal 后缀的 Service 服务只能 Doris 内部通信使用，如心跳，数据交换等操作，不对外使用
- 以 service 后缀的 Service 服务可以提供用户使用

3. 在容器内部访问 Doris

使用以下命令，可以在当前的 Kubernetes 集群中创建一个包含 mysql client 的 pod：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

在集群内的容器中，可以使用对外暴露的后缀为 `service` 的服务名访问 Doris 集群：

```shell
## 使用 service 类型 pod name 访问 Doris 集群
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## 使用 NodePort 模式访问

如果用户需要再 Kubernetes 集群外部访问 Doris，可以选择使用 NodePort 的模式。

1. 规划 NodePort 模式端口映射

使用与维护 Doris 集群，用户需要访问以下端口：

| 端口名称 | 默认端口 | 端口描述                     |
|------| ---- |--------------------------|
| Query Port | 9030 | 用于通过 MySQL 协议访问 Doris 集群 |
| HTTP Port | 8030 | FE 上的 http server 端口，用于查看 FE 的信息 |
| Web Server Port | 8040 | BE 上的 http server 端口，用于查看 BE 的信息 |

使用 NodePort 有两种端口分配方式：

- 动态分配：如果没有显示设置端口映射，Kubernetes 会在创建 pod 的时候自动分配一个未使用的端口（默认范围为 30000-32767）；
- 静态分配：如果显示指定了端口映射，当端口未被使用无冲突的时候，Kubernetes 固定分配该端口。

在 Kubernetes 中默认使用动态分配端口的方式，如果需要提前规划端口，需要在 Custom Resource 中显示指定。在下例中，将 Doris 端口进行映射：

```yaml
...
spec:
  feSpec:
    replicas: 3
    service:
      type: NodePort
      servicePorts:
        - nodePort: 31001
          targetPort: 8030
        - nodePort: 31002
          targetPort: 8040
        - nodePort: 31003
          targetPort: 9030
...
  beSpec:
    replicas: 3
    service:
      type: NodePort
      servicePorts:
        - nodePort: 31005
          targetPort: 9060
        - nodePort: 31006
          targetPort: 8040
        - nodePort: 31007
          targetPort: 9050
        - nodePort: 31008
          targetPort: 8060
...
```

2. 配置使用 NodePort 作为 Service 类型

使用 NodePort 访问模式，需要定义 DorisCluster 资源，指定 FE 与 BE 使用 NodePort 模式，具体改动如下：

```yaml
...
spec:
  feSpec:
    replicas: 3
    service:
      type: NodePort
...
   beSpec:
    replicas: 3
    service:
      type: NodePort
...
```

3. 获取 Service

在部署集群后，通过以下命令可以查看 Doris Operator 暴露的 service：

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

Doris 的 Query Port 端口默认为 9030，在本地中被映射到本地端口 31545。在访问 Doris 集群时，同时需要获取到对应的 IP 地址，可以通过以下命令查看：

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

在 NodePort 模式下，可以根据任何 node 节点的宿主机 IP 与端口映射访问 Kubernetes 集群内的服务。在本例中可以使用任一的 node 节点 IP，192.168.88.61、192.168.88.62、192.168.88.63 访问 Doris 服务。如在下例中使用了 node 节点 192.168.88.62 与映射出的 query port 端口 31545 访问集群：

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## Stream Load ErrorURL 重定向

[Stream Load](../../../data-operate/import/stream-load-manual.md) 是 Doris 提供的一种同步导入模式，是一种高效导入本地文件到 Doris 的方式。在物理机或虚机部署的情况下，直接使用 http 的方式向 FE 发起导入数据请求，FE 通过 301 机制将请求重定向到 BE 服务，执行写入请求。在 Kubernetes 上 FE 和 BE 使用 [Service](https://kubernetes.io/zh-cn/docs/concepts/services-networking/service/) 作为服务发现的方式。在使用代理屏蔽内部真实地址来提供服务发现的情形下，使用 FE 301 返回的 BE 的地址 (服务内部通信使用的真实的地址) 无法访问。在 Kubernetes 上需要使用 BE 的 Service 地址导入数据。

如在下例中，Stream Load ErrorUrl 返回结果 `http://doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e`

### 在容器内部查看 ErrorURL

如果在 Kubernetes 内部进行 Stream Load 可直接使用 Stream Load 返回的错误地址获取详细的错误报告。

在上例返回结果中，可以直接在同一个 Kubernetes 集群内的 Pod 中通过 curl 命令获取返回结果：

```shell
curl http://doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```

### 在容器外部查看 ErrorURL

从 Kubernetes 外部使用 Stream Load 导入数据过程中发生错误，返回的错误地址无法直接在 Kubernetes 外部访问获取详细的错误报告。在 Kubernetes 环境中需要使用定制的 Service 代理发生错误的 pod，将定制的 Service 配置为外部可访问的模式，通过访问代理 Service 来获取详细的错误报告。

定制化 Service 模板如下：

```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app.doris.service/role: debug
    app.kubernetes.io/component: be
  name: doriscluster-detail-error
spec:
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: webserver-port
      port: 8040
      protocol: TCP
      targetPort: 8040
  selector:
    app.kubernetes.io/component: be
    statefulset.kubernetes.io/pod-name: ${podName}
  sessionAffinity: None
  type: ${ServiceType}
```

其中：

- ${podName} 表示当前发生错误的 pod 三级域名，如上例中需要填写 pod 名为 doriscluster-sample-be-2
- ${ServiceType} 为部署的 Service 类型，可以选择 NodePort 或 LoadBalancer

:::tip 提示
由于每次 stream load 返回的 pod 名可能不同，获取 Stream Load 详细错误信息后，请将定制化的 Service 删除。
:::

**NodePort 模式**

1. 部署 NodePort Service

按照上例中的 service 将 CR 中的 ${podName} 替换成 doriscluster-sample-be-2，将 ${ServiceType} 替换为 NodePort。通过 kubectl apply 命令，在于 doris 集群相同的 namespace 中创建 service 服务。

```shell
kubectl -n {namespace} apply -f strem_load_get_error.yaml
```

2. 构建访问命令

使用以下命令查看上述部署 Service 分配的 NodePort 端口：

```shell
kubectl get service -n doris doriscluster-detail-error
```

返回结果如下：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)            AGE
doriscluster-detail-error         NodePort    10.152.183.35    <none>        8040:31201/TCP     32s
```

`Stream Load` 访问的 BE 端口为 8040，上述 Service 中 8040 对应的宿主机端口 ( NodePort ) 为 31201。

获取 K8s 管控的宿主机地址：

```shell
kubectl get node -owide
```

返回结果如下：

```shell
NAME             STATUS   ROLES    AGE    VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                       KERNEL-VERSION       CONTAINER-RUNTIME
vm-10-8-centos   Ready    <none>   226d   v1.28.7   10.16.10.8    <none>        TencentOS Server 3.1 (Final)   5.4.119-19-0009.3    containerd://1.6.28
vm-10-7-centos   Ready    <none>   19d    v1.28.7   10.16.10.7    <none>        TencentOS Server 3.1 (Final)   5.4.119-19.0009.25   containerd://1.6.28
```

使用上述宿主机中任何一个 `INTERNAL-IP` 和获得宿主机端口构建使用 NodePort 模式获取错误详情的访问地址。`NodePort` 模式下，获取错误详情的地址拼接为 `宿主机 IP:NodePort` , 则案例可访问地址为 `10.16.10.8:31201` ，替换返回错误地址信息中的访问地址，获得可访问错误信息详情的可使用地址 :

```text
http://10.16.10.8:31201/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```

使用上述命令获取 Stream Load 的详细报错信息。

**LoadBalancer 模式**

1. 部署获取错误详情 Service


假设 Stream Load 范围的错误地址如下：

```text
http://doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```

上述地址的域名地址为 `doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local` 在 `Kubernetes` 上 `Doris Operator` 部署的 pod 使用的域名中，三级域名为  pod 的名称。将上述模板中 {podName} 替换为真实的 `pod` 名称，将 {serviceType} 替换为 `LoadBalancer` ，更改后保存到新建的 `stream_load_get_error.yaml` 文件中。使用如下命令部署 service：

```shell
kubectl -n {namespace} apply -f strem_load_get_error.yaml
```

2. 构建访问命令

使用如下命令查看上述部署 Service 分配的  LoadBalaner 地址 EXTERNAL-IP ,以下为在 aws eks 测试实例：

```shell
kubectl get service -n doris doriscluster-detail-error
```

返回结果如下：

```shell
NAME                         TYPE          CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)           AGE
doriscluster-detail-error    LoadBalancer  172.20.183.136   ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com  8040:32003/TCP    14s
```

上述 Service 获得由 K8s 集群分配的 LoadBalancer 地址为 `ac4828493dgrftb884g67wg4tb68gyut``-1137856348.us-east-1.elb.amazonaws.com`，在使用 LoadBalancer 模式中端口仍然为部署部署监听的端口，`LoadBalancer` 模式下，获取错误详情的地址拼接为“EXTERNAL-IP:listener-port”。上例中可获取错误详情的地址为 `ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com:8040`，获取详细错误信息的地址如下：

```text
http://ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```
