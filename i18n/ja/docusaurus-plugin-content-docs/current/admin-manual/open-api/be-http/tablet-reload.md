---
{
    "title": "タブレットの再読み込み",
    "language": "ja",
    "description": "タブレットを再読み込みします"
}
---

# タブレットの再読み込み

## リクエスト

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## 説明

タブレットを再読み込みします。

## クエリパラメータ

* `tablet_id`
    タブレットの ID

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
