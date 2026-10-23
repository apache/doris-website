---
{
    "title": "Получение информации о задании загрузки",
    "language": "ru",
    "description": "Используется для получения информации о задании загрузки с указанной меткой."
}
---

# Получение информации о задании загрузки {#get-load-info-action}

## Запрос {#request}

`GET /api/<db>/_load_info`

## Описание {#description}

Используется для получения информации о задании загрузки с указанной меткой.

## Параметры пути {#path-parameters}

* `<db>`

    Укажите базу данных

## Параметры запроса {#query-parameters}

* `label`

    Укажите метку загрузки

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"dbName": "default_cluster:db1",
		"tblNames": ["tbl1"],
		"label": "my_label",
		"clusterName": "default_cluster",
		"state": "FINISHED",
		"failMsg": "",
		"trackingUrl": ""
	},
	"count": 0
}
```

## Примеры {#examples}

1. Получение информации о задании загрузки с указанной меткой

    ```
    GET /api/example_db/_load_info?label=my_label
    
    Response
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"dbName": "default_cluster:db1",
    		"tblNames": ["tbl1"],
    		"label": "my_label",
    		"clusterName": "default_cluster",
    		"state": "FINISHED",
    		"failMsg": "",
    		"trackingUrl": ""
    	},
    	"count": 0
    }
    ```
