---
{
  "title": "タブレットを再起動",
  "language": "ja",
  "description": "タブレットを再読み込み"
}
---
# Reload Tablet

## Request

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## 説明

tabletを再読み込みします

## クエリパラメータ

* `tablet_id`
    tabletのID

* `schema_hash`
    スキーマハッシュ

* `path`
    ファイルのパス


## リクエストボディ

なし

## レスポンス

    ```
    load header succeed
    ```
## 例

    ```
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```
