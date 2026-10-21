---
{
    "title": "HOURS_SUB",
    "language": "ko",
    "description": "DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에서 지정된 시간 수를 빼고 해당 날짜 및 시간 타입을 유지합니다."
}
---

## 설명 {#description}

HOURS_SUB 함수는 입력 날짜 또는 일시 값에서 지정된 시간 수를 빼고 계산된 새 일시를 반환합니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ 입력 타입을 모두 지원합니다. 입력이 DATE 타입(연도, 월, 일만 포함)이면 시간 부분의 기본값은 00:00:00입니다.

이 함수는 [date_sub 함수](./date-sub) 및 MySQL의 [date_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)에서 `HOUR` 단위를 사용할 때와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
HOURS_SUB(`<date_or_time_expr>`, `<hours>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ---- | ---- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<hours>` | 뺄 시간 수로, INT 타입입니다. |

## 반환 값 {#return-value}

기준 시간 `<date_or_time_expr>`에서 지정된 시간 수 `<hours>`를 뺀 값을 반환합니다. 반환 값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다:
- 첫 번째 매개변수가 `DATE` 또는 `DATETIME`이면 반환 타입은 `DATETIME`이며, `TIMESTAMP_NS`이면 반환 타입은 `TIMESTAMP_NS`입니다.
- 첫 번째 매개변수의 타입이 TIMESTAMPTZ이면 반환 타입은 TIMESTAMPTZ입니다.

특수한 경우:
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59까지)를 벗어나면 오류를 반환합니다.
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 입력 시간 수가 음수이면 해당 시간 수를 더한 일시를 반환합니다.

## 예제 {#examples}

```sql

-- Subtract positive hours
SELECT HOURS_SUB('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 01:02:02                                        |
+------------------------------------------------------------+

-- Subtract hours from date type
select hours_sub('2023-10-01', 12);
+-----------------------------+
| hours_sub('2023-10-01', 12) |
+-----------------------------+
| 2023-09-30 12:00:00         |
+-----------------------------+

-- Input hours is negative, returns datetime plus hours
select hours_sub('2023-10-01 10:00:00', -3);
+--------------------------------------+
| hours_sub('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 13:00:00                  |
+--------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 11:22:33.123+08:00                 |
+-----------------------------------------------+

-- Any parameter is NULL, return NULL
select hours_sub('2023-10-01 10:00:00', NULL);
+----------------------------------------+
| hours_sub('2023-10-01 10:00:00', NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+

-- Exceeds datetime range, return NULL
mysql> select hours_sub('9999-12-31 12:00:00', -20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 12:00:00, 20 out of range

mysql> select hours_sub('0000-01-01 12:00:00', 20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 12:00:00, -20 out of range
```
