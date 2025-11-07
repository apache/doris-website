---
{
    "title": "Help Action",
    "language": "en"
}
---

# Help Action

## Request

`GET /rest/v1/help`

## Description

Used to obtain help through fuzzy query.
    
## Path parameters

None

## Query parameters

* `query`

    Keywords to be matched, such as array and select.

## Request body

None

## Response

```
{
    "msg":"success",
    "code":0,
    "data":{"fuzzy":"No Fuzzy Matching Topic","matching":"No Matching Category"},
    "count":0
}
```

