---
{
    "title": "Reload Tablet",
    "language": "en"
}
---

# Reload Tablet

## Request

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## Description

Reload tablet

## Query parameters

* `tablet_id`
    ID of the tablet

* `schema_hash`
    Schema hash      

* `path`
    Path of file    


## Request body

None

## Response

    ```
    load header succeed
    ```
## Examples


    ```
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```

