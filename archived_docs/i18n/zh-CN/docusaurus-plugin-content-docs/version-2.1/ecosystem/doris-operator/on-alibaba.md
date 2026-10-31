---
{
    "title": "在阿里云上的部署建议",
    "language": "zh-CN",
    "description": "阿里云容器服务 ACK 属于 购买 ECS 实例后，托管容器化服务的，因此可以获得完全访问控制权限来进行相关系统参数调整，使用实例镜像：Alibaba Cloud Linux 3 当前系统参数完全满足运行 Doris 需求。不符合要求的也能够通过 K8s 特权模式在容器内进行修正，以保证稳定运行。"
}
---

## 阿里云容器服务 ACK  

阿里云容器服务 ACK 属于 购买 ECS 实例后，托管容器化服务的，因此可以获得完全访问控制权限来进行相关系统参数调整，使用实例镜像：Alibaba Cloud Linux 3 当前系统参数完全满足运行 Doris 需求。不符合要求的也能够通过 K8s 特权模式在容器内进行修正，以保证稳定运行。  
**阿里云 ACK 集群，使用 Doris Operator 部署，大部分环境要求，ECS 默认配置即可满足，未满足的，Doris Operator 可自行修正**。用户亦可手动修正，如下：

### 已存在集群

若容器服务集群已经创建，则可以参考此文档进行修改：[操作系统检查](../../install/preparation/os-checking.md)  
重点关注 BE 启动参数要求：  
1. 禁用和关闭 swap： `swapon --show`  未开启则无输出
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

若集群未购买和创建，则可以在阿里云 容器服务 ACK 控制台 点击“创建集群”购买，可以按需调整配置，上述参数可以在 创建集群的“节点池配置”步骤中在“实例预自定义数据”添加系统调整脚本。
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
需要注意使用 ACS 的事项如下：

### 镜像仓库访问

使用 ACS 推荐使用配套的阿里云镜像 [Container Registry](https://www.alibabacloud.com/en/product/container-registry)(ACR) 个人版和企业版按需开启。  
在配置好镜像仓库和镜像中转的环境后，需要把 Doris 提供的官方镜像迁移到对应的阿里云镜像仓库中。

若使用私有镜像仓库开启了鉴权，可以参考以下步骤：  

1. 需要提前设置类型为 `docker-registry` 的 `secret` 用以配置访问镜像仓库的身份认证信息。 

  ```shell
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

由于 ACS 服务是以 K8s 为使用界面供给容器算力资源的云计算服务，提供算力资源。其 node 是虚拟计算资源，用户无需关注，按使用资源量收费，可以无限拓展，即，不存在常规的 node 这个物理概念： 

```shell
$ kubectl get nodes
NAME                            STATUS   ROLES   AGE   VERSION
virtual-kubelet-cn-hongkong-d   Ready    agent   27h   v1.31.1-aliyun.1
```

因此，部署 Doris 集群时 serviceType 禁用 NodePort 模式，允许使用 ClusterIP 和 LB 模式。  
- ClusterIP 模式：  

  Operator 默认的网络模式，具体使用和访问方式可参考[此文档](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)

- 负载均衡模式：  

  使用时可以通过如下方式来配置（注意事项：https://help.aliyun.com/zh/ack/ack-managed-and-ack-dedicated/user-guide/considerations-for-configuring-a-loadbalancer-type-service-1）：

  - 通过 Operator 提供的 DCR 的 service annotations 来配置 LB 接入，步骤如下：
    1. 已通过负载均衡控制台创建 CLB 或 NLB 实例，且该实例与 ACK 集群处于同一地域。如果尚未创建，请参见[创建和管理 CLB 实例](https://help.aliyun.com/zh/slb/classic-load-balancer/user-guide/create-and-manage-a-clb-instance#task-ctx-xsm-vdb)和[创建和管理 NLB 实例](https://help.aliyun.com/zh/slb/network-load-balancer/user-guide/create-and-manage-an-nlb-instance)。
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
    3. 在创建 `服务` 的界面 选择新建的 LB，会和 `service` 绑定，也会随着 该 `service` 的注销而注销。但是此 `service` 不受 Doris Operator 管控。


