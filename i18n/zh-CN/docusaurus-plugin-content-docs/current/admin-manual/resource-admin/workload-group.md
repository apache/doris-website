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

# WORKLOAD GROUP

<version since="dev"></version>

workload group 可限制组内任务在单个 be 节点上的计算资源和内存资源的使用。当前支持 query 绑定到 workload group。

## 版本说明
Workload Group 是从 2.0 版本开始支持的功能，Workload Group 在 2.0 版本和 2.1 版本的主要区别在于，2.0 版本的 Workload Group 不依赖 CGroup，而 2.1 版本的 Workload Group 依赖 CGroup，因此使用 2.1 版本的 Workload Group 时要配置 CGroup 的环境。

#### 升级到 2.0 版本
1 如果是从 1.2 版本升级到 2.0 版本时，建议 Doris 集群整体升级完成后，再开启 WorkloadGroup 功能。因为如果只升级单台 Follower 就开启此功能，由于 Master 的 FE 代码还没有更新，此时 Doris 集群中并没有 Workload Group 的元数据信息，这可能导致已升级的 Follower 节点的查询失败。建议的升级流程如下：
* 先把 Doris 集群整体代码升级到 2.0 版本。
* 再根据下文中***workload group 使用***的章节开始使用该功能。

#### 升级到 2.1 版本
2 如果代码版本是从 2.0 升级到 2.1 的，分为以下两种情况：

情况 1：在 2.1 版本如果已经使用了 Workload Group 功能，那么只需要参考下文中配置 cgroup v1 的流程即可使用新版本的 Workload Group 功能。

情况 2：如果在 2.0 版本没有使用 Workload Group 功能，那么也需要先把 Doris 集群整体升级到 2.1 版本后，再根据下文的***workload group 使用***的章节开始使用该功能。

## workload group 属性

* cpu_share: 可选，默认值为 1024，取值范围是正整数。用于设置 workload group 获取 cpu 时间的多少，可以实现 cpu 资源软隔离。cpu_share 是相对值，表示正在运行的 workload group 可获取 cpu 资源的权重。例如，用户创建了 3 个 workload group g-a、g-b 和 g-c，cpu_share 分别为 10、30、40，某一时刻 g-a 和 g-b 正在跑任务，而 g-c 没有任务，此时 g-a 可获得 25% (10 / (10 + 30)) 的 cpu 资源，而 g-b 可获得 75% 的 cpu 资源。如果系统只有一个 workload group 正在运行，则不管其 cpu_share 的值为多少，它都可获取全部的 cpu 资源。

* memory_limit: 可选，默认值 0%，不限制，取值范围 1%~100%，用于设置 workload group 可以使用 be 内存的百分比。Workload Group 可用的最大内存，所有 group 的累加值不可以超过 100%，通常与 enable_memory_overcommit 配合使用。如果一个机器的内存为 64G，mem_limit=50%，那么该 group 的实际物理内存=64G * 90%(be conf mem_limit) * 50%= 28.8G，这里的 90% 是 BE 进程级别的 mem_limit 参数，限制整个 BE 进程的内存用量。一个集群中所有 Workload Group 的 memory_limit 的累加值不能超过 100%。

* enable_memory_overcommit: 可选，用于开启 workload group 内存软隔离，默认为 true。如果设置为 false，则该 workload group 为内存硬隔离，系统检测到 workload group 内存使用超出限制后将立即 cancel 组内内存占用最大的若干个任务，以释放超出的内存；如果设置为 true，则该 workload group 为内存软隔离，如果系统有空闲内存资源则该 workload group 在超出 memory_limit 的限制后可继续使用系统内存，在系统总内存紧张时会 cancel 组内内存占用最大的若干个任务，释放部分超出的内存以缓解系统内存压力。建议在有 workload group 开启该配置时，所有 workload group 的 memory_limit 总和低于 100%，剩余部分用于 workload group 内存超发。

* cpu_hard_limit：可选，默认值 -1%，不限制。取值范围 1%~100%，CPU 硬限制模式下，Workload Group 最大可用的 CPU 百分比，不管当前机器的 CPU 资源是否被用满，Workload Group 的最大 CPU 用量都不能超过 cpu_hard_limit，
  所有 Workload Group 的 cpu_hard_limit 累加值不能超过 100%。2.1 版本新增属性
