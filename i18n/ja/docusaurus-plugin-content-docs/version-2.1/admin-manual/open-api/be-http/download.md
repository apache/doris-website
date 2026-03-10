---
{
  "title": "ロードエラーに関するダウンロードLog",
  "language": "ja",
  "description": "ロードエラーに関するログファイルをダウンロード"
}
---
# Load Error に関するログのダウンロード

## Request

`GET /api/_load_error_log?token={string}&file={string}`

## Description

load error に関するログファイルをダウンロードします

## Query parameters

* `file`
    ログのパス

* `token`
    token         

## Request body

None

## Response

    ログのファイル

## Examples

    ```
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```
