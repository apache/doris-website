---
{
    "title": "BIT_COUNT",
    "language": "ko",
    "description": "정수 값의 이진 표현에서 1인 비트의 개수를 반환합니다."
}
---

## 설명 {#description}

정수 값의 이진 표현에서 1인 비트의 개수를 반환합니다. 이 함수를 사용하면 정수의 이진 표현에서 "활성" 비트의 개수를 빠르게 셀 수 있으며, 이는 데이터 분포를 분석하거나 특정 비트 연산을 수행할 때 유용합니다.

## 구문 {#syntax}
```sql
BIT_COUNT(<x>)
```

## 매개변수 {#parameters}
- `<x>`: 이진 표현에서 1인 비트의 개수를 셀 정수입니다. 지원되는 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## 반환값 {#return-value}

`<x>`의 이진 표현에서 1인 비트의 개수를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    select BIT_COUNT(0), BIT_COUNT(8), BIT_COUNT(-1);
    ```
    ```text
    +--------------+--------------+---------------+
    | BIT_COUNT(0) | BIT_COUNT(8) | BIT_COUNT(-1) |
    +--------------+--------------+---------------+
    |            0 |            1 |             8 |
    +--------------+--------------+---------------+
    ```
2. NULL 인수
    ```sql
    select BIT_COUNT(NULL);
    ```
    ```text
    +-----------------+
    | BIT_COUNT(NULL) |
    +-----------------+
    |            NULL |
    +-----------------+
    ```
