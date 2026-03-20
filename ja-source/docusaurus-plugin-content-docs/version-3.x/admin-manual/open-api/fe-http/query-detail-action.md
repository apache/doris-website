---
{
  "title": "クエリ詳細アクション",
  "language": "ja",
  "description": "指定された時点以降のすべてのクエリに関する情報を取得するために使用される"
}
---
# Query Detail Action

## Request

`GET /api/query_detail`

## 詳細

指定した時点以降のすべてのクエリに関する情報を取得するために使用されます

## Path parameters

なし

## Query parameters

* `event_time`

    指定した時点（Unixタイムスタンプ、ミリ秒単位）で、その時点以降のクエリ情報を取得します。
    
## Request body

なし

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"query_details": [{
			"eventTime": 1596462699216,
			"queryId": "f732084bc8e74f39-8313581c9c3c0b58",
			"startTime": 1596462698969,
			"endTime": 1596462699216,
			"latency": 247,
			"state": "FINISHED",
			"database": "db1",
			"sql": "select * from tbl1"
		}, {
			"eventTime": 1596463013929,
			"queryId": "ed2d0d80855d47a5-8b518a0f1472f60c",
			"startTime": 1596463013913,
			"endTime": 1596463013929,
			"latency": 16,
			"state": "FINISHED",
			"database": "db1",
			"sql": "select k1 from tbl1"
		}]
	},
	"count": 0
}
```
## 例

1. 指定された時点以降のクエリ詳細を取得する。

    ```
    GET /api/query_detail?event_time=1596462079958
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"query_details": [{
    			"eventTime": 1596462699216,
    			"queryId": "f732084bc8e74f39-8313581c9c3c0b58",
    			"startTime": 1596462698969,
    			"endTime": 1596462699216,
    			"latency": 247,
    			"state": "FINISHED",
    			"database": "db1",
    			"sql": "select * from tbl1"
    		}, {
    			"eventTime": 1596463013929,
    			"queryId": "ed2d0d80855d47a5-8b518a0f1472f60c",
    			"startTime": 1596463013913,
    			"endTime": 1596463013929,
    			"latency": 16,
    			"state": "FINISHED",
    			"database": "db1",
    			"sql": "select k1 from tbl1"
    		}]
    	},
    	"count": 0
    }
    ```
