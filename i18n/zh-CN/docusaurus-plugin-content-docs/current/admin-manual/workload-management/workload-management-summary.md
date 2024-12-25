---
{
"title": "概述",
"language": "zh-CN"
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

数据库的系统资源（如 CPU、Memory、IO 和存储等）的合理分配至关重要。通过精确的资源管理，能够确保查询在执行过程中获得合理的资源支持，从而提升系统的整体性能并维持其稳定性。Doris 提供了资源管控功能，允许用户将集群中的物理资源划分为多个资源单元。资源划管控制避免了某个逻辑资源组过度占用系统资源，从而影响其他资源组的正常运行。通过对资源的精细化管理，Doris 不仅能够保障系统的高效运行，还能够在多任务并行的场景下有效防止资源争夺，确保系统的稳定性与可维护性。

## 资源管控使用场景

Doris 的资源管控功能为多用户、多业务的并发场景提供了精细化的资源分配与管理支持，确保系统在复杂环境下的高效与稳定运行。通常情况会在以下场景中使用资源管控功能：

- 不同业务数据存储在一个 Doris 集群，通过资源管控避免不同业务之间的资源争用；

- 不同用户使用同一份数据，为不同的用户隔离出不同租户避免用户间的资源争用；

- 多负载并行查询，通过资源队列调整查询优先级，以便更快速的查询不会被长时间的查询阻塞；

- 设置负载熔断机制，当满足熔断条件后自动熔断掉当前负载。

## 资源组划分方式
在 Doris 中，用户可以根据具体的业务需求，将系统资源划分为不同的资源池，并确保各资源池之间的资源相互独立，互不干扰。通过将资源池绑定至不同用户，Doris 实现了对不同用户间的资源精细化管理与控制。在资源划分方面，Doris 提供了三种主要方式：

- Resource Group：以 BE 节点为最小粒度，通过设置标签（tag）的方式，划分出多个资源组

- Workload Group：以 CPU / Memory / IO 为最小粒度，划分出多个资源组，实现更细致的资源分配

- Compute Group:   是存算分离模式下的一种资源组划分的方式，与 Resource Group 类似，它也是以 BE 节点为最小粒度，划分出多个资源组
  
下表中记录了不同资源组划分方式的特点及优势场景：

| 资源组划分      | 隔离粒度 | 隔离方案说明                                                                                                  | 软/硬限制    |  跨资源组查询   |
| ---------- | ----------- |---------------------------------------------------------------------------------------------------------|-----|-----|
| Resource Group | 服务器节点级别，资源完全隔离       | 将 BE 节点设置 tag，tag 相同的 BE 节点作为一个资源组，可以进行集群内的节点级别资源隔离，也可以针对单个查询限制资源。通过 Resource Group 可以实现故障隔离，某一资源组内的 BE |   硬限制  |不支持跨资源组查询。必须保证资源组内至少存储一副本数据     |
| Workload Group | 资源粒度，包括 CPU、Memory、IO 等资源        | 基于 cgroup 进行 CPU、Memory、IO 及并发的资源管控；提供查询队列功能，避免资源抢占                                                     | 支持硬限制与软限制    | 支持跨资源组查询    |
|Compute Group            | 服务器节点级别，资源完全隔离  | 基于存算分离的架构，数据在多个 Compute Group 中都可见；可以进行集群内的节点级别资源隔离，也可以针对单个查询限制资源。不依赖副本的标签 | 硬限制 | 不支持跨资源组查询。必须保证资源组内至少存储一副本数据 |

## 资源的软限制与硬限制

在 Doris 中可以使用软限制（Soft Limit）与硬限制（Hard Limit）对资源使用进行限制：

- 资源硬限：硬限是指资源能够使用的绝对上线，租户无法超越该限制。一旦达到硬限，超出部分的资源请求将会被拒绝。硬限一般用于防止集群内资源被耗尽或不同业务之间的资源抢占，确保集群的稳定与性能；

- 资源软限：软限是一个可以被超越的资源限制，通常表示资源推荐使用的上限。在系统不繁忙时，租户申请的资源超过了软限，可以借用其他资源组的资源。在系统繁忙存在资源争用时，租户申请资源超过了软限，将无法继续获得资源。

使用 Resource Group / Compute Group 的方式划分资源组，只支持资源硬限的模式。使用 Workload Group 的方式划分资源组，既支持 Workload Group 资源软限，也支持 Workload Group 资源硬限。Workload 资源软限通常被用于突发性的资源管控，如临时的查询高峰或短暂的数据写入增加，Workload 资源硬限通常被用于防止资源被滥用，不同业务之间可以使用资源硬限实现资源的绝对隔离，避免资源争抢。合理的使用资源软限与硬限的机制，可以在避免集群资源枯竭的同时，提供开发运维的灵活性。