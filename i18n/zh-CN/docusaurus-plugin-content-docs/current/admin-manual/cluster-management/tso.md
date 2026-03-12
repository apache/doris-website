---
{
    "title": "全局时间戳服务（TSO）",
    "language": "zh-CN",
    "description": "TSO（Timestamp Oracle）为 Doris 提供全局单调递增的时间戳。"
}
---

## 概述

TSO（Timestamp Oracle）是运行在 **Master FE** 上的服务，用于生成 **全局单调递增** 的 64 位时间戳。Doris 在分布式场景中将 TSO 作为统一的版本基准，从而规避多节点物理时钟偏移带来的正确性风险。

典型使用场景包括：

- 跨表、跨节点的统一“事务版本号”。
- 基于全局顺序的增量计算 / 分版本读取。
- 更易观测：时间戳相比内部版本号更具可读性。

## 时间戳结构

TSO 是一个 64 位整数：

- 高位：自 Unix 纪元以来的**物理时间（毫秒）**
- 低位：用于同一毫秒内发号的**逻辑计数器**

TSO 的核心保证是**单调递增**，而不是精确反映物理时钟（wall clock）。

## 架构与生命周期

- **Master FE** 上运行 `TSOService` 守护线程。
- FE 内部组件（例如事务发布与元数据修复流程）通过 `Env.getCurrentEnv().getTSOService().getTSO()` 获取时间戳。
- 服务采用“**时间窗口租约**”（窗口右界物理时间）来降低持久化开销，同时保证切主后的单调性。

### Master 切换时的单调性保证

当发生切主时，新 Master FE 会回放持久化的窗口右界并执行时间校准，确保新主发出的第一个 TSO 严格大于旧主已经发出的所有 TSO。

## 配置项

TSO 由 FE 配置项控制（如何配置与持久化请参见 [FE 配置项](../config/fe-config.md)）：

- `enable_feature_tso`
- `tso_service_update_interval_ms`
- `max_update_tso_retry_count`
- `max_get_tso_retry_count`
- `tso_service_window_duration_ms`
- `tso_time_offset_debug_mode`（仅测试/调试）
- `enable_tso_persist_journal`（可能影响回滚兼容性）
- `enable_tso_checkpoint_module`（旧版本读取新镜像可能需忽略未知模块）

## 可观测与调试

### FE HTTP 接口

可以通过 FE HTTP 接口在不消耗逻辑计数器的情况下读取当前 TSO 信息：

- `GET /api/tso`

参见 [TSO Action](../open-api/fe-http/tso-action.md) 获取鉴权方式、返回字段与示例。

### 系统表：`information_schema.rowsets`

在相关能力开启后，Doris 会将提交时的 commit tso 写入 Rowset 元数据，并通过系统表暴露：

- `information_schema.rowsets.COMMIT_TSO`

参见 [rowsets](../system-tables/information_schema/rowsets.md)。

## FAQ

### TSO 能否当作物理时钟（wall clock）使用？

不能。虽然高位包含毫秒级物理时间，但在某些情况下（例如逻辑计数器使用量较高）物理部分可能会被主动推进。因此，应将 TSO 视为**单调递增的版本**，而不是精确的物理时钟。
