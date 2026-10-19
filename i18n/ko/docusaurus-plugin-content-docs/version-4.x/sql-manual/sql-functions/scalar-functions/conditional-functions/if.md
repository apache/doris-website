---
{
    "title": "IF",
    "language": "ko",
    "description": "표현식 <condition>이 참이면 <valuetrue>를 반환하고, 그렇지 않으면 <valuefalseornull>을 반환합니다."
}
---

## 설명 {#description}

표현식 `<condition>`이 참이면 `<value_true>`를 반환하고, 그렇지 않으면 `<value_false_or_null>`을 반환합니다.
반환 타입: `<value_true>` 표현식의 결과 타입입니다.

## 구문 {#syntax}

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## 매개변수 {#parameters}
- `<condition>`: Boolean 타입으로, 조건이 참인지 판단하는 데 사용하는 표현식입니다.
- `<value_true>`: `<condition>`이 참일 때 반환하는 값입니다.
- `<value_false_or_null>`: `<condition>`이 거짓이거나 NULL일 때 반환하는 값입니다.

## 예제 {#examples}
0. 데이터 준비
    ```sql
    create table test_if(
        user_id int
    ) properties('replication_num' = '1');
    insert into test_if values(1),(2),(null);
    ```
1. 예제 1
    ```sql
    SELECT user_id, IF(user_id = 1, "true", "false") AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL | false   |
    |       1 | true    |
    |       2 | false   |
    +---------+---------+
    ```
2. 타입 변환
    ```sql
    SELECT user_id, IF(user_id = 1, 2, 3.14) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    3.14 |
    |       1 |    2.00 |
    |       2 |    3.14 |
    +---------+---------+
    ```
    > 두 번째 인수 "2"는 세 번째 인수 "3.14"의 타입(Decimal)으로 변환됩니다.

3. NULL 인수
    ```sql
    SELECT user_id, IF(user_id = 1, 2, NULL) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    NULL |
    |       1 |       2 |
    |       2 |    NULL |
    +---------+---------+
    ```
