---
{
    "title": "DATE_FORMAT",
    "language": "ko",
    "description": "DATEFORMAT 함수는 지정된 형식 문자열(format)에 따라 날짜 또는 시간 값을 문자열로 변환하는 데 사용됩니다."
}
---

## 설명 {#description}

DATE_FORMAT 함수는 지정된 형식 문자열(`format`)에 따라 날짜 또는 시간 값을 문자열로 변환합니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ` 값을 지원하며, 지정된 형식에 맞는 문자열을 반환합니다.

이 함수는 MySQL의 [date_format 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-format)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
DATE_FORMAT(<date_or_time_expr>, <format>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | 유효한 `DATE`, `DATETIME`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ` 값입니다. 구체적인 날짜 및 시간 형식은 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [timestamp_ns 변환](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md), [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하세요. |
| `<format>` | 날짜/시간의 출력 형식을 지정하며, `varchar` 타입입니다. |

지원되는 형식 지정자:

| 형식 지정자 | 설명                               |
|--------|-------------------------------------|
| %a     | 요일 이름의 약어(3글자)                          |
| %b     | 월 이름의 약어(3글자)                           |
| %c     | 숫자로 나타낸 월(0-12)                           |
| %D     | 영어 접미사가 붙은 일(0th, 1st, 2nd, 3rd, …) |
| %d     | 숫자로 나타낸 일(00-31)                |
| %e     | 숫자로 나타낸 일(0-31)                 |
| %f     | 마이크로초(000000-999999)               |
| %n     | 나노초(000000000-999999999). 정밀도가 낮은 타입에서는 부족한 자릿수를 영으로 채웁니다. |
| %H     | 시(00-23)                        |
| %h     | 시(01-12)                        |
| %I     | 시(01-12)                        |
| %i     | 숫자로 나타낸 분(00-59)                  |
| %j     | 연중 일수(001-366)                    |
| %k     | 시(0-23)                         |
| %l     | 시(1-12)                         |
| %M     | 월 이름                                |
| %m     | 숫자로 나타낸 월(00-12)                    |
| %p     | AM 또는 PM                            |
| %r     | 12시간제 시간(hh:mm:ss 뒤에 AM 또는 PM) |
| %S     | 초(00-59)                          |
| %s     | 초(00-59)                          |
| %T     | 24시간제 시간(hh:mm:ss)           |
| %U     | 주차(00-53). 일요일이 한 주의 첫날이며, [week](./week) 모드 0에 해당   |
| %u     | 주차(00-53). 월요일이 한 주의 첫날이며, [week](./week) 모드 1에 해당   |
| %V     | 주차(01-53). 일요일이 한 주의 첫날이며, [week](./week) 모드 2에 해당. %X와 함께 사용 |
| %v     | 주차(01-53). 월요일이 한 주의 첫날이며, [week](./week) 모드 3에 해당. %x와 함께 사용 |
| %W     | 요일의 전체 이름(일요일-토요일)    |
| %w     | 요일(0 = 일요일, 6 = 토요일)        |
| %X     | 일요일을 한 주의 첫날로 하는 연도(4자리). %V와 함께 사용 |
| %x     | 월요일을 한 주의 첫날로 하는 연도(4자리). %v와 함께 사용 |
| %Y     | 연도(4자리)                            |
| %y     | 연도(2자리)                            |
| %%     | % 문자를 나타냄                         |
| %**x** | 위에 나열되지 않은 모든 **x**에 대해 **x** 자체를 나타냄 |

다음과 같은 세 가지 특수 형식도 사용할 수 있습니다:

```text
yyyyMMdd --corresponds to standard format specifier：%Y%m%d
yyyy-MM-dd --corresponds to standard format specifier：%Y-%m-%d
yyyy-MM-dd HH:mm:ss --corresponds to standard format specifier：%Y-%m-%d %H:%i:%s
```

## 반환 값 {#return-value}

형식이 지정된 날짜 문자열을 반환하며, 타입은 Varchar입니다.

특수한 경우:
- format이 NULL이면 NULL을 반환합니다.
- 매개변수가 하나라도 NULL이면 NULL을 반환합니다.
- 입력값의 길이가 128자를 초과하면 오류를 반환합니다.
- 출력 길이가 102를 초과하면 오류가 발생합니다.

## 예제 {#examples}

```sql
SELECT DATE_FORMAT(
    CAST('2024-02-29 12:34:56.123456789' AS TIMESTAMP_NS),
    '%Y-%m-%d %H:%i:%s.%n'
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 2024-02-29 12:34:56.123456789 |
+-------------------------------+
```

```sql
-- Output weekday name, month name, and 4-digit year
select date_format(cast('2009-10-04 22:23:00' as datetime), '%W %M %Y');

+------------------------------------------------------------------+
| date_format(cast('2009-10-04 22:23:00' as datetime), '%W %M %Y') |
+------------------------------------------------------------------+
| Sunday October 2009                                              |
+------------------------------------------------------------------+

-- Output time in 24-hour format (hour:minute:second)
select date_format('2007-10-04 22:23:00', '%H:%i:%s');

+------------------------------------------------+
| date_format('2007-10-04 22:23:00', '%H:%i:%s') |
+------------------------------------------------+
| 22:23:00                                       |
+------------------------------------------------+

-- Combine multiple format specifiers and plain characters
select date_format('1900-10-04 22:23:00', 'Day: %D, Year: %y, Month: %b, DayOfYear: %j');

+-----------------------------------------------------------------------------------+
| date_format('1900-10-04 22:23:00', 'Day: %D, Year: %y, Month: %b, DayOfYear: %j') |
+-----------------------------------------------------------------------------------+
| Day: 4th, Year: 00, Month: Oct, DayOfYear: 277                                    |
+-----------------------------------------------------------------------------------+

-- %X (year) used with %V (week number), where Sunday is the first day of the week
select date_format('1999-01-01 00:00:00', '%X-%V');

+---------------------------------------------+
| date_format('1999-01-01 00:00:00', '%X-%V') |
+---------------------------------------------+
| 1998-52                                     |
+---------------------------------------------+

-- Output the % character (escaped with %%)
select date_format(cast('2006-06-01' as date), '%%%d/%m');

+----------------------------------------------------+
| date_format(cast('2006-06-01' as date), '%%%d/%m') |
+----------------------------------------------------+
| %01/06                                             |
+----------------------------------------------------+

-- Special format yyyy-MM-dd HH:mm:ss
select date_format('2023-12-31 23:59:59', 'yyyy-MM-dd HH:mm:ss');
+-----------------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyy-MM-dd HH:mm:ss') |
+-----------------------------------------------------------+
| 2023-12-31 23:59:59                                       |
+-----------------------------------------------------------+

-- String that does not reference any time information
select date_format('2023-12-31 23:59:59', 'ghg');
+-------------------------------------------+
| date_format('2023-12-31 23:59:59', 'ghg') |
+-------------------------------------------+
| ghg                                       |
+-------------------------------------------+

-- Special format yyyyMMdd
select date_format('2023-12-31 23:59:59', 'yyyyMMdd');
+------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyyMMdd') |
+------------------------------------------------+
| 20231231                                       |
+------------------------------------------------+

-- Special format yyyy-MM-dd
select date_format('2023-12-31 23:59:59', 'yyyy-MM-dd');
+--------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyy-MM-dd') |
+--------------------------------------------------+
| 2023-12-31                                       |
+--------------------------------------------------+

-- Parameter is null
mysql> select date_format(NULL, '%Y-%m-%d');
+-------------------------------+
| date_format(NULL, '%Y-%m-%d') |
+-------------------------------+
| NULL                          |
+-------------------------------+

---Returns error if the result string exceeds the function's maximum length limit.
mysql> select date_format('2022-01-12',repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation date_format of invalid or oversized format is invalid

---output length over 102 size,throw error
mysql> select date_format('2022-11-13 10:12:12',repeat('%h',52));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation date_format of 142335809712816128,%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h is invalid
```
