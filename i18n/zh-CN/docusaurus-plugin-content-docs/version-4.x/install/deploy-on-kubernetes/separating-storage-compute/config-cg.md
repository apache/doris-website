---
{
    "title": "配置计算组",
    "language": "zh-CN",
    "description": "介绍 Kubernetes 上 Doris 存算分离计算组的配置与扩缩容方法，包括 BE 节点数量、资源限制、访问模式、启动参数、持久化存储，以及缩容退役、PVC 清理和结果验证。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "计算组", "Compute Group", "BE", "NodePort", "LoadBalancer", "持久化存储", "ConfigMap"]
}
---

计算组（Compute Group）是一组负责相同任务的 BE 集合。本文按使用场景介绍 `DorisDisaggregatedCluster` 资源中计算组的配置方法，主要包括：

- **基础部署**：单计算组、多计算组的快速搭建
- **资源管控**：CPU、内存等计算资源限制
- **访问控制**：集群内、外通过不同方式访问 BE 服务
- **启动定制**：通过 ConfigMap 自定义 BE 启动参数
- **数据持久化**：缓存、日志、StreamLoad 暂存数据的持久化存储
- **扩缩容**：增减 BE 节点和计算组，并检查缩容结果

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
kubectl apply -n ${namespace} -f ${beConfigMapFileName}.yaml
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

## 场景 7：调整计算容量 {#scaling-compute-groups}

通过修改 `DorisDisaggregatedCluster` 资源扩缩容计算组。`replicas` 表示 BE 节点数，不是对象存储中数据的副本数。增大该值会增加计算容量，减小该值会移除 BE 节点及其本地缓存。

