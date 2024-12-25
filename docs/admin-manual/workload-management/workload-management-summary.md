---
{
"title": "Workload Management Overview",
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

The proper allocation of a database's system resources (such as CPU, memory, I/O, and storage) is crucial. By precisely managing these resources, it is ensured that queries receive adequate resource support during execution, thereby enhancing the overall performance and maintaining the stability of the system. Doris provides resource control functionality, allowing users to divide the physical resources within the cluster into multiple resource units. This resource allocation control prevents any single logical resource group from excessively occupying system resources, which could impact the normal operation of other resource groups. Through meticulous resource management, Doris not only guarantees efficient system operation but also effectively prevents resource contention in multi-task concurrent scenarios, ensuring the stability and maintainability of the system.

## Scenarios for Resource Control
Doris's resource control feature provides refined resource allocation and management support for concurrent multi-user and multi-business scenarios, ensuring efficient and stable system operation in complex environments. Resource control is typically used in the following scenarios:
- When different business data is stored in a single Doris cluster, resource control prevents resource contention between different businesses.
- When different users access the same data, different tenants are isolated to avoid resource contention among users.
- In scenarios with multiple concurrent workloads, resource queues adjust query priorities to prevent faster queries from being blocked by longer-running ones.
- Implementing load circuit breakers that automatically terminate workloads when circuit breaker conditions are met.

## Methods for Resource Group Division
In Doris, users can divide system resources into different resource pools based on specific business needs, ensuring resource independence and mutual non-interference between pools. By binding resource pools to different users, Doris achieves refined resource management and control among users. Doris offers three primary methods for resource division:
- Resource Group: Uses BE nodes as the smallest granularity and divides resources into multiple groups by setting tags.
- Workload Group: Divides resources into multiple groups with CPU/Memory/IO as the smallest granularity, enabling more detailed resource allocatio
- Compute Group: A method for dividing resources in a storage-compute separation model, similar to Resource Group, using BE nodes as the smallest granularity.


| Resource Group Division      | Granularity of Isolation	 | Description of Isolation Solution	                                                                                                  | Soft/Hard Limit	    |  Cross-Group Queries|
| ---------- | ----------- |---------------------------------------------------------------------------------------------------------|-----|-----|
| Resource Group | Server node level, fully isolated resources       | Sets tags for BE nodes, with BE nodes sharing the same tag forming a resource group, enabling node-level resource isolation within the cluster and resource restriction per query. Facilitates fault isolation, where issues within one resource group do not affect others. |   Hard Limit	  |Not supported. Must ensure at least one data replica within the resource group.    |
| Workload Group | Resource granularity, including CPU, memory, IO, etc.        | Utilizes cgroup for CPU, memory, IO, and concurrency resource control; provides query queuing to avoid resource contention.                                                     | Supports both hard and soft limits    | Supported    |
|Compute Group            | Server node level, fully isolated resources  | Based on a storage-compute separation architecture, data is visible across multiple Compute Groups; enables node-level resource isolation within the cluster and resource restriction per query without relying on replica tags. | Hard Limit	 | Not supported. Must ensure at least one data replica within the resource group. |

## Soft and Hard Resource Limits
In Doris, soft limits (soft limit) and hard limits (hard limit) can be used to restrict resource usage:
- Hard Limit: Represents the absolute upper limit of resources that can be used, which cannot be exceeded by tenants. Once the hard limit is reached, requests for additional resources will be rejected. Hard limits are generally used to prevent resource exhaustion within the cluster or contention between different businesses, ensuring cluster stability and performance.
- Soft Limit: Represents a recommended upper limit that can be exceeded. When the system is not busy, tenants can borrow resources from other resource groups if they exceed the soft limit. However, during peak times or when resources are contended, tenants exceeding the soft limit will not receive additional resources.

Resource groups divided using Resource Group/Compute Group methods only support hard limits. Workload Groups support both soft and hard limits. Soft limits for Workload resources are typically used for managing sudden resource spikes, such as temporary query peaks or brief data ingestion increases. Hard limits are used to prevent resource abuse, enabling absolute resource isolation between different businesses to avoid contention. Reasonable use of soft and hard limits can prevent cluster resource exhaustion while providing flexibility for development and operations.

