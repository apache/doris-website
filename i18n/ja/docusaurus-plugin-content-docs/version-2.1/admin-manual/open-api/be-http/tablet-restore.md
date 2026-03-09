---
{
  "title": "タブレットを復元",
  "language": "ja",
  "description": "BEのtrash dirからタブレットデータを復元するには"
}
---
# Tablet復元

## リクエスト

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## 説明

BE上のtrash dirからタブレットデータを復元する

## クエリパラメータ

* `tablet_id`
    タブレットのID

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
## 例

    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```
