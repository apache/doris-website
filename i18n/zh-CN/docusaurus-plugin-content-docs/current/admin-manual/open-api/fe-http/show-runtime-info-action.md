---
{
    "title": "Show Runtime Info Action",
    "language": "zh-CN",
    "description": "用于获取 FE JVM 的 Runtime 信息"
}
---

## Request

`GET /api/show_runtime_info`

## Description

用于获取 FE JVM 的 Runtime 信息
    
## Path parameters

无

## Query parameters

无

## Request body

无

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"free_mem": "855642056",
		"total_mem": "1037959168",
		"thread_cnt": "98",
		"max_mem": "1037959168"
	},
	"count": 0
}
```
    
## Examples

1. 获取当前 FE 节点的 JVM 信息

    ```
    GET /api/show_runtime_info
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"free_mem": "855642056",
    		"total_mem": "1037959168",
    		"thread_cnt": "98",
    		"max_mem": "1037959168"
    	},
    	"count": 0
    }
    ```
