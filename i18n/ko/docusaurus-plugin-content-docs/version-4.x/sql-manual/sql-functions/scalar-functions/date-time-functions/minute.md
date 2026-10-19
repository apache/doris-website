---
{
    "title": "MINUTE",
    "language": "ko",
    "description": "MINUTE 함수는 입력 날짜 및 시간 값에서 분을 추출하여 0에서 59 사이의 정수를 반환합니다."
}
---

## 설명 {#description}

MINUTE 함수는 입력 날짜 및 시간 값에서 분을 추출하여 0에서 59 사이의 정수를 반환합니다. 이 함수는 DATE, DATETIME, TIME 타입을 지원합니다.

이 함수는 MySQL의 [minute 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MINUTE(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE, DATETIME 또는 TIME 타입일 수 있습니다. datetime/date/time의 구체적인 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), [time 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)을 참조하세요. |

## 반환 값 {#return-value}

입력 날짜 및 시간 값의 분을 나타내는 INT 타입의 정수를 반환하며, 범위는 0-59입니다.

- 입력이 DATE 타입인 경우(연도, 월, 일만 포함), 시간 부분의 기본값은 00:00:00이므로 0을 반환합니다.
- 입력이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Extract minute from DATETIME
SELECT MINUTE('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Extract minute from DATETIME with microseconds (ignores microseconds)
SELECT MINUTE('2023-05-01 10:05:30.123456') AS result;
+--------+
| result |
+--------+
|      5 |
+--------+

SELECT MINUTE('14:25:45') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Extract minute from DATE type (default time 00:00:00)
SELECT MINUTE('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Input is NULL, returns NULL
SELECT MINUTE(NULL) AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+
```
