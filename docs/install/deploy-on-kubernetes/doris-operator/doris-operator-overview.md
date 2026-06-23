---
{
    "title": "Doris Operator Overview",
    "sidebar_label": "Overview",
    "language": "en",
    "description": "Introduces the concepts, scope, use cases, and capability boundaries of Doris Operator.",
    "keywords": ["Doris Operator", "Kubernetes", "DorisCluster", "DorisDisaggregatedCluster", "Deploy Doris on Kubernetes"]
}
---

Doris Operator is the official Kubernetes Operator for Apache Doris. It combines Doris operational experience with Kubernetes-native resource management to provide a simpler, more efficient, and easier-to-use way to deploy and operate Doris on Kubernetes.

Doris Operator extends the Kubernetes API through CustomResourceDefinitions (CRDs). After you submit a Doris custom resource, the Operator creates and maintains the corresponding Kubernetes resources such as `StatefulSet`, `Service`, and `PersistentVolumeClaim`, and in some scenarios performs Doris metadata-level actions such as node registration, decommissioning, or cleanup.

This document explains where Doris Operator fits, what it manages, and when to use it. It is intended to help you build the right mental model first. For installation and deployment procedures, see the deployment documents for compute-storage integrated and compute-storage decoupled modes.

## Why use Doris Operator

Deploying Doris on Kubernetes requires coordinating multiple components, service discovery, configuration mounts, storage binding, node registration, scaling, and health checks. As the cluster grows or the environment becomes more complex, managing these resources manually can lead to scattered configuration, many operational steps, and hard-to-track state.

With Doris Operator, you describe the desired cluster state declaratively through a Doris custom resource. The Operator then provides:

- A single resource that describes cluster topology.
- Automatic creation and maintenance of `StatefulSet`, `Service`, PVC, and related resources.
- Ordered component bring-up and changes based on dependencies.
- Component state aggregation into CR `status`.
- Support for common operations such as configuration changes, scaling, and rolling updates.
- Doris metadata-level node registration, decommissioning, or cleanup in some scenarios.

## How it works

Doris Operator extends the Kubernetes API through CRDs. After you submit a Doris cluster resource through `kubectl`, Helm, or another release tool, the Operator watches that resource and translates it into native Kubernetes resources such as `StatefulSet`, `Service`, and `PersistentVolumeClaim`.

![How Doris Operator works](/images/doris-operator/mermaid/01-overview-how-doris-operator-works.jpg)

In this model, the user maintains the desired state, and the Operator continuously reconciles actual state toward that target.

## Architecture

Doris Operator can be viewed as two layers: the control plane and the data plane. The control plane includes Doris Operator, the Reconciler, optional Webhook logic, and status aggregation. It watches Doris custom resources and reconciles the actual state toward the desired state. The data plane includes Kubernetes-native resources such as `StatefulSet`, `Service`, PVC, HPA, and Doris Pods, which run the actual Doris components.

![Doris Operator architecture layers](/images/doris-operator/mermaid/02-architecture-layers.jpg)

After a user submits a Doris custom resource through `kubectl`, Helm, or another release tool, the Kubernetes API Server stores the desired state. Doris Operator watches resource changes and runs Reconcile logic, then creates or updates the underlying Kubernetes resources. This layered model reduces the complexity of managing many low-level resources directly and keeps Doris deployments aligned with standard Kubernetes platforms.

## Supported cluster resources

Doris Operator primarily supports two cluster resource types:

| Resource | Deployment mode | Main components | Typical use case |
| --- | --- | --- | --- |
| `DorisCluster` | Compute-storage integrated | FE, BE, CN, Broker | Standard Doris cluster deployment with a simpler operations model |
| `DorisDisaggregatedCluster` | Compute-storage decoupled | MetaService, FE, ComputeGroup | Workloads that need elastic compute groups or compute isolation |

- `DorisCluster` is used for compute-storage integrated deployments. A single resource can describe FE, BE, CN, and Broker images, replica counts, resources, storage, configuration, and access methods.
- `DorisDisaggregatedCluster` is used for compute-storage decoupled deployments. It splits the cluster into MetaService, FE, and one or more ComputeGroups, each of which can be configured and operated independently.

## Managed objects

From the user perspective, Doris Operator mainly manages:

| Object | Description |
| --- | --- |
| Doris custom resources | Desired cluster state such as `DorisCluster` or `DorisDisaggregatedCluster` |
| `StatefulSet` | Replica count, stable network identity, and rolling updates for Doris component Pods |
| `Service` | Internal communication and external access |
| PVC | Persistent storage for stateful components |
| `ConfigMap` / `Secret` | Configuration, credentials, and external dependency information |
| HPA | Automatic scaling for supported components |
| `status` | Component state, availability, and cluster health |

## Choosing a deployment mode

If you are deploying Doris on Kubernetes for the first time, start with compute-storage integrated mode in most cases. Choose compute-storage decoupled mode when you clearly need elastic compute groups, compute isolation, or object-storage-based architecture.

| Requirement | Recommended choice |
| --- | --- |
| Quickly deploy a standard Doris cluster | `DorisCluster` |
| Validate with fewer concepts | `DorisCluster` |
| Use different compute resources for different workloads | `DorisDisaggregatedCluster` |
| Scale compute more flexibly | `DorisDisaggregatedCluster` |
| Already plan to use object storage and FoundationDB | `DorisDisaggregatedCluster` |

## Capability boundaries

Doris Operator focuses on Doris cluster resources and lifecycle management. It does not replace Doris database-level management capabilities.

It does not directly manage:

- SQL objects such as databases, tables, partitions, and indexes.
- Data import, export, or workload orchestration policies.
- User privilege model design.
- Automatic recovery for every failure.
- Full abstraction of all Kubernetes, storage, or network problems.

When the cluster is unhealthy, you still need to combine Operator status, Kubernetes resource state, and Doris component logs to locate the issue.

## Next steps

If you are new to Doris Operator, read this group of documents in order. If you are troubleshooting a specific problem, jump directly to the relevant page.

| Goal | Recommended document |
| --- | --- |
| Understand the control plane, data plane, and Reconcile model | [Doris Operator Architecture](./architecture) |
| Understand how Doris custom resources map to `StatefulSet`, `Service`, PVC, and other resources | [Doris Operator Resource Model](./resource-model) |
| Understand behavior during creation, scaling, configuration changes, and deletion | [Doris Operator Lifecycle Management](./lifecycle) |
| Understand status fields and the troubleshooting path | [Doris Operator Status and Troubleshooting](./status-and-troubleshooting) |
