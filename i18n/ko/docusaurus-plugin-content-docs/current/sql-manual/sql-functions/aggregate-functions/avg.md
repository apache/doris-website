---
{
    "title": "AVG",
    "language": "ko",
    "description": "지정한 열 또는 표현식에서 NULL이 아닌 모든 값의 평균을 계산합니다."
}
---

## 설명 {#description}

지정한 열 또는 표현식에서 NULL이 아닌 모든 값의 평균을 계산합니다.

## 구문 {#syntax}

```sql
AVG([DISTINCT] <expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 표현식 또는 열이며, 일반적으로 숫자형 열이나 숫자 값으로 변환할 수 있는 표현식입니다. 지원되는 타입은 TinyInt, SmallInt, Integer, BigInt, LargeInt, Double, Decimal입니다. |
| `[DISTINCT]` | expr에서 중복 값을 제거한 후 평균을 계산하도록 지정하는 선택적 키워드입니다. |

## 반환값 {#return-value}

선택한 열 또는 표현식의 평균값을 반환합니다. 그룹의 모든 레코드가 NULL이면 함수는 NULL을 반환합니다.
입력이 decimal 타입이면 반환값도 decimal 타입이며, 그 외 숫자 타입은 double 타입으로 반환됩니다.

## 예제 {#example}

```sql
-- setup
create table t1(
        k_tinyint tinyint,
        k_smallint smallint,
        k_int int,
        k_bigint bigint,
        k_largeint largeint,
        k_double double,
        k_decimal decimalv3(10, 5),
        k_null_int int
) distributed by hash (k_int) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 10, 100, 1000, 10000, 1.1, 222.222, null),
    (2, 20, 200, 2000, 20000, 2.2, 444.444, null),
    (3, 30, 300, 3000, 30000, 3.3, null, null);
```

```sql
select avg(k_tinyint) from t1;
```

TinyInt 타입의 평균을 계산합니다. [1,2,3]의 평균은 2입니다.

```text
+----------------+
| avg(k_tinyint) |
+----------------+
|              2 |
+----------------+
```

```sql
select avg(k_smallint) from t1;
```

SmallInt 타입의 평균을 계산합니다. [10,20,30]의 평균은 20입니다.

```text
+-----------------+
| avg(k_smallint) |
+-----------------+
|              20 |
+-----------------+
```

```sql
select avg(k_int) from t1;
```

Integer 타입의 평균을 계산합니다. [100,200,300]의 평균은 200입니다.

```text
+------------+
| avg(k_int) |
+------------+
|        200 |
+------------+
```

```sql
select avg(k_bigint) from t1;
```

BigInt 타입의 평균을 계산합니다. [1000,2000,3000]의 평균은 2000입니다.

```text
+---------------+
| avg(k_bigint) |
+---------------+
|          2000 |
+---------------+
```

```sql
select avg(k_largeint) from t1;
```

LargeInt 타입의 평균을 계산합니다. [10000,20000,30000]의 평균은 20000입니다.

```text
+-----------------+
| avg(k_largeint) |
+-----------------+
|           20000 |
+-----------------+
```

```sql
select avg(k_double) from t1;
```

Double 타입의 평균을 계산합니다. [1.1,2.2,3.3]의 평균은 약 2.2입니다.

```text
| avg(k_double)      |
+--------------------+
| 2.1999999999999997 |
```

```sql
select avg(k_decimal) from t1;
```

Decimal 타입의 평균을 계산합니다. [222.222,444.444,null]의 평균은 333.333입니다.

```text
+----------------+
| avg(k_decimal) |
+----------------+
|      333.33300 |
+----------------+
```

```sql
select avg(k_null_int) from t1;
```

입력 데이터가 모두 NULL이면 NULL을 반환합니다.

```text
+-----------------+
| avg(k_null_int) |
+-----------------+
|            NULL |
+-----------------+
```

```sql
select avg(distinct k_bigint) from t1;
```

DISTINCT 키워드를 사용하여 중복 값을 제거한 후 평균을 계산합니다. [1000,2000,3000]에서 중복 값을 제거한 후의 평균은 2000입니다.

```text
+-----------------------+
| avg(distinct k_bigint) |
+-----------------------+
|                  2000 |
+-----------------------+
```
