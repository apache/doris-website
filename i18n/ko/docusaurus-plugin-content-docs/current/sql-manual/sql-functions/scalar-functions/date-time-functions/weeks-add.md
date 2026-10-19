---
{
    "title": "WEEKS_ADD",
    "language": "ko",
    "description": "WEEKSADD 함수는 주어진 날짜 또는 시간 값에 지정된 주 수를 더하거나 빼는 데 사용됩니다."
}
---

## 설명 {#description}

WEEKS_ADD 함수는 주어진 날짜 또는 시간 값에 지정된 주 수를 더하거나 빼고, 조정된 날짜 또는 시간을 반환합니다. 이는 원래 날짜에 일곱 일씩 더하거나 빼는 것과 같습니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ 입력 타입을 지원합니다.

이 함수는 MySQL에서 WEEK를 단위로 사용하는 [weeks_add 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-add)와 동일하게 동작합니다.

## 구문 {#syntax}
```sql
WEEKS_ADD(`<datetime_or_date_expr>`, `<weeks_value>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<datetime_or_date_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<weeks_value>` | 더하거나 뺄 주 수를 나타내는 INT 타입 정수입니다(양수는 더하기, 음수는 빼기). |

## 반환값 {#return-value}

`TIMESTAMP_NS` 입력은 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과는 반환 타입의 범위를 기준으로 검증하며, `TIMESTAMP_NS`는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위를 사용합니다.

지정된 주 수를 더한 날짜 및 시간 값을 반환하며, 반환값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.

- 입력이 DATE 타입이면 반환값도 DATE 타입입니다(연도, 월, 일만 조정).
- 입력이 DATETIME 타입이면 반환값도 DATETIME 타입입니다(연도, 월, 일은 조정되고 시, 분, 초는 그대로 유지).
- 입력이 TIMESTAMPTZ 타입이면 반환값도 TIMESTAMPTZ 타입입니다(날짜, 시간, 시간대 오프셋 포함).

특수한 경우:
- `<weeks_value>`가 음수이면 해당 주 수만큼 뺍니다.
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 계산 결과가 날짜 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59까지)를 벗어나면 오류를 반환합니다.

## 예제 {#examples}
```sql
-- DATETIME type add 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_ADD('2023-10-01 08:30:45', 1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-08 08:30:45 |
+---------------------+

-- DATETIME type subtract 1 week (negative weeks, cross-month)
SELECT WEEKS_ADD('2023-10-01 14:20:10', -1) AS subtract_1_week_datetime;
+--------------------------+
| subtract_1_week_datetime |
+--------------------------+
| 2023-09-24 14:20:10      |
+--------------------------+

-- DATE type add 2 weeks (only adjust date, no time portion)
SELECT WEEKS_ADD('2023-05-20', 2) AS add_2_week_date;
+-----------------+
| add_2_week_date |
+-----------------+
| 2023-06-03      |
+-----------------+

-- Cross-year addition (late December plus 1 week, to early January next year)
SELECT WEEKS_ADD('2023-12-25', 1) AS cross_year_add;
+----------------+
| cross_year_add |
+----------------+
| 2024-01-01     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-17 12:22:33.123+08:00                 |
+-----------------------------------------------+
```
