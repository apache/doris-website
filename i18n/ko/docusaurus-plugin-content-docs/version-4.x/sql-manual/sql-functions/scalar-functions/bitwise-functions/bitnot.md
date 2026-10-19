---
{
    "title": "BITNOT",
    "language": "ko",
    "description": "정수에 대해 비트 NOT 연산을 수행합니다."
}
---

## 설명 {#description}
정수에 대해 비트 NOT 연산을 수행합니다.

지원되는 정수 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## 구문 {#syntax}
```sql
BITNOT(<x>)
```

## 매개변수 {#parameters}
- `<x>`: 연산을 수행할 정수입니다.

## 반환 값 {#return-value}
정수에 대한 비트 NOT 연산의 결과를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    select BITNOT(7), BITNOT(-127);
    ```
    ```text
    +-----------+--------------+
    | BITNOT(7) | BITNOT(-127) |
    +-----------+--------------+
    |        -8 |          126 |
    +-----------+--------------+
    ```
2. NULL 인수
    ```sql
    select BITNOT(NULL);
    ```
    ```text
    +--------------+
    | BITNOT(NULL) |
    +--------------+
    |         NULL |
    +--------------+
    ```
