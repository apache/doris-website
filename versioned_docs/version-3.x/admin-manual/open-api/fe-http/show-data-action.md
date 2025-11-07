---
{
    "title": "Show Data Action",
    "language": "en"
}
---

# Show Data Action

## Request

`GET /api/show_data`

## Description

Used to get the total data volume of the cluster or the data volume of the specified database. Unit byte.
    
## Path parameters

None

## Query parameters

* `db`

    Optional. If specified, get the data volume of the specified database.

## Request body

None

## Response

1. Specify the amount of data in the database.

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
    
2. Total data

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

1. Get the data volume of the specified database

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

2. Get the total data volume of the cluster

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