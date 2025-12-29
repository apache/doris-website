---
{
    "title": "Row Count Action",
    "language": "en",
    "description": "Used to manually update the row count statistics of the specified table. While updating the statistics of the number of rows,"
}
---

# Row Count Action

## Request

`GET /api/rowcount`

## Description

Used to manually update the row count statistics of the specified table. While updating the statistics of the number of rows, the table and the number of rows corresponding to the rollup will also be returned in JSON format
    
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
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": 10000
	},
	"count": 0
}
```
    
## Examples

1. Update and get the number of rows in the specified Table

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
