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

你可以使用Workload Group管理Doris集群中查询和导入负载所使用的CPU/内存/IO资源用量，控制集群中查询的最大并发。Workload Group的使用权限可以授予给特定的角色和用户。

在以下场景使用Workload Group通常会取得不错的效果：
1. 偏好性能稳定性的场景，不要求查询负载可以占满集群所有的资源，但是期望查询的延迟比较稳定，那么可以尝试把Workload Group的CPU/IO配置成硬限。
2. 当集群整体负载过高导致可用性下降时，此时可以通过对集群中资源占用过高的WorkloadGroup进行降级处理来恢复集群的可用性，例如降低Workload Group的最大查询并发和IO吞吐。

通常使用硬限对资源进行管理可以获得更好的稳定性和性能，例如配置FE的最大并发以及CPU的硬限。
因为CPU的软限通常只有在CPU在用满时才能体现效果，而此时Doris内部的其他组件（RPC）以及操作系统可用的CPU资源会受到挤压，系统整体的延迟就会增加。
对Doris的查询负载配置硬限能有效缓解这个问题。同时配置最大并发和排队，可以缓解高峰时持续不断地新查询进来耗尽集群中的所有可用资源的情况。

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
  所有 Workload Group 的 cpu_hard_limit 累加值不能超过 100%。2.1 版本新增属性，2.0版本不支持该功能。
* max_concurrency：可选，最大查询并发数，默认值为整型最大值，也就是不做并发的限制。运行中的查询数量达到该值时，新来的查询会进入排队的逻辑。
* max_queue_size：可选，查询排队队列的长度，当排队队列已满时，新来的查询会被拒绝。默认值为 0，含义是不排队。
* queue_timeout：可选，查询在排队队列中的超时时间，单位为毫秒，如果查询在队列中的排队时间超过这个值，那么就会直接抛出异常给客户端。默认值为 0，含义是不排队。
* scan_thread_num：可选，当前 workload group 用于 scan 的线程个数，默认值为 -1，含义是不生效，此时以 be 配置中的 scan 线程数为准。取值为大于 0 的整数。
* max_remote_scan_thread_num：可选，读外部数据源的scan线程池的最大线程数，默认值为-1，当该值为-1时，实际的线程数由BE自行决定，通常和核数相关。
* min_remote_scan_thread_num：可选，读外部数据源的scan线程池的最小线程数，默认值为-1，当该值为-1时，实际的线程数由BE自行决定，通常和核数相关。
* tag：可选，默认为空，为Workload Group指定标签，相同标签的Workload Group资源累加值不能超过100%，如果期望指定多个值，可以使用英文逗号分隔，关于打标功能下文会有详细描述。
* read_bytes_per_second：可选，含义为读Doris内表时的最大IO吞吐，默认值为-1，也就是不限制IO带宽。需要注意的是这个值并不绑定磁盘，而是绑定文件夹。
比如为Doris配置了2个文件夹用于存放内表数据，那么每个文件夹的最大读IO不会超过该值，如果这2个文件夹都配置到同一块盘上，最大吞吐控制就会变成2倍的read_bytes_per_second。落盘的文件目录也受该值的约束。
* remote_read_bytes_per_second：可选，含义为读Doris外表时的最大IO吞吐，默认值为-1，也就是不限制IO带宽。

注意事项：

1. 目前暂不支持 CPU 的软限和硬限的同时使用，一个集群某一时刻只能是软限或者硬限，下文中会描述切换方法。

2. 所有属性均为可选，但是在创建 Workload Group 时需要指定至少一个属性。

3. 需要注意 cgroup v1 和cgroup v2 版本 cpu 软限默认值是有区别的, cgroup v1 的 cpu 软限默认值为1024，取值范围为2到262144。而 cgroup v2 的 cpu 软限默认值为100，取值范围是1到10000。
如果软限填了一个超出范围的值，这会导致 cpu 软限在BE修改失败。还有就是在cgroup v1的环境上如果按照cgroup v2的默认值100设置，这可能导致这个workload group的优先级在该机器上是最低的。


## Workload Group分组功能
Workload Group功能是对单台BE资源用量的划分。当用户创建了一个Group A，默认情况下这个Group A的元信息会被发送到所有BE上并启动线程，这会带来以下问题：
1. 生产环境下通常会在一个Doris集群内拆分出多个小集群，比如拆分出本地存储的集群和用于查外部存储的包含ComputeNode的集群，这两个集群间的查询是独立的。
此时用户如果期望使用Workload Group功能，那么就会出现查外部存储的负载使用的Workload Group和查本地存储的负载使用的Workload Group的mem_limit累加值不能超过100%，然而实际上这两种负载完全位于不同的机器上，这显然是不合理的。
2. 线程数本身也是一种资源，如果一个进程的线程数配额被耗尽，这会导致进程挂掉，默认把Workload Group的元信息发送给所有节点本身也是不合理的。

基于以上原因，Doris实现了对于Workload Group的分组功能，相同Tag分组下的Workload Group的累加值不能超过100%，但是一个集群中就可以有多个这样的Tag分组。
当一个BE节点也被打上了Tag，那么这个BE会根据一定的规则匹配对应的Workload Group。

