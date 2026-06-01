---
{
    "title": "Get WAL size",
    "language": "en",
    "description": "Through this HTTP interface, users can get the number of WAL files of a specified BE. If no BE is specified, the number of WAL files of all BEs is returned by default."
}
---

## Request

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## Description

Through this HTTP interface, users can get the number of WAL files of a specified BE. If no BE is specified, the number of WAL files of all BEs is returned by default.

## Path parameters

None

## Query parameters

* `host_ports`

    The IP and HTTP port of the BE.

## Request body

None

## Response

```
{
"msg": "OK",
"code": 0,
"data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
"count": 0
}
```
    
## Examples

1. Get the number of WAL files of all BEs.

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
    "count": 0
    }
    ```
    
    In the returned result, the number following each BE is the WAL file count of that BE.

2. Get the number of WAL files of a specified BE.

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size?host_ports=192.168.10.11:9050"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1"],
    "count": 0
    }
    ```
    
    In the returned result, the number following each BE is the WAL file count of that BE.
