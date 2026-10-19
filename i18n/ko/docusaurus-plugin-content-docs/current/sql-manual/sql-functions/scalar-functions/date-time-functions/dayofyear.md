---
{
    "title": "DAYOFYEAR",
    "language": "ko",
    "description": "DAYOFYEAR 함수는 날짜 또는 시간 표현식에 해당하는 날짜가 그해의 몇 번째 날인지 계산하는 데 사용됩니다. 즉,"
}
---

## 설명 {#description}

DAYOFYEAR 함수는 날짜 또는 시간 표현식에 해당하는 날짜가 그해의 몇 번째 날인지 계산하는 데 사용됩니다. 반환값은 1(일월 1일)부터 366(윤년의 십이월 31일)까지의 정수입니다.

이 함수는 MySQL의 [dayofyear 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofyear)와 동일하게 동작합니다.

## 별칭 {#alias}

- DOY

## 구문 {#syntax}

```sql
DAYOFYEAR(<date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환값 {#return-value}

해당 연도의 몇 번째 날인지를 나타내는 SMALLINT 타입의 정수(1-366)를 반환합니다.

특수한 경우:

- <date_or_time_expr>가 NULL이면 NULL을 반환합니다.
- 윤년의 이월 29일은 해당 연도의 60번째 날로 정확하게 계산됩니다.

## 예제 {#examples}

```sql

---Extract the day number in the year from datetime type
select dayofyear('2007-02-03 00:00:00');

+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+

---Extract day number from date type
select dayofyear('2023-12-31');
+-------------------------+
| dayofyear('2023-12-31') |
+-------------------------+
|                     365 |
+-------------------------+


---Calculate day number in a leap year
select dayofyear('2024-12-31');
+-------------------------+
| dayofyear('2024-12-31') |
+-------------------------+
|                     366 |
+-------------------------+

---Input is NULL, returns NULL
select dayofyear(NULL);
+-----------------+
| dayofyear(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
