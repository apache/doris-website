---
{
    "title": "Действие Backends",
    "language": "ru",
    "description": "Действие Backends возвращает список узлов Backend, включая их IP, PORT и другую информацию."
}
---

# Действие Backends {#backends-action}

## Запрос {#request}

```
GET /api/backends
```

## Описание {#description}

Действие Backends возвращает список узлов Backend, включая их IP, PORT и другую информацию.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `is_alive`

    Необязательный параметр. Определяет, следует ли возвращать только работающие узлы BE. Значение по умолчанию: false, при котором возвращаются все узлы BE.

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "backends": [
            {
                "ip": "192.1.1.1",
                "http_port": 8040,
                "is_alive": true
            }
        ]
    },
    "count": 0
}
```