以下流程以 [Doris Operator 26.0.1](https://github.com/apache/doris-operator/tree/26.0.1) 为依据。请使用同一发行版本的 CRD 和 Operator 镜像。缩容行为也取决于 BE 镜像，不能假定所有镜像都支持优雅退出。

### 7.1 准备并检查集群

调整容量前：

- 确认 FE、MetaService、FoundationDB 和现有 BE 节点健康。Operator 必须能够使用[配置认证](config-cluster.md)中的管理凭证连接 FE。
- 检查 Kubernetes 的 CPU、内存和存储容量，包括新 PVC 能否绑定。为剩余业务保留足够的就绪 BE 节点。
- 缩容前先降低或迁移流量，等待正在执行的查询和导入任务完成。操作后检查客户端重试情况和导入任务状态。

以下示例使用命名空间 `doris`、集群 `test-disaggregated-cluster` 和计算组 `cg1`，请替换为实际名称：

```shell
kubectl get ddc test-disaggregated-cluster -n doris -o yaml
kubectl get pods,sts,pvc -n doris
```

以管理员身份连接 FE 的 SQL 端口，记录现有计算组和 BE 节点：

```sql
SHOW COMPUTE GROUPS;
SHOW BACKENDS;
```

修改部署集群时使用的完整清单，然后执行：

```shell
kubectl apply -n doris -f ddc-sample.yaml
```

以下 YAML 片段仅展示需要修改的字段。请保留其他字段和 `spec.computeGroups` 中的所有其他计算组。省略已有计算组会请求删除该组。请修改 Doris 自定义资源，由 Operator 协调 Doris 元数据和 Kubernetes 资源，不要直接缩放其 StatefulSet。

### 7.2 扩容已有计算组

例如，将完整清单中 `cg1` 的 BE 节点数从 2 调整为 3：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
```

保留原有 `uniqueId`、镜像、资源配置、ConfigMap 和持久卷配置。应用清单后，Operator 增加 StatefulSet 副本数，新 BE 在启动时注册到集群。

确认该组有 3 个就绪 Pod，且 `SHOW BACKENDS` 中新增 BE 的 `Alive = true`。新节点需要逐步建立缓存，增加节点不会立即获得与已有节点相同的缓存。

### 7.3 缩容已有计算组

集群级布尔字段 `spec.enableDecommission` 决定 BE 的移除流程，默认值为 `false`：

| 取值 | 减小计算组 `replicas` 时的行为 |
| --- | --- |
| `true` | 先提交 Doris BE 退役操作，退役期间保持 StatefulSet 原有副本数。待选中节点退役完成后，从 Doris 移除节点并缩减 StatefulSet。 |
| `false` | 不执行退役步骤，直接从 Doris 移除选中的 BE。Operator 26.0.1 在 BE 镜像支持时会先使用优雅缩容流程，否则回退到直接移除流程。 |

例如，通过退役流程将 `cg1` 从 3 个节点缩减为 2 个，在完整清单中进行如下修改并应用：

```yaml
spec:
  enableDecommission: true
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
```

Operator 选择 Pod 序号大于等于目标副本数的节点。退役过程中不要手动删除这些 Pod。通过以下命令查看进度：

```shell
kubectl describe ddc test-disaggregated-cluster -n doris
kubectl get sts,pods,pvc -n doris
```

在 Doris 中执行 `SHOW BACKENDS;`。Operator 的退役检查会等待选中 BE 的 `SystemDecommissioned = true` 且 `TabletNum = 0`，或节点已经被移除。期间计算组可能保持 `Decommissioning` 状态。只有就绪 Pod 数量和 Doris 中的 BE 成员均符合目标，才表示缩容完成。

:::caution 缩容时的本地存储
Operator 26.0.1 在 StatefulSet 缩容后会删除被移除 Pod 序号对应的 PVC。底层 PV 的回收策略决定存储的后续处理。将缓存、日志或 Stream Load 暂存数据持久化，并不保证这些卷会在缩容后保留。移除 BE 前，请完成依赖该节点的导入任务，并保存所需日志。再次扩容不保证恢复原有本地数据。
:::

### 7.4 新增或移除整个计算组

新增计算组时，保留所有已有组，追加一个具有新 `uniqueId` 的条目。例如：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 2
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```

应用完整清单，等待 `cg2` 就绪并出现在 `SHOW COMPUTE GROUPS` 中。向新组发送流量前，按照[管理计算组](../../../compute-storage-decoupled/managing-compute-cluster.md)配置用户权限和业务路由。新增计算组不会自动将已有会话迁移到该组。

移除计算组前，先将其查询和导入迁移到其他可用计算组，并更新引用该组的用户默认值或应用配置。仅从完整清单中删除该组条目并应用。Operator 先从 Doris 元数据中移除该组 BE，再移除其管理的 Service 和 StatefulSet。

:::caution 移除整个组与减少组内节点不同
Operator 26.0.1 在移除整个 `computeGroups` 条目时使用 BE 直接移除流程，即使 `enableDecommission` 为 `true` 也是如此。不要通过删除条目来请求逐步退役。删除后检查是否有残留 PVC，并按保留策略处理，不能假定其清理行为与已有组内的缩容相同。
:::

### 7.5 调整资源和其他组件

| 调整目标 | 操作与约束 |
| --- | --- |
| 增减单个 BE 的 CPU/内存 | 按场景 3 修改该组的 `requests` 和 `limits`，然后应用完整清单。这会改变 Pod 模板，可能导致 BE 重启。应用前确认调度容量。 |
| FE 扩缩容 | 修改 `spec.feSpec.replicas`，取值必须大于等于 `electionNumber`，超出的 FE 为 Observer。Operator 在缩减 StatefulSet 前，先从 Doris 移除选中的 Observer。不要修改已有集群的 `electionNumber`。参见[配置 FE](config-fe.md)。 |
| 调整 MetaService、FoundationDB 或 Storage Vault 容量 | 独立于计算组副本数管理，保留其元数据和存储。BE 缩容不需要删除这些组件的资源或对象存储中的数据。参见[配置 MetaService](config-ms.md)和[部署 FoundationDB](install-fdb.md)。 |

### 7.6 验证与排查

每次变更后，结合自定义资源中的计算组阶段、Pod 就绪状态和 `SHOW BACKENDS` 验证结果。确认节点数量符合目标、保留节点的 `Alive = true`、退役节点已被移除，并通过预期计算组执行查询和导入验证。

如果操作停滞，检查 `kubectl describe ddc`、Pod Events、PVC 绑定状态和 Operator 日志。Pod 为 `Pending` 时通常需要检查调度或存储；`Decommissioning` 需要检查 Doris 退役进度；`ScaleDownFailed` 需要检查 Operator 记录的 SQL 错误以及 FE 连通性和权限。解决报告的原因后再重试，不要直接强制删除资源。参见[状态与故障排查](../doris-operator/status-and-troubleshooting.md)。
