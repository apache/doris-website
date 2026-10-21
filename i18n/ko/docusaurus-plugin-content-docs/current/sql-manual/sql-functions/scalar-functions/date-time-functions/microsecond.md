---
{
    "title": "MICROSECOND",
    "language": "ko",
    "description": "DATETIME 또는 TIMESTAMP_NS 값에서 반올림 없이 초 소수부의 처음 여섯 자리를 추출합니다."
}
---

## 설명 {#description}

MICROSECOND 함수는 입력 날짜 및 시간 값에서 초 소수부의 처음 여섯 자리를 추출하여 0부터 999999까지의 값을 반환합니다. DATETIME과 TIMESTAMP_NS를 지원합니다. 부족한 자릿수는 영으로 채우며, TIMESTAMP_NS의 경우 나노초 단위의 마지막 세 자리는 무시합니다. 아홉 자리 전체를 얻으려면 [NANOSECOND](./nanosecond)를 사용하세요.


이 함수는 MySQL의 [microsecond 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_microsecond)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MICROSECOND(`<datetime>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<datetime>` | DATETIME 또는 TIMESTAMP_NS 타입의 입력 날짜 및 시간 값입니다. 지원되는 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [timestamp_ns 변환](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)을 참조하세요. |

## 반환 값 {#return-value}

날짜 및 시간 값의 마이크로초 부분을 나타내는 INT 타입의 값을 반환합니다. 범위는 0부터 999999까지입니다. 입력값의 정밀도가 6 미만이면 부족한 자릿수를 영으로 채웁니다.

- 입력 날짜 및 시간 값에 마이크로초 부분이 없으면(예: '2023-01-01 10:00:00') 0을 반환합니다.
- 입력값이 NULL이면 NULL을 반환합니다.
- 입력 날짜 및 시간 값의 마이크로초 정밀도가 6자리 미만이면 부족한 자릿수를 자동으로 영으로 채웁니다(예: 12:34:56.123은 123000마이크로초로 해석됩니다).
- TIMESTAMP_NS의 경우 마지막 세 자리를 반올림하지 않고 초 소수부의 처음 여섯 자리를 반환합니다.

## 예제 {#examples}

```sql

-- Extracts a value with 6-digit microseconds
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIME(6)));
+----------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIME(6))) |
+----------------------------------------------------------------+
|                                                            123 |
+----------------------------------------------------------------+

-- Scale is 4
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.0123' AS DATETIME(4)));
+--------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.0123' AS DATETIME(4))) |
+--------------------------------------------------------------+
|                                                        12300 |
+--------------------------------------------------------------+

-- Pads microsecond part with zeros (precision less than 6 digits)
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.123' AS DATETIME(6)));
+-------------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12.123' AS DATETIME(6))) |
+-------------------------------------------------------------+
|                                                      123000 |
+-------------------------------------------------------------+

-- Datetime without scale returns 0
SELECT MICROSECOND(CAST('1999-01-02 10:11:12' AS DATETIME(6)));
+---------------------------------------------------------+
| MICROSECOND(CAST('1999-01-02 10:11:12' AS DATETIME(6))) |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+

-- For TIMESTAMP_NS, the final three nanosecond digits are ignored
SELECT MICROSECOND(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS));
+-----------------------------------------------------------------------+
| MICROSECOND(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS)) |
+-----------------------------------------------------------------------+
|                                                                123456 |
+-----------------------------------------------------------------------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT MICROSECOND("22:12:12.123456");
+--------------------------------+
| MICROSECOND("22:12:12.123456") |
+--------------------------------+
|                         123456 |
+--------------------------------+

-- Input is NULL, returns NULL
SELECT MICROSECOND(NULL);
+-------------------+
| MICROSECOND(NULL) |
+-------------------+
|              NULL |
+-------------------+

```
