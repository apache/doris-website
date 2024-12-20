---
{
"title": "Workload Group 分组功能",
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

Workload Group 分组功能常用于当一个 Doris 集群中有多个物理隔离的 BE 集群时，可以将 Workload Group 进行分组，不同分组的 Workload Group 可以绑定到不同的 BE 集群中。

## 推荐用法
假如目前集群中已有了两个隔离的 BE 子集群，命名为 rg1 和 rg2，且这两个分组之间是完全物理隔离的，数据和计算不会有共享的情况。
那么比较推荐的配置方式是：
1. 把 normal group 的资源配置量尽量调小，作为保底的查询分组，比如查询如果不携带任何 Workload Group 信息，那么就会自动使用这个默认的 group，作用是避免查询失败。
2. 为这两个子集群分别创建对应的 Workload Group，绑定到对应的子集群上。
   例如，为 rg1 集群创建第一个名为 wg1 的 Workload Group 分组，包含 Workload Group a 和 Workload Group b 两个 Workload Group。为 rg2 集群创建第二个名为 wg2 的 Workload Group 分组，包含 Workload Group c 和 Workload Group d。
   那么最终效果如下：

![rg1_rg2_workload_group](/images/workload-management/rg1_rg2_workload_group.png)

操作流程如下：

第一步：把数据副本绑定到 BE 节点，其实也就是完成 rg1 子集群和 rg2 子集群的划分，实现数据副本的隔离，如果集群已经完成了子集群的划分，那么可以跳过这个步骤，直接进入第二步。

1. 把数据副本绑定到 rg1 集群和 rg2 集群

    ```sql
    -- 为 rg1 集群建表时需要指定副本分布到 rg1
    create table table1
    (k1 int, k2 int)
    distributed by hash(k1) buckets 1
    properties(
        "replication_allocation"="tag.location.rg1:3"
    )

    -- 为 rg2 集群建表时需要指定副本分布到 rg2
    create table table2
    (k1 int, k2 int)
    distributed by hash(k1) buckets 1
    properties(
        "replication_allocation"="tag.location.rg2:3"
    )
    ```

2. 把 BE 节点绑定到 rg1 集群和 rg2 集群

    ```sql
    -- 把 be1 和 be2 绑定到 rg1 集群
    alter system modify backend "be1:9050" set ("tag.location" = "rg1");
    alter system modify backend "be2:9050" set ("tag.location" = "rg1");

    -- 把 be3 和 be4 绑定到 rg2 集群
    alter system modify backend "be3:9050" set ("tag.location" = "rg2");
    alter system modify backend "be4:9050" set ("tag.location" = "rg2");
    ```

第二步：把 workload group 绑定到 BE 节点

1. 新建 workload group，并把 workload group 分别绑定到 wg1 和 wg2
  
    ```sql
    -- 创建 wg1 分组的 workload group
    create workload group a properties ("memory_limit"="45%","tag"="wg1")
    create workload group b properties ("memory_limit"="45%","tag"="wg1")

    -- 创建 wg2 分组的 workload group
    create workload group c properties ("memory_limit"="45%","tag"="wg2")
    create workload group d properties ("memory_limit"="45%","tag"="wg2")
    ```

2. 把 BE 绑定到 wg1 和 wg2，此时 Workload Group a 和 b 只会在 be1 和 be2 上生效。Workload Group c 和 d 只会在 be3 和 be4 上生效。
   （需要注意的是这里在修改时指定了 tag.location，原因是修改 BE 配置的接口目前暂时不支持增量更新，因此在新加属性时要把存量的属性也携带上）

    ```sql
    -- 把 be1 和 be2 绑定到 wg1
    alter system modify backend "be1:9050" set ("tag.location" = "rg1",tag.workload_group="wg1");
    alter system modify backend "be2:9050" set ("tag.location" = "rg1",tag.workload_group="wg1");

    -- 把 be3 和 be4 绑定到 wg2
    alter system modify backend "be3:9050" set ("tag.location" = "rg2",tag.workload_group="wg2");
    alter system modify backend "be4:9050" set ("tag.location" = "rg2",tag.workload_group="wg2");
    ```

3. 调小 normal workload group 的资源用量，作为用户不携带 Workload Group 信息时保底可用的 Workload Group，可以看到没有为 normal group 指定 tag 属性，因此 normal 可以在所有 BE 生效。

    ```sql
    alter workload group normal properties("memory_limit"="1%")
    ```

为了维护更加简单，BE 的 tag.location 和 tag.workload_group 可以使用相同的值，也就是把 rg1 和 wg1 进行合并，rg2 和 wg2 进行合并，统一使用一个名称。比如把 BE 的 tag.workload_group 设置为 rg1，Workload Group a 和 b 的 tag 也指定为 rg1。


## 原理讲解
### 默认情况
用户新建了一个 Doris 的集群，集群中只有一个 BE（默认为 default 分组），系统通常默认会创建一个名为 normal 的 group，然后用户又创建了一个 Workload Group A，各自分配 50% 的内存，那么此时集群中 Workload Group 的分布情况如下：

![group_wg_default](/images/workload-management/group_wg_default.png)

如果此时添加一个名为 BE2 的新 BE，那么新 BE 中的分布情况如下：

![group_wg_add_be](/images/workload-management/group_wg_add_be.png)

新增 BE 的 Workload Group 的分布和现有 BE 相同。

### 添加新的 BE 集群
Doris 支持 BE 物理隔离的功能，当添加新的 BE 节点 (名为 BE3) 并划分到独立的分组时 (新的 BE 分组命名为 vip_group)，Workload Group 的分组如下：

![group_wg_add_cluster](/images/workload-management/group_wg_add_cluster.png)

可以看到默认情况下，系统中的 Workload Group 会在所有的子集群生效，在有些场景下会具有一定的局限性。

### 对 Workload Group 使用分组的功能
假如集群中有 vip_group 和 default 两个物理隔离的 BE 集群，服务于不同的业务方，这两个业务方对于负载管理可能有不同的诉求。比如 vip_group 可能需要创建更多的 Workload Group，每个 Workload Group 的资源配置和 default 分组的差异也比较大。

此时就需要 Workload Group 分组的功能解决这个问题，比如 vip_group 集群需要创建三个 Workload Group，每个 group 可以获得均等的资源。

![group_wg_two_group](/images/workload-management/group_wg_two_group.png)

用户新建了三个 workload group，分别名为 vip_wg_1, vip_wg_2, vip_wg_3，并指定 workload group 的 tag 为 vip_wg，含义为这三个 workload group 划分为一个分组，它们的内存资源累加值不能超过 100%。
同时指定 BE3 的 tag.workload_group 属性为 vip_wg，含义为只有指定了 tag 属性为 vip_wg 的 Workload Group 才会在 BE3 上生效。

BE1 和 BE2 指定了 tag.workload_group 属性为 default_wg，Workload Group normal 和 A 则指定了 tag 为 default_wg，因此 normal 和 A 只会在 BE1 和 BE2 上生效。

可以简单理解为，BE1 和 BE2 是一个子集群，这个子集群拥有 normal 和 A 两个 Workload Group;BE3 是另一个子集群，这个子集群拥有 vip_wg_1，vip_wg_2 和 vip_wg_3 三个 Workload Group。

:::tip 注意事项

可以注意到上文中 BE 有两个属性，tag.location 和 tag.workload_group，这两个属性没有什么直接的关联。
tag.location 用于指定 BE 归属于哪个数据副本分组，数据副本也有 location 属性，数据副本会被分发到具有相同 location 属性的 BE，从而完成物理资源的隔离。

tag.workload_group 用于指定 BE 归属于哪个 Workload Group 的分组，Workload Group 也具有 tag 属性用于指定 Workload Group 归属于哪个分组，Workload Group 也只会在具有分组的 BE 上生效。
Doris 存算一体模式下，数据副本和计算通常是绑定的，因此也比较推荐 BE 的 tag.location 和 tag.workload_group 值是对齐的。
:::

目前 Workload Group 的 tag 和 Be 的 tag.workload_group 的匹配规则为：
1. 当 Workload Group 的 tag 为空，那么这个 Workload Group 可以发送给所有的 BE，不管该 BE 是否指定了 tag。
2. 当 Workload Group 的 tag 不为空，那么 Workload Group 只会发送给具有相同标签的 BE。