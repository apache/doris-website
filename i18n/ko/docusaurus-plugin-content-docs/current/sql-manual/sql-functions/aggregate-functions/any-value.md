---
{
    "title": "ANY_VALUE",
    "language": "ko",
    "description": "그룹의 표현식 또는 열에서 임의의 값을 반환합니다. NULL이 아닌 값이 있으면 NULL이 아닌 임의의 값을 반환하고, 그렇지 않으면 NULL을 반환합니다."
}
---

## 설명 {#description}

그룹의 표현식 또는 열에서 임의의 값을 반환합니다. NULL이 아닌 값이 있으면 NULL이 아닌 임의의 값을 반환하고, 그렇지 않으면 NULL을 반환합니다.

## 별칭 {#alias}

- ANY

## 구문 {#syntax}

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 집계할 열 또는 표현식입니다. 지원되는 타입은 String, Date, DateTime, TimestampNs, Timestamptz, IPv4, IPv6, UUID, Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Array, Map, Struct, AggState, Bitmap, HLL, QuantileState입니다. |

## 반환 값 {#return-value}

NULL이 아닌 값이 있으면 NULL이 아닌 임의의 값을 반환하고, 그렇지 않으면 NULL을 반환합니다.
반환 타입은 입력 expr의 타입과 같습니다.

## 예제 {#example}

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01),
    (1, 'banana', 20.02),
    (2, 'orange', 30.03),
    (2, null, null),
    (3, null, null);
```

```sql
select k1, any_value(k_string) from t1 group by k1;
```

String 타입: 각 그룹에서 NULL이 아닌 임의의 값을 반환합니다.

```text
+------+---------------------+
| k1   | any_value(k_string) |
+------+---------------------+
|    1 | apple               |
|    2 | orange              |
|    3 | NULL                |
+------+---------------------+
```

```sql
select k1, any_value(k_decimal) from t1 group by k1;
```

Decimal 타입: NULL이 아닌 임의의 고정밀 소수 값을 반환합니다.

```text
+------+----------------------+
| k1   | any_value(k_decimal) |
+------+----------------------+
|    1 |                10.01 |
|    2 |                30.03 |
|    3 |                 NULL |
+------+----------------------+
```

```sql
select any_value(k_string) from t1 where k1 = 3;
```

그룹의 모든 값이 NULL이면 NULL을 반환합니다.

```text
+---------------------+
| any_value(k_string) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select k1, any(k_string) from t1 group by k1;
```

별칭 ANY를 사용하면 ANY_VALUE와 같은 결과를 얻습니다.

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
