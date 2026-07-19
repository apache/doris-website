---
title: "Workload Management Overview: Resource Isolation, Throttling, and Circuit Breaking"
sidebar_label: Workload Management
description: Introduces the core capabilities of Apache Doris workload management, including resource isolation methods (Resource Group, Workload Group, Compute Group), the difference between soft and hard limits, and applicable scenarios.
keywords: [workload management, resource isolation, Workload Group, Resource Group, Compute Group, soft limit, hard limit, concurrency control, circuit breaking]
language: en
---

<!-- Knowledge type: Concept description -->

The Doris workload management feature addresses resource contention when multiple tenants or business lines share a single cluster. By configuring workload management policies appropriately, you can achieve resource isolation, prevent queries from overwhelming the cluster, and safeguard business SLAs.

The core capabilities cover three areas:

- **Resource isolation**: Divide cluster resources (CPU, memory, IO) into multiple groups so that different users and business lines do not interfere with each other.
- **Concurrency control and queuing**: Limit the number of tasks the cluster runs at the same time. When the threshold is exceeded, new tasks are queued automatically to prevent sudden high concurrency from overwhelming the system.
- **Circuit breaking**: During the query planning phase or execution, automatically cancel abnormal tasks based on conditions such as the volume of scanned data, allocated memory, or execution time, so that a single query does not consume too many resources.

## Resource Partitioning Methods

<!-- Knowledge type: Concept comparison -->

Doris provides three resource grouping methods for different deployment modes and isolation requirements:

| Resource Isolation Method | Isolation Granularity | Soft/Hard Limit | Cross-Group Queries | Applicable Scenarios |
|---|---|---|---|---|
| Resource Group | Server-node level, fully isolated resources; can isolate BE failures | Hard limit only | Not supported; at least one replica must be stored within the resource group | Strong isolation in the integrated storage-compute mode |
| Workload Group | Isolation within a BE process; cannot isolate BE failures | Soft limit + hard limit | Supported | Fine-grained resource allocation, burst traffic control |
| Compute Group | Server-node level, fully isolated resources; can isolate BE failures | Hard limit only | Not supported | Strong isolation in the decoupled storage-compute mode |

The three methods are described in detail below:

- **Resource Group**: Uses the BE node as the smallest unit and divides the cluster into multiple resource groups by setting tags. Applies to the integrated storage-compute mode.
- **Workload Group**: Further subdivides resources within a single BE through Cgroups, enabling fine-grained resource allocation within a process.
- **Compute Group**: The resource grouping method for the decoupled storage-compute mode. Similar to Resource Group, it uses the BE node as the smallest unit.

## Soft Limit and Hard Limit

<!-- Knowledge type: Concept definition -->

A **hard limit** is the absolute upper bound on resource usage that no tenant can exceed. Once a hard limit is reached, requests for resources beyond it are rejected directly. Hard limits prevent cluster resources from being exhausted or contended for between business lines, and safeguard the overall stability of the cluster.

A **soft limit** is a resource ceiling that can be temporarily exceeded. When the system is idle, a tenant may borrow idle resources from other resource groups. When the system is busy and resource contention exists, requests that exceed the soft limit cannot obtain additional resources. Soft limits suit bursty traffic, such as temporary query spikes or short-term increases in data ingestion.

The correspondence between resource partitioning methods and limit modes is as follows:

| Partitioning Method | Soft Limit Supported | Hard Limit Supported |
|---|---|---|
| Resource Group | No | Yes |
| Workload Group | Yes | Yes |
| Compute Group | No | Yes |

## Related Documents

<!-- Knowledge type: Navigation -->

- [Resource Group](resource-group) - Resource grouping configuration based on node tags
- [Workload Group](workload-group) - In-process resource grouping configuration based on Cgroups
- [Compute Group](compute-group) - Resource grouping configuration in the decoupled storage-compute mode
- [Concurrency Control and Queuing](concurrency-control-and-queuing) - Configure query concurrency limits and queue policies
- [Circuit Breaking and SQL Blocking](sql-blocking) - Configure query circuit breaking rules
- [Workload Analysis and Diagnosis](analysis-diagnosis) - Troubleshoot resource bottlenecks and performance issues
