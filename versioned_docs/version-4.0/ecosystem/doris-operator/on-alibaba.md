---
{
  "title": "Recommendations on Alibaba Cloud",
  "language": "en"
}
---

## Alibaba ACK  

Alibaba Cloud Container Service ACK is a managed containerized service after purchasing an ECS instance, so you can obtain full access control permissions to adjust related system parameters. Use the instance image: Alibaba Cloud Linux 3. The current system parameters fully meet the requirements for running Doris. Those that do not meet the requirements can also be corrected in the container through the K8s privileged mode to ensure stable operation.  
**Alibaba Cloud ACK cluster, deployed using Doris Operator, most environmental requirements can be met by the ECS default configuration. If not met, Doris Operator can correct it by itself**. Users can also manually correct it, as follows:

### Already exists cluster

If the Container Service cluster has already been created, you can modify it by referring to this document: [Cluster Environment OS Checking](../../install/preparation/os-checking.md)      
Focus on the BE startup parameter requirements:  
1. Disable and close swap: `swapon --show` will not be output if it is not enabled
2. Check the maximum number of open file handles in the system `ulimit -n`
3. Check and modify the number of virtual memory areas `sysctl vm.max_map_count`
4. Whether transparent huge pages are closed `cat /sys/kernel/mm/transparent_hugepage/enabled` contains never  
   The default values of the corresponding parameters are as follows:  

  ```shell
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# swapon --show
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# ulimit -n
  65535
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# sysctl vm.max_map_count
  vm.max_map_count = 262144
  [root@iZj6c12a1czxk5oer9rbp8Z ~]# cat /sys/kernel/mm/transparent_hugepage/enabled
  [always] madvise never
  ```  

### Create a new cluster  

If the cluster has not been purchased and created, you can click "Create Cluster" in the Alibaba Cloud Container Service ACK console to purchase it. You can adjust the configuration as needed. The above parameters can be added to the system adjustment script in "Instance Pre-customized Data" in the "Node Pool Configuration" step of creating a cluster.
After the cluster is started, restart the node to complete the configuration. The reference script is as follows:  

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

## Alibaba ACS

The ACS service is a cloud computing service that uses K8s as the user interface to provide container computing resources, providing elastic computing resources that are billed on demand. Unlike the above ACK, you do not need to pay attention to the specific use of ECS.
The following points should be noted when using ACS:

### Image repository

When using ACS, it is recommended to use the supporting Alibaba  [Container Registry](https://www.alibabacloud.com/en/product/container-registry)(ACR). The personal and enterprise versions are enabled on demand.

After configuring the ACR and image transfer environment, you need to migrate the official image provided by Doris to the corresponding ACR.

If you use a private ACR to enable authentication, you can refer to the following steps:

1. You need to set a `secret` of type `docker-registry` in advance to configure the authentication information for accessing the image warehouse.  

  ```shell
  kubectl create secret docker-registry image-hub-secret --docker-server={your-server} --docker-username={your-username} --docker-password={your-pwd}
  ```

2. Configure the secret using the above steps on DCR:  

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

Currently, Alibaba Cloud is gradually pushing the ability to enable privileged mode on fully managed ACS services (some regions may not be enabled yet, you can submit a work order to apply for the ability to be enabled).  
The Doris BE node startup requires some special environment parameters, such as Modify the number of virtual memory areas `sysctl -w vm.max_map_count=2000000`  
Setting this parameter inside the container requires modifying the host configuration, so regular K8s clusters need to enable privileged mode in the pod. Operator adds `InitContainer` to the BE pod through `systemInitialization` to perform such operations.

:::tip Tip  
**If the current cluster cannot use privileged mode, the BE node cannot be started**. You can choose ACK container service + host to deploy the cluster.
:::

### Service

Since the ACS service is a cloud computing service that uses K8s as the user interface to provide container computing resources, it provides computing resources. Its nodes are virtual computing resources, and users do not need to pay attention to them. They are charged according to the amount of resources used, and can be expanded infinitely. That is, there is no physical concept of conventional nodes:

```shell  
$ kubectl get nodes
NAME                            STATUS   ROLES   AGE   VERSION
virtual-kubelet-cn-hongkong-d   Ready    agent   27h   v1.31.1-aliyun.1
```

Therefore, when deploying the Doris cluster, serviceType disables the NodePort mode and allows the use of ClusterIP and LB modes.  

- ClusterIP mode:  

  ClusterIP modethe default network mode of Operator. For specific usage and access methods, please refer to [this document](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)  

- Load balancing mode:  

  can be configured as follows:

  - Configure LB access through the DCR service annotations provided by Operator. The steps are as follows:
    1. A CLB or NLB instance has been created through the load balancing console, and the instance is in the same region as the ACK cluster. If you haven't created one yet, see [Create and manage a CLB instance](https://www.alibabacloud.com/help/en/slb/classic-load-balancer/user-guide/create-and-manage-a-clb-instance) and [Create and manage an NLB instance](https://www.alibabacloud.com/help/en/slb/network-load-balancer/user-guide/create-and-manage-an-nlb-instance)。
    2. Through DCR configuration, the access annotations of the above LB are in the following format:
      ```yaml
        feSpec:
          replicas: 3
          image: crpi-4q6quaxa0ta96k7h-vpc.cn-hongkong.personal.cr.aliyuncs.com/selectdb-test/doris.fe-ubuntu:3.0.3
          service:
            type: LoadBalancer
            annotations:
              service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
      ```  

  - Host the LB service through the ACS console and generate a statefulset service bound to the corresponding resource control of FE or BE  
    The steps are as follows:
    1. serviceType is ClusterIP (default policy)
    2. You can create a load balancing service through the Alibaba Cloud console interface: Container Compute Service ACS -> Cluster List -> Cluster -> Service, and use the `Create` button.
    3. Select the newly created LB in the interface for creating `service`, which will be bound to `service` and will also be deregistered when the `service` is deregistered. However, this `service` is not controlled by Doris Operator.

