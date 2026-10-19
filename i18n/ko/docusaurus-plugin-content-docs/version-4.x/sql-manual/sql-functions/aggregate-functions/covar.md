---
{
    "title": "COVAR",
    "language": "ko",
    "description": "두 변수 간의 표본 공분산을 계산합니다. 입력 변수 중 하나라도 NULL이면 해당 행은 계산에 포함되지 않습니다."
}
---

## 설명 {#description}

두 변수 간의 표본 공분산을 계산합니다. 입력 변수 중 하나라도 NULL이면 해당 행은 계산에 포함되지 않습니다.

## 별칭 {#alias}

- COVAR_POP

## 구문 {#syntax}

```sql
COVAR(<expr1>, <expr2>)
COVAR_POP(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | 계산할 표현식 중 하나로, 지원되는 타입은 Double입니다. |
| `<expr2>` | 계산할 표현식 중 하나로, 지원되는 타입은 Double입니다. |

## 반환 값 {#return-value}

expr1과 expr2의 표본 공분산을 반환하며, 반환 타입은 Double입니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
create table baseall(
    id int,
    x double,
    y double
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into baseall values
    (1, 1.0, 2.0),
    (2, 2.0, 3.0),
    (3, 3.0, 4.0),
    (4, 4.0, NULL),
    (5, NULL, 5.0);
```

```sql
select covar(x,y) from baseall;
```

```text
+-------------------+
| covar(x,y)        |
+-------------------+
| 0.666666666666667 |
+-------------------+
```

```sql
select id, covar(x, y) from baseall group by id;
```

```text
+------+-------------+
| id   | covar(x, y) |
+------+-------------+
|    1 |           0 |
|    2 |           0 |
|    3 |           0 |
|    4 |        NULL |
|    5 |        NULL |
+------+-------------+
```
