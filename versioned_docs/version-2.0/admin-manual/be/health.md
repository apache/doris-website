---
{
    "title": "Check Alive",
    "language": "en"
}
---

# Check Alive

## Request

`GET /api/health`

## Description

Provided for the monitoring service to Check whether the BE is alive，Be will respond if alive.

## Query parameters

None   

## Request body

None

## Response

    ```
    {"status": "OK","msg": "To Be Added"}
    ```

## Examples


    ```
    curl http://127.0.0.1:8040/api/health
    ```

