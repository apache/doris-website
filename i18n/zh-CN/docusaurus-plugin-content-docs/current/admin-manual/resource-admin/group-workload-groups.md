---
{
"title": "Workload Group分组功能",
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

Workload Group分组功能常用于当一个Doris集群中有多个物理隔离的BE集群时，可以将Workload Group进行分组，不同分组的Workload Group可以绑定到不同的BE集群中。

## 推荐用法
假如目前集群中已有了两个隔离的BE子集群，命名为rg1和rg2，且这两个分组之间是完全物理隔离的，数据和计算不会有共享的情况。
那么比较推荐的配置方式是：
1. 把normal group的资源配置量尽量调小，作为保底的查询分组，比如查询如果不携带任何Workload Group信息，那么就会自动使用这个默认的group，作用是避免查询失败。
2. 为这两个子集群分别创建对应的Workload Group，绑定到对应的子集群上。
   例如，为rg1集群创建第一个名为wg1的Workload Group分组，包含Workload Group a和Workload Group b两个Workload Group。为rg2集群创建第二个名为wg2的Workload Group分组，包含Workload Group c和Workload Group d。
那么最终效果如下：

![rg1_rg2_workload_group](/images/workload-management/rg1_rg2_workload_group.png)

操作流程如下：

第一步：把数据副本绑定到BE节点，其实也就是完成rg1子集群和rg2子集群的划分，实现数据副本的隔离，如果集群已经完成了子集群的划分，那么可以跳过这个步骤，直接进入第二步。
1. 把数据副本绑定到rg1集群和rg2集群
```
-- 为rg1集群建表时需要指定副本分布到rg1
create table table1
(k1 int, k2 int)
distributed by hash(k1) buckets 1
properties(
    "replication_allocation"="tag.location.rg1:3"
)

-- 为rg2集群建表时需要指定副本分布到rg2
create table table2
(k1 int, k2 int)
distributed by hash(k1) buckets 1
properties(
    "replication_allocation"="tag.location.rg2:3"
)
```

2. 把BE节点绑定到rg1集群和rg2集群
```
-- 把be1和be2绑定到rg1集群
alter system modify backend "be1:9050" set ("tag.location" = "rg1");
alter system modify backend "be2:9050" set ("tag.location" = "rg1");

-- 把be3和be4绑定到rg2集群
alter system modify backend "be3:9050" set ("tag.location" = "rg2");
alter system modify backend "be4:9050" set ("tag.location" = "rg2");
```

第二步：把workload group绑定到BE节点
1. 新建workload group，并把workload group分别绑定到wg1和wg2
```
-- 创建wg1分组的workload group
create workload group a properties ("memory_limit"="45%","tag"="wg1")
create workload group b properties ("memory_limit"="45%","tag"="wg1")

-- 创建wg2分组的workload group
create workload group c properties ("memory_limit"="45%","tag"="wg2")
create workload group d properties ("memory_limit"="45%","tag"="wg2")
```

2. 把BE绑定到wg1和wg2，此时Workload Group a和b只会在be1和be2上生效。Workload Group c和d只会在be3和be4上生效。
（需要注意的是这里在修改时指定了tag.location，原因是修改BE配置的接口目前暂时不支持增量更新，因此在新加属性时要把存量的属性也携带上）
```
-- 把be1和be2绑定到wg1
alter system modify backend "be1:9050" set ("tag.location" = "rg1",tag.workload_group="wg1");
alter system modify backend "be2:9050" set ("tag.location" = "rg1",tag.workload_group="wg1");

-- 把be3和be4绑定到wg2
alter system modify backend "be3:9050" set ("tag.location" = "rg2",tag.workload_group="wg2");
alter system modify backend "be4:9050" set ("tag.location" = "rg2",tag.workload_group="wg2");
```

3. 调小normal workload group的资源用量，作为用户不携带Workload Group信息时保底可用的Workload Group，可以看到没有为normal group指定tag属性，因此normal可以在所有BE生效。
```
alter workload group normal properties("memory_limit=1%")
```
为了维护更加简单，BE的tag.location和tag.workload_group可以使用相同的值，也就是把rg1和wg1进行合并，rg2和wg2进行合并，统一使用一个名称。比如把BE的tag.workload_group设置为rg1，Workload Group a和b的tag也指定为rg1。


## 原理讲解
### 默认情况
用户新建了一个Doris的集群，集群中只有一个BE（默认为default分组），系统通常默认会创建一个名为normal的group，然后用户又创建了一个Workload Group A，各自分配50%的内存，那么此时集群中Workload Group的分布情况如下：

![group_wg_default](/images/workload-management/group_wg_default.png)

如果此时添加一个名为BE2的新BE，那么新BE中的分布情况如下：

![group_wg_add_be](/images/workload-management/group_wg_add_be.png)

新增BE的Workload Group的分布和现有BE相同。

### 添加新的BE集群
Doris支持BE物理隔离的功能，当添加新的BE节点(名为BE3)并划分到独立的分组时(新的BE分组命名为vip_group)，Workload Group的分组如下：

![group_wg_add_cluster](/images/workload-management/group_wg_add_cluster.png)

可以看到默认情况下，系统中的Workload Group会在所有的子集群生效，在有些场景下会具有一定的局限性。

### 对Workload Group使用分组的功能
假如集群中有vip_group和default两个物理隔离的BE集群，服务于不同的业务方，这两个业务方对于负载管理可能有不同的诉求。比如vip_group可能需要创建更多的Workload Group，每个Workload Group的资源配置和default分组的差异也比较大。

此时就需要Workload Group分组的功能解决这个问题，比如vip_group集群需要创建三个Workload Group，每个group可以获得均等的资源。

![group_wg_two_group](/images/workload-management/group_wg_two_group.png)

用户新建了三个workload group，分别名为vip_wg_1, vip_wg_2, vip_wg_3，并指定workload group的tag为vip_wg，含义为这三个workload group划分为一个分组，它们的内存资源累加值不能超过100%。
同时指定BE3的tag.workload_group属性为vip_wg，含义为只有指定了tag属性为vip_wg的Workload Group才会在BE3上生效。

BE1和BE2指定了tag.workload_group属性为default_wg，Workload Group normal和A则指定了tag为default_wg，因此normal和A只会在BE1和BE2上生效。

可以简单理解为，BE1和BE2是一个子集群，这个子集群拥有normal和A两个Workload Group;BE3是另一个子集群，这个子集群拥有vip_wg_1，vip_wg_2和vip_wg_3三个Workload Group。

:::tip
注意事项：

可以注意到上文中BE有两个属性，tag.location和tag.workload_group，这两个属性没有什么直接的关联。
tag.location用于指定BE归属于哪个数据副本分组，数据副本也有location属性，数据副本会被分发到具有相同location属性的BE，从而完成物理资源的隔离。

tag.workload_group用于指定BE归属于哪个Workload Group的分组，Workload Group也具有tag属性用于指定Workload Group归属于哪个分组，Workload Group也只会在具有分组的BE上生效。
Doris存算一体模式下，数据副本和计算通常是绑定的，因此也比较推荐BE的tag.location和tag.workload_group值是对齐的。
   :::

目前Workload Group的tag和Be的tag.workload_group的匹配规则为：
1. 当Workload Group的tag为空，那么这个Workload Group可以发送给所有的BE，不管该BE是否指定了tag。
2. 当Workload Group的tag不为空，那么Workload Group只会发送给具有相同标签的BE。


