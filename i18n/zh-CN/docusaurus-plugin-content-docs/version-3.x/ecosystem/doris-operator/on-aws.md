---
{
    "title": "在 AWS 上的部署建议",
    "language": "zh-CN",
    "description": "EKS 集群中运行的容器是托管在 EC2 实例上的，需要根据 Doris 的要求对 EC2 实例进行系统级配置。在集群创建时，需要用户确认 EKS 模式，自治模式或普通模式。 这里推荐不使用自治模式，因为自治模式的计算资源是通过内置节点池来分配和回收资源，在每一次的资源申请或则释放，"
}
---

## AWS 容器服务 EKS

### 新建集群
EKS 集群中运行的容器是托管在 EC2 实例上的，需要根据 Doris 的要求对 EC2 实例进行系统级配置。在集群创建时，需要用户确认 EKS 模式，自治模式或普通模式。
这里推荐不使用自治模式，因为自治模式的计算资源是通过内置节点池来分配和回收资源，在每一次的资源申请或则释放，都会进行现有资源的重新整合，对于 statefulset 这类有状态服务尤其是启动耗时长和 Doris 这种有严格的分布式协同要求的服务，会造成共享节点池的所有服务动荡，直接现象就是，有可能引起整个 Doris 集群的全部节点漂移（这比重启更恐怖，这个过程不会滚动重启，而是之前稳定运行的服务在节点上时，该节点被强制释放，K8s 调度这些 pod 去新的节点）对生产环境有很大的安全隐患。  
- 如上内容，自治模式适用于无状态的服务运维部署，安装 Doris 集群 推荐非自治模式
- 推荐使用操作系统镜像：Amazon Linux 2

### 已有集群

在已有集群上（非自治模式），可以通过 Doris Operator 运行 Doris 集群，除非该集群被限制使用 K8s 的特权模式。
建议已有集群配置新的节点组来单独进行 Doris 集群资源的部署和维护，涉及到 Doris BE 运行的系统设置，可能会对宿主机的系统参数进行调整。

### 镜像仓库访问  

在 EKS 上如果 需要访问 DockerHub 公共镜像仓库，需要为 集群添加 `Amazon VPC CNI`, `CoreDNS`, `kube-proxy` 等网络插件，并为集群配置 VPC 时，选择可访问公共环境的子网。

### 特权模式说明  

EKS 下，EC2 实例是完全属于当前 EKS 用户的，不存在不同用户集群在资源池中相互影响而禁掉 K8s 特权模式的情况。  

- 若您的 EKS 允许特权模式（默认允许），则无需关心系统参数，Doris Operator 默认会为 Doris 运行调整系统参数。
- 若不允许特权模式，则需要在宿主机上进行如下系统参数调整：  
  - 修改虚拟内存区域数量：`sysctl -w vm.max_map_count=2000000` 调整虚拟内存的最大映射数量。通过 `sysctl vm.max_map_count` 查看。
  - 关闭透明大页：透明大页对性能可能有不利影响，因此需要关闭它。通过 cat /sys/kernel/mm/transparent_hugepage/enabled  是否包含 never 来判断。
  - 设置最大打开文件句柄数：通过修改 `/etc/security/limits.conf` 来调整最大文件句柄数。通过 `ulimit -n` 来查看。
  - 禁用 swap：`swapoff -a` 用于禁用所有 swap 分区和文件。通过 `swapon --show` 验证，未开启则无输出。

### 存储配置  

Doris Operator 在生产环境一定需要用到持久化配置，用来保存节点状态，推荐 [EBS](https://aws.amazon.com/ebs) 存储。

需要有以下注意事项：  

- 在集群配置安装或者管理界面，为其添加 EBS 存储插件，若使用 EKS 自治模式（不推荐），则推荐安装 EFS，并且存储插件需要拥有相应的 [角色权限](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)
- 保证 EKS 节点的 IAM 角色有以下权限：
  - AmazonEC2FullAccess
  - AmazonEKSWorkerNodePolicy
  - AmazonEKS_CNI_Policy
  - AmazonSSMManagedInstanceCore

### 计算资源池配置

- 节点组配置（推荐）  
  可以在集群创建界面创建节点组，也可以在集群初始化完成后进行节点组的添加。通过 EC2 > 启动模版 > 创建启动模板 来设置节点池的节点组启动模板。通过模板 注入脚本来自动化调整 EC2 实例的系统环境配置，确保节点在启动时自动配置所需的系统参数。通过配置节点模板的方式，也可以实现在使用 EKS 自动弹性扩缩容的时候，自动配置新增节点系统参数的能力。  
  示例启动脚本： 

  ```shell
  #!/bin/bash
  chmod +x /etc/rc.d/rc.local
  echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
  echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local
  echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local
  echo "swapoff -a" >> /etc/rc.d/rc.local
  current_limit=$(ulimit -n)
  desired_limit=1000000
  config_file="/etc/security/limits.conf"
  if [ "$current_limit" -ne "$desired_limit" ]; then
    echo "* soft nofile 1000000" >> "$config_file"
    echo "* hard nofile 1000000" >> "$config_file"
  fi
  ```
  另外，创建节点组的时候，若想通过命令行访问，需要配置远程节点访问权限。

- 内置节点池配置（不推荐）  

  开启 EKS 自治模式使用的资源池，在创建节点池时，您可以选择自定义 EC2 实例类型，调整实例的 CPU、内存等资源。在节点池配置时，可以为 EC2 实例添加启动脚本来进行系统参数的调整。但是此类型资源池需要使用自治模式，并且对集群的管理自由度降低。具体修改操作详情参考：[操作系统检查](../../install/preparation/os-checking.md)


