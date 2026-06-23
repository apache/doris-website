---
{
    "title": "Doris Operator 总体架构",
    "sidebar_label": "总体架构",
    "language": "zh-CN",
    "description": "介绍 Doris Operator 的控制面、数据面、Reconcile 模型，以及存算一体和存算分离两类集群的控制链路。",
    "keywords": ["Doris Operator 架构", "Kubernetes Operator", "Reconcile", "DorisCluster", "DorisDisaggregatedCluster"]
}
---

Doris Operator 遵循标准的 Kubernetes Operator 设计模式。用户通过 CRD 声明期望状态，Operator 持续观察实际状态，并通过创建、更新或删除 Kubernetes 资源来收敛差异。

本文聚焦整体架构。字段配置和部署步骤请参考对应的安装和配置文档。

## 架构分层

Doris Operator 可以分为控制面和数据面两层。

![Doris Operator architecture layers](/images/doris-operator/mermaid/02-architecture-layers.png)

控制面负责读取 Doris 自定义资源并执行 Reconcile 流程；数据面由实际运行 Doris 组件的 Kubernetes 原生资源组成。

## Reconcile 模型

Reconcile 循环是 Doris Operator 的核心。每当用户创建或修改 Doris 自定义资源，或者相关资源状态变化时，Operator 都会重新计算期望状态与实际状态的差异，并执行必要操作。

典型流程如下：

1. 读取 Doris 自定义资源。
2. 判断资源是否正在删除。
3. 解析组件、存储、认证和访问配置。
4. 创建或更新对应的 `StatefulSet`、`Service`、PVC 等资源。
5. 汇总组件状态并写回 CR `status`。
6. 如果集群尚未就绪，则等待下一轮 Reconcile。

![Doris Operator reconcile model](/images/doris-operator/mermaid/03-architecture-reconcile-model.png)

## 存算一体控制链路

`DorisCluster` 用于存算一体部署。一个资源通常包含 FE、BE、CN、Broker 等组件配置。

![Control path for compute-storage integrated clusters](/images/doris-operator/mermaid/04-architecture-integrated-control-path.png)

在这条链路里，主 Reconciler 负责读取 CR、组织组件执行顺序、清理无效资源并汇总状态；组件控制器负责各自组件的资源创建和状态检查。

## 存算分离控制链路

`DorisDisaggregatedCluster` 用于存算分离部署。一个资源中包含 MetaService、FE 和一个或多个 ComputeGroup。

![Control path for compute-storage decoupled clusters](/images/doris-operator/mermaid/05-architecture-decoupled-control-path.png)

与存算一体相比，这条链路会涉及更多 Doris 元数据层动作。例如缩容 ComputeGroup 时，Operator 可能需要先执行 decommission 或 drop，再更新 Kubernetes 资源。

## Webhook 与校验

Doris Operator 可以选择启用 Webhook，在配置进入 Reconcile 流程之前做默认值填充和基础校验。

常见校验包括：

- FE 副本数与选举相关配置是否兼容。
- 资源字段格式是否满足 CRD 约束。
- 组件配置是否符合 Operator 支持的模型。

是否启用 Webhook 取决于部署方式和环境配置。即使未启用，CRD schema 校验和 Reconcile 状态反馈仍然提供基础约束。

## 状态汇总

Operator 不只负责创建资源，也会把组件状态写回 Doris 自定义资源。你可以通过 `kubectl get` 或 `kubectl describe` 判断组件是否可用、是否在扩缩容、是否等待调度，或者是否存在失败实例。

存算一体集群按 FE、BE、CN、Broker 汇总状态；存算分离集群按 MetaService、FE、ComputeGroup 汇总状态，并额外提供整体健康度。
