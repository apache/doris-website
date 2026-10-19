---
{
    "title": "YEARS_SUB",
    "language": "ko",
    "description": "YEARSSUB 함수는 주어진 날짜 또는 시간 값에서 지정한 연수를 빼거나 더하는 데 사용됩니다."
}
---

## 설명 {#description}

YEARS_SUB 함수는 주어진 날짜 또는 시간 값에서 지정한 연수를 빼거나 더하여 조정된 날짜 또는 시간을 반환합니다(즉, years_value × 1년을 뺍니다). DATE 및 DATETIME 타입을 처리할 수 있으며, 연수는 양수(빼기) 또는 음수(더하기)일 수 있습니다. 이 함수는 DATE, DATETIME 및 TIMESTAMPTZ 입력 타입을 지원합니다.

이 함수는 MySQL에서 YEAR를 단위로 사용하는 [date_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
YEARS_SUB(`<date_or_time_expr>`, `<years>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, date/datetime/timestamptz 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.  |
| `<years>` | 뺄 연수로, INT 타입입니다. 양수는 빼기를, 음수는 더하기를 의미합니다. |

## 반환 값 {#return-value}

입력 타입(DATE, DATETIME 또는 TIMESTAMPTZ)과 동일한 타입으로 조정된 날짜 또는 시간을 반환합니다. 반환 값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다:

- 입력이 DATE 타입이면 반환 값도 DATE 타입입니다(연, 월, 일만 조정).
- 입력이 DATETIME 타입이면 반환 값도 DATETIME 타입입니다(연, 월, 일은 조정되며 시, 분, 초는 그대로 유지).
- 입력이 TIMESTAMPTZ 타입이면 반환 값도 TIMESTAMPTZ 타입입니다(날짜, 시간 및 시간대 오프셋 포함).
- `<years_value>`가 음수이면 연수를 더합니다(YEARS_ADD(`<datetime_or_date_value>`, `<years_value>`)와 동일).
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 계산 결과가 날짜 타입의 유효 범위(0000-01-01 00:00:00 ~ 9999-12-31 23:59:59)를 벗어나면 오류를 반환합니다.
- 조정된 월의 일수가 부족하면(예: 윤년 이월 29일에서 1년을 빼 평년 이월 28일이 되는 경우) 해당 월의 실제 일수에 맞게 자동으로 조정합니다.

## 예제 {#examples}

```sql
-- DATETIME type subtract 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_SUB('2020-02-02 02:02:02', 1) AS sub_1_year_datetime;
+---------------------+
| sub_1_year_datetime |
+---------------------+
| 2019-02-02 02:02:02 |
+---------------------+

-- DATETIME type add 1 year (negative years_value, cross-year)
SELECT YEARS_SUB('2022-05-10 15:40:20', -1) AS add_1_year_datetime;
+---------------------+
| add_1_year_datetime |
+---------------------+
| 2023-05-10 15:40:20 |
+---------------------+

-- DATE type subtract 3 years (only adjust date)
SELECT YEARS_SUB('2022-12-25', 3) AS sub_3_year_date;
+-----------------+
| sub_3_year_date |
+-----------------+
| 2019-12-25      |
+-----------------+

-- Leap day handling (from leap year February 29th subtract 1 year to non-leap year February 28th)
SELECT YEARS_SUB('2020-02-29', 1) AS leap_day_adjust_1;
+-------------------+
| leap_day_adjust_1 |
+-------------------+
| 2019-02-28        |
+-------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2024-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 9999-12-31, 1 out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 0000-01-01, -1 out of range
```
