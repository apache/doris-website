---
{
    "title": "Help Action",
    "language": "zh-CN",
    "description": "用于通过模糊查询获取帮助。"
}
---

## Request

`GET /rest/v1/help`

## Description

用于通过模糊查询获取帮助。
    
## Path parameters

无

## Query parameters

* `query`

    需要进行匹配的关键词，如 array、select 等。

## Request body

无

## Response

```
{
    "msg":"success",
    "code":0,
    "data":{"fuzzy":"No Fuzzy Matching Topic","matching":"No Matching Category"},
    "count":0
}
```

