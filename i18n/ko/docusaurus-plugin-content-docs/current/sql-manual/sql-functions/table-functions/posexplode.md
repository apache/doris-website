---
{
    "title": "POSEXPLODE",
    "language": "ko",
    "description": "posexplode 테이블 함수는 <array> 열을 여러 행으로 확장하고 위치를 나타내는 열을 추가하여 STRUCT 타입을 반환합니다."
}
---

## 설명 {#description}
`posexplode` 테이블 함수는 `<array>` 열을 여러 행으로 확장하고 위치를 나타내는 열을 추가하여 [`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md) 타입을 반환합니다.
Lateral View와 함께 사용해야 하며, 여러 Lateral View를 지원합니다.
`posexplode`와 [`posexplode_outer`](./posexplode-outer.md)의 주요 차이점은 NULL 값을 처리하는 방식입니다.

## 구문 {#syntax}
```sql
POSEXPLODE(<array>)
```

## 매개변수 {#parameters}
- `<array>` Array 타입이며, NULL은 지원하지 않습니다.

## 반환값 {#return-value}
- 단일 열과 여러 행으로 구성된 STRUCT 데이터를 반환합니다. STRUCT는 두 개의 열로 구성됩니다:
1. 0부터 시작하여 1씩 증가하고 n – 1까지 이어지는 정수 열입니다. 여기서 n은 결과 행 수를 나타냅니다.
2. `<array>`의 모든 요소를 포함하는 열입니다.

- `<array>`가 NULL이거나 빈 배열(요소 수가 0)인 경우 0개의 행을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
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
1. 일반 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as pos, value;
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
    select  * from (select 1 as k1) t1 lateral view posexplode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got NULL
    ```
4. 배열이 아닌 매개변수
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got VARCHAR(3)
    ```
