---
{
    "title": "查询中间结果落盘（Spill to Disk）",
    "sidebar_label": "查询中间结果落盘",
    "language": "zh-CN",
    "description": "当大查询或 ETL 任务内存不足时，Doris 支持将中间结果写入磁盘继续执行，避免 OOM 报错。本文介绍落盘原理、配置方法与监控手段。",
    "keywords": ["落盘", "spill disk", "大查询内存不足", "OOM", "内存管理", "workload group", "查询稳定性"]
}
---

<!-- 知识类型: 概念介绍 + 操作步骤 -->

## 为什么需要落盘

Doris 的计算层基于 MPP 架构，所有计算任务在 BE 节点内存中完成，节点间数据交换也依赖内存，因此内存管理直接影响查询稳定性。随着越来越多的用户将 **ETL 数据加工、多表物化视图处理、复杂 AdHoc 查询** 迁移到 Doris，单节点内存往往无法容纳全部中间状态。

**落盘**（Spill to Disk）通过将聚合中间态、排序临时数据等写入磁盘，让内存受限的查询得以继续执行，带来三方面收益：

| 收益 | 说明 |
|------|------|
| 扩展性 | 可处理远超单节点内存上限的大数据集 |
| 稳定性 | 减少因内存不足导致的查询报错或进程崩溃 |
| 灵活性 | 无需增加硬件即可执行更复杂的查询 |

目前支持落盘的算子：Hash Join、聚合（Aggregation）、排序（Sort）、CTE。

:::caution 注意
落盘会产生额外的磁盘 I/O，查询耗时可能显著增加。建议同时调大 Session 变量 `query_timeout`，并为落盘目录单独挂载磁盘或使用 SSD，减少对正常导入和查询的影响。

**查询落盘功能默认关闭。**
:::

## 落盘触发原理

Doris 使用 **reserve memory** 机制控制落盘时机，流程如下：

1. 执行期间预估处理每个 Block 所需内存，向统一内存管理器申请；
2. 全局内存分配器判断本次申请是否超过 Query、Workload Group 或进程的内存限制；
3. 超限时返回失败，Doris 挂起当前 Query，对最大算子执行落盘；
4. 落盘完成后 Query 继续执行。

## 内存管理层级

Doris 内存管理分为三个层级：**进程级别 → Workload Group 级别 → Query 级别**，落盘行为受三者共同约束。

### 进程级内存（BE）

`be.conf` 中的 `mem_limit` 参数控制整个 BE 进程可用内存上限。当内存使用超过此阈值时，Doris 会取消正在申请内存的 Query，并通过后台异步任务 Kill 部分 Query 或释放 Cache。

**两种常见问题场景：**

- **混部场景**：BE 与 FE、Kafka、HDFS 等进程共用宿主机时，实际可用内存可能远小于 `mem_limit`，导致内存释放机制失效，进而触发操作系统 OOM Killer。
- **容器化部署**：在 K8S 或 Cgroup 环境下，Doris 会自动感知容器的内存配置，无需手动调整。

### Workload Group 内存

<!-- 知识类型: 参数说明 -->

| 参数 | 说明 |
|------|------|
| `max_memory_percent` | 该 Workload Group 最多可占用进程内存的百分比；超过后触发落盘或 Kill Query |
| `min_memory_percent` | 该 Workload Group 保证可用的最低内存百分比；内存不足时系统按此分配，确保其他组有足够内存 |
| `memory_low_watermark` | 内存使用率低水位线，默认 80% |
| `memory_high_watermark` | 内存使用率高水位线，默认 95%；超过此值时 reserve memory 失败，触发落盘 |

约束：所有 Workload Group 的 `min_memory_percent` 之和不能超过 100%，且单个组的 `min_memory_percent` 不能大于 `max_memory_percent`。

### Query 级内存

#### 静态内存分配

`exec_mem_limit` 在 Query 运行前通过 Session Variable 设置，运行期间不可动态修改。

:::warning 升级注意
`exec_mem_limit` 默认值在 **3.1 版本**前为 2 GB，3.1 版本后改为 100 GB，并在 BE 端真正生效。升级到 3.1 及以上版本前，请将此参数显式设置为 `100g`，避免现有查询因超限被 Cancel 或触发意外落盘。
:::

#### 基于 Slot 的动态内存分配

静态分配方式下，用户往往无法准确估算单条 Query 所需内存，容易设置过大（如进程内存的一半），导致精细控制失效。基于 Workload Group 的 Slot 机制解决了这一问题：

