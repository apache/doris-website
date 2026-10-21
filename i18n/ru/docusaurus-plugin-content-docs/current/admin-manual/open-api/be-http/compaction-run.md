---
{
    "title": "Ручной запуск compaction",
    "language": "ru",
    "description": "POST /api/compaction/run?tableid={int}&compacttype=full Обратите внимание: tableid=xxx учитывается только при указании compacttype=full."
}
---

# Ручной запуск compaction {#manually-trigger-compaction}

## Запрос {#request}

`POST /api/compaction/run?tablet_id={int}&compact_type={enum}`
`POST /api/compaction/run?table_id={int}&compact_type=full` Обратите внимание: table_id=xxx учитывается только при указании compact_type=full.
`GET /api/compaction/run_status?tablet_id={int}`


## Описание {#description}

Используется для ручного запуска сравнения и просмотра состояния.

## Параметры запроса {#query-parameters}

* `tablet_id`
    - Идентификатор tablet

* `table_id`
    - Идентификатор таблицы. Обратите внимание: table_id=xxx учитывается только при указании compact_type=full. Можно указать только один из параметров tablet_id и table_id; одновременно указывать их нельзя. После указания table_id для всех tablet этой таблицы автоматически выполняется full_compaction.

* `compact_type`
    - Допустимые значения: `base`, `cumulative` или `full`. Сценарии использования full_compaction описаны в разделе [Восстановление данных](../../trouble-shooting/repairing-data).

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

### Запуск compaction {#trigger-compaction}

Если tablet не существует, возвращается ошибка в формате JSON:

```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```

Если tablet существует, но не запущен, возвращается ответ в формате JSON:

```
{
    "status": "Fail",
    "msg": "fail to execute compaction, error = -2000"
}
```

Если tablet существует и запущен, возвращается ответ в формате JSON:

```
{
    "status": "Success",
    "msg": "compaction task is successfully triggered."
}
```

Пояснения к результатам:

* status: состояние запуска задачи. При успешном запуске возвращается Success; если по какой-либо причине (например, не удалось получить подходящую версию) запуск не выполнен, возвращается Fail.
* msg: подробная информация об успешном выполнении или ошибке.

### Просмотр состояния {#show-status}

Если tablet не существует, возвращается ошибка в формате JSON:
```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```
Если tablet существует, но не запущен, возвращается ответ в формате JSON:

```
{
    "status" : "Success",
    "run_status" : false,
    "msg" : "this tablet_id is not running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : ""
}
```

Если tablet существует и запущен, возвращается ответ в формате JSON:
```
{
    "status" : "Success",
    "run_status" : true,
    "msg" : "this tablet_id is running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : "cumulative"
}
```

Пояснения к результатам:

* run_status: текущее состояние выполнения задачи compaction, запущенной вручную.

### Примеры {#examples}

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=cumulative"
```
