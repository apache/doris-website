---
{
  "title": "タブレットを再読み込み",
  "language": "ja",
  "description": "タブレットを再読み込みする"
}
---
# Reload Tablet

## Request

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## Description

tabletを再読み込みする

## Query parameters

* `tablet_id`
    tabletのID

* `schema_hash`
    スキーマハッシュ      

* `path`
    ファイルのパス    


## Request body

なし

## Response

    ```
    load header succeed
    ```
## 例

    ```
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```
