---
{
    "title": "EXPONENTIAL_MOVING_AVERAGE",
    "language": "ko",
    "description": "주어진 반감기를 사용하여 시간 인덱스가 지정된 값의 지수 평활 이동 평균을 계산합니다."
}
---

## 설명 {#description}

시간 인덱스가 지정된 값의 지수 평활 이동 평균을 계산합니다. `half_decay` 매개변수는 과거 값의 지수 가중치가 1/2로 감소하는 데 걸리는 시간인 반감기를 제어합니다.

지수 이동 평균은 최근 관측값에 더 큰 가중치를 부여하며, 시간이 지남에 따라 가중치가 지수적으로 감소합니다. 이 함수는 잡음이 많은 시계열 데이터를 평활화하고 추세를 감지하는 데 특히 유용합니다.

알고리즘은 다음과 같이 동작합니다.

- 각 값에 `2^(-dt / half_decay)`의 가중치를 부여합니다. 여기서 `dt`는 해당 값과 가장 최근 시점 사이의 시간 차이입니다.
- 시간 지점이 단위 간격으로 배치된다고 가정할 때, 결과는 가중합을 가중치의 합인 `1 / (1 - 2^(-1 / half_decay))`로 나눈 값입니다.
- 이 함수는 교환법칙과 결합법칙을 만족하므로 분산 집계에 적합합니다.

## 구문 {#syntax}

```sql
EXPONENTIAL_MOVING_AVERAGE(<half_decay>, <value>, <timeunit>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<half_decay>` | 반감기입니다. 숫자형 상수 표현식이어야 합니다. 지원되는 타입은 DOUBLE입니다. |
| `<value>` | 평균을 계산할 숫자형 컬럼입니다. 지원되는 타입은 DOUBLE입니다. |
| `<timeunit>` | 숫자형 시간 인덱스입니다(원시 타임스탬프가 아님). 타임스탬프 컬럼은 `intDiv(toUnixTimestamp(ts), interval_seconds)`를 사용하여 변환합니다. 지원되는 타입은 DOUBLE입니다. |

## 반환값 {#return-value}

지수 평활 이동 평균을 나타내는 DOUBLE 값을 반환합니다. 다음과 같은 특수한 경우가 있습니다.

- `half_decay`가 0이면 0을 반환합니다.
- `<value>` 또는 `<timeunit>`에 NULL 값이 포함되어 있으면 해당 행은 계산에서 제외됩니다.
- 그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

### 기본 사용법 {#basic-usage}

시간에 따른 온도 측정값의 지수 이동 평균을 계산합니다.

```sql
-- setup
create table temparature_data (
    id int,
    temp double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into temparature_data values
    (1, 10, 1),
    (2, 20, 2),
    (3, 30, 3);
```

```sql
select exponential_moving_average(2.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(2.0, temp, ts) |
+----------------------------------------------------+
|                                  14.39339828220178 |
+----------------------------------------------------+
```

### 반감기의 영향 {#half-decay-impact}

half_decay가 작을수록 최근 값에 더 큰 가중치를 부여합니다.

```sql
-- same data as above, but with half_decay=1
select exponential_moving_average(1.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(1.0, temp, ts) |
+----------------------------------------------------+
|                                              21.25 |
+----------------------------------------------------+
```

### GROUP BY와 함께 사용 {#use-with-group-by}

```sql
-- setup
create table sensor_data (
    sensor_id int,
    reading double,
    ts double
) distributed by hash (sensor_id) buckets 1
properties ("replication_num"="1");

insert into sensor_data values
    (1, 10, 1),
    (1, 20, 2),
    (2, 100, 1),
    (2, 200, 2);
```

```sql
select sensor_id, exponential_moving_average(1.0, reading, ts)
from sensor_data group by sensor_id order by sensor_id;
```

```text
+-----------+-------------------------------------------------------+
| sensor_id | exponential_moving_average(1.0, reading, ts) |
+-----------+-------------------------------------------------------+
|         1 |                                                  12.5 |
|         2 |                                                   125 |
+-----------+-------------------------------------------------------+
```

### NULL 처리 {#null-handling}

NULL 값이 있는 행은 계산에서 제외됩니다.

```sql
-- setup
create table null_test (
    id int,
    val double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into null_test values
    (1, 10, 1),
    (2, null, 2),
    (3, 20, 3);
```

```sql
select exponential_moving_average(1.0, val, ts) from null_test;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            11.25 |
+-------------------------------------------------+
```

### 빈 결과 집합 {#empty-result-set}

결과 집합이 비어 있으면 NULL을 반환합니다.

```sql
select exponential_moving_average(1.0, val, ts) from null_test where val > 100;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            NULL |
+-------------------------------------------------+
```

### 윈도우 함수와 함께 사용 {#use-with-window-function}

```sql
-- setup
create table time_series (
    ts double,
    val double
) distributed by hash (ts) buckets 1
properties ("replication_num"="1");

insert into time_series values (0, 10), (1, 10), (2, 10);
```

```sql
select
    ts,
    exponential_moving_average(1.0, val, ts)
        over (order by ts rows between unbounded preceding and current row) as ema
from time_series order by ts;
```

```text
+------+-------+
| ts   | ema   |
+------+-------+
|    0 |     5 |
|    1 |   7.5 |
|    2 |  8.75 |
+------+-------+
```

### 상수 요구 사항 {#constant-requirement}

`half_decay` 매개변수는 상수여야 합니다. 컬럼 표현식을 전달하면 오류가 발생합니다.

```sql
-- this will cause an error: half_decay must be a constant
select exponential_moving_average(val, val, ts) from temparature_data;
```
