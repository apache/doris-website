---
{
    "title": "도움말 액션",
    "language": "ko",
    "description": "퍼지 쿼리로 도움말을 검색하는 데 사용됩니다."
}
---

# 도움말 액션 {#help-action}

## 요청 {#request}

`GET /rest/v1/help`

## 설명 {#description}

퍼지 쿼리로 도움말을 검색하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `query`

    array, select 등 일치하는 항목을 검색할 키워드입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
    "msg":"success",
    "code":0,
    "data":{"fuzzy":"No Fuzzy Matching Topic","matching":"No Matching Category"},
    "count":0
}
```
