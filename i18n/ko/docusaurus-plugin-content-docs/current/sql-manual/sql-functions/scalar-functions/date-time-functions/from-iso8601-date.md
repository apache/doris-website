---
{
    "title": "FROM_ISO8601_DATE",
    "language": "ko",
    "description": "ISO8601 형식의 날짜 표현식을 DATE 타입의 날짜 표현식으로 변환합니다. ISO 8601 표준을 준수하는 날짜 문자열,"
}
---

## 설명 {#description}

ISO8601 형식의 날짜 표현식을 DATE 타입의 날짜 표현식으로 변환합니다.
ISO 8601 표준을 준수하는 날짜 문자열에 대해 다음 형식을 지원합니다.

- YYYY: 연도만 지정(해당 연도의 첫 달 1일을 반환)
- YYYY-MM: 연도와 월(해당 월의 1일을 반환)
- YYYY-DDD: 연도 + 연중 일수(DDD 범위는 1-366이며, 예를 들어 0000-059는 0000년의 59번째 날을 나타냄)
- YYYY-WWW: 연도 + 주 번호(WWW 범위는 1-53이며, 해당 주의 월요일을 반환)
- YYYY-WWW-D: 연도 + 주 번호 + 요일(D 범위는 1-7이며, 1은 월요일, 7은 일요일을 나타냄)
- 이 형식에서는 한 해의 첫 주가 되려면 해당 주의 목요일이 그 해에 속해야 하며, 그렇지 않으면 이전 연도의 주로 계산합니다.

## 구문 {#syntax}

```sql
from_iso8601_date(<dt>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date>` | ISO8601 형식의 날짜를 나타내는 문자열 |

## 반환 값 {#return-value}

파싱한 날짜를 나타내는 DATE 타입의 값을 YYYY-MM-DD 형식으로 반환합니다.

- 입력 형식이 유효하지 않으면 NULL을 반환합니다.
- 결과가 유효한 datetime 값이 아니면 NULL을 반환합니다.
- 입력이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Parse different ISO 8601 formatted date strings
select 
    from_iso8601_date('2023') as year_only, 
    from_iso8601_date('2023-10') as year_month, 
    from_iso8601_date('2023-10-05') as full_date; 

+------------+------------+------------+
| year_only  | year_month | full_date  |
+------------+------------+------------+
| 2023-01-01 | 2023-10-01 | 2023-10-05 |
+------------+------------+------------+

-- Parse "year-day number" format
select 
    from_iso8601_date('2021-001') as day_1,  
    from_iso8601_date('2021-059') as day_59, 
    from_iso8601_date('2021-060') as day_60,  
    from_iso8601_date('2024-366') as day_366; 
+------------+------------+------------+------------+
| day_1      | day_59     | day_60     | day_366    |
+------------+------------+------------+------------+
| 0000-01-01 | 0000-02-28 | 0000-03-01 | 2024-12-31 |
+------------+------------+------------+------------+

-- Parse "YYYY-Www-D" format (each week starts with Monday), since 0522-01-01 is Thursday, dates before the first week will return year 0521
select from_iso8601_date('0522-W01-1') as week_1;
+------------+
| week_1     |
+------------+
| 0521-12-29 |
+------------+
1 row in set (0.02 sec)

select from_iso8601_date('0522-W01-4') as week_4;
+------------+
| week_4     |
+------------+
| 0522-01-01 |
+------------+

---YYYY-Www format, Monday of the first week is in year 521
select from_iso8601_date('0522-W01') as week_1;
+------------+
| week_1     |
+------------+
| 0521-12-29 |
+------------+

---invalid style, return NULL
select from_iso8601_date('2023-10-01T12:34:10');
+------------------------------------------+
| from_iso8601_date('2023-10-01T12:34:10') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+

---invalid result value, return NULL
select from_iso8601_date('2024-400');
+-------------------------------+
| from_iso8601_date('2024-400') |
+-------------------------------+
| NULL                          |
+-------------------------------+

---input NULL
select from_iso8601_date(NULL);
+-------------------------+
| from_iso8601_date(NULL) |
+-------------------------+
| NULL                    |
+-------------------------+
```
