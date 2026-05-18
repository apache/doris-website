---
{
    "title": "Workload Group：Doris 进程内资源隔离配置指南",
    "sidebar_label": "Workload Group",
    "language": "zh-CN",
    "description": "介绍如何使用 Workload Group 对 Doris BE 进程内的 CPU、内存、IO 资源进行细粒度隔离，避免高负载查询影响在线业务。",
    "keywords": ["Workload Group", "资源隔离", "CPU 限制", "内存限制", "IO 限制", "CGroup", "查询排队", "负载管理", "workload group 配置", "doris 资源管理"]
}
---

<!-- 知识类型: 架构选型决策 -->

Workload Group 是 Doris 进程内的逻辑资源隔离机制。它对 BE 进程内的 CPU、内存、IO 资源进行细粒度划分，使不同业务负载互不干扰。

![workload_group](/images/workload_group_arch.png)

目前支持以下三类资源隔离能力：

- **CPU 资源**：支持 CPU 软限（最低保障）和 CPU 硬限（最高上限）
- **内存资源**：支持内存软限和内存硬限
- **IO 资源**：支持限制读取本地文件和远程文件产生的 IO 带宽

:::tip 进程内隔离 vs 进程间隔离

Workload Group 提供进程内的资源隔离能力，与 Resource Group、Compute Group 等进程间隔离方式有本质区别：

1. **进程内隔离**存在公共组件（如共享缓存、RPC 线程池）无法隔离的情况，高负载任务仍可能影响低负载任务的延迟，但相比不做管控的情况已有明显改善。
2. **选型建议**：可以容忍一定延迟且偏好低成本时，选择 Workload Group；期望完全隔离且可接受更高成本时，选择 Resource Group 或 Compute Group，将高优负载划分到独立的 BE 节点。

:::

## 版本说明

<!-- 知识类型: 配置参数 -->

| 版本 | 说明 |
|------|------|
| Doris 2.0 | 新增 Workload Group 功能，不依赖 CGroup |
| Doris 2.1 | Workload Group 需要依赖 CGroup；系统自动创建不可删除的 `normal` 分组 |
| Doris 4.0 | 将 CPU 软限/硬限概念统一为 `min_cpu_percent` / `max_cpu_percent`，内存软限/硬限统一为 `min_memory_percent` / `max_memory_percent` |

**升级注意事项**：

- **1.2 → 2.0**：建议集群全量升级完成后再开启 Workload Group 功能。仅升级部分 follower FE 节点可能导致未升级节点缺少元数据，造成查询失败。
- **2.0 → 2.1**：需先配置 CGroup 环境，再升级到 2.1 版本。

## 核心属性

<!-- 知识类型: 配置参数 -->

### CPU 资源参数

| 参数 | 取值范围 | 说明 |
|------|----------|------|
| `MIN_CPU_PERCENT` | [0%, 100%] | 为该 Workload Group 预留的最低 CPU 带宽。有 CPU 争用时，其他分组无法抢占此带宽；资源空闲时可超过此值使用。 |
| `MAX_CPU_PERCENT` | [0%, 100%] | 该 Workload Group 的 CPU 带宽上限。无论当前 CPU 利用率如何，该分组的 CPU 使用率不会超过此值。 |

约束：所有 Workload Group 的 `MIN_CPU_PERCENT` 之和不能超过 100%，且 `MIN_CPU_PERCENT` 不能大于 `MAX_CPU_PERCENT`。

**场景示例**：某公司销售部门（CPU 密集型，高优先级）与市场部门（CPU 密集型，低优先级）共享同一 Doris 实例。可为销售 Workload Group 分配 40% 的 `min_cpu_percent`，为市场 Workload Group 配置 30% 的 `max_cpu_percent`，确保销售业务获得稳定的 CPU 资源。

### 内存资源参数

