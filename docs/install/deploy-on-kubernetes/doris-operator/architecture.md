---
{
    "title": "Doris Operator Architecture",
    "sidebar_label": "Architecture",
    "language": "en",
    "description": "Describes the Doris Operator control plane, data plane, Reconcile model, and control paths for compute-storage integrated and compute-storage decoupled clusters.",
    "keywords": ["Doris Operator architecture", "Kubernetes Operator", "Reconcile", "DorisCluster", "DorisDisaggregatedCluster"]
}
---

Doris Operator follows the standard Kubernetes Operator pattern. Users declare the desired state through CRDs, and the Operator continuously observes actual state and reconciles the difference by creating, updating, or deleting Kubernetes resources.

This document focuses on the overall architecture. For field definitions and deployment procedures, see the corresponding installation and configuration documents.

## Architecture layers

Doris Operator can be viewed as two layers: the control plane and the data plane.

![Doris Operator architecture layers](/images/doris-operator/mermaid/02-architecture-layers.png)

The control plane reads Doris custom resources and executes the Reconcile flow. The data plane is made of native Kubernetes resources that actually run Doris components.

## Reconcile model

The Reconcile loop is the core of Doris Operator. Whenever a Doris custom resource is created or updated, or when related resources change status, the Operator recalculates the difference between desired state and actual state, then performs the necessary operations.

A typical flow is:

1. Read the Doris custom resource.
2. Check whether the resource is being deleted.
3. Parse component, storage, authentication, and access configuration.
4. Create or update the corresponding `StatefulSet`, `Service`, PVC, and related resources.
5. Aggregate component state and write it into CR `status`.
6. If the cluster is not ready, wait for the next Reconcile loop.

![Doris Operator reconcile model](/images/doris-operator/mermaid/03-architecture-reconcile-model.png)

## Control path for compute-storage integrated clusters

`DorisCluster` is used for compute-storage integrated deployments. A single resource can include FE, BE, CN, and Broker configuration.

![Control path for compute-storage integrated clusters](/images/doris-operator/mermaid/04-architecture-integrated-control-path.png)

In this path, the main Reconciler is responsible for reading the CR, ordering component actions, cleaning up invalid resources, and aggregating status. Component controllers create and inspect resources for their own components.

## Control path for compute-storage decoupled clusters

`DorisDisaggregatedCluster` is used for compute-storage decoupled deployments. A single resource contains MetaService, FE, and one or more ComputeGroups.

![Control path for compute-storage decoupled clusters](/images/doris-operator/mermaid/05-architecture-decoupled-control-path.png)

Compared with compute-storage integrated mode, this path involves more Doris metadata-level actions. For example, when scaling down a ComputeGroup, the Operator may need to perform decommission or drop actions first, and then update Kubernetes resources.

## Webhook and validation

Doris Operator can optionally enable a Webhook to apply defaults and reject obviously invalid configurations before they enter the Reconcile flow.

Common checks include:

- Whether FE replica and election-related settings are compatible.
- Whether resource field formats satisfy CRD constraints.
- Whether component configuration matches models supported by the Operator.

Whether Webhook is enabled depends on the deployment method and environment. Even without Webhook, CRD schema validation and Reconcile status feedback still provide baseline constraints.

## Status aggregation

The Operator does not only create resources. It also writes component state back into the Doris custom resource. You can use `kubectl get` or `kubectl describe` to see whether components are available, scaling, waiting for scheduling, or failing.

For compute-storage integrated clusters, status is aggregated by FE, BE, CN, and Broker. For compute-storage decoupled clusters, status is aggregated by MetaService, FE, and ComputeGroups, with an additional overall health summary.
