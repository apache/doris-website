---
{
    "title": "Миграция tablet",
    "language": "ru",
    "description": "Перенос tablet на указанный диск."
}
---

# Миграция tablet {#migration-tablet}

## Запрос {#request}

`GET /api/tablet_migration?goal={enum}&tablet_id={int}&schema_hash={int}&disk={string}`

## Описание {#description}

Перенос tablet на указанный диск.

## Параметры запроса {#query-parameters}

* `goal`
    - `run`：отправить задачу миграции
    - `status`：показать состояние задачи миграции

* `tablet_id`
    Идентификатор tablet

* `schema_hash`
    Хеш схемы

* `disk`
    Указанный диск.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

### Отправка задачи {#submit-task}

```
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```
Или
```
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

### Просмотр состояния {#show-status}

```
    {
        status: "Success",
        msg: "migration task is running",
        dest_disk: "xxxxxx"
    }
```

Или

```
    {
        status: "Success",
        msg: "migration task has finished successfully",
        dest_disk: "xxxxxx"
    }
```

Или

```
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```

## Примеры {#examples}


    ```
    curl "http://127.0.0.1:8040/api/tablet_migration?goal=run&tablet_id=123&schema_hash=333&disk=/disk1"

    ```
