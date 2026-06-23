---
{
    "title": "Doris Operator Resource Model",
    "sidebar_label": "Resource Model",
    "language": "en",
    "description": "Explains the resource models of DorisCluster and DorisDisaggregatedCluster, and how Doris components map to StatefulSet, Service, PVC, ConfigMap, Secret, and HPA.",
    "keywords": ["Doris Operator resource model", "DorisCluster", "DorisDisaggregatedCluster", "StatefulSet", "Service", "PVC"]
}
---

Doris Operator resource model describes how Doris cluster components are mapped to native Kubernetes resources. Understanding this mapping helps you judge which fields affect which underlying resources and makes troubleshooting easier.

This document does not list every field. For field-level configuration, see the corresponding deployment and configuration documents.

## Minimal example

The following example shows a minimal `DorisCluster`. FE and BE are mapped to their corresponding `StatefulSet`, `Service`, PVC, and related resources.

```yaml
apiVersion: doris.apache.com/v1
kind: DorisCluster
metadata:
  name: demo
  namespace: doris
spec:
  feSpec:
    replicas: 3
    image: apache/doris:fe-2.1.8
  beSpec:
    replicas: 3
    image: apache/doris:be-2.1.8
```

## Overview

Regardless of deployment mode, the user directly manages a Doris custom resource. The Operator uses that resource to create native Kubernetes resources, and those resources run Doris components.

![Doris Operator resource model overview](/images/doris-operator/mermaid/06-resource-model-overview.jpg)

## DorisCluster

`DorisCluster` is used for compute-storage integrated deployments. It usually contains FE, BE, CN, and Broker components.

![DorisCluster resource model](/images/doris-operator/mermaid/07-resource-model-doriscluster.jpg)

| Component | Description | Main Kubernetes resources |
| --- | --- | --- |
| FE | Metadata management, SQL access, and query coordination | `StatefulSet`, internal Service, external Service, PVC |
| BE | Data storage and execution | `StatefulSet`, internal Service, external Service, PVC |
| CN | Compute execution for elastic compute scenarios | `StatefulSet`, internal Service, external Service, PVC, HPA |
| Broker | External storage access proxy; whether it is needed depends on Doris version and workload | `StatefulSet`, internal Service |

## DorisDisaggregatedCluster

`DorisDisaggregatedCluster` is used for compute-storage decoupled deployments. It usually contains MetaService, FE, and one or more ComputeGroups.

![DorisDisaggregatedCluster resource model](/images/doris-operator/mermaid/08-resource-model-disaggregatedcluster.jpg)

| Component | Description | Main Kubernetes resources |
| --- | --- | --- |
| MetaService | Metadata service for compute-storage decoupled clusters | `StatefulSet`, Service, PVC |
| FE | SQL access, query coordination, and metadata access entry point | `StatefulSet`, internal Service, external Service, PVC |
| ComputeGroup | Independent compute resource group for running compute tasks | `StatefulSet`, internal Service, external Service, PVC |
| FoundationDB | Metadata dependency for compute-storage decoupled clusters | External service or managed by `fdb-kubernetes-operator` |

## Service types

Doris Operator creates Services for different purposes.

| Service type | Purpose | Typical use |
| --- | --- | --- |
| internal Service | Stable network identity and internal communication | StatefulSet DNS, component discovery, Pod-to-Pod access |
| external Service | External access entry point | Client connections and external system access |

An internal Service is usually not the business access entry point. Depending on the scenario, an external Service may be configured as `ClusterIP`, `NodePort`, or `LoadBalancer`.

## Storage

Doris is a stateful system. FE, BE, CN, MetaService, and ComputeGroups may all need persistent directories. The Operator binds persistent storage through PVC templates.

Pay attention to:

- Whether the Kubernetes cluster has an available StorageClass.
- Whether PVC capacity is sufficient for data and log growth.
- Whether access mode fits the workload.
- Whether configured Doris directories match PVC mount paths.

If PVCs cannot be bound, the Operator keeps waiting and the affected Pods cannot start.

## Configuration and authentication resources

Doris Operator supports `ConfigMap` and `Secret` for configuration and sensitive data.

| Resource | Common use |
| --- | --- |
| `ConfigMap` | Startup configuration for FE, BE, CN, Broker, MetaService, and ComputeGroups |
| `Secret` | Passwords, access credentials, and keytabs |
| `authSecret` | Credentials used by Doris Operator for node registration, decommissioning, and related management actions |
| `kerberosInfo` | Kerberos configuration and keytab mounting |
| `serviceAccount` | Kubernetes ServiceAccount used when components need to access cloud or external services |

Whether a configuration update triggers a restart depends on the field and Operator settings. For example, in compute-storage integrated mode, `enableRestartWhenConfigChange` controls whether core ConfigMap changes trigger a rolling restart.

## Naming

Operator-managed resources usually use the cluster name and component name as prefixes, which makes ownership easy to identify.

If a compute-storage integrated cluster is named `demo`, common names look like:

```text
demo-fe
demo-fe-internal
demo-fe-service
demo-be
demo-be-internal
demo-be-service
demo-cn
demo-cn-internal
demo-cn-service
demo-broker
demo-broker-internal
```

If a compute-storage decoupled cluster is named `demo` and a ComputeGroup is named `adhoc-query`, common names look like:

```text
demo-ms
demo-fe
demo-fe-internal
demo-adhoc-query
demo-adhoc-query-external
```

Actual names can vary slightly by version or configuration. Treat `kubectl get` output as the source of truth.

## Dependencies between components

The resource model also implies component dependencies.

In a compute-storage integrated cluster, FE is the entry point for other components to register and access Doris metadata:

![Dependencies between components in DorisCluster](/images/doris-operator/mermaid/09-resource-model-integrated-dependencies.jpg)

In a compute-storage decoupled cluster, MetaService is ready first, FE depends on it, and ComputeGroups depend on FE:

![Dependencies between components in DorisDisaggregatedCluster](/images/doris-operator/mermaid/10-resource-model-decoupled-dependencies.jpg)

When an upstream component is not ready, downstream components may keep waiting or reconciling. That is expected behavior. For the execution order of creation and changes, see [Doris Operator Lifecycle Management](./lifecycle).
