---
{
    "title": "Просмотр распределения Tablet",
    "language": "ru",
    "description": "Получение сведений о распределении tablet каждого раздела по различным дискам узла BE"
}
---

# Просмотр распределения Tablet {#view-tablet-distribution}

## Запрос {#request}

`GET /api/tablets_distribution?group_by={enum}&partition_id={int}`

## Описание {#description}

Получение сведений о распределении tablet каждого раздела по различным дискам узла BE

## Параметры запроса {#query-parameters}

* `group_by`
    поддерживается только `partition`

* `partition_id`
    Идентификатор указанного раздела. Необязательный параметр; по умолчанию учитываются все разделы.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```
    {
        msg: "OK",
        code: 0,
        data: {
            host: "***",
            tablets_distribution: [
                {
                    partition_id:***,
                    disks:[
                        {
                            disk_path:"***",
                            tablets_num:***,
                            tablets:[
                                {
                                    tablet_id:***,
                                    schema_hash:***,
                                    tablet_size:***
                                },

                                ...

                            ]
                        },

                        ...

                    ]
                }
            ]
        },
        count: ***
    }
    ```
## Примеры {#examples}


    ```
    curl "http://127.0.0.1:8040/api/tablets_distribution?group_by=partition&partition_id=123"

    ```
