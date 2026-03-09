---
{
  "title": "クラスターアクション",
  "language": "ja",
  "description": "クラスターのhttp、mysql接続情報を取得するために使用されます。"
}
---
# Cluster Action

## Request

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

## Cluster接続情報

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

### 説明

clusterのhttp、mysql接続情報を取得するために使用されます。

## Pathパラメータ

なし

## Queryパラメータ

なし

## Requestボディ

なし

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
### 例

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
