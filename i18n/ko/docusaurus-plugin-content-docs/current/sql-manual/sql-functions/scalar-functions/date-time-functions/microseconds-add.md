---
{
    "title": "MICROSECONDS_ADD",
    "language": "ko",
    "description": "DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에 마이크로초를 더하고 동일한 시간 타입으로 반환합니다."
}
---

## 설명 {#description}

MICROSECONDS_ADD 함수는 입력 날짜 및 시간 값에 지정된 마이크로초를 더한 새 날짜 및 시간 값을 반환합니다. 이 함수는 DATETIME, TIMESTAMP_NS, TIMESTAMPTZ를 지원합니다.

이 함수는 MICROSECOND를 단위로 사용하는 MySQL의 [date_add 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MICROSECONDS_ADD(`<datetime_like_type>`, `<delta>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<datetime_like_type>` | DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 타입의 입력 날짜 및 시간 값입니다. 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [timestamp_ns 변환](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md), [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하세요. |
| `<delta>` | 더할 마이크로초 수로, BIGINT 타입입니다. 1초 = 1,000,000마이크로초입니다. |

## 반환 값 {#return-value}

지정된 마이크로초 `<delta>`를 기준 시간 `<datetime_like_type>`에 더한 결과를 반환하며, 반환 타입은 첫 번째 매개변수의 타입과 같습니다.
- 첫 번째 매개변수가 TIMESTAMPTZ이면 TIMESTAMPTZ를 반환합니다.
- 첫 번째 매개변수가 TIMESTAMP_NS이면 TIMESTAMP_NS를 반환하고 나노초 부분을 유지합니다.
- 첫 번째 매개변수가 DATETIME이면 DATETIME을 반환합니다.

- `<delta>`가 음수이면 기준 시간에서 해당 마이크로초만큼 뺍니다(즉, MICROSECONDS_ADD(basetime, -n)은 MICROSECONDS_SUB(basetime, n)과 같습니다).
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59.999999까지)를 벗어나면 예외가 발생합니다.
- TIMESTAMP_NS의 경우 결과는 `1677-09-21 00:12:43.145224192`부터 `2262-04-11 23:47:16.854775807`까지의 범위 내에 있어야 합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Add microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_ADD(NOW(3), 100000000) AS after_add;

+-------------------------+----------------------------+
| current_time            | after_add                  |
+-------------------------+----------------------------+
| 2025-08-11 14:49:16.368 | 2025-08-11 14:50:56.368000 |
+-------------------------+----------------------------+

-- Add negative microseconds, equivalent to subtracting
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', -300000) AS after_add;
+----------------------------+
| after_add                  |
+----------------------------+
| 2023-10-01 12:00:00.200000 |
+----------------------------+

-- TIMESTAMP_NS preserves the nanosecond part
SELECT MICROSECONDS_ADD(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1);
+-----------------------------------------------------------------------------------+
| MICROSECONDS_ADD(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1) |
+-----------------------------------------------------------------------------------+
| 2025-01-02 03:04:05.123457789                                                     |
+-----------------------------------------------------------------------------------+

-- Input type is date, time part defaults to 00:00:00.000000
SELECT MICROSECONDS_ADD('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_ADD('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-09-30 23:59:59.700000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:56.888800+08:00                            |
+-------------------------------------------------------------+

-- Calculation result exceeds datetime range, throws error
SELECT MICROSECONDS_ADD('9999-12-31 23:59:59.999999', 2000000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 9999-12-31 23:59:59.999999, 2000000 out of range

-- Any input parameter is NULL, returns NULL
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', NULL);
+-----------------------------------------------------+
| MICROSECONDS_ADD('2023-10-01 12:00:00.500000',NULL) |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+

```
