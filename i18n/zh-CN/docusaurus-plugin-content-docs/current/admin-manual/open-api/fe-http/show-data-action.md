---
{
    "title": "Show Data Action",
    "language": "zh-CN",
    "description": "用于获取集群的总数据量，或者指定数据库的数据量。单位字节。"
}
---

## Request

`GET /api/show_data`

## Description

用于获取集群的总数据量，或者指定数据库的数据量。单位字节。
    
## Path parameters

无

## Query parameters

* `db`

    可选。如果指定，则获取指定数据库的数据量。

## Request body

无

## Response

1. 指定数据库的数据量。

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
    
2. 总数据量

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"__total_size": 381
    	},
    	"count": 0
    }
    ```
    
## Examples

1. 获取指定数据库的数据量

    ```
    GET /api/show_data?db=db1
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```

2. 获取集群总数据量

    ```
    GET /api/show_data
        
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"__total_size": 381
    	},
    	"count": 0
    }
    ```
