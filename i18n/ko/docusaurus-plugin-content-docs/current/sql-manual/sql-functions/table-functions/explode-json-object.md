---
{
    "title": "EXPLODE_JSON_OBJECT",
    "language": "ko",
    "description": "explodejsonobject 테이블 함수는 JSON 객체를 여러 행으로 확장하며, 각 행에는 키-값 쌍이 포함됩니다."
}
---

# EXPLODE_JSON_OBJECT {#explode_json_object}
## 설명 {#description}
`explode_json_object` 테이블 함수는 JSON 객체를 여러 행으로 확장하며, 각 행에는 키-값 쌍이 포함됩니다.
주로 JSON 객체를 쿼리하기 쉬운 형식으로 변환하는 데 사용합니다. 이 함수는 요소가 있는 JSON 객체만 지원합니다.
[`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_JSON_OBJECT(<json>)
```

## 매개변수 {#parameters}
- `<json>`: JSON 타입이며, 내용은 JSON 객체여야 합니다.

## 반환값 {#return-value}
- `<json>`의 모든 요소로 구성된 단일 열, 여러 행의 결과를 반환합니다. 열 타입은 `Nullable<Struct<String, JSON>>`입니다.
- `<json>`이 NULL이거나 JSON 객체가 아닌 경우(예: 배열 `[]`) 0개의 행을 반환합니다.
- `<json>`이 빈 객체인 경우(예: `{}`) 0개의 행을 반환합니다.

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
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as c;
    ```
    ```text
    +------+------------------------------+
    | k1   | c                            |
    +------+------------------------------+
    |    1 | {"col1":"k1", "col2":""v1""} |
    |    1 | {"col1":"k2", "col2":"123"}  |
    +------+------------------------------+
    ```
2. 키-값 쌍을 각각 별도의 열로 확장
    ```sql
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k1   | "v1" |
    |    1 | k2   | 123  |
    +------+------+------+
    ```
    > `v`의 타입은 JSON입니다.
3. 빈 객체
    ```sql
    select  * from example lateral view explode_json_object('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 매개변수
    ```sql
    select  * from example lateral view explode_json_object(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 객체가 아닌 매개변수
    ```sql
    select  * from example lateral view explode_json_object('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
