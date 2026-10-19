---
{
    "title": "YEAR",
    "language": "ko",
    "description": "YEAR 함수는 지정된 날짜 또는 시간 값에서 연도 부분을 추출하여 정수로 반환합니다."
}
---

## 설명 {#description}
YEAR 함수는 지정된 날짜 또는 시간 값에서 연도 부분을 추출하여 정수로 반환합니다. DATE 및 DATETIME 타입을 지원합니다.

이 함수는 MySQL의 [year 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year)와 동일하게 동작합니다.

## 구문 {#syntax}
```sql
YEAR(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 연도를 추출할 날짜 및 시간 값으로, date/datetime 타입을 지원합니다. datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

date/datetime 타입의 값에서 연도 부분을 INT 타입으로 반환하며, 범위는 0-9999입니다.

- 입력 매개변수가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Extract year from DATE type
SELECT YEAR('1987-01-01') AS year_date;
+-----------+
| year_date |
+-----------+
|      1987 |
+-----------+

-- Extract year from DATETIME type (ignoring hours, minutes, seconds)
SELECT YEAR('2024-05-20 14:30:25') AS year_datetime;
+---------------+
| year_datetime |
+---------------+
|          2024 |
+---------------+

-- Input is NULL (returns NULL)
SELECT YEAR(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
