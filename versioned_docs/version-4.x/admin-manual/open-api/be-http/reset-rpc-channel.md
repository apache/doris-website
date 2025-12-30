---
{
    "title": "Reset Stub Cache",
    "language": "en",
    "description": "Reset the connection cache of brpc"
}
---

# Reset Stub Cache

## Request

`GET /api/reset_rpc_channel/{endpoints}`

## Description

Reset the connection cache of brpc

## Path parameters

* `endpoints`
    - `all`: clear all caches
    - `host1:port1,host2:port2`: clear cache of the specified target

## Request body

None

## Response

    ```
    {
        "msg":"success",
        "code":0,
        "data": "no cached channel.",
        "count":0
    }
    ```
## Examples


    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/all
    ```
    
    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/1.1.1.1:8080,2.2.2.2:8080
    ```

