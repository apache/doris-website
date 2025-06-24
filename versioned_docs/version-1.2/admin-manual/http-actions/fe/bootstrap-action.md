---
{
    "title": "Bootstrap Action",
    "language": "en"
}
---

# Bootstrap Action

## Request

`GET /api/bootstrap`

## Description

It is used to judge whether the FE has started. When no parameters are provided, only whether the startup is successful is returned. If `token` and `cluster_id` are provided, more detailed information is returned.
    
## Path parameters

none

## Query parameters

* `cluster_id`

    The cluster id. It can be viewed in the file `doris-meta/image/VERSION`.
    
* `token`

    Cluster token. It can be viewed in the file `doris-meta/image/VERSION`.

## Request body

none

## Response

* No parameters provided

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    
    A code of 0 means that the FE node has started successfully. Error codes other than 0 indicate other errors.
    
* Provide `token` and `cluster_id`

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```
    
    * `queryPort` is the MySQL protocol port of the FE node.
    * `rpcPort` is the thrift RPC port of the FE node.
    * `maxReplayedJournal` represents the maximum metadata journal id currently played back by the FE node.
    
## Examples

1. No parameters

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
    
2. Provide `token` and `cluster_id`

    ```
    GET /api/bootstrap?cluster_id=935437471&token=ad87f6dd-c93f-4880-bcdb-8ca8c9ab3031

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```