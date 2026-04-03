---
{
  "title": "チェックサム",
  "language": "ja",
  "description": "チェックサム"
}
---
# Checksum

## リクエスト

`GET /api/checksum?tablet_id={int}&version={int}&schema_hash={int}`

## 説明

Checksum

## クエリパラメータ

* `tablet_id`
    チェック対象のタブレットのID

* `version`
    検証対象のタブレットのバージョン

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
