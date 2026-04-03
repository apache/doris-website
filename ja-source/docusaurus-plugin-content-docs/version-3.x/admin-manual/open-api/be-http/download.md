---
{
  "title": "ロードエラーに関するDownload Log",
  "language": "ja",
  "description": "負荷エラーに関するログファイルをダウンロード"
}
---
# 読み込みエラーに関するログのダウンロード

## リクエスト

`GET /api/_load_error_log?token={string}&file={string}`

## 説明

読み込みエラーに関するログファイルをダウンロードします

## クエリパラメータ

* `file`
    ログのパス

* `token`
    token         

## リクエストボディ

なし

## レスポンス

    ログのファイル

## 例

    ```
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```
