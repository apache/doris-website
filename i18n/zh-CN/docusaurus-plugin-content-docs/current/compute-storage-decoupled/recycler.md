---
title: 存算分离数据回收（Recycler）— 原理、配置与调优
sidebar_label: 数据回收（Recycler）
description: 介绍 Doris 存算分离架构下的 Recycler 数据回收机制，包括标记删除原理、过期保护、监控指标及常见调优场景。
keywords: [Doris, 存算分离, 数据回收, Recycler, 标记删除, 垃圾回收, 存储空间, 调优]
---

<!-- 知识类型: 架构原理 + 操作配置 -->
<!-- 适用场景: 存算分离部署 / 存储空间管理 / 故障排查 -->

Doris 存算分离架构采用**标记删除（Mark-for-Deletion）**策略进行数据回收。专用的 Recycler 组件周期性扫描已标记的元数据，批量删除对应的对象文件，在性能、安全性和资源利用率之间取得最佳平衡。

## 数据回收策略对比

<!-- 知识类型: 架构选型决策 -->

常见的三种数据回收策略各有优劣，Doris 存算分离选择了标记删除方案：

| 策略 | 触发时机 | 优点 | 缺点 |
|------|----------|------|------|
| **同步删除** | 执行删除命令时立即删除 meta 和文件 | 实现简单 | 响应慢、风险高、无缓冲期 |
| **对账删除（反向）** | 定期扫描全量文件，识别无引用文件后批量删除 | 能清理孤立文件 | 需遍历所有文件，I/O 开销大 |
| **标记删除（正向）** | 删除时仅标记 meta，后台定期扫描标记并删除文件 | 响应快、有缓冲期、效率高 | 存在短暂的存储冗余 |

### 标记删除的优势

相比其他方案，标记删除具备以下优势：

- **响应速度快**：`DROP TABLE` 只需标记 meta KV 为删除状态，无需等待文件 I/O，用户立即得到响应，大表删除不阻塞。
- **批量处理高效**：后台定期批量处理文件删除，减少系统调用次数，提升整体 I/O 效率。
- **误操作保护**：文件实际删除前存在缓冲期，可在缓冲期内恢复误删的表，显著降低人为操作风险。
- **事务安全**：标记操作是轻量级的 meta 修改，原子性更易保证，减少系统故障导致的数据不一致。
- **负载均衡**：文件删除可在系统空闲时进行，避免业务高峰期占用大量 I/O 资源。

## Recycler 工作原理

<!-- 知识类型: 架构原理 -->

Recycler 是独立部署的组件，负责周期性回收过期的垃圾文件。一个 Recycler 可同时回收多个 instance，但同一 instance 在同一时间只能被一个 Recycler 处理。

### 标记删除流程

每当执行 `DROP` 命令或系统产生垃圾数据（例如已被合并的 rowset）时，对应的 meta KV 会被标记为 `recycled` 状态。Recycler 定期扫描 instance 中的 recycle KV，执行顺序如下：

1. 删除对应的对象文件（segment 文件等）
2. 删除 recycle KV

先删文件再删 meta，确保删除顺序的安全性，避免 meta 已删而文件残留。

### 分层回收结构

<!-- 知识类型: 操作步骤 -->

数据回收按照层级自顶向下执行，以 `DROP TABLE` 为例：

```
Table
 └─ Partition（删除 recycle partition KV）
     └─ Tablet（删除 recycle tablet KV）
         └─ Rowset（删除 recycle rowset KV）
             └─ Segment 文件（实际对象文件，最终删除单元）
```

回收时，多类任务并发执行，包括 `recycle_indexes`、`recycle_partition`、`recycle_compacted_rowsets`、`recycle_txn` 等。只有当一个层级的所有子项全部删除成功后，才会删除该层级的 recycle KV。

### 过期保护机制

每个待回收对象的 KV 中都记录有过期时间（retention time）。Recycler 扫描时会计算过期时间，**未到期的对象不会被删除**。

这一机制为误操作提供了保护：若用户误删了某张表，在 retention time 到期前，Recycler 不会删除其数据，用户有机会在此期间恢复数据。

### 可靠性保证

