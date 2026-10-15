---
{
    "title": "接続アクション",
    "language": "ja",
    "description": "接続 ID を指定すると、その接続で現在実行中のクエリ、または最後に実行が完了したクエリのクエリ ID を返します。"
}
---

# 接続アクション

## リクエスト

`GET /api/connection`

## 説明

接続 ID を指定すると、その接続で現在実行中のクエリ、または最後に実行が完了したクエリのクエリ ID を返します。

接続 ID は、MySQL コマンド `show processlist;` の id 列で確認できます。
    
## パスパラメータ

なし

## クエリパラメータ

* `connection_id`

    指定する接続 ID

## リクエストボディ

なし

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

1. 指定した接続 ID のクエリ ID を取得する

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
