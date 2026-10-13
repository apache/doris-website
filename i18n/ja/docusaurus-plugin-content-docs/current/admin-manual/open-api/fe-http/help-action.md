---
{
    "title": "ヘルプアクション",
    "language": "ja",
    "description": "あいまい検索でヘルプを取得します。"
}
---

# ヘルプアクション

## リクエスト

`GET /rest/v1/help`

## 説明

あいまい検索でヘルプを取得します。
    
## パスパラメータ

なし

## クエリパラメータ

* `query`

    照合するキーワードです。例: array、select。

## リクエストボディ

なし

## レスポンス

```
{
    "msg":"success",
    "code":0,
    "data":{"fuzzy":"No Fuzzy Matching Topic","matching":"No Matching Category"},
    "count":0
}
```