* max_concurrency：可选，最大查询并发数，默认值为整型最大值，也就是不做并发的限制。运行中的查询数量达到该值时，新来的查询会进入排队的逻辑。
* max_queue_size：可选，查询排队队列的长度，当排队队列已满时，新来的查询会被拒绝。默认值为 0，含义是不排队。
* queue_timeout：可选，查询在排队队列中的超时时间，单位为毫秒，如果查询在队列中的排队时间超过这个值，那么就会直接抛出异常给客户端。默认值为 0，含义是不排队。
* scan_thread_num：可选，当前 workload group 用于 scan 的线程个数，默认值为 -1，含义是不生效，此时以 be 配置中的 scan 线程数为准。取值为大于 0 的整数。

注意事项：

1 目前暂不支持 CPU 的软限和硬限的同时使用，一个集群某一时刻只能是软限或者硬限，下文中会描述切换方法。

2 所有属性均为可选，但是在创建 Workload Group 时需要指定至少一个属性。

## 配置 cgroup v1 的环境
Doris 的 2.0 版本使用基于 Doris 的调度实现 CPU 资源的限制，但是从 2.1 版本起，Doris 默认使用基于 CGroup v1 版本对 CPU 资源进行限制（暂不支持 CGroup v2），因此如果期望在 2.1 版本对 CPU 资源进行约束，那么需要 BE 所在的节点上已经安装好 CGroup v1 的环境。

用户如果在 2.0 版本使用了 Workload Group 的软限并升级到了 2.1 版本，那么也需要配置 CGroup，否则可能导致软限失效。

在不配置 cgroup 的情况下，用户可以使用 workload group 除 CPU 限制外的所有功能。

1 首先确认 BE 所在节点已经安装好 CGroup v1 版本，确认存在路径```/sys/fs/cgroup/cpu/```即可

2 在 cgroup 的 cpu 路径下新建一个名为 doris 的目录，这个目录名用户可以自行指定

```mkdir /sys/fs/cgroup/cpu/doris```

3 需要保证 Doris 的 BE 进程对于这个目录有读/写/执行权限
```
// 修改这个目录的权限为可读可写可执行
chmod 770 /sys/fs/cgroup/cpu/doris

// 把这个目录的归属划分给doris的账户
chown -R doris:doris /sys/fs/cgroup/cpu/doris
```

4 修改 BE 的配置，指定 cgroup 的路径
```
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris
```

5 重启 BE，在日志（be.INFO）可以看到"add thread xxx to group"的字样代表配置成功

需要注意的是，目前的 workload group 暂时不支持一个机器多个 BE 的部署方式。

## workload group 使用

1. 手动创建一个名为 normal 的 Workload Group，这个 Workload Group 为系统默认的 Workload Group，不可删除。
```
create workload group if not exists normal 
properties (
	'cpu_share'='1024',
	'memory_limit'='30%',
	'enable_memory_overcommit'='true'
);
```
normal Group 的作用在于，当你不为查询指定 Workload Group 时，查询会默认使用该 Group，从而避免查询失败。

2. 开启 experimental_enable_workload_group 配置项，在 fe.conf 中设置：
```
experimental_enable_workload_group=true
```

3. 如果期望使用其他 group 进行测试，那么可以创建一个自定义的 workload group，
```
create workload group if not exists g1
properties (
    "cpu_share"="1024",
    "memory_limit"="30%",
    "enable_memory_overcommit"="true"
);
```
此时配置的 CPU 限制为软限。

创建 workload group 详细可参考：[CREATE-WORKLOAD-GROUP](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-WORKLOAD-GROUP)，另删除 workload group 可参考[DROP-WORKLOAD-GROUP](../sql-manual/sql-reference/Data-Definition-Statements/Drop/DROP-WORKLOAD-GROUP)；修改 workload group 可参考：[ALTER-WORKLOAD-GROUP](../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-WORKLOAD-GROUP)；查看 workload group 可参考：[WORKLOAD_GROUPS()](../sql-manual/sql-functions/table-functions/workload-group)和[SHOW-WORKLOAD-GROUPS](../sql-manual/sql-reference/Show-Statements/SHOW-WORKLOAD-GROUPS)。

