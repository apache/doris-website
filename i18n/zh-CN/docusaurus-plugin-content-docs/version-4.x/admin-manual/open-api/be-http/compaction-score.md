---
{
    "title": "查看 Tablet Compaction Score",
    "language": "zh-CN",
    "description": "查看并排序单个 BE 节点的 Tablet Compaction Score，支持在存算分离模式下先同步缓存 Tablet 的元数据。"
}
---

# 查看 Tablet Compaction Score

## 描述

通过此只读 API 查找单个 BE 节点上 Compaction Score 较高的 Tablet。一个 Tablet 的分数为其所有 Rowset 分数之和，结果按 `compaction_score` 降序排列。存算分离模式下，API 仅检查当前 BE 缓存中处于运行状态的 Tablet，不会遍历整个集群的全部 Tablet。

## 前提条件

直接访问 BE 的 HTTP 端口（默认为 8040）。如果 BE 配置 `enable_all_http_auth` 已启用，需要使用具有全局 `ADMIN` 权限的 Doris 账号，并将示例中的凭据替换为该账号。

## 请求

```text
GET /api/compaction_score?top_n=<integer>&sync_meta=<boolean>
```

请求不包含请求体。

## 请求参数

| 参数 | 类型 | 是否必填 | 默认值 | 描述 |
|---|---|---|---|---|
| `top_n` | 非负整数 | 否 | 全部可用 Tablet | 最多返回分数最高的前 N 个 Tablet。`0` 返回 `[]`。数值必须处于有符号 64 位整数范围内。 |
| `sync_meta` | 布尔值：`true` 或 `false` | 否 | `false` | 仅适用于存算分离模式。为 `true` 时，先从 Meta Service 同步该 BE 缓存中运行状态 Tablet 的元数据和 Rowset，再计算分数。存算一体模式下必须省略整个参数，包括 `sync_meta=false`。 |

## 基本用法

以下请求可检查连通性和参数处理，且不返回 Tablet 行：

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=0'
```

```json
[]
```

## 响应

请求成功时返回 HTTP 200 和 JSON 数组。每个元素包含两个字符串类型的字段：

| 字段 | 描述 |
|---|---|
| `tablet_id` | Tablet ID。 |
| `compaction_score` | 该 Tablet 所有 Rowset 的 Compaction Score 之和。 |

例如，最多返回 10 个 Tablet：

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10'
```

以下输出仅作示意，ID、分数和返回数量取决于该 BE 的状态：

```json
[
    {"compaction_score": "5", "tablet_id": "42595"},
    {"compaction_score": "4", "tablet_id": "10034"}
]
```

存算分离模式下，可在计算分数前同步缓存 Tablet 的最新元数据：

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10&sync_meta=true'
```

响应使用相同的 JSON 格式，分数在同步完成后计算。

## 错误处理与注意事项

- `top_n` 无法解析或为负数时返回 HTTP 400，例如 `invalid argument: top_n=wrong`。
- 存算一体模式下指定非空 `sync_meta` 时返回 HTTP 400：``param `sync_meta` is only available for cloud mode``。
- 存算分离模式下，非空 `sync_meta` 不是 `true` 或 `false` 时返回 HTTP 400，例如 `invalid argument: sync_meta=wrong`。
- 元数据同步失败时返回 HTTP 500。启用鉴权后，缺失或无效凭据可能返回 HTTP 401 或 403。
- `top_n` 只限制响应条数，不限制检查或同步的 Tablet 数量。分数反映该 BE 的 Tablet 状态，不构成整个集群的原子快照。

## 最佳实践

先使用较小的 `top_n` 和默认的 `sync_meta=false` 定位需要进一步排查的 Tablet。需要最新元数据时再使用 `sync_meta=true`；它会在应用 `top_n` 前同步全部缓存中运行状态的 Tablet，可能增加延迟和 Meta Service 负载。
