---
{
    "title": "Контрольная сумма",
    "language": "ru",
    "description": "Контрольная сумма"
}
---

# Контрольная сумма {#checksum}

## Запрос {#request}

`GET /api/checksum?tablet_id={int}&version={int}&schema_hash={int}`

## Описание {#description}

Контрольная сумма

## Параметры запроса {#query-parameters}

* `tablet_id`
    Идентификатор проверяемого tablet

* `version`
    Версия проверяемого tablet 

* `schema_hash`
    Хеш схемы

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    1843743562
    ```
## Примеры {#examples}


    ```
    curl "http://127.0.0.1:8040/api/checksum?tablet_id=1&version=1&schema_hash=-1"
    
    ```
