---
{
    "title": "WEEKDAY",
    "language": "ko",
    "description": "WEEKDAY 함수는 날짜의 요일 인덱스 값을 반환하며, 월요일은 0, 화요일은 1, 일요일은 6입니다."
}
---

## 설명 {#description}

WEEKDAY 함수는 날짜의 요일 인덱스 값을 반환하며, 월요일은 0, 화요일은 1, 일요일은 6입니다.

WEEKDAY와 DAYOFWEEK의 차이에 유의하세요:
```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```

이 함수는 MySQL의 [weekday 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekday)와 동일하게 동작합니다.

## 구문 {#syntax}
```sql
WEEKDAY(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}
날짜의 요일에 해당하는 인덱스를 INT 타입으로 반환합니다.

- 입력값이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- 2023-10-09 is Monday, returns 0
SELECT WEEKDAY('2023-10-09'); 
+-------------------------+
| WEEKDAY('2023-10-09')   |
+-------------------------+
| 0                       |
+-------------------------+

-- 2023-10-15 is Sunday, returns 6
SELECT WEEKDAY('2023-10-15 18:30:00'); 
+----------------------------------+
| WEEKDAY('2023-10-15 18:30:00')   |
+----------------------------------+
| 6                                |
+----------------------------------+

-- Input is NULL, returns NULL
SELECT WEEKDAY(NULL);
+---------------+
| WEEKDAY(NULL) |
+---------------+
|          NULL |
+---------------+
```
