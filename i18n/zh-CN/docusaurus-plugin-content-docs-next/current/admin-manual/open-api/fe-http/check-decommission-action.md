---
{
    "title": "Check Decommission Action",
    "language": "zh-CN",
    "description": "用于判断指定的 BE 是否能够被下线。比如判断节点下线后，剩余的节点是否能够满足空间要求和副本数要求等。"
}
---

## Request

`GET /api/check_decommission`

## Description

用于判断指定的 BE 是否能够被下线。比如判断节点下线后，剩余的节点是否能够满足空间要求和副本数要求等。
    
## Path parameters

无

## Query parameters

* `host_ports`

    指定一个多个 BE，由逗号分隔。如：`ip1:port1,ip2:port2,...`。

    其中 port 为 BE 的 heartbeat port。

## Request body

无

## Response

返回可以被下线的节点列表

```
{
	"msg": "OK",
	"code": 0,
	"data": ["192.168.10.11:9050", "192.168.10.11:9050"],
	"count": 0
}
```
    
## Examples

1. 查看指定 BE 节点是否可以下线

    ```
    GET /api/check_decommission?host_ports=192.168.10.11:9050,192.168.10.11:9050
    
    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": ["192.168.10.11:9050"],
    	"count": 0
    }
    ```




