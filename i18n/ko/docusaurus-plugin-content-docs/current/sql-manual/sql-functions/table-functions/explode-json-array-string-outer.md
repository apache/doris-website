---
{
    "title": "EXPLODE_JSON_ARRAY_STRING_OUTER",
    "language": "ko",
    "description": "explodejsonarraystringouter 테이블 함수는 JSON 배열을 입력으로 받습니다."
}
---

## 설명 {#description}
`explode_json_array_string_outer` 테이블 함수는 JSON 배열을 입력으로 받습니다. JSON 배열을 배열 타입으로 변환한 다음 `explode_outer` 함수를 호출하여 처리합니다. 동작은 `explode_outer(cast(<json_array> as Array<STRING>))`와 동일합니다.
[`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```

## 매개변수 {#parameters}
- `<json>`: JSON 타입이며, 내용은 배열이어야 합니다.

## 반환 값 {#return-value}
- `<json>`의 모든 요소로 구성된 단일 열, 여러 행의 결과를 반환합니다. 열 타입은 `Nullable<STRING>`입니다.
- `<json>`이 NULL이거나 빈 배열(요소 수가 0)인 경우 NULL이 포함된 1개의 행을 반환합니다.
- JSON 배열의 요소가 STRING 타입이 아닌 경우 함수는 해당 요소를 STRING으로 변환하려고 시도합니다. STRING으로 변환하지 못하면 해당 요소는 NULL로 변환됩니다. 타입 변환 규칙은 [JSON 타입 변환](../../basic-element/sql-data-types/conversion/json-conversion.md)을 참조하세요.

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
    select * from example lateral view explode_json_array_string_outer('[4, "5", "abc", 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | 4    |
    |    1 | 5    |
    |    1 | abc  |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. 빈 배열
    ```sql
    select * from example lateral view explode_json_array_string_outer('[]') t2 as c;
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
    select * from example lateral view explode_json_array_string_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 배열이 아닌 매개변수
    ```sql
    select * from example lateral view explode_json_array_string_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
