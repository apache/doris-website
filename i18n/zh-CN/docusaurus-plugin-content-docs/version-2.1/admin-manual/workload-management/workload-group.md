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

在 Doris 中使用 Workload Group 管理与限制资源。通过资源管控方式可以有效限制查询与导入等负载所用的 CPU、内存与 IO 资源，也可以创建查询队列，控制集群中的查询最大并发量。自 Doris 2.1 版本后，使用基于 CGroup 对 CPU 资源进行限制。在使用 Workload 资源管控功能前，需要先配置 CGroup 环境。在创建 Workload Group 管控资源前，需要根据业务选择对资源进行软限或硬限：

- 设置资源软限，在没有资源争用时，可以借用其他 Workload Group 资源，超过软限；

- 设置资源硬限，无论是否存在资源争用，都无法超过硬限设置的资源配额。
  
在使用 Workload 资源管控时，需要执行以下操作：

1. 创建 Workload Group；

2. 向 Workload Group 中添加资源限制规则；

3. 为租户绑定 Workload Group。

## 版本升级说明

自 Doris 2.0 版本开始提供 Workload 资源管控功能。在 Doris 2.0 版本中，Workload 资源管控不依赖于 CGroup，而 Doris 2.1 版本中需要依赖 CGroup。

- 从 Doris 1.2 升级到 2.0：建议集群升级完成后，再开启 Workload 资源管控功能。只升级部分 follower FE 节点，可能会因为未升级的 FE 节点没有 Workload Group 的元数据信息，导致已升级的 follower FE 节点查询失败。

- 从 Doris 2.0 升级到 2.1：由于 2.1 版本的 Workload 资源管控功能依赖于 CGroup，需要先配置 CGroup 环境，在升级到 Doris 2.1 版本。

## 配置 CGroup 环境

在 Doris 的 2.0 版本使用基于 Doris 的调度实现 CPU 资源的限制，虽然提供了极大的灵活性，但由于 CPU 的隔离不够精准，无法提供 CPU 的硬隔离限制。从 2.1 版本起，Doris 使用基于 CGroup 对 CPU 资源进行限制，因此建议对资源隔离有强烈需求的用户升级到 2.1 版本，同时在所有 BE 节点上已经安装好 CGroup 的环境。
用户如果在 2.0 版本使用了 Workload Group 的软限并升级到了 2.1 版本，那么也需要配置 CGroup，否则可能导致软限失效。在不配置 cgroup 的情况下，用户可以使用 Workload Group 除 CPU 限制外的所有功能。

:::tip
1. Doris BE 节点能够很好的使用机器的 CPU 与内存资源，建议单台机器上只部署一个 BE 实例，目前的 Workload 资源管控不支持一个机器多个 BE 的部署方式；
2. 当机器重启之后，以下的 CGroup 配置就会清空。如果期望配置重启之后可以也可以生效，可以使用 systemd 把操作设置成系统的自定义服务，这样在每次机器重启的时候，自动完成创建和授权操作
3. 如果是在容器内使用 CGroup，需要容器具备操作宿主机的权限。
:::

### 确定 BE 节点安装 CGroup
通过检查 /proc/filesystems 文件可以判断是否安装 CGroup：

```
cat /proc/filesystems | grep cgroup
nodev   cgroup
nodev   cgroup2
nodev   cgroupfs
```

在上述返回结果中，列出了 cgroup，cgroup2 与 cgroupfs，这表明内核支持了 CGroup。还需要进一步查看 CGroup 版本。

#### 确定 CGroup 版本
系统使用 CGroup V1，会有多个子系统分别挂在在 /sys/fs/cgroup 目录下。如果包含了 /sys/fs/cgroup/cpu 目录，说明目前生效的是 CGroup V1：

```shell
## 包含 /sys/fs/cgroup/cpu 目录，CGroup V1 生效
ls /sys/fs/cgroup/cpu
```

系统使用 CGroup V2，会采用统一的层级结构，所有的控制器都在一个文件系统中管理。如果包含了 /sys/fs/cgroup/cgroup.controllers 目录，则证明目前生效的是 CGroup V2：

```shell
## 包含 /sys/fs/cgroup/cgroup.controllers 目录，CGroup V2 生效
ls /sys/fs/cgroup/cgroup.controllers
```
在 Doris 中使用 Workload 管控资源，需要针对于 CGroup 的版本分别配置。

### 使用 CGroup V1 版本
如果使用 CGroup V1 版本，需要为 Doris 在 /sys/fs/cgroup/cpu 目录下创建 CPU 管控目录。您可以自定义该目录名称，下例中使用 /sys/fs/cgroup/cpu/doris：

