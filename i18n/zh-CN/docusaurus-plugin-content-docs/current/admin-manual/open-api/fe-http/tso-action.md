---
{
    "title": "TSO Action",
    "language": "zh-CN",
    "description": "从 Master FE 获取当前 TSO（Timestamp Oracle）信息。"
}
---

## Request

`GET /api/tso`

## Description

从 **Master FE** 获取当前 TSO（Timestamp Oracle）信息。

- 该接口为**只读**：返回当前 TSO，但**不会递增** TSO 值。
- 需要鉴权，请使用具有**管理员权限**的账号访问。
- 该接口适合用于观测当前 TSO 时间窗口右界、物理时间部分和逻辑计数器部分。
- 该接口只反映当前时刻的状态快照，不能保证后续事务一定还能成功获取新的 TSO。

## Path parameters

无

## Query parameters

无

## Request body

无

## Response

成功时，返回体 `code = 0`，并在 `data` 中包含：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| window_end_physical_time | long | Master FE 当前 TSO 时间窗口的右界物理时间（毫秒）。 |
| current_tso | long | 当前完整的 64 位 TSO 值。 |
| current_tso_physical_time | long | 从 `current_tso` 解析出的物理时间部分（毫秒）。 |
| current_tso_logical_counter | long | 从 `current_tso` 解析出的逻辑计数器部分。 |

字段解读：

- `window_end_physical_time` 表示当前已租约 TSO 时间窗口的上界，而不是“最近一次已经发出的 TSO 时间”。
- `current_tso_physical_time` 与 `current_tso_logical_counter` 一起表示当前全局发号游标。
- `window_end_physical_time` 大于 `current_tso_physical_time` 是正常现象，因为窗口右界本来就是预先租约的未来上界。

示例：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "window_end_physical_time": 1625097600000,
    "current_tso": 123456789012345678,
    "current_tso_physical_time": 1625097600000,
    "current_tso_logical_counter": 123
  }
}
```

## 错误

常见错误包括：

- FE 尚未就绪
- 当前 FE 不是 Master
- 鉴权失败

## 注意事项

- 调用该接口不会消耗逻辑计数器。
- 如果系统正处于时钟回拨或时钟停滞场景，当前返回的 TSO 在观测时刻仍可能看起来正常，但后续事务提交仍可能因为 FE 在重试后拿不到新的 TSO 而失败。
- 单次返回正常只说明当前快照看起来健康，并不保证后续分配一定成功。
- 关于时钟回拨行为，请参见 [全局时间戳服务（TSO）](../../cluster-management/tso.md)；关于相关配置，请参见 [FE 配置项](../../config/fe-config.md) 中的 `tso_clock_backward_startup_threshold_ms` 和 `enable_tso_forward_when_counter_full`。
