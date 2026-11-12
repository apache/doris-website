---
{
    "title": "Получение справки",
    "language": "ru",
    "description": "Позволяет получить справку по запросу с нечётким сопоставлением."
}
---

# Получение справки {#help-action}

## Запрос {#request}

`GET /rest/v1/help`

## Описание {#description}

Позволяет получить справку по запросу с нечётким сопоставлением.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `query`

    Ключевые слова для сопоставления, например array и select.

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
    "msg":"success",
    "code":0,
    "data":{"fuzzy":"No Fuzzy Matching Topic","matching":"No Matching Category"},
    "count":0
}
```
