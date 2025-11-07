---
{
    "title": "View Meta",
    "language": "en"
}
---

# View Meta

## Request

`GET /api/meta/header/{tablet_id}?byte_to_base64={bool}`

## Description

View meta of a tablet

## Path parameters

* `tablet_id`
    ID of the tablet

## Query parameters

* `byte_to_base64`
    Whether to encode by base64. Optional with default `false`.

## Request body

None

## Response

    ```
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


    ```
    curl "http://127.0.0.1:8040/api/meta/header/148193&byte_to_base64=true"

    ```

