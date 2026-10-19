---
{
    "title": "EXPLODE_OUTER",
    "language": "ko",
    "description": "explode 함수는 배열을 받아 배열의 각 요소를 별도의 행에 매핑합니다."
}
---

## 설명 {#description}
`explode` 함수는 배열을 받아 배열의 각 요소를 별도의 행에 매핑합니다. 중첩된 데이터 구조를 표준 평면 테이블 형식으로 펼치려면 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다. `explode_outer`와 [`explode`](./explode.md)의 주요 차이점은 NULL 값을 처리하는 방식입니다.

## 구문 {#syntax}
```sql
EXPLODE_OUTER(<array>[, ...])
```

## 가변 매개변수 {#variadic-parameters}
- `<array>`: 배열 타입입니다.

## 반환값 {#return-value}
- `<array>`의 모든 요소로 구성된 단일 열, 다중 행 결과를 반환합니다.
- `<array>`가 NULL이거나 빈 배열(요소 수가 0)이면 NULL을 포함하는 1개 행을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. `<array>` 매개변수가 [`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md) 타입이 아니면 오류가 발생합니다.
2. 배열 매개변수가 여러 개이면 요소가 가장 많은 배열에 따라 펼쳐지는 행 수가 결정됩니다. 요소가 적은 배열의 부족한 부분은 NULL로 채워집니다.

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
    select  * from example lateral view explode_outer([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    1 |
    |    1 |    2 |
    |    1 | NULL |
    |    1 |    4 |
    |    1 |    5 |
    +------+------+
    ```
2. 여러 매개변수
    ```sql
    select  * from example lateral view explode_outer([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
    ```
    ```text
    +------+------+------+------+------+
    | k1   | c0   | c1   | c2   | c3   |
    +------+------+------+------+------+
    |    1 | NULL |    1 | ab   | NULL |
    |    1 | NULL |    2 | cd   | NULL |
    |    1 | NULL | NULL | ef   |    1 |
    |    1 | NULL |    4 | NULL |    2 |
    |    1 | NULL |    5 | NULL |    3 |
    |    1 | NULL | NULL | NULL |    4 |
    |    1 | NULL | NULL | NULL |    5 |
    +------+------+------+------+------+
    ```
    > 펼친 후 행 수가 가장 많은 배열은 `[null, null, 1, 2, 3, 4, 5]` (c3)이며, 7개 행을 갖습니다. 따라서 최종 결과는 7개 행으로 구성되며, 나머지 세 배열(c0, c1, c2)은 부족한 행을 NULL로 채웁니다.
3. 빈 배열
    ```sql
    select  * from example lateral view explode_outer([]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. NULL 매개변수
    ```sql
    select  * from example lateral view explode_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
5. 배열이 아닌 매개변수
    ```sql
    select  * from example lateral view explode_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_outer(VARCHAR(3))
    ```
