---
{
    "title": "Просмотр метаданных",
    "language": "ru",
    "description": "Просмотр метаданных tablet"
}
---

# Просмотр метаданных {#view-meta}

## Запрос {#request}

`GET /api/meta/header/{tablet_id}?byte_to_base64={bool}`

## Описание {#description}

Просмотр метаданных tablet

## Параметры пути {#path-parameters}

* `tablet_id`
    Идентификатор tablet

## Параметры запроса {#query-parameters}

* `byte_to_base64`
    Определяет, следует ли использовать кодирование base64. Необязательный параметр со значением по умолчанию `false`.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

```
{
    "table_id": 148107,
    "partition_id": 148104,
    "tablet_id": 148193,
    "schema_hash": 2090621954,
    "shard_id": 38,
    "creation_time": 1673253868,
    "cumulative_layer_point": -1,
    "tablet_state": "PB_RUNNING",
    ...
}
```
## Примеры {#examples}


```
curl "http://127.0.0.1:8040/api/meta/header/148193?byte_to_base64=true"

```
