---
{
    "title": "Операции с узлами",
    "language": "ru",
    "description": "POST /rest/v2/manager/node/{action}/broker (3.0.7+)"
}
---

## Запрос {#request}

`GET /rest/v2/manager/node/frontends`

`GET /rest/v2/manager/node/backends`

`GET /rest/v2/manager/node/brokers`

`GET /rest/v2/manager/node/configuration_name`

`GET /rest/v2/manager/node/node_list`

`POST /rest/v2/manager/node/configuration_info`

`POST /rest/v2/manager/node/set_config/fe`

`POST /rest/v2/manager/node/set_config/be`

`POST /rest/v2/manager/node/{action}/be`

`POST /rest/v2/manager/node/{action}/fe`

`POST /rest/v2/manager/node/{action}/broker` (3.0.7+)

## Требуемые привилегии {#privilege-requirements}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Node management API authorization -->

:::caution Изменение поведения (4.0.8)

Начиная с версии 4.0.8, следующие API для операций с узлами требуют аутентификации по имени пользователя и паролю, а также глобальной привилегии `ADMIN`:

- `POST /rest/v2/manager/node/{action}/be`
- `POST /rest/v2/manager/node/{action}/fe`
- `POST /rest/v2/manager/node/{action}/broker`

До версии 4.0.8 эти три API не проверяли права доступа, поэтому любой клиент, имевший доступ к HTTP-порту FE, мог добавлять или удалять узлы. Если эти API вызываются автоматически, после обновления до 4.0.8 добавьте учётные данные пользователя с привилегией `ADMIN` (например, `curl -u <user>:<passwd>`).

В той же версии для `GET /rest/v2/manager/query/qerror/{id}` также добавлены аутентификация и проверка прав доступа по пользователю и идентификатору запроса.

:::

## Получение информации об узлах fe, be и broker {#get-fe-be-broker-node-information}

`GET /rest/v2/manager/node/frontends`

`GET /rest/v2/manager/node/backends`

`GET /rest/v2/manager/node/brokers`

### Описание {#description}

Позволяет получить информацию об узлах fe, be и broker в кластере.

### Ответ {#response}

```
frontends:
{
    "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "Name",
            "IP",
            "HostName",
            "EditLogPort",
            "HttpPort",
            "QueryPort",
            "RpcPort",
            "ArrowFlightSqlPort",
            "Role",
            "IsMaster",
            "ClusterId",
            "Join",
            "Alive",
            "ReplayedJournalId",
            "LastHeartbeat",
            "IsHelper",
            "ErrMsg",
            "Version"
        ],
        "rows": [
            [
                ...
            ]
        ]
    },
    "count": 0
}
```

```
backends:
{
    "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "BackendId",
            "Cluster",
            "IP",
            "HostName",
            "HeartbeatPort",
            "BePort",
            "HttpPort",
            "BrpcPort",
            "LastStartTime",
            "LastHeartbeat",
            "Alive",
            "SystemDecommissioned",
            "ClusterDecommissioned",
            "TabletNum",
            "DataUsedCapacity",
            "AvailCapacity",
            "TotalCapacity",
            "UsedPct",
            "MaxDiskUsedPct",
            "ErrMsg",
            "Version",
            "Status"
        ],
        "rows": [
            [
                ...
            ]
        ]
    },
    "count": 0
}
```

```
brokers:
{
    "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "Name",
            "IP",
            "HostName",
            "Port",
            "Alive",
            "LastStartTime",
            "LastUpdateTime",
            "ErrMsg"
        ],
        "rows": [
            [
                ...
            ]
        ]
    },
    "count": 0
}
```

## Получение информации о конфигурации узлов {#get-node-configuration-information}

`GET /rest/v2/manager/node/configuration_name`

`GET /rest/v2/manager/node/node_list`

`POST /rest/v2/manager/node/configuration_info`

### Описание {#description-1}

- `configuration_name` позволяет получить имена параметров конфигурации узлов.  
- `node_list` позволяет получить список узлов.  
- `configuration_info` позволяет получить подробную информацию о конфигурации узлов.

### Параметры запроса {#query-parameters}

`GET /rest/v2/manager/node/configuration_name`   

Нет

`GET /rest/v2/manager/node/node_list`  

Нет

