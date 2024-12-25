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

负载管理是Doris一项非常重要的功能，在整个系统运行中起着非常重要的作用。通过合理的负载管理策略，可以优化资源使用，提高系统的稳定性，降低响应时间。Doris 的负载管理具备以下功能：

- 负载隔离: 通过划分多个Group，并且为每个Group都设置一定的资源（CPU, Memory, IO）限制，确保多个用户之间、同一用户不同的任务（读写操作）之间互不干扰；

- 并发控制与排队: 可以限制整个集群同时执行的任务数量，当超过设置的阈值时自动排队；

- 熔断: 对于执行中的任务，可以根据扫描的数据量，分配的内存大小，执行时间等条件，自动取消任务，避免不合理的任务占用太多的系统资源。


## 资源划分方式
Doris 可以通过以下2种方式将资源分组：

- Resource Group: 以 BE 节点为最小粒度，通过设置标签（tag）的方式，划分出多个资源组；

- Workload Group: 将一个BE内的资源（CPU、Memory、IO）通过Cgroup划分出多个资源组，实现更细致的资源分配；
  
下表中记录了不同资源组划分方式的特点及优势场景：

| 资源组划分      | 隔离粒度                                                                                             | 软/硬限制    |  跨资源组查询   |
| ---------- | ----------- |-----|-----|
| Resource Group | 服务器节点级别，资源完全隔离；可以隔离BE故障      |   硬限制  |不支持跨资源组查询，必须保证资源组内至少存储一副本数据。    |
| Workload Group | BE 进程内隔离；不能隔离BE故障                                                          | 支持硬限制与软限制    | 支持跨资源组查询    |

## 软限与硬限

- 硬限：硬限是指资源能够使用的绝对上线，租户无法超越该限制。一旦达到硬限，超出部分的资源请求将会被拒绝。硬限一般用于防止集群内资源被耗尽或不同业务之间的资源抢占，确保集群的稳定与性能；

- 软限：软限是一个可以被超越的资源限制，通常表示资源推荐使用的上限。在系统不繁忙时，租户申请的资源超过了软限，可以借用其他资源组的资源。在系统繁忙存在资源争用时，租户申请资源超过了软限，将无法继续获得资源。

使用 Resource Group 的方式划分资源，只支持硬限的模式。使用 Workload Group 的方式划分资源，既支持 Workload Group 软限，也支持硬限；Workload Group 软限通常被用于突发性的资源管控，如临时的查询高峰或短暂的数据写入增加。