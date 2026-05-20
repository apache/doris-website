---
{
    "title": "Get DDL Statement Action",
    "language": "en"
}
---

# Get DDL Statement Action

## Request

`GET /api/_get_ddl`

## Description

Used to get the table creation statement, partition creation statement and rollup statement of the specified table.
    
## Path parameters

None

## Query parameters

* `db`

    Specify database

* `table`
    
    Specify table

## Request body

None

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

1. Get the DDL statement of the specified table

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




