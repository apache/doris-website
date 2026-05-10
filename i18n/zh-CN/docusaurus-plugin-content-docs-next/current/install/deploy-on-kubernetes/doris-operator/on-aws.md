---
title: 在 AWS EKS 上部署 Doris 集群
sidebar_label: AWS EKS 部署建议
language: zh-CN
description: "AWS EKS 部署 Doris 完整指南：集群模式选择（自治 vs 非自治）、系统参数检查与调优、特权模式配置、存储计算资源规划。解决 vm.max_map_count 不足、swap 未禁用、透明大页未关闭、文件句柄数限制等问题。"
---

## AWS 容器服务 EKS 概述

AWS EKS 提供两种运行模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **非自治模式**（推荐） | 标准 EKS 模式，可完全控制底层 EC2 实例 | 生产环境、有状态服务、Doris 集群 |
| **自治模式** | 内置节点池，资源自动弹性扩缩 | 无状态服务、轻量级工作负载 |

:::tip 提示
不推荐使用自治模式。自治模式的计算资源通过内置节点池动态分配和回收，可能导致 Doris 集群节点漂移，对生产环境造成安全隐患。
:::

## 场景一：新建集群

### 步骤 1：创建 EKS 集群（非自治模式）

在 EKS 控制台创建集群时，选择**非自治模式**。

**推荐配置**：
- 操作系统镜像：Amazon Linux 2
- 节点组：使用独立节点组部署 Doris

### 步骤 2：配置节点组启动脚本

通过 EC2 > 启动模板 > 创建启动模板来设置节点池的启动模板。在模板中添加以下脚本，自动化配置系统参数：

```bash
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# 关闭防火墙
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# 设置虚拟内存区域数量
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# 禁用 swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# 设置文件句柄限制
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
  echo "* soft nofile 1000000" >> "$config_file"
  echo "* hard nofile 1000000" >> "$config_file"
fi
```

集群启动后重启节点即可生效。

### 步骤 3：配置 IAM 角色权限

保证 EKS 节点的 IAM 角色有以下权限：

- AmazonEC2FullAccess
- AmazonEKSWorkerNodePolicy
- AmazonEKS_CNI_Policy
- AmazonSSMManagedInstanceCore

### 步骤 4：配置存储

生产环境推荐使用 [EBS](https://aws.amazon.com/ebs) 存储。在集群配置界面添加 EBS 存储插件，并确保插件拥有相应的[角色权限](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)。

---

## 场景二：已有集群

### 步骤 1：检查 swap 状态

```bash
swapon --show
```

**预期结果**：无输出（swap 已禁用）。如有关闭 swap 的输出，需执行 `swapoff -a` 并重启。

### 步骤 2：检查最大文件句柄数

```bash
ulimit -n
```

**预期结果**：不小于 65535。如低于此值，需在 `/etc/security/limits.conf` 中添加：

```bash
* soft nofile 1000000
* hard nofile 1000000
```

### 步骤 3：检查虚拟内存区域数量

```bash
sysctl vm.max_map_count
```

**预期结果**：不小于 262144。如需修改，执行 `sysctl -w vm.max_map_count=2000000`。

### 步骤 4：检查透明大页

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**预期结果**：包含 `[never]`。如为 `[always]`，需执行：

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

---

## 镜像仓库访问

如需访问 DockerHub 公共镜像仓库，需要为集群添加 `Amazon VPC CNI`、`CoreDNS`、`kube-proxy` 等网络插件，并为集群配置 VPC 时选择可访问公共环境的子网。

---

## 特权模式说明

EKS 下，EC2 实例完全属于当前 EKS 用户，不存在不同用户集群在资源池中相互影响的情况。

- **若您的 EKS 允许特权模式**（默认允许）：无需关心系统参数，Doris Operator 默认会为 Doris 运行调整系统参数。
- **若不允许特权模式**：则需要在宿主机上进行以下系统参数调整：

| 参数 | 命令 | 检查方式 |
|------|------|----------|
| 虚拟内存区域数量 | `sysctl -w vm.max_map_count=2000000` | `sysctl vm.max_map_count` |
| 透明大页 | 关闭 | 检查是否包含 `never` |
| 最大文件句柄数 | 修改 `/etc/security/limits.conf` | `ulimit -n` |
| swap | `swapoff -a` | `swapon --show`（无输出则已禁用）|

详细说明请参考：[操作系统检查](../../preparation/os-checking.md)

---

## 常见问题

### Q: 自治模式有哪些风险？

自治模式的计算资源通过内置节点池动态分配和回收，每次资源申请或释放都会进行现有资源的重新整合。对于 StatefulSet 有状态服务尤其是启动耗时长和 Doris 这种有严格分布式协同要求的服务，可能造成共享节点池的所有服务动荡，导致整个 Doris 集群全部节点漂移。

### Q: 已有集群如何配置新的节点组？

建议为 Doris 集群配置独立的节点组。涉及 BE 运行的系统设置时，可能需要调整宿主机的系统参数。创建节点组时可通过 EC2 > 启动模板 > 创建启动模板来设置，并通过模板注入脚本自动化配置 EC2 实例的系统环境。

### Q: EKS 节点需要哪些 IAM 权限？

需要 AmazonEC2FullAccess、AmazonEKSWorkerNodePolicy、AmazonEKS_CNI_Policy 和 AmazonSSMManagedInstanceCore 权限。

### Q: 如何验证系统参数已正确配置？

参考场景二中的检查步骤，逐项验证 swap、文件句柄数、虚拟内存区域数量、透明大页等参数是否满足要求。
