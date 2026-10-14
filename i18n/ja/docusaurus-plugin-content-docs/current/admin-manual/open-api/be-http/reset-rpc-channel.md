---
{
    "title": "スタブキャッシュのリセット",
    "language": "ja",
    "description": "brpc の接続キャッシュをリセットします"
}
---

# スタブキャッシュのリセット

## リクエスト

`GET /api/reset_rpc_channel/{endpoints}`

## 説明

brpc の接続キャッシュをリセットします。

## パスパラメータ

* `endpoints`
    - `all`: すべてのキャッシュをクリアします
    - `host1:port1,host2:port2`: 指定した対象のキャッシュをクリアします

## リクエストボディ

なし

## レスポンス

    ```
    {
        "msg":"success",
        "code":0,
        "data": "no cached channel.",
        "count":0
    }
    ```
## 使用例


    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/all
    ```
    
    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/1.1.1.1:8080,2.2.2.2:8080
    ```
