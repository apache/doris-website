---
{
    "title": "노드 작업",
    "language": "ko",
    "description": "POST /rest/v2/manager/node/{action}/broker (3.0.7+)"
}
---

## 요청 {#request}

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

## 권한 요구 사항 {#privilege-requirements}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Node management API authorization -->

:::caution 동작 변경 (4.0.8)

버전 4.0.8부터 다음 노드 작업 API를 사용하려면 사용자 이름과 비밀번호를 통한 인증 및 전역 `ADMIN` 권한이 필요합니다:

- `POST /rest/v2/manager/node/{action}/be`
- `POST /rest/v2/manager/node/{action}/fe`
- `POST /rest/v2/manager/node/{action}/broker`

4.0.8 이전에는 이 세 API가 권한을 확인하지 않았으므로 FE HTTP 포트에 접근할 수 있는 모든 호출자가 노드를 추가하거나 삭제할 수 있었습니다. 자동화 작업에서 이 API를 호출한다면 4.0.8로 업그레이드한 후 `ADMIN` 권한이 있는 계정의 인증 정보를 추가하세요(예: `curl -u <user>:<passwd>`).

같은 버전에서 `GET /rest/v2/manager/query/qerror/{id}`에도 인증과 사용자 및 쿼리 ID에 따른 권한 확인이 추가되었습니다.

:::

## fe, be, broker 노드 정보 조회 {#get-fe-be-broker-node-information}

`GET /rest/v2/manager/node/frontends`

`GET /rest/v2/manager/node/backends`

`GET /rest/v2/manager/node/brokers`

### 설명 {#description}

클러스터에서 fe, be, broker 노드 정보를 조회합니다.

### 응답 {#response}

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

## 노드 구성 정보 조회 {#get-node-configuration-information}

`GET /rest/v2/manager/node/configuration_name`

`GET /rest/v2/manager/node/node_list`

`POST /rest/v2/manager/node/configuration_info`

### 설명 {#description-1}

- `configuration_name`은 노드 구성 항목의 이름을 조회하는 데 사용합니다.  
- `node_list`는 노드 목록을 조회하는 데 사용합니다.  
- `configuration_info`는 노드의 상세 구성 정보를 조회하는 데 사용합니다.

### 쿼리 매개변수 {#query-parameters}

`GET /rest/v2/manager/node/configuration_name`   

없음

`GET /rest/v2/manager/node/node_list`  

없음

`POST /rest/v2/manager/node/configuration_info`

* type 

  값은 fe 또는 be이며, fe 구성 정보와 be 구성 정보 중 어느 것을 조회할지 지정합니다.

### 요청 본문 {#request-body}

`GET /rest/v2/manager/node/configuration_name`   

없음

`GET /rest/v2/manager/node/node_list`  

없음

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

### 응답 {#response-1}

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

### 예제 {#examples}

1. fe의 `agent_task_resend_wait_time_ms` 구성 항목 정보 조회:

    `POST /rest/v2/manager/node/configuration_info?type=fe`

    본문:

    ```
    {
        "conf_name":[
            "agent_task_resend_wait_time_ms"
        ]
    }
    ```
    
    응답:

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

## 구성 값 수정 {#modify-configuration-values}

`POST /rest/v2/manager/node/set_config/fe`

`POST /rest/v2/manager/node/set_config/be`

### 설명 {#description-2}

fe 또는 be 노드의 구성 값을 수정합니다

### 요청 본문 {#request-body-1}

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

- `config_name`은 해당 구성 항목입니다;  
- `node`는 수정할 노드 목록을 나타내는 키워드입니다;  
- `value`는 구성 값입니다;  
- `persist`가 true이면 영구적으로 수정하고, false이면 일시적으로 수정합니다. 영구적인 수정은 재시작 후 적용되며, 일시적인 수정은 재시작 후 무효화됩니다.

### 응답 {#response-2}

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

- `failed`는 수정에 실패한 구성 정보를 나타냅니다.
    
