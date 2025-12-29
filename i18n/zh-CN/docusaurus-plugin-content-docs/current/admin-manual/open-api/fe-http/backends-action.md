---
{
    "title": "Backends Action",
    "language": "zh-CN",
    "description": "Backends Action 返回 Backends 列表，包括 Backend 的 IP、PORT 等信息。"
}
---

## Request

```
GET /api/backends
```

## Description

Backends Action 返回 Backends 列表，包括 Backend 的 IP、PORT 等信息。
    
## Path parameters

无

## Query parameters

* `is_alive`

    可选参数。是否返回存活的 BE 节点。默认为 false，即返回所有 BE 节点。

## Request body

无

## Response
    
```
{
    "msg": "success", 
    "code": 0, 
    "data": {
        "backends": [
            {
                "ip": "192.1.1.1",
                "http_port": 8040, 
                "is_alive": true
            }
        ]
    }, 
    "count": 0
}
```
