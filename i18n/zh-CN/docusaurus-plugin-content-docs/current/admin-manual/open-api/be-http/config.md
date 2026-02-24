---
{
    "title": "BE 的配置信息",
    "language": "zh-CN",
    "description": "查询/更新 BE 的配置信息"
}
---

## 请求路径

`GET /api/show_config`
`POST /api/update_config?{key}={val}`

## 描述

查询/更新 BE 的配置信息

## 请求参数

* `persist`
    是否持久化，选填，默认`false`。

* `key`
    配置项名。

* `val`
    配置项值。        

## 请求体

无

## 响应

### 查询

```json
[["agent_task_trace_threshold_sec","int32_t","2","true"], ...]
```

### 更新
```json
[
    {
        "config_name": "agent_task_trace_threshold_sec",
        "status": "OK",
        "msg": ""
    }
]
```

```json
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
## 示例


```shell
curl "http://127.0.0.1:8040/api/show_config"
```

```shell
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&persist=true"

```

```shell
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&enable_merge_on_write_correctness_check=true&persist=true"
```