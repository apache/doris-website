---
{
    "title": "配置部署 FE",
    "language": "zh-CN",
    "description": "FE 在存算分离模式下主要负责查询解析和规划等相关工作。"
}
---

FE 在存算分离模式下主要负责查询解析和规划等相关工作。

## 配置计算资源
Doris-Operator 仓库提供的[部署样例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)中，FE 默认不限制资源使用。通过 Kubernetes 的 [requests 和 Limits](https://kubernetes.io/zh-cn/docs/concepts/configuration/manage-resources-containers/) 配置服务的计算资源。例如，为 FE 分配 8c 8Gi 计算资源配置如下：
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
将上述配置信息更新到[需要部署的 `DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)中。

## 配置 Follower 数量
FE 服务有 Follower 和 Observer 两种角色，Follower 负责 sql 解析任务和元数据的管理和存储。Observer 主要负责 sql 解析任务，分担 Follower 的查询和写入负载任务。Doris 使用 bdbje 存储系统管理元数据，bdbje 底层实现类似 paxos 协议算法。
分布式部署中，需要配置多个 Follower 节点参与分布式环境下元数据管理工作。
使用 `DorisDisaggregatedCluster` 资源部署 Doris 存算分离集群，Follower 默认的数量为 1。可通过如下配置设置 Follower 节点的数量。设置 Follower 节点数量为 3 的配置示例如下：
```yaml
spec:
  feSpec:
    electionNumber: 3
```
:::tip 提示
存算分离集群部署后，`electionNumber` 不允许修改。
:::

## 自定义启动配置
Doris Operator 通过 Kubernetes 的 ConfigMap 挂载 FE 启动配置。配置步骤如下：
1. 自定义一个包含 FE 启动配置的 ConfigMap，样例如下：
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

2. 通过如下命令部署 `ConfigMap` 到 `DorisDisaggregatedCluster` 所在的命名空间：
    ```shell
    kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
    ```
   其中，`${namespace}` 为 `DorisDisaggregatedCluster` 所在的命名空间，${feConfigMapName} 为包含上述配置的文件名称。

3. 更新 [`DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)使用ConfigMap。
   在 `DorisDisaggregatedCluster` 资源中，通过 `feSpec.configMaps` 数组挂载 ConfigMap， 示例如下：
    ```yaml
    spec:
      feSpec:
        replicas: 2
        configMaps:
        - name: fe-configmap
    ```

:::tip 提示
1. Kubernetes 部署中，启动配置中无需要添加 `meta_service_endpoint` 以及 `cluster_id` 配置，Doris-Operator 会自动添加相关信息。
2. Kubernetes 部署中，自定义启动配置时，必须设定 `enable_fqdn_mode=true`。
   :::

## 访问配置
Doris-Operator 使用 Kubernetes 的 Service 提供 VIP 和负载均衡器的能力，支持以下三种对外暴漏模式： `ClusterIP` 、 `NodePort` 、 `LoadBalancer` .
### ClusterIP 模式
在 Kubernetes 上默认使用 [ClusterIP 访问模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。ClusterIP 访问模式在 Kubernetes 集群内提供了一个内部地址，该地址作为服务在 Kubernetes 内部的。

#### 第 1 步：配置 ClusterIP
默情况下，Doris 在 Kubernetes 上启用 ClusterIP 访问模式，用户无需额外修改即可使用该模式。
#### 第 2 步：获取 Service 访问地址
部署集群后，通过以下命令可以查看 FE 暴露的 service：
```shell
kubectl -n doris get svc
```
示例返回结果如下：
```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```
在上述结果中，以 internal 后缀的 Service 仅供 Doris 内部通信使用（如心跳和数据交换）不对外暴漏。 不带 internal 后缀的 Service 用于外部访问 FE 服务。

#### 第 3 步：在容器内部访问 Doris
使用如下命令在当前的 Kubernetes 集群中创建一个包含 MySQL 客户端 的 Pod：
```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
在容器内部，可以通过访问不带有 `internal` 后缀的 Service 名称连接 Doris 集群：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort
若需从 Kubernetes 集群外部访问 Doris，可使用 [NodePort 的模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)。NodePort 模式支持两种配置方式：静态宿主机端口分配和动态宿主机端口分配。
- **动态宿主机端口分配**：如果未显示设置端口映射，Kubernetes 会自动分配一个宿主机未被使用的端口（默认范围为 30000-32767）。
- **静态宿主机端口分配**：如果显示指定了端口映射，当宿主机端口未被占用且无冲突的时，Kubernetes 会固定分配该端口。
  静态分配需要规划端口映射，Doris 默认提供以下端口用于与外部交互：

| 端口名称 | 默认端口 | 端口描述                     |
|------| ---- |--------------------------|
| Query Port | 9030 | 用于通过 MySQL 协议访问 Doris 集群 |
| HTTP Port | 8030 | FE 上的 http server 端口，用于查看 FE 的信息 |

#### 第 1 步：配置 FE NodePort
- 动态分配配置：
    ```yaml
    spec:
      feSpec:
        service:
          type: NodePort
    ```

- 静态分配配置示例：
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

#### 第 2 步：获取 Service
集群部署完成后，通过以下命令查看 `Service` ：
```shell
kubectl get service
```
返回结果如下：
```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### 第 3 步：使用 NodePort 访问 Doris
以 MySQL 连接为例，Doris 的 Query Port 映射到宿主机端口 31545。首先获取到 Kubernetes 集群任一 node 的 IP 地址，例如通过：
```shell
kubectl get nodes -owide
```
示例返回：
```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
使用其中任一节点的 IP（如 192.168.88.62），通过以下命令连接 Doris 集群：
```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) 模式适用于云平台的 Kubernetes 环境，是由云服务商提供的负载均衡器。
#### 第 1 步：配置 LoadBalancer 模式
在 `feSpec.service` 中设置类型为 LoadBalancer，如下所示：
```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

#### 第 2 步：获取 Service
在部署集群后，通过以下命令查看 `Service`：
```shell
kubectl get service
```
示例返回结果：
```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### 第 3 步：使用 LoadBalancer 访问
以 MySQL 连接为例，假设 Query Port 的监听端口为 9030，则可使用如下命令连接 Doris 集群：
```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 持久化存储
[默认部署](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)中，FE 服务使用 Kubernetes 的 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) 作为元数据存储模式。由于 `EmptyDir` 模式是非持久化存储模式，服务重启后元数据会丢失。
为了保证 FE 元数据在重启后不丢失，需要配置持久化存储。
### 使用存储模板自动生成
使用存储模板对日志和元数据进行持久化配置，示例如下：
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
使用如上配置部署集群后，Doris Operator 会自动为日志目录（默认为 `/opt/apache-doris/fe/log`）以及元数据目录（默认为 `/opt/apache-doris/fe/doris-meta`）挂载持久化存储。 如果在[自定义启动配置](#自定义启动配置)中显示指定了日志或元数据目录，Doris Operator 会自动解析并进行挂载。
持久化存储采用 [StorageClass 模式](https://kubernetes.io/docs/concepts/storage/storage-classes/)，可以通过 `storageClassName` 指定所需的 StorageClass。

### 自定义挂载点配置
Doris Operator 支持对挂载目录进行个性化存储配置。为日志目录使用自定义存储配置挂载 300Gi 的存储磁盘，为元数据目录使用存储模板挂载 200Gi 的存储磁盘：
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
:::tip 提示
若 `mountPaths` 数组为空，则表示当前存储配置为模板配置。
:::

### 不持久化日志
如果不希望将日志持久化，而仅输出到标准输出，则可配置如下：
```yaml
spec:
  feSpec:
    logNotStore: true
```