`POST /rest/v2/manager/node/configuration_info`

* type 

  Значение fe или be задаёт тип узлов, информацию о конфигурации которых нужно получить.

### Тело запроса {#request-body}

`GET /rest/v2/manager/node/configuration_name`   

Нет

`GET /rest/v2/manager/node/node_list`  

Нет

`POST /rest/v2/manager/node/configuration_info`

```
{
	"conf_name": [
		""
	],
	"node": [
		""
	]
}

If no body is provided, all parameters in the body use default values.  

conf_name is used to specify which configuration items' information to return, defaults to returning all configuration items' information;

node is used to specify which nodes' configuration item information to return, defaults to all fe nodes or be nodes configuration item information.
```

### Ответ {#response-1}

`GET /rest/v2/manager/node/configuration_name`  

``` 
{
    "msg": "success",
    "code": 0,
    "data": {
        "backend":[
            ""
        ],
        "frontend":[
            ""
        ]
    },
    "count": 0
}
```

`GET /rest/v2/manager/node/node_list` 

``` 
{
    "msg": "success",
    "code": 0,
    "data": {
        "backend": [
            ""
        ],
        "frontend": [
            ""
        ]
    },
    "count": 0
}
```

`POST /rest/v2/manager/node/configuration_info?type=fe`

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "配置项",
            "节点",
            "节点类型",
            "配置值类型",
            "MasterOnly",
            "配置值",
            "可修改"
        ],
        "rows": [
            [
                ""
            ]
        ]
    },
    "count": 0
}
```

`POST /rest/v2/manager/node/configuration_info?type=be`
```
{
    "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "配置项",
            "节点",
            "节点类型",
            "配置值类型",
            "配置值",
            "可修改"
        ],
        "rows": [
            [
                ""
            ]
        ]
    },
    "count": 0
}
```

### Примеры {#examples}

1. Получение информации о параметре конфигурации fe `agent_task_resend_wait_time_ms`:

    `POST /rest/v2/manager/node/configuration_info?type=fe`

    Тело запроса:

    ```
    {
        "conf_name":[
            "agent_task_resend_wait_time_ms"
        ]
    }
    ```
    
    Ответ:

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "column_names": [
                "配置项",
                "节点",
                "节点类型",
                "配置值类型",
                "MasterOnly",
                "配置值",
                "可修改"
            ],
            "rows": [
                [
                    "agent_task_resend_wait_time_ms",
                    "127.0.0.1:8030",
                    "FE",
                    "long",
                    "true",
                    "50000",
                    "true"
                ]
            ]
        },
        "count": 0
    }
    ```

## Изменение значений параметров конфигурации {#modify-configuration-values}

`POST /rest/v2/manager/node/set_config/fe`

`POST /rest/v2/manager/node/set_config/be`

### Описание {#description-2}

Позволяет изменять значения параметров конфигурации узлов fe или be

### Тело запроса {#request-body-1}

```
{
	"config_name":{
		"node":[
			""
		],
		"value":"",
		"persist":
	}
}
```

- `config_name` соответствует параметру конфигурации;  
- `node` является ключевым словом, указывающим список узлов, для которых нужно изменить конфигурацию;  
- `value` задаёт значение параметра конфигурации;  
- `persist` имеет значение true для постоянного изменения и false для временного. Постоянное изменение вступает в силу после перезапуска, временное изменение сбрасывается после перезапуска.

### Ответ {#response-2}

`GET /rest/v2/manager/node/configuration_name`  

``` 
{
	"msg": "",
	"code": 0,
	"data": {
		"failed":[
			{
				"config_name":"name",
				"value"="",
				"node":"",
				"err_info":""
			}
		]
	},
	"count": 0
}

```

- `failed` содержит информацию о параметрах конфигурации, которые не удалось изменить.
    
### Примеры {#examples-1}

