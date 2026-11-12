---
{
    "title": "Действие Bootstrap",
    "language": "ru",
    "description": "Позволяет определить, запущен ли FE. Если параметры не указаны, возвращается только результат проверки успешного запуска."
}
---

# Действие Bootstrap {#bootstrap-action}

## Запрос {#request}

`GET /api/bootstrap`

## Описание {#description}

Позволяет определить, запущен ли FE. Если параметры не указаны, возвращается только результат проверки успешного запуска. Если указаны `token` и `cluster_id`, возвращается более подробная информация.

## Параметры пути {#path-parameters}

Отсутствуют

## Параметры запроса {#query-parameters}

* `cluster_id`

    Идентификатор кластера. Его можно посмотреть в файле `doris-meta/image/VERSION`.
    
* `token`

    Токен кластера. Его можно посмотреть в файле `doris-meta/image/VERSION`.

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

* Параметры не указаны

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    
    Код 0 означает, что узел FE успешно запущен. Коды, отличные от 0, указывают на другие ошибки.
    
* Указаны `token` и `cluster_id`

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
            "arrowFlightSqlPort": 9040,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```
    
    * `queryPort` — порт протокола MySQL узла FE.
    * `rpcPort` — порт thrift RPC узла FE.
    * `maxReplayedJournal` — максимальный идентификатор записи журнала метаданных, воспроизведённой узлом FE на данный момент.
    * `arrowFlightSqlPort` — порт Arrow Flight SQL узла FE.
    
## Примеры {#examples}

1. Без параметров

    ```
    GET /api/bootstrap

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    
2. С параметрами `token` и `cluster_id`

    ```
    GET /api/bootstrap?cluster_id=935437471&token=ad87f6dd-c93f-4880-bcdb-8ca8c9ab3031

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
            "arrowFlightSqlPort": 9040,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```