### 예제 {#examples-1}

1. fe 127.0.0.1:8030 노드의 `agent_task_resend_wait_time_ms` 및 `alter_table_timeout_second` 구성 값 수정:

    `POST /rest/v2/manager/node/set_config/fe`

    본문:

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
    
    응답:

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

    `agent_task_resend_wait_time_ms` 구성 값은 수정되었으며, `alter_table_timeout_second` 수정은 실패했습니다.
   
## be 노드 작업 {#operate-be-nodes}

`POST /rest/v2/manager/node/{action}/be`

### 설명 {#description-3}

be 노드를 추가/삭제/사용 중지합니다

action：ADD/DROP/DECOMMISSION

### 요청 본문 {#request-body-2}
```
{
    "hostPorts": ["127.0.0.1:9050"],
    "properties": {
        "tag.location": "test"
    }
}
```

- `hostPorts`는 작업할 be 노드 주소 집합이며, 주소 형식은 `ip:heartbeat_port`입니다
- `properties`는 노드를 추가할 때 전달하는 구성으로, 현재는 tag 구성에만 사용됩니다. 전달하지 않으면 기본 tag를 사용합니다

### 응답 {#response-3}

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = Same backend already exists[127.0.0.1:9050]",
    "count": 0
}
```

### 예제 {#examples-2}

1. be 노드 추가

   `POST /rest/v2/manager/node/ADD/be`

   요청

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   응답

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

2. be 노드 삭제

   `POST /rest/v2/manager/node/DROP/be`

   요청

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   응답
   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

3. be 노드 사용 중지

   `POST /rest/v2/manager/node/DECOMMISSION/be`

   요청

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   응답

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

## fe 노드 작업 {#operate-fe-nodes}

`POST /rest/v2/manager/node/{action}/fe`

### 설명 {#description-4}

fe 노드를 추가/삭제합니다

action：ADD/DROP

### 요청 본문 {#request-body-3}
```
{
    "role": "FOLLOWER",
    "hostPort": "127.0.0.1:9030"
}

role FOLLOWER/OBSERVER
hostPort fe node address to operate ip:edit_log_port
```

### 응답 {#response-4}

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = frontend already exists name: 127.0.0.1:9030_1670495889415, role: FOLLOWER, 127.0.0.1:9030",
    "count": 0
}
```

### 예제 {#examples-3}

1. FOLLOWER 노드 추가

    `POST /rest/v2/manager/node/ADD/fe`

    요청
    ```
    {
        "role": "FOLLOWER",
        "hostPort": "127.0.0.1:9030"
    }
    ```
   
    응답

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```

2. FOLLOWER 노드 삭제

   `POST /rest/v2/manager/node/DROP/fe`

   요청

   ```
   {
       "role": "FOLLOWER",
       "hostPort": "127.0.0.1:9030"
   }
   ```

   응답

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

## broker 노드 작업 {#operate-broker-nodes}

`POST /rest/v2/manager/node/{action}/broker`

3.0.7부터 지원됩니다.

### 설명 {#description-5}

broker 노드를 추가/삭제합니다

action：ADD/DROP/DROP_ALL

### 요청 본문 {#request-body-4}

```
{
    "brokerName": "your_broker_name",
    "hostPortList": "broker_ip:broker_port"
}
```

### 응답 {#response-5}

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = xxxx",
    "count": 0
}
```

### 예제 {#examples-4}

1. BROKER 노드 추가

    `POST /rest/v2/manager/node/ADD/broker`

    요청

    ```
    {
        "brokerName": "hdfs_broker",
        "hostPortList": "127.0.0.1:8001"
    }
    ```
   
    응답

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```

2. BROKER 노드 삭제

   `POST /rest/v2/manager/node/DROP/broker`

   요청

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": "127.0.0.1:8001"
   }
   ```

   응답

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

3. BROKER 노드 그룹 삭제

   `POST /rest/v2/manager/node/DROP_ALL/broker`

   요청

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": ""
   }
   ```

   응답

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
