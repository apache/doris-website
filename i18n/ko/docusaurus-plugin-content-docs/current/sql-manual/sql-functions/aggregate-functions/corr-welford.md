---
{
    "title": "CORR_WELFORD",
    "language": "ko",
    "description": "Welford 알고리즘을 사용하여 두 확률 변수 간의 피어슨 상관 계수를 계산하며, 계산 오차를 효과적으로 줄입니다."
}
---

## 설명 {#description}

[Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) 알고리즘을 사용하여 두 확률 변수 간의 피어슨 상관 계수를 계산하며, 계산 오차를 효과적으로 줄입니다.

## 구문 {#syntax}

```sql
CORR_WELFORD(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | Double 표현식(열) |
| `<expr2>` | Double 표현식(열) |

## 반환 값 {#return-value}

DOUBLE 타입의 값을 반환합니다. 이 값은 expr1과 expr2의 공분산을 두 변수의 표준편차의 곱으로 나눈 값입니다. 특수한 경우는 다음과 같습니다.

- expr1 또는 expr2의 표준편차가 0이면 0을 반환합니다.
- expr1 또는 expr2에 NULL 값이 포함되어 있으면 해당 행은 최종 결과에서 제외됩니다.

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
select * from test_corr;
```

```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   20 |   22 |
|    1 |   10 |   20 |
|    2 |   36 |   21 |
|    2 |   30 |   22 |
|    2 |   25 |   20 |
|    3 |   25 | NULL |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
|    4 |   25 |   20 |
+------+------+------+
```

```sql
select id,corr_welford(k1,k2) from test_corr group by id;
```

```text
+------+---------------------+
| id   | corr_welford(k1,k2) |
+------+---------------------+
|    2 |  0.4539206495016017 |
|    4 |                   0 |
|    3 |                NULL |
|    1 |                   1 |
+------+---------------------+
```
