---
{
    "title": "读写分离与主备集群 File Cache 预热配置指南",
    "sidebar_label": "读写分离：File Cache 预热",
    "language": "zh-CN",
    "description": "介绍 Doris File Cache 主动增量预热机制，支持读写分离和主备集群架构，涵盖预热任务创建、管理、监控及常见问题排查。",
    "keywords": ["读写分离", "主备集群", "File Cache 预热", "compute group 同步", "高可用", "跨可用区"]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 读写分离部署 / 主备集群高可用 -->

## 背景与适用场景

为解决跨可用区（AZ）高可用切换和读写分离场景下的缓存冷启动问题，Doris 引入了 **File Cache 主动增量预热机制**。该机制确保目标集群的缓存数据与源集群保持高度一致，从而提升查询性能、减少抖动，并加快故障切换响应速度。

该功能适用于以下两种典型场景：

| 场景 | 说明 | 核心需求 |
|------|------|----------|
| **主备集群高可用** | 备集群持续同步主集群热点数据，在主集群故障时快速接管负载 | 最小化切换延迟 |
| **读写分离** | 写集群的新增数据及时预热到读集群，避免查询命中冷缓存 | 降低读集群查询抖动 |

:::tip 版本信息
File Cache 主动增量预热功能已在 Apache Doris **3.1.0** 版本中引入。
:::

---

## 功能概览

<!-- 知识类型: 操作步骤 -->

File Cache 主动预热支持以下两类缓存同步方式：

1. **事件触发预热**：在 Load、Compaction、Schema Change 等写操作完成后自动触发同步，减少查询抖动。
2. **热点周期同步**：通过周期性扫描，持续将热点查询数据同步到目标集群，保障主备切换时备集群性能稳定。

---

## 同步模式说明

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 预热任务创建 -->

三种同步模式的适用场景如下：

| 模式 | 参数值 | 适用场景 |
|------|--------|----------|
| 一次性同步 | `ONCE` | 手动触发，适用于新集群上线时的初始预热 |
| 周期性同步 | `PERIODIC` | 定时同步热点数据，适用于持续保温场景 |
| 事件驱动同步 | `EVENT_DRIVEN` | 导入、Compaction、Schema Change 操作后自动触发 |

---

## 创建预热任务

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 预热任务创建 -->

### 一次性同步

适用于新集群上线时手动触发初始预热：

```sql
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>;
```

### 周期性同步

适用于持续保持热点数据同步：

```sql
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);
```

- `sync_interval_sec`：同步间隔（秒），基于上次开始时间计算，默认值为 600 秒。

### 事件驱动同步

适用于读写分离场景，在写操作完成后自动将新数据预热到读集群：

```sql
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

- `sync_event`：触发事件类型，可选值包括 `load`（导入）、`compaction`（合并）、`schema_change`（结构变更）。

---

## 管理预热任务

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 任务运维管理 -->

### 查看任务列表

```sql
-- 查看所有预热任务
SHOW WARM UP JOB;

-- 查看指定任务
SHOW WARM UP JOB WHERE ID = 12345;
```

查询结果字段说明：

| 字段名 | 说明 |
|--------|------|
| `JobId` | 同步任务唯一 ID |
| `ComputeGroup` | 目标 Compute Group 名称 |
| `SrcComputeGroup` | 源 Compute Group 名称 |
| `Type` | 同步类型：`CLUSTER`（集群级）/ `TABLE`（表级） |
| `SyncMode` | 同步模式：`ONCE` / `PERIODIC(interval_sec)` / `EVENT_DRIVEN(event)` |
| `Status` | 任务状态：`PENDING` / `RUNNING` / `FINISHED` / `CANCELLED` / `DELETED` |
| `CreateTime` | 任务创建时间 |
| `StartTime` | 上一次开始时间 |
| `FinishTime` | 上一次完成时间 |
| `FinishBatch` | 已完成的 batch 数量 |
| `AllBatch` | 总共需要同步的 batch 数量 |
| `ErrMsg` | 错误信息（无错误时为空） |

### 取消任务

```sql
CANCEL WARM UP JOB WHERE id = 12345;
```

:::caution 注意
当前版本不支持 `ALTER` 修改已有任务配置。如需变更参数，须先取消任务，再重新创建。
:::

---

## 工作原理

<!-- 知识类型: 架构选型决策 -->

### 周期性同步执行流程

1. FE 注册任务，记录 `sync_interval` 配置。
2. FE 周期性检查是否到达触发时间（基于上次开始时间计算）。
3. 触发同步任务，避免任务重叠执行。
4. 同步完成后记录状态，等待下一个周期。

### 事件驱动同步执行流程

1. 用户创建事件驱动任务，FE 注册任务并将配置下发至源集群 BE。
2. 源 BE 在 Load、Compaction 等事件完成后自动触发预热逻辑。
3. 源 BE 向目标 BE 发起同步请求（以 Rowset 为粒度）。
4. 同步完成后，目标 BE 向 FE 汇报执行状态。

### 调度与存储机制

- 同步关系由 FE 持久化存储为 `CloudWarmUpJob` 对象，支持多任务并发管理。
- 同一目标集群允许存在多个 `PENDING` 状态的任务，但同一时间仅允许一个任务处于 `RUNNING` 状态，其余任务排队等候。
- 支持通过 Compute Group 名称管理同步关系，兼容集群重命名和迁移操作。

---

## 指标监控

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

### 周期性任务 — FE 侧指标

| 指标名称 | 含义 |
|----------|------|
| `file_cache_warm_up_job_exec_count` | 调度执行次数 |
| `file_cache_warm_up_job_requested_tablets` | 提交的 tablet 总数 |
| `file_cache_warm_up_job_finished_tablets` | 完成同步的 tablet 数量 |
| `file_cache_warm_up_job_latest_start_time` | 最近一次任务开始时间 |
| `file_cache_warm_up_job_last_finish_time` | 最近一次任务完成时间 |

### 周期性任务 — BE 侧指标

| 指标名称 | 含义 |
|----------|------|
| `file_cache_once_or_periodic_warm_up_submitted_segment_size` | 已提交的 segment 数据大小 |
| `file_cache_once_or_periodic_warm_up_finished_segment_size` | 已完成的 segment 数据大小 |
| `file_cache_once_or_periodic_warm_up_submitted_index_num` | 已提交的 index 数量 |
| `file_cache_once_or_periodic_warm_up_finished_index_num` | 已完成的 index 数量 |

### 事件驱动任务 — 源 BE 指标

| 指标名称 | 含义 |
|----------|------|
| `file_cache_event_driven_warm_up_requested_segment_size` | 请求同步的 segment 数据大小 |
| `file_cache_event_driven_warm_up_requested_index_num` | 请求同步的 index 数量 |
| `file_cache_warm_up_rowset_last_call_unix_ts` | 最后一次发起同步请求的时间戳 |

### 事件驱动任务 — 目标 BE 指标

| 指标名称 | 含义 |
|----------|------|
| `file_cache_event_driven_warm_up_submitted_segment_num` | 收到的 segment 数量 |
| `file_cache_event_driven_warm_up_finished_segment_num` | 完成预热的 segment 数量 |
| `file_cache_warm_up_rowset_last_handle_unix_ts` | 最后一次处理同步请求的时间戳 |

---

## 常见问题

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 -->

**Q：某次同步失败会导致整个任务被取消吗？**

不会。当前轮次同步失败仅跳过本次执行，任务状态保持不变，后续周期会继续尝试执行。

**Q：周期性任务执行超时会怎样？**

超时后系统会跳过本轮执行，任务本身不会被删除，下一个周期将正常触发。

**Q：是否支持多个源集群同步到同一目标集群？**

支持。例如集群 A 和集群 C 可以同时配置向集群 B 同步（A → B 与 C → B 并存）。

**Q：如何验证预热任务是否生效？**

可通过以下方式验证：

1. 执行 `SHOW WARM UP JOB WHERE ID = <job_id>` 查看 `Status` 是否为 `RUNNING` 或 `FINISHED`。
2. 对比 `FinishBatch` 与 `AllBatch`，确认同步进度。
3. 观察目标集群的 BE 侧指标，确认 `finished_segment_num` 持续增长。

**Q：修改同步任务的配置（如调整同步间隔）需要怎么操作？**

当前版本不支持直接修改。需先执行 `CANCEL WARM UP JOB WHERE id = <job_id>` 取消旧任务，然后重新创建新任务。
