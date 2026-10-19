---
{
    "title": "CORR",
    "language": "ko",
    "description": "두 확률 변수 간의 피어슨 상관 계수를 계산합니다."
}
---

## 설명 {#description}

두 확률 변수 간의 피어슨 상관 계수를 계산합니다.

## 구문 {#syntax}

```sql
CORR(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | 계산에 사용할 표현식입니다. 지원하는 타입은 Double입니다. |
| `<expr2>` | 계산에 사용할 표현식입니다. 지원하는 타입은 Double입니다. |

## 반환값 {#return-value}

DOUBLE 타입의 값을 반환합니다. 이 값은 expr1과 expr2의 공분산을 두 변수의 표준편차의 곱으로 나눈 값입니다. 특수한 경우는 다음과 같습니다.

- expr1 또는 expr2의 표준편차가 0이면 0을 반환합니다.
- expr1 또는 expr2에 NULL 값이 포함되어 있으면 해당 행은 계산에서 제외됩니다.
- 그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table test_corr(
    id int,
    k1 double,
    k2 double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into test_corr values 
    (1, 20, 22),
    (1, 10, 20),
    (2, 36, 21),
    (2, 30, 22),
    (2, 25, 20),
    (3, 25, NULL),
    (4, 25, 21),
    (4, 25, 22),
    (4, 25, 20);
```

```sql
select id,corr(k1,k2) from test_corr group by id;
```

```text
+------+--------------------+
| id   | corr(k1, k2)       |
+------+--------------------+
|    4 |                  0 |
|    1 |                  1 |
|    3 |               NULL |
|    2 | 0.4539206495016019 |
+------+--------------------+
```

```sql
select corr(k1,k2) from test_corr where id=999;
```

쿼리 결과가 비어 있으면 NULL을 반환합니다.

```text
+-------------+
| corr(k1,k2) |
+-------------+
|        NULL |
+-------------+
```
