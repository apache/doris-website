---
{
    "title": "查询元信息",
    "language": "zh-CN",
    "description": "查询 tablet 元信息"
}
---

## 请求路径

`GET /api/meta/header/{tablet_id}?byte_to_base64={bool}`

## 描述

查询 tablet 元信息

## Path parameters

* `tablet_id`
    table 的 id

## 请求参数

* `byte_to_base64`
    是否按 base64 编码，选填，默认`false`。

## 请求体

无

## 响应

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
## 示例


    ```shell
    curl "http://127.0.0.1:8040/api/meta/header/148193&byte_to_base64=true"

    ```

