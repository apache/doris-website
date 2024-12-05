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

你可以使用 Workload Group 管理 Doris 集群中查询和导入负载所使用的 CPU/内存/IO 资源用量，控制集群中查询的最大并发。Workload Group 的使用权限可以授予给特定的角色和用户。

在以下场景使用 Workload Group 通常会取得不错的效果：
1. 偏好性能稳定性的场景，不要求查询负载可以占满集群所有的资源，但是期望查询的延迟比较稳定，那么可以尝试把 Workload Group 的 CPU/IO 配置成硬限。
2. 当集群整体负载过高导致可用性下降时，此时可以通过对集群中资源占用过高的 WorkloadGroup 进行降级处理来恢复集群的可用性，例如降低 Workload Group 的最大查询并发和 IO 吞吐。

通常使用硬限对资源进行管理可以获得更好的稳定性和性能，例如配置 FE 的最大并发以及 CPU 的硬限。
因为 CPU 的软限通常只有在 CPU 在用满时才能体现效果，而此时 Doris 内部的其他组件（RPC）以及操作系统可用的 CPU 资源会受到挤压，系统整体的延迟就会增加。
对 Doris 的查询负载配置硬限能有效缓解这个问题。同时配置最大并发和排队，可以缓解高峰时持续不断地新查询进来耗尽集群中的所有可用资源的情况。

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
  所有 Workload Group 的 cpu_hard_limit 累加值不能超过 100%。2.1 版本新增属性，2.0 版本不支持该功能。
* max_concurrency：可选，最大查询并发数，默认值为整型最大值，也就是不做并发的限制。运行中的查询数量达到该值时，新来的查询会进入排队的逻辑。
* max_queue_size：可选，查询排队队列的长度，当排队队列已满时，新来的查询会被拒绝。默认值为 0，含义是不排队。
* queue_timeout：可选，查询在排队队列中的超时时间，单位为毫秒，如果查询在队列中的排队时间超过这个值，那么就会直接抛出异常给客户端。默认值为 0，含义是不排队。
* scan_thread_num：可选，当前 workload group 用于 scan 的线程个数，默认值为 -1，含义是不生效，此时以 be 配置中的 scan 线程数为准。取值为大于 0 的整数。
* max_remote_scan_thread_num：可选，读外部数据源的 scan 线程池的最大线程数，默认值为 -1，当该值为 -1 时，实际的线程数由 BE 自行决定，通常和核数相关。
* min_remote_scan_thread_num：可选，读外部数据源的 scan 线程池的最小线程数，默认值为 -1，当该值为 -1 时，实际的线程数由 BE 自行决定，通常和核数相关。
* tag：可选，默认为空，为 Workload Group 指定标签，相同标签的 Workload Group 资源累加值不能超过 100%，如果期望指定多个值，可以使用英文逗号分隔，关于打标功能下文会有详细描述。
* read_bytes_per_second：可选，含义为读 Doris 内表时的最大 IO 吞吐，默认值为 -1，也就是不限制 IO 带宽。需要注意的是这个值并不绑定磁盘，而是绑定文件夹。
比如为 Doris 配置了 2 个文件夹用于存放内表数据，那么每个文件夹的最大读 IO 不会超过该值，如果这 2 个文件夹都配置到同一块盘上，最大吞吐控制就会变成 2 倍的 read_bytes_per_second。落盘的文件目录也受该值的约束。
* remote_read_bytes_per_second：可选，含义为读 Doris 外表时的最大 IO 吞吐，默认值为 -1，也就是不限制 IO 带宽。

注意事项：

1. 目前暂不支持 CPU 的软限和硬限的同时使用，一个集群某一时刻只能是软限或者硬限，下文中会描述切换方法。

2. 所有属性均为可选，但是在创建 Workload Group 时需要指定至少一个属性。

3. 需要注意 cgroup v1 和 cgroup v2 版本 cpu 软限默认值是有区别的，cgroup v1 的 cpu 软限默认值为 1024，取值范围为 2 到 262144。而 cgroup v2 的 cpu 软限默认值为 100，取值范围是 1 到 10000。
如果软限填了一个超出范围的值，这会导致 cpu 软限在 BE 修改失败。还有就是在 cgroup v1 的环境上如果按照 cgroup v2 的默认值 100 设置，这可能导致这个 workload group 的优先级在该机器上是最低的。


## Workload Group 分组功能
Workload Group 功能是对单台 BE 资源用量的划分。当用户创建了一个 Group A，默认情况下这个 Group A 的元信息会被发送到所有 BE 上并启动线程，这会带来以下问题：
1. 生产环境下通常会在一个 Doris 集群内拆分出多个小集群，比如拆分出本地存储的集群和用于查外部存储的包含 ComputeNode 的集群，这两个集群间的查询是独立的。
此时用户如果期望使用 Workload Group 功能，那么就会出现查外部存储的负载使用的 Workload Group 和查本地存储的负载使用的 Workload Group 的 mem_limit 累加值不能超过 100%，然而实际上这两种负载完全位于不同的机器上，这显然是不合理的。
2. 线程数本身也是一种资源，如果一个进程的线程数配额被耗尽，这会导致进程挂掉，默认把 Workload Group 的元信息发送给所有节点本身也是不合理的。

基于以上原因，Doris 实现了对于 Workload Group 的分组功能，相同 Tag 分组下的 Workload Group 的累加值不能超过 100%，但是一个集群中就可以有多个这样的 Tag 分组。
当一个 BE 节点也被打上了 Tag，那么这个 BE 会根据一定的规则匹配对应的 Workload Group。

具体用法如下：
1. 创建名为 tag_wg 的 Workload Group，指定其 tag 名为 cn1，此时如果集群中的 BE 都没有打标签的话，那么这个 Workload Group 的元信息会被发送到所有 BE 上。tag 属性可以指定多个，使用英文逗号分隔。
```
create workload group tag_wg properties('tag'='cn1');
```
2. 修改集群中一个 BE 的标签为 cn1，此时 tag_wg 这个 Workload Group 就只会发送到这个 BE 以及标签为空的 BE 上。tag.workload_group 属性可以指定多个，使用英文逗号分隔。
需要注意的是，alter 接口目前不支持增量更新，每次修改 BE 的属性都需要增加全量的属性，因此下面语句中添加了 tag.location 属性，default 为系统默认值，实际修改时需要按照 BE 原有属性指定。
```
alter system modify backend "localhost:9050" set ("tag.workload_group" = "cn1", "tag.location"="default");
```

Workload Group 和 BE 的匹配规则说明：
1. 当 Workload Group 的 Tag 为空，那么这个 Workload Group 可以发送给所有的 BE，不管该 BE 是否指定了 tag。
2. 当 Workload Group 的 Tag 不为空，那么 Workload Group 只会发送给具有相同标签的 BE。

