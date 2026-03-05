---
{
    "title": "Show Proc Action",
    "language": "zh-CN",
    "description": "用于获取 PROC 信息。"
}
---

## Request

`GET /api/show_proc`

## Description

用于获取 PROC 信息。
    
## Path parameters

无

## Query parameters

* path

    指定的 Proc Path
    
* forward

    是否转发给 Master FE 执行

## Request body

无

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

1. 查看 `/statistic` 信息

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
    
2. 转发到 Master 执行

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