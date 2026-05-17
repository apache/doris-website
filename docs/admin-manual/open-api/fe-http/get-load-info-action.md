---
{
    "title": "Get Load Info Action",
    "language": "en",
    "description": "Used to obtain the information of the load job of the specified label."
}
---

# Get Load Info Action

## Request

`GET /api/<db>/_load_info`

## Description

Used to obtain the information of the load job of the specified label.
    
## Path parameters

* `<db>`

    Specify database

## Query parameters

* `label`

    Specify load label

## Request body

None

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"dbName": "default_cluster:db1",
		"tblNames": ["tbl1"],
		"label": "my_label",
		"clusterName": "default_cluster",
		"state": "FINISHED",
		"failMsg": "",
		"trackingUrl": ""
	},
	"count": 0
}
```
    
## Examples

1. Get the load job information of the specified label

    ```
    GET /api/example_db/_load_info?label=my_label
    
    Response
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"dbName": "default_cluster:db1",
    		"tblNames": ["tbl1"],
    		"label": "my_label",
    		"clusterName": "default_cluster",
    		"state": "FINISHED",
    		"failMsg": "",
    		"trackingUrl": ""
    	},
    	"count": 0
    }
    ```
