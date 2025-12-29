---
{
    "title": "Cancel Load Action",
    "language": "en",
    "description": "Used to cancel the load transaction of the specified label."
}
---

# Cancel Load Action

## Request

`POST /api/<db>/_cancel`

## Description

Used to cancel the load transaction of the specified label.
RETURN VALUES
    Return a JSON format string:
    Status: 
        Success: cancel succeed
        Others: cancel failed
    Message: Error message if cancel failed
    
## Path parameters

* `<db>`

    Specify the database name

## Query parameters

* `<label>`

    Specify the load label

## Request body

None

## Response

* Cancel success

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```

* Cancel failed

    ```
    {
    	"msg": "Error msg...",
    	"code": 1,
    	"data": null,
    	"count": 0
    }
    ```
    
## Examples

1. Cancel the load transaction of the specified label

    ```
    POST /api/example_db/_cancel?label=my_label1

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
    




