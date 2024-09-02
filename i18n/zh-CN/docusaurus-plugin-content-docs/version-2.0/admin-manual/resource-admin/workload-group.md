---
{
    "title": "Workload Group",
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





Workload Group 可限制组内任务在单个 BE 节点上的计算资源和内存资源的使用。当前支持 Query 绑定到 Workload Group。

## Workload Group 属性

* cpu_share: 必选，用于设置 Workload Group 获取 CPU 时间的多少，可以实现 CPU 资源软隔离。cpu_share 是相对值，表示正在运行的 Workload Group 可获取 cpu 资源的权重。例如，用户创建了 3 个 Workload Group g-a、g-b 和 g-c，cpu_share 分别为 10、30、40，某一时刻 g-a 和 g-b 正在跑任务，而 g-c 没有任务，此时 g-a 可获得 25% (10 / (10 + 30)) 的 cpu 资源，而 g-b 可获得 75% 的 cpu 资源。如果系统只有一个 Workload Group 正在运行，则不管其 cpu_share 的值为多少，它都可获取全部的 cpu 资源。

* memory_limit: 必选，用于设置 Workload Group 可以使用 be 内存的百分比。Workload Group 内存限制的绝对值为：`物理内存 * mem_limit * memory_limit`，其中 mem_limit 为 be 配置项。系统所有 Workload Group 的 memory_limit 总合不可超过 100%。Workload Group 在绝大多数情况下保证组内任务可使用 memory_limit 的内存，当 Workload Group 内存使用超出该限制后，组内内存占用较大的任务可能会被 cancel 以释放超出的内存，参考 enable_memory_overcommit。

* enable_memory_overcommit: 可选，用于开启 Workload Group 内存软隔离，默认为 false。如果设置为 false，则该 Workload Group 为内存硬隔离，系统检测到 Workload Group 内存使用超出限制后将立即 cancel 组内内存占用最大的若干个任务，以释放超出的内存；如果设置为 true，则该 Workload Group 为内存软隔离，如果系统有空闲内存资源则该 Workload Group 在超出 memory_limit 的限制后可继续使用系统内存，在系统总内存紧张时会 cancel 组内内存占用最大的若干个任务，释放部分超出的内存以缓解系统内存压力。建议在有 Workload Group 开启该配置时，所有 Workload Group 的 memory_limit 总和低于 100%，剩余部分用于 Workload Group 内存超发。

## Workload Group 使用

1. 手动创建名为`normal`的Workload Group，该Group不可删除。也可以在打开Workload Group开关后重启FE，会自动创建这个Group。
```
create workload group if not exists normal
properties (
    "cpu_share"="10",
    "memory_limit"="30%",
    "enable_memory_overcommit"="true"
);
```

2. 开启 experimental_enable_workload_group 配置项，在 fe.conf 中设置：

```shell
experimental_enable_workload_group=true
```

3. 创建 Workload Group：

```
create workload group if not exists g1
properties (
    "cpu_share"="10",
    "memory_limit"="30%",
    "enable_memory_overcommit"="true"
);
```

创建 workload group 详细可参考：[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-WORKLOAD-GROUP)，另删除 Workload Group 可参考[DROP-WORKLOAD-GROUP](../../sql-manual/sql-reference/Data-Definition-Statements/Drop/DROP-WORKLOAD-GROUP)；修改 Workload Group 可参考：[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-WORKLOAD-GROUP)；查看 Workload Group 可参考：[WORKLOAD_GROUPS()](../../sql-manual/sql-functions/table-functions/workload-group)和[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-reference/Show-Statements/SHOW-WORKLOAD-GROUPS)。

4. 开启 Pipeline 执行引擎，Workload Group CPU 隔离基于 Pipeline 执行引擎实现，因此需开启 Session 变量：

```shell
set experimental_enable_pipeline_engine = true;
```

5. 绑定 Workload Group。

* 通过设置 user property 将 user 默认绑定到 workload group，默认为`normal`:
```
set property 'default_workload_group' = 'g1';
```
当前用户的查询将默认使用'g1'。

* 通过 session 变量指定 workload group, 默认为空：

```
set workload_group = 'g2';
```

session 变量`workload_group`优先于 user property `default_workload_group`, 在`workload_group`为空时，查询将绑定到`default_workload_group`, 在 session 变量`workload_group`不为空时，查询将绑定到`workload_group`。

如果是非 Admin 用户，需要先执行[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-reference/Show-Statements/SHOW-WORKLOAD-GROUPS) 确认下当前用户能否看到该 workload group，不能看到的 workload group 可能不存在或者当前用户没有权限，执行查询时会报错。给 worklaod group 授权参考：[grant 语句](../../sql-manual/sql-reference/Account-Management-Statements/GRANT)。

6. 执行查询，查询将关联到指定的 Workload Group。

### 查询排队功能
```
create workload group if not exists test_group
properties (
    "cpu_share"="10",
    "memory_limit"="30%",
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```
目前的 workload group 支持查询排队的功能，可以在新建 group 时进行指定，需要以下三个参数：

* max_concurrency，当前 group 允许的最大查询数;超过最大并发的查询到来时会进入排队逻辑

* max_queue_size，查询排队的长度;当队列满了之后，新来的查询会被拒绝

* queue_timeout，查询在队列中等待的时间，如果查询等待时间超过这个值，那么查询会被拒绝，时间单位为毫秒

需要注意的是，目前的排队设计是不感知 FE 的个数的，排队的参数只在单 FE 粒度生效，例如：

- 一个 Doris 集群配置了一个 Workload Group，设置 max_concurrency = 1

- 如果集群中有 1FE，那么这个 Workload Group 在 Doris 集群视角看同时只会运行一个 SQL

- 如果有 3 台 FE，那么在 Doris 集群视角看最大可运行的 SQL 个数为 3