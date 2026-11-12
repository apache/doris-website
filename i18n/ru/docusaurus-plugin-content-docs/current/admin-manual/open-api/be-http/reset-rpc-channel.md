---
{
    "title": "Сброс кэша Stub",
    "language": "ru",
    "description": "Сброс кэша соединений brpc"
}
---

# Сброс кэша Stub {#reset-stub-cache}

## Запрос {#request}

`GET /api/reset_rpc_channel/{endpoints}`

## Описание {#description}

Сброс кэша соединений brpc

## Параметры пути {#path-parameters}

* `endpoints`
    - `all`: очистить все кэши
    - `host1:port1,host2:port2`: очистить кэш указанного целевого узла

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    {
        "msg":"success",
        "code":0,
        "data": "no cached channel.",
        "count":0
    }
    ```
## Примеры {#examples}


    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/all
    ```
    
    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/1.1.1.1:8080,2.2.2.2:8080
    ```
