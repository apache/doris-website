---
{
    "title": "Контроллер получения профиля запроса | Fe Http",
    "language": "ru",
    "description": "Это действие позволяет получить профиль запроса.",
    "sidebar_label": "Контроллер получения профиля запроса"
}
---

# Получение профиля запроса {#query-profile-action}

## Запрос {#request}

```
GET /rest/v1/query_profile/<query_id>
```

## Описание {#description}

Это действие позволяет получить профиль запроса.

## Параметры пути {#path-parameters}

* `<query_id>`

    Необязательный параметр. Если он не указан, возвращается список последних запросов. Если указан, возвращается профиль указанного запроса.

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Ответ {#response}

* Без указания `<query_id>`

    ```
    GET /rest/v1/query_profile/
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"href_column": ["Query ID"],
    		"column_names": ["Query ID", "User", "Default Db", "Sql Statement", "Query Type", "Start Time", "End Time", "Total", "Query State"],
    		"rows": [{
    			"User": "root",
    			"__hrefPath": ["/query_profile/d73a8a0b004f4b2f-b4829306441913da"],
    			"Query Type": "Query",
    			"Total": "5ms",
    			"Default Db": "default_cluster:db1",
    			"Sql Statement": "select * from tbl1",
    			"Query ID": "d73a8a0b004f4b2f-b4829306441913da",
    			"Start Time": "2020-09-03 10:07:54",
    			"Query State": "EOF",
    			"End Time": "2020-09-03 10:07:54"
    		}, {
    			"User": "root",
    			"__hrefPath": ["/query_profile/fd706dd066824c21-9d1a63af9f5cb50c"],
    			"Query Type": "Query",
    			"Total": "6ms",
    			"Default Db": "default_cluster:db1",
    			"Sql Statement": "select * from tbl1",
    			"Query ID": "fd706dd066824c21-9d1a63af9f5cb50c",
    			"Start Time": "2020-09-03 10:07:54",
    			"Query State": "EOF",
    			"End Time": "2020-09-03 10:07:54"
    		}]
    	},
    	"count": 3
    }
    ```
    
    Возвращаемый результат, как и в случае с `System Action`, представляет собой описание таблицы.
    
* С указанием `<query_id>`

    ```
    GET /rest/v1/query_profile/<query_id>

    {
    	"msg": "success",
    	"code": 0,
    	"data": "Query:</br>&nbsp;&nbsp;&nbsp;&nbsp;Summary:</br>...",
    	"count": 0
    }
    ```
    
    `data` содержит текст профиля.