| 参数 | 取值范围 | 说明 |
|------|----------|------|
| `MIN_MEMORY_PERCENT` | [0%, 100%] | 为该 Workload Group 预留的最低内存量。内存不足时，系统按此值分配内存；必要时会 Kill 部分查询以释放内存，确保其他分组有足够可用内存。 |
| `MAX_MEMORY_PERCENT` | [0%, 100%] | 该 Workload Group 的内存上限。查询占用的内存超过此值时，将触发落盘或被 Kill。 |

约束：所有 Workload Group 的 `MIN_MEMORY_PERCENT` 之和不能超过 100%，且 `MIN_MEMORY_PERCENT` 不能大于 `MAX_MEMORY_PERCENT`。

### 其他属性

| 属性名称 | 数据类型 | 默认值 | 取值范围 | 说明 |
|----------|---------|--------|----------|------|
| `max_concurrency` | 整型 | 2147483647 | [0, 2147483647] | 最大查询并发数，默认不限制。运行中的查询数量达到上限时，新查询进入排队逻辑。 |
| `max_queue_size` | 整型 | 0 | [0, 2147483647] | 查询排队队列长度。默认为 0，表示不排队；队列已满时新查询直接失败。 |
| `queue_timeout` | 整型 | 0 | [0, 2147483647] | 查询在排队队列中的最大等待时间（毫秒）。默认为 0，表示不排队，进入队列后立即返回失败。 |
| `scan_thread_num` | 整型 | -1 | [1, 2147483647] | 当前 Workload Group 用于 scan 的线程数。为 -1 时，取 BE 配置中 `doris_scanner_thread_pool_thread_num` 的值。 |
| `max_remote_scan_thread_num` | 整型 | -1 | [1, 2147483647] | 读外部数据源的 scan 线程池最大线程数。为 -1 时，由 BE 自行决定（通常与核数相关）。 |
| `min_remote_scan_thread_num` | 整型 | -1 | [1, 2147483647] | 读外部数据源的 scan 线程池最小线程数。为 -1 时，由 BE 自行决定（通常与核数相关）。 |
| `read_bytes_per_second` | 整型 | -1 | [1, 9223372036854775807] | 读 Doris 内表时的最大 IO 吞吐（字节/秒）。默认为 -1，表示不限制。该值绑定文件夹而非磁盘，落盘文件目录同样受此约束。 |
| `remote_read_bytes_per_second` | 整型 | -1 | [1, 9223372036854775807] | 读 Doris 外表时的最大 IO 吞吐（字节/秒）。默认为 -1，表示不限制。 |

## 配置 Workload Group

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 部署前检查 / 环境验收 -->

### 第一步：配置 CGroup 环境

Workload Group 对 CPU 的管理依赖 CGroup 组件。如果只需要管理内存和 IO 资源，可跳过此步骤。

**1. 确认 CGroup 版本**

```shell
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```

输出中 `cgroup` 表示已安装 CGroup V1，`cgroup2` 表示已安装 CGroup V2。

**2. 确认当前生效的版本**

```shell
# 若存在此路径，说明当前生效的是 CGroup V1
/sys/fs/cgroup/cpu/

# 若存在此路径，说明当前生效的是 CGroup V2
/sys/fs/cgroup/cgroup.controllers
```

**3. 在 CGroup 路径下新建 doris 目录**

```shell
# CGroup V1：在 cpu 目录下新建
mkdir /sys/fs/cgroup/cpu/doris

# CGroup V2：在 cgroup 目录下新建
mkdir /sys/fs/cgroup/doris
```

**4. 授予 BE 进程读/写/执行权限**

```shell
# CGroup V1
chmod 770 /sys/fs/cgroup/cpu/doris
chown -R doris:doris /sys/fs/cgroup/cpu/doris

# CGroup V2
chmod 770 /sys/fs/cgroup/doris
chown -R doris:doris /sys/fs/cgroup/doris
```

**5. CGroup V2 额外操作（V1 跳过）**

