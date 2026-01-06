---
{
    "title": "做快照",
    "language": "zh-CN",
    "description": "该功能用于 tablet 做快照。"
}
---

## 请求路径

`GET /api/snapshot?tablet_id={int}&schema_hash={int}"`

## 描述

该功能用于 tablet 做快照。

## 请求参数

* `tablet_id`
    需要做快照的 table 的 id

* `schema_hash`
    schema hash         


## 请求体

无

## 响应

    ```
    /path/to/snapshot
    ```
## 示例


    ```shell
    curl "http://127.0.0.1:8040/api/snapshot?tablet_id=123456&schema_hash=1111111"

    ```

