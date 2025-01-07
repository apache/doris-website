---
{
    "title": "弹性计算节点",
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

弹性计算节点作为一种特殊类型的 BE 节点，没有数据存储能力，只负责数据计算。因此，可以将计算节点看做是无状态的 BE 节点，可以方便的进行节点的增加和删除。

在湖仓数据分析场景中，弹性计算节点可用于查询外部数据源，如 Hive、Iceberg、Hudi、Paimon、JDBC 等。Doris 不负责外部数据源数据的存储，因此，可以使用弹性计算节点方便的扩展对外部数据源的计算能力。同时，计算节点也可以配置缓存目录，用于缓存外部数据源的热点数据，进一步加速数据读取。

弹性计算节点**适用于在 Doris 存算一体模式**，进行弹性资源控制。在 Doris 3.0 版本的存算分离架构下，BE 节点都是无状态的，因此不再需要单独的弹性计算节点。

## 计算节点的使用

### BE 节点类型

在存算一体模式下，BE 节点分为两类：

* Mix

  混合节点。即 BE 节点的默认类型。该类型的节点既参与计算，也负责 Doris 内表数据的存储。

* Computation

  弹性计算节点。不负责数据的存储，只负责数据计算。

### 添加计算节点

在 BE 的 `be.conf` 配置文件中增加配置：

`be_node_role=computation`

之后启动 BE 节点，该节点就会以 Computation 类型运行。

之后可以通过连接 Doris 并执行：

`ALTER SYSTEM ADD BACKEND`

添加这个 BE 节点。添加成功后，在 `SHOW BACKENDS` 的 `NodeRole` 列可以看到节点类型为 `computation`。

### 使用计算节点

需要再 FE 配置文件 `fe.conf` 中配置如下参数，以启用计算节点并控制计算节点的行为：

| 参数名称                                     | 说明                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefer_compute_node_for_external_table` | 默认为 `false`。如果设置为 `true`，外部表的查询将优先分配给计算节点。如果为 `false`，外部表的查询将分配给任意 BE 节点。如果集群内没有计算节点，则该参数无效果。                                                                                                           |
| `min_backend_num_for_external_table`     | 只有当 `prefer_compute_node_for_external_table` 为 `true` 时生效。如果集群内计算节点的个数小于这个值，外部表的查询会尝试获取一些混合节点来分配，以使节点总数达到这个值。如果集群内计算节点的个数大于这个值，外部表的查询将只分配给计算节点。在 2.0（含）版本之前，该参数的默认值为 3。2.1 版本之后，默认值为`-1`，表示只使用当前数量的计算节点 |

对 `min_backend_num_for_external_table` 的进一步举例说明：

假设集群内有 3 个计算节点，5 个混合节点。

如果 `min_backend_num_for_external_table` 设置小于等于 3。则外表查询只会使用 3 个计算节点。如果设置大于 3，假设为 6，则外表查询除了使用 3 个计算节点外，还会额外选择 3 个混合节点参与计算。

综上，该参数主要用于可参与外表计算的最少 BE 节点数量，并且会优先选择计算节点。调大这个参数，会让更多的 BE 节点（不限于计算节点）参与外表的查询处理；调小这个参数，则可以限制参与外表查询处理的 BE 节点数量。

> 注：
>
> 1. 2.1 版本之后，才支持 `min_backend_num_for_external_table` 设置为 `-1`。之前的版本，该参数必须为正数。且该参数只有在 `prefer_compute_node_for_external_table = true` 的情况下才生效。
>
> 2. 如果 `min_backend_num_for_external_table` 值大于总的 BE 节点数量，则最多只会选择全部的 BE。
>
> 3. 以上参数可以通过 `ADMIN SET FRONTEND CONFIG` 命令动态修改，不需要重启 FE 节点。且所有 FE 节点都需配置。或者在 `fe.conf` 中添加配置并重启 FE 节点。

## 最佳实践

### 联邦查询的负载隔离和弹性伸缩

在联邦查询场景下，用户可以专门部署一组计算节点，用于外表数据的查询。这样可以将外表的查询负载（如在 hive 上进行大数量分析）和内表的查询负载（如低延迟的快速数据分析）进行隔离。

同时，计算节点作为无状态的 BE 节点，可以方便的进行扩容和缩容。比如可以使用 k8s 部署一组弹性计算节点集群，在业务高峰期利用更多的计算节点进行数据湖分析，低谷期可以进行快速缩容以降低成本。

## 常见问题

1. 混合节点和计算节点能否相互转换

  计算节点可以转换为混合节点。但混合节点不可以转换为计算节点。

2. 计算节点是否需要配置数据存储目录

  需要。计算节点的数据存储目录不会存放用户数据，只会存放一些 BE 节点自身的信息文件，如 `cluster_id` 等。以及一些运行过程中的临时文件等。

  计算节点的存储目录只需要很少的磁盘空间即可（MB 级别），并且可以随时和节点一起销毁，不会对用户数据造成影响。

3. 计算节点和混合节点是否可以配置文件缓存目录

  [文件缓存](./data-cache.md) 通过缓存最近访问的远端存储系统 (HDFS 或对象存储) 的数据文件，加速后续访问相同数据的查询。

  计算节点和混合节点均可设置文件缓存目录。文件缓存目录需事先创建。

4. 计算节点是否需要通过 DECOMMISION 操作下线

  不需要。计算节点可以直接通过 `DROP BACKEND` 操作删除。
