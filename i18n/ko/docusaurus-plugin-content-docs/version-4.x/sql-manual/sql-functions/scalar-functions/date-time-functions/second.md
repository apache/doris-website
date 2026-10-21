---
{
    "title": "SECOND",
    "language": "ko",
    "description": "SECOND 함수는 지정된 날짜 및 시간 값에서 초 부분을 추출하여 0부터 59까지의 정수를 반환합니다."
}
---

## 설명 {#description}

SECOND 함수는 지정된 날짜 및 시간 값에서 초 부분을 추출하여 0부터 59까지의 정수를 반환합니다. 이 함수는 DATE, DATETIME, TIME 타입을 지원합니다.

이 함수는 MySQL의 [SECOND 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_second)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
SECOND(<date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 및 시간 값입니다. DATE, DATETIME 또는 TIME 타입을 사용할 수 있습니다. 구체적인 날짜 및 시간 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), [시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)을 참조하세요. |

## 반환값 {#return-value}

입력된 날짜 및 시간 값의 초 부분을 나타내는 INT 타입 값을 반환합니다.

- 범위: 0부터 59까지(양 끝값 포함)
- 입력이 DATE 타입이면 0을 반환합니다(기본 시간은 00:00:00).
- 입력이 NULL이면 NULL을 반환합니다.
- 마이크로초 부분은 무시합니다(예: 12:34:56.789에서는 초 값인 56만 추출).

## 예제 {#examples}

```sql
-- Extract seconds from DATETIME
SELECT SECOND('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Input is TIME type
SELECT SECOND(cast('15:42:33' as time)) AS result;
+--------+
| result |
+--------+
|     33 |
+--------+

-- Input is DATE type (default seconds is 0)
SELECT SECOND('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Time with microseconds (ignores microseconds)
SELECT SECOND('2023-07-13 10:30:25.123456') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Case where seconds is 0
SELECT SECOND('2024-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT SECOND("22:12:12");
+--------------------+
| SECOND("22:12:12") |
+--------------------+
|                 12 |
+--------------------+

-- Input is NULL (returns NULL)
SELECT SECOND(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
