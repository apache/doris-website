---
{
    "title": "Connection Action",
    "language": "zh-CN",
    "description": "给定一个 connection id，返回这个连接当前正在执行的，或最后一次执行完成的 query id。"
}
---

## Request

`GET /api/connection`

## Description

给定一个 connection id，返回这个连接当前正在执行的，或最后一次执行完成的 query id。

connection id 可以通过 MySQL 命令 `show processlist;` 中的 id 列查看。
    
## Path parameters

无

## Query parameters

* `connection_id`

    指定的 connection id

## Request body

无

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

1. 获取指定 connection id 的 query id

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
