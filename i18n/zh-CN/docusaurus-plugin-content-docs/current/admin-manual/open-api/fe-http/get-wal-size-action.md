---
{
    "title": "Get WAL size",
    "language": "zh-CN",
    "description": "用户可以通过该 HTTP 接口获取指定 BE 的 WAL 文件的数目，若不指定 BE，则默认返回所有 BE 的 WAL 文件的数目。"
}
---

## Request

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## Description

用户可以通过该 HTTP 接口获取指定 BE 的 WAL 文件的数目，若不指定 BE，则默认返回所有 BE 的 WAL 文件的数目。

## Path parameters

无

## Query parameters

* `host_ports`

    BE 的 ip 和 http 端口。

## Request body

无

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

1. 获取所有 BE 的 WAL 文件的数目。

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
    
    在返回的结果中，BE 后跟的数字即为对应 BE 的 WAL 文件数目。

2. 获取指定 BE 的 WAL 文件的数目。

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size?192.168.10.11:9050"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1"],
    "count": 0
    }
    ```
    
    在返回的结果中，BE 后跟的数字即为对应 BE 的 WAL 文件数目。
