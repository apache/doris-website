---
{
    "title": "WEEKS_DIFF",
    "language": "ko",
    "description": "WEEKSDIFF 함수는 두 날짜 또는 시간 값 사이의 차이를 온전한 주 단위로 계산합니다."
}
---

## 설명 {#description}
WEEKS_DIFF 함수는 두 날짜 또는 시간 값 사이의 차이를 온전한 주 단위로 계산하며, 종료 시간에서 시작 시간을 뺀 결과를 주 수로 반환합니다(7일을 1주로 계산). DATE, DATETIME, TIMESTAMP_NS 타입과 올바른 형식의 문자열을 지원하며, 계산 시 시, 분, 초를 포함한 전체 시간 차이를 고려합니다.

## 구문 {#syntax}

```sql
WEEKS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr1>` | 더 늦은 날짜 또는 날짜/시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜/시간 및 날짜 형식은 [날짜/시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 더 이른 날짜 또는 날짜/시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. |

## 반환값 {#return-value}

`<date_or_time_expr1>`과 `<date_or_time_expr2>` 사이의 온전한 주 단위 차이를 나타내는 INT 타입 정수를 반환합니다.

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 늦으면 양수를 반환합니다(전체 일수 차이 ÷ 7의 정수 부분).
- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 이르면 음수를 반환합니다(같은 방식으로 계산한 뒤 결과의 부호를 반대로 바꿉니다).
- 입력이 DATE 타입이면 시간 부분의 기본값은 00:00:00입니다.
- 계산 시 시, 분, 초를 포함한 전체 시간 차이를 고려하며, "온전히 경과한 7일" 단위로만 계산하고 일주일 미만의 나머지 일수는 무시합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- "온전히 경과한 7일" 단위로만 계산합니다. 예를 들어, 8일 차이는 1주를 반환하고 6일 차이는 0주를 반환합니다. '2023-10-08 00:00:00'과 '2023-10-01 12:00:00'의 차이는 6.5일이므로 0주를 반환하고, '2023-10-08 12:00:00'과 '2023-10-01 00:00:00'의 차이는 7.5일이므로 1주를 반환합니다.

## 예제 {#examples}
```sql
-- Two DATE types differ by 8 weeks (56 days)
SELECT WEEKS_DIFF('2020-12-25', '2020-10-25') AS diff_date;
+-----------+
| diff_date |
+-----------+
|         8 |
+-----------+

-- DATETIME type with time portions (total 56 days difference, ignoring hour/minute/second differences)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25 12:10:02') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             8 |
+---------------+

-- Mixed DATE and DATETIME calculation (DATE defaults to 00:00:00)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25') AS diff_mixed;
+-------------+
| diff_mixed  |
+-------------+
|           8 |
+-------------+

-- Less than 1 week (6 days), returns 0
SELECT WEEKS_DIFF('2023-10-07', '2023-10-01') AS diff_6_days;
+-------------+
| diff_6_days |
+-------------+
|           0 |
+-------------+

-- More than 1 week (8 days), returns 1
SELECT WEEKS_DIFF('2023-10-09', '2023-10-01') AS diff_8_days;
+-------------+
| diff_8_days |
+-------------+
|           1 |
+-------------+

-- Time portion impact: 7.5 days difference (returns 1) vs 6.5 days (returns 0)
SELECT 
  WEEKS_DIFF('2023-10-08 12:00:00', '2023-10-01 00:00:00') AS diff_7_5d,
  WEEKS_DIFF('2023-10-08 00:00:00', '2023-10-01 12:00:00') AS diff_6_5d;
+-----------+-----------+
| diff_7_5d | diff_6_5d |
+-----------+-----------+
|         1 |         0 |
+-----------+-----------+

-- End time earlier than start time, returns negative number
SELECT WEEKS_DIFF('2023-10-01', '2023-10-08') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -1 |
+---------------+

-- Cross-year calculation (2023-12-25 to 2024-01-01 differs by 7 days, returns 1)
SELECT WEEKS_DIFF('2024-01-01', '2023-12-25') AS cross_year;
+------------+
| cross_year |
+------------+
|          1 |
+------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  WEEKS_DIFF(NULL, '2023-10-01') AS null_input1,
  WEEKS_DIFF('2023-10-01', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
