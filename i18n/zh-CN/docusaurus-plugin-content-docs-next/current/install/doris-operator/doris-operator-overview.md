---
{
    "title": "Doris Operator 简介",
    "language": "zh-CN",
    "description": "Doris Operator 是 Apache Doris 官方提供的 Kubernetes Operator，支持在 K8s 上自动化部署、扩缩容、滚动升级 Doris 集群。本文介绍架构原理、核心能力及部署指引。",
    "keywords": [
        "Doris Operator",
        "Doris Kubernetes",
        "K8s 部署 Doris",
        "Kubernetes Operator",
        "Doris 容器化",
        "K8s Doris 部署"
    ]
}
---

为满足用户在 Kubernetes 平台上对 Doris 的高效部署和运维需求诞生的 [Kubernetes Operator](https://github.com/apache/doris-operator)（简称：Doris Operator），
集成了原生 Kubernetes 资源的复杂管理能力，并融合了 Doris 组件间的分布式协同、用户集群形态的按需定制等经验，为用户提供了一个更简洁、高效、易用的容器化部署方案。
旨在实现 Doris 在 Kubernetes 上的高效管控，帮助用户减少运维管理和学习成本的同时，提供强大的功能和灵活的配置能力。  

Doris Operator 基于 Kubernetes CustomResourceDefinitions（CRD）实现了 Doris 在 Kubernetes 平台的配置、管理和调度。Doris Operator 能够根据用户自定义的期望状态，自动创建 Pods 及其他资源以启动服务。通过自动注册机制，可将所有启动的服务整合成一个完整的 Doris 集群。这一实现显著降低了在 Doris 集群中处理配置信息、节点发现与注册、访问通信及健康检查等生产环境必备操作的复杂性和学习成本。

## Doris Operator 架构形态

![Doris Operator 架构图](/images/next/install/doris-operator.jpg)

Doris Operator 的设计基于二层调度器的原理：

- **第一层调度**：使用原生 StatefulSet 和 Service 管理 Pod，完全兼容标准 Kubernetes 集群
- **第二层调度**：Doris Operator 监听 DorisCluster CRD 资源，将用户定义的集群规格转换为 StatefulSet 及其附属资源

通过 kubectl 下发集群配置后，Doris Operator 自动完成 StatefulSet 创建、Pod 调度、服务注册等操作。

Doris 集群的核心组件包括：

| 组件 | 作用 |
|------|------|
| FE（Frontend） | 负责元数据管理、查询协调 |
| BE（Backend） | 负责数据存储和查询执行 |
| CN（Compute Node） | 负责计算加速（存算分离模式） |
| Broker | 负责访问外部数据源 |

## 关键能力

- **终态部署**：  

  Kubernetes 采用终态运维模式来管理服务，而 Doris Operator 则定义了一种能够描述 Doris 集群的资源类型——DorisCluster。用户可以参考相关文档和使用示例，轻松配置所需的集群。
  用户通过 Kubernetes 的命令行工具 kubectl，可以将配置下发到 Kubernetes 集群中。Doris Operator 会自动构建所需集群，并实时更新集群状态至相应的资源中。这一过程确保了集群的高效管理与监控，极大地简化了运维操作。

- **易扩展**：

  Doris Operator 在基于云盘的环境中支持并发实时横向扩容。Doris 的所有组件服务均通过 Kubernetes 的 StatefulSet 进行部署和管理。在部署或扩容时，采用 StatefulSet 的 Parallel 模式创建 Pods，这样理论上可以在启动一个节点的时间内启动所有副本。每个副本的启动互不干扰，当某个服务启动失败时，其他服务的启动不会受到影响。
  Doris Operator 采用并发模式启动服务，并内置分布式架构，极大简化了服务扩展的过程。用户只需设置副本数量，即可轻松完成扩容，彻底解放了运维操作的复杂性。

- **无感变更**：  

  在分布式环境中，服务重启可能会引发服务的暂时不稳定。尤其对于数据库这类对稳定性要求极高的服务而言，如何在重启过程中保证服务的稳定性是一个非常重要的课题。Doris 在 Kubernetes 上通过以下三种机制确保服务重启过程中的稳定性，从而实现业务在重启和升级过程中无感知的体验。  

  1. 优雅退出
  2. 滚动重启
  3. 主动停止查询分配

- **宿主机系统配置**：  

  在某些场景中，需要配置宿主机系统参数来达到 Apache Doris 的理想性能。而在容器化场景下，宿主机的部署不确定和参数修改难度高给用户带来挑战。为解决该问题，Doris Operator 通过利用 Kubernetes 的初始化容器，实现了宿主机参数的可配置化。
  Doris Operator 允许用户配置在宿主机上执行的命令，并通过初始化容器使其生效。为了提升可用性，Doris Operator 抽象了 Kubernetes 初始化容器的配置方式，使宿主机命令的设置更加简单直观。

- **持久化配置**：  

  Doris Operator 采用 Kubernetes StorageClass 模式为各个服务提供存储配置。它允许用户自定义挂载目录，在自定义启动配置时，如果修改了存储目录，可以在自定义资源中将该目录设置为持久化位置，从而使服务使用容器内指定的目录来存储数据。

- **运行时调试**：  

  容器化服务对于 Trouble Shooting 来说最大挑战之一是如何在运行时进行调试。Doris Operator 在追求可用性和易用性的同时，也为问题定位提供了更便利的条件。在 Doris 的基础镜像中，预置了多种用于问题定位的工具。当需要实时查看状态时，可以通过 kubectl 提供的 exec 命令进入容器，使用内置工具进行故障排查。
  当服务因未知原因无法启动时，Doris Operator 提供了 Debug 运行模式。当一个 Pod 被设置为 Debug 启动模式时，容器将自动进入运行状态。这时可通过 `exec` 命令进入容器，手动启动服务并进行问题定位。详细请参考 [此文档](../../install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation#服务-crash-情况下如何进入容器)

## 兼容性  

Doris Operator 开发按照标准的 K8s 规范进行，兼容所有标准 K8s 平台，包含主流云厂商提供的和基于标准自建的 K8s 平台和用户自建平台。

### 云厂商兼容性

在主流云厂商的容器化服务平台上，完全兼容。使用 Doris Operator 环境准备及使用建议，可参考以下文档：

- [阿里云](./on-alibaba)

- [AWS](./on-aws)

## 适用场景

Doris Operator 适用于以下场景：

- 需要在 Kubernetes 上快速部署和管理 Doris 集群
- 有弹性扩缩容需求，需要根据业务负载动态调整节点数量
- 需要统一管理多套 Doris 环境的开发和运维团队
- 希望降低 Doris 集群运维复杂度的用户

## 安装及使用

### 前提条件

部署前需要对宿主机系统进行检查参考 [操作系统检查](../../install/preparation/os-checking.md)

### 部署 Doris Operator

详细安装文档可参考 Doris Operator 安装的 [存算一体版本](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator.md) 或 [存算分离版本](../../install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md)

## 常见问题

**Q: Doris Operator 和手动在 Kubernetes 上部署 Doris 有什么区别？**

A: Doris Operator 通过 CRD 自动化管理集群生命周期，包括创建、扩缩容、升级、故障恢复等，无需手动执行 kubectl 命令操作每个 Pod。

**Q: 存算一体和存算分离版本如何选择？**

A: 存算一体版本适用于中小规模集群，部署简单；存算分离版本适用于大规模、弹性扩展需求场景。具体可参考 [存算一体部署文档](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator.md) 和 [存算分离部署文档](../../install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md)。

**Q: Doris Operator 支持哪些 Kubernetes 版本？**

A: 兼容 Kubernetes 1.19 及以上版本，包括阿里云 ACK、AWS EKS、公有云私有化部署等标准 K8s 平台。

