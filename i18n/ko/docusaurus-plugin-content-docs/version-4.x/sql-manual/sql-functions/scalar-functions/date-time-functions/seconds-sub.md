---
{
    "title": "SECONDS_SUB",
    "language": "ko",
    "description": "SECONDSSUB 함수는 지정된 날짜 및 시간 값에서 지정한 초 수를 빼거나 더한 후 계산된 날짜 및 시간 값을 반환합니다."
}
---

## 설명 {#description}

SECONDS_SUB 함수는 지정된 날짜 및 시간 값에서 지정한 초 수를 빼거나 더한 후 계산된 날짜 및 시간 값을 반환합니다. 이 함수는 DATE, DATETIME 및 TIMESTAMPTZ 타입을 지원합니다. 음수를 입력하면 해당 초 수를 더하는 것과 같습니다.

이 함수는 SECOND를 단위로 사용하는 [date_sub 함수](./date-sub) 및 MySQL의 [date_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
SECONDS_SUB(<date_or_time_expr>, <seconds>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 필수입니다. 입력할 날짜 및 시간 값입니다. DATE, DATETIME 또는 TIMESTAMPTZ 타입을 사용할 수 있습니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<seconds>` | 필수입니다. 빼거나 더할 초 수입니다. 정수 타입(BIGINT)을 지원합니다. 양수는 초를 빼는 것을, 음수는 초를 더하는 것을 의미합니다. |

## 반환 값 {#return-value}

기준 시간 `<date_or_time_expr>`에서 지정한 초 수 `<second>`를 뺀 값을 반환하며, 반환 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.
- 첫 번째 매개변수의 타입이 DATE/DATETIME이면 DATETIME 타입을 반환합니다.
- 첫 번째 매개변수의 타입이 TIMESTAMPTZ이면 TIMESTAMPTZ 타입을 반환합니다.
  
특수한 경우:
- `<seconds>`가 음수이면 기준 시간에 해당 초 수를 더하는 것과 동일하게 동작합니다. 즉, SECONDS_SUB(date, -n)은 SECONDS_ADD(date, n)과 같습니다.
- 입력값이 DATE 타입(연도, 월, 일만 포함)인 경우 시간 부분의 기본값은 00:00:00입니다.
- 계산 결과가 날짜 타입의 유효 범위를 벗어나면 DATE 타입의 경우 예외가 발생합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
--- Subtract seconds from DATETIME type
SELECT SECONDS_SUB('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds to DATETIME type (using negative number)
SELECT SECONDS_SUB('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds across minute boundary
SELECT SECONDS_SUB('2023-07-14 00:00:10', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 23:59:55 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_SUB('2023-01-01', 3600) AS result;  -- Subtract 1 hour (3600 seconds)
+---------------------+
| result              |
+---------------------+
| 2022-12-31 23:00:00 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT SECONDS_SUB('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:23.123456 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:32.123+08:00                   |
+-------------------------------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_SUB(NULL, 30), SECONDS_SUB('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_sub(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:00, -1 out of range
```
