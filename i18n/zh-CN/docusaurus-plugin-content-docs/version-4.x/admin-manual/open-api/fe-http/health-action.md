---
{
    "title": "Health Action",
    "language": "zh-CN",
    "description": "返回集群当前存活的 BE 节点数和宕机的 BE 节点数。"
}
---

## Request

`GET /api/health`

## Description

返回集群当前存活的 BE 节点数和宕机的 BE 节点数。
    
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
		"online_backend_num": 10,
		"total_backend_num": 10
	},
	"count": 0
}
```
