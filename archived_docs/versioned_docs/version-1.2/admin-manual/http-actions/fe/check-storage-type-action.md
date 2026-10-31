---
{
    "title": "Check Storage Type Action",
    "language": "en"
}
---

# Check Storage Type Action

## Request

`GET /api/_check_storagetype`

## Description

It is used to check whether the storage format of the table under the specified database is the row storage format. (The row format is deprecated)
    
## Path parameters

None

## Query parameters

* `db`

    Specify the database

## Request body

None

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

If there is content after the table name, the base or rollup table whose storage format is row storage will be displayed.

## Examples

1. Check whether the storage format of the following table of the specified database is row format

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