推荐用法可以参考：[Workload Group 分组功能](./group-workload-groups.md)

## 配置 cgroup 的环境
Doris 的 2.0 版本使用基于 Doris 的调度实现 CPU 资源的限制，但是从 2.1 版本起，Doris 默认使用基于 CGroup 对 CPU 资源进行限制，因此如果期望在 2.1 版本对 CPU 资源进行约束，那么需要 BE 所在的节点上已经安装好 CGroup 的环境。

目前支持的 CGroup 版本为 CGroup v1 和 CGroup v2。

用户如果在 2.0 版本使用了 Workload Group 的软限并升级到了 2.1 版本，那么也需要配置 CGroup，否则可能导致软限失效。

如果是在容器内使用 CGroup，需要容器具备操作宿主机的权限。

在不配置 CGroup 的情况下，用户可以使用 Workload Group 除 CPU 限制外的所有功能。

1. 首先确认 BE 所在节点是否已经安装好 GGroup
```
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```

2. 确认目前生效的 CGroup 版本
```
如果存在这个路径说明目前生效的是cgroup v1
/sys/fs/cgroup/cpu/

如果存在这个路径说明目前生效的是cgroup v2
/sys/fs/cgroup/cgroup.controllers
```

3. 在 CGroup 路径下新建一个名为 doris 的目录，这个目录名用户可以自行指定

```
如果是cgroup v1就在cpu目录下新建
mkdir /sys/fs/cgroup/cpu/doris

如果是cgroup v2就在直接在cgroup目录下新建
mkdir /sys/fs/cgroup/doris
```

4. 需要保证 Doris 的 BE 进程对于这个目录有读/写/执行权限
```
// 如果是CGroup v1，那么命令如下:
// 1. 修改这个目录的权限为可读可写可执行
chmod 770 /sys/fs/cgroup/cpu/doris

// 2. 把这个目录的归属划分给doris的账户
chown -R doris:doris /sys/fs/cgroup/cpu/doris


// 如果是CGroup v2，那么命令如下:
// 1. 修改这个目录的权限为可读可写可执行
chmod 770 /sys/fs/cgroup/doris

// 2. 把这个目录的归属划分给doris的账户
chown -R doris:doris /sys/fs/cgroup/doris
```

5. 如果目前环境里使用的是 GGroup v2 版本，那么需要做以下操作。这是因为 CGroup v2 对于权限管控比较严格，需要具备根目录的 cgroup.procs 文件的写权限才能实现进程在 group 之间的移动。
如果是 CGroup v1 那么不需要这一步。
```
chmod a+w /sys/fs/cgroup/cgroup.procs
```

6. 修改 BE 的配置，指定 cgroup 的路径
```
如果是Cgroup v1，那么配置路径如下
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

如果是Cgroup v2，那么配置路径如下
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```

7. 重启 BE，在日志（be.INFO）可以看到"add thread xxx to group"的字样代表配置成功

:::tip
注意事项：
1. 目前的 workload group 暂时不支持一个机器多个 BE 的部署方式。
2. 当机器重启之后，上面的 cgroup 配置就会清空。如果期望上述配置重启之后可以也可以生效，可以使用 systemd 把以上操作设置成系统的自定义服务，这样在每次机器重启的时候，自动完成创建和授权操作。
:::

## 在 K8S 中使用 Workload Group 的注意事项
Workload 的 CPU 管理是基于 CGroup 实现的，如果期望在容器中使用 Workload Group，那么需要以特权模式启动容器，容器内的 Doris 进程才能具备读写宿主机 CGroup 文件的权限。
当 Doris 在容器内运行时，Workload Group 的 CPU 资源用量是在容器可用资源的情况下再划分的，例如宿主机整机是 64 核，容器被分配了 8 个核的资源，Workload Group 配置的 CPU 硬限为 50%，
那么 Workload Group 实际可用核数为 4 个（8 核 * 50%）。

WorkloadGroup 的内存管理和 IO 管理功能是 Doris 内部实现，不依赖外部组件，因此在容器和物理机上部署使用并没有区别。

如果要在 K8S 上使用 Doris，建议使用 Doris Operator 进行部署，可以屏蔽底层的权限细节问题。

## workload group 使用
1. 首先创建一个自定义的 workload group。
```
create workload group if not exists g1
properties (
    "cpu_share"="1024",
    "memory_limit"="30%",
    "enable_memory_overcommit"="true"
);
```
此时配置的 CPU 限制为软限。自 2.1 版本起，系统会自动创建一个名为```normal```的 group，不可删除。创建 workload group 详细使用可参考：[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)，

2. 查看/修改/删除 workload group 语句如下：
```
show workload groups;

alter workload group g1 properties('memory_limit'='10%');

drop workload group g1;

```
查看 workload group 可访问 Doris 系统表```information_schema.workload_groups```或者使用命令[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)。删除 workload group 可参考[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)；修改 workload group 可参考：[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)。

3. 绑定 workload group。
* 通过设置 user property 将 user 默认绑定到 workload group，默认为`normal`，需要注意的这里的 value 不能填空，否则语句会执行失败，如果不知道要设置哪些 group，可以设置为`normal`，`normal`为全局默认的 group。
```
set property 'default_workload_group' = 'g1';
```
执行完该语句后，当前用户的查询将默认使用'g1'。

* 通过 session 变量指定 workload group, 默认为空：
```
set workload_group = 'g1';
```
session 变量`workload_group`优先于 user property `default_workload_group`, 在`workload_group`为空时，查询将绑定到`default_workload_group`, 在 session 变量`workload_group`不为空时，查询将绑定到`workload_group`。

如果是非 admin 用户，需要先执行[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS) 确认下当前用户能否看到该 workload group，不能看到的 workload group 可能不存在或者当前用户没有权限，执行查询时会报错。给 workload group 授权参考：[grant 语句](../../sql-manual/sql-statements/account-management/GRANT-TO)。

4. 执行查询，查询将关联到指定的 workload group。

### 查询排队功能
```
create workload group if not exists queue_group
properties (
    "cpu_share"="10",
    "memory_limit"="30%",
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```

1. 需要注意的是，目前的排队设计是不感知 FE 的个数的，排队的参数只在单 FE 粒度生效，例如：

一个 Doris 集群配置了一个 work load group，设置 max_concurrency = 1
如果集群中有 1FE，那么这个 workload group 在 Doris 集群视角看同时只会运行一个 SQL
如果有 3 台 FE，那么在 Doris 集群视角看最大可运行的 SQL 个数为 3

