---
{
  "title": "接続アクション",
  "language": "ja",
  "description": "接続IDが与えられた場合、その接続で現在実行中のクエリIDまたは最後に完了した実行のクエリIDを返します。"
}
---
# Connection Action

## リクエスト

`GET /api/connection`

## 説明

接続IDが与えられた場合、この接続に対して現在実行中のクエリIDまたは最後に完了した実行を返します。

接続IDは、MySQLコマンド`show processlist;`のidカラムで確認できます。

## パスパラメータ

无

## クエリパラメータ

* `connection_id`

    指定された接続ID

## リクエストボディ

None

## レスポンス

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
