---
{
    "title": "メトリクス",
    "language": "ja",
    "description": "Prometheus 向けのメトリクスを提供します"
}
---

# メトリクス

## リクエスト

`GET /metrics?type={enum}&with_tablet={bool}`

## 説明

Prometheus 向けのメトリクスを提供します。

## クエリパラメータ

* `type`
    出力形式。省略可能で、デフォルトは `all` です。以下の値を指定できます。
    - `core`: コア項目のみ
    - `json`: JSON 形式

* `with_tablet`
    タブレットに関連する項目を出力するかどうかを指定します。省略可能で、デフォルトは `false` です。

## リクエストボディ

なし

## レスポンス

    ```
    doris_be__max_network_receive_bytes_rate LONG 60757
    doris_be__max_network_send_bytes_rate LONG 16232
    doris_be_process_thread_num LONG 1120
    doris_be_process_fd_num_used LONG 336
    ...

    ```
## 例


    ```
        curl "http://127.0.0.1:8040/metrics?type=json&with_tablet=true"
    ```
