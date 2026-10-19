---
{
    "title": "HOUR",
    "language": "ko",
    "description": "HOUR 함수는 날짜 및 시간 또는 시간 표현식에서 시 부분을 추출합니다. 이 함수는 여러 시간 타입의 입력을 지원하며,"
}
---

## 설명 {#description}

HOUR 함수는 날짜 및 시간 또는 시간 표현식에서 시 부분을 추출합니다. 이 함수는 DATE/DATETIME/TIMESTAMP_NS와 TIME을 비롯한 여러 시간 타입의 입력을 지원하며, 해당하는 시 값을 반환합니다.

DATETIME(예: '2023-10-01 14:30:00')의 반환 값 범위는 0-23(24시간 형식)입니다.
TIME 타입(예: '456:26:32')의 반환 값은 24를 초과할 수 있으며, 범위는 [0,838]입니다.

이 함수는 MySQL의 [hour 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
HOUR(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | 유효한 날짜 또는 시간 표현식입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIME`을 지원합니다. `DATE` 입력은 00:00:00으로 처리됩니다. 구체적인 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), [시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)을 참조하세요. |

## 반환 값 {#return-value}

입력 표현식의 시 부분을 나타내는 정수 타입(INT)을 반환합니다.
- DATETIME의 경우 0-23 사이의 정수를 반환합니다.
- TIMESTAMP_NS의 경우 0-23 사이의 정수를 반환합니다.
- DATE 타입의 경우 0을 반환합니다.
- TIME 타입의 경우 0에서 838 사이의 정수(TIME 타입의 범위와 동일)를 반환합니다. 반환 값은 절댓값입니다.
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
