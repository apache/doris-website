---
{
    "title": "BITOR",
    "language": "ko",
    "description": "두 정수에 대해 비트 OR 연산을 수행합니다."
}
---

## 설명 {#description}
두 정수에 대해 비트 OR 연산을 수행합니다.

지원되는 정수 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## 구문 {#syntax}
```sql
BITOR(<lhs>, <rhs>)
```

## 매개변수 {#parameters}
- `<lhs>`: 연산에 사용할 첫 번째 정수입니다.
- `<rhs>`: 연산에 사용할 두 번째 정수입니다.

## 반환값 {#return-value}

두 정수 간 비트 OR 연산의 결과를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    select BITOR(3,5), BITOR(4,7);
    ```
    ```text
    +------------+------------+
    | BITOR(3,5) | BITOR(4,7) |
    +------------+------------+
    |          7 |          7 |
    +------------+------------+
    ```
2. NULL 인수
    ```sql
    select BITOR(3, NULL), BITOR(NULL, 5), BITOR(NULL, NULL);
    ```
    ```text
    +----------------+----------------+-------------------+
    | BITOR(3, NULL) | BITOR(NULL, 5) | BITOR(NULL, NULL) |
    +----------------+----------------+-------------------+
    |           NULL |           NULL |              NULL |
    +----------------+----------------+-------------------+
    ```
