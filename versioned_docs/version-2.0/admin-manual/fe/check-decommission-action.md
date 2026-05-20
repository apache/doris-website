---
{
    "title": "Check Decommission Action",
    "language": "en"
}
---

# Check Decommission Action

## Request

`GET /api/check_decommission`

## Description

Used to determine whether the specified BE can be decommissioned. For example, after the node being decommissioned, whether the remaining nodes can meet the space requirements and the number of replicas.
    
## Path parameters

None

## Query parameters

* `host_ports`

    Specify one or more BEs, separated by commas. Such as: `ip1:port1,ip2:port2,...`.

    Where port is the heartbeat port of BE.

## Request body

None

## Response

Return a list of nodes that can be decommissioned

```
{
	"msg": "OK",
	"code": 0,
	"data": ["192.168.10.11:9050", "192.168.10.11:9050"],
	"count": 0
}
```
    
## Examples

1. Check whether the specified BE node can be decommissioned

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




