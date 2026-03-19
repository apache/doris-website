---
{
  "title": "接続アクション",
  "language": "ja",
  "description": "接続IDが与えられた場合、この接続で現在実行中のクエリIDまたは最後に完了した実行のクエリIDを返します。"
}
---
# Connection Action

## Request

`GET /api/connection`

## 詳細

接続IDを指定すると、この接続で現在実行中のクエリIDまたは最後に実行完了したクエリIDを返します。

接続IDは、MySQLコマンド `show processlist;` のidカラムで確認できます。
    
## Path parameters

なし

## Query parameters

* `connection_id`

    指定する接続ID

## Request body

なし

## Response

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"query_id": "b52513ce3f0841ca-9cb4a96a268f2dba"
	},
	"count": 0
}
```
## 例

1. 指定されたconnection idのquery idを取得する

    ```
    GET /api/connection?connection_id=101
    
    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"query_id": "b52513ce3f0841ca-9cb4a96a268f2dba"
    	},
    	"count": 0
    }
    ```
