---
{
    "title": "Операция отображения метаданных",
    "language": "ru",
    "description": "Используется для отображения сведений о метаданных"
}
---

# Операция отображения метаданных {#show-meta-info-action}

## Запрос {#request}

`GET /api/show_meta_info`

## Описание {#description}

Используется для отображения сведений о метаданных

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* action

    Укажите тип метаданных, которые необходимо получить. В настоящее время поддерживаются следующие варианты:
    
    * `SHOW_DB_SIZE`

        Получить размер данных указанной базы данных в байтах.
        
    * `SHOW_HA`

        Получить состояние воспроизведения журналов метаданных FE и состояние групп узлов с правом участия в выборах.

## Тело запроса {#request-body}

Нет

## Ответ {#response}


* `SHOW_DB_SIZE`

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:information_schema": 0,
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
    
* `SHOW_HA`

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"can_read": "true",
    		"role": "MASTER",
    		"is_ready": "true",
    		"last_checkpoint_version": "1492",
    		"last_checkpoint_time": "1596465109000",
    		"current_journal_id": "1595",
    		"electable_nodes": "",
    		"observer_nodes": "",
    		"master": "10.81.85.89"
    	},
    	"count": 0
    }
    ```
    
## Примеры {#examples}

1. Просмотр размера данных каждой базы данных в кластере

    ```
    GET /api/show_meta_info?action=show_db_size
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:information_schema": 0,
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
    
2. Просмотр состояния группы узлов FE, участвующих в выборах

    ```
    GET /api/show_meta_info?action=show_ha
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"can_read": "true",
    		"role": "MASTER",
    		"is_ready": "true",
    		"last_checkpoint_version": "1492",
    		"last_checkpoint_time": "1596465109000",
    		"current_journal_id": "1595",
    		"electable_nodes": "",
    		"observer_nodes": "",
    		"master": "10.81.85.89"
    	},
    	"count": 0
    }
    ```
