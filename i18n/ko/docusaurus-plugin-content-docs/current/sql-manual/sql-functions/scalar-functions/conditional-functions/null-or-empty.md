---
{
    "title": "NULL_OR_EMPTY",
    "language": "ko",
    "description": "nullorempty 함수는 주어진 값이 NULL이거나 비어 있는지 확인하는 데 사용됩니다. 입력값이 NULL이거나 비어 있으면,"
}
---

## 설명 {#description}

`null_or_empty` 함수는 주어진 값이 NULL이거나 비어 있는지 확인하는 데 사용됩니다. 입력값이 NULL이거나 비어 있으면 true를 반환하고, 그렇지 않으면 false를 반환합니다.

## 구문 {#syntax}

```sql
NULL_OR_EMPTY (<str>)
```

## 매개변수 {#parameters}
- `<str>`: 문자열 타입으로, NULL이거나 비어 있는지 확인할 문자열입니다.

## 반환값 {#return-value}
문자열이 빈 문자열이거나 NULL이면 true를 반환하고, 그렇지 않으면 false를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    select null_or_empty(null), null_or_empty(""), null_or_empty(" ");
    ```
    ```text
    +---------------------+-------------------+--------------------+
    | null_or_empty(null) | null_or_empty("") | null_or_empty(" ") |
    +---------------------+-------------------+--------------------+
    |                   1 |                 1 |                  0 |
    +---------------------+-------------------+--------------------+
    ```
