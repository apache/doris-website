---
{
  "title": "ヘルプアクション",
  "language": "ja",
  "description": "ファジークエリを通じてヘルプを取得するために使用されます。"
}
---
# Help Action

## Request

`GET /rest/v1/help`

## 詳細

あいまい検索を通じてヘルプを取得するために使用されます。
    
## Path parameters

なし

## Query parameters

* `query`

    マッチさせるキーワード（arrayやselectなど）。

## Request body

なし

## Response

```
{
    "msg":"success",
    "code":0,
    "data":{"fuzzy":"No Fuzzy Matching Topic","matching":"No Matching Category"},
    "count":0
}
```
