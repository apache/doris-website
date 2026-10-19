---
{
    "title": "EXPLODE_SPLIT_OUTER",
    "language": "ko",
    "description": "explodesplitouter 테이블 함수는 지정된 구분자에 따라 문자열을 여러 부분 문자열로 분할하는 데 사용됩니다."
}
---

## 설명 {#description}
`explode_split_outer` 테이블 함수는 지정된 구분자에 따라 문자열을 여러 부분 문자열로 분할하고, 각 부분 문자열을 별도의 행으로 확장하는 데 사용됩니다.
중첩된 데이터 구조를 표준 평면 테이블 형식으로 펼치려면 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.
`explode_split_outer`와 [`explode_split`](./explode-split.md)의 주요 차이점은 NULL 값을 처리하는 방식입니다.

## 구문 {#syntax}
```sql
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```

## 매개변수 {#parameters}
- `<str>` String 타입으로, 분할할 문자열입니다.
- `<delimiter>` String 타입으로, 구분자입니다.

## 반환 값 {#return-value}
- 분할된 부분 문자열로 구성된 열을 반환하며, 열 타입은 String입니다.

## 사용 시 참고 사항 {#usage-notes}
1. `<str>`이 NULL이면 NULL이 포함된 1개 행을 반환합니다.
2. `<str>`이 빈 문자열("")이거나 분할할 수 없으면 1개 행을 반환합니다.
3. `<delimiter>`가 NULL이면 NULL이 포함된 1개 행을 반환합니다.
4. `<delimiter>`가 빈 문자열("")이면 `<str>`을 바이트 단위로 분할합니다([`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)).

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
    select  * from example lateral view explode_split_outer("ab,cd,ef", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | ab   |
    |    1 | cd   |
    |    1 | ef   |
    +------+------+
    ```
2. 빈 문자열 및 분할할 수 없는 경우
    ```sql
    select  * from example lateral view explode_split_outer("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split_outer("abc", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | abc  |
    +------+------+
    ```
3. NULL 매개변수
    ```sql
    select  * from example lateral view explode_split_outer(NULL, ',') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 빈 구분자
    ```sql
    select  * from example lateral view explode_split_outer('abc', '') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | a    |
    |    1 | b    |
    |    1 | c    |
    +------+------+
    ```
5. 구분자가 NULL인 경우
    ```sql
    select  * from example lateral view explode_split_outer('abc', null) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
