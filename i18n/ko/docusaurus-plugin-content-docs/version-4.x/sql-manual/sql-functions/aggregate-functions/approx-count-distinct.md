---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "ko",
    "description": "NULL이 아닌 요소의 중복을 제외한 개수를 반환합니다. 이 함수는 HyperLogLog 알고리즘을 기반으로 구현됩니다."
}
---

## 설명 {#description}

NULL이 아닌 요소의 중복을 제외한 개수를 반환합니다.
이 함수는 HyperLogLog 알고리즘을 기반으로 구현되었으며, 고정된 크기의 메모리를 사용하여 컬럼의 고유 값 개수를 추정합니다. 이 알고리즘은 꼬리 부분이 null 분포를 따른다는 가정을 바탕으로 하며, 정확도는 데이터 분포에 따라 달라집니다. Doris에서 사용하는 고정 버킷 크기를 기준으로 이 알고리즘의 상대 표준 오차는 0.8125%입니다.
더 자세하고 구체적인 분석은 [관련 논문](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)을 참조하세요.

## 구문 {#syntax}

```sql
APPROX_COUNT_DISTINCT(<expr>)
NDV(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 값을 구할 표현식입니다. 지원되는 타입은 String, Date, DateTime,Timestamptz, IPv4, IPv6, TinyInt, Bool, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal입니다. |

## 반환 값 {#return-value}

BIGINT 타입의 값을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_tinyint tinyint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10),
    (1, 'banana', 20),
    (1, 'apple', 10),
    (2, 'orange', 30),
    (2, 'orange', 40),
    (2, 'grape', 50),
    (3, null, null);
```

```sql
select approx_count_distinct(k_string) from t1;
```

String 타입: 전체 k_string 값의 중복을 제외한 개수를 근사적으로 계산합니다. NULL 값은 계산에 포함되지 않습니다.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_tinyint) from t1;
```

TinyInt 타입: 전체 k_tinyint 값의 중복을 제외한 개수를 근사적으로 계산합니다.

```text
+----------------------------------+
| approx_count_distinct(k_tinyint) |
+----------------------------------+
|                                5 |
+----------------------------------+
```

```sql
select approx_count_distinct(k1) from t1;
```

Integer 타입: 전체 k1 값의 중복을 제외한 개수를 근사적으로 계산합니다.

```text
+---------------------------+
| approx_count_distinct(k1) |
+---------------------------+
|                         3 |
+---------------------------+
```

```sql
select k1, approx_count_distinct(k_string) from t1 group by k1;
```

k1을 기준으로 그룹화하고 각 그룹에서 k_string 값의 중복을 제외한 개수를 근사적으로 계산합니다. 그룹 내 모든 레코드가 NULL이면 0을 반환합니다.

```text
+------+---------------------------------+
| k1   | approx_count_distinct(k_string) |
+------+---------------------------------+
|    1 |                               2 |
|    2 |                               2 |
|    3 |                               0 |
+------+---------------------------------+
```

```sql
select ndv(k_string) from t1;
```

별칭인 NDV를 사용해도 APPROX_COUNT_DISTINCT와 동일하게 동작합니다.

```text
+---------------+
| ndv(k_string) |
+---------------+
|             4 |
+---------------+
```

```sql
select approx_count_distinct(k_string) from t1 where k1 = 999;
```

쿼리 결과가 비어 있으면 0을 반환합니다.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
