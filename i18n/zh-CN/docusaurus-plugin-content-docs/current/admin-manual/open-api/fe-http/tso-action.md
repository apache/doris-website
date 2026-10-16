---
{
    "title": "TSO Action",
    "language": "zh-CN",
    "description": "查询 TSO 状态，支持 Master 转发与本地状态。"
}
---

<version since="dev">

</version>

## 描述

查询 TSO 服务当前状态，不分配新时间戳，也不递增逻辑计数器。需要有效的 Doris 用户认证。默认在非 Master FE 上转发请求给 Master FE；`local=true` 返回接收请求的 FE 本地状态。详细前提条件见 [TSO](../../cluster-management/tso.md)。

## 请求

`GET /api/tso`

## 参数

| 参数 | 类型 | 是否必需 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `local` | boolean | 否 | `false` | 为 `true` 时跳过 Master 转发，查询当前 FE 的本地状态。 |

无路径参数和请求体。

## 示例

使用默认 HTTP 端口，命令会提示输入密码：

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

示意响应（时间戳由运行中的集群决定）：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "window_end_physical_time": 1625097601000,
    "current_tso": 426009585254400123,
    "current_tso_physical_time": 1625097600000,
    "current_tso_logical_counter": 123
  }
}
```

## 响应字段

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `window_end_physical_time` | long | 预留分配窗口的终点，单位为 Unix 毫秒。 |
| `current_tso` | long | 当前组合后的 64 位分配游标。 |
| `current_tso_physical_time` | long | current_tso 的物理时间部分，单位为毫秒。 |
| `current_tso_logical_counter` | long | current_tso 的逻辑计数器部分。 |

## 错误与注意事项

认证失败、FE 未就绪或请求转发失败均可能导致错误。未初始化的本地服务可能返回零值；返回快照不保证后续分配一定成功。仅当前 Master 负责分配 TSO，但任意就绪 FE 都可以接收状态请求。`window_end_physical_time` 通常领先当前物理时间，这表示预留的窗口范围。
