---
{
    "title": "UNIFORM",
    "language": "ko",
    "description": "주어진 난수 시드를 사용하여 특정 범위 내에서 균등하게 샘플링한 난수를 생성합니다."
}
---

## 설명 {#description}

주어진 난수 시드를 사용하여 특정 범위 내에서 균등하게 샘플링한 난수를 생성합니다.

## 구문 {#syntax}

```sql
UNIFORM( <min> , <max> , <gen> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|------------|
| `<min>` | 난수의 하한값입니다. 숫자 타입을 허용하며, 리터럴이어야 합니다. |
| `<max>` | 난수의 상한값입니다. 숫자 타입을 허용하며, 리터럴이어야 합니다. |
| `<gen>` | 정수 타입의 난수 시드입니다. 일반적으로 [RANDOM](./random.md) 함수로 무작위 생성합니다. |

## 반환 값 {#return-value}

`[<min>, <max>]` 범위 내의 난수를 반환합니다. `<min>`과 `<max>`가 모두 정수이면 반환 값의 타입은 `BIGINT`이고, 그렇지 않으면 `DOUBLE`입니다.

Snowflake의 [일반적인 사용법](https://docs.snowflake.com/en/sql-reference/functions/uniform)과 달리, Doris의 RANDOM 함수는 기본적으로 0과 1 사이의 부동소수점 수를 반환합니다. 따라서 `RANDOM()`을 난수 시드로 사용할 때는 결과가 정수 범위에 분포하도록 배수를 곱해야 합니다. 자세한 내용은 예제를 참고하세요.

## 예제 {#example}

<!-- setup-sql
CREATE TABLE it (k0 INT) DISTRIBUTED BY HASH(k0) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO it VALUES (NULL),(1),(2),(3),(4),(5);
CREATE TABLE fn_test (ksint INT) DISTRIBUTED BY HASH(ksint) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO fn_test VALUES (1);
-->

모든 입력 매개변수가 정수이면 정수를 반환합니다:

```sql
select uniform(-100, 100, random() * 10000) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|    -82 |
|    -79 |
|     21 |
|     19 |
|     50 |
|     53 |
|   -100 |
|    -67 |
|     46 |
|     40 |
+--------+
```

입력 매개변수 중 정수가 아닌 값이 있으면 double 타입을 반환합니다:

```sql
select uniform(1, 100., random() * 10000) as result from numbers("number" = "10");
```

```text
+-------------------+
| result            |
+-------------------+
| 84.25057360297031 |
| 63.34296160793329 |
|  81.8770598286311 |
| 26.53334147605743 |
| 17.42787914185705 |
| 2.532901549399078 |
| 63.72223367924216 |
| 78.42165786093118 |
|   18.913688179943 |
| 41.73057334477316 |
+-------------------+
```

매개변수는 리터럴이어야 합니다:

```sql
select uniform(1, unix_timestamp(), random() * 10000) as result from numbers("number" = "10");
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```

매개변수는 리터럴이어야 합니다:

```sql
select uniform(1, ksint, random()) from fn_test;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```

고정된 시드를 사용하면 고정된 결과가 생성됩니다(`random()`의 결과는 0과 1 사이에 분포하며, 이 값을 그대로 사용하면 `uniform`의 시드 매개변수는 항상 `0`이 됩니다):

```sql
select uniform(-100, 100, random()) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
+--------+
```

입력값 중 하나라도 NULL이면 출력값도 NULL입니다:

```sql
select uniform(-100, NULL, random() * 10000) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
+--------+
```

```sql
select k0, uniform(0, 1000, k0) from it order by k0;
```

```text
+------+----------------------+
| k0   | uniform(0, 1000, k0) |
+------+----------------------+
| NULL |                 NULL |
|    1 |                  134 |
|    2 |                  904 |
|    3 |                  559 |
|    4 |                  786 |
|    5 |                  673 |
+------+----------------------+
```
