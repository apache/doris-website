---
{
    "title": "Doris Kubernetes Operator",
    "language": "en",
    "description": "Kubernetes Operator (referred to as Doris Operator) was born to meet the user's demand for efficient deployment and operation of Doris on the "
}
---

[Kubernetes Operator](https://github.com/apache/doris-operator) (referred to as Doris Operator) was born to meet the user's demand for efficient deployment and operation of Doris on the Kubernetes platform. 
It integrates the complex management capabilities of native Kubernetes resources, and integrates the distributed collaboration between Doris components, on-demand customization of user cluster forms, and other experiences, providing users with a more concise, efficient and easy-to-use containerized deployment solution. 
It aims to achieve efficient management and control of Doris on Kubernetes, helping users reduce operation and maintenance management and learning costs while providing powerful functions and flexible configuration capabilities.

Doris Operator implements the configuration, management and scheduling of Doris on the Kubernetes platform based on Kubernetes CustomResourceDefinitions (CRD). Doris Operator can automatically create Pods and other resources to start services according to the user-defined desired state. Through the automatic registration mechanism, all started services can be integrated into a complete Doris cluster. This implementation significantly reduces the complexity and learning cost of processing configuration information, node discovery and registration, access communication and health checks in the Doris cluster, which are essential operations in the production environment.

## Doris Operator Architecture

The design of Doris Operator is based on the principle of a two-layer scheduler. The first-layer scheduling of each component uses native StatefulSet and Service resources to directly manage the corresponding Pod service, which makes it fully compatible with open source Kubernetes clusters, including public clouds, private clouds, and self-built Kubernetes platforms.

Based on the deployment definition provided by Doris Operator, users can customize the Doris deployment state and send it to the Kubernetes cluster through the kubectl management command of Kubernetes. Doris Operator converts the deployment of each service into StatefulSet and its affiliated resources (such as Service) according to the customized state, and then schedules the desired Pods through StatefulSet. It simplifies unnecessary configuration in the StatefulSet specification by abstracting the final state of the Doris cluster, thereby reducing the user's learning cost.

## Key capabilities

- **Final state deployment**:  

  Kubernetes uses the final state operation and maintenance mode to manage services, and Doris Operator defines a resource type that can describe the Doris cluster - DorisCluster. Users can refer to relevant documents and usage examples to easily configure the required cluster.
  Users can send the configuration to the Kubernetes cluster through the Kubernetes command line tool kubectl. Doris Operator automatically builds the required cluster and updates the cluster status to the corresponding resources in real time. This process ensures efficient management and monitoring of the cluster and greatly simplifies operation and maintenance operations.

- **Easy to expand**:  

  Doris Operator supports concurrent real-time horizontal expansion in a cloud disk-based environment. All component services of Doris are deployed and managed through Kubernetes' StatefulSet. When deploying or expanding, Pods are created using StatefulSet's Parallel mode, so that in theory all replicas can be started within the time it takes to start a node. The startup of each replica does not interfere with each other, and when a service fails to start, the startup of other services will not be affected.
  Doris Operator uses concurrent mode to start services and has a built-in distributed architecture, which greatly simplifies the process of service expansion. Users only need to set the number of replicas to easily complete the expansion, completely freeing up the complexity of operation and maintenance operations.

- **Unnoticeable changes**:  

  In a distributed environment, service restarts may cause temporary instability of services. Especially for services such as databases that have extremely high requirements for stability, how to ensure the stability of services during the restart process is a very important topic. Doris uses the following three mechanisms on Kubernetes to ensure the stability of the service restart process, thereby achieving an imperceptible experience for the business during the restart and upgrade process.

  1. Graceful exit
  2. Rolling restart
  3. Actively stop query allocation

- **Host system configuration**:  

  In some scenarios, it is necessary to configure the host system parameters to achieve the ideal performance of Apache Doris. In the containerized scenario, the uncertainty of host deployment and the difficulty of parameter modification bring challenges to users. To solve this problem, Doris Operator uses Kubernetes's initialization container to make the host parameters configurable.
  Doris Operator allows users to configure commands executed on the host and make them effective by initializing containers. To improve availability, Doris Operator abstracts the configuration method of Kubernetes initialization containers, making the setting of host commands simpler and more intuitive.

- **Persistent configuration**:  

  Doris Operator uses the Kubernetes StorageClass mode to provide storage configuration for each service. It allows users to customize the mount directory. When customizing the startup configuration, if the storage directory is modified, the directory can be set as a persistent location in the custom resource, so that the service uses the specified directory in the container to store data.

- **Runtime debugging**:  

  One of the biggest challenges for Trouble Shooting with containerized services is how to debug at runtime. While pursuing availability and ease of use, Doris Operator also provides more convenient conditions for problem location. In the basic image of Doris, a variety of tools for problem location are pre-set. When you need to view the status in real time, you can enter the container through the exec command provided by kubectl and use the built-in tools for troubleshooting.
  When the service cannot be started for unknown reasons, Doris Operator provides a Debug running mode. When a Pod is set to Debug startup mode, the container will automatically enter the running state. At this time, you can enter the container through the `exec` command, manually start the service and locate the problem. For details, please refer to [this document](../../install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation.md#How-to-enter-the-container-when-the-pod-crashes)

## Compatibility

Doris Operator is developed in accordance with standard K8s specifications and is compatible with all standard K8s platforms, including those provided by mainstream cloud vendors, self-built K8s platforms based on standards, and user-built platforms.  

### Cloud vendor compatibility

Fully compatible with the containerized service platforms of mainstream cloud vendors. For environment preparation and usage suggestions for Doris Operator, please refer to the following documents:

- [Alibaba Cloud](./on-alibaba)

- [AWS](./on-aws)

## Installation and management

### Prerequisites

Before deployment, you need to check the host system. Refer to [Operating System Check](../../install/preparation/os-checking.md)

### Deploy Doris Operator

For details, please see Doris Operator installation doc for [Compute-Storage Coupled](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator.md) or [Compute-Storage Decoupled](../../install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md)
