---
{
    "title": "View Tablet Info",
    "language": "en",
    "description": "View Tablet Info, including ID and schema hash."
}
---

# View Tablet Info

## Request

`GET /tablets_json?limit={int}`

## Description

View Tablet Info, including ID and schema hash.

## Query parameters

* `limit`
    Number of tablets output, Optional with default 1000. Take `all` to output all tablets.

## Request body

None

## Response

    ```
    {
        msg: "OK",
        code: 0,
        data: {
            host: "10.38.157.107",
            tablets: [
                {
                    tablet_id: 11119,
                    schema_hash: 714349777
                },

                    ...

                {
                    tablet_id: 11063,
                    schema_hash: 714349777
                }
            ]
        },
        count: 30
    }
    ```
## Examples


    ```
    curl http://127.0.0.1:8040/tablets_json?limit=all

    ```
