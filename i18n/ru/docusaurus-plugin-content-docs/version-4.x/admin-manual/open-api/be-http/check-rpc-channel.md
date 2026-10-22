---
{
    "title": "Проверка кэша Stub",
    "language": "ru",
    "description": "Проверка доступности кэша соединений"
}
---

# Проверка кэша Stub {#check-stub-cache}

## Запрос {#request}

`GET /api/check_rpc_channel/{host_to_check}/{remot_brpc_port}/{payload_size}`

## Описание {#description}

Проверка доступности кэша соединений

## Параметры пути {#path-parameters}

* `host_to_check`

    Хост для проверки

* `remot_brpc_port`

    Удалённый порт brpc

* `payload_size`

    Размер полезной нагрузки, единица измерения: B, диапазон значений: 1~1024000.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    {
        "msg":"success",
        "code":0,
        "data": "open brpc connection to {host_to_check}:{remot_brpc_port} success.",
        "count":0
    }
    ```
## Примеры {#examples}


    ```
    curl http://127.0.0.1:8040/api/check_rpc_channel/127.0.0.1/8060/1024000
    ```