1. Изменение значений параметров конфигурации `agent_task_resend_wait_time_ms` и `alter_table_timeout_second` на узле fe 127.0.0.1:8030:

    `POST /rest/v2/manager/node/set_config/fe`

    Тело запроса:

    ```
    {
        "agent_task_resend_wait_time_ms":{
            "node":[
		    	"127.0.0.1:8030"
		    ],
		    "value":"10000",
		    "persist":"true"
        },
        "alter_table_timeout_second":{
            "node":[
		    	"127.0.0.1:8030"
		    ],
		    "value":"true",
		    "persist":"true"
        }
    }
    ```
    
    Ответ:

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "failed": [
                {
                    "config_name": "alter_table_timeout_second",
                    "node": "10.81.85.89:8837",
                    "err_info": "Unsupported configuration value type.",
                    "value": "true"
                }
            ]
        },
        "count": 0
    }

    ```

    Значение параметра конфигурации `agent_task_resend_wait_time_ms` успешно изменено; изменить `alter_table_timeout_second` не удалось.
   
## Управление узлами be {#operate-be-nodes}

`POST /rest/v2/manager/node/{action}/be`

### Описание {#description-3}

Позволяет добавлять, удалять и выводить из эксплуатации узлы be

action：ADD/DROP/DECOMMISSION

### Тело запроса {#request-body-2}
```
{
    "hostPorts": ["127.0.0.1:9050"],
    "properties": {
        "tag.location": "test"
    }
}
```

- `hostPorts` содержит список адресов узлов be, над которыми выполняется операция, в формате `ip:heartbeat_port`
- `properties` задаёт параметры, передаваемые при добавлении узлов; в настоящее время используется только для настройки tag. Если параметры не переданы, используется tag по умолчанию

### Ответ {#response-3}

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = Same backend already exists[127.0.0.1:9050]",
    "count": 0
}
```

### Примеры {#examples-2}

1. Добавление узла be

   `POST /rest/v2/manager/node/ADD/be`

   Запрос

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   Ответ

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

2. Удаление узла be

   `POST /rest/v2/manager/node/DROP/be`

   Запрос

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   Ответ
   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

3. Вывод узла be из эксплуатации

   `POST /rest/v2/manager/node/DECOMMISSION/be`

   Запрос

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   Ответ

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

## Управление узлами fe {#operate-fe-nodes}

`POST /rest/v2/manager/node/{action}/fe`

### Описание {#description-4}

Позволяет добавлять и удалять узлы fe

action：ADD/DROP

### Тело запроса {#request-body-3}
```
{
    "role": "FOLLOWER",
    "hostPort": "127.0.0.1:9030"
}

role FOLLOWER/OBSERVER
hostPort fe node address to operate ip:edit_log_port
```

### Ответ {#response-4}

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = frontend already exists name: 127.0.0.1:9030_1670495889415, role: FOLLOWER, 127.0.0.1:9030",
    "count": 0
}
```

### Примеры {#examples-3}

1. Добавление узла FOLLOWER

    `POST /rest/v2/manager/node/ADD/fe`

    Запрос
    ```
    {
        "role": "FOLLOWER",
        "hostPort": "127.0.0.1:9030"
    }
    ```
   
    Ответ

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```

2. Удаление узла FOLLOWER

   `POST /rest/v2/manager/node/DROP/fe`

   Запрос

   ```
   {
       "role": "FOLLOWER",
       "hostPort": "127.0.0.1:9030"
   }
   ```

   Ответ

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

## Управление узлами broker {#operate-broker-nodes}

`POST /rest/v2/manager/node/{action}/broker`

Поддерживается начиная с версии 3.0.7.

### Описание {#description-5}

Позволяет добавлять и удалять узлы broker

action：ADD/DROP/DROP_ALL

### Тело запроса {#request-body-4}

```
{
    "brokerName": "your_broker_name",
    "hostPortList": "broker_ip:broker_port"
}
```

### Ответ {#response-5}

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = xxxx",
    "count": 0
}
```

### Примеры {#examples-4}

1. Добавление узла BROKER

    `POST /rest/v2/manager/node/ADD/broker`

    Запрос

    ```
    {
        "brokerName": "hdfs_broker",
        "hostPortList": "127.0.0.1:8001"
    }
    ```
   
    Ответ

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```

2. Удаление узла BROKER

   `POST /rest/v2/manager/node/DROP/broker`

   Запрос

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": "127.0.0.1:8001"
   }
   ```

   Ответ

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

3. Удаление группы узлов BROKER

   `POST /rest/v2/manager/node/DROP_ALL/broker`

   Запрос

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": ""
   }
   ```

   Ответ

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
