---
{
    "title": "QUANTILE_PERCENT",
    "language": "ko",
    "description": "QUANTILEPERCENT 함수는 주어진 백분율에 해당하는 분위수 값을 계산하는 데 사용됩니다."
}
---

## 설명 {#description}

`QUANTILE_PERCENT` 함수는 주어진 백분율에 해당하는 분위수 값을 계산하는 데 사용됩니다. 이 함수는 quantile_state 컬럼과 백분율을 나타내는 부동 소수점 상수, 두 개의 매개변수를 받습니다. 주어진 백분율 위치의 분위수 값을 나타내는 부동 소수점 수를 반환합니다.

## 구문 {#syntax}

```sql
QUANTILE_PERCENT(<quantile_state>, <percent>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<quantile_state>` | 대상 컬럼입니다.|
| `<percent>` | 대상 백분율입니다.|

## 반환 값 {#return-value}

분위수를 나타내는 `Double` 타입의 값을 반환합니다.

## 예제 {#example}

```sql
CREATE TABLE IF NOT EXISTS quantile_state_agg_test (
         `dt` int(11) NULL COMMENT "",
         `id` int(11) NULL COMMENT "",
         `price` quantile_state QUANTILE_UNION NOT NULL COMMENT ""
        ) ENGINE=OLAP
        AGGREGATE KEY(`dt`, `id`)
        COMMENT "OLAP"
        DISTRIBUTED BY HASH(`dt`) BUCKETS 1
        PROPERTIES ("replication_num" = "1");

INSERT INTO quantile_state_agg_test VALUES(20220201,0, to_quantile_state(1, 2048));

INSERT INTO quantile_state_agg_test VALUES(20220201,1, to_quantile_state(-1, 2048)),
            (20220201,1, to_quantile_state(0, 2048)),(20220201,1, to_quantile_state(1, 2048)),
            (20220201,1, to_quantile_state(2, 2048)),(20220201,1, to_quantile_state(3, 2048));

SELECT dt, id, quantile_percent(quantile_union(price), 0) FROM quantile_state_agg_test GROUP BY dt, id ORDER BY dt, id
```

결과는 다음과 같습니다.

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
