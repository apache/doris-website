---
{
    "title": "恢复 tablet",
    "language": "zh-CN"
}
---

## Request

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## Description

该功能用于恢复 trash 目录中被误删的 tablet 数据。

## Query parameters

* `tablet_id`
    需要恢复的 table 的 id

* `schema_hash`
    schema hash       


## Request body

无

## Response

    ```json
    {
        msg: "OK",
        code: 0
    }
    ```
## Examples


    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```