2. 在有些运维情况下，管理员账户需要绕开排队的逻辑，那么可以通过设置 session 变量：
```
set bypass_workload_group = true;
```

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
alter workload group g1 properties ( 'cpu_hard_limit'='20%' );
```

3 查看当前的 Workload Group 的配置，可以看到尽管此时 cpu_share 的值可能不为 0，但是由于开启了硬限模式，那么查询在执行时也会走 CPU 的硬限。也就是说 CPU 软硬限的开关不影响元数据的修改。
```
mysql [information_schema]>select name, cpu_share,memory_limit,enable_memory_overcommit,cpu_hard_limit from information_schema.workload_groups where name='g1';
+------+-----------+--------------+--------------------------+----------------+
| name | cpu_share | memory_limit | enable_memory_overcommit | cpu_hard_limit |
+------+-----------+--------------+--------------------------+----------------+
| g1   |      1024 | 30%          | true                     | 20%            |
+------+-----------+--------------+--------------------------+----------------+
1 row in set (0.02 sec)
```

### CPU 软硬限模式切换的说明
目前 Doris 暂不支持同时运行 CPU 的软限和硬限，一个 Doris 集群在任意时刻只能是 CPU 软限或者 CPU 硬限。
用户可以在两种模式之间进行切换，主要切换方法如下：

1 假如当前的集群配置是默认的 CPU 软限制，然后期望改成 CPU 的硬限，那么首先需要把 Workload Group 的 cpu_hard_limit 参数修改成一个有效的值
```
alter workload group test_group properties ( 'cpu_hard_limit'='20%' );
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

# Workload Group 权限表
可以通过 Workload Group 权限表查看 user 或者 role 有权限访问的 Workload Group，授权相关的用法可以参考[grant 语句](../../sql-manual/sql-statements/account-management/GRANT-TO)。

该表目前存在行级别的权限控制，root 或者 admin 账户可以查看所有的数据，非 root/admin 账户只能看到自己有权限访问的 Workload Group 的数据。

Workload Group 权限表结构如下：
```
mysql [information_schema]>desc information_schema.workload_group_privileges;
+---------------------+--------------+------+-------+---------+-------+
| Field               | Type         | Null | Key   | Default | Extra |
+---------------------+--------------+------+-------+---------+-------+
| GRANTEE             | varchar(64)  | Yes  | false | NULL    |       |
| WORKLOAD_GROUP_NAME | varchar(256) | Yes  | false | NULL    |       |
| PRIVILEGE_TYPE      | varchar(64)  | Yes  | false | NULL    |       |
| IS_GRANTABLE        | varchar(3)   | Yes  | false | NULL    |       |
+---------------------+--------------+------+-------+---------+-------+
```

字段说明：
1. grantee，代表 user 或者 role。
2. workload_group_name，取值为 Workload Group 的名称或者%，%代表可以访问所有的 Workload Group。
3. privilege_type，权限的类型，目前该列的值只有 Usage_priv。
4. is_grantable，取值为 YES 或者 NO，字段含义为是否可以给其他用户授予 Workload Group 的访问权限。目前只有 root 用户或者 admin 用户这个字段为 YES，其他用户都为 NO。

基本用法：
1. 根据用户名查找有权限访问的 Workload Group
```
mysql [information_schema]>select * from workload_group_privileges where GRANTEE like '%test_wlg_user%';
+---------------------+---------------------+----------------+--------------+
| GRANTEE             | WORKLOAD_GROUP_NAME | PRIVILEGE_TYPE | IS_GRANTABLE |
+---------------------+---------------------+----------------+--------------+
| 'test_wlg_user'@'%' | normal              | Usage_priv     | NO           |
| 'test_wlg_user'@'%' | test_group          | Usage_priv     | NO           |
+---------------------+---------------------+----------------+--------------+
2 rows in set (0.04 sec)
```

2. 查看某个 Workload Group 可以有哪些用户访问
```
mysql [information_schema]>select * from workload_group_privileges where WORKLOAD_GROUP_NAME='test_group';
+---------------------+---------------------+----------------+--------------+
| GRANTEE             | WORKLOAD_GROUP_NAME | PRIVILEGE_TYPE | IS_GRANTABLE |
+---------------------+---------------------+----------------+--------------+
| 'test_wlg_user'@'%' | test_group          | Usage_priv     | NO           |
+---------------------+---------------------+----------------+--------------+
1 row in set (0.03 sec)
``` 查询

#### `fragment_mgr_asynic_work_pool_queue_size`

* 描述：单节点上异步任务的队列上限
* 默认值：4096

#### `fragment_mgr_asynic_work_pool_thread_num_min`

* 描述：处理异步任务的线程数，默认最小启动 16 个线程。
* 默认值：16

#### `fragment_mgr_asynic_work_pool_thread_num_max`

* 描述：根据后续任务动态创建线程，最大创建 512 个线程。
* 默认值：512

#### `doris_scanner_row_num`

* 描述：每个扫描线程单次执行最多返回的数据行数
* 默认值：16384

#### `doris_scanner_row_bytes`

* 描述：每个扫描线程单次执行最多返回的数据字节
  - 说明：如果表的列数太多，遇到 `select *` 卡主，可以调整这个配置
* 默认值：10485760

#### `doris_scanner_thread_pool_queue_size`

* 类型：int32
* 描述：Scanner 线程池的队列长度。在 Doris 的扫描任务之中，每一个 Scanner 会作为一个线程 Task 提交到线程池之中等待被调度，而提交的任务数目超过线程池队列的长度之后，后续提交的任务将阻塞直到队列之中有新的空缺。
* 默认值：102400

#### `doris_scanner_thread_pool_thread_num`

* 类型：int32
* 描述：Scanner 线程池线程数目。在 Doris 的扫描任务之中，每一个 Scanner 会作为一个线程 Task 提交到线程池之中等待被调度，该参数决定了 Scanner 线程池的大小。
* 默认值：48

#### `doris_max_remote_scanner_thread_pool_thread_num`

* 类型：int32
* 描述：Remote scanner thread pool 的最大线程数。Remote scanner thread pool 用于除内表外的所有 scan 任务的执行。
* 默认值：512

#### `exchg_node_buffer_size_bytes`

* 类型：int32
* 描述：ExchangeNode 节点 Buffer 队列的大小，单位为 byte。来自 Sender 端发送的数据量大于 ExchangeNode 的 Buffer 大小之后，后续发送的数据将阻塞直到 Buffer 腾出可写入的空间。
* 默认值：10485760

#### `doris_scan_range_max_mb`

* 类型：int32
* 描述：每个 OlapScanner 读取的最大数据量
* 默认值：1024

### compaction

#### `disable_auto_compaction`

* 类型：bool
* 描述：关闭自动执行 compaction 任务
  - 一般需要为关闭状态，当调试或测试环境中想要手动操作 compaction 任务时，可以对该配置进行开启
