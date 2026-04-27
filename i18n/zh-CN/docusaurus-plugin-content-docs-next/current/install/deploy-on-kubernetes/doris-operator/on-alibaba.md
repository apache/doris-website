---
{
    "title": "阿里云容器服务部署 Doris 集群指南",
    "sidebar_label": "阿里云容器服务部署建议",
    "language": "zh-CN",
    "description": "阿里云 ACK/ACS 部署 Doris 建议指南，包括环境检查、配置调优、镜像仓库配置、常见问题排查。解决 BE 节点无法启动、swap 未禁用、大页内存配置等问题。"
}
---

## 阿里云容器服务概述

阿里云提供两种容器服务：

| 服务 | 说明 | 适用场景 |
|------|------|----------|
| **ACK** (Container Service for Kubernetes) | 购买 ECS 实例后托管的容器化服务，可获得完全访问控制权限 | 需要控制底层 ECS、需特权模式部署 BE 节点 |
| **ACS** (Container Service ACS) | 以 K8s 为界面的云计算服务，按需计费，无需关注底层 ECS | 纯弹性算力、按需付费 |

本文档分别介绍这两种服务上使用 Doris Operator 部署集群的方法。

## ACK 部署

ACK 属于购买 ECS 实例后托管的容器化服务，可获得完全访问控制权限进行系统参数调整。使用 Alibaba Cloud Linux 3 镜像时，当前系统参数完全满足 Doris 运行需求；其他镜像可通过 K8s 特权模式在容器内修正参数。

**使用 ACK + Doris Operator 部署时，大多数 ECS 默认配置即可满足要求，未满足的参数 Operator 会自行修正。**

### 场景一：已有集群

如果容器服务集群已创建，按以下步骤检查并修正参数：

#### 步骤 1：检查 swap 状态

```bash
swapon --show
```

**预期结果**：无输出（swap 已禁用）。如有关闭 swap 的输出，需执行 `swapoff -a` 并重启。

#### 步骤 2：检查最大文件句柄数

```bash
ulimit -n
```

**预期结果**：不小于 65535。如低于此值，需在 `/etc/security/limits.conf` 中添加：

```shell
* soft nofile 1000000
* hard nofile 1000000
```

#### 步骤 3：检查虚拟内存区域数量

```bash
sysctl vm.max_map_count
```

**预期结果**：不小于 262144。如需修改，执行 `sysctl -w vm.max_map_count=2000000`。

#### 步骤 4：检查透明大页

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**预期结果**：包含 `[never]`。如为 `[always]`，需执行：

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

详细说明请参考：[操作系统检查](../../install/preparation/os-checking.md)

### 场景二：新建集群

如需创建新集群，可在阿里云容器服务 ACK 控制台点击”创建集群”。在**节点池配置**步骤的”实例预自定义数据”中添加以下脚本：

```shell
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# 关闭防火墙
echo “sudo systemctl stop firewalld.service” >> /etc/rc.d/rc.local
echo “sudo systemctl disable firewalld.service” >> /etc/rc.d/rc.local

# 设置虚拟内存区域数量
echo “sysctl -w vm.max_map_count=2000000” >> /etc/rc.d/rc.local

# 禁用 swap
echo “swapoff -a” >> /etc/rc.d/rc.local

# 设置文件句柄限制
current_limit=$(ulimit -n)
desired_limit=1000000
config_file=”/etc/security/limits.conf”
if [ “$current_limit” -ne “$desired_limit” ]; then
   echo “* soft nofile 1000000” >> “$config_file”
   echo “* hard nofile 1000000” >> “$config_file”
fi
```

集群启动后重启节点即可生效。

## ACS 部署

ACS 是以 K8s 为界面的云计算服务，提供按需计费的弹性算力。无需关注底层 ECS，但 BE 节点启动需要特权模式来修改系统参数（如 `vm.max_map_count`）。

:::tip 提示
如果当前集群无法使用特权模式，则无法启动 BE 节点。建议选择 ACK + 宿主机的形式部署。
:::

### 步骤 1：配置镜像仓库

ACS 推荐使用配套的阿里云镜像仓库 [Container Registry (ACR)](https://www.alibabacloud.com/en/product/container-registry)，分为个人版和企业版。

将 Doris 官方镜像迁移到阿里云镜像仓库后，如使用私有镜像需创建 secret：

```bash
kubectl create secret docker-registry image-hub-secret \
  --docker-server={your-server} \
  --docker-username={your-username} \
  --docker-password={your-pwd}
```

### 步骤 2：配置 DCR 使用私有镜像

在 DorisCluster CR 中配置 `imagePullSecrets`：

```yaml
spec:
  feSpec:
    replicas: 1
    image: <your-acr-registry>/selectdb-test/doris.fe-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
  beSpec:
    replicas: 3
    image: <your-acr-registry>/selectdb-test/doris.be-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
    systemInitialization:
      initImage: <your-acr-registry>/selectdb-test/alpine:latest
```

### 步骤 3：配置 Service

ACS 不存在常规 Node 概念，Service 限制使用 NodePort 模式。可用以下模式：

#### ClusterIP 模式（默认）

Operator 默认网络模式，参考 [Kubernetes Service 文档](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。

#### 负载均衡模式

**方式一：通过 DCR 配置 annotations**

```yaml
feSpec:
  replicas: 3
  image: <your-image>
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
```

**方式二：通过 ACS 控制台托管**

1. DCR 中 serviceType 设为 ClusterIP（默认）
2. 在 ACS 控制台：容器计算服务 ACS → 集群列表 → 集群 → 服务 → 创建
3. 选择新建的 LB 进行绑定。该 Service 随 Doris Operator 管理，不受 Operator 管控。

---

## 常见问题

### Q: BE 节点无法启动怎么办？

检查以下几点：
1. **特权模式未开启**：ACS 需要特权模式修改 `vm.max_map_count`，如无法开启请使用 ACK
2. **镜像拉取失败**：检查 `imagePullSecrets` 是否正确配置
3. **虚拟内存区域数量不足**：执行 `sysctl vm.max_map_count`，确保不小于 262144

### Q: 集群节点显示为 virtual-kubelet 正常吗？

正常。ACS 使用虚拟节点调度容器，节点名类似 `virtual-kubelet-cn-hongkong-d` 是 ACS 的正常行为。

### Q: 阿里云地域未开启特权模式怎么办？

提交工单申请开启 ACS 特权模式能力加白。

### Q: 如何选择 ACK 还是 ACS？

| 场景 | 推荐 |
|------|------|
| 需要完全控制底层 ECS | ACK |
| 纯弹性按需付费，无需关注底层 | ACS |
| BE 节点需要特权模式 | ACK |


