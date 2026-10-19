---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "ko",
    "description": "notnullorempty 함수는 주어진 값이 NULL이 아니고 비어 있지 않은지 확인하는 데 사용됩니다. 입력값이 NULL도 아니고 비어 있지도 않으면,"
}
---

## 설명 {#description}

`not_null_or_empty` 함수는 주어진 값이 NULL이 아니고 비어 있지 않은지 확인하는 데 사용됩니다. 입력값이 NULL도 아니고 비어 있지도 않으면 true를 반환하고, 그렇지 않으면 false를 반환합니다.

## 구문 {#syntax}

```sql
NOT_NULL_OR_EMPTY (<str>)
```

## 매개변수 {#parameters}
- `<str>`: String 타입으로, NULL 또는 빈 문자열인지 확인할 문자열입니다.

## 반환 값 {#return-value}
문자열이 빈 문자열이거나 NULL이면 false를 반환하고, 그렇지 않으면 true를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    select not_null_or_empty(null), not_null_or_empty(""), not_null_or_empty(" ");
    ```
    ```text
    +-------------------------+-----------------------+------------------------+
    | not_null_or_empty(null) | not_null_or_empty("") | not_null_or_empty(" ") |
    +-------------------------+-----------------------+------------------------+
    |                       0 |                     0 |                      1 |
    +-------------------------+-----------------------+------------------------+
    ```
