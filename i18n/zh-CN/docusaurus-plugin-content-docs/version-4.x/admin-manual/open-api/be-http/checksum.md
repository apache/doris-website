---
{
    "title": "Checksum",
    "language": "zh-CN",
    "description": "checksum"
}
---

## 请求路径

`GET /api/checksum?tablet_id={int}&version={int}&schema_hash={int}`

## 描述

checksum

## 请求参数

* `tablet_id`
    需要校验的 tablet 的 id

* `version`
    需要校验的 tablet 的 version    

* `schema_hash`
    schema hash

## 请求体

无

## 响应

    ```
    1843743562
    ```
## 示例


    ```
    curl "http://127.0.0.1:8040/api/checksum?tablet_id=1&version=1&schema_hash=-1"
    
    ```

