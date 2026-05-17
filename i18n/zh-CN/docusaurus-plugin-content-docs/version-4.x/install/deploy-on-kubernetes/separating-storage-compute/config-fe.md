---
{
    "title": "配置 FE",
    "language": "zh-CN",
    "description": "详细介绍存算分离集群中 FE（FrontEnd）的配置方法，包括计算资源、Follower 数量、启动参数、访问模式（ClusterIP/NodePort/LoadBalancer）和持久化存储配置。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "持久化存储"]
}
---

## 学完本章节你将能够

- 配置 FE 组件的计算资源（CPU 和内存）
- 配置 FE Follower 数量和角色
- 通过 ConfigMap 自定义 FE 启动参数
- 根据访问场景选择 FE 服务的访问模式（ClusterIP/NodePort/LoadBalancer）
- 为 FE 配置持久化存储以避免元数据丢失

## 配置概览

FE（Frontend）在存算分离模式下主要负责查询解析和规划等相关工作。本章节按以下顺序介绍 FE 的配置方法：

| 配置项 | 解决的问题 |
| --- | --- |
| 计算资源配置 | 为 FE 显式分配 CPU 和内存 |
| Follower 节点数量配置 | 在分布式部署中规划元数据管理节点 |
| 自定义启动配置 | 通过 ConfigMap 覆盖默认启动参数 |
| 访问模式配置 | 根据访问场景（集群内/集群外/云平台）暴露 FE 服务 |
| 持久化存储配置 | 防止 FE 重启后元数据丢失 |

## 配置计算资源

