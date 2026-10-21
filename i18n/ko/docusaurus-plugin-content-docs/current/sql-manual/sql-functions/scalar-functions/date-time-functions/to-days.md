---
{
    "title": "TO_DAYS",
    "language": "ko",
    "description": "날짜를 일수를 나타내는 숫자 값으로 변환하는 날짜 계산 함수"
}
---

## 설명 {#description}
날짜를 일수를 나타내는 숫자 값으로 변환하는 날짜 계산 함수로, 기준 날짜(`0000-00-00`)부터 지정된 날짜까지의 총 일수를 계산합니다.

이 함수는 MySQL의 [to_days 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TO_DAYS(`<date_or_date_expr>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

일수를 나타내는 BIGINT 타입을 반환합니다.

## 예제 {#examples}

```sql
-- Based on the date `0000-00-00`
select to_days('0000-01-01');
+-----------------------+
| to_days('0000-01-01') |
+-----------------------+
|                     1 |
+-----------------------+

--input date type
select to_days('2007-10-07');
+-----------------------+
| to_days('2007-10-07') |
+-----------------------+
|                733321 |
+-----------------------+

--input datetime type
select to_days('2007-10-07 10:03:09');
+--------------------------------+
| to_days('2007-10-07 10:03:09') |
+--------------------------------+
|                         733321 |
+--------------------------------+
```
