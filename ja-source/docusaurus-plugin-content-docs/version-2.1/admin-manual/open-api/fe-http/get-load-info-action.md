---
{
  "title": "Load情報取得アクション",
  "language": "ja",
  "description": "指定されたラベルのロードジョブの情報を取得するために使用されます。"
}
---
# Get Load Info Action

## リクエスト

`GET /api/<db>/_load_info`

## 説明

指定されたラベルのロードジョブの情報を取得するために使用されます。
    
## パスパラメータ

* `<db>`

    データベースを指定

## クエリパラメータ

* `label`

    ロードラベルを指定

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"dbName": "default_cluster:db1",
		"tblNames": ["tbl1"],
		"label": "my_label",
		"clusterName": "default_cluster",
		"state": "FINISHED",
		"failMsg": "",
		"trackingUrl": ""
	},
	"count": 0
}
```
## 例

1. 指定されたラベルのロードジョブ情報を取得する

    ```
    GET /api/example_db/_load_info?label=my_label
    
    Response
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"dbName": "default_cluster:db1",
    		"tblNames": ["tbl1"],
    		"label": "my_label",
    		"clusterName": "default_cluster",
    		"state": "FINISHED",
    		"failMsg": "",
    		"trackingUrl": ""
    	},
    	"count": 0
    }
    ```
