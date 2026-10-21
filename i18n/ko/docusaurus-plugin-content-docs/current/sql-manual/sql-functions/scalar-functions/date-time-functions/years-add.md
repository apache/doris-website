---
{
    "title": "YEARS_ADD",
    "language": "ko",
    "description": "YEARSADD 함수는 주어진 날짜 또는 시간 값에 지정한 연수를 더하거나 빼고, 조정된 날짜 또는 시간을 반환하는 데 사용됩니다."
}
---

## 설명 {#description}

YEARS_ADD 함수는 주어진 날짜 또는 시간 값에 지정한 연수를 더하거나 빼고, 조정된 날짜 또는 시간을 반환하는 데 사용됩니다. DATE, DATETIME, TIMESTAMP_NS 타입을 처리할 수 있으며, 연수는 양수(덧셈) 또는 음수(뺄셈)일 수 있습니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ 입력 타입을 지원합니다.

이 함수는 MySQL에서 YEAR를 단위로 사용하는 [date_add 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
YEARS_ADD(`<date_or_time_expr>`, `<years>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<years>` | 더할 연수로, 타입은 INT입니다. 음수는 뺄셈을, 양수는 덧셈을 의미합니다. |


## 반환값 {#return-value}

입력이 `TIMESTAMP_NS`이면 초의 소수점 이하 자릿수가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위에 속하는지 검증하며, `TIMESTAMP_NS`는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위를 사용합니다.

입력 타입(DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ)과 동일한 타입으로 조정된 날짜 또는 시간을 반환합니다. 반환값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.

- 입력이 DATE 타입이면 반환값은 DATE 타입입니다(연도, 월, 일만 조정).
- 입력이 DATETIME 타입이면 반환값은 DATETIME 타입입니다(연도, 월, 일은 조정되며 시, 분, 초는 변경되지 않음).
- 입력이 TIMESTAMPTZ 타입이면 반환값은 TIMESTAMPTZ 타입입니다(날짜, 시간 및 시간대 오프셋 포함).
- `<years_value>`가 음수이면 연수를 뺍니다(YEARS_SUB(`<datetime_or_date_value>`, `<years_value>`)와 동일).
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 계산 결과가 유효한 날짜 타입 범위(0000-01-01 00:00:00 ~ 9999-12-31 23:59:59)를 벗어나면 오류를 반환합니다.
- 조정된 월의 일수가 부족하면(예: 이월 29일에 1년을 더했을 때 다음 해가 윤년이 아닌 경우) 해당 월의 마지막 날로 자동 조정합니다(예: 2020-02-29에 1년을 더하면 2021-02-28 반환).

## 예제 {#examples}

```sql
-- DATETIME type add 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_ADD('2020-01-31 02:02:02', 1) AS add_1_year_datetime;
+-----------------------+
| add_1_year_datetime   |
+-----------------------+
| 2021-01-31 02:02:02   |
+-----------------------+

-- DATETIME type subtract 1 year (negative years_value, cross-year)
SELECT YEARS_ADD('2023-05-10 15:40:20', -1) AS subtract_1_year_datetime;
+--------------------------+
| subtract_1_year_datetime |
+--------------------------+
| 2022-05-10 15:40:20      |
+--------------------------+

-- DATE type add 3 years (only adjust date)
SELECT YEARS_ADD('2019-12-25', 3) AS add_3_year_date;
+------------------+
| add_3_year_date  |
+------------------+
| 2022-12-25       |
+------------------+

-- Leap day handling (2020-02-29 add 1 year, next year is not leap year)
SELECT YEARS_ADD('2020-02-29', 1) AS leap_day_adjust;
+------------------+
| leap_day_adjust  |
+------------------+
| 2021-02-28       |
+------------------+

-- Cross-month day adjustment (January 31st add 1 year to February)
SELECT YEARS_ADD('2023-01-31', 1) AS month_day_adjust;
+------------------+
| month_day_adjust |
+------------------+
| 2024-01-31       |  -- 2024 January has 31 days, no adjustment needed
+------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2026-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_ADD('9999-12-31', 1);
-- ERROR: Operation out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_ADD('0000-01-01', -1);
-- ERROR: Operation out of range
```
