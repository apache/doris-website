---
{
    "title": "YEARS_DIFF",
    "language": "ko",
    "description": "YEARSDIFF 함수는 두 날짜 또는 시간 값 사이에 경과한 온전한 연수를 계산하는 데 사용됩니다."
}
---

## 설명 {#description}

YEARS_DIFF 함수는 두 날짜 또는 시간 값 사이에 경과한 온전한 연수를 계산하며, 시작 시간부터 종료 시간까지 경과한 연수를 결과로 반환합니다. DATE 및 DATETIME 타입을 처리할 수 있으며, 계산 시 월, 일, 시, 분, 초를 포함한 전체 시간 차이를 고려합니다.

## 구문 {#syntax}

```sql
YEARS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr1>` | 종료 날짜로, date/datetime 타입을 지원합니다. datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 시작 날짜로, date/datetime 타입과 날짜 및 시간 형식에 맞는 문자열을 지원합니다. |

## 반환값 {#return-value}

`<date_or_time_expr1>`과 `<date_or_time_expr2>` 사이의 온전한 연수 차이를 나타내는 INT 타입 정수를 반환합니다.

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 늦으면 양수를 반환합니다("온전한 한 해" 조건을 충족해야 합니다. 예를 들어, '2022-03-15 08:30:00'과 '2021-03-15 09:10:00'의 실제 차이는 한 해 미만이므로 0을 반환합니다).
- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 이르면 음수를 반환합니다(계산 방법은 위와 같으며, 결과의 부호를 반대로 바꿉니다).
- 입력이 DATE 타입이면 시간 부분은 기본적으로 00:00:00으로 처리합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 윤년의 이월에 적용되는 특수 사례(예: 2024년은 윤년이며, 이월 29일과 2023년 이월 28일 사이의 차이는 온전한 한 해로 계산됩니다)

## 예제 {#examples}

```sql
-- Year difference of 1 year, and month-day equal (full year)
SELECT YEARS_DIFF('2020-12-25', '2019-12-25') AS diff_full_year;
+----------------+
| diff_full_year |
+----------------+
|              1 |
+----------------+

-- Year difference of 1 year, but end month-day earlier than start month-day (less than a year)
SELECT YEARS_DIFF('2020-11-25', '2019-12-25') AS diff_less_than_year;
+---------------------+
| diff_less_than_year |
+---------------------+
|                   0 |
+---------------------+

-- DATETIME type with time components
SELECT YEARS_DIFF('2022-03-15 08:30:00', '2021-03-15 09:10:00') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             0 |
+---------------+

-- Mixed DATE and DATETIME calculation, DATE type input defaults time part to 00:00:00
SELECT YEARS_DIFF('2024-05-20', '2020-05-20 12:00:00') AS diff_mixed;
+------------+
| diff_mixed |
+------------+
|          3 |
+------------+

-- End time earlier than start time, returns negative number
SELECT YEARS_DIFF('2018-06-10', '2020-06-10') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -2 |
+---------------+

-- Special leap year February case (2024 is a leap year, February 29th vs February 28th 2023, constitutes a full year)
SELECT YEARS_DIFF('2024-02-29', '2023-02-28') AS leap_year_diff;
+----------------+
| leap_year_diff |
+----------------+
|              1 |
+----------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  YEARS_DIFF(NULL, '2023-03-15') AS null_input1,
  YEARS_DIFF('2023-03-15', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
