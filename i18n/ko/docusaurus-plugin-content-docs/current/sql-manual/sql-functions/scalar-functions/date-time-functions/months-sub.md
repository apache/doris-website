---
{
    "title": "MONTHS_SUB",
    "language": "ko",
    "description": "DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에서 지정한 개월 수를 빼고 원래의 시간 타입을 유지합니다."
}
---

## 설명 {#description}

MONTHS_SUB 함수는 입력된 날짜 및 시간 값에서 지정한 개월 수를 빼고 그 결과인 새 날짜 및 시간 값을 반환합니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ 타입을 지원합니다. 음수를 입력하면 해당 개월 수를 더하는 것과 같습니다.

이 함수는 MONTH를 단위로 사용할 때 [date_sub 함수](./date-sub) 및 MySQL의 [date_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 개월 수를 뺄 기준 날짜 값입니다. DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<nums>` | 뺄 개월 수이며, INT 타입입니다. 양수는 날짜 및 시간에서 nums개월을 빼는 것을, 음수는 nums개월을 더하는 것을 의미합니다. |

## 반환값 {#return-value}

입력 `<date_or_time_expr>`와 동일한 타입(DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ)의 값을 반환합니다. 이 값은 기준 시간에서 지정한 개월 수를 뺀 결과를 나타냅니다.

- `<nums>`가 음수이면 기준 시간에 해당 개월 수를 더하는 것과 동일하게 동작합니다(즉, MONTHS_SUB(date, -n)은 MONTHS_ADD(date, n)과 같습니다).
- 입력 날짜가 해당 월의 마지막 날이고 대상 월의 일수가 해당 날짜의 일자보다 작으면 대상 월의 마지막 날로 자동 조정됩니다(예: 삼월 31일에서 1개월을 빼면 윤년 여부에 따라 이월 28일 또는 29일이 됩니다).
- 계산 결과가 날짜 타입의 유효 범위(DATE 타입: 0000-01-01 ~ 9999-12-31, DATETIME 타입: 0000-01-01 00:00:00 ~ 9999-12-31 23:59:59)를 벗어나면 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
--- Subtract months from DATE type
SELECT MONTHS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

--- Subtract months from DATETIME type (preserves time component)
SELECT MONTHS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-12-31 02:02:02 |
+---------------------+

--- Negative months (equivalent to addition)
SELECT MONTHS_SUB('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

--- Non-end-of-month date subtracting months (direct decrement)
SELECT MONTHS_SUB('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT MONTHS_SUB('2023-10-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- Returns NULL when input is NULL
SELECT MONTHS_SUB(NULL, 5), MONTHS_SUB('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_sub(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MONTHS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+------------------------------------------------+
| MONTHS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+------------------------------------------------+
| 2025-09-10 12:22:33.123+08:00                  |
+------------------------------------------------+

--- Calculation result exceeds date range
mysql> SELECT MONTHS_SUB('0000-01-01', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 0000-01-01, -1 out of range

mysql> SELECT MONTHS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 9999-12-31, 1 out of range
```
