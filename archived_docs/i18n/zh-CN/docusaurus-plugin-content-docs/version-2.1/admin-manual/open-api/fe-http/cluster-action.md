---
{
    "title": "Cluster Action",
    "language": "zh-CN",
    "description": "用于获取集群 http、mysql 连接信息。"
}
---

## Request

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

## 集群连接信息

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

### Description

用于获取集群 http、mysql 连接信息。

## Path parameters

无

## Query parameters

无

## Request body

无

### Response

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "http": [
            "fe_host:http_ip"
        ],
        "mysql": [
            "fe_host:query_ip"
        ]
    },
    "count": 0
}
```
    
### Examples
```
GET /rest/v2/manager/cluster/cluster_info/conn_info

Response:
{
    "msg": "success",
    "code": 0,
    "data": {
        "http": [
            "127.0.0.1:8030"
        ],
        "mysql": [
            "127.0.0.1:9030"
        ]
    },
    "count": 0
}
```