<!-- 知识类型: 架构原理 -->

**分阶段删除**：先删数据文件，再删元数据，最后删除索引或分区的 KV，确保删除顺序安全。

**Lease 保护机制**：每个 Recycler 在开始回收前需获取 lease，并由后台线程定期续期。只有在 lease 过期或状态为 IDLE 时，新的 Recycler 才能接管，保证同一时间一个 instance 只被一个 Recycler 回收，防止并发回收导致数据不一致。

### 多重检查机制（Checker）

<!-- 知识类型: 架构原理 -->

Recycler 实现了 FE 元数据、MS KV 与对象文件的多重相互检查机制（checker）。checker 在后台对所有 Recycler KV、对象文件、FE 内存元数据三方进行正反向检查。

以 segment 文件 KV 与对象文件检查为例：

| 检查方向 | 检查内容 |
|----------|----------|
| **正向检查** | 扫描所有 KV，验证对应的 segment 文件是否存在，以及 FE 内存中是否有相应的 segment 信息 |
| **反向检查** | 扫描所有 segment 文件，验证是否都有对应的 KV，以及 FE 内存中是否存在相应的 segment 信息 |

若出现未回收或多回收的情况，checker 会捕获相关信息。运维人员可根据 checker 报告手动删除多余垃圾文件，也可依靠对象多版本恢复误删文件。

当前已支持 segment 文件、idx 文件、delete bitmap 元数据等的正反向检查，后续将扩展至所有元数据。

## 监控指标

<!-- 知识类型: 可观测性 -->
<!-- 适用场景: 性能监控 / 故障排查 -->

所有监控指标可通过 **MS 面板**进行实时观测。

### 基础监控问题

| 关注问题 | 对应指标 |
|----------|----------|
| 每秒回收字节数、各类对象每秒回收量 | `recycler_instance_recycle_bytes_per_ms`、`recycler_instance_recycle_time_per_resource` |
| 每次回收的数据量和耗时 | `recycler_instance_last_round_recycled_bytes`、`recycler_instance_last_round_recycle_elpased_ts` |
| 已回收 / 待回收数据量 | `recycler_instance_last_round_recycled_num`、`recycler_instance_last_round_to_recycle_num` |
| 各存储后端回收情况 | `recycler_vault_recycle_status` |
| 上次成功 / 失败时间 | `recycler_instance_recycle_last_success_ts`、`recycler_instance_recycle_end_ts` |
| 下次预计回收时间 | `recycler_instance_next_ts` |

### 完整指标列表

