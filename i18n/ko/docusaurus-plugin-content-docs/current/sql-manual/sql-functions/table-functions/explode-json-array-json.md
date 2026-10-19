---
{
    "title": "EXPLODE_JSON_ARRAY_JSON",
    "language": "ko",
    "description": "explodejsonarrayjson 테이블 함수는 JSON 배열을 인수로 받습니다."
}
---

## 설명 {#description}
`explode_json_array_json` 테이블 함수는 JSON 배열을 인수로 받습니다. 내부적으로 JSON 배열을 배열 타입으로 변환한 다음 `explode_outer` 함수를 호출하여 처리합니다. 동작은 `explode(cast(<json_array> as Array<JSON>))`와 동일합니다.
이 함수는 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
```

## 매개변수 {#parameters}
- `<json>`: JSON 타입이며, 내용은 배열이어야 합니다.

## 반환값 {#return-value}
- `<json>`의 모든 요소로 구성된 단일 열, 여러 행의 결과를 반환합니다. 열 타입은 `Nullable<JSON>`입니다.
- `<json>`이 NULL이거나 빈 배열(요소 수가 0)인 경우 0개의 행을 반환합니다.

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
    select * from example lateral view explode_json_array_json('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | NULL            |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. 빈 배열
    ```sql
    select * from example lateral view explode_json_array_json('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 매개변수
    ```sql
    select * from example lateral view explode_json_array_json(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 배열이 아닌 매개변수
    ```sql
    select * from example lateral view explode_json_array_json('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
