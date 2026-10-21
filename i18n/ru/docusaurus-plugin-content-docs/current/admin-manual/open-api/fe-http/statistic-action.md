---
{
    "title": "Получение статистики",
    "language": "ru",
    "description": "Получение статистики кластера, например количества баз данных и таблиц."
}
---

# Получение статистики {#statistic-action}

## Запрос {#request}

`GET /rest/v2/api/cluster_overview`

## Описание {#description}

Получение статистики кластера, например количества баз данных и таблиц.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
    "msg":"success",
    "code":0,
    "data":{"diskOccupancy":0,"remainDisk":5701197971457,"feCount":1,"tblCount":27,"beCount":1,"dbCount":2},
    "count":0
}
```
