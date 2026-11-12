---
{
    "title": "Операция Show Proc",
    "language": "ru",
    "description": "Используется для получения информации PROC."
}
---

# Операция Show Proc {#show-proc-action}

## Запрос {#request}

`GET /api/show_proc`

## Описание {#description}

Используется для получения информации PROC.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* path

    Укажите путь Proc
    
* forward

    Перенаправлять ли запрос на Master FE для выполнения

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": [
		proc infos ...
	],
	"count": 0
}
```

## Примеры {#examples}

1. Просмотр информации о `/statistic`

    ```
    GET /api/show_proc?path=/statistic
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
    
2. Перенаправление на Master для выполнения

    ```
    GET /api/show_proc?path=/statistic&forward=true
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
