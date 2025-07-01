---
{
    "title": "Show Proc Action",
    "language": "en"
}
---

# Show Proc Action

## Request

`GET /api/show_proc`

## Description

Used to obtain PROC information.
    
## Path parameters

None

## Query parameters

* path

    Specify Proc Path
    
* forward

    Whether to forward to Master FE for execution

## Request body

None

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": [
		proc infos ...
	],
	"count": 0
}
```
    
## Examples

1. View `/statistic` information

    ```
    GET /api/show_proc?path=/statistic
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
    
2. Forward to Master for execution

    ```
    GET /api/show_proc?path=/statistic&forward=true
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```