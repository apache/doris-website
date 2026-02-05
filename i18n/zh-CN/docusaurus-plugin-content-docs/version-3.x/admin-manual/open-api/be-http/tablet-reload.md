---
{
    "title": "重加载 tablet",
    "language": "zh-CN",
    "description": "该功能用于重加载 tablet 数据。"
}
---

## Request

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## Description

该功能用于重加载 tablet 数据。

## Query parameters

* `tablet_id`
    需要重加载的 table 的 id

* `schema_hash`
    schema hash      

* `path`
    文件路径     


## Request body

无

## Response

    ```shell
    load header succeed
    ```
## Examples


    ```shell
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```

