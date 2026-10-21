---
{
    "title": "QUARTERS_SUB",
    "language": "ko",
    "description": "QUARTERSSUB 함수는 지정된 datetime 값에서 지정된 분기 수(1분기 = 3개월)를 빼거나 더하고 결과를 반환하는 데 사용됩니다."
}
---

## 설명 {#description}

QUARTERS_SUB 함수는 지정된 datetime 값에서 지정된 분기 수(1분기 = 3개월)를 빼거나 더하고 계산된 datetime 값을 반환하는 데 사용됩니다. 이 함수는 DATE 및 DATETIME 타입의 처리를 지원합니다. 음수를 입력하면 해당 분기 수를 더하는 것과 같습니다. 이 함수는 DATE, DATETIME 및 TIMESTAMPTZ 입력 타입을 지원합니다.

이 함수는 QUARTER를 단위로 사용할 때 [date_sub 함수](./date-sub)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
QUARTERS_SUB(`<date_or_time_expr>`, `<quarters>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 또는 datetime 값입니다. date/datetime/timestamptz 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<quarters>` | 더하거나 뺄 분기 수입니다. 양의 정수는 빼기를, 음의 정수는 더하기를 의미합니다. |

## 반환값 {#return-value}

입력 날짜 타입에 맞는 날짜 값을 반환하며, 반환값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.

- `<quarters>`가 음수이면 기준 시간에 해당 분기 수를 더하는 것과 동일하게 동작합니다. 즉, QUARTERS_SUB(date, -n)은 QUARTERS_ADD(date, n)과 같습니다.
- 입력이 DATE 타입(연, 월, 일만 포함)이면 결과는 DATE 타입입니다. 입력이 DATETIME 타입이면 결과는 DATETIME 타입이며 원래 시간 부분을 유지합니다. 예를 들어, '2023-04-01 12:34:56'에서 1분기를 빼면 '2023-01-01 12:34:56'이 됩니다.
- 입력이 TIMESTAMPTZ 타입이면 반환값도 TIMESTAMPTZ 타입입니다. 날짜, 시간 및 시간대 오프셋을 포함합니다.
- 입력 날짜가 해당 월의 마지막 날이고 대상 월의 일수가 해당 날짜보다 적으면 대상 월의 마지막 날로 자동 조정됩니다. 예를 들어, 사월 30일에서 1분기(3개월)를 빼면 일월 31일이 됩니다.
- 계산 결과가 날짜 타입의 유효 범위(DATE 타입: 0000-01-01부터 9999-12-31까지; DATETIME 타입: 0000-01-01 00:00:00부터 9999-12-31 23:59:59까지)를 벗어나면 예외가 발생합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
--- Subtract quarters from DATE type
SELECT QUARTERS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-10-31 |
+------------+

--- Subtract quarters from DATETIME type (preserves time component)
SELECT QUARTERS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-10-31 02:02:02 |
+---------------------+

--- Negative quarters (equivalent to addition)
SELECT QUARTERS_SUB('2019-10-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-01-31 |
+------------+

--- Non-end-of-month date subtracting quarters (direct decrement)
SELECT QUARTERS_SUB('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT QUARTERS_SUB('2023-10-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- Subtracting quarters across years
SELECT QUARTERS_SUB('2024-04-01', 2) AS result;
+------------+
| result     |
+------------+
| 2023-10-01 |
+------------+

--- Returns NULL when input is NULL
SELECT QUARTERS_SUB(NULL, 1), QUARTERS_SUB('2023-07-13', NULL) AS result;
+-------------------------+--------+
| quarters_sub(NULL, 1)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT QUARTERS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+--------------------------------------------------+
| QUARTERS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+--------------------------------------------------+
| 2025-07-10 12:22:33.123+08:00                    |
+--------------------------------------------------+

--- Calculation result exceeds date range
SELECT QUARTERS_SUB('0000-04-30', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_sub of 0000-04-30, 1 out of range

SELECT QUARTERS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_sub of 9999-12-31, -1 out of range
```
