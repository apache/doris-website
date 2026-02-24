---
{
    "title": "Check Stub Cache",
    "language": "en",
    "description": "Check whether the connection cache is available"
}
---

# CHECK Stub Cache

## Request

`GET /api/check_rpc_channel/{host_to_check}/{remot_brpc_port}/{payload_size}`

## Description

Check whether the connection cache is available

## Path parameters

* `host_to_check`

    Host to check

* `remot_brpc_port`

    Remote brpc port

* `payload_size`

    Load size, unit: B, value range 1~1024000.

## Request body

None

## Response

    ```
    {
        "msg":"success",
        "code":0,
        "data": "open brpc connection to {host_to_check}:{remot_brpc_port} success.",
        "count":0
    }
    ```
## Examples


    ```
    curl http://127.0.0.1:8040/api/check_rpc_channel/127.0.0.1/8060/1024000
    ```

