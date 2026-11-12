---
{
    "title": "Получение информации о среде выполнения",
    "language": "ru",
    "description": "Используется для получения информации о среде выполнения JVM процесса FE"
}
---

# Получение информации о среде выполнения {#show-runtime-info-action}

## Запрос {#request}

`GET /api/show_runtime_info`

## Описание {#description}

Используется для получения информации о среде выполнения JVM процесса FE

## Параметры пути {#path-parameters}

Отсутствуют

## Параметры запроса {#query-parameters}

Отсутствуют

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"free_mem": "855642056",
		"total_mem": "1037959168",
		"thread_cnt": "98",
		"max_mem": "1037959168"
	},
	"count": 0
}
```

## Примеры {#examples}

1. Получение информации о JVM текущего узла FE

    ```
    GET /api/show_runtime_info
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"free_mem": "855642056",
    		"total_mem": "1037959168",
    		"thread_cnt": "98",
    		"max_mem": "1037959168"
    	},
    	"count": 0
    }
    ```
