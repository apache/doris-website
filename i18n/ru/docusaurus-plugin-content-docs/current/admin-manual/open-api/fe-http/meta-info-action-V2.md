---
{
    "title": "Получение метаданных V2 | Fe Http",
    "language": "ru",
    "description": "Позволяет получить метаданные кластера, включая список баз данных, список таблиц и схему таблицы.",
    "sidebar_label": "Получение метаданных V2"
}
---

# Получение метаданных {#meta-info-action}

## Запрос {#request}

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## Описание {#description}

Позволяет получить метаданные кластера, включая список баз данных, список таблиц и схему таблицы.


## Параметры пути {#path-parameters}

* `ns`

    Укажите имя кластера.

* `db`

    Укажите имя базы данных.

* `tbl`

    Укажите имя таблицы.

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
    "msg":"success",
    "code":0,
    "data":["database list" / "table list" / "table schema"],
    "count":0
}
```