4. 开启 pipeline 执行引擎，workload group cpu 隔离基于 pipeline 执行引擎实现，因此需开启 session 变量：
```
set experimental_enable_pipeline_engine = true;
```

5. 绑定 workload group。
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

如果是非 admin 用户，需要先执行[SHOW-WORKLOAD-GROUPS](../sql-manual/sql-reference/Show-Statements/SHOW-WORKLOAD-GROUPS) 确认下当前用户能否看到该 workload group，不能看到的 workload group 可能不存在或者当前用户没有权限，执行查询时会报错。给 workload group 授权参考：[grant 语句](../sql-manual/sql-reference/Account-Management-Statements/GRANT)。

6. 执行查询，查询将关联到指定的 workload group。

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

需要注意的是，目前的排队设计是不感知 FE 的个数的，排队的参数只在单 FE 粒度生效，例如：

一个 Doris 集群配置了一个 work load group，设置 max_concurrency = 1
如果集群中有 1FE，那么这个 workload group 在 Doris 集群视角看同时只会运行一个 SQL
如果有 3 台 FE，那么在 Doris 集群视角看最大可运行的 SQL 个数为 3

### 配置 CPU 的硬限
目前 Doris 默认运行 CPU 的软限，如果期望使用 Workload Group 的硬限功能，可以按照如下流程操作。

1 在 FE 中开启 CPU 的硬限的功能，如果有多个 FE，那么需要在每个 FE 上都进行相同操作。
```
1 修改磁盘上fe.conf的配置
experimental_enable_cpu_hard_limit = true

2 修改内存中的配置
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```

2 修改 Workload Group 的 cpu_hard_limit 属性
```
alter workload group group1 properties ( 'cpu_hard_limit'='20%' );
```

3 查看当前的 Workload Group 的配置，可以看到尽管此时 cpu_share 的值可能不为 0，但是由于开启了硬限模式，那么查询在执行时也会走 CPU 的硬限。也就是说 CPU 软硬限的开关不影响元数据的修改。
```
mysql [(none)]>select name, cpu_share,memory_limit,enable_memory_overcommit,cpu_hard_limit from workload_groups() where name='group1';
+--------+-----------+--------------+--------------------------+----------------+
| Name   | cpu_share | memory_limit | enable_memory_overcommit | cpu_hard_limit |
+--------+-----------+--------------+--------------------------+----------------+
| group1 |        10 | 45%          | true                     | 20%            |
+--------+-----------+--------------+--------------------------+----------------+
1 row in set (0.03 sec)
```

### CPU 软硬限模式切换的说明
目前 Doris 暂不支持同时运行 CPU 的软限和硬限，一个 Doris 集群在任意时刻只能是 CPU 软限或者 CPU 硬限。
用户可以在两种模式之间进行切换，主要切换方法如下：

1 假如当前的集群配置是默认的 CPU 软限制，然后期望改成 CPU 的硬限，那么首先需要把 Workload Group 的 cpu_hard_limit 参数修改成一个有效的值
```
alter workload group group1 properties ( 'cpu_hard_limit'='20%' );
```
需要修改当前集群中所有的 Workload Group 的这个属性，所有 Workload Group 的 cpu_hard_limit 的累加值不能超过 100%
由于 CPU 的硬限无法给出一个有效的默认值，因此如果只打开开关但是不修改属性，那么 CPU 的硬限也无法生效。

2 在所有 FE 中打开 CPU 硬限的开关
```
1 修改磁盘上fe.conf的配置
experimental_enable_cpu_hard_limit = true

2 修改内存中的配置
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```

如果用户期望从 CPU 的硬限切换回 CPU 的软限，那么只需要在 FE 修改 enable_cpu_hard_limit 的值为 false 即可。
CPU 软限的属性 cpu_share 默认会填充一个有效值 1024(如果之前未指定 cpu_share 的值)，用户可以根据 group 的优先级对 cpu_share 的值进行重新调整。