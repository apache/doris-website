---
{
"title": "Overview",
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

Workload management is a very important feature of Doris, playing a critical role in the overall system management. Through reasonable workload management strategies, resource utilization can be optimized, system stability enhanced, and response time reduced. It has the following abilities:

- Resource Isolation: By dividing into multiple groups and setting resource (CPU, Memory, IO) limits for each group, it ensures that there is no interference between multiple users or different tasks (such as read and write operations) of the same user.

- Concurrency Control and Queuing: It can limit the number of tasks that can be executed simultaneously in the entire cluster. When threshold is exceeded, tasks will be queued.

- Circuit Breaker: During query planning phase or execution phase, tasks can be automatically cancelled based on conditions such as the estimated number of partitions to be read, the amount of data to be scanned, the allocated memory size, and the execution time. This avoids unreasonable tasks from occupying too many system resources.


## Resource Isolation Methods

Doris can divide resource in the following three ways:

- Resource Group: Divide multiple BE processes into groups setting tag for each BE.

- Workload Group: The resource (CPU, Memory, IO) within a BE are divided into multiple resource groups through Cgroup, enabling more fine-grained resource isolation.

- Compute Group: It is a way of resource partitioning method in compute-storage decoupled mode. Similar to Resource Group, it also takes BE as the minimum granularity to divide multiple groups.

The following table records the characteristics and advantageous scenarios of different resource partitioning methods:

| Resource Isolation Method	      | Isolation Granularity	| Soft/Hard Limit |  Cross Resource Group Query |
| ---------- | ----------- |-----|-----|
| Resource Group | BE node level, with complete resource isolation, can isolate BE failures      |   Hard limit  |Not support. And it is necessary to ensure that at least one copy of data is stored within the resource group.    |
| Workload Group | Isolation within BE process; cannot isolate BE failures                                                          | Both hard and soft limit    | Support    |
|Compute Group            | BE node level, with complete resource isolation, can isolate BE failures  | Hard limit | Not support |

## Soft Limit and Hard Limit


- Hard Limit: The hard limit refers to the absolute upper limit of resource usage that tenants cannot exceed. Once the hard limit is reached, resource requests for the excess part will be rejected. Hard limit are generally used to prevent the depletion of resources within the cluster or resource preemption between different businesses, ensuring the stability and performance of the cluster.

- Soft Limit: The soft limit is a resource limit that can be exceeded, usually representing the recommended upper limit of resource usage. When the system is not busy, if a tenant requests more resources than the soft limit, it can borrow resources from other groups. When the system is busy and there is resource contention, if a tenant requests resources exceeding the soft limit, it will not be able to obtain additional resources.

When using the Resource Group / Compute Group method to partition resources, only the hard limit mode is supported. When using the Workload Group method to partition resources, both the soft limit and hard limit of Workload Group are supported. The soft limit of Workload Group is usually used for sudden resource control, such as temporary query peaks or short-term increases in data writing.
