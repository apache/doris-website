---
{
"title": "在云平台部署",
"language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Doris-operator 开发按照标准的 K8s 规范进行，兼容所有标准 K8s 平台，包含主流云厂商提供的和基于标准自建的 K8s 平台。本文主要提供在主流云厂商的容器化服务平台上，Doris-operator 使用的注意事项和一些使用建议。后续会更新更多云厂商及其产品的文档。

## 阿里云容器服务 ACK

阿里云容器服务 ACK 属于 购买 ECS 实例后，托管容器化服务的，因此可以获得完全访问控制权限来进行相关系统参数调整，使用实例镜像：Alibaba Cloud Linux 3 当前系统参数完全满足运行 Doris 需求。不符合要求的也能够通过 K8s 特权模式在容器内进行修正，以保证稳定运行。  
**阿里云ACK集群，使用 doris-operator 部署，大部分环境要求，ECS默认配置即可满足，未满足的，doris-operator 可自行修正**。 用户亦可手动修正， 如下:  

### 已存在集群  

若容器服务集群已经创建，则可以参考此文档进行修改：[操作系统检查](../../preparation/os-checking)
重点关注 BE 启动参数要求：  
1. 禁用和关闭 swap ： `swapon --show`  未开启则无输出
2. 查看系统最大打开文件句柄数 `ulimit -n`
3. 查看修改虚拟内存区域数量  `sysctl vm.max_map_count`
4. 透明大页是否关闭  `cat /sys/kernel/mm/transparent_hugepage/enabled`  是否包含 never
对应参数的默认值如下：  
 ```shell
[root@iZj6c12a1czxk5oer9rbp8Z ~]# swapon --show
[root@iZj6c12a1czxk5oer9rbp8Z ~]# ulimit -n
65535
[root@iZj6c12a1czxk5oer9rbp8Z ~]# sysctl vm.max_map_count
vm.max_map_count = 262144
[root@iZj6c12a1czxk5oer9rbp8Z ~]# cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
```  

### 新建集群  
若集群未购买和创建，则可以在阿里云 容器服务 ACK 控制台 点击 “创建集群” 购买，可以按需调整配置，上述参数可以在 创建集群的 “节点池配置” 步骤中在 “实例预自定义数据” 添加系统调整脚本。
在集群启动后，重启节点即可实现配置完成。参考脚本如下：  
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

## 阿里云容器服务 ACS

ACS 服务是以 K8s 为使用界面供给容器算力资源的云计算服务，提供按需计费的弹性算力资源。和上述 ACK 不同的是不需要关注具体使用 ECS。
需要注意使用ACS的事项如下：

### 镜像仓库访问  

使用 ACS 推荐使用配套的阿里云镜像[仓库服务]( https://cr.console.aliyun.com/cn-hongkong/instances) 个人版和企业版按需开启

在配置好镜像仓库和镜像中转的环境后，需要把 Doris 提供的官方镜像迁移到对应的阿里云镜像仓库中。  

若使用私有镜像仓库开启了鉴权，可以参考以下步骤：  
1. 需要提前设置类型为 `docker-registry` 的 `secret` 用以配置访问镜像仓库的身份认证信息。
```
kubectl create secret docker-registry image-hub-secret --docker-server={your-server} --docker-username={your-username} --docker-password={your-pwd}
```
2. 在 DCR 上配置使用上述步骤的 secret：
```yaml
spec:
  feSpec:
    replicas: 1
    image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.fe-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
  beSpec:
    replicas: 3
    image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.be-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
    systemInitialization:
      initImage: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/alpine:latest
```

### Be systemInitialization  

目前阿里云逐步推送 在完全托管的 ACS 服务上 提供开启特权模式 的能力（部分地域可能暂未开启，可提交工单申请开启能力加白）。  
Doris BE 节点启动需要依赖一些特殊环境参数 比如，修改虚拟内存区域数量 `sysctl -w vm.max_map_count=2000000`  
在容器内部设置此参数需要 修改宿主机配置，因此常规的 K8s 集群需要在 pod 内开启特权模式。Operator 通过 `systemInitialization` 为 BE pod 添加 `InitContainer` 来执行此类操作。  

:::tip 提示  
**如果当前集群无法使用特权模式，则无法启动 BE 节点**。可以选择 ACK 容器服务 + 宿主机的形式来部署集群。
:::

### Service 限制  

由于 ACS 服务是以 K8s 为使用界面供给容器算力资源的云计算服务，提供算力资源。其 node 是虚拟计算资源，用户无需关注，按使用资源量收费，可以无限拓展，即，不存在常规的 node 这个物理概念:
```shell
$ kubectl get nodes
NAME                            STATUS   ROLES   AGE   VERSION
virtual-kubelet-cn-hongkong-d   Ready    agent   27h   v1.31.1-aliyun.1
```
因此 ，部署 Doris 集群时 serviceType 禁用 NodePort 模式，允许使用 ClusterIP 和 LB 模式。
ClusterIP模式，是 Operator 默认的网络模式，具体使用和访问方式可参考[此文档](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)
负载均衡模式，使用时可以通过如下方式来配置（注意事项：https://help.aliyun.com/zh/ack/ack-managed-and-ack-dedicated/user-guide/considerations-for-configuring-a-loadbalancer-type-service-1）：
- 通过 Operator 提供的 DCR 的 service annotations 来配置 LB 接入，步骤如下：  
  1. 已通过负载均衡控制台创建 CLB 或 NLB 实例，且该实例与 ACK 集群处于同一地域。如果尚未创建，请参见[创建和管理CLB实例](https://help.aliyun.com/zh/slb/classic-load-balancer/user-guide/create-and-manage-a-clb-instance#task-ctx-xsm-vdb)和[创建和管理NLB实例](https://help.aliyun.com/zh/slb/network-load-balancer/user-guide/create-and-manage-an-nlb-instance)。
  2. 通过 DCR 配置，上述 LB 的访问 annotations，参考格式如下：
    ```yaml
      feSpec:
        replicas: 3
        image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.fe-ubuntu:3.0.3
        service:
          type: LoadBalancer
          annotations:
            service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
    ```  

- 通过 ACS 控制台托管 LB 服务，生成绑定 FE 或 BE 对应资源管控的 statefulset 的 service
步骤如下：
  1. serviceType 为 ClusterIP（默认策略）
  2. 可以通过阿里云控制台界面：容器计算服务 ACS -> 集群列表 -> 集群 -> 服务，通过 `创建` 按钮创建负载均衡服务。
  3. 在创建 `服务` 的界面 选择新建的 LB ，会和 `service` 绑定，也会随着 该 `service` 的注销而注销。但是此 `service` 不受 Doris-operator 管控。

## AWS 容器服务EKS

### 新建集群
EKS 集群中运行的容器是托管在 EC2 实例上的, 需要根据 Doris 的要求对 EC2 实例进行系统级配置。在集群创建时，需要用户确认 EKS 模式，自治模式或普通模式。
这里推荐不使用自治模式，因为自治模式的计算资源是通过内置节点池来分配和回收资源，在每一次的资源申请或则释放，都会进行现有资源的重新整合，对于 statefulset 这类有状态服务尤其是启动耗时长和 Doris 这种有严格的分布式协同要求的服务，会造成共享节点池的所有服务动荡，直接现象就是，有可能引起整个 Doris 集群的全部节点漂移（这比重启更恐怖，这个过程不会滚动重启，而是之前稳定运行的服务在节点上时，该节点被强制释放，K8s 调度这些 pod 去新的节点）对生产环境有很大的安全隐患。
- 如上内容，自治模式适用于无状态的服务运维部署，安装Doris集群 推荐非自治模式
- 推荐使用操作系统镜像：Amazon Linux 2

### 已有集群

在已有集群上（非自治模式），可以通过 Doris-operator 运行 Doris 集群，除非该集群被限制使用 K8s 的特权模式。
建议已有集群配置新的节点组来单独进行 Doris 集群资源的部署和维护，涉及到 Doris BE 运行的系统设置，可能会对宿主机的系统参数进行调整。

### 镜像仓库访问  

在 EKS 上如果 需要访问 DockerHub 公共镜像仓库，需要为 集群添加 `Amazon VPC CNI`, `CoreDNS`, `kube-proxy` 等网络插件，并为集群配置 VPC 时，选择可访问公共环境的子网。

### 特权模式说明  

EKS 下，EC2 实例是完全属于当前 EKS 用户的，不存在不同用户集群在资源池中相互影响而禁掉 K8s 特权模式的情况。

- 若您的 EKS 允许特权模式（默认允许），则无需关心系统参数， Doris-operator 默认会为 Doris 运行调整系统参数。
- 若不允许特权模式，则需要在宿主机上进行如下系统参数调整：
  - 修改虚拟内存区域数量：`sysctl -w vm.max_map_count=2000000` 调整虚拟内存的最大映射数量。通过 `sysctl vm.max_map_count` 查看。
  - 关闭透明大页：透明大页对性能可能有不利影响，因此需要关闭它。通过 cat /sys/kernel/mm/transparent_hugepage/enabled  是否包含 never 来判断。
  - 设置最大打开文件句柄数：通过修改 `/etc/security/limits.conf` 来调整最大文件句柄数。通过 `ulimit -n` 来查看。
  - 禁用 swap：`swapoff -a` 用于禁用所有 swap 分区和文件。通过 `swapon --show` 验证， 未开启则无输出。

### 存储配置    
Doris-operator 在生产环境一定需要用到持久化配置，用来保存节点状态，推荐 [EBS](https://aws.amazon.com/ebs) 存储。

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
  开启 EKS 自治模式使用的资源池，在创建节点池时，您可以选择自定义 EC2 实例类型，调整实例的 CPU、内存等资源。在节点池配置时，可以为 EC2 实例添加启动脚本来进行系统参数的调整。但是此类型资源池需要使用自治模式，并且对集群的管理自由度降低。具体修改操作详情参考：[操作系统检查](../../preparation/os-checking)


