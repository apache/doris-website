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
