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

### 单调性保证原理

TSO 的单调性由三层机制共同保证：

- **同一物理毫秒内**：Doris 保持物理时间不变，仅递增逻辑计数器，因此同一毫秒内后发出的 TSO 一定更大。
- **跨物理毫秒**：当物理时间向前推进后，逻辑计数器会重置，因此新的 TSO 仍然会大于之前发出的值。
- **跨重启或切主**：Doris 会回放持久化的 TSO 窗口右界，并把新的起始物理时间校准到历史上界之后，再继续发号。

这也是为什么 Doris 应将 TSO 视为**单调递增的版本生成器**，而不是直接映射物理时钟的时间值。

### Master 切换时的单调性保证

当发生切主时，新 Master FE 会回放持久化的窗口右界并执行时间校准，确保新主发出的第一个 TSO 严格大于旧主已经发出的所有 TSO。

### 只有 Master FE 才能发号

只有 Master FE 被允许生成 TSO 和暴露 `/api/tso`。

- 这样可以避免多个 FE 节点各自独立发号。
- 当前 master 同时负责时间戳分配和窗口右界持久化。
- 角色切换后，旧 master 不应继续作为 TSO 分配器对外服务。


### 持久化与恢复

TSO 重点持久化的是**时间窗口右界**（`windowEndTSO`），而不是每一个已经发出的 TSO。

- Doris 会预先租约一个未来时间窗口，并把该窗口的**右界**写入 EditLog。
- 持久化窗口右界比“每发一个 TSO 就持久化一次”开销更低，但仍然能为恢复提供一个安全的历史上界。
- 如果开启相关能力，checkpoint image 也可以保存 TSO 模块，用于更快恢复这条边界。
- 在恢复过程中，新 master 会先回放这个历史边界，再选择一个比它更大的物理时间作为新的起点，然后继续发号。

正是这个设计，使 Doris 可以在不把每次 TSO 申请都变成持久化操作的前提下，仍然在重启和切主后保持单调性。

### 端到端链路

- Master FE 上的 `TSOService` 负责发放 TSO。
- 守护线程会周期性续租时间窗口，并把新的窗口右界写入 EditLog。
- checkpoint image 可以按需保存 TSO 模块，加快恢复速度。
- 重启或切主后，Doris 会回放窗口右界并校准新的安全起点。
- 对开启 `enable_tso = true` 的表，事务提交时会把 commit TSO 写入 rowset 元数据。
- `/api/tso` 观测的是当前服务状态，`information_schema.rowsets.COMMIT_TSO` 观测的是已经提交落盘的结果。

## 配置项

TSO 由 FE 配置项控制（如何配置与持久化请参见 [FE 配置项](../config/fe-config.md)）：

- `enable_tso_feature`
- `tso_service_update_interval_ms`
- `tso_max_update_retry_count`
- `tso_max_get_retry_count`
- `tso_service_window_duration_ms`
- `tso_clock_backward_startup_threshold_ms`
- `tso_time_offset_debug_mode`（仅测试/调试）
- `enable_tso_persist_journal`（可能影响回滚兼容性）
- `enable_tso_checkpoint_module`（旧版本读取新镜像可能需忽略未知模块）
- `enable_tso_forward_when_counter_full`

## 时钟回拨行为

TSO 在“启动校准”和“正常运行”两个阶段，对时钟回拨的处理方式不同：

- 启动校准阶段，新 Master FE 会比较“持久化的 TSO 窗口右界”与当前系统时间。
- 如果回拨幅度超过 `tso_clock_backward_startup_threshold_ms`，TSO 初始化会直接失败，Master FE 不能安全地继续发放新的 TSO。
- 正常运行阶段，检测到时钟回拨只会记录告警日志和指标，不会立即停止服务。

因此，时钟回拨并不一定会立刻让事务失败；真正的风险在于物理时间能否及时重新向前推进，以及逻辑计数器是否会先被耗尽。

