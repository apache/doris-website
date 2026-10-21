---
{
    "title": "WEEKS_SUB",
    "language": "ko",
    "description": "WEEKSSUB 함수는 주어진 날짜 또는 시간 값에서 지정된 주 수를 빼거나 더하는 데 사용됩니다."
}
---

## 설명 {#description}
WEEKS_SUB 함수는 주어진 날짜 또는 시간 값에서 지정된 주 수를 빼거나 더한 날짜 또는 시간을 반환합니다. 이는 weeks_value × 7일을 빼는 것과 같습니다. DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ 타입을 지원합니다.

이 함수는 MySQL에서 WEEK를 단위로 사용하는 [weeks_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub)와 동일하게 동작합니다.

## 구문 {#syntax}
```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.|
| `week_period` | 뺄 주 수를 나타내는 INT 타입 정수입니다. 양수이면 빼고, 음수이면 더합니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 타입의 입력값은 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위 내에 있는지 검증하며, `TIMESTAMP_NS`의 범위는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`입니다.
지정된 주 수를 뺀 날짜 또는 시간을 반환하며, 반환 값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.

- 입력값이 DATE 타입이면 반환 값도 DATE 타입입니다(연, 월, 일만 조정).
- 입력값이 DATETIME 타입이면 반환 값도 DATETIME 타입입니다(연, 월, 일은 조정되고 시, 분, 초는 유지).
- 입력값이 TIMESTAMPTZ 타입이면 반환 값도 TIMESTAMPTZ 타입입니다(날짜, 시간, 시간대 오프셋 포함).

특수한 경우:
- `<weeks_value>`가 음수이면 주 수를 더합니다(WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`)와 동일).
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 계산 결과가 날짜 타입의 유효 범위(0000-01-01 00:00:00에서 9999-12-31 23:59:59까지)를 벗어나면 오류를 반환합니다.
  
## 예제 {#examples}
```sql
-- DATETIME type subtract 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_SUB('2023-10-01 08:30:45', 1) AS sub_1_week_datetime;
+---------------------+
| sub_1_week_datetime |
+---------------------+
| 2023-09-24 08:30:45 |
+---------------------+

-- DATETIME type add 1 week (negative weeks_value, cross-month)
SELECT WEEKS_SUB('2023-09-24 14:20:10', -1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-01 14:20:10 |
+---------------------+

-- DATE type subtract 2 weeks (only adjust date, no time portion)
SELECT WEEKS_SUB('2023-06-03', 2) AS sub_2_week_date;
+-----------------+
| sub_2_week_date |
+-----------------+
| 2023-05-20      |
+-----------------+

-- Cross-year subtraction (early January minus 1 week, to late December of previous year)
SELECT WEEKS_SUB('2024-01-01', 1) AS cross_year_sub;
+----------------+
| cross_year_sub |
+----------------+
| 2023-12-25     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-03 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- The calculation result exceeds the lower bound of the datetime range.
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_sub of 0000-01-01, -1 out of range

-- The calculation result exceeds the upper bound of the datetime range.
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_sub of 9999-12-31, 1 out of range
```
