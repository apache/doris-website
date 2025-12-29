---
{
    "title": "做快照",
    "language": "zh-CN",
    "description": "该功能用于 tablet 做快照。"
}
---

## Request

`GET /api/snapshot?tablet_id={int}&schema_hash={int}"`

## Description

该功能用于 tablet 做快照。

## Query parameters

* `tablet_id`
    需要做快照的 table 的 id

* `schema_hash`
    schema hash         


## Request body

无

## Response

    ```
    /path/to/snapshot
    ```
## Examples


    ```shell
    curl "http://127.0.0.1:8040/api/snapshot?tablet_id=123456&schema_hash=1111111"

    ```

