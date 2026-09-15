---
{
    "title": "查看 Tablet Compaction Score",
    "language": "zh-CN",
    "description": "用于查看 BE 节点上各 Tablet 的 Compaction Score。"
}
---

# 查看 Tablet Compaction Score

## 请求路径

`GET /api/compaction_score?top_n={int}&sync_meta={bool}`

## 描述

用于查看某个 BE 节点上各 Tablet 的 Compaction Score。Compaction Score 按每个 Tablet 中所有 Rowset 的 Compaction Score 求和得到。响应结果按 `compaction_score` 降序排列。

## 请求参数

* `top_n`

    可选。非负整数。指定后仅返回 Compaction Score 最高的前 N 个 Tablet；不指定时返回该 BE 节点上的所有 Tablet。`top_n=0` 返回空数组。

* `sync_meta`

    可选。仅适用于存算分离模式。取值为 `true` 或 `false`。设置为 `true` 时，BE 会先从 Meta Service 同步 Tablet 元数据和 Rowset，再计算 Compaction Score。非存算分离模式下不要指定该参数。

## 请求体

无

## 响应

返回 JSON 数组，每个元素包含以下字段：

* `tablet_id`：Tablet ID。返回值类型为字符串。
* `compaction_score`：Tablet 的 Compaction Score。返回值类型为字符串。

响应示例：

```json
[
    {
        "compaction_score": "5",
        "tablet_id": "42595"
    },
    {
        "compaction_score": "4",
        "tablet_id": "10034"
    }
]
```

## 错误处理

* `top_n` 不是合法的非负整数时，API 返回 HTTP 400，错误信息如 `invalid argument: top_n=wrong`。
* 非存算分离模式下指定 `sync_meta` 时，API 返回 HTTP 400，错误信息为 ``param `sync_meta` is only available for cloud mode``。
* `sync_meta` 不是 `true` 或 `false` 时，API 返回 HTTP 400，错误信息如 `invalid argument: sync_meta=wrong`。

## 示例

查看 Compaction Score 最高的前 10 个 Tablet：

```shell
curl "http://127.0.0.1:8040/api/compaction_score?top_n=10"
```

在存算分离模式下同步元数据后查看 Compaction Score：

```shell
curl "http://127.0.0.1:8040/api/compaction_score?top_n=10&sync_meta=true"
```
