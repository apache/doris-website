---
{
    "title": "Meta Info Action",
    "language": "zh-CN"
}
---

Meta Info Action 用于获取集群内的元数据信息。如数据库列表，表结构等。

## 数据库列表

### Request

```
GET /api/meta/namespaces/<ns_name>/databases
```

## 描述

获取所有数据库名称列表，按字母序排列。
    
### Path parameters

无

### Query parameters

* `limit`

    限制返回的结果行数
    
* `offset`

    分页信息，需要和 `limit` 一起使用

### Request body

无

### Response

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "db1", "db2", "db3", ...  
	],
	"count": 3
}
```

* data 字段返回数据库名列表。

## 表列表

### Request

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables
```

## 描述

获取指定数据库中的表列表，按字母序排列。
    
### Path parameters

* `<db_name>`

    指定数据库名称

### Query parameters

* `limit`

    限制返回的结果行数
    
* `offset`

    分页信息，需要和 `limit` 一起使用

### Request body

无

### Response

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "tbl1", "tbl2", "tbl3", ...  
	],
	"count": 0
}
```

* data 字段返回表名称列表。

## 表结构信息

### Request

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables/<tbl_name>/schema
```

## 描述

获取指定数据库中，指定表的表结构信息。
    
### Path parameters

* `<db_name>`

    指定数据库名称
    
* `<tbl_name>`

    指定表名称

### Query parameters

* `with_mv`

    可选项，如果未指定，默认返回 base 表的表结构。如果指定，则还会返回所有 rollup 的信息。

### Request body

无

### Response

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		}
	},
	"count": 0
}
```

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema?with_mv?=1

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		},
		"rollup1": {
			"schema": [{
				"Field": "k1",
				"Type": "INT",
				"Null": "Yes",
				"Extra": "",
				"Default": null,
				"Key": "true"
			}],
			"is_base": false
		}
	},
	"count": 0
}
```

* data 字段返回 base 表或 rollup 表的表结构信息。
