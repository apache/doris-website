---
{
    "title": "Checksum",
    "language": "zh-CN"
}
---

## Request

`GET /api/checksum?tablet_id={int}&version={int}&schema_hash={int}`

## Description

checksum

## Query parameters

* `tablet_id`
    需要校验的 tablet 的 id

* `version`
    需要校验的 tablet 的 version    

* `schema_hash`
    schema hash

## Request body

无

## Response

    ```
    1843743562
    ```
## Examples


    ```
    curl "http://127.0.0.1:8040/api/checksum?tablet_id=1&version=1&schema_hash=-1"
    
    ```

