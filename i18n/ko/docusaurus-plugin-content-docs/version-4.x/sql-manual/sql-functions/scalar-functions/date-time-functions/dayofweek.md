---
{
    "title": "DAYOFWEEK",
    "language": "ko",
    "description": "DAYOFWEEK 함수는 일요일을 1로 하는 규칙에 따라 날짜 또는 시간 표현식에 해당하는 요일 인덱스 값을 반환하는 데 사용됩니다."
}
---

## 설명 {#description}

DAYOFWEEK 함수는 일요일이 1, 월요일이 2, ..., 토요일이 7인 규칙에 따라 날짜 또는 시간 표현식에 해당하는 요일 인덱스 값을 반환합니다.

이 함수는 MySQL의 [dayofweek 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofweek)와 동일하게 동작합니다.

## 별칭 {#alias}

- DOW

## 구문 {#syntax}

```sql
DAYOFWEEK(<date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | date/datetime 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

날짜에 해당하는 요일 인덱스 값을 나타내는 정수를 반환합니다(1-7, 1은 일요일, 7은 토요일을 나타냅니다).

특수한 경우:

`<date_or_time_expr>`가 NULL이면 NULL을 반환합니다;

## 예제 {#examples}

```sql
---Calculate weekday index value for date type
select dayofweek('2019-06-25');

+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

---Calculate weekday index value for datetime type
select dayofweek('2019-06-25 15:30:45');

+----------------------------------+
| dayofweek('2019-06-25 15:30:45') |
+----------------------------------+
|                                3 |
+----------------------------------+
---Index for Sunday
select dayofweek('2024-02-18');
+-------------------------+
| dayofweek('2024-02-18') |
+-------------------------+
|                       1 |
+-------------------------+

---Input datetime is NULL, returns NULL
select dayofweek(NULL);
+-----------------+
| dayofweek(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