**原理：**

- Workload Group 设置了 `max_memory_percent` 和 `max_concurrency`，则 BE 内存被逻辑划分为 `max_concurrency` 个 Slot，每个 Slot 内存 = `max_memory_percent × mem_limit / max_concurrency`。
- 默认每条 Query 占用 1 个 Slot；若需更多内存，可修改 Session Variable `query_slot_count`。
- 当某条 Query 占用更多 Slot 时，Workload Group 可并发运行的 Query 数量自动减少，新 Query 进入排队。

**`slot_memory_policy` 可选值：**

| 值 | 说明 |
|----|------|
| `none` | 默认，不启用；Query 尽量使用内存，达到 Workload Group 上限后触发落盘 |
| `fixed` | 每条 Query 可用内存 = `workload group mem_limit × query_slot_count / max_concurrency`；按并发数固定分配 |
| `dynamic` | 每条 Query 可用内存 = `workload group mem_limit × query_slot_count / sum(running query slots)`；把空闲 Slot 内存动态分配给运行中的大查询 |

`fixed` 和 `dynamic` 均为硬限，超过后触发落盘或 Kill，同时覆盖静态分配的 `exec_mem_limit`。设置 `slot_memory_policy` 时，务必合理配置 `max_concurrency`，否则可能出现内存不足的问题。

## 开启查询落盘

<!-- 知识类型: 操作步骤 -->

### 第一步：配置 BE 落盘路径

在 `be.conf` 中添加以下配置，**修改后需重启 BE** 才能生效：

```properties
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```

| 参数 | 说明 |
|------|------|
| `spill_storage_root_path` | 落盘文件存储路径，默认与 `storage_root_path` 相同；建议配置独立磁盘路径 |
| `spill_storage_limit` | 落盘文件最大磁盘占用，支持绝对值（如 `100G`、`1T`）或百分比（默认 `20%`）；若使用独立磁盘，可设为 `100%` |

### 第二步：配置 FE Session Variable

```sql
SET enable_spill = true;
SET exec_mem_limit = 10g;
SET query_timeout = 3600;
```

| 变量 | 说明 |
|------|------|
| `enable_spill` | 是否开启落盘，默认 `false`；开启后，内存紧张时自动触发 |
| `exec_mem_limit` | 单条 Query 最大可用内存 |
| `query_timeout` | 落盘会增加查询耗时，需相应调大超时时间（单位：秒） |

### 第三步：配置 Workload Group（可选）

调整 `max_memory_percent`，防止单个 Workload Group 耗尽进程内存：

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('max_memory_percent'='90%');
```

启用基于 Slot 的动态内存分配，让大查询优先落盘：

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('slot_memory_policy'='dynamic');
```

## 监控落盘状态

<!-- 知识类型: 监控运维 -->

### 审计日志

FE Audit Log 中新增了以下字段，用于记录落盘读写量：

```
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```

| 字段 | 说明 |
|------|------|
| `SpillWriteBytesToLocalStorage` | 落盘期间写入磁盘的数据总量（字节） |
| `SpillReadBytesFromLocalStorage` | 落盘期间从磁盘读取的数据总量（字节） |

### Query Profile

查询触发落盘后，Profile 中会出现带 `Spill` 前缀的 Counter。以 HashJoin Build HashTable 为例：

```
PARTITIONED_HASH_JOIN_SINK_OPERATOR  (id=4  ,  nereids_id=179):(ExecTime:  6sec351ms)
      -  Spilled:  true
      -  CloseTime:  528ns
      -  ExecTime:  6sec351ms
      -  InitTime:  5.751us
      -  InputRows:  6.001215M  (6001215)
      -  MemoryUsage:  0.00  
      -  MemoryUsagePeak:  554.42  MB
      -  MemoryUsageReserved:  1024.00  KB
      -  OpenTime:  2.267ms
      -  PendingFinishDependency:  0ns
      -  SpillBuildTime:  2sec437ms
      -  SpillInMemRow:  0
      -  SpillMaxRowsOfPartition:  68.569K  (68569)
      -  SpillMinRowsOfPartition:  67.455K  (67455)
      -  SpillPartitionShuffleTime:  836.302ms
      -  SpillPartitionTime:  131.839ms
      -  SpillTotalTime:  5sec563ms
      -  SpillWriteBlockBytes:  714.13  MB
      -  SpillWriteBlockCount:  1.344K  (1344)
      -  SpillWriteFileBytes:  244.40  MB
      -  SpillWriteFileTime:  350.754ms
      -  SpillWriteFileTotalCount:  32
      -  SpillWriteRows:  6.001215M  (6001215)
      -  SpillWriteSerializeBlockTime:  4sec378ms
      -  SpillWriteTaskCount:  417
      -  SpillWriteTaskWaitInQueueCount:  0
      -  SpillWriteTaskWaitInQueueTime:  8.731ms
      -  SpillWriteTime:  5sec549ms
```

