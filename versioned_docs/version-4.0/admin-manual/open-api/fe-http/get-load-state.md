---
{
    "title": "Get Load State",
    "language": "en"
}
---

# Get Load State

## Request

`GET /api/<db>/get_load_state`

## Description

Returns the status of the load transaction of the specified label
Return of JSON format string of the status of specified transaction:
	Label: The specified label.
	Status: Success or not of this request.
	Message: Error messages
	State: 
		UNKNOWN/PREPARE/COMMITTED/VISIBLE/ABORTED
    
## Path parameters

* `<db>`

    Specify database

## Query parameters

* `label`

    Specify label

## Request body

None

## Response

```
{
	"msg": "success",
	"code": 0,
	"data": "VISIBLE",
	"count": 0
}
```

If label does not exist, return:

```
{
	"msg": "success",
	"code": 0,
	"data": "UNKNOWN",
	"count": 0
}
```
    
## Examples

1. Get the status of the load transaction of the specified label.

    ```
    GET /api/example_db/get_load_state?label=my_label
    
    {
    	"msg": "success",
    	"code": 0,
    	"data": "VISIBLE",
    	"count": 0
    }
    ```
