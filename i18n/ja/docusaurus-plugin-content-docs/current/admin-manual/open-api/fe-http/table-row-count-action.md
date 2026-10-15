---
{
    "title": "テーブル行数アクション",
    "language": "ja",
    "description": "指定したテーブルの行数に関する統計情報を取得します。このインターフェースは現在 Spark-Doris-Connector で使用されています。"
}
---

# テーブル行数アクション

## リクエスト

`GET /api/<db>/<table>/_count`

## 説明

指定したテーブルの行数に関する統計情報を取得します。このインターフェースは現在 Spark-Doris-Connector で使用されており、Spark が Doris テーブルの統計情報を取得します。
    
## パスパラメータ

* `<db>`

    データベースを指定します。

* `<table>`

    テーブルを指定します。

## クエリパラメータ

なし

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"size": 1,
		"status": 200
	},
	"count": 0
}
```

`data.size` フィールドは、指定したテーブルの行数を示します。
    
## 例

1. 指定したテーブルの行数を取得します。

    ```
    GET /api/db1/tbl1/_count
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"size": 1,
    		"status": 200
    	},
    	"count": 0
    }
    ```
