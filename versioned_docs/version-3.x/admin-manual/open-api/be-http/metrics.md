---
{
    "title": "Metrics",
    "language": "en"
}
---

# Metrics

## Request

`GET /metrics?type={enum}&with_tablet={bool}`

## Description

Provided for prometheus

## Query parameters

* `type`
    Output style, Optional with default `all` and the following values:
    - `core`: Only core items
    - `json`: Json format

* `with_tablet`
    Whether to output tablet-related items, Optional with default `false`.

## Request body

None

## Response

    ```
    doris_be__max_network_receive_bytes_rate LONG 60757
    doris_be__max_network_send_bytes_rate LONG 16232
    doris_be_process_thread_num LONG 1120
    doris_be_process_fd_num_used LONG 336
    ，，，

    ```
## Examples


    ```
        curl "http://127.0.0.1:8040/metrics?type=json&with_tablet=true"
    ```

