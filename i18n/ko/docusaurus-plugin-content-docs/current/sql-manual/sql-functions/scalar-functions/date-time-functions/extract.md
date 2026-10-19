---
{
    "title": "EXTRACT",
    "language": "ko",
    "description": "EXTRACT 함수는 날짜 또는 시간 값에서 연도, 월, 주, 일, 시, 분, 초 등의 특정 시간 구성 요소를 추출하는 데 사용됩니다."
}
---

## 설명 {#description}

`EXTRACT` 함수는 날짜 또는 시간 값에서 연도, 월, 주, 일, 시, 분, 초 등의 특정 시간 구성 요소를 추출하는 데 사용됩니다. 이 함수를 사용하면 datetime의 특정 부분을 정확하게 가져올 수 있습니다.

이 함수는 MySQL의 [extract 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract)와 동일하게 동작합니다.

## 구문 {#syntax}

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<unit>` | 열거형 값: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND, DAYOFWEEK(DOW), DAYOFYEAR(DOY) |
| `<datetime_or_time_expr>` | date/datetime 타입과 날짜 및 시간 형식의 문자열을 지원하는 유효한 날짜 표현식입니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참고하세요. |

## 반환 값 {#return-value}

날짜 또는 시간에서 추출한 부분을 반환합니다.
- `YEAR` 및 [DAYOFWEEK(DOW)](./dayofweek.md), [DAYOFYEAR(DOY)](./dayofyear.md)와 같은 단일 타입의 반환 타입은 INT입니다.
- `YEAR_MONTH`와 같은 복합 타입의 반환 타입은 STRING입니다.

주 단위 값의 범위는 0-53이며, 다음과 같이 계산합니다.

- 일요일을 한 주의 첫날로 봅니다.
- 해당 연도의 첫 번째 일요일이 포함된 주가 1주차입니다.
- 첫 번째 일요일 이전의 날짜는 0주차에 속합니다.

단위가 연도, 월, 일, 시, 분, 초, 마이크로초이면 datetime에서 해당 단위의 값을 반환합니다.

단위가 분기이면 일월부터 삼월까지는 1, 사월부터 유월까지는 2, 칠월부터 구월까지는 3, 시월부터 십이월까지는 4를 반환합니다.

특수한 경우:
- <date_or_time_expr>가 NULL이면 NULL을 반환합니다.
- <unit>이 지원되지 않는 단위이면 오류가 발생합니다.

복합 단위의 반환 형식은 다음과 같습니다.
| 시간 단위          | 반환 형식                             |
| ------------------ | ----------------------------------------- |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## 예제 {#examples}

```sql
-- Extract year, month, day, hour, minute, second, microsecond time components from datetime
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetime(6))) as microsecond;

+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+

-- Extract quarter from datetime
mysql> select extract(quarter from '2023-05-15') as quarter;
+---------+
| quarter |
+---------+
|       2 |
+---------+

-- Extract week number for the corresponding date. Since the first Sunday of 2024 is on January 7th, all dates before 01-07 return 0
select extract(week from '2024-01-06') as week;
+------+
| week |
+------+
|    0 |
+------+

-- January 7th is the first Sunday, returns 1
select extract(week from '2024-01-07') as week;
+------+
| week |
+------+
|    1 |
+------+

-- Under this rule, 2024 only has weeks 0-52
select extract(week from '2024-12-31') as week;
+------+
| week |
+------+
|   52 |
+------+

select extract(year_month from '2026-01-01 11:45:14.123456') as year_month,
       extract(day_hour from '2026-01-01 11:45:14.123456') as day_hour,
       extract(day_minute from '2026-01-01 11:45:14.123456') as day_minute,
       extract(day_second from '2026-01-01 11:45:14.123456') as day_second,
       extract(day_microsecond from '2026-01-01 11:45:14.123456') as day_microsecond,
       extract(hour_minute from '2026-01-01 11:45:14.123456') as hour_minute,
       extract(hour_second from '2026-01-01 11:45:14.123456') as hour_second,
       extract(hour_microsecond from '2026-01-01 11:45:14.123456') as hour_microsecond,
       extract(minute_second from '2026-01-01 11:45:14.123456') as minute_second,
       extract(minute_microsecond from '2026-01-01 11:45:14.123456') as minute_microsecond,
       extract(second_microsecond from '2026-01-01 11:45:14.123456') as second_microsecond;

+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+
| year_month | day_hour | day_minute | day_second  | day_microsecond    | hour_minute | hour_second | hour_microsecond | minute_second | minute_microsecond | second_microsecond |
+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+
| 2026-01    | 01 11    | 01 11:45   | 01 11:45:14 | 01 11:45:14.123456 | 11:45       | 11:45:14    | 11:45:14.123456  | 45:14         | 45:14.123456       | 14.123456          |
+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+

-- Input unit does not exist, reports error
select extract(uint from '2024-01-07') as week;

ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
