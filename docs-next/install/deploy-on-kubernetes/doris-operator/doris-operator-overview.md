---
{
    "title": "Doris Operator Overview",
    "language": "en",
    "description": "Doris Operator is the official Kubernetes Operator provided by Apache Doris, supporting automated deployment, scaling, and rolling upgrades of Doris clusters on K8s. This article introduces the architecture, core capabilities, and deployment guidance.",
    "keywords": [
        "Doris Operator",
        "Doris Kubernetes",
        "Deploy Doris on K8s",
        "Kubernetes Operator",
        "Doris containerization",
        "K8s Doris deployment"
    ]
}
---

To meet user demands for efficient deployment and operations of Doris on the Kubernetes platform, the [Kubernetes Operator](https://github.com/apache/doris-operator) (hereafter referred to as Doris Operator) was created.
It integrates the complex management capabilities of native Kubernetes resources and incorporates experience in distributed coordination among Doris components and on-demand customization of user cluster forms, providing users with a more concise, efficient, and easy-to-use containerized deployment solution.
It aims to achieve efficient management and control of Doris on Kubernetes, helping users reduce operational management and learning costs while providing powerful functionality and flexible configuration capabilities.

Doris Operator implements the configuration, management, and scheduling of Doris on the Kubernetes platform based on Kubernetes CustomResourceDefinitions (CRD). Doris Operator can automatically create Pods and other resources to start services according to the desired state defined by the user. Through the automatic registration mechanism, all started services can be integrated into a complete Doris cluster. This implementation significantly reduces the complexity and learning costs of essential production operations such as configuration management, node discovery and registration, access communication, and health checks in a Doris cluster.

## Doris Operator Architecture

![Doris Operator architecture diagram](/images/next/install/doris-operator.jpg)

The design of Doris Operator is based on the principle of a two-tier scheduler:

- **First-tier scheduling**: Uses native StatefulSet and Service to manage Pods, fully compatible with standard Kubernetes clusters.
- **Second-tier scheduling**: Doris Operator watches the DorisCluster CRD resource and converts the cluster specification defined by the user into a StatefulSet and its associated resources.

After the cluster configuration is delivered through kubectl, Doris Operator automatically completes operations such as StatefulSet creation, Pod scheduling, and service registration.

The core components of a Doris cluster include:

| Component | Role |
|------|------|
| FE (Frontend) | Responsible for metadata management and query coordination |
| BE (Backend) | Responsible for data storage and query execution |
| CN (Compute Node) | Responsible for compute acceleration (in storage-compute separation mode) |
| Broker | Responsible for accessing external data sources |

## Key Capabilities

- **End-state deployment**:

  Kubernetes adopts the end-state operations model to manage services, and Doris Operator defines a resource type that can describe a Doris cluster: DorisCluster. Users can refer to the relevant documentation and usage examples to easily configure the desired cluster.
  Through the Kubernetes command-line tool kubectl, users can deliver the configuration to the Kubernetes cluster. Doris Operator automatically builds the required cluster and updates the cluster status to the corresponding resources in real time. This process ensures efficient management and monitoring of the cluster, greatly simplifying operational work.

- **Easy scaling**:

  Doris Operator supports concurrent real-time horizontal scaling in cloud-disk-based environments. All Doris component services are deployed and managed through Kubernetes StatefulSet. During deployment or scaling, the Parallel mode of StatefulSet is used to create Pods, so in theory all replicas can be started within the time it takes to start a single node. The startup of each replica does not interfere with the others, and when one service fails to start, the startup of other services is not affected.
  Doris Operator starts services in concurrent mode and has a built-in distributed architecture, greatly simplifying the process of service scaling. Users only need to set the number of replicas to easily scale out, completely freeing them from complex operational work.

- **Seamless changes**:

  In a distributed environment, service restarts can cause temporary instability. Especially for databases, which have extremely high stability requirements, ensuring service stability during restarts is a very important topic. Doris on Kubernetes ensures stability during service restarts through the following three mechanisms, achieving a seamless experience for the business during restarts and upgrades.

  1. Graceful exit
  2. Rolling restart
  3. Active stop of query allocation

- **Host system configuration**:

  In some scenarios, host system parameters need to be configured to achieve the ideal performance of Apache Doris. In containerized scenarios, the uncertainty of host deployment and the difficulty of modifying parameters bring challenges to users. To solve this problem, Doris Operator uses Kubernetes init containers to make host parameters configurable.
  Doris Operator allows users to configure commands to be executed on the host and apply them through init containers. To improve usability, Doris Operator abstracts the configuration of Kubernetes init containers, making the setting of host commands more simple and intuitive.

- **Persistent configuration**:

  Doris Operator uses the Kubernetes StorageClass model to provide storage configuration for each service. It allows users to customize the mount directory. When customizing the startup configuration, if the storage directory is modified, the directory can be set as a persistent location in the custom resource, so that the service uses the specified directory inside the container to store data.

- **Runtime debugging**:

  One of the biggest challenges of containerized services for troubleshooting is how to debug at runtime. While pursuing availability and ease of use, Doris Operator also provides more convenient conditions for problem diagnosis. The base image of Doris comes with various tools preinstalled for problem diagnosis. When you need to view the status in real time, you can enter the container through the exec command provided by kubectl and use the built-in tools for troubleshooting.
  When a service fails to start for unknown reasons, Doris Operator provides a Debug run mode. When a Pod is set to Debug startup mode, the container automatically enters the running state. At this time, you can enter the container through the `exec` command, manually start the service, and diagnose the problem. For details, refer to [this document](../integrated-storage-compute/cluster-operation).

## Compatibility

Doris Operator is developed according to standard K8s specifications and is compatible with all standard K8s platforms, including those provided by mainstream cloud vendors, self-built K8s platforms based on the standard, and user self-built platforms.

### Cloud Vendor Compatibility

Doris Operator is fully compatible with the containerization service platforms of mainstream cloud vendors. For environment preparation and usage recommendations of Doris Operator, refer to the following documents:

- [Alibaba Cloud](./on-alibaba)

- [AWS](./on-aws)

## Applicable Scenarios

Doris Operator is applicable to the following scenarios:

- Need to quickly deploy and manage Doris clusters on Kubernetes
- Have elastic scaling requirements and need to dynamically adjust the number of nodes based on business load
- Development and operations teams that need to uniformly manage multiple Doris environments
- Users who want to reduce the operational complexity of Doris clusters

## Installation and Usage

### Prerequisites

Before deployment, the host system needs to be checked. Refer to [Operating System Check](../../preparation/os-checking.md).

### Deploying Doris Operator

For detailed installation documentation, refer to the [integrated storage-compute version](../integrated-storage-compute/install-doris-operator.md) or the [storage-compute separation version](../separating-storage-compute/install-doris-cluster.md) of the Doris Operator installation guide.

## FAQ

### Q: What is the difference between Doris Operator and manually deploying Doris on Kubernetes?

Doris Operator automatically manages the cluster lifecycle through CRDs, including creation, scaling, upgrades, and failure recovery, without manually executing kubectl commands on each Pod.

### Q: How do I choose between the integrated storage-compute version and the storage-compute separation version?

The integrated storage-compute version is suitable for small to medium-scale clusters and is simple to deploy. The storage-compute separation version is suitable for large-scale scenarios with elastic scaling requirements. For details, refer to the [integrated storage-compute deployment documentation](../integrated-storage-compute/install-doris-operator.md) and the [storage-compute separation deployment documentation](../separating-storage-compute/install-doris-cluster.md).

### Q: Which Kubernetes versions does Doris Operator support?

It is compatible with Kubernetes 1.19 and above, including Alibaba Cloud ACK, AWS EKS, public cloud private deployments, and other standard K8s platforms.

