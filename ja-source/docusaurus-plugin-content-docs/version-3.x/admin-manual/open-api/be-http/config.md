---
{
  "title": "BEの設定",
  "language": "ja",
  "description": "BEの設定を照会および更新する"
}
---
# BEの設定

## リクエスト

`GET /api/show_config`
`POST /api/update_config?{key}={val}`

## 説明

BEの設定を照会および更新します

## クエリパラメータ

* `persist`
    永続化するかどうか。オプション、デフォルトは`false`。

* `key`
    設定項目名

* `val`
    設定項目値        

## リクエストボディ

なし

## レスポンス

### クエリ

```
[["agent_task_trace_threshold_sec","int32_t","2","true"], ...]
```
### 更新

```
[
    {
        "config_name": "agent_task_trace_threshold_sec",
        "status": "OK",
        "msg": ""
    }
]
```
```
[
    {
        "config_name": "agent_task_trace_threshold_sec",
        "status": "OK",
        "msg": ""
    },
    {
        "config_name": "enable_segcompaction",
        "status": "BAD",
        "msg": "set enable_segcompaction=false failed, reason: [NOT_IMPLEMENTED_ERROR]'enable_segcompaction' is not support to modify."
    },
    {
        "config_name": "enable_time_lut",
        "status": "BAD",
        "msg": "set enable_time_lut=false failed, reason: [NOT_IMPLEMENTED_ERROR]'enable_time_lut' is not support to modify."
    }
]
```
## 例

```
curl "http://127.0.0.1:8040/api/show_config"
```
```
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&persist=true"

```
```
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&enable_merge_on_write_correctness_check=true&persist=true"
```
