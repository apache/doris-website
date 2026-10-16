---
{
    "title": "チェックサム",
    "language": "ja",
    "description": "チェックサム"
}
---

# チェックサム

## リクエスト

`GET /api/checksum?tablet_id={int}&version={int}&schema_hash={int}`

## 説明

チェックサム

## クエリパラメータ

* `tablet_id`
    検査対象のタブレットの ID

* `version`
    検証するタブレットのバージョン 

* `schema_hash`
    スキーマハッシュ

## リクエストボディ

なし

## レスポンス

    ```
    1843743562
    ```
## 例


    ```
    curl "http://127.0.0.1:8040/api/checksum?tablet_id=1&version=1&schema_hash=-1"
    
    ```
