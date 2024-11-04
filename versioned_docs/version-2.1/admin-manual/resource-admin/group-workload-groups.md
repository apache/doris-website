---
{
"title": "Grouping Workload Groups",
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

The Workload Group grouping function is commonly used when there are multiple physically isolated BE clusters in a Doris cluster. Workload Groups can be grouped, and different groups of Workload Groups can be bound to different BE clusters.

## Recommended usage

If there are currently two isolated BE sub-clusters in the cluster, named rg1 and rg2, and these two groups are completely physically isolated, with no shared data or computation, the recommended configuration approach is as follows:

1. Reduce the resource allocation for the normal group as much as possible, serving as a fallback query group. For example, if a query does not carry any Workload Group information, it will automatically use this default group to avoid query failures.

2. Create corresponding Workload Groups for these two sub-clusters and bind them to the respective sub-clusters. For instance, create the first Workload Group named wg1 for the rg1 cluster, which includes Workload Group a and Workload Group b. Create the second Workload Group named wg2 for the rg2 cluster, which includes Workload Group c and Workload Group d.

The final effect will be as follows:

![rg1_rg2_workload_group](/images/workload-management/rg1_rg2_workload_group.png)

The operating process is as follows:

Step 1: Bind the data replicas to the BE nodes, which essentially completes the division of the rg1 and rg2 sub-clusters, achieving isolation of the data replicas. If the cluster has already completed the division into sub-clusters, this step can be skipped, and you can proceed directly to Step 2.
1. Bind the data replicas to the rg1 and rg2 clusters.
```
-- When creating tables for the rg1 cluster, it is necessary to specify that the replicas are distributed to rg1.
create table table1
(k1 int, k2 int)
distributed by hash(k1) buckets 1
properties(
    "replication_allocation"="tag.location.rg1:3"
)

-- When creating tables for the rg2 cluster, it is necessary to specify that the replicas are distributed to rg2.
create table table2
(k1 int, k2 int)
distributed by hash(k1) buckets 1
properties(
    "replication_allocation"="tag.location.rg2:3"
)
```

2. Bind the BE nodes to the rg1 and rg2 clusters.
```
-- Bind be1 and be2 to the rg1 cluster.
alter system modify backend "be1:9050" set ("tag.location" = "rg1");
alter system modify backend "be2:9050" set ("tag.location" = "rg1");

-- Bind be3 and be3 to the rg2 cluster.
alter system modify backend "be3:9050" set ("tag.location" = "rg2");
alter system modify backend "be4:9050" set ("tag.location" = "rg2");
```

Step 2: Bind the workload group to the BE nodes.
1. Create a new workload group and bind it to wg1 and wg2 respectively.
```
-- Create a workload group for the wg1 group.
create workload group a properties ("memory_limit"="45%","tag"="wg1")
create workload group b properties ("memory_limit"="45%","tag"="wg1")

-- Create a workload group for the wg2 group.
create workload group c properties ("memory_limit"="45%","tag"="wg2")
create workload group d properties ("memory_limit"="45%","tag"="wg2")
```

2. Bind the BE to wg1 and wg2. At this point, Workload Group a and b will only take effect on be1 and be2, while Workload Group c and d will only take effect on be3 and be4.

(Note that when modifying, the tag.location is specified here because the current interface for modifying BE configurations does not support incremental updates. Therefore, when adding new attributes, you must also carry over the existing attributes.)
```
-- Bind be1 and be2 to wg1.
alter system modify backend "be1:9050" set ("tag.location" = "rg1",tag.workload_group="wg1");
alter system modify backend "be2:9050" set ("tag.location" = "rg1",tag.workload_group="wg1");

-- Bind be3 and be4 to wg2.
alter system modify backend "be3:9050" set ("tag.location" = "rg2",tag.workload_group="wg2");
alter system modify backend "be4:9050" set ("tag.location" = "rg2",tag.workload_group="wg2");
```

3. Reduce the resource usage of the normal workload group, serving as a fallback workload group when users do not carry Workload Group information. It can be observed that no tag attributes have been specified for the normal group, allowing it to be effective on all BE nodes.
```
alter workload group normal properties("memory_limit=1%")
```
To simplify maintenance, the BE's tag.location and tag.workload_group can use the same value, effectively merging rg1 with wg1 and rg2 with wg2 under a unified name. For example, set the BE's tag.workload_group to rg1, and also specify the tag for Workload Group a and b as rg1.


## Principle explanation
### Default situation
The user has created a new Doris cluster with only one BE (defaulting to the default group). The system typically creates a group named normal by default. The user then creates a Workload Group A, with each group allocated 50% of the memory. At this point, the distribution of Workload Groups in the cluster is as follows:

![group_wg_default](/images/workload-management/group_wg_default.png)

If a new BE named BE2 is added at this point, the Workload Group distribution in the new BE will be as follows:：

![group_wg_add_be](/images/workload-management/group_wg_add_be.png)

The distribution of Workload Groups in the new BE is the same as in the existing BE.

### Add a new BE cluster
Doris supports the feature of physical isolation for BE nodes. When a new BE node (named BE3) is added and assigned to a separate group (the new BE group is named vip_group), the distribution of Workload Groups is as follows:

![group_wg_add_cluster](/images/workload-management/group_wg_add_cluster.png)

It can be seen that by default, the Workload Group in the system is effective across all sub-clusters, which may have certain limitations in some scenarios.

### Grouping Workload Groups
Suppose there are two physically isolated BE clusters in the cluster: vip_group and default, serving different business entities. These two entities may have different requirements for load management. For instance, vip_group may need to create more Workload Groups, and the resource configurations for each Workload Group may differ significantly from those of the default group.

In this case, the functionality of Workload Group grouping is needed to address this issue. For example, the vip_group cluster needs to create three Workload Groups, each of which can obtain equal resources.

![group_wg_two_group](/images/workload-management/group_wg_two_group.png)

The user has created three workload groups, named vip_wg_1, vip_wg_2, and vip_wg_3, and specified the tag for the workload groups as vip_wg. This means that these three workload groups are categorized into one group, and their combined memory resource allocation cannot exceed 100%.

At the same time, the tag.workload_group attribute for BE3 is set to vip_wg, meaning that only Workload Groups with the tag attribute set to vip_wg will take effect on BE3.

BE1 and BE2 have their tag.workload_group attribute set to default_wg, and the Workload Groups normal and A are also assigned the tag default_wg, so normal and A will only take effect on BE1 and BE2.

It can be simply understood that BE1 and BE2 form one sub-cluster, which has two Workload Groups: normal and A; while BE3 forms another sub-cluster, which has three Workload Groups: vip_wg_1, vip_wg_2, and vip_wg_3.

:::tip
NOTE：

It can be noted that the BE has two attributes: tag.location and tag.workload_group, which are not directly related.

The tag.location is used to specify which data replica group the BE belongs to. The data replicas also have a location attribute, and the replicas are distributed to BEs with the same location attribute, thereby achieving physical resource isolation.

The tag.workload_group is used to specify which Workload Group the BE belongs to. Workload Groups also have a tag attribute to indicate which group they belong to, and Workload Groups will only take effect on BEs with the specified grouping.

In the Doris integrated storage and computing mode, data replicas and computation are typically bound together. Therefore, it is also recommended that the values of BE's tag.location and tag.workload_group be the same value.
:::


"The current matching rules for the Workload Group tag and the BE's tag.workload_group are as follows:
1. When the Workload Group tag is empty, this Workload Group can be sent to all BEs, regardless of whether the BE has specified a tag.
2. When the Workload Group tag is not empty, the Workload Group will only be sent to BEs with the same tag.


