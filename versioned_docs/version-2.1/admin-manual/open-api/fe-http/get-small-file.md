---
{
    "title": "Get Small File Action",
    "language": "en",
    "description": "Through the file id, download the file in the small file manager."
}
---

# Get Small File

## Request

`GET /api/get_small_file`

## Description

Through the file id, download the file in the small file manager.
    
## Path parameters

None

## Query parameters

* `token`

    The token of the cluster. It can be viewed in the file `doris-meta/image/VERSION`.

* `file_id`
    
    The file id displayed in the file manager. The file id can be viewed with the `SHOW FILE` command.

## Request body

None

## Response

```
< HTTP/1.1 200
< Vary: Origin
< Vary: Access-Control-Request-Method
< Vary: Access-Control-Request-Headers
< Content-Disposition: attachment;fileName=ca.pem
< Content-Type: application/json;charset=UTF-8
< Transfer-Encoding: chunked

... File Content ...
```

If there is an error, it returns:

```
{
	"msg": "File not found or is not content",
	"code": 1,
	"data": null,
	"count": 0
}
```
    
## Examples

1. Download the file with the specified id

    ```
    GET /api/get_small_file?token=98e8c0a6-3a41-48b8-a72b-0432e42a7fe5&file_id=11002
    
    Response:
    
    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=ca.pem
    < Content-Type: application/json;charset=UTF-8
    < Transfer-Encoding: chunked
    
    ... File Content ...
    ```




