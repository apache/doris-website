---
{
    "title": "Повторная загрузка Tablet",
    "language": "ru",
    "description": "Повторная загрузка tablet"
}
---

# Повторная загрузка Tablet {#reload-tablet}

## Запрос {#request}

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## Описание {#description}

Повторная загрузка tablet

## Параметры запроса {#query-parameters}

* `tablet_id`
    Идентификатор tablet

* `schema_hash`
    Хеш схемы      

* `path`
    Путь к файлу    


## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    load header succeed
    ```
## Примеры {#examples}


    ```
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```
