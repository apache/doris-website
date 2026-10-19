---
{
    "title": "MAX",
    "language": "ko",
    "description": "MAX 함수는 표현식에서 NULL이 아닌 값 중 최댓값을 반환합니다."
}
---

## 설명 {#description}

MAX 함수는 표현식에서 NULL이 아닌 값 중 최댓값을 반환합니다.

## 구문 {#syntax}

```sql
MAX(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 값을 구할 표현식입니다. 지원되는 타입은 String, Time, Date, DateTime, TimestampNs, Timestamptz, IPv4, IPv6, UUID, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Array입니다. |

## 반환값 {#return-value}

입력 표현식과 동일한 데이터 타입을 반환합니다.
그룹의 모든 레코드가 NULL이면 함수는 NULL을 반환합니다.


:::caution 동작 변경 (4.1.5)

Doris 4.1 시리즈의 4.1.5 버전부터 배열과 같은 복합 값 내부의 NULL 요소는 같은 위치의 NULL이 아닌 요소보다 큰 것으로 비교됩니다. 예를 들어, `[10, 20, NULL]`은 `[10, 20, 40]`보다 큽니다. 이는 표현식 전체가 NULL인 경우와는 다릅니다. 해당 행은 여전히 무시됩니다. 4.1.5 이전에는 집계 비교 시 복합 값 내부의 NULL 요소를 더 작은 것으로 처리했습니다.

:::

## 예제 {#example}

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2),
        k_array array<int>
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01, [10, 20, 30]),
    (1, 'banana', 20.02, [10, 20]),
    (2, 'orange', 30.03, [10, 20, 40]),
    (2, null, null, [10, 20, null]),
    (3, null, null, null);
```

```sql
select k1, max(k_string) from t1 group by k1 order by k1;
```

String 타입: 각 그룹에서 가장 큰 문자열 값을 반환합니다.

```text
+------+---------------+
| k1   | max(k_string) |
+------+---------------+
|    1 | banana        |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```

```sql
select k1, max(k_decimal) from t1 group by k1 order by k1;
```

Decimal 타입: 고정밀 소수 값 중 최댓값을 반환합니다.

```text
+------+----------------+
| k1   | max(k_decimal) |
+------+----------------+
|    1 |          20.02 |
|    2 |          30.03 |
|    3 |           NULL |
+------+----------------+
```

```sql
select k1, max(k_array) from t1 group by k1 order by k1;
```

Array 타입: 요소를 순서대로 비교하여 각 그룹에서 가장 큰 배열 값을 반환합니다. NULL 요소는 같은 위치의 NULL이 아닌 요소보다 큰 것으로 비교됩니다.

```text
+------+----------------+
| k1   | max(k_array)   |
+------+----------------+
|    1 | [10, 20, 30]   |
|    2 | [10, 20, null] |
|    3 | NULL           |
+------+----------------+
```

```sql
select max(k_string) from t1 where k1 = 3;
```

그룹의 모든 값이 NULL이면 NULL을 반환합니다.

```text
+---------------+
| max(k_string) |
+---------------+
| NULL          |
+---------------+
```

```sql
select max(k_string) from t1;
```

전체 데이터에서 최댓값을 반환합니다.

```text
+---------------+
| max(k_string) |
+---------------+
| orange        |
+---------------+
```
