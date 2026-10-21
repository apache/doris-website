---
{
    "title": "NEXT_DAY",
    "language": "ko",
    "description": "NEXTDAY 함수는 지정된 날짜 이후에 대상 요일과 일치하는 첫 번째 날짜를 반환합니다. 예를 들어 NEXTDAY('2020-01-31',"
}
---

## 설명 {#description}

NEXT_DAY 함수는 지정된 날짜 이후에 대상 요일과 일치하는 첫 번째 날짜를 반환합니다. 예를 들어 NEXT_DAY('2020-01-31', 'MONDAY')는 2020-01-31 이후의 첫 번째 월요일을 반환합니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS 타입을 지원하며, 입력값의 시간 부분은 무시합니다(날짜 부분만을 기준으로 계산합니다).

이 함수는 Oracle의 [next_day 함수](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NEXT_DAY.html)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
NEXT_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 구체적인 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<day_of_week>` | 요일을 식별하는 데 사용하는 문자열 타입의 표현식입니다. |

`<day_of_week>`는 다음 값 중 하나여야 합니다(대소문자를 구분하지 않음).
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 반환값 {#return-value}

기준 날짜 이후에 `<day_of_week>`와 일치하는 첫 번째 날짜를 DATE 타입으로 반환합니다.

특수한 경우:
- 기준 날짜 자체가 대상 요일이면 현재 날짜가 아닌 다음 대상 요일의 날짜를 반환합니다;
- `<date_or_time_expr>`가 NULL이면 NULL을 반환합니다;
- `<day_of_week>`가 유효하지 않은 값(예: 'ABC')이면 예외가 발생합니다;
- 입력값이 9999-12-31이면 시간 포함 여부와 관계없이 해당 날짜 자체를 반환합니다(이 날짜는 유효한 날짜의 최댓값이므로 이후 날짜가 존재하지 않습니다);

## 예제 {#examples}

```sql
-- First Monday after base date
SELECT NEXT_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

-- Including time component (ignores time, uses only date for calculation)
SELECT NEXT_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

-- Base date itself is target day of week (returns next occurrence)
SELECT NEXT_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-24 |
+------------+

-- Target day of week as abbreviation (case insensitive)
SELECT NEXT_DAY('2023-07-13', 'FR') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-14 |
+------------+

-- Input is NULL (returns NULL)
SELECT NEXT_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws exception)
mysql> SELECT NEXT_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function next_day failed to parse weekday: ABC

--- Maximum date (returns itself)
SELECT NEXT_DAY('9999-12-31 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 9999-12-31 |
+------------+
``` 