| 变量名 | Metrics name | 维度/标签 | 含义 |
|--------|--------------|-----------|------|
| `g_bvar_recycler_vault_recycle_status` | `recycler_vault_recycle_status` | instance_id, resource_id, status | 按实例 ID、资源 ID 和状态记录回收存储库操作的状态计数 |
| `g_bvar_recycler_vault_recycle_task_concurrency` | `recycler_vault_recycle_task_concurrency` | instance_id, resource_id | 按实例 ID 和资源 ID 统计 vault 回收文件任务的并发数 |
| `g_bvar_recycler_instance_last_round_recycled_num` | `recycler_instance_last_round_recycled_num` | instance_id, resource_type | 最近一轮已回收的对象数量 |
| `g_bvar_recycler_instance_last_round_to_recycle_num` | `recycler_instance_last_round_to_recycle_num` | instance_id, resource_type | 最近一轮需要回收的对象数量 |
| `g_bvar_recycler_instance_last_round_recycled_bytes` | `recycler_instance_last_round_recycled_bytes` | instance_id, resource_type | 最近一轮已回收的数据大小（bytes） |
| `g_bvar_recycler_instance_last_round_to_recycle_bytes` | `recycler_instance_last_round_to_recycle_bytes` | instance_id, resource_type | 最近一轮需要回收的数据大小（bytes） |
| `g_bvar_recycler_instance_last_round_recycle_elpased_ts` | `recycler_instance_last_round_recycle_elpased_ts` | instance_id, resource_type | 最近一轮回收操作的耗时（ms） |
| `g_bvar_recycler_instance_recycle_round` | `recycler_instance_recycle_round` | instance_id, resource_type | 回收操作的轮次 |
| `g_bvar_recycler_instance_recycle_time_per_resource` | `recycler_instance_recycle_time_per_resource` | instance_id, resource_type | 每个资源回收所需时间（ms），`-1` 表示未回收 |
| `g_bvar_recycler_instance_recycle_bytes_per_ms` | `recycler_instance_recycle_bytes_per_ms` | instance_id, resource_type | 每毫秒回收的 bytes，`-1` 表示未回收 |
| `g_bvar_recycler_instance_recycle_total_num_since_started` | `recycler_instance_recycle_total_num_since_started` | instance_id, resource_type | Recycler 启动以来累计回收对象数量 |
| `g_bvar_recycler_instance_recycle_total_bytes_since_started` | `recycler_instance_recycle_total_bytes_since_started` | instance_id, resource_type | Recycler 启动以来累计回收数据大小（bytes） |
| `g_bvar_recycler_instance_running_counter` | `recycler_instance_running_counter` | — | 当前正在执行回收的 instance 数量 |
| `g_bvar_recycler_instance_last_round_recycle_duration` | `recycler_instance_last_round_recycle_duration` | instance_id | 最近一轮回收的总用时 |
| `g_bvar_recycler_instance_next_ts` | `recycler_instance_next_ts` | instance_id | 根据 `recycle_interval_seconds` 估算的下次回收时间 |
| `g_bvar_recycler_instance_recycle_st_ts` | `recycler_instance_recycle_start_ts` | instance_id | 总回收流程的开始时间 |
| `g_bvar_recycler_instance_recycle_ed_ts` | `recycler_instance_recycle_end_ts` | instance_id | 总回收流程的结束时间 |
| `g_bvar_recycler_instance_recycle_last_success_ts` | `recycler_instance_recycle_last_success_ts` | instance_id | 上一次回收成功的时间 |

## 配置参数

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 部署调优 / 性能优化 -->

以下为 Recycler 的常用配置参数：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `recycle_interval_seconds` | `3600` | 回收间隔（秒） |
| `retention_seconds` | `259200`（3 天） | 通用留存时间，适用于所有未单独设置留存时间的对象 |
| `recycle_concurrency` | `16` | 单个 Recycler 可同时回收的最大 instance 数量 |
| `compacted_rowset_retention_seconds` | `1800` | 已被 compaction 合并的 rowset 留存时间（秒） |
| `dropped_index_retention_seconds` | `10800` | 已删除 index 的留存时间（秒） |
| `dropped_partition_retention_seconds` | `10800` | 已删除 partition 的留存时间（秒） |
| `recycle_whitelist` | `""` | 回收白名单，填写 instance ID（逗号分隔），为空则回收所有 instance |
| `recycle_blacklist` | `""` | 回收黑名单，填写 instance ID（逗号分隔），为空则回收所有 instance |
| `instance_recycler_worker_pool_size` | `32` | 对象 I/O 操作（list、delete 等）的并发度 |
| `recycle_pool_parallelism` | `40` | 回收任务（recycle_tablet、recycle_rowset 等）的并发度 |
| `enable_checker` | `false` | 是否开启正向检查器 |
| `enable_inverted_check` | `false` | 是否开启反向检查器 |
| `check_object_interval_seconds` | `43200`（12 小时） | checker 的执行间隔（秒） |
| `enable_recycler_stats_metrics` | `false` | 是否开启 Recycler 观测指标 |
| `recycler_storage_vault_white_list` | `""` | 存储后端白名单，填写 vault name（逗号分隔），为空则回收所有 vault |

## 常见调优场景

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

### 回收速度过慢

**目的**：加快垃圾数据清理，释放存储空间。

**调整方向**：

1. 增大并发度：
    - `recycle_concurrency`（默认 16）— 增加同时回收的 instance 数量
    - `instance_recycler_worker_pool_size`（默认 32）— 增加对象 I/O 操作并发度
    - `recycle_pool_parallelism`（默认 40）— 增加回收任务并发度