修改根目录 `cgroup.procs` 文件权限，使进程可在 CGroup 目录间移动：

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```

确认 doris 目录已启用 cpu 控制器。若 `doris/cgroup.controllers` 中不包含 `cpu`，执行以下命令启用：

```shell
# 执行成功后，doris 目录下会出现 cpu.max 文件，且 cgroup.controllers 输出包含 cpu
# 若失败，说明父级目录也未启用 cpu 控制器，需先为父级目录启用
echo +cpu > ../cgroup.subtree_control
```

**6. 修改 BE 配置，指定 CGroup 路径**

```shell
# CGroup V1
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

# CGroup V2
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```

**7. 重启 BE**

重启后，在 `be.INFO` 日志中看到 `add thread xxx to group` 字样，表示配置成功。

:::tip CGroup 使用注意事项

1. 建议单台机器只部署一个 BE 实例，当前 Workload Group 功能不支持一台机器部署多个 BE。
2. 机器重启后，CGroup 路径下的配置会清空。如需持久化，可使用 systemd 将创建和授权操作设置为系统服务，每次重启时自动执行。
3. 在容器内使用 CGroup 时，需要容器具备操作宿主机的权限。

:::

#### 在容器中使用 Workload Group

<!-- 知识类型: 操作步骤 -->

Workload Group 的 CPU 管理基于 CGroup 实现。在容器中使用时，需以特权模式启动容器，使 Doris 进程具备读写宿主机 CGroup 文件的权限。

容器内的 CPU 资源是在容器可用资源基础上再划分的。例如宿主机为 64 核，容器分配了 8 核，Workload Group 配置 CPU 硬限为 50%，则实际可用核数为 4 核（8 核 × 50%）。

Workload Group 的内存管理和 IO 管理为 Doris 内部实现，不依赖外部组件，在容器和物理机上部署使用没有区别。如需在 Kubernetes 上使用 Doris，建议使用 Doris Operator 进行部署，可屏蔽底层权限细节。

### 第二步：创建 Workload Group

<!-- 知识类型: 操作步骤 -->

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS g1
PROPERTIES (
    "cpu_share" = "1024"
);
```

此时配置的 CPU 限制为软限。自 2.1 版本起，系统自动创建名为 `normal` 的分组，不可删除。

完整语法参考：[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP)

### 第三步：为用户授权并绑定 Workload Group

<!-- 知识类型: 操作步骤 -->

**检查用户权限**

查询 `information_schema.workload_groups` 系统表，返回当前用户有权使用的 Workload Group：

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```

**授予权限**

若用户看不到目标 Workload Group，使用管理员账户执行 GRANT 语句：

```sql
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
```

更多授权操作参考：[GRANT-TO](../../sql-manual/sql-statements/account-management/GRANT-TO)

**绑定方式**

支持两种绑定方式，session 变量优先级高于 user property：

| 绑定方式 | 命令 | 说明 |
|----------|------|------|
| user property（持久） | `SET PROPERTY 'default_workload_group' = 'g1';` | 用户默认使用的 Workload Group，不能填空 |
| session 变量（临时） | `SET workload_group = 'g1';` | 仅当前 session 生效，默认为空 |

## 管理 Workload Group

<!-- 知识类型: 操作步骤 -->

### 查看 Workload Group

**方式一：SHOW 语句**

```sql
SHOW WORKLOAD GROUPS;
```

参考：[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)

**方式二：系统表查询**

```sql
SELECT * FROM information_schema.workload_groups WHERE name = 'g1';
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| ID    | NAME | CPU_SHARE | MEMORY_LIMIT | ENABLE_MEMORY_OVERCOMMIT | MAX_CONCURRENCY | MAX_QUEUE_SIZE | QUEUE_TIMEOUT | CPU_HARD_LIMIT | SCAN_THREAD_NUM | MAX_REMOTE_SCAN_THREAD_NUM | MIN_REMOTE_SCAN_THREAD_NUM | MEMORY_LOW_WATERMARK | MEMORY_HIGH_WATERMARK | TAG  | READ_BYTES_PER_SECOND | REMOTE_READ_BYTES_PER_SECOND |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| 14009 | g1   |      1024 | -1           | true                     |      2147483647 |              0 |             0 | -1             |              -1 |                         -1 |                         -1 | 50%                  | 80%                   |      |                    -1 |                           -1 |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
1 row in set (0.05 sec)
```

### 修改 Workload Group

```sql
ALTER WORKLOAD GROUP g1 PROPERTIES('min_cpu_percent' = '2048');

