---
{
    "title": "TIMESTAMP | 날짜 및 시간 함수",
    "language": "ko",
    "description": "TIMESTAMP 함수는 날짜 및 시간 형식의 문자열을 DATETIME 타입으로 변환합니다.",
    "sidebar_label": "TIMESTAMP"
}
---

# TIMESTAMP {#timestamp}

## 설명 {#description}

TIMESTAMP 함수는 날짜 및 시간 형식의 문자열을 DATETIME 타입으로 변환합니다.
두 번째 시간 매개변수가 있으면 두 매개변수의 합을 계산하고 결과를 DATETIME 형식으로 반환합니다.

구체적인 날짜 및 시간 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요.

이 함수는 MySQL의 [timestamp 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명                                           |
|-----------|-------------------------------------------------------|
| `date_or_datetime_string` | 날짜 또는 날짜 및 시간을 나타내는 문자열 타입 |
| `time_string` | 시간을 나타내는 문자열 타입 |

## 반환값 {#return-value}

DATETIME 타입의 값을 반환합니다.

매개변수가 하나이면 첫 번째 매개변수를 DATETIME 타입으로 변환한 결과를 반환합니다.
매개변수가 두 개이면 두 매개변수의 합을 반환합니다.

- 첫 번째 매개변수가 날짜 문자열이면 시간은 00:00:00으로 설정됩니다.
- 매개변수 중 하나라도 NULL이거나 매개변수 타입이 일치하지 않으면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Convert a string to DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');

+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+

-- Input date string
SELECT TIMESTAMP('2019-01-01');
+-------------------------+
| TIMESTAMP('2019-01-01') |
+-------------------------+
| 2019-01-01 00:00:00     |
+-------------------------+

-- Input NULL, returns NULL
SELECT TIMESTAMP(NULL);
+-----------------+
| TIMESTAMP(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- Two parameters, returns the sum of the two parameters (Date/DateTime + Time)
SELECT TIMESTAMP('2025-11-30 23:45:12', '12:34:56');
+----------------------------------------------+
| TIMESTAMP('2025-11-30 23:45:12', '12:34:56') |
+----------------------------------------------+
| 2025-12-01 12:20:08                          |
+----------------------------------------------+

-- The first parameter only accepts Date/Datetime type, the second parameter only accepts Time type
SELECT TIMESTAMP('12:34:56', '12:34:56');
+-----------------------------------+
| TIMESTAMP('12:34:56', '12:34:56') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- If any parameter is NULL, returns NULL
SELECT TIMESTAMP('2025-12-01', NULL);
+-------------------------------+
| TIMESTAMP('2025-12-01', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```
