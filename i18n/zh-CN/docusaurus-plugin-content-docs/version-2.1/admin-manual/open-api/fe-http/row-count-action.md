---
{
    "title": "Row Count Action",
    "language": "zh-CN",
    "description": "用于手动更新指定表的行数统计信息。在更新行数统计信息的同时，也会以 JSON 格式返回表以及对应 rollup 的行数"
}
---

## Request

`GET /api/rowcount`

## Description

用于手动更新指定表的行数统计信息。在更新行数统计信息的同时，也会以 JSON 格式返回表以及对应 rollup 的行数
    
## Path parameters

无

## Query parameters

* `db`

    指定的数据库

* `table`

    指定的表名

## Request body

无

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": 10000
	},
	"count": 0
}
```
    
## Examples

1. 更新并获取指定 Table 的行数

    ```
    GET /api/rowcount?db=example_db&table=tbl1
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"tbl1": 10000
    	},
    	"count": 0
    }
    ```
