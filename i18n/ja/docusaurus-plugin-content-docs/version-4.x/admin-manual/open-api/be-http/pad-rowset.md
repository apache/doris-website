---
{
    "title": "Rowset の補填",
    "language": "ja",
    "description": "エラーレプリカの代替として、空の Rowset を一つ補填します。"
}
---

# Rowset の補填

## リクエスト

`POST /api/pad_rowset?tablet_id={int}&start_version={int}&end_version={int}`

## 説明

エラーレプリカの代替として、空の Rowset を一つ補填します。

## クエリパラメータ

* `tablet_id`
    タブレットの ID

* `start_version`
    開始バージョン

* `end_version`
    終了バージョン       


## リクエストボディ

なし

## レスポンス

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## 例


    ```
    curl -X POST "http://127.0.0.1:8040/api/pad_rowset?tablet_id=123456&start_version=1111111&end_version=1111112"

    ```
