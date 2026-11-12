---
{
    "title": "Получение схемы таблицы",
    "language": "ru",
    "description": "Используется для получения информации о структуре указанной таблицы. Этот интерфейс в настоящее время используется в Spark/Flink Doris Connector."
}
---

# Получение схемы таблицы {#table-schema-action}

## Запрос {#request}

`GET /api/<db>/<table>/_schema`

## Описание {#description}

Используется для получения информации о структуре указанной таблицы. Этот интерфейс в настоящее время используется в Spark/Flink Doris Connector. Получает информацию о структуре таблицы Doris.

## Параметры пути {#path-parameters}

* `<db>`

    Укажите базу данных

* `<table>`

    Укажите таблицу

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Ответ {#response}
* Интерфейс http возвращает следующий ответ:
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": "",
			"aggregation_type":""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": "",
			"aggregation_type":"MAX"
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
* Интерфейс http v2 возвращает следующий ответ:
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": ""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": ""
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
Примечание: отличие заключается в том, что метод `http` возвращает дополнительные поля `aggregation_type` по сравнению с методом `http v2`. Интерфейс `http v2` включается с помощью параметра `enable_http_server_v2`. Подробное описание параметров см. в разделе [Настройка параметров FE](../../config/fe-config.md)

## Примеры {#examples}

1. Получение информации о структуре указанной таблицы через интерфейс http.

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": "",
    			"aggregation_type":""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": "",
    			"aggregation_type":"MAX"
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
2. Получение информации о структуре указанной таблицы через интерфейс http v2.

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": ""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": ""
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
