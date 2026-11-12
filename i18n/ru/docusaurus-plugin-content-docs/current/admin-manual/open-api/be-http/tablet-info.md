---
{
    "title": "Просмотр информации о Tablet",
    "language": "ru",
    "description": "Просмотр информации о Tablet, включая ID и хеш схемы."
}
---

# Просмотр информации о Tablet {#view-tablet-info}

## Запрос {#request}

`GET /tablets_json?limit={int}`

## Описание {#description}

Просмотр информации о Tablet, включая ID и хеш схемы.

## Параметры запроса {#query-parameters}

* `limit`
    Количество выводимых объектов Tablet. Необязательный параметр со значением по умолчанию 1000. Укажите `all`, чтобы вывести все объекты Tablet.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    {
        msg: "OK",
        code: 0,
        data: {
            host: "10.38.157.107",
            tablets: [
                {
                    tablet_id: 11119,
                    schema_hash: 714349777
                },

                    ...

                {
                    tablet_id: 11063,
                    schema_hash: 714349777
                }
            ]
        },
        count: 30
    }
    ```
## Примеры {#examples}


    ```
    curl http://127.0.0.1:8040/tablets_json?limit=all

    ```
