---
{
    "title": "Download Log about Load Error",
    "language": "en",
    "description": "Download log file about load error"
}
---

# Download Log about Load Error

## Request

`GET /api/_load_error_log?token={string}&file={string}`

## Description

Download log file about load error

## Query parameters

* `file`
    Path of log

* `token`
    token         

## Request body

None

## Response

    File of log

## Examples


    ```
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```

