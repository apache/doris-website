---
{
  "title": "メトリクス",
  "language": "ja",
  "description": "Prometheusに提供される"
}
---
# Metrics

## Request

`GET /metrics?type={enum}&with_tablet={bool}`

## Description

prometheusに提供

## Query parameters

* `type`
    出力スタイル、オプション、デフォルト値は`all`で以下の値を指定可能：
    - `core`: コア項目のみ
    - `json`: Json形式

* `with_tablet`
    tablet関連項目を出力するかどうか、オプション、デフォルト値は`false`。

## Request body

なし

## Response

    ```
    doris_be__max_network_receive_bytes_rate LONG 60757
    doris_be__max_network_send_bytes_rate LONG 16232
    doris_be_process_thread_num LONG 1120
    doris_be_process_fd_num_used LONG 336
    ，，，

    ```
## 例

    ```
        curl "http://127.0.0.1:8040/metrics?type=json&with_tablet=true"
    ```