```shell
## Create cgroup dir for Doris
mkdir /sys/fs/cgroup/cpu/doris

## Modify the Doris cgroup directory permissions
chmod 770 /sys/fs/cgroup/cpu/doris

## Grant user permissions for Doris usage
chown -R doris:doris /sys/fs/cgroup/cpu/doris
```

### 使用 CGroup V2 版本
因为 CGroup V2 对于权限管控比较严格，需要具备根目录的 cgroup.procs 文件的写权限才能实现进程在 group 之间的移动。
通过以下命令为 cgroup.procs 目录授权：

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```

### 为 BE 节点配置 CGroup 环境
在使用 Workload 进行资源管控前，需要在 BE 的配置文件 be/conf/be.conf 中配置 CGroup 的路径：
```
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris
```
在配置 be.conf 文件后，需要重启 BE 节点，在 BE.INFO 日志文件中可以查看到 add thread {pid} to group 提示，表示配置成功。

## 使用 Workload Group 管理资源
在创建 Workload Group 后，可以为 Workload Group 添加资源限制规则。Doris 目前支持以下资源的规则限制：

- 对 CPU 进行硬限或软限

- 对内存进行硬限或软限

- 对远程或本地 IO 进行限制

- 创建查询队列管理查询作业

### 创建自定义 Workload Group
需要使用具有 ADMIN 权限的用户创建 Workload Group，同时添加资源规则。通过 `CREATE WORKLOAD GROUP` 语句可以创建自定义 Workload Group。自 Doris 2.1 版本起，系统会自动创建名为 Normal 的 Workload Group，用户会默认绑定到 Normal 下。在以下示例中创建了 Workload Group g1，同时添加了 CPU 与内存资源的限制规则：

```
CREATE Workload Group IF NOT EXISTS g1
PROPERTIES(
    "cpu_share"="1024",
    "memory_limit"="30%"
);
```

### 修改 Workload Group 的资源规则

访问 Doris 系统表 `information_schema.workload_groups` 可以查看创建的 Workload Group 信息。
删除 Workload Group 可以参考 [DROP WORKLOAD GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-RESOURCE);
通过 ALTER-WORKLOAD-GROUP 命令可以调整与修改 Workload Group 配置，参考 [ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP.md).

#### 添加与修改资源项
在以下示例中，为 g1 资源组修改了内存限制规则：

```sql
ALTER Workload Group g1 PROPERTIES('memory_limit'='10%');
```

通过 information_schema.workload_groups 系统表可以查看到修改后的内存限制：

```sql
SELECT name, memory_limit FROM information_schema.workload_groups;
+--------+--------------+
| name   | memory_limit |
+--------+--------------+
| normal | 30%          |
| g1     | 10%          |
+--------+--------------+
```

#### 配置资源软限与硬限

使用 Workload Group 功能，可以为 CPU 以及内存资源设置软限与硬限，对于远程与本地 IO，只提供硬限能力：

- 软限：软限作为资源的警戒线，用户正常操作中不会超过这个限度。当其他 Workload Group 负载较低时，可以借用其他 Workload Group 资源，超过软限设置；

- 硬限：硬限作为资源的绝对使用上限，无论其他 Workload Group 是否有负载，都不能超过硬限上限。硬限通常用来防止系统资源被滥用。

|       | 软限开关与参数                                                              | 硬限开关与参数                                                                            | 说明    |
| ----------- |----------------------------------------------------------------------|------------------------------------------------------------------------------------|-----|
| CPU      | 开关：FE Config - enable_cpu_hard_limit = false 参数：Property - cpu_share | 开关：FE Config - enable_cpu_hard_limit = true <br /> 参数：property - cpu_hard_limit 修改 CPU 硬限 |不同 Workload Group 只能同时设置软限或硬限，无法设置部分组硬限及部分组软限     |
| Memory   | 开关：property - enable_memory_overcommit = true <br /> 参数：property - memory_limit | 开关：property - enable_memory_overcommit = false <br /> 参数：property - memory_limit    | 不同 Workload Group 可以任意设置软限或硬限，部分组可以设置硬限，部分组可以设置软限    |
| 本地 IO   | 无                                                                 |  参数：read_bytes_per_second      |  暂时只提供本地 IO 硬限   |
| 远程 IO   | 无                                                                 |  参数：remote_read_bytes_per_second   |  暂时只提供远程 IO 硬限   |


### 为租户绑定 Workload Group

使用非 ADMIN 用户，需要先确定是否具有该 Workload Group 的权限。通过查看 information_schema.workload_groups 系统表判断是否具有使用 Workload Group 的权限。当可以查询到 Workload Group 时，代表具有使用该 Workload Group 的权限。下例中代表可以使用 g1 与 normal Workload Group：

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```

