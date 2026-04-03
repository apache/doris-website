---
{
  "title": "ノード操作",
  "language": "ja",
  "description": "POST /rest/v2/manager/node/{action}/broker (3.0.7+)"
}
---
## Request

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

## fe、be、brokerノード情報の取得

`GET /rest/v2/manager/node/frontends`

`GET /rest/v2/manager/node/backends`

`GET /rest/v2/manager/node/brokers`

### 説明

クラスターからfe、be、brokerノード情報を取得するために使用されます。

### Response

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
## ノード設定情報の取得

`GET /rest/v2/manager/node/configuration_name`

`GET /rest/v2/manager/node/node_list`

`POST /rest/v2/manager/node/configuration_info`

### 説明

- `configuration_name`はノード設定項目名を取得するために使用されます。
- `node_list`はノードリストを取得するために使用されます。
- `configuration_info`は詳細なノード設定情報を取得するために使用されます。

### クエリパラメータ

`GET /rest/v2/manager/node/configuration_name`   

なし

`GET /rest/v2/manager/node/node_list`  

なし

`POST /rest/v2/manager/node/configuration_info`

* type 

  値はfeまたはbeで、fe設定情報またはbe設定情報の取得を指定するために使用されます。

### リクエストボディ

`GET /rest/v2/manager/node/configuration_name`   

なし

`GET /rest/v2/manager/node/node_list`  

なし

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
### レスポンス

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
### 例

1. fe `agent_task_resend_wait_time_ms` 設定項目情報を取得する：

    `POST /rest/v2/manager/node/configuration_info?type=fe`

    Body:

    ```
    {
        "conf_name":[
            "agent_task_resend_wait_time_ms"
        ]
    }
    ```
応答:

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
## 設定値の変更

`POST /rest/v2/manager/node/set_config/fe`

`POST /rest/v2/manager/node/set_config/be`

### 説明

feまたはbeノードの設定値を変更するために使用されます

### リクエストボディ

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
- `config_name`は対応する設定項目です
- `node`はキーワードで、変更対象のノードのリストを示します
- `value`は設定値です
- `persist`は永続的な変更の場合はtrue、一時的な変更の場合はfalseです。永続的な変更は再起動後に有効になり、一時的な変更は再起動後に無効になります。

### Response

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
- `failed` は変更に失敗した設定情報を示します。
    
### 例

1. fe 127.0.0.1:8030 ノードの `agent_task_resend_wait_time_ms` と `alter_table_timeout_second` の設定値を変更する：

    `POST /rest/v2/manager/node/set_config/fe`

    Body:

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
レスポンス:

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
`agent_task_resend_wait_time_ms` 設定値の変更が正常に完了しましたが、`alter_table_timeout_second` の変更は失敗しました。
   
## be Nodes の操作

`POST /rest/v2/manager/node/{action}/be`

### 説明

be ノードの追加/削除/無効化に使用されます

action：ADD/DROP/DECOMMISSION

### リクエストボディ

```
{
    "hostPorts": ["127.0.0.1:9050"],
    "properties": {
        "tag.location": "test"
    }
}
```
- `hostPorts` 動作させるBEノードアドレスのグループ `ip:heartbeat_port`
- `properties` ノード追加時に渡される設定、現在はタグの設定にのみ使用され、渡されない場合はデフォルトタグを使用

### Response

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = Same backend already exists[127.0.0.1:9050]",
    "count": 0
}
```
### 例

1. beノードを追加

   `POST /rest/v2/manager/node/ADD/be`

   リクエスト

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```
レスポンス

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
2. beノードをドロップ

   `POST /rest/v2/manager/node/DROP/be`

   リクエスト

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```
レスポンス

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
3. beノードのデコミッション

   `POST /rest/v2/manager/node/DECOMMISSION/be`

   リクエスト

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```
レスポンス

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
## fe ノードの操作

`POST /rest/v2/manager/node/{action}/fe`

### 説明

fe ノードの追加/削除に使用されます

action：ADD/DROP

### Request body

```
{
    "role": "FOLLOWER",
    "hostPort": "127.0.0.1:9030"
}

role FOLLOWER/OBSERVER
hostPort fe node address to operate ip:edit_log_port
```
### レスポンス

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = frontend already exists name: 127.0.0.1:9030_1670495889415, role: FOLLOWER, 127.0.0.1:9030",
    "count": 0
}
```
### 例

1. FOLLOWERノードを追加

    `POST /rest/v2/manager/node/ADD/fe`

    リクエスト

    ```
    {
        "role": "FOLLOWER",
        "hostPort": "127.0.0.1:9030"
    }
    ```
レスポンス

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```
2. FOLLOWER ノードをドロップ

   `POST /rest/v2/manager/node/DROP/fe`

   リクエスト

   ```
   {
       "role": "FOLLOWER",
       "hostPort": "127.0.0.1:9030"
   }
   ```
レスポンス

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
## broker ノードの操作

`POST /rest/v2/manager/node/{action}/broker`

3.0.7以降でサポートされています。

### 説明

broker ノードの追加/削除に使用されます

action：ADD/DROP/DROP_ALL

### リクエストボディ

```
{
    "brokerName": "your_broker_name",
    "hostPortList": "broker_ip:broker_port"
}
```
### レスポンス

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = xxxx",
    "count": 0
}
```
### 例

1. BROKERノードを追加

    `POST /rest/v2/manager/node/ADD/broker`

    リクエスト

    ```
    {
        "brokerName": "hdfs_broker",
        "hostPortList": "127.0.0.1:8001"
    }
    ```
レスポンス

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```
2. BROKER ノードの削除

   `POST /rest/v2/manager/node/DROP/broker`

   リクエスト

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": "127.0.0.1:8001"
   }
   ```
レスポンス

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
3. BROKERノードのグループを削除

   `POST /rest/v2/manager/node/DROP_ALL/broker`

   リクエスト

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": ""
   }
   ```
レスポンス

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```