SELECT cpu_share FROM information_schema.workload_groups WHERE name = 'g1';
+-----------+
| cpu_share |
+-----------+
|      2048 |
+-----------+
1 row in set (0.02 sec)
```

参考：[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)

### 删除 Workload Group

```sql
DROP WORKLOAD GROUP g1;
```

参考：[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)

## 效果验证

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

以下测试均在 1 FE + 1 BE（96 核，375G 内存）的环境中进行，数据集为 ClickBench。

### 验证内存硬限效果

Adhoc 类查询输入不确定，内存用量也不确定，存在少数查询占满内存的风险。将此类负载划分到独立分组并配置内存硬限，可避免突发大查询导致 OOM 或其他查询无内存可用。当该 Workload Group 的内存使用超过硬限值时，会通过 Kill 查询的方式释放内存。

**未开启内存硬限时**

使用 jmeter 发起 3 并发执行 q29，通过 ps 命令观察进程内存约为 7.7G：

```sql
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7896792
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7929692
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 8101232
```

通过系统表查看 Workload Group 内存用量约为 5.8G（进程内存通常远大于单个 Workload Group 的用量，因元数据、Cache 等不计入 Workload Group 统计）：

```sql
SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5797.524360656738 |
+-------------------+
1 row in set (0.01 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5840.246627807617 |
+-------------------+
1 row in set (0.02 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5878.394917488098 |
+-------------------+
1 row in set (0.02 sec)
```

**开启内存硬限后**

1. 将内存限制设置为 1%：

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('memory_limit' = '1%');
    ```

2. 执行同样测试，系统表显示内存用量降至 1.5G 左右：

    ```sql
    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 1575.3877239227295 |
    +--------------------+
    1 row in set (0.02 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +------------------+
    | wg_mem_used_mb   |
    +------------------+
    | 1668.77405834198 |
    +------------------+
    1 row in set (0.01 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 499.96760272979736 |
    +--------------------+
    1 row in set (0.01 sec)
    ```

3. ps 命令显示进程内存降至 3.8G 左右：

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4071364
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4059012
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4057068
    ```

4. 客户端会观察到因内存不足导致的查询失败：

    ```text
    1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",并发 1-3,text,false,,444,0,3,3,null,0,0,0
    ```

:::tip 使用建议

内存硬限通过 Kill 查询的方式释放内存，极端情况下可能导致所有查询失败。生产环境中建议将内存硬限与查询排队功能配合使用，在控制内存用量的同时保证查询成功率。

:::

### 验证 CPU 硬限效果

Doris 的典型负载分为三类，建议配置策略如下：

| 负载类型 | 特点 | 推荐配置 |
|----------|------|----------|
| 核心报表查询 | CPU 密集，高可用性要求 | CPU 软限，配置较高优先级 |
| Adhoc 查询 | SQL 随机，资源用量未知 | CPU 硬限，配置较低值 |
| ETL 查询 | SQL 固定，偶发资源暴涨 | CPU 硬限，防止影响在线业务 |

当 BE 的 CPU 被打满时，集群整体可用性会明显下降（包括 RPC 组件等内部组件可用 CPU 减少）。因此，**生产环境推荐使用 CPU 硬限**，而非软限。

**测试环境**：1 FE，1 BE，96 核机器；数据集为 ClickBench，测试 SQL 为 q29。

1. 使用 jmeter 发起 3 并发查询，将 BE 进程 CPU 使用率压到较高水平（top 命令显示 CPU 使用率为 7600%，即约 76 个核心）：

    ![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 将 Workload Group 的 CPU 硬限修改为 10%：

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('max_cpu_percent' = '10%');
    ```

3. 重新压测，进程仅能使用约 9～10 个核心，占总核数的 10%：

    ![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

4. 通过系统表确认 CPU 使用率已控制在 10% 左右：

    ```sql
    SELECT CPU_USAGE_PERCENT FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```

:::tip 注意事项

1. 建议所有 Workload Group 的 CPU 累加值不要恰好等于 100%，留出一部分给其他组件使用，以保障低延迟场景的可用性。如果对延迟不敏感且追求最高资源利用率，可以将累加值配置为 100%。
2. FE 向 BE 同步 Workload Group 元数据的时间间隔为 30 秒，变更后最长需等待 30 秒才能生效。

:::

:::tip 高吞吐导入的注意事项

使用查询负载测试 CPU 硬限效果更准确。高吞吐导入可能触发 Compaction，导致实际观测值超过 Workload Group 配置值，因为 Compaction 负载目前不纳入 Workload Group 管理。

:::

### 验证本地 IO 硬限效果

OLAP 系统执行 ETL 或大型 Adhoc 查询时，多线程并行扫描多个磁盘文件会产生巨大磁盘 IO，影响其他在线查询。通过对离线 ETL 任务配置 IO 带宽上限，可降低对在线报表分析的影响。

**测试环境**：1 FE，1 BE，96 核机器；数据集为 ClickBench。

**未开启 IO 硬限时**

1. 关闭缓存：

    ```sql
    -- 清空操作系统缓存
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- 禁用 BE 的 page cache
    disable_storage_page_cache = true
    ```

2. 对 ClickBench 表执行全表扫描（单并发）：

    ```sql
    SET dry_run_query = true;
    SELECT * FROM hits.hits;
    ```

3. 通过系统表查看最大吞吐约为 3 GB/s：

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 1146.6208400726318 |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 3496.2762966156006 |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 2192.7690029144287 |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. 使用 pidstat 命令查看进程 IO（第一列为进程 ID，第二列为读 IO 吞吐，单位 KB/s），不限制时最大吞吐约为 2 GB/s：

    ![use workload group io](/images/workload-management/use_wg_io_1.png)

**开启 IO 硬限后**

1. 关闭缓存：

    ```sql
    -- 清空操作系统缓存
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- 禁用 BE 的 page cache
    disable_storage_page_cache = true
    ```

2. 限制最大读吞吐为 100 MB/s：

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('read_bytes_per_second' = '104857600');
    ```

3. 系统表显示最大 IO 吞吐已控制在约 98 MB/s：

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 97.94296646118164  |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.37584781646729  |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.06641292572021  |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. 使用 pidstat 工具查看进程最大 IO 吞吐约为 131 MB/s：

    ![use workload group io](/images/workload-management/use_wg_io_2.png)

:::tip 注意事项

1. 系统表中的 `LOCAL_SCAN_BYTES_PER_SECOND` 是进程粒度的统计汇总值。若配置了 12 个文件路径，该值为 12 个路径 IO 的最大值。如需查看每个文件路径的 IO 吞吐明细，可在 Grafana 监控中查看。
2. 由于操作系统和 Doris 的 Page Cache 的存在，通过 Linux IO 监控脚本看到的 IO 通常比系统表中的值小。

:::

### 验证远程 IO 硬限效果

BrokerLoad 和 S3Load 是常用的大批量数据导入方式。Doris 使用多线程并行从 HDFS/S3 拉取数据时，会对外部存储产生巨大压力，影响其他作业的稳定性。通过配置远程 IO 带宽上限，可降低导入对其他业务的影响。

**测试环境**：1 FE + 1 BE 部署在同一台机器，16 核 64G 内存；测试数据为 ClickBench 数据集中 1000 万行数据，已上传到 S3。

查看 Schema 信息：

```sql
DESC FUNCTION s3 (
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style" = "true"
);
```

**未限制远程读 IO 时**

1. 发起单并发全表扫描：

    ```sql
    -- 设置只 scan 数据，不返回结果
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

2. 系统表显示远程 IO 吞吐约为 837 MB/s（实际吞吐受 BE 与外部存储间带宽影响）：

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     837 |
    +---------+
    1 row in set (0.104 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.070 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.186 sec)
    ```

3. 使用 `sar -n DEV 1 3600` 查看机器网络带宽（第一列为每秒接收字节数，单位 KB/s），机器级最大网络带宽约为 1033 MB/s：

    ![use workload group rio](/images/workload-management/use_wg_rio_1.png)

**限制远程读 IO 后**

1. 将远程读 IO 吞吐限制为 100 MB/s：

    ```sql
    ALTER WORKLOAD GROUP normal PROPERTIES('remote_read_bytes_per_second' = '104857600');
    ```

2. 发起单并发全表扫描：

    ```sql
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

3. 系统表显示远程读 IO 吞吐控制在约 100 MB/s（受算法设计影响会有波动，出现短暂峰值属正常情况）：

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |      56 |
    +---------+
    1 row in set (0.010 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     131 |
    +---------+
    1 row in set (0.009 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     111 |
    +---------+
    1 row in set (0.009 sec)
    ```

4. 使用 `sar -n DEV 1 3600` 查看网卡接收流量（第一列为每秒接收数据量），最大值变为约 207 MB/s，IO 限制已生效（sar 命令显示的是机器级别流量，通常比 Doris 统计值大）：

    ![use workload group rio](/images/workload-management/use_wg_rio_2.png)

## 常见问题

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

### Q: 配置了 CPU 硬限但未生效**

1. **环境初始化失败**：检查 CGroup V1 路径下 `/sys/fs/cgroup/cpu/doris/query/1/tasks` 文件是否包含对应 Workload Group 的线程号（可用 `top -H -b -n 1 -p pid` 获取），以及 `cpu.cfs_quota_us` 文件的值是否为 -1（为 -1 表示硬限未生效）。
2. **BE 进程 CPU 超过配置值**：Workload Group 管理的是查询线程和导入 memtable 下刷线程，BE 内的其他组件（如 Compaction）同样消耗 CPU，因此进程 CPU 使用通常高于 Workload Group 配置值。可创建测试 Workload Group，通过 `information_schema.workload_group_resource_usage` 查看 Workload Group 自身的 CPU 使用率（2.1.6 版本起支持）。
3. **配置了 `cpu_resource_limit` 参数**：执行 `SHOW PROPERTY FOR jack LIKE 'cpu_resource_limit'` 和 `SHOW VARIABLES LIKE 'cpu_resource_limit'` 确认是否设置了该参数（默认值 -1 表示未设置）。配置该参数后，查询走独立线程池，不受 Workload Group 管理。迁移建议：分批次将用户的 `num_scanner_threads` 设为 1，指定 Workload Group，再将 `cpu_resource_limit` 改为 -1，观察稳定后继续迁移。

### Q: 默认 Workload Group 个数限制为 15 个**

Workload Group 是对单机资源的划分，分组过多会导致每个分组可用资源过少。如果业务确实需要更多分组，可以考虑将集群划分为多组不同的 BE，为每组 BE 创建不同的 Workload Group；也可以修改 FE 配置 `workload_group_max_num` 临时绕开此限制。

### Q: 配置较多 Workload Group 后报错 "Resource temporarily unavailable"**

每个 Workload Group 都是一组独立的线程池，创建过多时 BE 进程尝试启动的线程数可能超过操作系统允许的上限。解决方案：修改操作系统配置，允许 BE 进程创建更多线程。
