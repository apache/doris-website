---
{
    "title": "配置计算组",
    "language": "zh-CN",
    "description": "详细介绍计算组（Compute Group）的配置方法，包括副本配置、多计算组配置、资源配置、访问模式配置、启动参数配置和持久化存储配置。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "计算组", "Compute Group", "BE", "NodePort", "LoadBalancer", "持久化存储", "ConfigMap"]
}
---

计算组（Compute Group）是一组负责相同任务的 BE 集合。本文按使用场景介绍 `DorisDisaggregatedCluster` 资源中计算组的配置方法，主要包括：

- **基础部署**：单计算组、多计算组的快速搭建
- **资源管控**：CPU、内存等计算资源限制
- **访问控制**：集群内、外通过不同方式访问 BE 服务
- **启动定制**：通过 ConfigMap 自定义 BE 启动参数
- **数据持久化**：缓存、日志、StreamLoad 暂存数据的持久化存储

## 场景 1：快速搭建单个计算组

### 最简配置

一个最简单的计算组配置仅包含 3 个字段：

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `uniqueId` | 计算组的唯一标识，也是计算组的名称。一旦设定便无法修改，命名需匹配规则 `[a-zA-Z][0-9a-zA-Z_]+` |
| `image` | 部署 BE 服务的镜像地址。请使用 [Apache Doris 官方镜像仓库](https://hub.docker.com/r/apache/doris) 提供的镜像 |
| `replicas` | 计算组内 BE 服务节点的数量 |

## 场景 2：部署多个计算组实现业务隔离

`DorisDisaggregatedCluster` 资源支持部署多套计算组，每套计算组之间相互独立。以下示例展示了部署名称为 `cg1` 和 `cg2` 两套计算组的配置：

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

各计算组的副本数说明如下：

| 计算组名称 | 副本数 |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

其中，`${beImage}` 表示部署的 BE 服务镜像。

:::tip 提示
尽管计算组之间相互独立，但建议同一存算分离集群中各计算组内 BE 服务所使用的镜像保持一致。
:::

## 场景 3：限制计算组的计算资源

存算分离[默认部署样例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)中，没有对 BE 服务使用的计算资源做限制。`DorisDisaggregatedCluster` 使用 Kubernetes 的 [resources.requests 和 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) 指定 CPU 和内存资源。

例如，配置名称为 `cg1` 的计算组 BE 可使用 8c 8Gi 的资源：

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

将上述配置更新到需要部署的 [`DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)中即可生效。

## 场景 4：配置计算组的访问方式

默认情况下，计算组不会直接对外提供服务。Doris Operator 在 `DorisDisaggregatedCluster` 资源中为计算组提供 Service 作为被访问的代理。Service 支持三种对外暴露模式，请根据访问来源选择合适的方式：

| 访问模式 | 适用场景 | 特点 |
|------|------|------|
| `ClusterIP` | Kubernetes 集群内部访问 | 默认模式，提供集群内部地址 |
| `NodePort` | 自建 Kubernetes 环境的集群外访问 | 通过宿主机端口暴露服务 |
| `LoadBalancer` | 云平台 Kubernetes 环境的集群外访问 | 由云服务商提供负载均衡器 |

### 4.1 ClusterIP（集群内访问）

[ClusterIP 访问模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)在 Kubernetes 集群内提供了一个内部地址，该地址作为服务在 Kubernetes 内部访问的入口。

#### 第 1 步：配置使用 ClusterIP 作为 Service 类型

Doris 默认在 Kubernetes 上启用 ClusterIP 访问模式，用户无需额外配置即可使用。

#### 第 2 步：获取 Service 访问地址

部署集群后，通过以下命令可以查看计算组服务对外暴露的 Service：

```shell
kubectl -n doris get svc
```

返回结果如下：

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

在上述结果中，获取了 namespace 为 `doris` 下，`uniqueId` 为 `cg1` 的对外可使用的 Service。

### 4.2 NodePort（自建集群外访问）

若需从 Kubernetes 集群外部访问 Doris，可以选择 [NodePort 模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)。NodePort 模式提供两种端口分配方式：

| 分配方式 | 说明 |
|------|------|
| 动态宿主机端口分配 | 未显示设置端口映射时，Kubernetes 在创建 Pod 时会自动分配一个未被使用的宿主机端口（默认范围为 30000-32767） |
| 静态宿主机端口分配 | 显示指定端口映射后，当宿主机端口未被占用且无冲突时，Kubernetes 会固定分配该端口 |

静态分配需要规划端口映射，Doris 提供以下端口用于与外部交互：

**表 1：BE 服务端口说明**

| 端口名称 | 默认端口 | 端口描述 |
|------|------|------|
| Web Server Port | 8040 | BE 上的 http server 端口，用于查看 BE 的信息 |

#### 静态分配配置

以下示例将名称为 `cg1` 的计算组中 BE 监听端口 8040 映射到宿主机的 31012 端口：

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

#### 动态分配配置

名称为 `cg1` 的计算组使用动态 NodePort 访问模式的配置如下：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer（云环境集群外访问）

[LoadBalancer 模式](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)适用于云平台的 Kubernetes 环境，是由云服务商提供的负载均衡器。在 `computeGroup.service` 中设置类型为 `LoadBalancer`，如下所示：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## 场景 5：自定义 BE 启动配置

默认部署中，每个计算组的 BE 服务均使用镜像内的默认配置文件启动。Doris Operator 使用 Kubernetes 的 ConfigMap 来挂载自定义启动配置文件。整体流程如下：

| 阶段 | 说明 |
|------|------|
| 输入 | 自定义的 `be.conf` 配置文件 |
| 操作 | 创建 ConfigMap 并挂载到 `/etc/doris` 目录 |
| 输出 | 计算组 BE 服务使用自定义配置启动 |

### 第 1 步：创建包含启动信息的 ConfigMap

以下展示了一个 BE 服务可使用的 ConfigMap 示例：

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

:::tip 提示
存算分离集群 BE 服务的启动配置必须设置 `file_cache_path`，格式请参考[存算分离配置 `be.conf`](../../deploy-manually/separating-storage-compute-deploy-manually) 章节。
:::

### 第 2 步：部署 ConfigMap

使用如下命令将自定义启动配置信息的 ConfigMap 部署到 Kubernetes 集群中：

```shell
kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml
```

参数说明：

| 参数 | 说明 |
|------|------|
| `${namespace}` | `DorisDisaggregatedCluster` 部署的命名空间 |
| `${beConfigMapFileName}` | 包含自定义 ConfigMap 的文件名称 |

### 第 3 步：更新 DorisDisaggregatedCluster 资源

更新 [`DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)以挂载 ConfigMap，配置如下：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip 提示
启动配置必须挂载到 `/etc/doris` 目录下。
:::

## 场景 6：为计算组配置持久化存储

默认部署中，BE 服务使用 Kubernetes 的 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) 作为服务的缓存。`EmptyDir` 模式是非持久化存储模式，服务重启后缓存的数据会丢失，相应查询效率会降低。

为保证 BE 服务在重启后缓存数据不丢失、查询效率不降低，需要对缓存数据进行持久化存储。BE 服务涉及的关键存储路径如下：

| 存储路径 | 用途 |
|------|------|
| BE 日志目录 | BE 服务的日志既会输出到标准输出，也会写入启动配置中 `LOG_DIR` 指定的目录 |
| `/opt/apache-doris/be/storage` | StreamLoad 模式导入时数据的暂存位置，避免服务异常重启后暂存的数据丢失 |
| BE 缓存目录 | 查询缓存，重启后数据丢失会降低查询效率 |

### 6.1 持久化存储样例

以下为需要持久化数据挂载持久化存储的配置样例：

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

上述配置说明：

- 日志目录使用自定义的存储配置，挂载 300Gi 的存储磁盘
- WAL 以及 StreamLoad 导入时使用的目录配置挂载 300Gi 的存储磁盘
- 缓存目录使用存储模板，挂载 500Gi 的存储磁盘

:::tip 提示
若 `mountPaths` 数组为空，则表示当前存储配置为模板配置。
:::

### 6.2 不持久化日志

如果不希望将日志持久化，仅输出到标准输出，则可配置如下：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
