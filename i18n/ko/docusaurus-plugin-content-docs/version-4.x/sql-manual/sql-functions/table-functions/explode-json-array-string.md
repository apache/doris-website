---
{
    "title": "EXPLODE_JSON_ARRAY_STRING",
    "language": "ko",
    "description": "explodejsonarraystring 테이블 함수는 JSON 배열을 인수로 받습니다."
}
---

## 설명 {#description}
`explode_json_array_string` 테이블 함수는 JSON 배열을 인수로 받습니다. 내부적으로 JSON 배열을 배열 타입으로 변환한 다음 `explode_outer` 함수를 호출하여 처리합니다. 동작은 `explode(cast(<json_array> as Array<STRING>))`와 동일합니다.
이 함수는 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
```

## 매개변수 {#parameters}
- `<json>` JSON 타입이며, 내용은 배열이어야 합니다.

## 반환 값 {#return-value}
- `<json>`의 모든 요소를 하나의 열과 여러 행으로 반환합니다. 열의 타입은 `Nullable<STRING>`입니다.
- `<json>`이 NULL이거나 빈 배열(요소 수가 0)인 경우 0개의 행을 반환합니다.
- JSON 배열의 요소가 STRING 타입이 아니면 STRING으로 변환을 시도합니다. STRING으로 변환하지 못하면 해당 요소는 NULL로 변환됩니다. 타입 변환 규칙은 [JSON 타입 변환](../../basic-element/sql-data-types/conversion/json-conversion.md)을 참조하세요.

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
    select * from example lateral view explode_json_array_string('[4, "5", "abc", 5.23, null]') t2 as c;
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
    select * from example lateral view explode_json_array_string('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 매개변수
    ```sql
    select * from example lateral view explode_json_array_string(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 배열이 아닌 매개변수
    ```sql
    select * from example lateral view explode_json_array_string('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