* 默认值：false

#### `enable_vertical_compaction`

* 类型：bool
* 描述：是否开启列式 compaction
* 默认值：true

#### `vertical_compaction_num_columns_per_group`

* 类型：int32
* 描述：在列式 compaction 中，组成一个合并组的列个数
* 默认值：5

#### `vertical_compaction_max_row_source_memory_mb`

* 类型：int32
* 描述：在列式 compaction 中，row_source_buffer 能使用的最大内存，单位是 MB。
* 默认值：200

#### `vertical_compaction_max_segment_size`

* 类型：int32
* 描述：在列式 compaction 中，输出的 segment 文件最大值，单位是 m 字节。
* 默认值：268435456

#### `enable_ordered_data_compaction`

* 类型：bool
* 描述：是否开启有序数据的 compaction
* 默认值：true

#### `ordered_data_compaction_min_segment_size`

* 类型：int32
* 描述：在有序数据 compaction 中，满足要求的最小 segment 大小，单位是 m 字节。
* 默认值：10485760

#### `max_base_compaction_threads`

* 类型：int32
* 描述：Base Compaction 线程池中线程数量的最大值，-1 表示每个磁盘一个线程。
* 默认值：4

#### `generate_compaction_tasks_interval_ms`

* 描述：生成 compaction 作业的最小间隔时间
* 默认值：10（ms）

#### `base_compaction_min_rowset_num`

* 描述：BaseCompaction 触发条件之一：Cumulative 文件数目要达到的限制，达到这个限制之后会触发 BaseCompaction
* 默认值：5

#### `base_compaction_min_data_ratio`

* 描述：BaseCompaction 触发条件之一：Cumulative 文件大小达到 Base 文件的比例。
* 默认值：0.3（30%）

#### `total_permits_for_compaction_score`

* 类型：int64
* 描述：被所有的 compaction 任务所能持有的 "permits" 上限，用来限制 compaction 占用的内存。
* 默认值：10000
* 可动态修改：是

#### `compaction_promotion_size_mbytes`

* 类型：int64
* 描述：cumulative compaction 的输出 rowset 总磁盘大小超过了此配置大小，该 rowset 将用于 base compaction。单位是 m 字节。
  - 一般情况下，配置在 2G 以内，为了防止 cumulative compaction 时间过长，导致版本积压。
* 默认值：1024

#### `compaction_promotion_ratio`

* 类型：double
* 描述：cumulative compaction 的输出 rowset 总磁盘大小超过 base 版本 rowset 的配置比例时，该 rowset 将用于 base compaction。
  - 一般情况下，建议配置不要高于 0.1，低于 0.02。
* 默认值：0.05

#### `compaction_promotion_min_size_mbytes`

* 类型：int64
* 描述：Cumulative compaction 的输出 rowset 总磁盘大小低于此配置大小，该 rowset 将不进行 base compaction，仍然处于 cumulative compaction 流程中。单位是 m 字节。
  - 一般情况下，配置在 512m 以内，配置过大会导致 base 版本早期的大小过小，一直不进行 base compaction。
* 默认值：128

#### `compaction_min_size_mbytes`

* 类型：int64
* 描述：cumulative compaction 进行合并时，选出的要进行合并的 rowset 的总磁盘大小大于此配置时，才按级别策略划分合并。小于这个配置时，直接执行合并。单位是 m 字节。
  - 一般情况下，配置在 128m 以内，配置过大会导致 cumulative compaction 写放大较多。
* 默认值：64

#### `default_rowset_type`

* 类型：string
* 描述：标识 BE 默认选择的存储格式，可配置的参数为："**ALPHA**", "**BETA**"。主要起以下两个作用
  - 当建表的 storage_format 设置为 Default 时，通过该配置来选取 BE 的存储格式。
  - 进行 Compaction 时选择 BE 的存储格式
* 默认值：BETA

#### `cumulative_compaction_min_deltas`

* 描述：cumulative compaction 策略：最小增量文件的数量
* 默认值：5

#### `cumulative_compaction_max_deltas`

* 描述：cumulative compaction 策略：最大增量文件的数量
* 默认值：1000

#### `base_compaction_trace_threshold`

* 类型：int32
* 描述：打印 base compaction 的 trace 信息的阈值，单位秒
* 默认值：10

base compaction 是一个耗时较长的后台操作，为了跟踪其运行信息，可以调整这个阈值参数来控制 trace 日志的打印。打印信息如下：

```
W0610 11:26:33.804431 56452 storage_engine.cpp:552] execute base compaction cost 0.00319222
BaseCompaction:546859:
  - filtered_rows: 0
   - input_row_num: 10
   - input_rowsets_count: 10
   - input_rowsets_data_size: 2.17 KB
   - input_segments_num: 10
   - merge_rowsets_latency: 100000.510ms
   - merged_rows: 0
   - output_row_num: 10
   - output_rowset_data_size: 224.00 B
   - output_segments_num: 1
0610 11:23:03.727535 (+     0us) storage_engine.cpp:554] start to perform base compaction
0610 11:23:03.728961 (+  1426us) storage_engine.cpp:560] found best tablet 546859
0610 11:23:03.728963 (+     2us) base_compaction.cpp:40] got base compaction lock
0610 11:23:03.729029 (+    66us) base_compaction.cpp:44] rowsets picked
0610 11:24:51.784439 (+108055410us) compaction.cpp:46] got concurrency lock and start to do compaction
0610 11:24:51.784818 (+   379us) compaction.cpp:74] prepare finished
0610 11:26:33.359265 (+101574447us) compaction.cpp:87] merge rowsets finished
0610 11:26:33.484481 (+125216us) compaction.cpp:102] output rowset built
0610 11:26:33.484482 (+     1us) compaction.cpp:106] check correctness finished
0610 11:26:33.513197 (+ 28715us) compaction.cpp:110] modify rowsets finished
0610 11:26:33.513300 (+   103us) base_compaction.cpp:49] compaction finished
0610 11:26:33.513441 (+   141us) base_compaction.cpp:56] unused rowsets have been moved to GC queue
```

#### `cumulative_compaction_trace_threshold`

* 类型：int32
* 描述：打印 cumulative compaction 的 trace 信息的阈值，单位秒
  - 与 base_compaction_trace_threshold 类似。
* 默认值：2

#### `compaction_task_num_per_disk`

* 类型：int32
* 描述：每个磁盘（HDD）可以并发执行的 compaction 任务数量。
* 默认值：4

#### `compaction_task_num_per_fast_disk`

* 类型：int32
* 描述：每个高速磁盘（SSD）可以并发执行的 compaction 任务数量。
* 默认值：8

#### `cumulative_compaction_rounds_for_each_base_compaction_round`

