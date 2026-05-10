---
{
    "title": "Make Snapshot",
    "language": "en",
    "description": "Make snapshot of a tablet"
}
---

# Make Snapshot

## Request

`GET /api/snapshot?tablet_id={int}&schema_hash={int}"`

## Description

Make snapshot of a tablet

## Query parameters

* `tablet_id`
    ID of the tablet

* `schema_hash`
    Schema hash         


## Request body

None

## Response

    ```
    /path/to/snapshot
    ```
## Examples


    ```
    curl "http://127.0.0.1:8040/api/snapshot?tablet_id=123456&schema_hash=1111111"

    ```

