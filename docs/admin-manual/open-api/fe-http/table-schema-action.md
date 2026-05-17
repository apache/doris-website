---
{
    "title": "Table Schema Action",
    "language": "en",
    "description": "Used to obtain the table structure information of the specified table. This interface is currently used in Spark/Flink Doris Connector."
}
---

# Table Schema Action

## Request

`GET /api/<db>/<table>/_schema`

## Description

Used to obtain the table structure information of the specified table. This interface is currently used in Spark/Flink Doris Connector.  obtains Doris table structure information.
    
## Path parameters

* `<db>`

    Specify database

* `<table>`

    Specify table

## Query parameters

None

## Request body

None

## Response
* The http interface returns as follows:
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": "",
			"aggregation_type":""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": "",
			"aggregation_type":"MAX"
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
* The http v2 interface returns as follows:
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": ""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": ""
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
Note: The difference is that the `http` method returns more `aggregation_type` fields than the `http v2` method. The `http v2` is enabled by setting `enable_http_server_v2`. For detailed parameter descriptions, see [fe parameter settings](../../config/fe-config.md)

## Examples

1. Get the table structure information of the specified table via http interface.

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": "",
    			"aggregation_type":""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": "",
    			"aggregation_type":"MAX"
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
2. Get the table structure information of the specified table via http v2 interface.

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": ""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": ""
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
