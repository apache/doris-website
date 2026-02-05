---
{
    "title": "Query Detail Action",
    "language": "zh-CN",
    "description": "用于获取指定时间点之后的所有查询的信息"
}
---

## Request

`GET /api/query_detail`

## Description

用于获取指定时间点之后的所有查询的信息
    
## Path parameters

无

## Query parameters

* `event_time`

    指定的时间点（Unix 时间戳，单位毫秒），获取该时间点之后的查询信息。
    
## Request body

无

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
    
## Examples

1. 获取指定时间点之后的查询详情。

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