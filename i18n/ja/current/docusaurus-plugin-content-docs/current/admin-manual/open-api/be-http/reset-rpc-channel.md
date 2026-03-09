---
{
  "title": "スタブキャッシュをリセット",
  "language": "ja",
  "description": "brpcの接続キャッシュをリセットする"
}
---
# Reset Stub Cache

## Request

`GET /api/reset_rpc_channel/{endpoints}`

## Description

brpcの接続キャッシュをリセットします

## Path parameters

* `endpoints`
    - `all`: すべてのキャッシュをクリア
    - `host1:port1,host2:port2`: 指定されたターゲットのキャッシュをクリア

## Request body

なし

## Response

    ```
    {
        "msg":"success",
        "code":0,
        "data": "no cached channel.",
        "count":0
    }
    ```
## 例

    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/all
    ```
    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/1.1.1.1:8080,2.2.2.2:8080
    ```
