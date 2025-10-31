---
{
    "title": "Cluster Action",
    "language": "en"
}
---

# Cluster Action

## Request

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

## Cluster Connection Information

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

### Description

Used to get cluster http, mysql connection information.

## Path parameters

None

## Query parameters

None

## Request body

None

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