* 类型：int32
* 描述：Compaction 任务的生产者每次连续生产多少轮 cumulative compaction 任务后生产一轮 base compaction。
* 默认值：9

#### `max_cumu_compaction_threads`

* 类型：int32
* 描述：Cumulative Compaction 线程池中线程数量的最大值，-1 表示每个磁盘一个线程。
* 默认值：-1

#### `enable_segcompaction`

* 类型：bool
* 描述：在导入时进行 segment compaction 来减少 segment 数量，以避免出现写入时的 -238 错误
* 默认值：true

#### `segcompaction_batch_size`

* 类型：int32
* 描述：当 segment 数量超过此阈值时触发 segment compaction
* 默认值：10

#### `segcompaction_candidate_max_rows`

* 类型：int32
* 描述：当 segment 的行数超过此大小时则会在 segment compaction 时被 compact，否则跳过
* 默认值：1048576

#### `segcompaction_batch_size`

* 类型：int32
* 描述：单个 segment compaction 任务中的最大原始 segment 数量。
* 默认值：10

#### `segcompaction_candidate_max_rows`

* 类型：int32
* 描述：segment compaction 任务中允许的单个原始 segment 行数，过大的 segment 将被跳过。
* 默认值：1048576

#### `segcompaction_candidate_max_bytes`

* 类型：int64
* 描述：segment compaction 任务中允许的单个原始 segment 大小（字节），过大的 segment 将被跳过。
* 默认值：104857600

#### `segcompaction_task_max_rows`

* 类型：int32
* 描述：单个 segment compaction 任务中允许的原始 segment 总行数。
* 默认值：1572864

#### `segcompaction_task_max_bytes`

* 类型：int64
* 描述：单个 segment compaction 任务中允许的原始 segment 总大小（字节）。
* 默认值：157286400

#### `segcompaction_num_threads`

* 类型：int32
* 描述：segment compaction 线程池大小。
* 默认值：5

#### `disable_compaction_trace_log`

* 类型：bool
* 描述：关闭 compaction 的 trace 日志
  - 如果设置为 true，`cumulative_compaction_trace_threshold` 和 `base_compaction_trace_threshold` 将不起作用。并且 trace 日志将关闭。
* 默认值：true

#### `pick_rowset_to_compact_interval_sec`

* 类型：int64
* 描述：选取 rowset 去合并的时间间隔，单位为秒
* 默认值：86400

#### `max_single_replica_compaction_threads`

* 类型：int32
* 描述：Single Replica Compaction 线程池中线程数量的最大值，-1 表示每个磁盘一个线程。
* 默认值：-1

#### `update_replica_infos_interval_seconds`

* 描述：更新 peer replica infos 的最小间隔时间
* 默认值：60（s）


### 导入

#### `enable_stream_load_record`

* 类型：bool
* 描述：是否开启 stream load 操作记录，默认是不启用
* 默认值：false

#### `load_data_reserve_hours`

* 描述：用于 mini load。mini load 数据文件将在此时间后被删除
* 默认值：4（h）

#### `push_worker_count_high_priority`

* 描述：导入线程数，用于处理 HIGH 优先级任务
* 默认值：3

#### `push_worker_count_normal_priority`

* 描述：导入线程数，用于处理 NORMAL 优先级任务
* 默认值：3

#### `enable_single_replica_load`

* 描述：是否启动单副本数据导入功能
* 默认值：true

#### `load_error_log_reserve_hours`

* 描述：load 错误日志将在此时间后删除
* 默认值：48（h）

#### `load_error_log_limit_bytes`

* 描述：load 错误日志大小超过此值将被截断
* 默认值：209715200 (byte)

#### `load_process_max_memory_limit_percent`

* 描述：单节点上所有的导入线程占据的内存上限比例
  - 将这些默认值设置得很大，因为我们不想在用户升级 Doris 时影响负载性能。如有必要，用户应正确设置这些配置。
* 默认值：50（%）

#### `load_process_soft_mem_limit_percent`

* 描述：soft limit 是指站单节点导入内存上限的比例。例如所有导入任务导入的内存上限是 20GB，则 soft limit 默认为该值的 50%，即 10GB。导入内存占用超过 soft limit 时，会挑选占用内存最大的作业进行下刷以提前释放内存空间。
* 默认值：50（%）

#### `slave_replica_writer_rpc_timeout_sec`

* 类型：int32
* 描述：单副本数据导入功能中，Master 副本和 Slave 副本之间通信的 RPC 超时时间。
* 默认值：60

#### `max_segment_num_per_rowset`

* 类型：int32
* 描述：用于限制导入时，新产生的 rowset 中的 segment 数量。如果超过阈值，导入会失败并报错 -238。过多的 segment 会导致 compaction 占用大量内存引发 OOM 错误。
* 默认值：200

#### `high_priority_flush_thread_num_per_store`

* 类型：int32
* 描述：每个存储路径所分配的用于高优导入任务的 flush 线程数量。
* 默认值：1

#### `routine_load_consumer_pool_size`

* 类型：int32
* 描述：routine load 所使用的 data consumer 的缓存数量。
* 默认值：10

#### `multi_table_batch_plan_threshold`

* 类型：int32
* 描述：一流多表使用该配置，表示攒多少条数据再进行规划。过小的值会导致规划频繁，多大的值会增加内存压力和导入延迟。
* 默认值：200

#### `multi_table_max_wait_tables`

* 类型：int32
* 描述：一流多表使用该配置，如果等待执行的表的数量大于此阈值，将请求并执行所有相关表的计划。该参数旨在避免一次同时请求和执行过多的计划。将导入过程的多表进行小批处理，可以减少单次 rpc 的压力，同时可以提高导入数据处理的实时性。
* 默认值：5

#### `single_replica_load_download_num_workers`
* 类型：int32
* 描述：单副本数据导入功能中，Slave 副本通过 HTTP 从 Master 副本下载数据文件的工作线程数。导入并发增大时，可以适当调大该参数来保证 Slave 副本及时同步 Master 副本数据。必要时也应相应地调大`webserver_num_workers`来提高 IO 效率。
* 默认值：64

#### `load_task_high_priority_threshold_second`

* 类型：int32
* 描述：当一个导入任务的超时时间小于这个阈值是，Doris 将认为他是一个高优任务。高优任务会使用独立的 flush 线程池。
* 默认：120

#### `min_load_rpc_timeout_ms`

* 类型：int32
* 描述：load 作业中各个 rpc 的最小超时时间。
* 默认：20

#### `kafka_api_version_request`

* 类型：bool
* 描述：如果依赖的 kafka 版本低于 0.10.0.0, 该值应该被设置为 false。
* 默认：true

#### `kafka_broker_version_fallback`

