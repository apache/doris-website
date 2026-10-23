---
{
    "title": "Конфигурация BE",
    "language": "ru",
    "description": "Запрос и обновление конфигурации BE"
}
---

# Конфигурация BE {#config-of-be}

## Запрос {#request}

`GET /api/show_config`
`POST /api/update_config?{key}={val}`

## Описание {#description}

Запрос и обновление конфигурации BE

## Параметры запроса {#query-parameters}

* `persist`
    Определяет, нужно ли сохранять изменения. Необязательный параметр со значением по умолчанию `false`.

* `key`
    Имя параметра конфигурации

* `val`
    Значение параметра конфигурации        

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

### Запрос {#query}

```
[["agent_task_trace_threshold_sec","int32_t","2","true"], ...]
```

### Обновление {#update}
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

## Примеры {#examples}


```
curl "http://127.0.0.1:8040/api/show_config"
```

```
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&persist=true"

```

```
curl -X POST "http://127.0.0.1:8040/api/update_config?agent_task_trace_threshold_sec=2&enable_merge_on_write_correctness_check=true&persist=true"
```
