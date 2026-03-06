---
{
  "title": "タブレット情報を表示",
  "language": "ja",
  "description": "ID とスキーマハッシュを含む Tablet 情報を表示します。"
}
---
# タブレット情報の表示

## リクエスト

`GET /tablets_json?limit={int}`

## 説明

ID とスキーマハッシュを含むタブレット情報を表示します。

## クエリパラメータ

* `limit`
    出力するタブレット数。オプションでデフォルトは 1000。すべてのタブレットを出力するには `all` を指定します。

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
## 例

    ```
    curl http://127.0.0.1:8040/tablets_json?limit=all

    ```
