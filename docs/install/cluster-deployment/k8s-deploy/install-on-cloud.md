---
{
"title": "Deploy on cloud platform",
"language": "en"
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

Doris Operator is developed in accordance with standard K8s specifications and is compatible with all standard K8s platforms, including those provided by mainstream cloud vendors and self-built based on standards. This article mainly provides precautions and some usage suggestions for Doris Operator on the containerized service platforms of mainstream cloud vendors. More documents for cloud vendors and their products will be updated later.  

## Alibaba ACK

Alibaba Cloud Container Service ACK is a managed containerized service after purchasing an ECS instance, so you can obtain full access control permissions to adjust related system parameters. Use the instance image: Alibaba Cloud Linux 3. The current system parameters fully meet the requirements for running Doris. Those that do not meet the requirements can also be corrected in the container through the K8s privileged mode to ensure stable operation.  
**Alibaba Cloud ACK cluster, deployed using Doris Operator, most environmental requirements can be met by the ECS default configuration. If not met, Doris Operator can correct it by itself**. Users can also manually correct it, as follows:

### Already exists cluster  

If the Container Service cluster has already been created, you can modify it by referring to this document: [Cluster Environment OS Checking](../../preparation/os-checking)  
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
ClusterIP mode is the default network mode of Operator. For specific usage and access methods, please refer to [this document](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)
Load balancing mode can be configured as follows:
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

## AWS EKS

### Create a new cluster
The containers running in the EKS cluster are hosted on EC2 instances, and the EC2 instances need to be configured at the system level according to the requirements of Doris. When creating a cluster, the user needs to confirm the EKS mode, auto mode or non-auto mode.
It is recommended not to use the autonomous mode here, because the computing resources in the autonomous mode are allocated and recycled through the built-in node pool. At each resource application or release, the existing resources will be reintegrated. For stateful services such as statefulset, especially those that take a long time to start and services with strict distributed collaboration requirements such as Doris, it will cause turbulence in all services in the shared node pool. The direct phenomenon is that it may cause all nodes in the entire Doris cluster to drift (this is more terrifying than restarting. This process will not be a rolling restart, but when the previously stable service is on the node, the node is forced to be released, and K8s schedules these pods to the new node) There are great security risks to the production environment.
- As mentioned above, the autonomous mode is suitable for stateless service operation and maintenance deployment. The non-autonomous mode is recommended for installing the Doris cluster
- Recommended operating system image: Amazon Linux 2

### Already exists cluster  

On an existing cluster (non-auto mode), you can run the Doris cluster through Doris Operator, unless the cluster is restricted to use the privileged mode of K8s.
It is recommended that the existing cluster configure a new node group to deploy and maintain Doris cluster resources separately, which involves the system settings for Doris BE operation and may adjust the system parameters of the host machine.

### assess DockerHub  

If you need to access the DockerHub public image repository on EKS, you need to add network plug-ins such as `Amazon VPC CNI`, `CoreDNS`, `kube-proxy` to the cluster, and when configuring VPC for the cluster, select a subnet that can access the public environment.

### K8s Privileged 

Under EKS, EC2 instances completely belong to the current EKS user, and there is no situation where different user clusters affect each other in the resource pool and disable the K8s privileged mode.

- If your EKS allows privileged mode (allowed by default), you don't need to care about system parameters. Doris Operator will adjust system parameters for Doris operation by default.
- If privileged mode is not allowed, you need to adjust the following system parameters on the host:
  - Modify the number of virtual memory areas: `sysctl -w vm.max_map_count=2000000` to adjust the maximum number of virtual memory mappings. View it through `sysctl vm.max_map_count`.
  - Turn off transparent huge pages: Transparent huge pages may have an adverse effect on performance, so you need to turn it off. Judge by whether cat /sys/kernel/mm/transparent_hugepage/enabled contains never.
  - Set the maximum number of open file handles: adjust the maximum number of file handles by modifying `/etc/security/limits.conf`. View it through `ulimit -n`.
  - Disable swap: `swapoff -a` is used to disable all swap partitions and files. Verify with `swapon --show`, no output if not enabled.

### Storage    
Doris Operator must use persistent configuration in the production environment to save the node storage. [EBS](https://aws.amazon.com/ebs) is recommended.

There are the following points to note:
- In the cluster configuration installation or management interface, add the EBS storage plug-in. If you use the EKS autonomous mode (not recommended), it is recommended to install EFS, and the storage plug-in needs to have the corresponding [role permissions](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)
- Ensure that the IAM role of the EKS node has the following permissions:
  - AmazonEC2FullAccess
  - AmazonEKSWorkerNodePolicy
  - AmazonEKS_CNI_Policy
  - AmazonSSMManagedInstanceCore

### Compute resource pool configuration  

- AWS Resource Groups(recommended)
  You can create a node group in the cluster creation interface, or add a node group after the cluster is initialized. Use EC2 > Launch Template > Create Launch Template to set the node group launch template for the node pool. Use the template to inject scripts to automatically adjust the system environment configuration of the EC2 instance to ensure that the node automatically configures the required system parameters when it starts. By configuring the node template, you can also achieve the ability to automatically configure the system parameters of the newly added nodes when using EKS automatic elastic expansion and contraction.
  Example startup script:
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
  In addition, when creating a node group, if you want to access it through the command line, you need to configure remote node access permissions.

- Default node pools(not recommended)
  Enable the resource pool used in EKS autonomous mode. When creating a node pool, you can choose a custom EC2 instance type and adjust the instance's CPU, memory and other resources. When configuring the node pool, you can add a startup script for the EC2 instance to adjust the system parameters. However, this type of resource pool requires autonomous mode and reduces the freedom to manage the cluster. For details on the specific modification operations, please refer to: [Cluster Environment OS Checking](../../preparation/os-checking)


