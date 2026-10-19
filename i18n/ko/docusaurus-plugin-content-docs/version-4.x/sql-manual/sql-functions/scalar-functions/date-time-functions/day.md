---
{
    "title": "DAY",
    "language": "ko",
    "description": "DAY 함수는 날짜 또는 시간 표현식에서 \"일\" 부분을 추출하는 데 사용됩니다."
}
---

## 설명 {#description}

DAY 함수는 날짜 또는 시간 표현식에서 "일" 부분을 추출하여 1부터 31까지의 정숫값을 반환합니다(월과 연도에 따라 다름).

이 함수는 MySQL의 [day 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day)와 동일하게 동작합니다.

## 별칭 {#alias}

- dayofmonth

## 구문 {#syntax}

```sql
DAY(<date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | date/datetime 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환값 {#return-value}

날짜의 "일"에 해당하는 정숫값(1-31)을 반환합니다.

특수한 경우:

`dt`가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql

--Extract day from DATE type
select day('1987-01-31');
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+

---Extract day from DATETIME type (ignoring time part)
select day('2023-07-13 22:28:18');
+----------------------------+
| day('2023-07-13 22:28:18') |
+----------------------------+
|                         13 |
+----------------------------+

---Input is NULL
select day(NULL);
+-----------+
| day(NULL) |
+-----------+
|      NULL |
+-----------+
```
