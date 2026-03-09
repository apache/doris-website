---
{
  "title": "テーブル行数アクション",
  "language": "ja",
  "description": "指定されたテーブルの行数に関する統計情報を取得するために使用されます。このインターフェースは現在Spark-Doris-Connectorで使用されています。"
}
---
# Table Row Count Action

## Request

`GET /api/<db>/<table>/_count`

## Description

指定されたテーブル内の行数に関する統計を取得するために使用されます。このインターフェースは現在Spark-Doris-Connectorで使用されています。SparkはDorisテーブルの統計を取得します。
    
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
`data.size`フィールドは、指定されたテーブルの行数を示します。

## 例

1. 指定されたテーブルの行数を取得します。

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
