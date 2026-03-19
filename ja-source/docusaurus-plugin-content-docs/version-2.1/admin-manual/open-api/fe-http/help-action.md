---
{
  "title": "ヘルプアクション",
  "language": "ja",
  "description": "あいまい検索を通じてヘルプを取得するために使用されます。"
}
---
# Help Action

## リクエスト

`GET /rest/v1/help`

## 説明

あいまい検索を通じてヘルプを取得するために使用されます。
    
## パスパラメータ

なし

## クエリパラメータ

* `query`

    マッチさせるキーワード（arrayやselectなど）。

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
