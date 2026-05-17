---
{
    "title": "Check Storage Type Action",
    "language": "zh-CN",
    "description": "用于检查指定数据库下的表的存储格式否是行存格式。（行存格式已废弃）"
}
---

## Request

`GET /api/_check_storagetype`

## Description

用于检查指定数据库下的表的存储格式否是行存格式。（行存格式已废弃）
    
## Path parameters

无

## Query parameters

* `db`

    指定数据库

## Request body

无

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl2": {},
		"tbl1": {}
	},
	"count": 0
}
```

如果表名后有内容，则会显示存储格式为行存的 base 或者 rollup 表。

## Examples

1. 检查指定数据库下表的存储格式是否为行存

    ```
    GET /api/_check_storagetype
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"tbl2": {},
    		"tbl1": {}
    	},
    	"count": 0
    }
    ```
