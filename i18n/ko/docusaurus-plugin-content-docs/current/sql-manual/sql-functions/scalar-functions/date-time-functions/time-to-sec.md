---
{
    "title": "TIME_TO_SEC",
    "language": "ko",
    "description": "TIME, DATETIME 또는 TIMESTAMP_NS 값의 시간 부분을 총 초 수로 변환합니다."
}
---

## 설명 {#description}

TIME_TO_SEC 함수는 입력 시간 값을 총 초 수로 변환합니다. `TIME`, `DATETIME`, `TIMESTAMP_NS`를 지원하며, datetime 값의 경우 계산을 위해 시간 부분(HH:MM:SS)을 추출합니다.

이 함수는 MySQL의 [time_to_sec 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIME_TO_SEC(<date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수             | 설명                                                                                                                                                                                                                                                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr>` | 필수입니다. `TIME`, `DATETIME` 또는 `TIMESTAMP_NS`를 지원합니다. datetime 값의 경우 계산을 위해 시간 부분을 추출합니다. |

## 반환값 {#return-value}

입력 시간 값에 해당하는 총 초 수를 INT 타입으로 반환합니다. 계산식은 시×3600 + 분×60 + 초입니다.

- datetime 문자열을 입력할 때는 datetime 타입으로 명시적으로 변환해야 합니다. 그렇지 않으면 기본적으로 time 타입으로 변환되어 NULL이 반환됩니다.
- 음수 시간(예: -01:30:00)을 입력하면 해당하는 음수 초 수(예: -5400)를 반환합니다.
- 입력이 NULL이면 NULL을 반환합니다.
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