2. 缩短回收间隔：将 `recycle_interval_seconds` 从默认 3600 秒调小，如改为 1800 秒。
3. 使用白名单：通过 `recycle_whitelist` 优先回收重要 instance。

### 回收压力过大影响业务

**目的**：降低 Recycler 对业务的干扰。

**调整方向**：

1. 降低并发度：适当减小 `recycle_concurrency`、`instance_recycler_worker_pool_size`、`recycle_pool_parallelism`。
2. 延长回收间隔：将 `recycle_interval_seconds` 调大，如改为 7200 秒。
3. 使用黑名单：通过 `recycle_blacklist` 临时排除高负载 instance。

### 存储空间不足，需加快清理

**目的**：尽快释放存储空间。

**调整方向**：

1. 缩短通用留存时间：将 `retention_seconds` 从默认 259200 秒（3 天）调小。
2. 针对性缩短特定对象留存时间：
    - `compacted_rowset_retention_seconds`（默认 1800 秒）可适当缩短
    - `dropped_index_retention_seconds` 和 `dropped_partition_retention_seconds`（默认 10800 秒）可按需调整
3. 选择性回收存储后端：通过 `recycler_storage_vault_white_list` 优先清理特定 vault。

### 需延长留存时间防止误删

**目的**：为误操作恢复保留更长的缓冲期。

**调整方向**：

1. 增大 `retention_seconds`，如调整为 604800 秒（7 天）。
2. 根据对象重要程度，分别调整 `dropped_partition_retention_seconds` 等参数。

### 开启监控与一致性检查

**目的**：提升可观测性，排查潜在的数据一致性问题。

**调整方向**：

1. 开启观测指标：设置 `enable_recycler_stats_metrics = true`。
2. 开启检查机制：
    - `enable_checker = true`（正向检查）
    - `enable_inverted_check = true`（反向检查）
3. 调整 `check_object_interval_seconds`（默认 43200 秒）为合适的检查频率。

### 某些 instance 回收异常

**目的**：临时隔离问题 instance，避免影响其他 instance 回收。

**调整方向**：

1. 将异常 instance ID 加入 `recycle_blacklist`，临时跳过。
2. 将需要优先处理的 instance ID 加入 `recycle_whitelist`。
3. 通过 `recycler_storage_vault_white_list` 选择性回收特定存储后端。

### 大表删除导致回收任务堆积

**目的**：快速消化积压的回收任务。

**调整方向**：

1. 临时增大并发度参数（`recycle_concurrency`、`recycle_pool_parallelism`）以消化积压。
2. 使用白名单优先处理积压严重的 instance。
3. 必要时可部署多个 Recycler 实例分担压力。

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 故障排查 / 常见错误 -->

### 长时间查询遇到"404 file not found"错误

**现象**：查询执行时间较长，期间 tablet 发生了 compaction，被合并的 rowset 已被 Recycler 回收，查询访问时报 `404 file not found`。

**原因**：`compacted_rowset_retention_seconds` 默认值为 1800 秒（30 分钟），若查询时长超过该值，所需的 rowset 文件可能已被删除。

**解决方案**：根据集群中最长查询的执行时长，适当增大 `compacted_rowset_retention_seconds`。例如，对于有长查询的场景，建议设置为 7200 秒或更长。

### 如何确认数据回收是否正常进行

**方案**：

1. 开启 `enable_recycler_stats_metrics = true`，在 MS 面板查看 `recycler_instance_last_round_recycle_duration` 和 `recycler_instance_recycle_last_success_ts` 指标。
2. 若 `recycler_instance_recycle_last_success_ts` 长时间未更新，说明回收可能卡住，需排查日志。

### 怀疑存在数据一致性问题如何排查

**方案**：

1. 确保 `enable_checker = true` 且 `enable_inverted_check = true`。
2. 适当缩短 `check_object_interval_seconds` 以提高检查频率。
3. 在 MS 面板观察 checker 发现的异常情况。
4. 根据 checker 报告手动处理多余的垃圾文件，或利用对象多版本恢复误删文件。

---

> **注意**：以上调优建议需结合实际集群规模、存储容量和业务特点综合评估。建议在调优过程中密切关注系统负载和业务影响，逐步调整参数以找到最优配置。
