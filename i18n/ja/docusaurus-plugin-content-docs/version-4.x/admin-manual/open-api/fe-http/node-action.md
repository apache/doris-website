---
{
    "title": "ノード操作",
    "language": "ja",
    "description": "POST /rest/v2/manager/node/{action}/broker (3.0.7+)"
}
---

## リクエスト

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

## 権限要件

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Node management API authorization -->

:::caution 動作変更 (4.0.8)

バージョン 4.0.8 以降、以下のノード操作 API ではユーザー名とパスワードによる認証、およびグローバル `ADMIN` 権限が必要です。

- `POST /rest/v2/manager/node/{action}/be`
- `POST /rest/v2/manager/node/{action}/fe`
- `POST /rest/v2/manager/node/{action}/broker`

4.0.8 より前は、これら三つの API で権限チェックが行われていなかったため、FE の HTTP ポートにアクセスできる呼び出し元は誰でもノードを追加または削除できました。自動化処理でこれらの API を呼び出す場合は、4.0.8 へのアップグレード後に `ADMIN` 権限を持つアカウントの認証情報を追加してください（例：`curl -u <user>:<passwd>`）。

同じバージョンで、`GET /rest/v2/manager/query/qerror/{id}` にも認証と、ユーザーおよびクエリ ID に基づく権限チェックが追加されました。

:::

## FE、BE、Broker ノード情報の取得

`GET /rest/v2/manager/node/frontends`

`GET /rest/v2/manager/node/backends`

`GET /rest/v2/manager/node/brokers`

### 説明

クラスター内の FE、BE、Broker ノード情報を取得します。

### レスポンス

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

- `configuration_name` はノードの設定項目名を取得します。  
- `node_list` はノード一覧を取得します。  
- `configuration_info` はノードの設定に関する詳細情報を取得します。

### クエリパラメータ

`GET /rest/v2/manager/node/configuration_name`   

なし

`GET /rest/v2/manager/node/node_list`  

なし

`POST /rest/v2/manager/node/configuration_info`

* type 

  値は fe または be です。FE または BE の設定情報のどちらを取得するかを指定します。

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

1. FE の `agent_task_resend_wait_time_ms` 設定項目の情報を取得する：

    `POST /rest/v2/manager/node/configuration_info?type=fe`

    ボディ：

    ```
    {
        "conf_name":[
            "agent_task_resend_wait_time_ms"
        ]
    }
    ```
    
    レスポンス：

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

FE または BE ノードの設定値を変更します。

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

- `config_name` は対象の設定項目です。  
- `node` は変更対象のノード一覧を示すキーです。  
- `value` は設定値です。  
- `persist` が true の場合は永続的な変更、false の場合は一時的な変更です。永続的な変更は再起動後に有効になり、一時的な変更は再起動後に無効になります。

### レスポンス

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

1. FE ノード 127.0.0.1:8030 の `agent_task_resend_wait_time_ms` と `alter_table_timeout_second` の設定値を変更する：

    `POST /rest/v2/manager/node/set_config/fe`

    ボディ：

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
    
    レスポンス：

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

    `agent_task_resend_wait_time_ms` の設定値は正常に変更され、`alter_table_timeout_second` の変更は失敗しました。
   
## BE ノードの操作

`POST /rest/v2/manager/node/{action}/be`

### 説明

BE ノードを追加、削除、または廃止します。

action に指定できる値：ADD/DROP/DECOMMISSION

### リクエストボディ
```
{
    "hostPorts": ["127.0.0.1:9050"],
    "properties": {
        "tag.location": "test"
    }
}
```

- `hostPorts` は操作対象となる BE ノードのアドレス（`ip:heartbeat_port`）の一覧です。
- `properties` はノード追加時に渡す設定です。現在はタグの設定にのみ使用され、省略するとデフォルトのタグが使用されます。

### レスポンス

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = Same backend already exists[127.0.0.1:9050]",
    "count": 0
}
```

### 例

1. BE ノードを追加する

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

2. BE ノードを削除する

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

3. BE ノードを廃止する

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

## FE ノードの操作

`POST /rest/v2/manager/node/{action}/fe`

### 説明

FE ノードを追加または削除します。

action に指定できる値：ADD/DROP

### リクエストボディ
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

1. FOLLOWER ノードを追加する

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

2. FOLLOWER ノードを削除する

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

## Broker ノードの操作

`POST /rest/v2/manager/node/{action}/broker`

3.0.7 以降でサポートされます。

### 説明

Broker ノードを追加または削除します。

action に指定できる値：ADD/DROP/DROP_ALL

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

1. Broker ノードを追加する

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

2. Broker ノードを削除する

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

3. Broker ノードのグループを削除する

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