Doris-Operator 仓库提供的[部署样例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)中，FE 默认不限制资源使用。生产环境建议通过 Kubernetes 的 [requests 和 limits](https://kubernetes.io/zh-cn/docs/concepts/configuration/manage-resources-containers/) 显式配置 FE 的计算资源。

为 FE 分配 8c8Gi 计算资源的配置示例如下：

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

将上述配置信息更新到[需要部署的 `DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#配置-dorisdisaggregatedcluster-资源)中。

## 配置 Follower 节点数量

FE 服务包含两种角色，分工如下：

| 角色 | 职责 |
| --- | --- |
| Follower | 负责 SQL 解析任务以及元数据的管理和存储 |
| Observer | 负责 SQL 解析任务，分担 Follower 的查询和写入负载 |

Doris 使用 bdbje 存储系统管理元数据，bdbje 底层实现类似 Paxos 协议算法。在分布式部署中，需要配置多个 Follower 节点共同参与元数据管理工作。

使用 `DorisDisaggregatedCluster` 资源部署 Doris 存算分离集群时，Follower 默认数量为 1。可通过 `electionNumber` 字段调整 Follower 节点数量。设置 Follower 数量为 3 的配置示例如下：

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip 提示

存算分离集群部署后，`electionNumber` 不允许修改，请在部署前规划好 Follower 数量。

:::

## 自定义启动配置

Doris Operator 通过 Kubernetes 的 ConfigMap 挂载 FE 启动配置。配置流程如下：

### 第 1 步：编写 FE 启动配置 ConfigMap

定义一个包含 FE 启动配置的 ConfigMap，样例如下：

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

### 第 2 步：将 ConfigMap 部署到目标命名空间

通过以下命令将 ConfigMap 部署到 `DorisDisaggregatedCluster` 所在的命名空间：

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

参数说明：

- `${namespace}`：`DorisDisaggregatedCluster` 所在的命名空间
- `${feConfigMapName}`：包含上述配置的文件名称

### 第 3 步：在 DorisDisaggregatedCluster 中引用 ConfigMap

更新[`DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#配置-dorisdisaggregatedcluster-资源)，通过 `feSpec.configMaps` 数组挂载 ConfigMap，示例如下：

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip 提示

在 Kubernetes 部署中，自定义启动配置时请注意以下两点：

1. **无需添加** `meta_service_endpoint` 以及 `cluster_id` 配置，Doris-Operator 会自动注入相关信息。
2. **必须设置** `enable_fqdn_mode=true`。

:::

## 访问配置

Doris-Operator 使用 Kubernetes 的 Service 提供 VIP 和负载均衡器的能力。根据访问场景的不同，可选择以下三种对外暴露模式：

| 访问模式 | 适用场景 | 说明 |
| --- | --- | --- |
| ClusterIP | 仅在 Kubernetes 集群内部访问 | 默认模式，无需额外配置 |
| NodePort | 从 Kubernetes 集群外部访问（自建集群常用） | 通过宿主机端口暴露服务 |
| LoadBalancer | 在云平台环境中通过云负载均衡器访问 | 由云服务商提供负载均衡器 |

下面分别介绍每种模式的配置方法。

### ClusterIP 模式

在 Kubernetes 上默认使用 [ClusterIP 模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。该模式在 Kubernetes 集群内提供一个内部地址，仅供集群内部访问使用。

#### 第 1 步：配置 ClusterIP

ClusterIP 是默认访问模式，**无需额外修改**即可使用。

#### 第 2 步：获取 Service 访问地址

部署集群后，通过以下命令查看 FE 暴露的 Service：

```shell
kubectl -n doris get svc
```

示例返回结果如下：

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

返回结果中包含两类 Service：

- 带 `internal` 后缀：仅供 Doris 内部通信使用（如心跳和数据交换），不对外暴露
- 不带 `internal` 后缀：用于外部访问 FE 服务

#### 第 3 步：在容器内部访问 Doris

使用如下命令在当前的 Kubernetes 集群中创建一个包含 MySQL 客户端的 Pod：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

在容器内部，通过不带 `internal` 后缀的 Service 名称连接 Doris 集群：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort 模式

若需从 Kubernetes 集群外部访问 Doris，可使用 [NodePort 模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)。NodePort 模式支持两种端口分配方式：

| 分配方式 | 说明 |
| --- | --- |
| 动态宿主机端口分配 | 未显式设置端口映射时，Kubernetes 自动分配宿主机未被使用的端口（默认范围 30000-32767） |
| 静态宿主机端口分配 | 显式指定端口映射，宿主机端口未被占用且无冲突时固定分配该端口 |

静态分配需要规划端口映射，Doris 默认提供以下端口用于与外部交互：

**表 1：FE 服务端口说明**

| 端口名称   | 默认端口 | 端口描述                                 |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | 用于通过 MySQL 协议访问 Doris 集群         |
| HTTP Port  | 8030    | FE 上的 HTTP Server 端口，用于查看 FE 的信息 |

#### 第 1 步：配置 FE NodePort

根据需求选择以下任一方式配置：

- **动态分配端口**：

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **静态分配端口**：

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

集群部署完成后，通过以下命令查看 `Service`：

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

以 MySQL 连接为例，假设 Doris 的 Query Port 映射到宿主机端口 31545，操作步骤如下：

1. 获取 Kubernetes 集群任一节点的 IP 地址：

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

2. 使用其中任一节点的 IP（如 192.168.88.62）和映射端口连接 Doris 集群：

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer 模式

[LoadBalancer 模式](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) 适用于云平台的 Kubernetes 环境，由云服务商提供负载均衡器。

#### 第 1 步：配置 LoadBalancer 模式

在 `feSpec.service` 中将类型设置为 `LoadBalancer`：

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### 第 2 步：获取 Service

集群部署后，通过以下命令查看 `Service`：

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

以 MySQL 连接为例，假设 Query Port 的监听端口为 9030，可使用如下命令连接 Doris 集群：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## 持久化存储

[默认部署](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)中，FE 服务使用 Kubernetes 的 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) 作为元数据存储模式。由于 `EmptyDir` 是非持久化存储模式，**服务重启后元数据会丢失**。

为保证 FE 元数据在重启后不丢失，需要为 FE 配置持久化存储。Doris Operator 提供以下三种方案，可根据使用需求选择：

| 方案 | 适用场景 |
| --- | --- |
| 使用存储模板自动生成 | 日志和元数据使用相同的存储配置，简化配置 |
| 自定义挂载点配置 | 需要为不同目录指定不同的存储规格 |
| 不持久化日志 | 日志只输出到标准输出，不需要持久化 |

### 使用存储模板自动生成

通过存储模板对日志和元数据进行统一持久化配置，示例如下：

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

应用上述配置部署集群后，会有以下效果：

- Doris Operator 自动为日志目录（默认为 `/opt/apache-doris/fe/log`）以及元数据目录（默认为 `/opt/apache-doris/fe/doris-meta`）挂载持久化存储
- 如果在[自定义启动配置](#自定义启动配置)中显式指定了日志或元数据目录，Doris Operator 会自动解析并进行挂载
- 持久化存储采用 [StorageClass 模式](https://kubernetes.io/docs/concepts/storage/storage-classes/)，可通过 `storageClassName` 指定所需的 StorageClass

### 自定义挂载点配置

Doris Operator 支持对挂载目录进行个性化存储配置。例如，为日志目录使用自定义存储配置挂载 300Gi 的存储磁盘，为元数据目录使用存储模板挂载 200Gi 的存储磁盘：

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

若 `mountPaths` 数组为空，则表示当前存储配置为模板配置（即应用于所有未单独配置的目录）。

:::

### 不持久化日志

如果不希望将日志持久化，而仅输出到标准输出，可使用如下配置：

```yaml
spec:
    feSpec:
        logNotStore: true
```