* 描述：如果依赖的 kafka 版本低于 0.10.0.0, 当 kafka_api_version_request 值为 false 的时候，将使用回退版本 kafka_broker_version_fallback 设置的值，有效值为：0.9.0.x、0.8.x.y。
* 默认：0.10.0

#### `max_consumer_num_per_group`

* 描述：一个数据消费者组中的最大消费者数量，用于 routine load。
* 默认：3

#### `streaming_load_max_mb`

* 类型：int64
* 描述：用于限制数据格式为 csv 的一次 Stream load 导入中，允许的最大数据量。
  - Stream Load 一般适用于导入几个 GB 以内的数据，不适合导入过大的数据。
* 默认值：10240（MB）
* 可动态修改：是

#### `streaming_load_json_max_mb`

* 类型：int64
* 描述：用于限制数据格式为 json 的一次 Stream load 导入中，允许的最大数据量。单位 MB。
  - 一些数据格式，如 JSON，无法进行拆分处理，必须读取全部数据到内存后才能开始解析，因此，这个值用于限制此类格式数据单次导入最大数据量。
* 默认值：100
* 可动态修改：是

#### `olap_table_sink_send_interval_microseconds`.

* 描述：数据导入时，Coordinator 的 sink 节点有一个轮询线程持续向对应 BE 发送数据。该线程将每隔 `olap_table_sink_send_interval_microseconds` 微秒检查是否有数据要发送。
* 默认值：1000

#### `olap_table_sink_send_interval_auto_partition_factor`.

* 描述：如果我们向一个启用了自动分区的表导入数据，那么 `olap_table_sink_send_interval_microseconds` 的时间间隔就会太慢。在这种情况下，实际间隔将乘以该系数。
* 默认值：0.001



### 线程

#### `delete_worker_count`

* 描述：执行数据删除任务的线程数
* 默认值：3

#### `clear_transaction_task_worker_count`

* 描述：用于清理事务的线程数
* 默认值：1

#### `clone_worker_count`

* 描述：用于执行克隆任务的线程数
* 默认值：3

#### `be_service_threads`

* 类型：int32
* 描述：BE 上 Thrift Server Service 的执行线程数，代表可以用于执行 FE 请求的线程数。
* 默认值：64

#### `download_worker_count`

* 描述：下载线程数
* 默认值：1

#### `drop_tablet_worker_count`

* 描述：删除 tablet 的线程数
* 默认值：3

#### `flush_thread_num_per_store`

* 描述：每个 store 用于刷新内存表的线程数
* 默认值：2

#### `publish_version_worker_count`

* 描述：生效版本的线程数
* 默认值：8

#### `upload_worker_count`

* 描述：上传文件最大线程数
* 默认值：1

#### `webserver_num_workers`

* 描述：webserver 默认工作线程数
* 默认值：48

#### `send_batch_thread_pool_thread_num`

* 类型：int32
* 描述：SendBatch 线程池线程数目。在 NodeChannel 的发送数据任务之中，每一个 NodeChannel 的 SendBatch 操作会作为一个线程 Task 提交到线程池之中等待被调度，该参数决定了 SendBatch 线程池的大小。
* 默认值：64

#### `send_batch_thread_pool_queue_size`

* 类型：int32
* 描述：SendBatch 线程池的队列长度。在 NodeChannel 的发送数据任务之中，每一个 NodeChannel 的 SendBatch 操作会作为一个线程 Task 提交到线程池之中等待被调度，而提交的任务数目超过线程池队列的长度之后，后续提交的任务将阻塞直到队列之中有新的空缺。
* 默认值：102400

#### `make_snapshot_worker_count`

* 描述：制作快照的线程数
* 默认值：5

#### `release_snapshot_worker_count`

* 描述：释放快照的线程数
* 默认值：5

### 内存

#### `max_memory_sink_batch_count`

* 描述：最大外部扫描缓存批次计数，表示缓存 max_memory_cache_batch_count * batch_size row，默认为 20，batch_size 的默认值为 1024，表示将缓存 20 * 1024 行。
* 默认值：20

#### `memtable_mem_tracker_refresh_interval_ms`

* 描述：memtable 主动下刷时刷新内存统计的周期（毫秒）
* 默认值：100

#### `zone_map_row_num_threshold`

* 类型：int32
* 描述：如果一个 page 中的行数小于这个值就不会创建 zonemap，用来减少数据膨胀。
* 默认值：20

#### `memory_mode`

* 类型：string
* 描述：控制 tcmalloc 的回收。如果配置为 performance，内存使用超过 mem_limit 的 90% 时，doris 会释放 tcmalloc cache 中的内存，如果配置为 compact，内存使用超过 mem_limit 的 50% 时，doris 会释放 tcmalloc cache 中的内存。
* 默认值：performance

#### `max_sys_mem_available_low_water_mark_bytes`

* 类型：int64
* 描述：系统`/proc/meminfo/MemAvailable` 的最大低水位线，单位字节，默认 1.6G，实际低水位线=min(1.6G，MemTotal * 10%)，避免在大于 16G 的机器上浪费过多内存。调大 max，在大于 16G 内存的机器上，将为 Full GC 预留更多的内存 buffer；反之调小 max，将尽可能充分使用内存。
* 默认值：1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes`

* 描述：单个 schema change 任务允许占用的最大内存。
* 默认值：2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes`

* 类型：int32
* 描述：TCMalloc Hook consume/release MemTracker 时的最小长度，小于该值的 consume size 会持续累加，避免频繁调用 MemTracker 的 consume/release，减小该值会增加 consume/release 的频率，增大该值会导致 MemTracker 统计不准，理论上一个 MemTracker 的统计值与真实值相差 = (mem_tracker_consume_min_size_bytes * 这个 MemTracker 所在的 BE 线程数)。
* 默认值：1048576

#### `min_buffer_size`

* 描述：最小读取缓冲区大小
* 默认值：1024 (byte)

#### `write_buffer_size`

* 描述：刷写前缓冲区的大小
  - 导入数据在 BE 上会先写入到一个内存块，当这个内存块达到阈值后才会写回磁盘。默认大小是 100MB。过小的阈值可能导致 BE 上存在大量的小文件。可以适当提高这个阈值减少文件数量。但过大的阈值可能导致 RPC 超时
* 默认值：104857600

#### `remote_storage_read_buffer_mb`

* 类型：int32
* 描述：读取 hdfs 或者对象存储上的文件时，使用的缓存大小。
  - 增大这个值，可以减少远端数据读取的调用次数，但会增加内存开销。
* 默认值：16MB

#### `path_gc_check`

* 类型：bool
* 描述：是否启用回收扫描数据线程检查
* 默认值：true

#### `path_gc_check_interval_second`

* 描述：回收扫描数据线程检查时间间隔
* 默认值：86400 (s)

