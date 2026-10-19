---
{
    "title": "EXPLODE_JSON_ARRAY_INT",
    "language": "ko",
    "description": "explodejsonarrayint 테이블 함수는 JSON 배열을 입력받습니다."
}
---

## 설명 {#description}
`explode_json_array_int` 테이블 함수는 JSON 배열을 입력받습니다. 내부적으로 JSON 배열을 배열 타입으로 변환한 다음 `explode_outer` 함수를 호출하여 처리합니다. 동작은 `explode(cast(<json_array> as Array<BIGINT>))`와 동일합니다.
이 함수는 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_JSON_ARRAY_INT(<json>)
```

## 매개변수 {#parameters}
- `<json>` JSON 타입이며, 내용은 배열이어야 합니다.

## 반환값 {#return-value}
- `<json>`의 모든 요소로 구성된 단일 열, 여러 행의 결과를 반환합니다. 열 타입은 `Nullable<BIGINT>`입니다.
- `<json>`이 NULL이거나 빈 배열(요소 수가 0)이면 0개 행을 반환합니다.
- JSON 배열의 요소가 INT 타입이 아닌 경우, 함수는 해당 요소를 INT로 변환하려고 시도합니다. INT로 변환할 수 없는 요소는 NULL로 변환됩니다. 타입 변환 규칙은 [JSON 타입 변환](../../basic-element/sql-data-types/conversion/json-conversion.md)을 참조하세요.

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
    select * from example lateral view explode_json_array_int('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    5 |
    |    1 | NULL |
    +------+------+
    ```
2. INT가 아닌 타입
    ```sql
    select * from example 
        lateral view 
        explode_json_array_int('["abc", "123.4", 9223372036854775808.0, 9223372036854775295.999999]') t2 as c;
    ```
    ```text
    +------+---------------------+
    | k1   | c                   |
    +------+---------------------+
    |    1 |                NULL |
    |    1 |                 123 |
    |    1 |                NULL |
    |    1 | 9223372036854774784 |
    +------+---------------------+
    ```
    > `9223372036854775808.0`은 `BIGINT`의 유효 범위를 초과하므로 NULL로 변환됩니다.
    > 문자열 "123.4"는 123으로 변환됩니다.
    > 문자열 "abc"는 INT로 변환할 수 없으므로 결과는 NULL입니다.
3. 빈 배열
    ```sql
    select * from example lateral view explode_json_array_int('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 매개변수
    ```sql
    select * from example lateral view explode_json_array_int(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 배열이 아닌 매개변수
    ```sql
    select * from example lateral view explode_json_array_int('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
