---
{
    "title": "EXPLODE_BITMAP",
    "language": "ko",
    "description": "explodebitmap 테이블 함수는 bitmap 타입의 데이터를 받아 bitmap의 각 비트를 별도의 행으로 매핑합니다."
}
---

## 설명 {#description}
`explode_bitmap` 테이블 함수는 bitmap 타입의 데이터를 받아 bitmap의 각 비트를 별도의 행으로 매핑합니다.
이 함수는 bitmap의 각 요소를 별도의 레코드로 확장하여 bitmap 데이터를 처리하는 데 주로 사용됩니다. [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}
```sql
EXPLODE_BITMAP(<bitmap>)
```

## 매개변수 {#parameters}
- `<bitmap>` [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 타입

## 반환값 {#return-value}
- `<bitmap>`의 각 비트에 대해 행을 반환하며, 각 행에는 비트 값이 포함됩니다.

## 사용 시 주의 사항 {#usage-notes}
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
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
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
2. 빈 BITMAP
    ```sql
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 매개변수
    ```sql
    select  * from example lateral view explode_bitmap(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 배열이 아닌 매개변수
    ```sql
    select  * from example lateral view explode_bitmap('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap(VARCHAR(3))
    ```
