---
{
    "title": "EXPLODE_JSON_ARRAY_DOUBLE",
    "language": "ko",
    "description": "explodejsonarraydouble 테이블 함수는 JSON 배열을 입력받습니다."
}
---

## 설명 {#description}
`explode_json_array_double` 테이블 함수는 JSON 배열을 입력받습니다. 내부적으로 JSON 배열을 배열 타입으로 변환한 다음 `explode_outer` 함수를 호출하여 처리합니다. 동작은 `explode(cast(<json_array> as Array<DOUBLE>))`와 동일합니다.
이 함수는 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
```

## 매개변수 {#parameters}
- `<json>` JSON 타입이며, 내용은 배열이어야 합니다.

## 반환 값 {#return-value}
- `<json>`의 모든 요소로 구성된 단일 열, 여러 행의 결과를 반환합니다. 열 타입은 `Nullable<DOUBLE>`입니다.
- `<json>`이 NULL이거나 빈 배열(요소 수가 0)이면 0개의 행을 반환합니다.
- JSON 배열의 요소가 DOUBLE 타입이 아니면 DOUBLE로 변환을 시도합니다. DOUBLE로 변환할 수 없는 요소는 NULL로 변환됩니다. 타입 변환 규칙은 [JSON 타입 변환](../../basic-element/sql-data-types/conversion/json-conversion.md)을 참조하세요.

## 예제 {#examples}
0. 데이터 준비
    ```sql
    create table example(
        id int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 일반 매개변수
    ```sql
    select * from example lateral view explode_json_array_double('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | id   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. DOUBLE 타입
    ```sql
    select * from example
        lateral view 
        explode_json_array_double('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | id   | c                      |
    +------+------------------------+
    |    1 |                123.445 |
    |    1 |  9.223372036854776e+18 |
    |    1 |  9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    +------+------------------------+
    ```
3. 빈 배열
    ```sql
    select * from example lateral view explode_json_array_double('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 매개변수
    ```sql
    select * from example lateral view explode_json_array_double(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 배열이 아닌 매개변수
    ```sql
    select * from example lateral view explode_json_array_double('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
