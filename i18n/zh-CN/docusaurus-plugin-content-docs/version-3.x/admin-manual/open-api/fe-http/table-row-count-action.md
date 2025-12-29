---
{
    "title": "Table Row Count Action",
    "language": "zh-CN",
    "description": "用于获取指定表的行数统计信息。该接口目前用于 Spark-Doris-Connector 中，Spark 获取 Doris 的表统计信息。"
}
---

## Request

`GET /api/<db>/<table>/_count`

## Description

用于获取指定表的行数统计信息。该接口目前用于 Spark-Doris-Connector 中，Spark 获取 Doris 的表统计信息。
    
## Path parameters

* `<db>`

    指定数据库

* `<table>`

    指定表

## Query parameters

无

## Request body

无

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

其中 `data.size` 字段表示指定表的行数。
    
## Examples

1. 获取指定表的行数。

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
