---
{
    "title": "EXPLODE_BITMAP_OUTER",
    "language": "ko",
    "description": "explodebitmapouter 테이블 함수는 bitmap 타입의 데이터를 받아 bitmap의 각 비트를 개별 행에 매핑합니다."
}
---

## 설명 {#description}
`explode_bitmap_outer` 테이블 함수는 bitmap 타입의 데이터를 받아 bitmap의 각 비트를 개별 행에 매핑합니다.
이 함수는 bitmap 데이터를 처리할 때 주로 사용하며, bitmap의 각 요소를 개별 레코드로 확장합니다. [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.
`explode_bitmap_outer`는 `explode_bitmap`과 유사하지만, 비어 있거나 NULL인 값을 처리할 때 다르게 동작합니다. 비어 있거나 NULL인 bitmap을 가진 레코드도 유지하며, 결과에서 이를 NULL 행으로 확장합니다.

## 구문 {#syntax}
```sql
EXPLODE_BITMAP_OUTER(<bitmap>)
```

## 매개변수 {#parameters}
- `<bitmap>` [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 타입

## 반환값 {#return-value}
- `<bitmap>`의 각 비트에 대해 행을 반환하며, 각 행에는 비트 값이 포함됩니다.
- `<bitmap>`이 NULL이면 NULL을 포함하는 1개 행을 반환합니다.
- `<bitmap>`이 비어 있으면 NULL을 포함하는 1개 행을 반환합니다.


## 사용 시 참고 사항 {#usage-notes}
1. `<bitmap>` 매개변수가 [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 타입이 아니면 오류가 발생합니다.

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
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 |    1 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |   10 |
    +------+------+
    ```
2. 비어 있는 BITMAP
    ```sql
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULL 매개변수
    ```sql
    select  * from example lateral view explode_bitmap_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 배열이 아닌 매개변수
    ```sql
    select  * from example lateral view explode_bitmap_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap_outer(VARCHAR(3))
    ```
