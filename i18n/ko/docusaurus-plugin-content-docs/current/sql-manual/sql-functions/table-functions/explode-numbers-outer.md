---
{
    "title": "EXPLODE_NUMBERS_OUTER",
    "language": "ko",
    "description": "explodenumbersouter 함수는 정수를 받아 해당 범위의 각 숫자를 개별 행에 매핑합니다."
}
---

## 설명 {#description}
`explode_numbers_outer` 함수는 정수를 받아 해당 범위의 각 숫자를 개별 행에 매핑합니다. 중첩된 데이터 구조를 표준적인 평면 테이블 형식으로 변환하려면 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다. `explode_numbers_outer`와 [`explode_numbers`](./explode-numbers.md)의 주요 차이점은 NULL 값을 처리하는 방식입니다.

## 구문 {#syntax}
```sql
EXPLODE_NUMBERS_OUTER(<int>)
```

## 매개변수 {#parameters}
- `<int>` 정수 타입

## 반환 값 {#return-value}
- 정수 컬럼 `[0, n)`을 반환하며, 컬럼 타입은 `Nullable<INT>`입니다.
- `<int>`가 NULL, 0 또는 음수이면 NULL을 포함하는 1개 행을 반환합니다.

## 예제 {#examples}
1. 일반적인 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(10) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    0 |
    |    1 |    1 |
    |    1 |    2 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |    7 |
    |    1 |    8 |
    |    1 |    9 |
    +------+------+
    ```
2. 매개변수가 0인 경우
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(0) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULL 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 음수 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(-1) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
