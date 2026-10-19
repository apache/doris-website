---
{
    "title": "PREVIOUS_DAY",
    "language": "ko",
    "description": "지정한 날짜 이전에서 목표 요일에 해당하는 가장 가까운 날짜를 반환합니다."
}
---

## 설명 {#description}

PREVIOUS_DAY 함수는 지정한 날짜 이전에서 목표 요일에 해당하는 가장 가까운 날짜를 반환합니다. 예를 들어, `PREVIOUS_DAY('2020-01-31', 'MONDAY')`는 2020-01-31 이전의 가장 가까운 월요일을 나타냅니다. 이 함수는 DATE 및 DATETIME 타입의 입력을 받으며, 시간 부분은 무시합니다(날짜 부분만 기준으로 계산합니다).

## 구문 {#syntax}

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## 매개변수 {#parameters}

| 매개변수             | 설명                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<date_or_time_expr>` | DATE/DATETIME 타입을 지원합니다. 구체적인 형식은 [TIMESTAMPTZ 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [DATETIME 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [DATE 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<day_of_week>`       | 요일을 지정하는 문자열 표현식입니다.                                                                                                                                                                                                                                                                                                                                                                        |

`<day_of_week>`는 다음 값 중 하나여야 합니다(대소문자를 구분하지 않음).
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 반환값 {#return-value}

기준 날짜 이전에서 `<day_of_week>`에 해당하는 가장 가까운 날짜를 DATE 타입 값으로 반환합니다.

특수한 경우:
- 기준 날짜 자체가 목표 요일이면 현재 날짜가 아닌 이전 주의 해당 요일을 반환합니다.
- `<date_or_time_expr>`가 NULL이면 NULL을 반환합니다.
- `<day_of_week>`가 유효하지 않은 값(예: 'ABC')이면 예외가 발생합니다.
- 입력이 0000-01-01이면(시간 포함 여부와 관계없이) 입력값 자체를 반환합니다(이 날짜는 유효한 최소 날짜이므로 이전 날짜가 존재하지 않습니다).

## 예제 {#examples}

```sql
--- The first Monday before the base date
SELECT PREVIOUS_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- Including time part (time is ignored, calculation based on date only)
SELECT PREVIOUS_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- The base date itself is the target weekday (returns the previous one)
SELECT PREVIOUS_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

--- Target weekday is an abbreviation (case-insensitive)
SELECT PREVIOUS_DAY('2023-07-13', 'WE') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-12 |
+------------+

--- Input is NULL (returns NULL)
SELECT PREVIOUS_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws an exception)
mysql> SELECT PREVIOUS_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function previous_day failed to parse weekday: ABC

--- Minimum date (returns itself)
SELECT PREVIOUS_DAY('0000-01-01 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 0000-01-01 |
+------------+
```
