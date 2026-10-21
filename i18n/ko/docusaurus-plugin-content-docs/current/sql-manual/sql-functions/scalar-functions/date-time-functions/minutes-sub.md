---
{
    "title": "MINUTES_SUB",
    "language": "ko",
    "description": "DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에서 지정된 분 수를 빼고 해당 날짜 및 시간 타입을 유지합니다."
}
---

## 설명 {#description}

MINUTES_SUB 함수는 입력 날짜 및 시간 값에서 지정된 분 수를 빼고 계산된 새 날짜 및 시간 값을 반환합니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS 및 TIMESTAMPTZ 타입을 지원합니다.

이 함수는 MINUTE를 단위로 사용할 때 [date_sub 함수](./date-sub) 및 MySQL의 [date_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 타입일 수 있습니다. 구체적인 날짜 및 시간 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<minutes>` | 뺄 분 수로, BIGINT 타입입니다. 양수 또는 음수일 수 있습니다. |

## 반환 값 {#return-value}

입력값이 `TIMESTAMP_NS`이면 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위 내에 있는지 검증하며, `TIMESTAMP_NS`의 범위는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`입니다.

지정된 분 수 `<minutes>`를 기준 시간 `<datetime_like_type>`에서 뺀 결과를 반환하며, 반환 타입은 첫 번째 매개변수의 타입에 따라 달라집니다:
- 첫 번째 매개변수가 TIMESTAMPTZ이면 TIMESTAMPTZ를 반환합니다.
- 첫 번째 매개변수가 DATETIME이면 DATETIME을 반환합니다.

특수한 경우:
- `<minutes>`가 음수이면 기준 시간에 해당 분 수를 더하는 것과 동일하게 동작합니다(즉, MINUTES_SUB(date, -n)은 MINUTES_ADD(date, n)과 동일합니다).
- 입력값이 DATE 타입이면(연도, 월, 일만 포함) 시간 부분의 기본값은 00:00:00입니다.
- 입력 날짜 및 시간 값에 마이크로초가 포함되어 있으면 분을 뺀 후에도 기존 마이크로초 정밀도가 유지됩니다(예: '2023-01-01 00:01:00.123456'에서 1분을 빼면 '2023-01-01 00:00:00.123456'이 됩니다).
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59.999999까지)를 벗어나면 예외가 발생합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Subtract minutes from DATETIME
SELECT MINUTES_SUB('2020-02-02 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 02:01:02 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_SUB('2023-07-13 22:38:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to addition)
SELECT MINUTES_SUB('2023-07-13 22:23:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:18 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_SUB('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-12 23:30:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:21:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_SUB(NULL, 10), MINUTES_SUB('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| MINUTES_SUB(NULL, 10) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_add of 0000-01-01 00:00:00, -1 out of range
```
