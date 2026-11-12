---
{
    "title": "Добавление пустого rowset",
    "language": "ru",
    "description": "Добавляет один пустой rowset в качестве замены неисправной реплики."
}
---

# Добавление пустого rowset {#pad-rowset}

## Запрос {#request}

`POST /api/pad_rowset?tablet_id={int}&start_version={int}&end_version={int}`

## Описание {#description}

Добавляет один пустой rowset в качестве замены неисправной реплики.

## Параметры запроса {#query-parameters}

* `tablet_id`
    Идентификатор tablet

* `start_version`
    Начальная версия

* `end_version`
    Конечная версия       


## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## Примеры {#examples}


    ```
    curl -X POST "http://127.0.0.1:8040/api/pad_rowset?tablet_id=123456&start_version=1111111&end_version=1111112"

    ```
