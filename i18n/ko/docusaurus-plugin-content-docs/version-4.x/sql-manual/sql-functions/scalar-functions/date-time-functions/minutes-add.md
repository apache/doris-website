---
{
    "title": "MINUTES_ADD",
    "language": "ko",
    "description": "MINUTESADD 함수는 입력 날짜 및 시간 값에 지정된 분 수를 더하고, 그 결과를 새로운 날짜 및 시간 값으로 반환합니다."
}
---

## 설명 {#description}

MINUTES_ADD 함수는 입력 날짜 및 시간 값에 지정된 분 수를 더하고, 그 결과를 새로운 날짜 및 시간 값으로 반환합니다. 이 함수는 DATE, DATETIME 및 TIMESTAMPTZ 타입을 지원합니다.

이 함수는 MINUTE를 단위로 사용하는 [date_add 함수](./date-add) 및 MySQL의 [date_add 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE, DATETIME 또는 TIMESTAMPTZ 타입일 수 있습니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<minutes>` | 더할 분 수로, BIGINT 타입입니다. |

## 반환 값 {#return-value}

지정된 분 수 `<minutes>`를 기준 시간 `<datetime_like_type>`에 더한 결과를 반환하며, 반환 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.
- 첫 번째 매개변수가 TIMESTAMPTZ이면 TIMESTAMPTZ를 반환합니다.
- 첫 번째 매개변수가 DATETIME이면 DATETIME을 반환합니다.

특수한 경우:
- `<minutes>`가 음수이면 기준 시간에서 해당 분 수를 빼는 것과 동일하게 동작합니다(즉, MINUTES_ADD(date, -n)은 MINUTES_SUB(date, n)과 같습니다).
- 입력이 DATE 타입인 경우(연도, 월, 일만 포함), 시간 부분의 기본값은 00:00:00입니다.
- 입력 날짜 및 시간에 마이크로초가 포함되어 있으면 분을 더한 후에도 원래 마이크로초 정밀도가 유지됩니다(예: '2023-01-01 00:00:00.123456'에 1분을 더하면 '2023-01-01 00:01:00.123456'이 됩니다).
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00 ~ 9999-12-31 23:59:59.999999)를 벗어나면 예외가 발생합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Add minutes to DATE type (default time 00:00:00)
SELECT MINUTES_ADD('2020-02-02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 00:01:00 |
+---------------------+

-- Add minutes to DATETIME
SELECT MINUTES_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:33:18 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_ADD('2023-07-13 22:28:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:38:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to subtraction)
SELECT MINUTES_ADD('2023-07-13 22:28:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:23:18 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:23:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_ADD(NULL, 10), MINUTES_ADD('2023-07-13 22:28:18', NULL) AS result;
+-------------------------+--------+
| minutes_add(NULL, 10)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_add of 9999-12-31 23:59:59, 2 out of range
```
