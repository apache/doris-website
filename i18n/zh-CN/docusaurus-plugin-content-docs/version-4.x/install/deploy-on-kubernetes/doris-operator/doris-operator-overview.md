---
{
    "title": "Doris Operator 简介",
    "sidebar_label": "简介",
    "language": "zh-CN",
    "description": "介绍 Doris Operator 的定位、适用场景、能力边界，以及 DorisCluster 和 DorisDisaggregatedCluster 两类资源。",
    "keywords": ["Doris Operator", "Kubernetes", "DorisCluster", "DorisDisaggregatedCluster", "K8s 部署 Doris"]
}
---

Doris Operator 是为满足用户在 Kubernetes 平台上高效部署和运维 Apache Doris 而提供的官方 Kubernetes Operator。它把 Doris 组件间的分布式协同经验与 Kubernetes 原生资源管理能力结合起来，为用户提供更简洁、高效、易用的容器化部署方案。

Doris Operator 基于 Kubernetes CustomResourceDefinitions（CRD）扩展 Kubernetes API。用户提交 Doris 自定义资源后，Operator 会根据资源中描述的期望状态，自动创建并维护对应的 `StatefulSet`、`Service`、`PersistentVolumeClaim` 等 Kubernetes 资源，并在部分场景下完成节点注册、下线和清理等 Doris 元数据层动作。

本文介绍 Doris Operator 的定位、职责和适用场景，帮助你快速建立整体认知。具体安装与部署步骤请参考存算一体和存算分离的部署文档。

## 为什么使用 Doris Operator

在 Kubernetes 上部署 Doris 时，通常需要同时处理多组件编排、服务发现、配置挂载、存储绑定、节点注册、扩缩容和健康检查。随着集群规模和环境复杂度增加，手工维护这些资源会带来配置分散、操作步骤多、状态难追踪等问题。

Doris Operator 将这些操作收敛到统一的 Doris 自定义资源中，让用户以声明式方式描述集群目标状态，主要带来：

- 用一个资源描述集群拓扑。
- 自动创建和维护 `StatefulSet`、`Service`、PVC 等资源。
- 按组件依赖顺序推进创建和变更。
- 将组件状态汇总到 CR `status`。
- 支持配置变更、扩缩容和滚动更新等常见操作。
- 在部分场景下执行 Doris 元数据层的节点注册、下线和清理动作。

## 工作方式

Doris Operator 通过 CRD 扩展 Kubernetes API。用户通过 `kubectl`、Helm 或其他发布工具提交 Doris 集群资源后，Operator 会监听资源变化，并把它转换为 `StatefulSet`、`Service`、`PersistentVolumeClaim` 等 Kubernetes 原生资源。

![How Doris Operator works](/images/doris-operator/mermaid/01-overview-how-doris-operator-works.png)

在这个模型中，用户维护的是期望状态，Operator 持续把实际状态收敛到目标状态。

## 架构形态

Doris Operator 的架构可以分为控制面和数据面。控制面包含 Doris Operator、Reconciler、Webhook 和状态聚合逻辑，负责监听 Doris 自定义资源并推进实际状态向期望状态收敛；数据面包含 `StatefulSet`、`Service`、PVC、HPA 和 Doris Pods 等 Kubernetes 原生资源，负责承载实际运行的 Doris 组件。

![Doris Operator 架构分层](/images/doris-operator/mermaid/02-architecture-layers.png)

用户通过 `kubectl`、Helm 或其他发布工具提交 Doris 自定义资源后，Kubernetes API Server 保存期望状态，Doris Operator 负责监听资源变化并执行 Reconcile，最终创建或更新底层 Kubernetes 资源。这种分层方式降低了用户直接操作大量底层资源的复杂度，也让 Doris 部署更容易与标准 Kubernetes 平台兼容。

## 支持的集群资源

Doris Operator 当前主要支持两类资源：

| 资源 | 部署形态 | 主要组件 | 典型场景 |
| --- | --- | --- | --- |
| `DorisCluster` | 存算一体 | FE、BE、CN、Broker | 标准 Doris 集群部署，运维模型相对简单 |
| `DorisDisaggregatedCluster` | 存算分离 | MetaService、FE、ComputeGroup | 需要弹性计算组、计算资源隔离的场景 |

- `DorisCluster` 用于存算一体部署。一个资源中可以统一描述 FE、BE、CN、Broker 的镜像、副本数、资源、存储、配置和访问方式。
- `DorisDisaggregatedCluster` 用于存算分离部署。它把集群拆分为 MetaService、FE 和一个或多个 ComputeGroup，每个 ComputeGroup 都可以独立配置和运维。

## 管理对象

从用户视角看，Doris Operator 主要管理以下对象：

| 对象 | 说明 |
| --- | --- |
| Doris 自定义资源 | 期望中的集群状态，例如 `DorisCluster`、`DorisDisaggregatedCluster` |
| `StatefulSet` | Doris 组件 Pod 的副本数、稳定网络标识和滚动更新 |
| `Service` | 组件内部通信和外部访问入口 |
| PVC | 有状态组件的持久化存储 |
| `ConfigMap` / `Secret` | 配置、认证信息和外部依赖信息 |
| HPA | 支持组件的自动扩缩容 |
| `status` | 组件状态、可用性和集群健康度 |

## 如何选择部署形态

如果是第一次在 Kubernetes 上部署 Doris，多数场景可以先从存算一体形态开始。只有在明确需要计算资源隔离、弹性 ComputeGroup 或对象存储架构时，再选择存算分离形态。

| 需求 | 推荐选择 |
| --- | --- |
| 快速部署一套标准 Doris 集群 | `DorisCluster` |
| 用更少概念完成初始验证 | `DorisCluster` |
| 不同业务负载使用不同计算资源 | `DorisDisaggregatedCluster` |
| 更灵活地扩缩计算资源 | `DorisDisaggregatedCluster` |
| 已规划使用对象存储和 FoundationDB | `DorisDisaggregatedCluster` |

## 能力边界

Doris Operator 面向 Doris 集群资源和生命周期管理，不替代 Doris 数据库自身的管理能力。

它不直接负责：

- 数据库、表、分区、索引等 SQL 层对象管理。
- 数据导入、导出和工作负载调度策略。
- 用户权限模型设计。
- 所有故障的自动修复。
- 对所有 Kubernetes、存储和网络问题的完全屏蔽。

当集群异常时，仍需要结合 Operator 状态、Kubernetes 资源状态和 Doris 组件日志一起定位。

## 下一步阅读

如果你是第一次接触 Doris Operator，建议按顺序阅读这一组文档；如果你正在排查具体问题，也可以直接跳转到对应页面。

| 目标 | 建议阅读 |
| --- | --- |
| 理解控制面、数据面和 Reconcile 模型 | [Doris Operator 总体架构](./architecture) |
| 理解 Doris 自定义资源与 `StatefulSet`、`Service`、PVC 等资源的映射关系 | [Doris Operator 资源模型](./resource-model) |
| 理解创建、扩缩容、配置变更和删除时的行为 | [Doris Operator 生命周期管理](./lifecycle) |
| 查看状态字段和排障路径 | [Doris Operator 状态与排障](./status-and-troubleshooting) |
