---
{
    "title": "Connection Action",
    "language": "en"
}
---

# Connection Action

## Request

`GET /api/connection`

## Description

Given a connection id, return the query id that is currently being executed for this connection or the last execution completed.

The connection id can be viewed through the id column in the MySQL command `show processlist;`.
    
## Path parameters

无

## Query parameters

* `connection_id`

    Specified connection id

## Request body

None

## Response

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"query_id": "b52513ce3f0841ca-9cb4a96a268f2dba"
	},
	"count": 0
}
```
    
## Examples

1. Get the query id of the specified connection id

    ```
    GET /api/connection?connection_id=101
    
    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"query_id": "b52513ce3f0841ca-9cb4a96a268f2dba"
    	},
    	"count": 0
    }
    ```
