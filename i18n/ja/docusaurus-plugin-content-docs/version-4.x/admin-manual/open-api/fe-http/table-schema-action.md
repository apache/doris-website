---
{
    "title": "テーブルスキーマの取得（Table Schema Action）",
    "language": "ja",
    "description": "指定したテーブルの構造情報を取得します。このインターフェースは現在、Spark/Flink Doris Connector で使用されています。"
}
---

# テーブルスキーマの取得（Table Schema Action）

## リクエスト

`GET /api/<db>/<table>/_schema`

## 説明

指定した Doris テーブルの構造情報を取得します。このインターフェースは現在、Spark/Flink Doris Connector で使用されています。
    
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
* http インターフェースは次のように返します。
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": "",
			"aggregation_type":""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": "",
			"aggregation_type":"MAX"
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
* http v2 インターフェースは次のように返します。
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": ""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": ""
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
注: `http` 方式は `aggregation_type` フィールドを `http v2` 方式よりも多く返します。`http v2` は `enable_http_server_v2` を設定すると有効になります。パラメータの詳細については、[FE パラメータの設定](../../config/fe-config.md)を参照してください。

## 例

1. http インターフェースを使用して、指定したテーブルの構造情報を取得します。

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": "",
    			"aggregation_type":""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": "",
    			"aggregation_type":"MAX"
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
2. http v2 インターフェースを使用して、指定したテーブルの構造情報を取得します。

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": ""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": ""
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
