---
{
  "title": "パッドローセット",
  "language": "ja",
  "description": "エラーレプリカの代替として、1つの空のrowsetを1つパディングする。"
}
---
# Pad Rowset

## Request

`POST /api/pad_rowset?tablet_id={int}&start_version={int}&end_version={int}`

## Description

エラーレプリカの代替として1つの空のrowsetをpadします。

## Query parameters

* `tablet_id`
    tabletのID

* `start_version`
    開始バージョン

* `end_version`
    終了バージョン

## Request body

なし

## Response

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
