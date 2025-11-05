---
{
    "title": "Restore Tablet",
    "language": "en"
}
---

# Restore Tablet

## Request

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## Description

To restore the tablet data from trash dir on BE

## Query parameters

* `tablet_id`
    ID of the tablet

* `schema_hash`
    Schema hash       


## Request body

None

## Response

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## Examples


    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```

