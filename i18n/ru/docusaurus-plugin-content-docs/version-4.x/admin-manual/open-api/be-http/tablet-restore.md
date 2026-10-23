---
{
    "title": "Восстановление таблета",
    "language": "ru",
    "description": "Восстановление данных таблета из каталога trash на BE"
}
---

# Восстановление таблета {#restore-tablet}

## Запрос {#request}

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## Описание {#description}

Восстановление данных таблета из каталога trash на BE

## Параметры запроса {#query-parameters}

* `tablet_id`
    Идентификатор таблета

* `schema_hash`
    Хеш схемы       


## Тело запроса {#request-body}

Нет

## Ответ {#response}

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## Примеры {#examples}


    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```
