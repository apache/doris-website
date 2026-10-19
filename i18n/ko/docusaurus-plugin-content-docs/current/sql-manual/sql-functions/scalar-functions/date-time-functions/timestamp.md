---
{
    "title": "TIMESTAMP | 날짜 및 시간 함수",
    "language": "ko",
    "description": "날짜 및 시간 문자열을 DATETIME으로 변환하거나, TIMESTAMP_NS 입력과 해당 입력의 나노초 정밀도를 유지합니다.",
    "sidebar_label": "TIMESTAMP"
}
---

# TIMESTAMP {#timestamp}

## 설명 {#description}

TIMESTAMP 함수는 날짜 및 시간 문자열을 `DATETIME`으로 변환합니다. `TIMESTAMP_NS` 입력의 경우 `TIMESTAMP_NS`를 반환하며 나노초 정밀도를 유지합니다. 두 번째 시간 매개변수가 주어지면 해당 시간 값을 첫 번째 매개변수에 더하고, 첫 번째 매개변수에 해당하는 날짜 및 시간 타입을 유지합니다.

구체적인 날짜 및 시간 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요.

이 함수는 MySQL의 [timestamp 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명                                           |
|-----------|-------------------------------------------------------|
| `date_or_datetime_string` | 날짜 또는 날짜 및 시간 문자열, 또는 `DATETIME`이나 `TIMESTAMP_NS` 표현식입니다. |
| `time_string` | 시간 문자열 타입 |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 입력은 초의 소수부 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위 내에 있는지 검증합니다. `TIMESTAMP_NS`에는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위가 적용됩니다.

날짜, 날짜 및 시간, 문자열 입력에는 `DATETIME`을 반환하고, `TIMESTAMP_NS` 입력에는 `TIMESTAMP_NS`를 반환합니다.

매개변수가 하나이면 첫 번째 매개변수를 해당 날짜 및 시간 타입으로 반환합니다.
매개변수가 두 개이면 두 매개변수의 합을 반환합니다.

- 첫 번째 매개변수가 날짜 문자열이면 시간은 00:00:00으로 설정됩니다
- 매개변수 중 하나라도 NULL이거나 매개변수 타입이 일치하지 않으면 NULL을 반환합니다

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