#### `path_gc_check_step`

* 默认值：1000

#### `path_gc_check_step_interval_ms`

* 默认值：10 (ms)

#### `scan_context_gc_interval_min`

* 描述：此配置用于上下文 gc 线程调度周期
* 默认值：5 (分钟)

### 存储

#### `default_num_rows_per_column_file_block`

* 类型：int32
* 描述：配置单个 RowBlock 之中包含多少行的数据。
* 默认值：1024

#### `disable_storage_page_cache`

* 类型：bool
* 描述：是否进行使用 page cache 进行 index 的缓存，该配置仅在 BETA 存储格式时生效
* 默认值：false

#### `disk_stat_monitor_interval`

* 描述：磁盘状态检查时间间隔。
* 默认值：5（s）

#### `max_garbage_sweep_interval`

* 描述：磁盘进行垃圾清理的最大间隔。
* 默认值：3600 (s)

#### `max_percentage_of_error_disk`

* 类型：int32
* 描述：存储引擎允许存在损坏硬盘的百分比，损坏硬盘超过改比例后，BE 将会自动退出。
* 默认值：0

#### `min_garbage_sweep_interval`

* 描述：磁盘进行垃圾清理的最小间隔
* 默认值：180 (s)

#### `pprof_profile_dir`

* 描述：pprof profile 保存目录。
* 默认值：${DORIS_HOME}/log

#### `small_file_dir`

* 描述：用于保存 SmallFileMgr 下载的文件的目录。
* 默认值：${DORIS_HOME}/lib/small_file/

#### `user_function_dir`

* 描述：udf 函数目录。
* 默认值：${DORIS_HOME}/lib/udf

#### `storage_flood_stage_left_capacity_bytes`

* 描述：数据目录应该剩下的最小存储空间，默认 1G。
* 默认值：1073741824


#### `storage_flood_stage_usage_percent`

* 描述：storage_flood_stage_usage_percent 和 storage_flood_stage_left_capacity_bytes 两个配置限制了数据目录的磁盘容量的最大使用。如果这两个阈值都达到，则无法将更多数据写入该数据目录。数据目录的最大已用容量百分比
* 默认值：90（90%）

#### `storage_medium_migrate_count`

* 描述：要克隆的线程数。
* 默认值：1

#### `storage_page_cache_limit`

* 描述：缓存存储页大小。
* 默认值：20%

#### `storage_page_cache_shard_size`

* 描述：StoragePageCache 的分片大小，值为 2^n (n=0,1,2,...)。建议设置为接近 BE CPU 核数的值，可减少 StoragePageCache 的锁竞争。
* 默认值：16

#### `index_page_cache_percentage`

* 类型：int32
* 描述：索引页缓存占总页面缓存的百分比，取值为[0, 100]。
* 默认值：10

#### `segment_cache_capacity`
* Type: int32
* Description: segment 元数据缓存（以 rowset id 为 key）的最大 rowset 个数。-1 代表向后兼容取值为 fd_number * 2/5
* Default value: -1

#### `storage_strict_check_incompatible_old_format`

* 类型：bool
* 描述：用来检查不兼容的旧版本格式时是否使用严格的验证方式。
  - 配置用来检查不兼容的旧版本格式时是否使用严格的验证方式，当含有旧版本的 `hdr` 格式时，使用严谨的方式时，程序会打出 `fatal log` 并且退出运行；否则，程序仅打印 `warn log`.
* 默认值：true
* 可动态修改：否

#### `sync_tablet_meta`

* 描述：存储引擎是否开 sync 保留到磁盘上
* 默认值：true

#### `pending_data_expire_time_sec`

* 描述：存储引擎保留的未生效数据的最大时长
* 默认值：1800 (s)

#### `create_tablet_worker_count`

* 描述：BE 创建 tablet 的工作线程数
* 默认值：3

#### `check_consistency_worker_count`

* 描述：计算 tablet 的校验和 (checksum) 的工作线程数
* 默认值：1

#### `max_tablet_version_num`

* 类型：int
* 描述：限制单个 tablet 最大 version 的数量。用于防止导入过于频繁，或 compaction 不及时导致的大量 version 堆积问题。当超过限制后，导入任务将被拒绝。
* 默认值：2000

#### `tablet_map_shard_size`

* 描述：tablet_map_lock 分片大小，值为 2^n, n=0,1,2,3,4，这是为了更好地管理 tablet
* 默认值：4

#### `tablet_meta_checkpoint_min_interval_secs`

