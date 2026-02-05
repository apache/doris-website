---
{
    "title": "读写分离",
    "language": "zh-CN",
    "description": "为了支持跨可用区（AZ）的高可用集群架构和读写分离架构，Doris 引入了 File Cache 主动增量预热机制，旨在确保目标集群的缓存数据与源集群保持高度一致，从而提升查询性能、减少抖动，并加快故障切换时的响应速度。"
}
---

# File Cache 主动增量预热

## 背景

为了支持跨可用区（AZ）的高可用集群架构和读写分离架构，Doris 引入了 **File Cache 主动增量预热机制**，旨在确保目标集群的缓存数据与源集群保持高度一致，从而提升查询性能、减少抖动，并加快故障切换时的响应速度。

应用场景包括：

- **主备集群架构**：保障备集群能在主集群故障时快速接管负载。
- **读写分离架构**：确保写入后的数据能够及时在读集群中被缓存。

---

## 功能概览

File Cache 主动预热主要支持以下两类缓存的同步：

1. **事件触发预热**  
   - 覆盖 Load、Compaction、Schema Change 等写操作后产生的数据。
   - 支持 **事件触发式同步**，减少查询抖动。

2. **热点同步预热**
   - 通过 **周期性同步**，持续保持热点查询数据在目标集群中热备状态。
   - 在主备切换时保障备集群性能不下降。

---

## 核心特性

### 同步方式

| 模式         | 说明 |
|--------------|------|
| 一次性同步（`ONCE`）     | 适用于手动触发，如新集群上线预热 |
| 周期性同步（`PERIODIC`） | 适用于查询数据的定时同步 |
| 事件驱动同步（`EVENT_DRIVEN`） | 适用于导入、Compaction、SC 操作自动触发 |

### WARM UP 语法扩展

```sql
-- 一次性同步
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>;

-- 周期性同步
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);

-- 事件触发同步
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

---

## 同步任务管理

### 任务展示

```sql
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE ID = 12345;
```

| 列名            | 说明 |
|-----------------|------|
| JobId           | 同步任务唯一 ID |
| ComputeGroup    | 目标 Compute Group |
| SrcComputeGroup | 源 Compute Group |
| Type            | 类型：CLUSTER / TABLE |
| SyncMode        | ONCE / PERIODIC(x) / EVENT_DRIVEN(x) |
| Status          | PENDING / RUNNING / FINISHED / CANCELLED / DELETED |
| CreateTime      | 创建时间 |
| StartTime       | 上一次开始时间 |
| FinishTime      | 上一次完成时间 |
| FinishBatch     | 已完成的 batch 数量 |
| AllBatch        | 总共需要同步的 batch 数量 |
| ErrMsg          | 错误信息（如有） |

### 取消任务

```sql
CANCEL WARM UP JOB WHERE id = 12345;
```

> **注意：** 当前版本不支持 ALTER，修改配置需取消后重建。

---

## 工作原理

### 周期性同步流程

1. FE 注册任务，设定 sync_interval。
2. FE 周期检查是否到达触发时间（基于上次开始时间）。
3. 启动同步任务（避免任务重叠执行）。
4. 完成后记录状态，并等待下一周期。

### 事件触发同步流程

1. 用户创建事件触发任务，FE 注册任务并下发至源集群 BE。
2. 源 BE 在 Load、Compaction 等事件后自动触发预热。
3. 向目标 BE 发起同步请求（Rowset 粒度）。
4. 任务完成后，BE 向 FE 汇报状态。

---

## 存储与调度机制

- 同步关系由 FE 存储为 CloudWarmUpJob，支持多任务管理。
- 同一个目标集群允许多个 **Pending Job**，但同一时间仅允许一个 **Running Job**，其他任务将排队。
- 支持使用 CLUSTER NAME 管理同步关系，支持集群重命名/迁移。

---

## 接口设计（内部）

java
CacheHotspotManager {
    long createJob(WarmUpClusterStmt stmt);
    void cancel(long jobId);
}

WarmUpClusterStmt(String dstClusterName, String srcClusterName, boolean isForce,
                  Map<String, String> properties);


---

## 指标监控

### 周期性任务 - FE 侧

| 指标名称 | 含义 |
|----------|------|
| file_cache_warm_up_job_exec_count | 调度次数 |
| file_cache_warm_up_job_requested_tablets | 提交的 tablet 数 |
| file_cache_warm_up_job_finished_tablets | 完成的 tablet 数 |
| file_cache_warm_up_job_latest_start_time | 最近一次开始时间 |
| file_cache_warm_up_job_last_finish_time | 最近一次完成时间 |

### 周期性任务 - BE 侧

| 指标名称 | 含义 |
|----------|------|
| file_cache_once_or_periodic_warm_up_submitted_segment_size | 提交 segment 大小 |
| file_cache_once_or_periodic_warm_up_finished_segment_size | 完成 segment 大小 |
| file_cache_once_or_periodic_warm_up_submitted_index_num | 提交 index 数 |
| file_cache_once_or_periodic_warm_up_finished_index_num | 完成 index 数 |

### 事件触发任务 - 源 BE

| 指标名称 | 含义 |
|----------|------|
| file_cache_event_driven_warm_up_requested_segment_size | 请求的 segment 大小 |
| file_cache_event_driven_warm_up_requested_index_num | 请求的 index 数 |
| file_cache_warm_up_rowset_last_call_unix_ts | 最后请求时间戳 |

### 事件触发任务 - 目标 BE

| 指标名称 | 含义 |
|----------|------|
| file_cache_event_driven_warm_up_submitted_segment_num | 收到 segment 数 |
| file_cache_event_driven_warm_up_finished_segment_num | 完成 segment 数 |
| file_cache_warm_up_rowset_last_handle_unix_ts | 最后处理时间戳 |

---

## 常见问题（FAQ）

1. **任务失败会取消整个 JOB 吗？**  
   不会，仅跳过本次同步，后续周期继续执行。

2. **周期性任务支持超时取消吗？**  
   是的，超时后会跳过本轮执行，但保留任务本身。

3. **是否支持多个集群同步到同一个集群？**  
   支持，如 A -> B 与 C -> B 同时存在。

---

## 版本信息

该功能已在 Apache Doris 版本 3.1.0 中引入。
