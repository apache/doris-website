---
{
    "title": "EXPLODE_MAP_OUTER",
    "language": "ko",
    "description": "explodemapouter 테이블 함수는 map 타입을 받아 map을 여러 행으로 확장하며, 각 행에는 키-값 쌍이 포함됩니다."
}
---

## 설명 {#description}
`explode_map_outer` 테이블 함수는 map 타입을 받아 map을 여러 행으로 확장하며, 각 행에는 키-값 쌍이 포함됩니다.
이 함수는 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_MAP_OUTER(<map>)
```

## 매개변수 {#parameters}
- `<map>` MAP 타입입니다.

## 반환 값 {#return-value}
- `<map>`의 모든 요소로 구성된 단일 열, 여러 행의 결과를 반환합니다. 열 타입은 `Nullable<Struct<K, V>>`입니다.
- `<map>`이 NULL이거나 비어 있으면 NULL을 포함하는 1개 행을 반환합니다.

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
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as c;
    ```
    ```text
    +------+-----------------------------+
    | k1   | c                           |
    +------+-----------------------------+
    |    1 | {"col1":"k", "col2":"v"}    |
    |    1 | {"col1":"k2", "col2":"123"} |
    |    1 | {"col1":null, "col2":null}  |
    +------+-----------------------------+
    ```
2. 키-값 쌍을 별도 열로 확장
    ```sql
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k    | v    |
    |    1 | k2   | 123  |
    |    1 | NULL | NULL |
    +------+------+------+
    ```
3. 빈 객체
    ```sql
    select  * from example lateral view explode_map_outer(map()) t2 as c;
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
    select  * from example lateral view explode_map_outer(cast('ab' as map<string,string>)) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
