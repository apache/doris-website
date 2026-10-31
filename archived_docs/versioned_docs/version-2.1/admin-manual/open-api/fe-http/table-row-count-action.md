---
{
    "title": "Table Row Count Action",
    "language": "en",
    "description": "Used to obtain statistics about the number of rows in a specified table. This interface is currently used in Spark-Doris-Connector."
}
---

# Table Row Count Action

## Request

`GET /api/<db>/<table>/_count`

## Description

Used to obtain statistics about the number of rows in a specified table. This interface is currently used in Spark-Doris-Connector. Spark obtains Doris table statistics.
    
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

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"size": 1,
		"status": 200
	},
	"count": 0
}
```

The `data.size` field indicates the number of rows in the specified table.
    
## Examples

1. Get the number of rows in the specified table.

    ```
    GET /api/db1/tbl1/_count
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"size": 1,
    		"status": 200
    	},
    	"count": 0
    }
    ```
