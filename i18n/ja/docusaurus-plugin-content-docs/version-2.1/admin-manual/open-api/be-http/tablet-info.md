---
{
  "title": "タブレット情報を表示",
  "language": "ja",
  "description": "タブレット情報（IDとスキーマハッシュを含む）を表示します。"
}
---
# Tablet情報の表示

## リクエスト

`GET /tablets_json?limit={int}`

## 説明

IDとschema hashを含むTablet情報を表示します。

## クエリパラメータ

* `limit`
    出力するtablet数、オプションでデフォルトは1000。すべてのtabletを出力するには`all`を指定してください。

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
