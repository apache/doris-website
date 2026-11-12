---
{
    "title": "Health Action",
    "language": "en"
}
---

# Health Action

## Request

`GET /api/health`

## Description

Returns the number of BE nodes currently surviving in the cluster and the number of BE nodes that are down.
    
## Path parameters

None

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
		"online_backend_num": 10,
		"total_backend_num": 10
	},
	"count": 0
}
```