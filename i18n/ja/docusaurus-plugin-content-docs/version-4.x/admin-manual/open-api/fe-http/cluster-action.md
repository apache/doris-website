---
{
    "title": "クラスターアクション",
    "language": "ja",
    "description": "クラスターの HTTP 接続情報と MySQL 接続情報を取得します。"
}
---

# クラスターアクション

## リクエスト

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

## クラスター接続情報

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

### 説明

クラスターの HTTP 接続情報と MySQL 接続情報を取得します。

## パスパラメータ

なし

## クエリパラメータ

なし

## リクエストボディ

なし

### レスポンス

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
    
### 使用例
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
