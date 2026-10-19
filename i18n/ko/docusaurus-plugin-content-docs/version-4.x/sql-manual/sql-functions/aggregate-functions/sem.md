---
{
    "title": "SEM",
    "language": "ko",
    "description": "지정한 열 또는 표현식에서 NULL이 아닌 모든 값에 대한 평균의 표준 오차를 계산합니다."
}
---

## 설명 {#description}

지정한 열 또는 표현식에서 NULL이 아닌 모든 값에 대한 평균의 표준 오차를 계산합니다.

표본 값을 $x_i$, 표본 크기를 $n$, 표본 평균을 $\bar{x}$라고 하면 다음과 같습니다.

$
\mathrm{SEM}=\sqrt{\frac{1}{n(n-1)}\sum_{i=1}^{n}\bigl(x_i-\bar{x}\bigr)^2}.
$

## 구문 {#syntax}

```text
SEM([DISTINCT] <expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 표현식 또는 열입니다. 일반적으로 숫자형 열이나 숫자 값으로 변환할 수 있는 표현식이며, Double 데이터 타입을 지원합니다.|
| `[DISTINCT]` | expr에서 중복 값을 제거한 후 평균의 표준 오차를 계산하도록 지정하는 선택적 키워드입니다. |

## 반환 값 {#return-value}

Double을 반환합니다. 선택한 열 또는 표현식에 대한 평균의 표준 오차를 반환합니다. 그룹 내 모든 레코드가 NULL이면 함수는 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- setup
create table t1(
        id int,
        k_double double,
) distributed by hash (id) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 222.222),
    (2, 3.3),
    (3, 3.3),
    (4, null);
```

```sql
select sem(k_double) from t1;
```

Double 타입의 평균 표준 오차 계산: [222.222, 3.3, 3.3, null]의 평균 표준 오차는 72.974입니다.

```text
+---------------+
| sem(k_double) |
+---------------+
|        72.974 |
+---------------+
```

```sql
select sem(id) from t1
```

int 타입의 평균 표준 오차 계산: [1, 2, 3, 4]의 평균 표준 오차는 0.645497입니다.

```text
+--------------------+
| sem(id)            |
+--------------------+
| 0.6454972243679028 |
+--------------------+
```

```sql
select sem(cast(null as double)) from t1;
```

모든 값이 null이면 null을 반환합니다.

```text
+---------------------------+
| sem(cast(null as double)) |
+---------------------------+
|                      NULL |
+---------------------------+
```

```sql
select sem(distinct k_double) from t1;
```

DISTINCT 키워드를 사용한 중복 제거 계산: [222.222, 3.3, 3.3, null]에서 중복을 제거한 후의 평균 표준 오차는 109.461입니다.

```text
+------------------------+
| sem(distinct k_double) |
+------------------------+
|                109.461 |
+------------------------+
```
