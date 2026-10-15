---
{
    "title": "テーブルクエリプランアクション（Table Query Plan Action）",
    "language": "ja",
    "description": "指定した SQL に対応するクエリプランを取得します。"
}
---

# テーブルクエリプランアクション（Table Query Plan Action）

## リクエスト

`POST /api/<db>/<table>/_query_plan`

## 説明

指定した SQL に対応するクエリプランを取得します。

このインターフェースは現在 Spark-Doris-Connector で使用されており、Spark が Doris のクエリプランを取得するために利用します。
    
## パスパラメータ

* `<db>`

    データベースを指定します。
    
* `<table>`

    テーブルを指定します。

## クエリパラメータ

なし

## リクエストボディ

```
{
	"sql": "select * from db1.tbl1;"
}
```

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"partitions": {
			"10039": {
				"routings": ["10.81.85.89:9062"],
				"version": 2,
				"versionHash": 982459448378619656,
				"schemaHash": 1294206575
			}
		},
		"opaqued_query_plan": "DAABDAACDwABDAAAAAEIAAEAAAAACAACAAAAAAgAAwAAAAAKAAT//////////w8ABQgAAAABAAAAAA8ABgIAAAABAAIACAAMABIIAAEAAAAADwACCwAAAAIAAAACazEAAAACazIPAAMIAAAAAgAAAAUAAAAFAgAEAQAAAA8ABAwAAAACDwABDAAAAAEIAAEAAAAQDAACDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABAAAAAAMAA8IAAEAAAAACAACAAAAAAAIABT/////CAAX/////wAADwABDAAAAAEIAAEAAAAQDAACDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABAAAAAAMAA8IAAEAAAABCAACAAAAAAAIABT/////CAAX/////wAADAAFCAABAAAABgwACAAADAAGCAABAAAAAA8AAgwAAAAAAAoABwAAAAAAAAAACgAIAAAAAAAAAAAADQACCgwAAAABAAAAAAAAJzcKAAEAAAAAAAAnNwoAAgAAAAAAAAACCgADDaJlqbrVdwgIAARNJAZvAAwAAw8AAQwAAAACCAABAAAAAAgAAgAAAAAMAAMPAAEMAAAAAQgAAQAAAAAMAAIIAAEAAAAFAAAACAAE/////wgABQAAAAQIAAYAAAAACAAHAAAAAAsACAAAAAJrMQgACQAAAAACAAoBAAgAAQAAAAEIAAIAAAAADAADDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABP////8IAAUAAAAICAAGAAAAAAgABwAAAAELAAgAAAACazIIAAkAAAABAgAKAQAPAAIMAAAAAQgAAQAAAAAIAAIAAAAMCAADAAAAAQoABAAAAAAAACc1CAAFAAAAAgAPAAMMAAAAAQoAAQAAAAAAACc1CAACAAAAAQgAAwAAAAIIAAQAAAAACwAHAAAABHRibDELAAgAAAAADAALCwABAAAABHRibDEAAAAMAAQKAAFfL5rpxl1I4goAArgs6f+h6eMxAAA=",
		"status": 200
	},
	"count": 0
}
```

`opaqued_query_plan` はバイナリ形式のクエリプランです。
    
## 例

1. 指定した SQL のクエリプランを取得します。

    ```
    POST /api/db1/tbl1/_query_plan
    {
        "sql": "select * from db1.tbl1;"
    }
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"partitions": {
    			"10039": {
    				"routings": ["192.168.1.1:9060"],
    				"version": 2,
    				"versionHash": 982459448378619656,
    				"schemaHash": 1294206575
    			}
    		},
    		"opaqued_query_plan": "DAABDAACDwABD...",
    		"status": 200
    	},
    	"count": 0
    }
    ```
