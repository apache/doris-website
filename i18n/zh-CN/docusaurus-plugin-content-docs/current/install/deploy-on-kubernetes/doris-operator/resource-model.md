---
{
    "title": "Doris Operator 资源模型",
    "sidebar_label": "资源模型",
    "language": "zh-CN",
    "description": "介绍 DorisCluster 与 DorisDisaggregatedCluster 的资源模型，以及 Doris 组件与 StatefulSet、Service、PVC、ConfigMap、Secret 和 HPA 的映射关系。",
    "keywords": ["Doris Operator 资源模型", "DorisCluster", "DorisDisaggregatedCluster", "StatefulSet", "Service", "PVC"]
}
---

Doris Operator 的资源模型描述了 Doris 集群组件与 Kubernetes 原生资源之间的映射关系。理解这层映射后，更容易判断某个字段会影响哪些底层资源，也更容易定位部署和运维问题。

本文不展开所有字段。字段级配置请参考对应的部署和配置文档。

## 最小示例

下面示例展示了一个最小化的 `DorisCluster`。其中 FE 和 BE 会映射为对应的 `StatefulSet`、`Service`、PVC 等资源。

```yaml
apiVersion: doris.apache.com/v1
kind: DorisCluster
metadata:
  name: demo
  namespace: doris
spec:
  feSpec:
    replicas: 3
    image: apache/doris:fe-2.1.8
  beSpec:
    replicas: 3
    image: apache/doris:be-2.1.8
```

## 概览

无论使用哪种部署形态，用户直接维护的都是 Doris 自定义资源。Operator 根据自定义资源创建 Kubernetes 原生资源，再由这些资源运行 Doris 组件。

![Doris Operator resource model overview](/images/doris-operator/mermaid/06-resource-model-overview.jpg)

## DorisCluster

`DorisCluster` 用于存算一体部署，通常包含 FE、BE、CN、Broker 四类组件。

![DorisCluster resource model](/images/doris-operator/mermaid/07-resource-model-doriscluster.jpg)

| 组件 | 说明 | 主要 Kubernetes 资源 |
| --- | --- | --- |
| FE | 负责元数据管理、SQL 接入和查询协调 | `StatefulSet`、internal Service、external Service、PVC |
| BE | 负责数据存储和执行 | `StatefulSet`、internal Service、external Service、PVC |
| CN | 承载弹性计算任务 | `StatefulSet`、internal Service、external Service、PVC、HPA |
| Broker | 外部存储访问代理；是否需要部署取决于 Doris 版本和业务场景 | `StatefulSet`、internal Service |

## DorisDisaggregatedCluster

`DorisDisaggregatedCluster` 用于存算分离部署，通常包含 MetaService、FE 和一个或多个 ComputeGroup。

![DorisDisaggregatedCluster resource model](/images/doris-operator/mermaid/08-resource-model-disaggregatedcluster.jpg)

| 组件 | 说明 | 主要 Kubernetes 资源 |
| --- | --- | --- |
| MetaService | 存算分离集群的元数据服务 | `StatefulSet`、Service、PVC |
| FE | SQL 接入、查询协调和元数据访问入口 | `StatefulSet`、internal Service、external Service、PVC |
| ComputeGroup | 独立的计算资源组 | `StatefulSet`、internal Service、external Service、PVC |
| FoundationDB | 存算分离集群依赖的元数据存储 | 外部服务或由 `fdb-kubernetes-operator` 管理 |

## Service 类型

Doris Operator 会为不同用途创建不同的 Service。

| Service 类型 | 作用 | 典型用途 |
| --- | --- | --- |
| internal Service | 稳定网络标识和组件内部通信 | StatefulSet DNS、组件发现、Pod 间访问 |
| external Service | 对外访问入口 | 客户端连接和外部系统访问 |

internal Service 通常不是业务访问入口。external Service 会根据场景配置为 `ClusterIP`、`NodePort` 或 `LoadBalancer`。

## 存储

Doris 是有状态系统。FE、BE、CN、MetaService 和 ComputeGroup 都可能需要持久化目录。Operator 通过 PVC 模板绑定持久化存储。

需要重点关注：

- Kubernetes 集群中是否有可用的 StorageClass。
- PVC 容量是否满足数据和日志增长需求。
- 访问模式是否符合场景要求。
- Doris 配置中的目录是否与 PVC 挂载路径一致。

如果 PVC 无法绑定，Operator 会持续等待，对应 Pod 也无法启动。

## 配置与认证资源

Doris Operator 支持通过 `ConfigMap` 和 `Secret` 管理配置和敏感信息。

| 资源 | 常见用途 |
| --- | --- |
| `ConfigMap` | FE、BE、CN、Broker、MetaService、ComputeGroup 的启动配置 |
| `Secret` | 密码、访问凭证和 keytab 等敏感信息 |
| `authSecret` | Doris Operator 用于节点注册、下线等管理动作的凭证 |
| `kerberosInfo` | Kerberos 配置和 keytab 挂载 |
| `serviceAccount` | 组件访问云服务或外部系统时使用的 Kubernetes ServiceAccount |

配置变更是否触发重启，取决于具体字段和 Operator 设置。例如存算一体模式下，`enableRestartWhenConfigChange` 可以控制核心 ConfigMap 变更时是否触发滚动重启。

## 资源命名

Operator 创建的资源通常以前缀形式包含集群名和组件名，便于快速判断资源归属。

如果存算一体集群名为 `demo`，常见资源名如下：

```text
demo-fe
demo-fe-internal
demo-fe-service
demo-be
demo-be-internal
demo-be-service
demo-cn
demo-cn-internal
demo-cn-service
demo-broker
demo-broker-internal
```

如果存算分离集群名为 `demo`，且 ComputeGroup 名为 `adhoc-query`，常见资源名如下：

```text
demo-ms
demo-fe
demo-fe-internal
demo-adhoc-query
demo-adhoc-query-external
```

实际名称会随版本和配置略有差异。排障时应以 `kubectl get` 的结果为准。

## 组件依赖关系

资源模型不仅描述静态映射，也隐含组件依赖关系。

在存算一体集群中，FE 是其他组件注册和访问 Doris 元数据的入口：

![Dependencies between components in DorisCluster](/images/doris-operator/mermaid/09-resource-model-integrated-dependencies.jpg)

在存算分离集群中，MetaService 先就绪，FE 依赖 MetaService，ComputeGroup 再依赖 FE：

![Dependencies between components in DorisDisaggregatedCluster](/images/doris-operator/mermaid/10-resource-model-decoupled-dependencies.jpg)

当上游组件未就绪时，下游组件可能持续等待或反复 Reconcile，这属于正常行为。更详细的创建和变更顺序见 [Doris Operator 生命周期管理](./lifecycle)。
