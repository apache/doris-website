---
{
    "title": "Создание снимка",
    "language": "ru",
    "description": "Создание снимка tablet"
}
---

# Создание снимка {#make-snapshot}

## Запрос {#request}

`GET /api/snapshot?tablet_id={int}&schema_hash={int}"`

## Описание {#description}

Создание снимка tablet

## Параметры запроса {#query-parameters}

* `tablet_id`
    Идентификатор tablet

* `schema_hash`
    Хеш схемы         


## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    /path/to/snapshot
    ```
## Примеры {#examples}


    ```
    curl "http://127.0.0.1:8040/api/snapshot?tablet_id=123456&schema_hash=1111111"

    ```
