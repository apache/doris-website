---
{
    "title": "BE 설정",
    "language": "ko",
    "description": "BE 설정 조회 및 업데이트"
}
---

# BE 설정 {#config-of-be}

## 요청 {#request}

`GET /api/show_config`
`POST /api/update_config?{key}={val}`

## 설명 {#description}

BE 설정을 조회하고 업데이트합니다.

## 쿼리 매개변수 {#query-parameters}

* `persist`
    설정을 영구 저장할지 여부입니다. 선택 사항이며 기본값은 `false`입니다.

* `key`
    설정 항목 이름

* `val`
    설정 항목 값

## 요청 본문 {#request-body}

없음

## 응답 {#response}

### 조회 {#query}

```
[["agent_task_trace_threshold_sec","int32_t","2","true"], ...]
```

### 업데이트 {#update}
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

## 예제 {#examples}


```
curl "http://127.0.0.1:8040/api/show_config"
```

```
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&persist=true"

```

```
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&enable_merge_on_write_correctness_check=true&persist=true"
```
