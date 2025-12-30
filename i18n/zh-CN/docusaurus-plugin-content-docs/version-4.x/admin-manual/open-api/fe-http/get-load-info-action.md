---
{
    "title": "Get Load Info Action",
    "language": "zh-CN",
    "description": "用于获取指定 label 的导入作业的信息。"
}
---

## Request

`GET /api/<db>/_load_info`

## Description

用于获取指定 label 的导入作业的信息。
    
## Path parameters

* `<db>`

    指定数据库

## Query parameters

* `label`

    指定导入 Label

## Request body

无

## Response

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
    
## Examples

1. 获取指定 label 的导入作业信息

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
