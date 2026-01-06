---
{
    "title": "Get DDL Statement Action",
    "language": "zh-CN",
    "description": "用于获取指定表的建表语句、建分区语句和建 rollup 语句。"
}
---

## Request

`GET /api/_get_ddl`

## Description

用于获取指定表的建表语句、建分区语句和建 rollup 语句。
    
## Path parameters

无

## Query parameters

* `db`

    指定数据库

* `table`
    
    指定表

## Request body

无

## Response

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"create_partition": ["ALTER TABLE `tbl1` ADD PARTITION ..."],
		"create_table": ["CREATE TABLE `tbl1` ...],
		"create_rollup": ["ALTER TABLE `tbl1` ADD ROLLUP ..."]
	},
	"count": 0
}
```
    
## Examples

1. 获取指定表的 DDL 语句

    ```
    GET GET /api/_get_ddl?db=db1&table=tbl1
    
    Response
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"create_partition": [],
    		"create_table": ["CREATE TABLE `tbl1` (\n  `k1` int(11) NULL COMMENT \"\",\n  `k2` int(11) NULL COMMENT \"\"\n) ENGINE=OLAP\nDUPLICATE KEY(`k1`, `k2`)\nCOMMENT \"OLAP\"\nDISTRIBUTED BY HASH(`k1`) BUCKETS 1\nPROPERTIES (\n\"replication_num\" = \"1\",\n\"version_info\" = \"1,0\",\n\"in_memory\" = \"false\",\n\"storage_format\" = \"DEFAULT\"\n);"],
    		"create_rollup": []
    	},
    	"count": 0
    }
    ```




