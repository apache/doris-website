---
{
  "title": "Recommendations on AWS",
  "language": "en"
}
---

## AWS EKS

### Create a new cluster
The containers running in the EKS cluster are hosted on EC2 instances, and the EC2 instances need to be configured at the system level according to the requirements of Doris. When creating a cluster, the user needs to confirm the EKS mode, auto mode or non-auto mode.
It is recommended not to use the autonomous mode here, because the computing resources in the autonomous mode are allocated and recycled through the built-in node pool. At each resource application or release, the existing resources will be reintegrated. For stateful services such as statefulset, especially those that take a long time to start and services with strict distributed collaboration requirements such as Doris, it will cause turbulence in all services in the shared node pool. The direct phenomenon is that it may cause all nodes in the entire Doris cluster to drift (this is more terrifying than restarting. This process will not be a rolling restart, but when the previously stable service is on the node, the node is forced to be released, and K8s schedules these pods to the new node) There are great security risks to the production environment.  
- As mentioned above, the autonomous mode is suitable for stateless service operation and maintenance deployment. The non-autonomous mode is recommended for installing the Doris cluster
- Recommended operating system image: Amazon Linux 2

### Already exists cluster

On an existing cluster (non-auto mode), you can run the Doris cluster through Doris Operator, unless the cluster is restricted to use the privileged mode of K8s.
It is recommended that the existing cluster configure a new node group to deploy and maintain Doris cluster resources separately, which involves the system settings for Doris BE operation and may adjust the system parameters of the host machine.

### Assess DockerHub  

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

  Enable the resource pool used in EKS autonomous mode. When creating a node pool, you can choose a custom EC2 instance type and adjust the instance's CPU, memory and other resources. When configuring the node pool, you can add a startup script for the EC2 instance to adjust the system parameters. However, this type of resource pool requires autonomous mode and reduces the freedom to manage the cluster. For details on the specific modification operations, please refer to: [Cluster Environment OS Checking](../../install/preparation/os-checking.md)



