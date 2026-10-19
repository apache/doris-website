---
{
    "title": "POSEXPLODE_OUTER",
    "language": "ko",
    "description": "posexplodeouter 테이블 함수는 <array> 열을 여러 행으로 확장하고 위치를 나타내는 열을 추가하며, STRUCT 타입을 반환합니다."
}
---

## 설명 {#description}
`posexplode_outer` 테이블 함수는 `<array>` 열을 여러 행으로 확장하고 위치를 나타내는 열을 추가하며, [`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md) 타입을 반환합니다.
Lateral View와 함께 사용해야 하며, 여러 Lateral View를 지원합니다.
`posexplode_outer`와 [`posexplode`](./posexplode.md)의 주요 차이점은 NULL 값을 처리하는 방식입니다.

## 구문 {#syntax}
```sql
POSEXPLODE_OUTER(<array>)
```

## 매개변수 {#parameters}
- `<array>` Array 타입이며, NULL은 지원하지 않습니다.

## 반환 값 {#return-value}
- 단일 열로 구성된 여러 행의 STRUCT 데이터를 반환합니다. STRUCT는 두 개의 열로 구성됩니다:
    1. 0부터 시작하여 1씩 증가하면서 n – 1까지의 정수를 담는 열입니다. 여기서 n은 결과 행의 수를 나타냅니다.
    2. `<array>`의 모든 요소를 담는 열입니다.
- `<array>`가 NULL이거나 빈 배열(요소 수가 0)이면 NULL을 포함하는 1개의 행을 반환합니다.

## 사용 시 주의 사항 {#usage-notes}
1. `<array>`는 NULL이거나 다른 타입일 수 없으며, 이 경우 오류가 발생합니다.

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
1. 일반적인 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+-----------------------+
    | k1   | c                     |
    +------+-----------------------+
    |    1 | {"pos":0, "col":1}    |
    |    1 | {"pos":1, "col":2}    |
    |    1 | {"pos":2, "col":null} |
    |    1 | {"pos":3, "col":4}    |
    |    1 | {"pos":4, "col":5}    |
    +------+-----------------------+
    ```
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer([1, 2, null, 4, 5]) t2 as pos, value;
    ```
    ```text
    +------+------+-------+
    | k1   | pos  | value |
    +------+------+-------+
    |    1 |    0 |     1 |
    |    1 |    1 |     2 |
    |    1 |    2 |  NULL |
    |    1 |    3 |     4 |
    |    1 |    4 |     5 |
    +------+------+-------+
    ```
2. 빈 배열
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer([]) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view posexplode_outer(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode_outer function but got NULL
    ```
4. 배열이 아닌 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode_outer function but got VARCHAR(3)
    ```
