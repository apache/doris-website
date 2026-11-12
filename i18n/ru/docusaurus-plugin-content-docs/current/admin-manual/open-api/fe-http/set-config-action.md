---
{
    "title": "Установка параметров конфигурации",
    "language": "ru",
    "description": "Используется для динамического изменения конфигурации FE. Вызов выполняется через команду ADMIN SET FRONTEND CONFIG."
}
---

# Установка параметров конфигурации {#set-config-action}

## Запрос {#request}

`GET /api/_set_config`

## Описание {#description}

Используется для динамического изменения конфигурации FE. Вызов выполняется через команду `ADMIN SET FRONTEND CONFIG`. Однако эта команда изменяет конфигурацию только соответствующего узла FE и не перенаправляет автоматически параметр конфигурации `MasterOnly` на узел Master FE.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `confkey1=confvalue1`

    Укажите имя параметра конфигурации, который нужно изменить, и его новое значение.
    
* `persist`

     Определяет, сохранять ли изменённую конфигурацию. По умолчанию используется false, то есть конфигурация не сохраняется. При значении true изменённый параметр конфигурации записывается в файл `fe_custom.conf` и продолжает действовать после перезапуска FE.

* `reset_persist`
    Определяет, нужно ли очищать ранее сохранённую конфигурацию. Действует только при значении true параметра persist. Для совместимости с предыдущей версией значение reset_persist по умолчанию равно true.  
	Если persist имеет значение true, а reset_persist не задан или имеет значение true, конфигурация в файле `fe_custom.conf` будет очищена перед записью изменённой конфигурации в `fe_custom.conf`.  
	Если persist имеет значение true, а reset_persist имеет значение false, изменённый параметр конфигурации будет добавлен в `fe_custom.conf` без очистки существующей конфигурации.


## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"set": {
			"key": "value"
		},
		"err": [
			{
		       "config_name": "",
		       "config_value": "",
		       "err_info": ""
		    }
		],
		"persist":""
	},
	"count": 0
}
```

Поле `set` содержит успешно установленные параметры конфигурации. Поле `err` содержит параметры конфигурации, которые не удалось установить. Поле `persist` содержит сведения о сохранении конфигурации.

## Примеры {#examples}

1. Задайте значения параметров `storage_min_left_capacity_bytes`, `replica_ack_policy` и `agent_task_resend_wait_time_ms`.

    ```
    GET /api/_set_config?storage_min_left_capacity_bytes=1024&replica_ack_policy=SIMPLE_MAJORITY&agent_task_resend_wait_time_ms=true
    
    Response:
    {
    "msg": "success",
    "code": 0,
    "data": {
        "set": {
            "storage_min_left_capacity_bytes": "1024"
        },
        "err": [
            {
                "config_name": "replica_ack_policy",
                "config_value": "SIMPLE_MAJORITY",
                "err_info": "Not support dynamic modification."
            },
            {
                "config_name": "agent_task_resend_wait_time_ms",
                "config_value": "true",
                "err_info": "Unsupported configuration value type."
            }
        ],
        "persist": ""
    },
    "count": 0
    }

	storage_min_left_capacity_bytes  Successfully;    
	replica_ack_policy  Failed, because the configuration item does not support dynamic modification.  
	agent_task_resend_wait_time_ms  Failed, failed to set the boolean type because the configuration item is of type long.
    ```

2. Задайте значение `max_bytes_per_broker_scanner` и сохраните его.

    ```
    GET /api/_set_config?max_bytes_per_broker_scanner=21474836480&persist=true&reset_persist=false
    
    Response:
    {
    "msg": "success",
    "code": 0,
    "data": {
        "set": {
            "max_bytes_per_broker_scanner": "21474836480"
        },
        "err": [],
        "persist": "ok"
    },
    "count": 0
    }
	```

	В каталоге fe/conf создаётся файл fe_custom.conf:
	```
	#THIS IS AN AUTO GENERATED CONFIG FILE.
    #You can modify this file manually, and the configurations in this file
    #will overwrite the configurations in fe.conf
    #Wed Jul 28 12:43:14 CST 2021
    max_bytes_per_broker_scanner=21474836480
    ```
