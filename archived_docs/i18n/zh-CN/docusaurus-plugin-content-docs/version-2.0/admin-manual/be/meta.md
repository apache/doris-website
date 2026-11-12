---
{
    "title": "查询元信息",
    "language": "zh-CN"
}
---

## Request

`GET /api/meta/header/{tablet_id}?byte_to_base64={bool}`

## Description

查询 tablet 元信息

## Path parameters

* `tablet_id`
    table 的 id

## Query parameters

* `byte_to_base64`
    是否按 base64 编码，选填，默认`false`。

## Request body

无

## Response

    ```json
    {
        "table_id": 148107,
        "partition_id": 148104,
        "tablet_id": 148193,
        "schema_hash": 2090621954,
        "shard_id": 38,
        "creation_time": 1673253868,
        "cumulative_layer_point": -1,
        "tablet_state": "PB_RUNNING",
        ...
    }
    ```
## Examples


    ```shell
    curl "http://127.0.0.1:8040/api/meta/header/148193&byte_to_base64=true"

    ```

