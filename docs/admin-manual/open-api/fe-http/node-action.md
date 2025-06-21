---
{
    "title": "Node Operations",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

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

## Get fe, be, broker node information

`GET /rest/v2/manager/node/frontends`

`GET /rest/v2/manager/node/backends`

`GET /rest/v2/manager/node/brokers`

### Description

Used to get fe, be, broker node information from the cluster.

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

## Get node configuration information

`GET /rest/v2/manager/node/configuration_name`

`GET /rest/v2/manager/node/node_list`

`POST /rest/v2/manager/node/configuration_info`

### Description

- `configuration_name` is used to get node configuration item names.  
- `node_list` is used to get node list.  
- `configuration_info` is used to get detailed node configuration information.

### Query Parameters

`GET /rest/v2/manager/node/configuration_name`   

None

`GET /rest/v2/manager/node/node_list`  

None

`POST /rest/v2/manager/node/configuration_info`

* type 

  Value is fe or be, used to specify whether to get fe configuration information or be configuration information.

### Request Body

`GET /rest/v2/manager/node/configuration_name`   

None

`GET /rest/v2/manager/node/node_list`  

None

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

conf_name is used to specify which configuration items to return information for, defaults to all configuration items;

node is used to specify which nodes' configuration information to return, defaults to all fe nodes or be nodes configuration information.
```

### Response

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
            "Config Item",
            "Node",
            "Node Type",
            "Config Value Type",
            "MasterOnly",
            "Config Value",
            "Modifiable"
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
            "Config Item",
            "Node",
            "Node Type",
            "Config Value Type",
            "Config Value",
            "Modifiable"
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
    
### Examples

1. Get fe `agent_task_resend_wait_time_ms` configuration item information:

    `POST /rest/v2/manager/node/configuration_info?type=fe`

    Body:

    ```
    {
        "conf_name":[
            "agent_task_resend_wait_time_ms"
        ]
    }
    ```
    
    Response:

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "column_names": [
                "Config Item",
                "Node",
                "Node Type",
                "Config Value Type",
                "MasterOnly",
                "Config Value",
                "Modifiable"
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

## Modify configuration values

`POST /rest/v2/manager/node/set_config/fe`

`POST /rest/v2/manager/node/set_config/be`

### Description

Used to modify fe or be node configuration values

### Request body

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

- `config_name` is the corresponding configuration item;  
- `node` is a keyword indicating the list of nodes to be modified;  
- `value` is the configuration value;  
- `persist` is true for permanent modification, false for temporary modification. Permanent modification takes effect after restart, temporary modification becomes invalid after restart.

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

- `failed` indicates configuration information that failed to be modified.
    
### Examples

1. Modify fe 127.0.0.1:8030 node's `agent_task_resend_wait_time_ms` and `alter_table_timeout_second` configuration values:

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
    
    Response:

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

    The `agent_task_resend_wait_time_ms` configuration value was modified successfully, `alter_table_timeout_second` modification failed.
   
## Operate be nodes

`POST /rest/v2/manager/node/{action}/be`

### Description

Used to add/drop/decommission be nodes

action：ADD/DROP/DECOMMISSION

### Request body
```
{
    "hostPorts": ["127.0.0.1:9050"],
    "properties": {
        "tag.location": "test"
    }
}
```

- `hostPorts` is a group of be node addresses to be operated `ip:heartbeat_port`
- `properties` is the configuration passed when adding nodes, currently only used for configuring tag, uses default tag if not passed

### Response

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = Same backend already exists[127.0.0.1:9050]",
    "count": 0
}
```

### Examples

1. Add be node

   `POST /rest/v2/manager/node/ADD/be`

   Request

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   Response

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

2. Drop be node

   `POST /rest/v2/manager/node/DROP/be`

   Request

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   Response
   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

3. Decommission be node

   `POST /rest/v2/manager/node/DECOMMISSION/be`

   Request

   ```
   {
       "hostPorts": ["127.0.0.1:9050"]
   }
   ```

   Response

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

## Operate fe nodes

`POST /rest/v2/manager/node/{action}/fe`

### Description

Used to add/drop fe nodes

action：ADD/DROP

### Request body
```
{
    "role": "FOLLOWER",
    "hostPort": "127.0.0.1:9030"
}

role FOLLOWER/OBSERVER
hostPort is the fe node address to be operated ip:edit_log_port
```

### Response

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = frontend already exists name: 127.0.0.1:9030_1670495889415, role: FOLLOWER, 127.0.0.1:9030",
    "count": 0
}
```

### Examples

1. Add FOLLOWER node

    `POST /rest/v2/manager/node/ADD/fe`

    Request
    ```
    {
        "role": "FOLLOWER",
        "hostPort": "127.0.0.1:9030"
    }
    ```
   
    Response

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```

2. Drop FOLLOWER node

   `POST /rest/v2/manager/node/DROP/fe`

   Request

   ```
   {
       "role": "FOLLOWER",
       "hostPort": "127.0.0.1:9030"
   }
   ```

   Response

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

## Operate broker nodes

`POST /rest/v2/manager/node/{action}/broker`

Supported since 3.0.7.

### Description

Used to add/drop broker nodes

action：ADD/DROP/DROP_ALL

### Request body

```
{
    "brokerName": "your_broker_name",
    "hostPortList": "broker_ip:broker_port"
}
```

### Response

```
{
    "msg": "Error",
    "code": 1,
    "data": "errCode = 2, detailMessage = xxxx",
    "count": 0
}
```

### Examples

1. Add BROKER node

    `POST /rest/v2/manager/node/ADD/broker`

    Request

    ```
    {
        "brokerName": "hdfs_broker",
        "hostPortList": "127.0.0.1:8001"
    }
    ```
   
    Response

    ```
    {
        "msg": "success",
        "code": 0,
        "data": null,
        "count": 0
    }
    ```

2. Drop BROKER node

   `POST /rest/v2/manager/node/DROP/broker`

   Request

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": "127.0.0.1:8001"
   }
   ```

   Response

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

3. Drop a group of BROKER nodes

   `POST /rest/v2/manager/node/DROP_ALL/broker`

   Request

   ```
   {
       "brokerName": "hdfs_broker",
       "hostPortList": ""
   }
   ```

   Response

   ```
   {
       "msg": "success",
       "code": 0,
       "data": null,
       "count": 0
   }
   ```