`Spilled: true` 表示该算子已触发落盘。

### 系统表 `backend_active_tasks`

`information_schema.backend_active_tasks` 新增两列，可实时查看进行中查询的落盘数据量：

| 列名 | 说明 |
|------|------|
| `SPILL_WRITE_BYTES_TO_LOCAL_STORAGE` | 当前查询已写入磁盘的落盘数据量（字节） |
| `SPILL_READ_BYTES_FROM_LOCAL_STORAGE` | 当前查询已从磁盘读取的落盘数据量（字节） |

```sql
SELECT * FROM information_schema.backend_active_tasks;
```

示例输出：

```
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
```

## 性能参考（TPC-DS 10TB）

<!-- 知识类型: 测试数据 -->

以下数据来自使用阿里云服务器的单并发测试，验证落盘功能可在内存与数据量比例约为 **1:52** 的极端场景下跑完全部 99 条 TPC-DS 查询。

**测试环境：**

- 1 FE：16 核 vCPU，32 GiB 内存（ecs.c6.4xlarge）
- 3 BE：16 核 vCPU，64 GiB 内存（ecs.g6.4xlarge）
- 测试数据：TPC-DS 10TB，通过阿里云 DLF Catalog 挂载

**总耗时：28,102.386 秒**

| Query | 耗时(ms) | Query | 耗时(ms) | Query | 耗时(ms) |
|-------|---------|-------|---------|-------|---------|
| query1 | 29092 | query34 | 84055 | query67 | 3939554 |
| query2 | 130003 | query35 | 69885 | query68 | 183648 |
| query3 | 96119 | query36 | 148662 | query69 | 11031 |
| query4 | 1199097 | query37 | 21598 | query70 | 137901 |
| query5 | 212719 | query38 | 164746 | query71 | 166454 |
| query6 | 62259 | query39 | 5874 | query72 | 2859001 |
| query7 | 209154 | query40 | 51602 | query73 | 92015 |
| query8 | 62433 | query41 | 563 | query74 | 336694 |
| query9 | 579371 | query42 | 93005 | query75 | 838989 |
| query10 | 54260 | query43 | 67769 | query76 | 174235 |
| query11 | 560169 | query44 | 79527 | query77 | 174525 |
| query12 | 26084 | query45 | 26575 | query78 | 1956786 |
| query13 | 228756 | query46 | 134991 | query79 | 162259 |
| query14 | 1137097 | query47 | 161873 | query80 | 602088 |
| query15 | 27509 | query48 | 153657 | query81 | 16184 |
| query16 | 84806 | query49 | 259387 | query82 | 56292 |
| query17 | 288164 | query50 | 141421 | query83 | 26211 |
| query18 | 94770 | query51 | 158056 | query84 | 11906 |
| query19 | 124955 | query52 | 91392 | query85 | 57739 |
| query20 | 30970 | query53 | 89497 | query86 | 34350 |
| query21 | 4333 | query54 | 124118 | query87 | 173631 |
| query22 | 9890 | query55 | 82584 | query88 | 449003 |
| query23 | 1757755 | query56 | 152110 | query89 | 113799 |
| query24 | 399553 | query57 | 83417 | query90 | 30825 |
| query25 | 291474 | query58 | 259580 | query91 | 12239 |
| query26 | 79832 | query59 | 177125 | query92 | 26695 |
| query27 | 175894 | query60 | 161729 | query93 | 275828 |
| query28 | 647497 | query61 | 258058 | query94 | 56464 |
| query29 | 1299597 | query62 | 39619 | query95 | 64932 |
| query30 | 11434 | query63 | 91258 | query96 | 48102 |
| query31 | 106665 | query64 | 234882 | query97 | 597371 |
| query32 | 33481 | query65 | 278610 | query98 | 112399 |
| query33 | 146101 | query66 | 90246 | query99 | 64472 |

未来将对更多算子（如 Window Function、Intersect 等）提供落盘能力，并持续优化落盘场景下的性能。