具体用法如下：
1. 创建名为tag_wg的Workload Group，指定其tag名为cn1，此时如果集群中的BE都没有打标签的话，那么这个Workload Group的元信息会被发送到所有BE上。tag属性可以指定多个，使用英文逗号分隔。
```
create workload group tag_wg properties('tag'='cn1');
```
2. 修改集群中一个BE的标签为cn1，此时tag_wg这个Workload Group就只会发送到这个BE以及标签为空的BE上。tag.workload_group属性可以指定多个，使用英文逗号分隔。
需要注意的是，alter接口目前不支持增量更新，每次修改BE的属性都需要增加全量的属性，因此下面语句中添加了tag.location属性，default为系统默认值，实际修改时需要按照BE原有属性指定。
```
alter system modify backend "localhost:9050" set ("tag.workload_group" = "cn1", "tag.location"="default");
```

Workload Group和BE的匹配规则说明:
1. 当Workload Group的Tag为空，那么这个Workload Group可以发送给所有的BE，不管该BE是否指定了tag。
2. 当Workload Group的Tag不为空，那么Workload Group只会发送给具有相同标签的BE。

推荐用法可以参考:[Workload Group分组功能](./group-workload-groups.md)

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

5. 如果目前环境里使用的是GGroup v2版本，那么需要做以下操作。这是因为CGroup v2对于权限管控比较严格，需要具备根目录的cgroup.procs文件的写权限才能实现进程在group之间的移动。
如果是CGroup v1那么不需要这一步。
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
2. 当机器重启之后，上面的cgroup配置就会清空。如果期望上述配置重启之后可以也可以生效，可以使用systemd把以上操作设置成系统的自定义服务，这样在每次机器重启的时候，自动完成创建和授权操作。
:::

## 在K8S中使用Workload Group的注意事项
Workload的CPU管理是基于CGroup实现的，如果期望在容器中使用Workload Group，那么需要以特权模式启动容器，容器内的Doris进程才能具备读写宿主机CGroup文件的权限。
当Doris在容器内运行时，Workload Group的CPU资源用量是在容器可用资源的情况下再划分的，例如宿主机整机是64核，容器被分配了8个核的资源，Workload Group配置的CPU硬限为50%，
那么Workload Group实际可用核数为4个（8核 * 50%）。

WorkloadGroup的内存管理和IO管理功能是Doris内部实现，不依赖外部组件，因此在容器和物理机上部署使用并没有区别。

如果要在K8S上使用Doris，建议使用Doris Operator进行部署，可以屏蔽底层的权限细节问题。

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
此时配置的 CPU 限制为软限。自 2.1 版本起，系统会自动创建一个名为```normal```的 group，不可删除。创建 workload group 详细使用可参考：[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-WORKLOAD-GROUP)，

2. 查看/修改/删除 workload group语句如下：
```
show workload groups;

alter workload group g1 properties('memory_limit'='10%');

drop workload group g1;

```
查看 workload group 可访问 Doris 系统表```information_schema.workload_groups```或者使用命令[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/Show-Statements/SHOW-WORKLOAD-GROUPS)。 删除 workload group 可参考[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-WORKLOAD-GROUP)；修改 workload group 可参考：[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-WORKLOAD-GROUP)。

3. 绑定 workload group。
* 通过设置 user property 将 user 默认绑定到 workload group，默认为`normal`，需要注意的这里的value不能填空，否则语句会执行失败，如果不知道要设置哪些group，可以设置为`normal`，`normal`为全局默认的group。
```
set property 'default_workload_group' = 'g1';
```
执行完该语句后，当前用户的查询将默认使用'g1'。

* 通过 session 变量指定 workload group, 默认为空：
```
set workload_group = 'g1';
```
session 变量`workload_group`优先于 user property `default_workload_group`, 在`workload_group`为空时，查询将绑定到`default_workload_group`, 在 session 变量`workload_group`不为空时，查询将绑定到`workload_group`。

如果是非 admin 用户，需要先执行[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/Show-Statements/SHOW-WORKLOAD-GROUPS) 确认下当前用户能否看到该 workload group，不能看到的 workload group 可能不存在或者当前用户没有权限，执行查询时会报错。给 workload group 授权参考：[grant 语句](../../sql-manual/sql-statements/Account-Management-Statements/GRANT)。

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

2. 在有些运维情况下，管理员账户需要绕开排队的逻辑，那么可以通过设置session变量：
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

# Workload Group权限表
可以通过Workload Group权限表查看user或者role有权限访问的Workload Group，授权相关的用法可以参考[grant 语句](../../sql-manual/sql-statements/Account-Management-Statements/GRANT)。

该表目前存在行级别的权限控制，root或者admin账户可以查看所有的数据，非root/admin账户只能看到自己有权限访问的Workload Group的数据。

Workload Group权限表结构如下：
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
1. grantee，代表user或者role。
2. workload_group_name，取值为Workload Group的名称或者%，%代表可以访问所有的Workload Group。
3. privilege_type，权限的类型，目前该列的值只有Usage_priv。
4. is_grantable，取值为YES或者NO，字段含义为是否可以给其他用户授予Workload Group的访问权限。目前只有root用户或者admin用户这个字段为YES，其他用户都为NO。

基本用法：
1. 根据用户名查找有权限访问的Workload Group
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

2. 查看某个Workload Group可以有哪些用户访问
```
mysql [information_schema]>select * from workload_group_privileges where WORKLOAD_GROUP_NAME='test_group';
+---------------------+---------------------+----------------+--------------+
| GRANTEE             | WORKLOAD_GROUP_NAME | PRIVILEGE_TYPE | IS_GRANTABLE |
+---------------------+---------------------+----------------+--------------+
| 'test_wlg_user'@'%' | test_group          | Usage_priv     | NO           |
+---------------------+---------------------+----------------+--------------+
1 row in set (0.03 sec)
```