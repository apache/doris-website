---
{
    "title": "ロードエラーに関するログのダウンロード",
    "language": "ja",
    "description": "ロードエラーに関するログファイルをダウンロードします。"
}
---

# ロードエラーに関するログのダウンロード

## リクエスト

`GET /api/_load_error_log?token={string}&file={string}`

## 説明

ロードエラーに関するログファイルをダウンロードします。

## クエリパラメータ

* `file`
    ログのパス

* `token`
    トークン

## リクエストボディ

なし

## レスポンス

    File of log

## 例


    ```
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```
