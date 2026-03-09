---
{
  "title": "Query Profile Action Controller | Fe Http",
  "language": "ja",
  "description": "Query Profile Actionは、Queryプロファイルを取得するために使用されます。",
  "sidebar_label": "Query Profile Action Controller"
}
---
# Query Profile Action

## リクエスト

```
GET /rest/v1/query_profile/<query_id>
```
## 説明

Query Profile Actionは、Queryプロファイルを取得するために使用されます。
    
## Pathパラメータ

* `<query_id>`

    オプションパラメータ。指定されていない場合、最新のクエリリストが返されます。指定された場合、指定されたクエリのプロファイルを返します。

## Queryパラメータ

なし

## リクエストボディ

なし

## レスポンス

* `<query_id>`を指定しない場合

    ```
    GET /rest/v1/query_profile/
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"href_column": ["Query ID"],
    		"column_names": ["Query ID", "User", "Default Db", "Sql Statement", "Query Type", "Start Time", "End Time", "Total", "Query State"],
    		"rows": [{
    			"User": "root",
    			"__hrefPath": ["/query_profile/d73a8a0b004f4b2f-b4829306441913da"],
    			"Query Type": "Query",
    			"Total": "5ms",
    			"Default Db": "default_cluster:db1",
    			"Sql Statement": "select * from tbl1",
    			"Query ID": "d73a8a0b004f4b2f-b4829306441913da",
    			"Start Time": "2020-09-03 10:07:54",
    			"Query State": "EOF",
    			"End Time": "2020-09-03 10:07:54"
    		}, {
    			"User": "root",
    			"__hrefPath": ["/query_profile/fd706dd066824c21-9d1a63af9f5cb50c"],
    			"Query Type": "Query",
    			"Total": "6ms",
    			"Default Db": "default_cluster:db1",
    			"Sql Statement": "select * from tbl1",
    			"Query ID": "fd706dd066824c21-9d1a63af9f5cb50c",
    			"Start Time": "2020-09-03 10:07:54",
    			"Query State": "EOF",
    			"End Time": "2020-09-03 10:07:54"
    		}]
    	},
    	"count": 3
    }
    ```
返される結果は`System Action`と同じで、テーブルの説明です。

* `<query_id>`を指定してください

    ```
    GET /rest/v1/query_profile/<query_id>

    {
    	"msg": "success",
    	"code": 0,
    	"data": "Query:</br>&nbsp;&nbsp;&nbsp;&nbsp;Summary:</br>...",
    	"count": 0
    }
    ```
`data`はプロファイルのテキストコンテンツです。
