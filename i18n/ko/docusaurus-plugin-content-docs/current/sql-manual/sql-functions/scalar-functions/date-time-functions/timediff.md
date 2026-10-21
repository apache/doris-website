---
{
    "title": "TIMEDIFF",
    "language": "ko",
    "description": "DATE, DATETIME 또는 TIMESTAMP_NS 값 간의 차이를 계산하고 TIME 값을 반환합니다."
}
---

## 설명 {#description}

TIMEDIFF 함수는 두 `DATE`, `DATETIME` 또는 `TIMESTAMP_NS` 값의 차이를 계산하여 결과를 `TIME` 값으로 반환합니다. `DATE` 입력은 00:00:00으로 처리됩니다.

이 함수는 MySQL의 [timediff 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timediff)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIMEDIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## 매개변수 {#parameters}

| 매개변수              | 설명                                                                                                                                                                                                                                                              |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr1>` | 종료 시간 또는 날짜 및 시간 값입니다. DATE/DATETIME/TIMESTAMP_NS 타입의 입력을 지원합니다. 구체적인 날짜 및 시간 형식과 날짜 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 시작 시간 또는 날짜 및 시간 값입니다. DATE/DATETIME/TIMESTAMP_NS 타입의 입력을 지원합니다.                                                                                                                                                                                                  |

## 반환 값 {#return-value}

두 입력 간의 시간 차이를 나타내는 `TIME` 타입의 값을 반환합니다.

- `<end_datetime>`이 `<start_datetime>`보다 늦으면 양수인 시간 차이를 반환합니다.
- `<end_datetime>`이 `<start_datetime>`보다 빠르면 음수인 시간 차이를 반환합니다.
- `<end_datetime>`과 `<start_datetime>`이 같으면 `00:00:00`을 반환합니다.
- `<end_datetime>` 또는 `<start_datetime>`이 `NULL`이면 함수는 `NULL`을 반환합니다.
- 반환되는 시간 차이가 초 단위 정수가 아니면 반환되는 시간에 소수 자릿수(scale)가 포함됩니다.
- 계산 결과가 시간 범위 [-838:59:59, 838:59:59]를 벗어나면 오류를 반환합니다.

## 예제 {#examples}

```sql
-- Difference between two DATETIMEs (spanning days)
SELECT TIMEDIFF('2024-07-20 16:59:30', '2024-07-11 16:35:21') AS result;
+-----------+
| result    |
+-----------+
| 216:24:09 |
+-----------+

-- Difference between datetime and date (date defaults to 00:00:00)
SELECT TIMEDIFF('2023-10-05 15:45:00', '2023-10-05') AS result;
+-----------+
| result    |
+-----------+
| 15:45:00  |
+-----------+

-- End time earlier than start time (returns negative value)
SELECT TIMEDIFF('2023-01-01 09:00:00', '2023-01-01 10:30:00') AS result;
+------------+
| result     |
+------------+
| -01:30:00  |
+------------+

-- Time difference within the same date
SELECT TIMEDIFF('2023-12-31 23:59:59', '2023-12-31 23:59:50') AS result;
+-----------+
| result    |
+-----------+
| 00:00:09  |
+-----------+

-- Difference across years
SELECT TIMEDIFF('2024-01-01 00:00:01', '2023-12-31 23:59:59') AS result;
+-----------+
| result    |
+-----------+
| 00:00:02  |
+-----------+

-- When returned time is not an integer number of seconds, returns time with scale
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2023-07-13 12:34:50.123') AS result;
+--------------+
| result       |
+--------------+
| 00:00:06.666 |
+--------------+

-- Calculation result exceeds time size range, returns error
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2024-07-13 12:34:50.123') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function timediff result of 2023-07-13 12:34:56.789000, 2024-07-13 12:34:50.123000 is out of range

-- Any parameter is NULL (returns NULL)
SELECT TIMEDIFF(NULL, '2023-01-01 00:00:00'), TIMEDIFF('2023-01-01 00:00:00', NULL) AS result;
+---------------------------------------+--------+
| timediff(NULL, '2023-01-01 00:00:00') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+
```
