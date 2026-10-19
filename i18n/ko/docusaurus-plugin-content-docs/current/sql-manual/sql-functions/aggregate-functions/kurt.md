---
{
    "title": "KURT,KURT_POP,KURTOSIS",
    "language": "ko",
    "description": "KURTOSIS 함수는 데이터의 첨도를 계산합니다. 계산 공식은 사차 중심 모멘트 / (분산의 제곱) - 3입니다."
}
---

## 설명 {#description}

KURTOSIS 함수는 데이터의 [첨도](https://en.wikipedia.org/wiki/Kurtosis)를 계산합니다. 계산 공식은 사차 중심 모멘트 / (분산의 제곱) - 3입니다.

## 별칭 {#alias}

KURT_POP, KURTOSIS

## 구문 {#syntax}

```sql
KURTOSIS(<expr>)
KURT_POP(<expr>)
KURT(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 계산할 표현식입니다. Double 타입을 지원합니다. |

## 반환 값 {#return-value}

DOUBLE 값을 반환합니다.
분산이 영이면 NULL을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table statistic_test(
    tag int,
    val1 double,
    val2 double
) distributed by hash(tag) buckets 1
properties ("replication_num"="1");
insert into statistic_test values
    (1, -10, -10),
    (2, -20, null),
    (3, 100, null),
    (4, 100, null),
    (5, 1000, 1000);
```

```sql
select kurt(val1), kurt(val2) from statistic_test;
```

```text
+---------------------+------------+
| kurt(val1)          | kurt(val2) |
+---------------------+------------+
| 0.16212458373485106 |         -2 |
+---------------------+------------+
```

```sql
select kurt(val1), kurt(val2) from statistic_test group by tag;
```

```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
