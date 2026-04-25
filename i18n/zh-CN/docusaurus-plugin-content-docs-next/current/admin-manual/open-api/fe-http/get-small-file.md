---
{
    "title": "Get Small File Action",
    "language": "zh-CN",
    "description": "通过文件 id，下载在文件管理器中的文件。"
}
---

## Request

`GET /api/get_small_file`

## Description

通过文件 id，下载在文件管理器中的文件。    
## Path parameters

无

## Query parameters

* `token`

    集群的 token。可以在 `doris-meta/image/VERSION` 文件中查看。

* `file_id`
    
    文件管理器中显示的文件 id。文件 id 可以通过 `SHOW FILE` 命令查看。

## Request body

无

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

如有错误，则返回：

```
{
	"msg": "File not found or is not content",
	"code": 1,
	"data": null,
	"count": 0
}
```
    
## Examples

1. 下载指定 id 的文件

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




