---
{
    "title": "EXPLODE_NUMBERS",
    "language": "ko",
    "description": "explodenumbers 함수는 정수를 받아 해당 범위의 각 숫자를 별도의 행에 매핑합니다."
}
---

## 설명 {#description}
`explode_numbers` 함수는 정수를 받아 해당 범위의 각 숫자를 별도의 행에 매핑합니다. 중첩된 데이터 구조를 표준적인 평면 테이블 형식으로 펼치려면 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다. `explode_numbers`와 [`explode_numbers_outer`](./explode-numbers-outer.md)의 주요 차이점은 NULL 값을 처리하는 방식입니다.

## 구문 {#syntax}
```sql
EXPLODE_NUMBERS(<int>)
```

## 매개변수 {#parameters}
- `<int>` 정수형

## 반환 값 {#return-value}
- 범위가 `[0, n)`인 정수 열을 반환하며, 열 타입은 `INT`입니다.
- `<int>`가 NULL이거나 0 또는 음수이면 0개의 행을 반환합니다.


## 예제 {#examples}
0. 데이터 준비
    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 일반 매개변수
    ```sql
    select  * from example lateral view explode_numbers(10) t2 as c;
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
    select  * from example lateral view explode_numbers(0) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. 매개변수가 NULL인 경우
    ```sql
    select  * from example lateral view explode_numbers(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 매개변수가 음수인 경우
    ```sql
    select  * from example lateral view explode_numbers(-1) t2 as c;
    ```
    ```text
    Empty set (0.04 sec)
    ```
