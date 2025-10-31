---
{
    "title": "Bootstrap Action",
    "language": "zh-CN"
}
---

## Request

`GET /api/bootstrap`

## Description

用于判断 FE 是否启动完成。当不提供任何参数时，仅返回是否启动成功。如果提供了 `token` 和 `cluster_id`，则返回更多详细信息。
    
## Path parameters

无

## Query parameters

* `cluster_id`

    集群 id。可以在 `doris-meta/image/VERSION` 文件中查看。
    
* `token`

    集群 token。可以在 `doris-meta/image/VERSION` 文件中查看。

## Request body

无

## Response

* 不提供参数

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    
    code 为 0 表示 FE 节点启动成功。非 0 的错误码表示其他错误。
    
* 提供 `token` 和 `cluster_id`

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
    
    * `queryPort` 是 FE 节点的 MySQL 协议端口。
    * `rpcPort` 是 FE 节点的 thrift RPC 端口。
    * `maxReplayedJournal` 表示 FE 节点当前回放的最大元数据日志 id。
    * `arrowFlightSqlPort` 是 FE 节点的 Arrow Flight SQL 协议端口。
    
## Examples

1. 不提供参数

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
    
2. 提供 `token` 和 `cluster_id`

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




