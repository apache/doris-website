---
{
  "title": "スナップショットを作成",
  "language": "ja",
  "description": "タブレットのスナップショットを作成する"
}
---
# スナップショット作成

## リクエスト

`GET /api/snapshot?tablet_id={int}&schema_hash={int}"`

## 説明

tabletのスナップショットを作成する

## クエリパラメータ

* `tablet_id`
    tabletのID

* `schema_hash`
    スキーマハッシュ         


## リクエストボディ

なし

## レスポンス

    ```
    /path/to/snapshot
    ```
## 例

    ```
    curl "http://127.0.0.1:8040/api/snapshot?tablet_id=123456&schema_hash=1111111"

    ```
