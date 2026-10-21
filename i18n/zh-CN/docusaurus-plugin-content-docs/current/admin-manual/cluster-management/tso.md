---
{
    "title": "Timestamp Oracle (TSO)",
    "language": "zh-CN",
    "description": "TSO 的配置、状态查询、恢复和时钟回退行为。"
}
---

<version since="dev">

</version>

## 概述

Timestamp Oracle（TSO）是 Master FE 上的单调时间戳分配服务，为 Doris 的事务及增量处理提供全局排序依据。该功能当前仅在 dev 版本可用，由 FE 配置 `enable_feature_changelog` 控制，默认关闭。TSO 的物理部分可能主动向前推进，因此不能把它当作精确的墙上时钟。

## 基本用法

1. 在 FE 配置文件 `fe.conf` 中设置 `enable_feature_changelog = true`，并重启 FE。该配置是实验性配置，不能动态修改；多 FE 集群应保持配置一致。启用 Changelog 前请同时评估该功能对集群的影响。
2. 确认集群已有就绪的 Master FE，并准备有效的 Doris 用户名和密码。
3. 查询只读状态接口。下面的命令使用默认 HTTP 端口，并提示输入 root 密码：

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

返回 `code = 0`，`data` 中包含当前分配游标、物理时间、逻辑计数器及窗口终点。请求发到非 Master FE 时，默认转发给 Master FE。完整响应示例见 [TSO Action](../open-api/fe-http/tso-action.md)。

若只想检查接收请求的 FE 本地状态，可以使用：

```bash
curl --user root 'http://127.0.0.1:8030/api/tso?local=true'
```

该调用不分配新时间戳。本地状态可能尚未初始化；非 Master FE 的本地结果不能代表当前 Master 的分配状态。

## 时间戳格式与恢复

TSO 使用一个 64 位整数保存毫秒级物理部分及 18 位逻辑计数器。同一物理毫秒内，通过递增逻辑计数器保证后续分配值更大；物理部分向前推进后，计数器重新开始。

Master FE 预留未来的分配窗口，并将窗口终点和已提交 TSO 状态持久化。启动或主节点切换时，服务先回放状态、校准新的起点，再分配时间戳。持久化属于当前实现的正常流程，不需要另行打开 TSO 日志或 checkpoint 开关。

## 配置参考

以下参数均为 FE 配置，详见 [FE 配置](../config/fe-config.md)。基础开关 `enable_feature_changelog` 为 `boolean` 类型，默认 `false`，不可动态修改，且不只作用于 Master FE。

| 参数 | 类型 | 默认值 | 可动态修改 | 仅 Master FE | 描述 |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | 分配窗口更新检查的间隔。 |
| `tso_max_update_retry_count` | int | `3` | true | true | 更新 TSO 状态的最大尝试次数。 |
| `tso_max_get_retry_count` | int | `10` | true | true | 分配 TSO 的最大尝试次数，耗尽后报错。 |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | 预留分配窗口的长度，同时限定周期性持久化间隔。 |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | 启动校准时，回放的窗口终点领先系统时钟的最大允许值。 |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | 仅供测试的时钟偏移，正常运行时不要使用。 |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | 当逻辑计数器超过容量的一半且系统时钟推进不足时，将物理部分向前推进 1 毫秒。 |

## 错误处理与注意事项

- 启动校准时，如果回放的窗口终点领先系统时钟的幅度超过 `tso_clock_backward_startup_threshold_ms`，校准失败，服务不能安全分配新 TSO。先检查时钟同步、持久化状态及 FE 日志。
- 运行时检测到时钟回退会记录告警和指标；这本身不会立即停掉服务。若物理时间不能推进，逻辑计数器可能耗尽；分配重试耗尽后，依赖 TSO 的事务可能失败。
- `/api/tso` 只提供瞬时快照，不会消耗逻辑计数器。零值或看似正常的快照都不能代替初始化状态和事务提交检查。
- `information_schema.rowsets.COMMIT_TSO` 是表示 rowset TSO 范围的字符串，不是单个 BIGINT。详见 [rowsets](../system-tables/information_schema/rowsets.md)。

## 建议

保持 FE 时钟同步，使用接口观察状态，并结合 FE 日志排查校准和分配失败。除明确的测试场景外，不要修改调试时钟偏移。只有在理解 Changelog 及依赖功能的前提下才启用基础开关，不应仅为获取一个墙上时间值而启用它。
