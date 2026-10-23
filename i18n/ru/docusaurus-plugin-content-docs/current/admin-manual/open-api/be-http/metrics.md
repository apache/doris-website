---
{
    "title": "Метрики",
    "language": "ru",
    "description": "Предназначено для prometheus"
}
---

# Метрики {#metrics}

## Запрос {#request}

`GET /metrics?type={enum}&with_tablet={bool}`

## Описание {#description}

Предназначено для prometheus

## Параметры запроса {#query-parameters}

* `type`
    Формат вывода. Необязательный параметр со значением по умолчанию `all` и следующими допустимыми значениями:
    - `core`: Только основные метрики
    - `json`: Формат JSON

* `with_tablet`
    Определяет, следует ли выводить метрики, связанные с tablet. Необязательный параметр со значением по умолчанию `false`.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    doris_be__max_network_receive_bytes_rate LONG 60757
    doris_be__max_network_send_bytes_rate LONG 16232
    doris_be_process_thread_num LONG 1120
    doris_be_process_fd_num_used LONG 336
    ...

    ```
## Примеры {#examples}


    ```
        curl "http://127.0.0.1:8040/metrics?type=json&with_tablet=true"
    ```
