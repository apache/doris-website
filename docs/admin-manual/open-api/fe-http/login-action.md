---
{
    "title": "Login Action",
    "language": "en",
    "description": "Used to log in to the service."
}
---

# Login Action

## Request

`POST /rest/v1/login`

## Description

Used to log in to the service.
    
## Path parameters

None

## Query parameters

None

## Request body

None

## Response

* Login success

    ```
    {
    	"msg": "Login success!",
    	"code": 200
    }
    ```

* Login failure

    ```
    {
    	"msg": "Error msg...",
    	"code": xxx,
    	"data": "Error data...",
    	"count": 0
    }
    ```

