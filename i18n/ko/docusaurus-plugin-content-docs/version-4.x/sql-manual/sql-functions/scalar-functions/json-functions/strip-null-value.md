---
{
    "title": "STRIP_NULL_VALUE",
    "language": "ko",
    "description": "STRIPNULLVALUE 함수는 JSON의 NULL 값을 SQL의 NULL 값으로 변환합니다. 그 외의 모든 variant 값은 그대로 유지됩니다."
}
---

## 설명 {#description}

`STRIP_NULL_VALUE` 함수는 JSON의 NULL 값을 SQL의 NULL 값으로 변환합니다. 그 외의 모든 variant 값은 그대로 유지됩니다.

## 구문 {#syntax}

```sql
STRIP_NULL_VALUE( <json_doc> )
```

## 필수 매개변수 {#required-parameters}
- `<json_doc>`: JSON 타입이며, 처리할 JSON 객체입니다.

## 사용 시 참고 사항 {#usage-notes}
1. 인수가 NULL이면 NULL을 반환합니다.
2. 인수가 json null이면 NULL을 반환합니다.
3. null이 아닌 json 데이터의 경우 원래 입력을 반환합니다.

## 예제 {#examples}
0. 데이터 준비
```sql
create table my_test(id INT, v json) properties('replication_num' = '1');
insert into my_test values(0, 'null'), (1, null), (2, 123), (3, '{"key": 445}'), (4, '{"key": null}');

select * from my_test;
```
1. 예제 1
    ```sql
    select id, v, strip_null_value(v) from my_test order by id;
    ```
    ```text
    +------+--------------+---------------------+
    | id   | v            | strip_null_value(v) |
    +------+--------------+---------------------+
    |    0 | null         | NULL                |
    |    1 | NULL         | NULL                |
    |    2 | 123          | 123                 |
    |    3 | {"key":445}  | {"key":445}         |
    |    4 | {"key":null} | {"key":null}        |
    +------+--------------+---------------------+
    5 rows in set (0.02 sec)
    ```

2. 예제 2
    ```sql
    select
        id
        , v
        , strip_null_value(json_extract(v, '$.key')) 
    from my_test order by id;
    ```
    ```text
    +------+--------------+--------------------------------------------+
    | id   | v            | strip_null_value(json_extract(v, '$.key')) |
    +------+--------------+--------------------------------------------+
    |    0 | null         | NULL                                       |
    |    1 | NULL         | NULL                                       |
    |    2 | 123          | NULL                                       |
    |    3 | {"key":445}  | 445                                        |
    |    4 | {"key":null} | NULL                                       |
    +------+--------------+--------------------------------------------+
    ```
