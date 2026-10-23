---
{
    "title": "Операции с кластером",
    "language": "ru",
    "description": "Используется для получения сведений о подключении к кластеру по HTTP и MySQL."
}
---

# Операции с кластером {#cluster-action}

## Запрос {#request}

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

## Сведения о подключении к кластеру {#cluster-connection-information}

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

### Описание {#description}

Используется для получения сведений о подключении к кластеру по HTTP и MySQL.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

### Ответ {#response}

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "http": [
            "fe_host:http_ip"
        ],
        "mysql": [
            "fe_host:query_ip"
        ]
    },
    "count": 0
}
```

### Примеры {#examples}
```
GET /rest/v2/manager/cluster/cluster_info/conn_info

Response:
{
    "msg": "success",
    "code": 0,
    "data": {
        "http": [
            "127.0.0.1:8030"
        ],
        "mysql": [
            "127.0.0.1:9030"
        ]
    },
    "count": 0
}
```
