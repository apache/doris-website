---
{
    "title": "TIME_TO_SEC",
    "language": "ko",
    "description": "TIMETOSEC 함수는 입력된 시간 값을 총 초 수로 변환합니다."
}
---

## 설명 {#description}

TIME_TO_SEC 함수는 입력된 시간 값을 총 초 수로 변환합니다. 이 함수는 TIME 및 DATETIME 타입을 지원합니다. 입력값이 DATETIME 타입이면 시간 부분(HH:MM:SS)을 자동으로 추출하여 계산하고, 시간만 포함된 값이면 총 초 수로 직접 변환합니다.

이 함수는 MySQL의 [time_to_sec 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIME_TO_SEC(<date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수             | 설명                                                                                                                                                                                                                                                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr>` | 필수입니다. TIME 또는 DATETIME 타입을 지원합니다. 입력값이 DATETIME 타입이면 시간 부분을 추출하여 계산합니다. 구체적인 날짜 및 시간 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.|

## 반환값 {#return-value}

입력된 시간 값에 해당하는 총 초 수를 INT 타입으로 반환합니다. 계산식은 시간×3600 + 분×60 + 초입니다.

- 날짜 및 시간 문자열을 입력할 때는 명시적으로 날짜 및 시간 타입으로 변환해야 합니다. 그렇지 않으면 기본적으로 시간 타입으로 변환되어 NULL이 반환됩니다.
- 입력값이 음수 시간(예: -01:30:00)이면 해당하는 음수 초 수(예: -5400)를 반환합니다.
- 입력값이 NULL이면 NULL을 반환합니다.
- 마이크로초 부분은 무시합니다(예: 12:34:56.789는 12:34:56으로만 계산합니다).

## 예제 {#examples}

```sql
-- Pure time type
SELECT TIME_TO_SEC('16:32:18') AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Process the DATETIME string and return NULL.
SELECT TIME_TO_SEC('2025-01-01 16:32:18') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- A datetime string needs to be explicitly converted to a datetime type.
SELECT TIME_TO_SEC(cast('2025-01-01 16:32:18' as datetime)) AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Negative time conversion
SELECT TIME_TO_SEC('-02:30:00') AS result;
+--------+
| result |
+--------+
|  -9000 |
+--------+

-- Negative time with microseconds (ignore microseconds)
SELECT TIME_TO_SEC('-16:32:18.99') AS result;
+--------+
| result |
+--------+
| -59538 |
+--------+

-- Microsecond processing (ignore microseconds)
SELECT TIME_TO_SEC('10:15:30.123456') AS result;
+--------+
| result |
+--------+
|  36930 |
+--------+

-- Invalid time
SELECT TIME_TO_SEC('12:60:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Exceeds TIME range
SELECT TIME_TO_SEC('839:00:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Parameter is NULL
SELECT TIME_TO_SEC(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