如果无法看到 g1 Workload Group，可以使用 GRANT 语句为用户授权。
在为租户绑定 Workload Group 时，可以通过设置 user property 或指定 session 变量两种方式。当同时使用了两种方式时，session 变量的优先级要高于 user property：

- 使用 user property 绑定 Workload Group：一般由管理员使用 SET-PROPERTY 命令为租户绑定默认的 Workload Group。在以下示例中，为 test_wlg 租户绑定了默认 Workload Group g1:

  ```sql
  set property for 'test_wlg' 'default_workload_group' = 'g1';
  ```

- 使用 session 变量绑定 Workload Group：在业务开发的过程中，即便管理员配置了默认的 Workload Group，也可以在 session 中通过 workload_group 变量修改。在以下示例中，为当前 session 配置了绑定 Workload Group g1：

  ```sql
  SET workload_group = 'g1';
  ```

## 为 Workload Group 设置分组

在多负载或多租户环境中，一个 Doris 集群可能被拆分成多个子集群使用，如部分节点用于外部存储的联邦查询，部分节点用于内表实时查询。Workload Group 可以为 BE 节点打标签（tag），标签相同的 BE 节点组成子集群。每个子集群的资源独立计算，子集群内累加值不能超过 100%。在下例中，将七台机器分成 sub_a 与 sub_b 两个子集群，两个子集群中分别创建了两个 Workload Group。
在多负载或多租户的环境中，一个 Doris 集群可能被拆分成多个子集群使用，如部分节点用于外部存储的联邦查询，部分节点用于内部表的事实查询，两个自己群在数据分布与资源使用上完全隔离。在同一个子集群群内，需要创建多个租户并创建租户之间的资源使用隔离规则。针对于这类复杂的资源隔离要求，可以结合 Resource Group 与 Workload Group 功能，使用 Resource Group 实现多个子集群的节点粒度隔离，在自己群内使用 Workload Group 进行租户间的资源隔离。如下图中划分成 A、B 两个子集群，每个子集群中有各自的 Workload Group 进行资源管控：

![group_workload_group_1](/images/workload-management/group_wg_1.png)

1. 创建 A 与 B 两个 Resource Group，将 7 台机器划分成两个子集群

    ```sql
    -- create resource group sub_cluster_a
    ALTER SYSTEM MODIFY BACKEND "192.168.88.31:9050" SET("tag.location" = "sub_cluster_a");
    ALTER SYSTEM MODIFY BACKEND "192.168.88.32:9050" SET("tag.location" = "sub_cluster_a");
    ALTER SYSTEM MODIFY BACKEND "192.168.88.33:9050" SET("tag.location" = "sub_cluster_a");

    -- create resource group sub_cluster_b
    ALTER SYSTEM MODIFY BACKEND "192.168.88.34:9050" SET("tag.location" = "sub_cluster_b");
    ALTER SYSTEM MODIFY BACKEND "192.168.88.35:9050" SET("tag.location" = "sub_cluster_b");
    ```

2. 为子集群创建 Workload Group 进行内存资源隔离

    ```sql
    -- create Workload Groups for sub cluster A
    CREATE Workload Group a_wlg_1 PROPERTIES('tag' = "sub_cluster_a", "memory_limit" = "30");
    CREATE Workload Group a_wlg_2 PROPERTIES('tag' = "sub_cluster_a", "memory_limit" = "30");
    CREATE Workload Group a_wlg_3 PROPERTIES('tag' = "sub_cluster_a", "memory_limit" = "30");

    -- create Workload Groups for sub cluster B
    CREATE Workload Group b_wlg_1 PROPERTIES('tag' = "sub_cluster_b", "memory_limit" = "30");
    CREATE Workload Group b_wlg_2 PROPERTIES('tag' = "sub_cluster_b", "memory_limit" = "30");
    ```

## 注意事项

1. 在 Kubernetes 中使用 Workload 管控资源。Workload 的 CPU 管理是基于 CGroup 实现的，如果期望在容器中使用 Workload Group，那么需要以特权模式启动容器，容器内的 Doris 进程才能具备读写宿主机 CGroup 文件的权限。当 Doris 在容器内运行时，Workload Group 的 CPU 资源用量是在容器可用资源的情况下再划分的，例如宿主机整机是 64 核，容器被分配了 8 个核的资源，Workload Group 配置的 CPU 硬限为 50%，那么 Workload Group 实际可用核数为 4 个（8 核 * 50%）。

2. WorkloadGroup 的内存管理和 IO 管理功能是 Doris 内部实现，不依赖外部组件，因此在容器和物理机上部署使用并没有区别。如果要在 K8S 上使用 Doris，建议使用 Doris Operator 进行部署，可以屏蔽底层的权限细节问题。