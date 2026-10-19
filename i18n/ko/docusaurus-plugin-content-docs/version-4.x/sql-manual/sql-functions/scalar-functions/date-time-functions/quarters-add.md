---
{
    "title": "QUARTERS_ADD",
    "language": "ko",
    "description": "QUARTERSADD 함수는 지정된 datetime 값에 지정된 분기 수(1분기 = 3개월)를 더하거나 빼고 결과를 반환합니다."
}
---

## 설명 {#description}

QUARTERS_ADD 함수는 지정된 datetime 값에 지정된 분기 수(1분기 = 3개월)를 더하거나 빼고 계산된 datetime 값을 반환합니다. 이 함수는 DATE 및 DATETIME 타입을 처리할 수 있습니다. 음수를 입력하면 해당 분기 수를 빼는 것과 같습니다. 이 함수는 DATE, DATETIME 및 TIMESTAMPTZ 입력 타입을 지원합니다.

이 함수는 QUARTER를 단위로 사용하는 [date_add 함수](./date-add)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
QUARTERS_ADD(`<date_or_time_expr>`, `<quarters>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 또는 datetime 값입니다. date/datetime/timestamptz 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<quarters>` | 더하거나 뺄 분기 수입니다. 양의 정수는 덧셈을, 음의 정수는 뺄셈을 나타냅니다. |

## 반환 값 {#return-value}

입력 날짜 타입과 동일한 타입의 날짜 값을 반환합니다. 반환 값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.
- `<quarters>`가 음수이면 기준 시각에서 해당 분기 수를 빼는 것과 동일하게 동작합니다. 즉, QUARTERS_ADD(date, -n)은 QUARTERS_SUB(date, n)과 같습니다.
- 입력이 DATE 타입(연도, 월, 일만 포함)이면 결과는 DATE 타입입니다. 입력이 DATETIME 타입이면 결과는 DATETIME 타입이며 원래의 시간 부분이 유지됩니다(예: '2023-01-01 12:34:56'에 1분기를 더하면 '2023-04-01 12:34:56'이 됩니다).
- 입력이 TIMESTAMPTZ 타입이면 반환 값은 TIMESTAMPTZ 타입입니다(날짜, 시간 및 시간대 오프셋 포함).
- 입력 날짜가 해당 월의 마지막 날이고 대상 월의 일수가 입력 날짜의 일보다 작으면 대상 월의 마지막 날로 자동 조정됩니다(예: 일월 31일에 1분기(3개월)를 더하면 사월 30일이 됩니다).
- 계산 결과가 날짜 타입의 유효 범위(DATE 타입: 0000-01-01부터 9999-12-31까지, DATETIME 타입: 0000-01-01 00:00:00부터 9999-12-31 23:59:59까지)를 벗어나면 예외가 발생합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
--- Add quarters to DATE type
SELECT QUARTERS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-04-30 |
+------------+

--- Add quarters to DATETIME type (preserves time component)
SELECT QUARTERS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-04-30 02:02:02 |
+---------------------+

--- Negative quarters (equivalent to subtraction)
SELECT QUARTERS_ADD('2020-04-30', -1) AS result;
+------------+
| result     |
+------------+
| 2020-01-30 |
+------------+

--- Non-end-of-month date adding quarters (direct accumulation)
SELECT QUARTERS_ADD('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT QUARTERS_ADD('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

--- Adding quarters across years
SELECT QUARTERS_ADD('2023-10-01', 2) AS result;
+------------+
| result     |
+------------+
| 2024-04-01 |
+------------+

--- Returns NULL when input is NULL
SELECT QUARTERS_ADD(NULL, 1), QUARTERS_ADD('2023-07-13', NULL) AS result;
+-------------------------+--------+
| quarters_add(NULL, 1)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT QUARTERS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+--------------------------------------------------+
| QUARTERS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+--------------------------------------------------+
| 2026-01-10 12:22:33.123+08:00                    |
+--------------------------------------------------+

--- Calculation result exceeds date range
SELECT QUARTERS_ADD('9999-10-31', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_add of 9999-10-31, 6 out of range

SELECT QUARTERS_ADD('0000-01-01',-2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_add of 0000-01-01, -6 out of range
```
