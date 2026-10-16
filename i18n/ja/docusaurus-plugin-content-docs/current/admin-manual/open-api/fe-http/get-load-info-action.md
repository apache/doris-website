---
{
    "title": "ロード情報の取得（Get Load Info Action）",
    "language": "ja",
    "description": "指定したラベルのロードジョブ情報を取得します。"
}
---

# ロード情報の取得（Get Load Info Action）

## リクエスト

`GET /api/<db>/_load_info`

## 説明

指定したラベルのロードジョブ情報を取得します。
    
## パスパラメータ

* `<db>`

    データベースを指定します。

## クエリパラメータ

* `label`

    ロードラベルを指定します。

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

1. 指定したラベルのロードジョブ情報を取得します。

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
