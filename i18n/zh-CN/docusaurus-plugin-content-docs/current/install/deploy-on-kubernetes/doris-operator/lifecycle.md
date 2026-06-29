---
{
    "title": "Doris Operator 生命周期管理",
    "sidebar_label": "生命周期管理",
    "language": "zh-CN",
    "description": "介绍 Doris Operator 在集群创建、扩缩容、配置变更、滚动更新和删除过程中的主要行为。",
    "keywords": ["Doris Operator 生命周期", "扩容", "缩容", "滚动更新", "配置变更", "DorisCluster", "DorisDisaggregatedCluster"]
}
---

Doris Operator 通过 Reconcile 循环管理 Doris 集群生命周期。用户修改 Doris 自定义资源后，Operator 会根据新的期望状态更新底层 Kubernetes 资源，并在需要时执行 Doris 元数据层动作。

本文重点解释这些操作背后的语义。

## 创建集群

当你创建 `DorisCluster` 或 `DorisDisaggregatedCluster` 时，Operator 会根据其中的组件配置创建底层 Kubernetes 资源。

对存算一体集群，通常先创建 FE：

![Cluster creation flow for DorisCluster](/images/doris-operator/mermaid/11-lifecycle-doriscluster-creation.jpg)

对存算分离集群，通常先创建 MetaService：

![Cluster creation flow for DorisDisaggregatedCluster](/images/doris-operator/mermaid/12-lifecycle-decoupled-cluster-creation.jpg)

如果依赖组件未就绪，Operator 会持续等待，并在后续 Reconcile 中重试。

## 扩容

扩容通常通过增加组件的 `replicas` 字段完成，例如：

```yaml
spec:
  beSpec:
    replicas: 5
```

Operator 发现变化后，会更新对应组件的 `StatefulSet`。Kubernetes 负责创建新的 Pod，Operator 再继续检查其就绪状态，并更新 CR `status`。

对存算分离集群，ComputeGroup 扩容也是同样的方式：

```yaml
spec:
  computeGroups:
    - uniqueId: adhoc-query
      replicas: 5
```

扩容时需要关注：

- 集群是否有足够的 CPU、内存和存储资源。
- 新 Pod 是否能被成功调度。
- PVC 是否能正常绑定。
- 新节点是否能成功注册到 Doris 集群。

## 缩容

缩容比扩容更敏感，因为它可能影响数据副本、元数据多数派、节点角色和服务容量。

:::caution 注意
生产环境执行缩容前，应先确认 Doris 副本状态、业务流量和回滚方案。
:::

### 存算一体集群

不同组件的缩容风险不同：

| 组件 | 主要关注点 |
| --- | --- |
| FE | Follower 和 Observer 角色可能影响元数据多数派 |
| BE | 需要关注副本迁移和数据可用性 |
| CN | 不持有数据副本，但会影响计算能力和缓存 |
| Broker | 需要确认外部访问任务是否仍依赖该组件 |

对 FE 而言，副本数不能低于选举节点要求。该模式下的缩容应结合 Doris 集群拓扑和 Doris 层风险单独评估。

### 存算分离集群

缩容 ComputeGroup 时，可能需要先执行 Doris 元数据层动作，行为取决于 `enableDecommission`：

| 配置 | 行为 |
| --- | --- |
| `enableDecommission: true` | 缩容前先执行 decommission，并等待安全下线 |
| `enableDecommission: false` | 直接 drop 对应节点 |

![ComputeGroup scale-in flow](/images/doris-operator/mermaid/13-lifecycle-computegroup-scale-in.jpg)

执行缩容前，建议先确认当前数据分布和业务流量。

## 配置变更

Doris 启动配置通常通过 `ConfigMap` 挂载。配置变更后，是否需要重启，取决于配置类型和 Operator 设置。

对存算一体集群：

```yaml
spec:
  enableRestartWhenConfigChange: true
```

启用后，核心 ConfigMap 变更可以触发滚动重启。

变更配置时应重点检查：

- ConfigMap key 是否符合组件要求，例如 `fe.conf`。
- 配置中的目录是否与 PVC 挂载路径一致。
- 端口、FQDN 和认证配置是否与 Kubernetes 网络模型匹配。
- 是否需要组件重启后才能生效。

## 滚动更新

修改组件镜像、部分 Pod 模板字段或配置哈希后，底层 `StatefulSet` 可能触发滚动更新。

建议做法：

- 在业务低峰期执行。
- 先确认集群没有未恢复故障。
- 确认客户端具备重试能力。
- 升级顺序遵循 Doris 版本升级文档。

## 删除集群

删除 Doris 自定义资源后，Operator 会进入清理流程，移除其管理的 Kubernetes 资源。

删除前建议确认：

- PVC 是否需要保留。
- 对象存储、FoundationDB 等外部依赖是否被其他集群共享。
- 是否需要提前备份数据和元数据。
- 是否仍有客户端连接该集群。

:::caution 注意
删除 CR 可能导致对应 Kubernetes 资源被清理。执行前应确认清理范围和备份策略。
:::

## 观察生命周期操作

生命周期操作是否完成，不能只看单一状态，应结合 CR `status`、Kubernetes 资源状态和 Doris 组件状态一起判断。

```shell
kubectl get dcr -n ${namespace}
kubectl describe dcr ${cluster_name} -n ${namespace}
kubectl get ddc -n ${namespace}
kubectl describe ddc ${cluster_name} -n ${namespace}
kubectl get pod,sts,svc,pvc -n ${namespace}
```

如果状态长时间不收敛，再继续查看 Operator 日志和 Kubernetes Event，判断问题是出在调度、存储绑定、配置挂载、节点注册还是 Doris 元数据层。
