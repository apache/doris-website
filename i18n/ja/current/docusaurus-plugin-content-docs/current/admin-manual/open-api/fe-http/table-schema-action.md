---
{
  "title": "テーブルスキーマアクション",
  "language": "ja",
  "description": "指定されたテーブルのテーブル構造情報を取得するために使用されます。このインターフェースは現在Spark/Flink Doris Connectorで使用されています。"
}
---
# Table Schema Action

## Request

`GET /api/<db>/<table>/_schema`

## Description

指定されたテーブルのテーブル構造情報を取得するために使用されます。このインターフェースは現在Spark/Flink Doris Connectorで使用されており、Dorisテーブル構造情報を取得します。
    
## Path parameters

* `<db>`

    データベースを指定

* `<table>`

    テーブルを指定

## Query parameters

なし

## Request body

なし

## Response
* httpインターフェースは以下のように返します：

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
* http v2 インターフェースは以下のように返します：

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
注意: 違いは、`http`メソッドが`http v2`メソッドよりも多くの`aggregation_type`フィールドを返すことです。`http v2`は`enable_http_server_v2`を設定することで有効になります。詳細なパラメータの説明については、[feパラメータ設定](../../config/fe-config.md)を参照してください。

## 例

1. httpインターフェース経由で指定されたテーブルのテーブル構造情報を取得する。

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
2. http v2インターフェースを介して、指定されたテーブルのテーブル構造情報を取得します。

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
