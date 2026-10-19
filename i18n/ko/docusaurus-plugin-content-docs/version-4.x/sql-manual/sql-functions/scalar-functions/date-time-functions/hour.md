---
{
    "title": "HOUR",
    "language": "ko",
    "description": "HOUR 함수는 datetime 또는 time 표현식에서 시 부분을 추출합니다. 이 함수는 여러 시간 타입의 입력을 지원하며,"
}
---

## 설명 {#description}

HOUR 함수는 datetime 또는 time 표현식에서 시 부분을 추출합니다. 이 함수는 DATE/DATETIME 및 TIME을 비롯한 여러 시간 타입의 입력을 지원하며, 해당하는 시 값을 반환합니다.

DATETIME의 경우(예: '2023-10-01 14:30:00') 반환값의 범위는 0-23입니다(24시간 형식).
TIME 타입의 경우(예: '456:26:32') 반환값은 24를 초과할 수 있으며, 범위는 [0,838]입니다.

이 함수는 MySQL의 [hour 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
HOUR(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | datetime/date/time 타입을 지원하는 유효한 날짜 표현식입니다. Date 타입은 해당 날짜의 시작 시간인 00:00:00으로 변환됩니다. 구체적인 datetime/date/time 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), [time 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)을 참조하세요. |

## 반환 값 {#return-value}

입력 표현식의 시 부분을 나타내는 정수 타입(INT)의 값을 반환합니다.
- DATETIME의 경우 0-23 범위의 정수를 반환합니다.
- DATE 타입의 경우 0을 반환합니다.
- TIME 타입의 경우 0에서 838 사이의 정수를 반환합니다(TIME 타입의 범위와 일치). 반환값은 절댓값입니다.
- 입력 매개변수가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Extract hour from datetime (24-hour format)
select 
    hour('2018-12-31 23:59:59') as last_hour,
    hour('2023-01-01 00:00:00') as midnight,   
    hour('2023-10-01 12:30:45') as noon;     

+-----------+----------+------+
| last_hour | midnight | noon |
+-----------+----------+------+
|        23 |        0 |   12 |
+-----------+----------+------+

-- Extract hour from TIME type (supports over 24 or negative values)
select 
    hour(cast('14:30:00' as time)) as normal_hour,     
    hour(cast('25:00:00' as time)) as over_24,
    hour(cast('456:26:32' as time)) as large_hour,     
    hour(cast('-12:30:00' as time)) as negative_hour, 
    hour(cast('838:59:59' as time)) as max_hour,    
    hour(cast('-838:59:59' as time)) as min_hour;    

+-------------+---------+------------+---------------+----------+----------+
| normal_hour | over_24 | large_hour | negative_hour | max_hour | min_hour |
+-------------+---------+------------+---------------+----------+----------+
|          14 |      25 |        456 |            12 |      838 |      838 |
+-------------+---------+------------+---------------+----------+----------+

-- Extract hour from date type, returns 0
select hour("2022-12-12");
+--------------------+
| hour("2022-12-12") |
+--------------------+
|                  0 |
+--------------------+

select hour('14:30:00') as normal_hour;
+-------------+
| normal_hour |
+-------------+
|          14 |
+-------------+

-- Input parameter is NULL, returns NULL
mysql> select hour(NULL);
+------------+
| hour(NULL) |
+------------+
|       NULL |
+------------+
```
