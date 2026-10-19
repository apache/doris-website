---
{
    "title": "MICROSECONDS_SUB",
    "language": "ko",
    "description": "DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에서 마이크로초를 빼고 동일한 시간 타입의 값을 반환합니다."
}
---

## 설명 {#description}

`MICROSECONDS_SUB` 함수는 입력 날짜 및 시간 값에서 지정된 마이크로초 수를 빼고 그 결과를 새로운 날짜 및 시간 값으로 반환합니다. 이 함수는 `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다.

이 함수는 MICROSECOND를 단위로 사용할 때 MySQL의 [date_sub 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MICROSECONDS_SUB(`<datetime_like_type>`, `<delta>`)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| `<datetime_like_type>` | 입력 날짜 및 시간 값으로, 타입은 `DATETIME`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ`입니다. 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [timestamp_ns 변환](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md), [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하세요. |
| `<delta>`    | 뺄 마이크로초 수로, 타입은 `BIGINT`입니다. 1초 = 1,000,000마이크로초입니다.       |

## 반환값 {#return-value}

지정된 마이크로초 `<delta>`를 기준 시각 `<datetime_like_type>`에서 뺀 결과를 반환하며, 반환 타입은 첫 번째 매개변수의 타입과 같습니다.

- TIMESTAMP_NS를 입력하면 TIMESTAMP_NS를 반환하며 나노초 부분을 보존합니다.

- `<delta>`가 음수이면 기준 시각에 해당 마이크로초 수를 더하는 것과 동일하게 동작합니다. 즉, `MICROSECONDS_SUB(basetime, -n)`은 `MICROSECONDS_ADD(basetime, n)`과 같습니다.
- 계산 결과가 `DATETIME` 타입의 유효 범위(`0000-01-01 00:00:00`부터 `9999-12-31 23:59:59.999999`까지)를 벗어나면 예외가 발생합니다.
- TIMESTAMP_NS의 경우 결과는 `1677-09-21 00:12:43.145224192`부터 `2262-04-11 23:47:16.854775807`까지의 범위에 있어야 합니다.
- 매개변수 중 하나라도 `NULL`이면 함수는 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
-- Subtract microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;

+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+

-- Negative delta (equivalent to addition)
mysql> SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.200000', -300000) AS after_sub;
+----------------------------+
| after_sub                  |
+----------------------------+
| 2023-10-01 12:00:00.500000 |
+----------------------------+

-- TIMESTAMP_NS preserves the nanosecond part
SELECT MICROSECONDS_SUB(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1);
+-----------------------------------------------------------------------------------+
| MICROSECONDS_SUB(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1) |
+-----------------------------------------------------------------------------------+
| 2025-01-02 03:04:05.123455789                                                     |
+-----------------------------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MICROSECONDS_SUB(NULL, 1000), MICROSECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| microseconds_sub(NULL, 1000) | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECONDS_SUB('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_SUB('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-10-01 00:00:00.300000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:55.357200+08:00                            |
+-------------------------------------------------------------+

-- Exceeds datetime range, throws an error
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 0000-01-01 00:00:00, -1000000 
out of range

```
