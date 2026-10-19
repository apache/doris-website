---
{
    "title": "CORR_WELFORD",
    "language": "ko",
    "description": "Welford 알고리즘을 사용하여 두 확률 변수 사이의 Pearson 상관 계수를 계산하며, 계산 오차를 효과적으로 줄입니다."
}
---

## 설명 {#description}

[Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) 알고리즘을 사용하여 두 확률 변수 사이의 Pearson 상관 계수를 계산하며, 계산 오차를 효과적으로 줄입니다.

## 구문 {#syntax}

```sql
CORR_WELFORD(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | Double 표현식(열) |
| `<expr2>` | Double 표현식(열) |

## 반환값 {#return-value}

expr1과 expr2의 공분산을 각 표준편차의 곱으로 나눈 DOUBLE 타입 값을 반환합니다. 특수한 경우는 다음과 같습니다.

- expr1 또는 expr2의 표준편차가 0이면 0을 반환합니다.
- expr1 또는 expr2에 NULL 값이 포함되어 있으면 해당 행은 최종 결과에서 제외됩니다.
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
select * from test_corr order by id, k1, k2;
```

```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   10 |   20 |
|    1 |   20 |   22 |
|    2 |   25 |   20 |
|    2 |   30 |   22 |
|    2 |   36 |   21 |
|    3 |   25 | NULL |
|    4 |   25 |   20 |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
+------+------+------+
```

```sql
select id, corr_welford(k1, k2) from test_corr group by id order by id;
```

```text
+------+----------------------+
| id   | corr_welford(k1, k2) |
+------+----------------------+
|    1 |                    1 |
|    2 |   0.4539206495016017 |
|    3 |                 NULL |
|    4 |                    0 |
+------+----------------------+
```

그룹에 유효한 `(k1, k2)` 쌍이 없으면(여기서는 `id = 999`와 일치하는 행이 없음) 집계 함수는 NULL을 반환합니다.

```sql
select corr_welford(k1, k2) from test_corr where id = 999;
```

```text
+----------------------+
| corr_welford(k1, k2) |
+----------------------+
|                 NULL |
+----------------------+
```
