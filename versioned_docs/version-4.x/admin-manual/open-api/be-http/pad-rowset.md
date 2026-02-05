---
{
    "title": "Pad Rowset",
    "language": "en",
    "description": "Pad one empty rowset as one substitute for error replica."
}
---

# Pad Rowset

## Request

`POST /api/pad_rowset?tablet_id={int}&start_version={int}&end_version={int}`

## Description

Pad one empty rowset as one substitute for error replica.

## Query parameters

* `tablet_id`
    ID of the tablet

* `start_version`
    Start version

* `end_version`
    End version       


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
    curl -X POST "http://127.0.0.1:8040/api/pad_rowset?tablet_id=123456&start_version=1111111&end_version=1111112"

    ```

