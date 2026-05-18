---
{
    "title": "数据副本管理",
    "language": "zh-CN",
    "description": "介绍 Doris Tablet 副本均衡与修复的调度策略、副本状态查看方法和常用运维命令，帮助管理员高效管理集群副本。"
}
---

# 数据副本管理

本文档面向集群管理员，介绍 Apache Doris 的副本均衡与修复机制、调度优先级、副本状态查看方法，以及在副本异常或集群负载倾斜时常用的运维手段。

从 0.9.0 版本开始，Doris 引入了优化后的副本管理策略，并提供了更丰富的副本状态查看工具。借助本文档，可以掌握副本调度原理，并在副本损坏、节点宕机、磁盘倾斜等场景下快速恢复集群。

> Colocation 属性的表的副本修复和均衡可以参阅 [Colocate Join](../../query-data/join#colocate-join)。

<!-- 知识类型: 架构原理 / 运维操作 -->
<!-- 适用场景: 副本修复 / 集群均衡 / 状态排查 -->

## 适用场景

| 场景 | 推荐章节 |
| --- | --- |
| 理解副本调度原理 | [副本修复](#副本修复)、[副本均衡](#副本均衡) |
| 查看集群整体副本健康状态 | [副本状态查看](#副本状态查看) |
| 定位某个 Tablet 异常副本 | [Tablet 级别状态检查](#tablet-级别状态检查) |
| BE 宕机或磁盘故障后手动恢复 | [最佳实践](#最佳实践) |
| 调整修复 / 均衡速度或暂停均衡 | [资源控制](#资源控制)、[相关配置说明](#相关配置说明) |
| 集群负载倾斜 / 磁盘使用率不均 | [副本均衡](#副本均衡) |

## 名词解释

| 术语 | 含义 |
| --- | --- |
| Tablet | Doris 表的逻辑分片，一个表有多个分片。 |
| Replica | 分片的副本，默认一个分片有 3 个副本。 |
| Healthy Replica | 健康副本：副本所在 Backend 存活，且副本的版本完整。 |
| TabletChecker（TC） | 常驻后台线程，定期扫描所有 Tablet，检查其状态，并根据结果决定是否将 Tablet 发送给 TabletScheduler。 |
| TabletScheduler（TS） | 常驻后台线程，处理由 TabletChecker 发来的需修复 Tablet，同时进行集群副本均衡。 |
| TabletSchedCtx（TSC） | 对一个 Tablet 的封装。TC 选择 Tablet 后会将其封装为 TSC 发送给 TS。 |
| Storage Medium | 存储介质。Doris 支持对分区粒度指定不同的存储介质（SSD 和 HDD）。副本调度策略针对不同存储介质分别调度。 |

整体工作流程如下：

```text

              +--------+              +-----------+
              |  Meta  |              |  Backends |
              +---^----+              +------^----+
                  | |                        | 3. Send clone tasks
 1. Check tablets | |                        |
           +--------v------+        +-----------------+
           | TabletChecker +--------> TabletScheduler |
           +---------------+        +-----------------+
                   2. Waiting to be scheduled


```

上图是一个简化的工作流程：TabletChecker 检查 Tablet 状态，将需修复的 Tablet 交给 TabletScheduler，后者向 BE 下发 clone 任务。

## 副本状态

一个 Tablet 的多个副本，可能因为某些情况导致状态不一致。Doris 会尝试自动修复这些状态不一致的副本，让集群尽快从错误状态中恢复。

### Replica 健康状态

| 状态 | 含义 |
| --- | --- |
| BAD | 副本损坏。包括但不限于磁盘故障、BUG 等引起的副本不可恢复的损毁状态。 |
| VERSION\_MISSING | 版本缺失。Doris 中每一批次导入都对应一个数据版本，而一个副本的数据由多个连续的版本组成。由于导入错误、延迟等原因，可能导致某些副本的数据版本不完整。 |
| HEALTHY | 健康副本。数据正常且副本所在的 BE 节点状态正常（心跳正常且不处于下线过程中）。 |

### Tablet 健康状态

Tablet 的健康状态由其所有副本的状态决定，有以下几种：

| 状态 | 含义 |
| --- | --- |
| REPLICA\_MISSING | 副本缺失。存活副本数小于期望副本数。 |
| VERSION\_INCOMPLETE | 存活副本数大于等于期望副本数，但其中健康副本数小于期望副本数。 |
| REPLICA\_RELOCATING | 拥有等于 replication num 的版本完整存活副本数，但部分副本所在的 BE 节点处于 unavailable 状态（如 decommission 中）。 |
| REPLICA\_MISSING\_IN\_CLUSTER | 多 cluster 场景下，健康副本数大于等于期望副本数，但在对应 cluster 内的副本数小于期望副本数。 |
| REDUNDANT | 副本冗余。健康副本都在对应 cluster 内，但数量大于期望副本数；或存在多余的 unavailable 副本。 |
| FORCE\_REDUNDANT | 特殊状态。仅在「已存在副本数 ≥ 可用节点数 ≥ 期望副本数，且存活副本数 < 期望副本数」时出现。此时需先删除一个副本，腾出可用节点用于创建新副本。 |
| COLOCATE\_MISMATCH | 针对 Colocation 表的分片状态：分片副本与 Colocation Group 指定的分布不一致。 |
| COLOCATE\_REDUNDANT | 针对 Colocation 表的分片状态：Colocation 表的分片副本冗余。 |
| HEALTHY | 健康分片，即上述条件 1~8 均不满足。 |

## 副本修复

TabletChecker 作为常驻后台进程，会定期检查所有分片的状态。对于非健康状态的分片，将交给 TabletScheduler 进行调度和修复。修复的实际操作由 BE 上的 clone 任务完成，FE 只负责生成这些 clone 任务。

> 注 1：副本修复的主要思想是先通过创建或补齐使得分片的副本数达到期望值，然后再删除多余的副本。
>
> 注 2：一个 clone 任务就是完成从一个指定远端 BE 拷贝指定数据到指定目的端 BE 的过程。

### 按状态修复

针对不同的状态，Doris 采用不同的修复方式：

1. REPLICA\_MISSING / REPLICA\_RELOCATING

    选择一个低负载且可用的 BE 节点作为目的端，选择一个健康副本作为源端。clone 任务会从源端拷贝一个完整的副本到目的端。对于副本补齐，会直接选择一个可用的 BE 节点，不考虑存储介质。

2. VERSION\_INCOMPLETE

    选择一个相对完整的副本作为目的端，选择一个健康副本作为源端。clone 任务会从源端尝试拷贝缺失的版本到目的端的副本。

3. REPLICA\_MISSING\_IN\_CLUSTER

    处理方式与 REPLICA\_MISSING 相同。

4. REDUNDANT

    通常经过副本修复后，分片会有冗余的副本。会选择一个冗余副本进行删除。冗余副本的选择遵从以下优先级：

    1. 副本所在 BE 已经下线
    2. 副本已损坏
    3. 副本所在 BE 失联或在下线中
    4. 副本处于 CLONE 状态（clone 任务执行过程中的中间状态）
    5. 副本有版本缺失
    6. 副本所在 cluster 不正确
    7. 副本所在 BE 节点负载高

5. FORCE\_REDUNDANT

    不同于 REDUNDANT，此时虽然存活的副本数小于期望副本数，但是已经没有额外的可用节点用于创建新的副本。因此必须先删除一个副本，以腾出一个可用节点用于创建新的副本。删除副本的顺序同 REDUNDANT。

6. COLOCATE\_MISMATCH

    从 Colocation Group 中指定的副本分布 BE 节点中选择一个作为目的节点进行副本补齐。

7. COLOCATE\_REDUNDANT

    删除一个非 Colocation Group 中指定的副本分布 BE 节点上的副本。

Doris 在选择副本节点时，不会将同一个 Tablet 的副本部署在同一个 host 的不同 BE 上，保证即使同一个 host 上的所有 BE 都挂掉，也不会造成全部副本丢失。

### 调度优先级

TabletScheduler 中等待调度的分片会根据状态不同被赋予不同的优先级，优先级高的分片优先调度。目前有以下几种优先级：

| 优先级 | 触发条件 |
| --- | --- |
| VERY\_HIGH | REDUNDANT：有副本冗余的分片。虽然紧急程度最低，但处理最快且能快速释放磁盘空间等资源，故优先处理。<br/>FORCE\_REDUNDANT：同上。 |
| HIGH | REPLICA\_MISSING 且多数副本缺失（如 3 副本丢失 2 个）。<br/>VERSION\_INCOMPLETE 且多数副本的版本缺失。<br/>COLOCATE\_MISMATCH：希望 Colocation 表相关的分片尽快修复完成。<br/>COLOCATE\_REDUNDANT。 |
| NORMAL | REPLICA\_MISSING 但多数存活（如 3 副本丢失 1 个）。<br/>VERSION\_INCOMPLETE 但多数副本的版本完整。<br/>REPLICA\_RELOCATING 且多数副本需 relocate（如 3 副本有 2 个）。 |
| LOW | REPLICA\_MISSING\_IN\_CLUSTER。<br/>REPLICA\_RELOCATING 但多数副本 stable。 |

### 手动优先级

系统会自动判断调度优先级。但有时希望某些表或分区的分片能够更快被修复，可以通过以下命令指定某个表或分区的分片优先修复：

```sql
ADMIN REPAIR TABLE tbl [PARTITION (p1, p2, ...)];
```

这个命令告诉 TabletChecker，在扫描 Tablet 时，对需要优先修复的表或分区中的有问题 Tablet，给予 `VERY_HIGH` 的优先级。

> 注：此命令只是一个 hint，并不能保证一定修复成功，且优先级会随 TabletScheduler 的调度而发生变化。Master FE 切换或重启后，这些信息会丢失。

取消优先级使用以下命令：

```sql
ADMIN CANCEL REPAIR TABLE tbl [PARTITION (p1, p2, ...)];
```

### 优先级动态调整

优先级保证了损坏严重的分片能够优先修复，提高系统可用性。但如果高优先级的修复任务一直失败，则会导致低优先级的任务一直得不到调度。因此 Doris 会根据任务的运行状态，动态调整任务的优先级，保证所有任务都有机会被调度：

- 连续 5 次调度失败（如无法获取资源、无法找到合适的源端或目的端等），优先级会被下调。
- 持续 30 分钟未被调度，则上调优先级。
- 同一 Tablet 任务的优先级至少间隔 5 分钟才会被调整一次。

同时，为保证初始优先级的权重，规定：初始优先级为 `VERY_HIGH` 的，最低被下调到 `NORMAL`；初始优先级为 `LOW` 的，最多被上调为 `HIGH`。此动态调整同样作用于用户手动设置的优先级。

## 副本均衡

Doris 会自动进行集群内的副本均衡。目前支持两种均衡策略：**负载均衡** 和 **分区均衡**。

| 策略 | 主要目标 | 适用场景 | 注意事项 |
| --- | --- | --- | --- |
| 负载均衡 | 兼顾节点磁盘使用率和副本数量 | 需同时关注磁盘容量与副本均衡 | 综合两个维度计算 score |
| 分区均衡 | 使每个分区的副本均匀分布到各节点 | 对分区读写要求较高、需避免热点 | 不考虑磁盘使用率，需关注磁盘容量 |

策略只能在 FE 启动前通过 [tablet_rebalancer_type](../config/fe-config) 配置，不支持运行时切换。

无论哪种策略，副本均衡都会保证不会将同一个 Tablet 的副本部署在同一个 host 的 BE 上。

### 负载均衡

负载均衡的主要思想是：对某些分片，先在低负载的节点上创建一个副本，然后再删除这些分片在高负载节点上的副本。同时，因为不同存储介质的存在，在同一个集群内的不同 BE 节点上，可能存在一种或两种存储介质。要求存储介质为 A 的分片在均衡后，尽量仍存储在存储介质 A 中。因此根据存储介质对集群的 BE 节点进行划分，针对不同存储介质的 BE 节点集合分别进行负载均衡调度。

#### BE 节点负载

使用 `ClusterLoadStatistics`（CLS）表示一个 cluster 中各 Backend 的负载均衡情况。TabletScheduler 根据这个统计值来触发集群均衡。当前通过 **磁盘使用率** 和 **副本数量** 两个指标，为每个 BE 计算一个 loadScore 作为 BE 的负载分数。分数越高，表示该 BE 的负载越重。

磁盘使用率和副本数量各有一个权重系数，分别为 **capacityCoefficient** 和 **replicaNumCoefficient**，**两者之和恒为 1**。

- 若系统配置了有效的 `backend_load_capacity_coeficient` 参数（取值范围 `0.0`~`1.0`），则 `capacityCoefficient = backend_load_capacity_coeficient`。
- 否则，`capacityCoefficient` 会根据实际磁盘使用率动态调整：
    - 当 BE 总体磁盘使用率在 50% 以下，`capacityCoefficient` 值为 0.5。
    - 当磁盘使用率在 75%（可通过 FE 配置项 `capacity_used_percent_high_water` 调整）以上，值为 1。
    - 当使用率介于 50%~75% 之间，权重系数平滑增加，公式为：

```text
capacityCoefficient = 2 * 磁盘使用率 - 0.5
```

该权重系数保证当磁盘使用率过高时，该 Backend 的负载分数会更高，以尽快降低这个 BE 的负载。

TabletScheduler 会每隔 20 秒更新一次 CLS。

### 分区均衡

分区均衡的主要思想是：将每个分区在各个 Backend 上的 replica 数量差（即 partition skew）减少到最小。因此只考虑副本个数，不考虑磁盘使用率。

为了尽量少的迁移次数，分区均衡使用二维贪心策略，优先均衡 partition skew 最大的分区。均衡分区时会尽量选择能使整个 cluster 在各 Backend 上的 replica 数量差（即 cluster skew / total skew）减少的方向。

#### skew 统计

skew 统计信息由 `ClusterBalanceInfo` 表示：

- `partitionInfoBySkew`：以 partition skew 为 key 排序，便于找到 max partition skew。
- `beByTotalReplicaCount`：以 Backend 上的所有 replica 个数为 key 排序。

`ClusterBalanceInfo` 同样保存在 CLS 中，同样 20 秒更新一次。max partition skew 的分区可能有多个，采用随机的方式选择一个分区计算。

### 均衡策略调度

TabletScheduler 在每轮调度时，都会通过 LoadBalancer 选择一定数目的健康分片作为 balance 的候选分片。在下一次调度时，会尝试根据这些候选分片进行均衡调度。

## 资源控制

无论是副本修复还是均衡，都通过副本在各个 BE 之间拷贝完成。如果同一台 BE 同一时间执行过多的任务，会带来不小的 IO 压力。因此 Doris 在调度时控制了每个节点上能够执行的任务数目。

| 资源 | 说明 |
| --- | --- |
| 资源控制单位 | 最小为磁盘，即 `be.conf` 中指定的一个数据路径。 |
| 副本修复 slot | 每块磁盘默认 2 个 slot。一个 clone 任务会占用源端和目的端各一个 slot。slot 为 0 时不再分配任务。可通过 FE 的 `schedule_slot_num_per_hdd_path` 或 `schedule_slot_num_per_ssd_path` 调整。 |
| 均衡任务 slot | 每块磁盘默认提供 2 个独立 slot，用于均衡任务。目的是防止高负载节点因 slot 被修复任务占用而无法通过均衡释放空间。 |

## 副本状态查看

副本状态查看主要用于了解副本的状态以及副本修复和均衡任务的运行状态。这些状态大部分都**仅存在于** Master FE 节点中，因此以下命令需直连到 Master FE 执行。

### 副本状态

#### 全局状态检查

通过 `SHOW PROC '/cluster_health/tablet_health';` 命令可以查看整个集群的副本状态：

```text
+-------+--------------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
| DbId  | DbName                         | TabletNum | HealthyNum | ReplicaMissingNum | VersionIncompleteNum | ReplicaRelocatingNum | RedundantNum | ReplicaMissingInClusterNum | ReplicaMissingForTagNum | ForceRedundantNum | ColocateMismatchNum | ColocateRedundantNum | NeedFurtherRepairNum | UnrecoverableNum | ReplicaCompactionTooSlowNum | InconsistentNum | OversizeNum | CloningNum |
+-------+--------------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
| 10005 | default_cluster:doris_audit_db | 84        | 84         | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
| 13402 | default_cluster:ssb1           | 709       | 708        | 1                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
| 10108 | default_cluster:tpch1          | 278       | 278        | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
| Total | 3                              | 1071      | 1070       | 1                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
+-------+--------------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
```

关键列说明：

- `HealthyNum`：对应 Database 中健康状态的 Tablet 数。
- `ReplicaCompactionTooSlowNum`：副本版本数过多的 Tablet 数。
- `InconsistentNum`：副本不一致的 Tablet 数。
- `Total` 行：整个集群的统计。正常情况下 `TabletNum` 与 `HealthyNum` 应相等；若不等，可进一步定位具体 Tablet。

例如，`ssb1` 数据库有 1 个 Tablet 状态不健康，可通过以下命令查看具体 Tablet（其中 `13402` 为对应的 DbId）：

```sql
SHOW PROC '/cluster_health/tablet_health/13402';
```

```text
+-----------------------+--------------------------+--------------------------+------------------+--------------------------------+-----------------------------+-----------------------+-------------------------+--------------------------+--------------------------+----------------------+---------------------------------+---------------------+-----------------+
| ReplicaMissingTablets | VersionIncompleteTablets | ReplicaRelocatingTablets | RedundantTablets | ReplicaMissingInClusterTablets | ReplicaMissingForTagTablets | ForceRedundantTablets | ColocateMismatchTablets | ColocateRedundantTablets | NeedFurtherRepairTablets | UnrecoverableTablets | ReplicaCompactionTooSlowTablets | InconsistentTablets | OversizeTablets |
+-----------------------+--------------------------+--------------------------+------------------+--------------------------------+-----------------------------+-----------------------+-------------------------+--------------------------+--------------------------+----------------------+---------------------------------+---------------------+-----------------+
| 14679                 |                          |                          |                  |                                |                             |                       |                         |                          |                          |                      |                                 |                     |                 |
+-----------------------+--------------------------+--------------------------+------------------+--------------------------------+-----------------------------+-----------------------+-------------------------+--------------------------+--------------------------+----------------------+---------------------------------+---------------------+-----------------+
```

输出会显示具体的不健康 Tablet ID（如 14679），该 Tablet 处于 `ReplicaMissing` 状态。下一节将介绍如何查看具体 Tablet 的各副本状态。

#### 表（分区）级别状态检查

可通过以下命令查看指定表或分区的副本状态，并通过 `WHERE` 语句对状态进行过滤。例如，查看表 `tbl1` 中分区 `p1` 和 `p2` 上状态为 OK 的副本：

```sql
SHOW REPLICA STATUS FROM tbl1 PARTITION (p1, p2) WHERE STATUS = "OK";
```

```text
+----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+--------+--------+
| TabletId | ReplicaId | BackendId | Version | LastFailedVersion | LastSuccessVersion | CommittedVersion | SchemaHash | VersionNum | IsBad | State  | Status |
+----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+--------+--------+
| 29502429 | 29502432  | 10006     | 2       | -1                | 2                  | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502429 | 36885996  | 10002     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502429 | 48100551  | 10007     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502433 | 29502434  | 10001     | 2       | -1                | 2                  | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502433 | 44900737  | 10004     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502433 | 48369135  | 10006     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
+----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+--------+--------+
```

这里会展示所有副本的状态：

- `IsBad` 列为 `true` 表示副本已损坏。
- `Status` 列显示其他状态。具体说明可通过 `HELP SHOW REPLICA STATUS;` 查看。

`SHOW REPLICA STATUS` 命令主要用于查看副本的健康状态。如需查看副本的更多额外信息，可使用：

```sql
SHOW TABLETS FROM tbl1;
```

```text
+----------+-----------+-----------+------------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+----------+----------+--------+-------------------------+--------------+----------------------+--------------+----------------------+----------------------+----------------------+
| TabletId | ReplicaId | BackendId | SchemaHash | Version | VersionHash | LstSuccessVersion | LstSuccessVersionHash | LstFailedVersion | LstFailedVersionHash | LstFailedTime | DataSize | RowCount | State  | LstConsistencyCheckTime | CheckVersion |     CheckVersionHash | VersionCount | PathHash             | MetaUrl              | CompactionStatus     |
+----------+-----------+-----------+------------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+----------+----------+--------+-------------------------+--------------+----------------------+--------------+----------------------+----------------------+----------------------+
| 29502429 | 29502432  | 10006     | 1421156361 | 2       | 0           | 2                 | 0                     | -1               | 0                    | N/A           | 784      | 0        | NORMAL | N/A                     | -1           |     -1               | 2            | -5822326203532286804 | url                  | url                  |
| 29502429 | 36885996  | 10002     | 1421156361 | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | 784      | 0        | NORMAL | N/A                     | -1           |     -1               | 2            | -1441285706148429853 | url                  | url                  |
| 29502429 | 48100551  | 10007     | 1421156361 | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | 784      | 0        | NORMAL | N/A                     | -1           |     -1               | 2            | -4784691547051455525 | url                  | url                  |
+----------+-----------+-----------+------------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+----------+----------+--------+-------------------------+--------------+----------------------+--------------+----------------------+----------------------+----------------------+
```

上图展示了副本大小、行数、版本数量、所在数据路径等额外信息。

> 注：这里显示的 `State` 列内容不代表副本的健康状态，而是副本所处的任务状态，例如 CLONE、SCHEMA\_CHANGE、ROLLUP 等。

此外，还可以通过以下命令查看指定表或分区的副本分布情况，检查副本分布是否均匀：

```sql
SHOW REPLICA DISTRIBUTION FROM tbl1;
```

```text
+-----------+------------+-------+---------+
| BackendId | ReplicaNum | Graph | Percent |
+-----------+------------+-------+---------+
| 10000     | 7          |       | 7.29 %  |
| 10001     | 9          |       | 9.38 %  |
| 10002     | 7          |       | 7.29 %  |
| 10003     | 7          |       | 7.29 %  |
| 10004     | 9          |       | 9.38 %  |
| 10005     | 11         | >     | 11.46 % |
| 10006     | 18         | >     | 18.75 % |
| 10007     | 15         | >     | 15.62 % |
| 10008     | 13         | >     | 13.54 % |
+-----------+------------+-------+---------+
```

输出分别展示了表 `tbl1` 的副本在各 BE 节点上的个数、百分比，以及一个简单的图形化显示。

#### Tablet 级别状态检查

当需要定位某个具体的 Tablet 时，可使用以下命令。例如查看 ID 为 `29502553` 的 Tablet：

```sql
SHOW TABLET 29502553;
```

```text
+------------------------+-----------+---------------+-----------+----------+----------+-------------+----------+--------+---------------------------------------------------------------------------+
| DbName                 | TableName | PartitionName | IndexName | DbId     | TableId  | PartitionId | IndexId  | IsSync | DetailCmd                                                                 |
+------------------------+-----------+---------------+-----------+----------+----------+-------------+----------+--------+---------------------------------------------------------------------------+
| default_cluster:test   | test      | test          | test      | 29502391 | 29502428 | 29502427    | 29502428 | true   | SHOW PROC '/dbs/29502391/29502428/partitions/29502427/29502428/29502553'; |
+------------------------+-----------+---------------+-----------+----------+----------+-------------+----------+--------+---------------------------------------------------------------------------+
```

输出显示了 Tablet 所对应的数据库、表、分区、上卷表等信息。复制 `DetailCmd` 列中的命令继续执行：

```sql
SHOW PROC '/dbs/29502391/29502428/partitions/29502427/29502428/29502553';
```

```text
+-----------+-----------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+------------+----------+----------+--------+-------+--------------+----------------------+----------+------------------+
| ReplicaId | BackendId | Version | VersionHash | LstSuccessVersion | LstSuccessVersionHash | LstFailedVersion | LstFailedVersionHash | LstFailedTime | SchemaHash | DataSize | RowCount | State  | IsBad | VersionCount | PathHash             | MetaUrl  | CompactionStatus |
+-----------+-----------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+------------+----------+----------+--------+-------+--------------+----------------------+----------+------------------+
| 43734060  | 10004     | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | -1         | 784      | 0        | NORMAL | false | 2            | -8566523878520798656 | url      | url              |
| 29502555  | 10002     | 2       | 0           | 2                 | 0                     | -1               | 0                    | N/A           | -1         | 784      | 0        | NORMAL | false | 2            | 1885826196444191611  | url      | url              |
| 39279319  | 10007     | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | -1         | 784      | 0        | NORMAL | false | 2            | 1656508631294397870  | url      | url              |
+-----------+-----------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+------------+----------+----------+--------+-------+--------------+----------------------+----------+------------------+
```

输出显示了对应 Tablet 所有副本的情况。内容与 `SHOW TABLETS FROM tbl1;` 相同，但能清楚地看到一个具体 Tablet 所有副本的状态。

### 副本调度任务

可通过以下命令分别查看 **等待中**、**运行中**、**已结束** 的调度任务：

| 状态 | 命令 |
| --- | --- |
| 等待调度 | `SHOW PROC '/cluster_balance/pending_tablets';` |
| 正在运行 | `SHOW PROC '/cluster_balance/running_tablets';` |
| 已结束 | `SHOW PROC '/cluster_balance/history_tablets';` |

示例输出（`pending_tablets`）：

```text
+----------+--------+-----------------+---------+----------+----------+-------+---------+--------+----------+---------+---------------------+---------------------+---------------------+----------+------+-------------+---------------+---------------------+------------+---------------------+--------+---------------------+-------------------------------+
| TabletId | Type   | Status          | State   | OrigPrio | DynmPrio | SrcBe | SrcPath | DestBe | DestPath | Timeout | Create              | LstSched            | LstVisit            | Finished | Rate | FailedSched | FailedRunning | LstAdjPrio          | VisibleVer | VisibleVerHash      | CmtVer | CmtVerHash          | ErrMsg                        |
+----------+--------+-----------------+---------+----------+----------+-------+---------+--------+----------+---------+---------------------+---------------------+---------------------+----------+------+-------------+---------------+---------------------+------------+---------------------+--------+---------------------+-------------------------------+
| 4203036  | REPAIR | REPLICA_MISSING | PENDING | HIGH     | LOW      | -1    | -1      | -1     | -1       | 0       | 2019-02-21 15:00:20 | 2019-02-24 11:18:41 | 2019-02-24 11:18:41 | N/A      | N/A  | 2           | 0             | 2019-02-21 15:00:43 | 1          | 0                   | 2      | 0                   | unable to find source replica |
+----------+--------+-----------------+---------+----------+----------+-------+---------+--------+----------+---------+---------------------+---------------------+---------------------+----------+------+-------------+---------------+---------------------+------------+---------------------+--------+---------------------+-------------------------------+
```

各列含义如下：

| 列 | 含义 |
| --- | --- |
| TabletId | 等待调度的 Tablet 的 ID。一个调度任务只针对一个 Tablet。 |
| Type | 任务类型：REPAIR（修复）或 BALANCE（均衡）。 |
| Status | 该 Tablet 当前的状态，如 REPLICA\_MISSING（副本缺失）。 |
| State | 调度任务状态：PENDING / RUNNING / FINISHED / CANCELLED / TIMEOUT / UNEXPECTED。 |
| OrigPrio | 初始优先级。 |
| DynmPrio | 当前动态调整后的优先级。 |
| SrcBe | 源端 BE 节点的 ID。 |
| SrcPath | 源端 BE 节点路径的 hash 值。 |
| DestBe | 目的端 BE 节点的 ID。 |
| DestPath | 目的端 BE 节点路径的 hash 值。 |
| Timeout | 任务被调度成功后的超时时间，单位秒。 |
| Create | 任务被创建的时间。 |
| LstSched | 上一次任务被调度的时间。 |
| LstVisit | 上一次任务被访问的时间。"被访问"指与该任务相关的所有处理时间点，包括被调度、任务执行汇报等。 |
| Finished | 任务结束时间。 |
| Rate | clone 任务的数据拷贝速率。 |
| FailedSched | 任务调度失败的次数。 |
| FailedRunning | 任务执行失败的次数。 |
| LstAdjPrio | 上一次优先级调整的时间。 |
| CmtVer / CmtVerHash / VisibleVer / VisibleVerHash | 用于执行 clone 任务的 version 信息。 |
| ErrMsg | 任务被调度和运行过程中出现的错误信息。 |

`running_tablets` 各列含义与 `pending_tablets` 相同。

`history_tablets` 默认只保留最近 1000 个完成的任务，各列含义同上：

- `State` 列为 `FINISHED` 表示任务正常完成。
- 其他值则可根据 `ErrMsg` 列的错误信息查看具体原因。

## 集群负载及调度资源查看

### 集群负载

通过以下命令可查看集群当前的负载情况：

```sql
SHOW PROC '/cluster_balance/cluster_load_stat/location_default';
```

首先看到的是对不同存储介质的划分：

```text
+---------------+
| StorageMedium |
+---------------+
| HDD           |
| SSD           |
+---------------+
```

点击某一种存储介质，可以看到包含该存储介质的 BE 节点的均衡状态：

```sql
SHOW PROC '/cluster_balance/cluster_load_stat/location_default/HDD';
```

```text
+----------+-----------------+-----------+---------------+----------------+-------------+------------+----------+-----------+--------------------+-------+
| BeId     | Cluster         | Available | UsedCapacity  | Capacity       | UsedPercent | ReplicaNum | CapCoeff | ReplCoeff | Score              | Class |
+----------+-----------------+-----------+---------------+----------------+-------------+------------+----------+-----------+--------------------+-------+
| 10003    | default_cluster | true      | 3477875259079 | 19377459077121 | 17.948      | 493477     | 0.5      | 0.5       | 0.9284678149967587 | MID   |
| 10002    | default_cluster | true      | 3607326225443 | 19377459077121 | 18.616      | 496928     | 0.5      | 0.5       | 0.948660871419998  | MID   |
| 10005    | default_cluster | true      | 3523518578241 | 19377459077121 | 18.184      | 545331     | 0.5      | 0.5       | 0.9843539990641831 | MID   |
| 10001    | default_cluster | true      | 3535547090016 | 19377459077121 | 18.246      | 558067     | 0.5      | 0.5       | 0.9981869446537612 | MID   |
| 10006    | default_cluster | true      | 3636050364835 | 19377459077121 | 18.764      | 547543     | 0.5      | 0.5       | 1.0011489897614072 | MID   |
| 10004    | default_cluster | true      | 3506558163744 | 15501967261697 | 22.620      | 468957     | 0.5      | 0.5       | 1.0228319835582569 | MID   |
| 10007    | default_cluster | true      | 4036460478905 | 19377459077121 | 20.831      | 551645     | 0.5      | 0.5       | 1.057279369420761  | MID   |
| 10000    | default_cluster | true      | 4369719923760 | 19377459077121 | 22.551      | 547175     | 0.5      | 0.5       | 1.0964036415787461 | MID   |
+----------+-----------------+-----------+---------------+----------------+-------------+------------+----------+-----------+--------------------+-------+
```

各列含义如下：

| 列 | 含义 |
| --- | --- |
| Available | 为 true 表示 BE 心跳正常且未在下线中。 |
| UsedCapacity | 字节，BE 已使用的磁盘空间大小。 |
| Capacity | 字节，BE 总的磁盘空间大小。 |
| UsedPercent | 百分比，BE 上磁盘空间使用率。 |
| ReplicaNum | BE 上副本数量。 |
| CapCoeff / ReplCoeff | 磁盘空间和副本数的权重系数。 |
| Score | 负载分数。分数越高负载越重。 |
| Class | 根据负载情况分类：LOW / MID / HIGH。均衡调度会将高负载节点上的副本迁往低负载节点。 |

可以进一步查看某个 BE 上各个路径的使用率。例如查看 ID 为 10001 的 BE：

```sql
SHOW PROC '/cluster_balance/cluster_load_stat/location_default/HDD/10001';
```

```text
+------------------+------------------+---------------+---------------+---------+--------+----------------------+
| RootPath         | DataUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | State  | PathHash             |
+------------------+------------------+---------------+---------------+---------+--------+----------------------+
| /home/disk4/palo | 498.757 GB       | 3.033 TB      | 3.525 TB      | 13.94 % | ONLINE | 4883406271918338267  |
| /home/disk3/palo | 704.200 GB       | 2.832 TB      | 3.525 TB      | 19.65 % | ONLINE | -5467083960906519443 |
| /home/disk1/palo | 512.833 GB       | 3.007 TB      | 3.525 TB      | 14.69 % | ONLINE | -7733211489989964053 |
| /home/disk2/palo | 881.955 GB       | 2.656 TB      | 3.525 TB      | 24.65 % | ONLINE | 4870995507205544622  |
| /home/disk5/palo | 694.992 GB       | 2.842 TB      | 3.525 TB      | 19.36 % | ONLINE | 1916696897889786739  |
+------------------+------------------+---------------+---------------+---------+--------+----------------------+
```

输出显示了指定 BE 上各数据路径的磁盘使用率情况。

### 调度资源

通过以下命令可以查看当前各节点的 slot 使用情况：

```sql
SHOW PROC '/cluster_balance/working_slots';
```

```text
+----------+----------------------+------------+------------+-------------+----------------------+
| BeId     | PathHash             | AvailSlots | TotalSlots | BalanceSlot | AvgRate              |
+----------+----------------------+------------+------------+-------------+----------------------+
| 10000    | 8110346074333016794  | 2          | 2          | 2           | 2.459007474009069E7  |
| 10000    | -5617618290584731137 | 2          | 2          | 2           | 2.4730105014001578E7 |
| 10001    | 4883406271918338267  | 2          | 2          | 2           | 1.6711402709780257E7 |
| 10001    | -5467083960906519443 | 2          | 2          | 2           | 2.7540126380326536E7 |
| 10002    | 9137404661108133814  | 2          | 2          | 2           | 2.417217089806745E7  |
| 10002    | 1885826196444191611  | 2          | 2          | 2           | 1.6327378456676323E7 |
+----------+----------------------+------------+------------+-------------+----------------------+
```

这里以数据路径为粒度，展示了当前 slot 的使用情况。其中 `AvgRate` 为历史统计的该路径上 clone 任务的拷贝速率，单位是字节 / 秒。

### 优先修复查看

以下命令可查看通过 `ADMIN REPAIR TABLE` 命令设置的优先修复表或分区：

```sql
SHOW PROC '/cluster_balance/priority_repair';
```

其中 `RemainingTimeMs` 表示这些优先修复的内容将在多久后被自动移出优先修复队列，以防止优先修复一直失败导致资源被占用。

### 调度器统计状态查看

Doris 收集了 TabletChecker 和 TabletScheduler 在运行过程中的一些统计信息，可通过以下命令查看：

```sql
SHOW PROC '/cluster_balance/sched_stat';
```

```text
+---------------------------------------------------+-------------+
| Item                                              | Value       |
+---------------------------------------------------+-------------+
| num of tablet check round                         | 12041       |
| cost of tablet check(ms)                          | 7162342     |
| num of tablet checked in tablet checker           | 18793506362 |
| num of unhealthy tablet checked in tablet checker | 7043900     |
| num of tablet being added to tablet scheduler     | 1153        |
| num of tablet schedule round                      | 49538       |
| cost of tablet schedule(ms)                       | 49822       |
| num of tablet being scheduled                     | 4356200     |
| num of tablet being scheduled succeeded           | 320         |
| num of tablet being scheduled failed              | 4355594     |
| num of tablet being scheduled discard             | 286         |
| num of tablet priority upgraded                   | 0           |
| num of tablet priority downgraded                 | 1096        |
| num of clone task                                 | 230         |
| num of clone task succeeded                       | 228         |
| num of clone task failed                          | 2           |
| num of clone task timeout                         | 2           |
| num of replica missing error                      | 4354857     |
| num of replica version missing error              | 967         |
| num of replica relocating                         | 0           |
| num of replica redundant error                    | 90          |
| num of replica missing in cluster error           | 0           |
| num of balance scheduled                          | 0           |
+---------------------------------------------------+-------------+
```

各行含义如下：

| 指标 | 含义 |
| --- | --- |
| num of tablet check round | Tablet Checker 检查次数。 |
| cost of tablet check(ms) | Tablet Checker 检查总耗时。 |
| num of tablet checked in tablet checker | Tablet Checker 检查过的 tablet 数量。 |
| num of unhealthy tablet checked in tablet checker | Tablet Checker 检查过的不健康 tablet 数量。 |
| num of tablet being added to tablet scheduler | 被提交到 Tablet Scheduler 中的 tablet 数量。 |
| num of tablet schedule round | Tablet Scheduler 运行次数。 |
| cost of tablet schedule(ms) | Tablet Scheduler 运行总耗时。 |
| num of tablet being scheduled | 被调度的 Tablet 总数量。 |
| num of tablet being scheduled succeeded | 被成功调度的 Tablet 总数量。 |
| num of tablet being scheduled failed | 调度失败的 Tablet 总数量。 |
| num of tablet being scheduled discard | 调度失败且被抛弃的 Tablet 总数量。 |
| num of tablet priority upgraded | 优先级上调次数。 |
| num of tablet priority downgraded | 优先级下调次数。 |
| num of clone task | 生成的 clone 任务数量。 |
| num of clone task succeeded | clone 任务成功的数量。 |
| num of clone task failed | clone 任务失败的数量。 |
| num of clone task timeout | clone 任务超时的数量。 |
| num of replica missing error | 检查的状态为副本缺失的 tablet 数量。 |
| num of replica version missing error | 检查的状态为版本缺失的 tablet 数量（包括 num of replica relocating 和 num of replica missing in cluster error）。 |
| num of replica relocating | 检查的状态为 replica relocating 的 tablet 数量。 |
| num of replica redundant error | 检查的状态为副本冗余的 tablet 数量。 |
| num of replica missing in cluster error | 检查的状态为不在对应 cluster 的 tablet 数量。 |
| num of balance scheduled | 均衡调度的次数。 |

> 注：以上状态都只是历史累加值。FE 日志中也会定期打印这些统计信息，其中括号内的数值表示自上次统计信息打印以来各统计值的变化数量。

## 相关配置说明

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 副本修复 / 均衡调优 -->

### 可调整参数（FE）

以下可调整参数均为 `fe.conf` 中可配置参数。

| 参数 | 说明 | 默认值 | 重要性 |
| --- | --- | --- | --- |
| use\_new\_tablet\_scheduler | 是否启用新的副本调度方式。新的副本调度方式即本文档介绍的副本调度方式。 | true | 高 |
| tablet\_repair\_delay\_factor\_second | 对不同调度优先级延迟不同时间后开始修复，以防例行重启、升级等过程中产生大量不必要的副本修复任务。基准系数：HIGH 延迟 `基准系数 * 1`，NORMAL 延迟 `基准系数 * 2`，LOW 延迟 `基准系数 * 3`。优先级越低，延迟等待时间越长。需尽快修复副本时可适当调低。 | 60 秒 | 高 |
| schedule\_slot\_num\_per\_path | 默认分配给每块磁盘用于副本修复的 slot 数目，表示一块磁盘能同时运行的副本修复任务数。值越高修复越快，但对 IO 影响越大。 | 2 | 高 |
| balance\_load\_score\_threshold | 集群均衡的阈值。当一个 BE 节点的 load score 与平均 load score 的偏差不超过该值时，视为均衡。希望负载更平均时可适当调低。 | 0.1（即 10%） | 中 |
| storage\_high\_watermark\_usage\_percent | 一块磁盘的最大空间使用率上限。超过上限时该磁盘不再作为均衡调度的目的地址。 | 0.85 | 中 |
| storage\_min\_left\_capacity\_bytes | 一块磁盘的最小剩余空间下限。低于下限时该磁盘不再作为均衡调度的目的地址。 | 2097152000（2 GB） | 中 |
| disable\_balance | 控制是否关闭均衡功能。均衡过程中部分功能（如 ALTER TABLE）将被禁止，而均衡可能持续较长时间。需尽快执行被禁止的操作时可设为 true。 | false | 中 |

### 可调整参数（BE）

以下可调整参数均为 `be.conf` 中可配置参数。

| 参数 | 说明 | 默认值 | 重要性 |
| --- | --- | --- | --- |
| clone\_worker\_count | 影响副本均衡的速度。在磁盘压力不大的情况下，可通过调整该参数加快副本均衡。 | 3 | 中 |

### 不可调整参数

以下参数暂不支持修改，仅作说明。

| 项 | 说明 |
| --- | --- |
| TabletChecker 调度间隔 | TabletChecker 每 20 秒进行一次检查调度。 |
| TabletScheduler 调度间隔 | TabletScheduler 每 5 秒进行一次调度。 |
| TabletScheduler 每批次调度个数 | TabletScheduler 每次调度最多 50 个 Tablet。 |
| TabletScheduler 最大等待调度和运行中任务数 | 最大等待调度任务数和运行中任务数为 2000。超过 2000 后，TabletChecker 将不再产生新的调度任务给 TabletScheduler。 |
| TabletScheduler 最大均衡任务数 | 最大均衡任务数为 500。超过 500 后将不再产生新的均衡任务。 |
| 每块磁盘用于均衡任务的 slot 数目 | 每块磁盘用于均衡任务的 slot 数目为 2。这个 slot 独立于用于副本修复的 slot。 |
| 集群均衡情况更新间隔 | TabletScheduler 每隔 20 秒会重新计算一次集群的 load score。 |
| Clone 任务的最小和最大超时时间 | 一个 clone 任务超时时间范围是 3 min ~ 2 hour。具体超时时间通过 `(tablet size) / (5 MB/s)` 计算。一个 clone 任务运行失败 3 次后，该任务将终止。 |
| 动态优先级调整策略 | 优先级最小调整间隔为 5 min。一个 tablet 调度失败 5 次后会调低优先级，30 min 未被调度时会调高优先级。 |

## 相关问题

- 在某些情况下，默认的副本修复和均衡策略可能会导致网络被打满（多发生在千兆网卡，且每台 BE 磁盘数量较多的情况下）。此时需调整一些参数以减少同时进行的均衡和修复任务数。
- 目前针对 Colocate Table 的副本均衡策略无法保证同一个 Tablet 的副本不会分布在同一个 host 的 BE 上。但 Colocate Table 的副本修复策略会检测到这种分布错误并校正。校正后，均衡策略可能再次认为副本不均衡而重新均衡，从而导致在两种状态间不停交替，无法使 Colocate Group 达成稳定。针对这种情况，建议在使用 Colocate 属性时尽量保证集群是同构的，以减小副本分布在同一个 host 上的概率。

## 最佳实践

<!-- 知识类型: 运维操作 -->
<!-- 适用场景: 副本修复 / 集群恢复 / 应急处理 -->

### 控制并管理集群的副本修复和均衡进度

在大多数情况下，通过默认的参数配置，Doris 都可以自动进行副本修复和集群均衡。但在某些情况下，需要人工介入调整参数以达到一些特殊目的，例如优先修复某个表或分区、禁止集群均衡以降低集群负载、优先修复非 colocation 的表数据等。本节介绍如何通过修改参数来控制并管理集群的副本修复和均衡进度。

#### 1. 删除损坏副本

某些情况下，Doris 可能无法自动检测某些损坏的副本，从而导致查询或导入在损坏的副本上频繁报错。此时需手动删除已损坏的副本。该方法可适用于：删除版本数过高导致 -235 错误的副本、删除文件已损坏的副本等。

操作步骤：

1. 找到副本对应的 Tablet ID，假设为 10001。
2. 执行 `show tablet 10001;`，并执行其中的 `show proc` 语句，查看对应 Tablet 各副本的详情。
3. 假设需要删除的副本所在的 Backend ID 是 20001，执行以下语句将副本标记为 `bad`：

    ```sql
    ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10001", "backend_id" = "20001", "status" = "bad");
    ```

4. 再次通过 `show proc` 语句确认对应副本的 `IsBad` 列值为 `true`。

被标记为 `bad` 的副本不会再参与导入和查询。同时副本修复逻辑会自动补充一个新的副本。

#### 2. 优先修复某个表或分区

执行 `help admin repair table;` 查看帮助。该命令会尝试优先修复指定表或分区的 Tablet。

#### 3. 停止均衡任务

均衡任务会占用一定的网络带宽和 IO 资源。如希望停止新的均衡任务的产生，可执行：

```sql
ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
```

#### 4. 停止所有副本调度任务

副本调度任务包括均衡和修复任务。这些任务都会占用一定的网络带宽和 IO 资源。可通过以下命令停止所有副本调度任务（不包括已经在运行的，包括 colocation 表和普通表）：

```sql
ADMIN SET FRONTEND CONFIG ("disable_tablet_scheduler" = "true");
```

#### 5. 停止所有 colocation 表的副本调度任务

colocation 表的副本调度和普通表是分开独立运行的。某些情况下，可能希望先停止 colocation 表的均衡和修复工作，将集群资源用于普通表的修复：

```sql
ADMIN SET FRONTEND CONFIG ("disable_colocate_balance" = "true");
```

#### 6. 使用更保守的策略修复副本

Doris 在检测到副本缺失、BE 宕机等情况下会自动修复副本。但为了减少一些抖动导致的错误（如 BE 短暂宕机），Doris 会延迟触发这些任务。

- `tablet_repair_delay_factor_second` 参数：默认 60 秒。根据修复任务优先级的不同，会推迟 60 秒、120 秒、180 秒后开始触发修复任务。可通过以下命令延长这个时间，以容忍更长的异常时间，避免触发不必要的修复任务：

    ```sql
    ADMIN SET FRONTEND CONFIG ("tablet_repair_delay_factor_second" = "120");
    ```

#### 7. 使用更保守的策略触发 colocation group 的重分布

colocation group 的重分布可能伴随大量的 tablet 迁移。`colocate_group_relocate_delay_second` 用于控制重分布的触发延迟，默认 1800 秒。如果某台 BE 节点可能长时间下线，可尝试调大这个参数，以避免不必要的重分布：

```sql
ADMIN SET FRONTEND CONFIG ("colocate_group_relocate_delay_second" = "3600");
```

#### 8. 更快速的副本均衡

Doris 的副本均衡逻辑会先增加一个正常副本，然后再删除老的副本，以达到副本迁移的目的。在删除老副本时，Doris 会等待该副本上已经开始执行的导入任务完成，以避免均衡任务影响导入任务，但这会降低均衡逻辑的执行速度。可通过修改以下参数让 Doris 忽略这个等待，直接删除老副本：

```sql
ADMIN SET FRONTEND CONFIG ("enable_force_drop_redundant_replica" = "true");
```

这种操作可能会导致均衡期间部分导入任务失败（需要重试），但会显著加速均衡速度。

### 集群快速恢复推荐流程

当需要将集群快速恢复到正常状态时，可按以下思路处理：

1. 找到导致高优任务报错的 Tablet，将有问题的副本置为 `bad`。
2. 通过 `ADMIN REPAIR` 语句高优修复某些表。
3. 停止副本均衡逻辑以避免占用集群资源，集群恢复后再开启。
4. 使用更保守的策略触发修复任务，以应对 BE 频繁宕机导致的雪崩效应。
5. 按需关闭 colocation 表的调度任务，集中集群资源修复其他高优数据。

## 常见问题

### Q: `SHOW PROC '/cluster_health/tablet_health'` 命令报错或显示数据不全，怎么处理？

该命令需要直连 Master FE 执行。检查当前连接的 FE 是否为 Master。

### Q: 副本长期处于 `REPLICA_MISSING` 未被修复，怎么排查？

查看 `SHOW PROC '/cluster_balance/pending_tablets'` 中的 `ErrMsg`。常见原因：找不到合适的源端 / 目的端、磁盘空间不足、节点处于下线状态。

### Q: 修复任务调度失败次数过多，怎么处理？

通过 `SHOW PROC '/cluster_balance/sched_stat'` 查看失败统计。可适当调大 `schedule_slot_num_per_hdd_path` / `schedule_slot_num_per_ssd_path`，或检查是否有磁盘空间不足、节点不可用等问题。

### Q: 副本均衡导致网络打满，怎么处理？

减少同时进行的均衡和修复任务数，或暂时执行 `ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");`。

### Q: Colocate Group 长时间无法稳定，怎么处理？

尽量保证集群同构，并调大 `colocate_group_relocate_delay_second` 以减少不必要的重分布。

### Q: BE 宕机后大量副本被立即修复，造成负载抖动，怎么处理？

调大 `tablet_repair_delay_factor_second`，允许更长的容忍时间。

### Q: 删除了 `bad` 副本后仍报错，怎么处理？

确认通过 `SHOW PROC '/dbs/.../<tablet_id>'` 检查所有副本是否已重新补齐，并等待 clone 任务完成。