运行阶段对回拨采用较软的处理策略，是因为 Doris 更倾向于先保持 master 可用，再依靠已有的单调性保护、逻辑计数器和已持久化窗口右界继续运行。真正的硬失败发生在启动校准阶段，因为那时 Doris 必须先证明“下一次发号仍然会严格大于历史值”。

## 逻辑计数器耗尽

TSO 使用逻辑计数器在同一毫秒内发放多个唯一时间戳。如果物理时间在一段时间内无法前进，服务就会持续消耗同一个物理毫秒下的逻辑计数器。

- 当逻辑计数器达到上限后，`getTSO()` 会按照 `tso_max_get_retry_count` 进行重试。
- 如果在重试耗尽前仍然等不到新的物理毫秒，TSO 申请会失败。
- 需要 commit TSO 的事务随后可能因为 FE 无法获取有效 TSO 而提交失败。

## 配置影响

- `tso_clock_backward_startup_threshold_ms`：只影响启动校准阶段，用于定义在初始化失败前可容忍的最大时钟回拨量。
- `enable_tso_forward_when_counter_full`：开启后，当逻辑计数器占用较高时，TSO 服务会主动把物理时间前推 1ms，以降低命中逻辑计数器上限的概率。
- `enable_tso_forward_when_counter_full = false`：服务会更依赖真实物理时钟前进；在时钟停滞或回拨场景下，更容易出现逻辑计数器耗尽,但是不会更新物理始终。
- `tso_max_get_retry_count`：控制 FE 在返回 TSO 申请失败前最多重试多少次。
- `tso_service_update_interval_ms`：影响守护线程检查时钟状态与刷新 TSO 时间窗口的频率。
- `enable_tso_persist_journal`：是重启或切主后继续从安全历史上界恢复的基础；没有它就无法可靠避免恢复后的回退风险。
- `enable_tso_checkpoint_module`：影响 checkpoint image 是否也携带 TSO 边界，用于加快恢复；它不会改变运行期发号算法本身。

## 可观测与调试

### FE HTTP 接口

可以通过 FE HTTP 接口在不消耗逻辑计数器的情况下读取当前 TSO 信息：

- `GET /api/tso`

返回结果是当前 TSO 状态的只读快照，包括当前逻辑计数器与当前时间窗口右界。它适合用于观测，但不能保证后续事务一定还能成功获取新的 TSO。

其中，`window_end_physical_time` 表示当前租约窗口的上界，`current_tso` 表示当前的发号游标。窗口右界领先于当前 TSO 的物理时间是正常现象，因为窗口右界本来就是预先租约的未来上界。

参见 [TSO Action](../open-api/fe-http/tso-action.md) 获取鉴权方式、返回字段、示例与注意事项。

### 系统表：`information_schema.rowsets`

在相关能力开启后，Doris 会将提交时的 commit tso 写入 Rowset 元数据，并通过系统表暴露：

- `information_schema.rowsets.COMMIT_TSO`

这依赖 FE 级别 `enable_tso_feature = true` 以及表级 `enable_tso = true` 同时开启。

表级 `enable_tso` 只决定该表是否记录 commit TSO，不会改变 `TSOService` 的发号方式，也不会放宽单调性保护约束。

参见 [rowsets](../system-tables/information_schema/rowsets.md)。

## FAQ

### TSO 能否当作精确的物理时钟（wall clock）使用？

不能。虽然高位包含毫秒级物理时间，但在某些情况下（例如逻辑计数器使用量较高）物理部分可能会被主动推进。因此，应将 TSO 视为**单调递增的版本**，而不是精确的物理时钟。

### 为什么时钟回拨时事务可能报错？

运行期时钟回拨本身只会触发告警和指标，但它可能让 TSO 在同一个物理毫秒内停留更久。如果逻辑计数器的消耗速度快于物理时间恢复速度，FE 在 `tso_max_get_retry_count` 次重试后仍可能拿不到新的 TSO，从而导致需要 commit TSO 的事务提交失败。
