---
{
    "title": "HOURS_ADD",
    "language": "ko",
    "description": "DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에 시간을 더하거나 뺍니다."
}
---

## 설명 {#description}

HOURS_ADD 함수는 입력된 날짜 또는 날짜 및 시간 값에 지정된 시간 수를 더하거나 빼고, 계산된 새 날짜 및 시간 값을 반환합니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ 입력 타입을 지원합니다. 입력이 DATE 타입(연도, 월, 일만 포함)이면 시간을 더하기 전에 시간 부분의 기본값을 00:00:00으로 설정합니다.

이 함수의 동작은 [date_add 함수](./date-add) 및 MySQL의 [date_add 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)에서 `HOUR` 단위를 사용할 때와 일치합니다.

## 구문 {#syntax}

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ---- | ---- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<hours>` | 더할 시간 수로, 정수(INT) 타입입니다. 양수 또는 음수를 사용할 수 있습니다. 양수이면 지정된 시간 수를 더하고, 음수이면 지정된 시간 수를 뺍니다(시간 빼기와 동일). |

## 반환값 {#return-value}

기준 시간 `<date_or_time_expr>`에 지정된 시간 수 `<hours>`를 더한 값을 반환하며, 반환값의 타입은 첫 번째 매개변수의 타입에 따라 결정됩니다.
- 첫 번째 매개변수가 `DATE` 또는 `DATETIME`이면 반환 타입은 `DATETIME`입니다. `TIMESTAMP_NS`이면 반환 타입은 `TIMESTAMP_NS`입니다.
- 첫 번째 매개변수의 타입이 TIMESTAMPTZ이면 반환 타입은 TIMESTAMPTZ입니다.

특수한 경우의 동작:
- 계산 결과가 DATETIME 타입의 유효 범위 [0000-01-01 00:00:01, 9999-12-31 23:59:59]를 벗어나면 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql

-- Add hours to datetime type
SELECT HOURS_ADD('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 03:02:02                                        |
+------------------------------------------------------------+

-- Add hours to date type (default time is 00:00:00)
SELECT HOURS_ADD('2020-02-02', 51);
+-----------------------------+
| HOURS_ADD('2020-02-02', 51) |
+-----------------------------+
| 2020-02-04 03:00:00         |
+-----------------------------+

-- Add negative hours (i.e., subtract hours)
select hours_add('2023-10-01 10:00:00', -3) ;
+--------------------------------------+
| hours_add('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 07:00:00                  |
+--------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 13:22:33.123+08:00                 |
+-----------------------------------------------+

-- Input parameter is NULL, return NULL
select hours_add(null, 5) ;
+--------------------+
| hours_add(null, 5) |
+--------------------+
| NULL               |
+--------------------+

select hours_add('2023-10-01 10:00:00',NULL) ;
+---------------------------------------+
| hours_add('2023-10-01 10:00:00',NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

-- Exceeds datetime range
select hours_add('9999-12-31 23:59:59', 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 23:59:59, 2 out of range

mysql> select hours_add('0000-01-01',-2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 00:00:00, -2 out of range
```
