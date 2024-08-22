---
{
"title": "使用Workload Group管理CPU资源",
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

Doris 的负载大体可以分为三类：
1. 核心报表查询，通常给公司高层查看报表使用，负载不一定很高，但是对可用性要求较高，这类查询可以划分到一个分组，配置较高优先级的软限，保证CPU资源不够时可以获得更多的CPU资源。
2. Adhoc类查询，这类查询通常偏探索分析，SQL比较随机，具体的资源用量也比较未知，优先级通常不高。因此可以使用CPU硬限进行管理，并配置较低的值，避免占用过多CPU资源降低集群可用性。
3. ETL类查询，这类查询的SQL比较固定，资源用量通常也比较稳定，偶尔会出现上游数据量增长导致资源用量暴涨的情况，因此可以使用CPU硬限进行配置。

不同的负载对CPU的消耗不一样，用户对响应延时的需求也不一样。当BE的CPU 被用的很满时，可用性会变差，响应延时会变高。比如可能一个Adhoc的分析类查询把整个集群的CPU打满，导致核心报表的延时变大，影响到了SLA。所以需要CPU 隔离机制来对不同的业务进行隔离，保障集群的可用性和SLA。
Workload Group支持CPU的软限和硬限，目前比较推荐在线上环境把Workload Group配置成硬限。原因是CPU的软限通常在CPU被打满时才能体现出优先级的作用，但是在CPU被用满时，Doris的内部组件（例如rpc组件）以及操作系统可用的CPU会减少，此时集群整体的可用性是下降比较严重的，因此生产环境通常需要避免CPU资源被打满的情况，当然其他资源也一样，内存资源同理。

## CPU硬限测试

### 测试环境
1FE，1BE，96核机器。
数据集为clickbench，测试sql为q29。

### 测试
1. 使用jmeter发起3并发查询，把BE进程的CPU使用压到比较高的使用率，这里测试的机器是96核，使用top命令看到BE进程CPU使用率为7600%的含义是该进程目前使用中的核数是76个。

![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 修改使用中的Workload Group的CPU硬限为10%。
```
alter workload group g2 properties('cpu_hard_limit'='10%');
```

3. 集群开启硬限模式，此时集群中所有Group都会切换为硬限。
```
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```

4. 重新压测查询负载，可以看到当前进程只能使用9到10个核，占总核数的10%左右。

![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

需要注意的是，这里的测试最好使用查询负载会比较能体现出效果，因为如果是高吞吐导入的话，可能会触发Compaction，使得实际观测的值要比Workload Group配置的值大。而Compaction的负载目前是没有归入Workload Group的管理的。

5. 除了使用Linux 的系统命令外，还可以通过使用Doris的系统表观察Group目前的CPU使用为10%左右。
```
mysql [information_schema]>select CPU_USAGE_PERCENT from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
+-------------------+
| CPU_USAGE_PERCENT |
+-------------------+
|              9.57 |
+-------------------+
1 row in set (0.02 sec)
```

## 注意事项
1. 在实际配置的时候，所有Group的CPU累加值最好不要正好等于100%，这主要是为了保证低延迟场景的可用性。因为需要让出一部分资源给其他组件使用。当然如果对延迟不是很敏感的场景，期望最高的资源利用率，那么可以考虑所有Group的CPU累加值配置等于100%。 
2. 目前FE向BE同步Workload Group元数据的时间间隔为30秒，因此对于Workload Group的变更最大需要等待30秒才能生效。