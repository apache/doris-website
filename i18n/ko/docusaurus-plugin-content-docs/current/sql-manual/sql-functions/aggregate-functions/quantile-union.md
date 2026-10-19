---
{
    "title": "QUANTILE_UNION",
    "language": "ko",
    "description": "QUANTILEUNION 함수는 분위수 계산의 여러 중간 결과를 병합하는 데 사용됩니다."
}
---

## 설명 {#description}

`QUANTILE_UNION` 함수는 분위수 계산의 여러 중간 결과를 병합하는 데 사용됩니다. 이 함수는 일반적으로 `QUANTILE_STATE`와 함께 사용하며, 특히 여러 단계에 걸쳐 분위수를 계산해야 하는 시나리오에 적합합니다.

## 구문 {#syntax}

```sql
QUANTILE_UNION(<query_state>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<query_state>` | 집계할 데이터로, QuantileState 타입을 지원합니다. |

## 반환 값 {#return-value}

추가 분위수 계산에 사용할 집계 상태를 반환하며, 반환 타입은 QuantileState입니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5, 'east'),
(2, 15.2, 'east'),
(3, 20.1, 'west'),
(4, 25.8, 'east'),
(5, 30.3, 'west'),
(6, 35.7, 'east'),
(7, 40.2, 'west'),
(8, 45.9, 'east'),
(9, 50.4, 'west'),
(10, 100.6, 'east');
```

```sql
SELECT 
    region,
    QUANTILE_PERCENT(
        QUANTILE_UNION(
            TO_QUANTILE_STATE(response_time, 2048)
        ),
        0.5
    ) AS median_response_time
FROM response_times
GROUP BY region;
```

지역별 응답 시간의 50번째 백분위수를 계산합니다.

```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```

```sql
SELECT QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048))
FROM response_times where response_time is null;
```

그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

```text
+--------------------------------------------------------+
| QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048)) |
+--------------------------------------------------------+
| NULL                                                   |
+--------------------------------------------------------+
```
