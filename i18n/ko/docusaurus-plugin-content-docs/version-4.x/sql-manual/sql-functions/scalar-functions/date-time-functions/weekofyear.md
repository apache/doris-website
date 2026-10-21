---
{
    "title": "WEEKOFYEAR",
    "language": "ko",
    "description": "WEEKOFYEAR 함수는 지정된 날짜가 해당 연도의 몇 번째 주에 속하는지 반환합니다(범위: 1-53). 한 주는 월요일에 시작하여 일요일에 끝납니다."
}
---

## 설명 {#description}
WEEKOFYEAR 함수는 지정된 날짜가 해당 연도의 몇 번째 주에 속하는지 반환합니다(범위: 1-53).
한 주는 월요일에 시작하여 일요일에 끝납니다.
어떤 주에 해당 연도에 속하는 날이 4일 이상 포함되어 있으면 그 주를 해당 연도의 1번째 주로 간주합니다. 그렇지 않으면 그 주는 전년도의 마지막 주(52주차 또는 53주차)에 속합니다.

이 함수는 MySQL의 [weekofyear 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, date/datetime 타입을 지원합니다. datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하십시오. |

## 반환값 {#return-value}

INT 타입의 주 번호를 반환합니다. 범위는 1-53이며, 해당 날짜가 그해의 몇 번째 주에 속하는지를 나타냅니다.

- 새해 1일이 포함된 주에서 해당 연도에 속하는 날이 4일 미만이면(예를 들어 새해 1일이 수요일인 경우, 해당 주에서 그해에 속하는 날은 같은 달 1-3일로 총 3일), 그 주는 전년도에 속하며 해당 연도의 1번째 주는 다음 월요일부터 시작합니다.
- 십이월 말의 주에 포함된 날이 총 4일 미만이면, 그 주는 다음 해의 첫 번째 주에 속합니다.
- 입력값이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- 2023-05-01 is Monday, belongs to week 18 of 2023
SELECT WEEKOFYEAR('2023-05-01') AS week_20230501; 
+---------------+
| week_20230501 |
+---------------+
|            18 |
+---------------+

-- The week from 2023-01-02 to 2023-01-08 contains 7 days in 2023 (≥4), belongs to week 1 of 2023
SELECT WEEKOFYEAR('2023-01-02') AS week_20230102;  
+---------------+
| week_20230102 |
+---------------+
|             1 |
+---------------+

-- 2024-01-01 (Monday) belongs to week 1 of 2024
SELECT WEEKOFYEAR('2024-01-01') AS week_20240101;
+---------------+
| week_20240101 |
+---------------+
|             1 |
+---------------+

-- The week 2021-12-27 (Monday) through 2022-01-02 (Sunday) only has 2 days
-- in 2022 (<4), so it belongs to the last week of 2021 (week 52)
SELECT WEEKOFYEAR('2022-01-02') AS week_20220102;
+---------------+
| week_20220102 |
+---------------+
|            52 |
+---------------+

-- 2023-12-25 (Monday) through 2023-12-31 (Sunday) has 7 days in 2023 (≥4),
-- so it belongs to week 52 of 2023
SELECT WEEKOFYEAR('2023-12-25') AS week_20231225;
+---------------+
| week_20231225 |
+---------------+
|            52 |
+---------------+

-- Pre-modern dates work too — the function does not validate a minimum year
SELECT weekofyear('1023-01-04');
+--------------------------+
| weekofyear('1023-01-04') |
+--------------------------+
|                        1 |
+--------------------------+

-- NULL input (returns NULL)
SELECT WEEKOFYEAR(NULL) AS week_null_input; 
+-----------------+
| week_null_input |
+-----------------+
|            NULL |
+-----------------+
```
