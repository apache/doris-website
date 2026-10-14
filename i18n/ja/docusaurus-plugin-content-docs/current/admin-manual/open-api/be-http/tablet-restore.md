---
{
    "title": "タブレットの復元",
    "language": "ja",
    "description": "BE のゴミ箱ディレクトリからタブレットデータを復元します"
}
---

# タブレットの復元

## リクエスト

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## 説明

BE のゴミ箱ディレクトリからタブレットデータを復元します。

## クエリパラメータ

* `tablet_id`
    タブレットの ID

* `schema_hash`
    スキーマハッシュ


## リクエストボディ

なし

## レスポンス

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## 使用例


    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```
