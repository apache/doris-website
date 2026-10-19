---
{
    "title": "SECONDS_DIFF",
    "language": "ko",
    "description": "SECONDSDIFF 함수는 두 날짜 및 시간 값의 차이를 계산하고 결과를 초 단위로 반환합니다."
}
---

## 설명 {#description}

SECONDS_DIFF 함수는 두 날짜 및 시간 값의 차이를 계산하고 결과를 초 단위로 반환합니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS 타입을 지원합니다. 입력이 DATE 타입이면 시간 부분의 기본값은 00:00:00입니다.

## 구문 {#syntax}

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 필수입니다. 종료 날짜 및 시간 값입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`를 지원합니다. 구체적인 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 필수입니다. 시작 날짜 및 시간 값입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`를 지원합니다. |

## 반환 값 {#return-value}

두 날짜 및 시간 값의 차이를 초 단위로 나타내는 BIGINT 타입의 값을 반환합니다.

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 나중이면 양수를 반환합니다;
- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 이전이면 음수를 반환합니다;
- 두 시간이 같으면 0을 반환합니다;
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다;
- 소수 초가 포함된 시간의 경우 소수 부분의 차이도 계산에 포함됩니다.

## 예제 {#examples}

```sql
--- Seconds difference within the same hour
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

--- End time is earlier than start time (returns negative number)
SELECT SECONDS_DIFF('2023-01-01 00:00:00', '2023-01-01 00:01:00') AS result;
+--------+
| result |
+--------+
|    -60 |
+--------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_DIFF('2023-01-02', '2023-01-01') AS result;  -- 1 day difference (86400 seconds)
+--------+
| result |
+--------+
|  86400 |
+--------+

--- TIMESTAMP_NS can be used for either parameter
SELECT SECONDS_DIFF(CAST('2024-01-01 00:00:02.000000000' AS TIMESTAMP_NS),
                    CAST('2024-01-01 00:00:00' AS DATETIME)) AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- Times with scale include fractional part difference in calculation
mysql> SELECT SECONDS_DIFF('2023-07-13 12:00:00', '2023-07-13 11:59:59.6') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Any parameter is NULL (returns NULL)
SELECT SECONDS_DIFF(NULL, '2023-07-13 10:30:25'), SECONDS_DIFF('2023-07-13 10:30:25', NULL) AS result;
+-------------------------------------------+--------+
| seconds_diff(NULL, '2023-07-13 10:30:25') | result |
+-------------------------------------------+--------+
| NULL                                      | NULL   |
+-------------------------------------------+--------+
```
