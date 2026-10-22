---
{
    "title": "Операция со статистикой запросов",
    "language": "ru",
    "description": "Получение или удаление статистики указанного Catalog, базы данных или таблицы. Для Catalog Doris можно использовать defaultcluster"
}
---

## Запрос {#request}

```
View  
get api/query_stats/<catalog_name>  
get api/query_stats/<catalog_name>/<db_name>  
get api/query_stats/<catalog_name>/<db_name>/<tbl_name>  
  
Clear  
delete api/query_stats/<catalog_name>/<db_name>  
delete api/query_stats/<catalog_name>/<db_name>/<tbl_name>
```

## Описание {#description}

Получение или удаление статистики указанного Catalog, базы данных или таблицы. Для Catalog Doris можно использовать default_cluster

## Параметры пути {#path-parameters}

* `<catalog_name>`
  имя указанного Catalog
* 
* `<db_name>`
    имя указанной базы данных

* `<tbl_name>`
    имя указанной таблицы

## Параметры запроса {#query-parameters}
* `summary`
    Если true, возвращается только сводная информация, иначе — вся подробная статистика таблицы. Используется только для get

## Тело запроса {#request-body}

```
GET /api/query_stats/default_cluster/test_query_db/baseall?summary=false
{
    "msg": "success",
    "code": 0,
    "data": {
        "summary": {
            "query": 2
        },
        "detail": {
            "baseall": {
                "summary": {
                    "query": 2
                }
            }
        }
    },
    "count": 0
}

```

## Ответ {#response}

* Возвращает статистическую информацию


## Пример {#example}


2. Использование curl

    ```
    curl --location -u root: 'http://127.0.0.1:8030/api/query_stats/default_cluster/test_query_db/baseall?summary=false'
    ```
