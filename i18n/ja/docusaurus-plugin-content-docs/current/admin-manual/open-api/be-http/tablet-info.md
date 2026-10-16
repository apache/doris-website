---
{
    "title": "Tablet 情報の表示",
    "language": "ja",
    "description": "ID とスキーマハッシュを含む Tablet 情報を表示します。"
}
---

# Tablet 情報の表示

## リクエスト

`GET /tablets_json?limit={int}`

## 説明

ID とスキーマハッシュを含む Tablet 情報を表示します。

## クエリパラメータ

* `limit`
    出力する Tablet の数を指定します。省略可能で、デフォルトは 1000 です。すべての Tablet を出力するには `all` を指定します。

## リクエストボディ

なし

## レスポンス

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
## 使用例


    ```
    curl http://127.0.0.1:8040/tablets_json?limit=all

    ```