* 描述：TabletMeta Checkpoint 线程轮询的时间间隔
* 默认值：600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num`

* 描述：TabletMeta Checkpoint 的最小 Rowset 数目
* 默认值：10

#### `tablet_rowset_stale_sweep_time_sec`

* 类型：int64
* 描述：用来表示清理合并版本的过期时间，当当前时间 now() 减去一个合并的版本路径中 rowset 最近创建创建时间大于 tablet_rowset_stale_sweep_time_sec 时，对当前路径进行清理，删除这些合并过的 rowset, 单位为 s。
  - 当写入过于频繁，可能会引发 fe 查询不到已经合并过的版本，引发查询 -230 错误。可以通过调大该参数避免该问题。
* 默认值：300

#### `tablet_writer_open_rpc_timeout_sec`

* 描述：在远程 BE 中打开 tablet writer 的 rpc 超时。操作时间短，可设置短超时时间
  - 导入过程中，发送一个 Batch（1024 行）的 RPC 超时时间。默认 60 秒。因为该 RPC 可能涉及多个 分片内存块的写盘操作，所以可能会因为写盘导致 RPC 超时，可以适当调整这个超时时间来减少超时错误（如 send batch fail 错误）。同时，如果调大 write_buffer_size 配置，也需要适当调大这个参数
* 默认值：60

#### `tablet_writer_ignore_eovercrowded`

* 类型：bool
* 描述：写入时可忽略 brpc 的'[E1011]The server is overcrowded'错误。
  - 当遇到'[E1011]The server is overcrowded'的错误时，可以调整配置项`brpc_socket_max_unwritten_bytes`，但这个配置项不能动态调整。所以可通过设置此项为`true`来临时避免写失败。注意，此配置项只影响写流程，其他的 rpc 请求依旧会检查是否 overcrowded。
* 默认值：false

#### `streaming_load_rpc_max_alive_time_sec`

* 描述：TabletsChannel 的存活时间。如果此时通道没有收到任何数据，通道将被删除。
* 默认值：1200

#### `alter_tablet_worker_count`

* 描述：进行 schema change 的线程数
* 默认值：3

### `alter_index_worker_count`

* 描述：进行 index change 的线程数
* 默认值：3

#### `ignore_load_tablet_failure`

* 类型：bool
* 描述：用来决定在有 tablet 加载失败的情况下是否忽略错误，继续启动 be
* 默认值：false

BE 启动时，会对每个数据目录单独启动一个线程进行 tablet header 元信息的加载。默认配置下，如果某个数据目录有 tablet 加载失败，则启动进程会终止。同时会在 `be.INFO` 日志中看到如下错误信息：

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

表示该数据目录共有多少 tablet 加载失败。同时，日志中也会有加载失败的 tablet 的具体信息。此时需要人工介入来对错误原因进行排查。排查后，通常有两种方式进行恢复：

1. tablet 信息不可修复，在确保其他副本正常的情况下，可以通过 `meta_tool` 工具将错误的 tablet 删除。
2. 将 `ignore_load_tablet_failure` 设置为 true，则 BE 会忽略这些错误的 tablet，正常启动。

#### `report_disk_state_interval_seconds`

* 描述：代理向 FE 报告磁盘状态的间隔时间
* 默认值：60 (s)

#### `result_buffer_cancelled_interval_time`

* 描述：结果缓冲区取消时间
* 默认值：300 (s)

#### `snapshot_expire_time_sec`

* 描述：快照文件清理的间隔
* 默认值：172800 (48 小时)

### 日志

#### `sys_log_dir`

* 类型：string
* 描述：BE 日志数据的存储目录
* 默认值：${DORIS_HOME}/log

#### `sys_log_level`

* 描述：日志级别，INFO < WARNING < ERROR < FATAL
* 默认值：INFO

#### `sys_log_roll_mode`

* 描述：日志拆分的大小，每 1G 拆分一个日志文件
* 默认值：SIZE-MB-1024

#### `sys_log_roll_num`

* 描述：日志文件保留的数目
* 默认值：10

#### `sys_log_verbose_level`

* 描述：日志显示的级别，用于控制代码中 VLOG 开头的日志输出
* 默认值：10

#### `sys_log_verbose_modules`

* 描述：日志打印的模块，写 olap 就只打印 olap 模块下的日志
* 默认值：空

#### `aws_log_level`

* 类型：int32
* 描述：AWS SDK 的日志级别
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* 默认值：3

#### `log_buffer_level`

* 描述：日志刷盘的策略，默认保持在内存中
* 默认值：空

### 其它

#### `report_tablet_interval_seconds`

* 描述：代理向 FE 报告 olap 表的间隔时间
* 默认值：60 (s)

#### `report_task_interval_seconds`

* 描述：代理向 FE 报告任务签名的间隔时间
* 默认值：10 (s)

#### `enable_metric_calculator`

* 描述：如果设置为 true，metric calculator 将运行，收集 BE 相关指标信息，如果设置成 false 将不运行
* 默认值：true

#### `enable_system_metrics`

* 描述：用户控制打开和关闭系统指标
* 默认值：true

#### `enable_token_check`

* 描述：用于向前兼容，稍后将被删除
* 默认值：true

#### `max_runnings_transactions_per_txn_map`

* 描述：txn 管理器中每个 txn_partition_map 的最大 txns 数，这是一种自我保护，以避免在管理器中保存过多的 txns
* 默认值：2000

#### `max_download_speed_kbps`

* 描述：最大下载速度限制
* 默认值：50000（kb/s）

#### `download_low_speed_time`

* 描述：下载时间限制
* 默认值：300 (s)

#### `download_low_speed_limit_kbps`

* 描述：下载最低限速
* 默认值：50 (KB/s)

#### `priority_queue_remaining_tasks_increased_frequency`

* 描述：BlockingPriorityQueue 中剩余任务的优先级频率增加
* 默认值:512

#### `jdbc_drivers_dir`

* 描述：存放 jdbc driver 的默认目录。
* 默认值：`${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader`

* 描述：是否在导入 json 数据时用 simdjson 来解析。
* 默认值：true

#### `enable_query_memory_overcommit`

* 描述：如果为 true，则当内存未超过 exec_mem_limit 时，查询内存将不受限制；当进程内存超过 exec_mem_limit 且大于 2GB 时，查询会被取消。如果为 false，则在使用的内存超过 exec_mem_limit 时取消查询。
* 默认值：true

#### `user_files_secure_path`

* 描述：`local` 表函数查询的文件的存储目录。
* 默认值：`${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes`

* 描述：brpc streaming 客户端发送数据时的攒批大小（字节）
* 默认值：262144

#### `grace_shutdown_wait_seconds`

* 描述：在云原生的部署模式下，为了节省资源一个 BE 可能会被频繁的加入集群或者从集群中移除。如果在这个 BE 上有正在运行的 Query，那么这个 Query 会失败。用户可以使用 stop_be.sh --grace 的方式来关闭一个 BE 节点，此时 BE 会等待当前正在这个 BE 上运行的所有查询都结束才会退出。同时，在这个时间范围内 FE 也不会分发新的 query 到这个机器上。如果超过 grace_shutdown_wait_seconds 这个阈值，那么 BE 也会直接退出，防止一些查询长期不退出导致节点没法快速下掉的情况。
* 默认值：120

#### `enable_java_support`

* 描述：BE 是否开启使用 java-jni，开启后允许 c++ 与 java 之间的相互调用。目前已经支持 hudi、java-udf、jdbc、max-compute、paimon、preload、avro
* 默认值：true

#### `group_commit_wal_path`

* 描述：Group Commit 存放 WAL 文件的目录，请参考 [Group Commit](../../data-operate/import/group-commit-manual.md)
* 默认值：默认在用户配置的`storage_root_path`的各个目录下创建一个名为`wal`的目录。配置示例：
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

#### `group_commit_memory_rows_for_max_filter_ratio`

* 描述：当 Group Commit 导入的总行数不高于该值，`max_filter_ratio` 正常工作，否则不工作，请参考 [Group Commit](../../data-operate/import/group-commit-manual.md)
* 默认值：10000

### 存算分离模式

#### `deploy_mode`

* 默认值：""

* 描述：BE 运行的模式。`cloud` 表示算分离模式。

#### `meta_service_endpoint`

* 默认值：""

* 描述：Meta Service 的端点应以 'host1:port,host2:port' 的格式指定。该值通常由 FE 通过心跳传递给 BE，无需配置。

#### `enable_file_cache`

* 默认值：在存算分离模式下为 true，在非存算分离模式下为 false。

* 描述：是否使用文件缓存。

#### `file_cache_path`

* 默认值： [{"path":"${DORIS_HOME}/file_cache"}]

* 描述：用于文件缓存的磁盘路径和其他参数，以数组形式表示，每个磁盘一个条目。`path` 指定磁盘路径，`total_size` 限制缓存的大小；-1 或 0 将使用整个磁盘空间。

* 格式： [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]