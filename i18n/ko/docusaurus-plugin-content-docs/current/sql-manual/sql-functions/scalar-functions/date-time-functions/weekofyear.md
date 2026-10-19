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
한 해에서 어떤 주에 해당 연도의 날짜가 4일 이상 포함되어 있으면, 그 주를 해당 연도의 제1주로 간주합니다. 그렇지 않으면 그 주는 전년도의 마지막 주(제52주 또는 제53주일 수 있음)에 속합니다.

이 함수는 MySQL의 [weekofyear 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

날짜가 해당 연도의 몇 번째 주에 속하는지를 나타내는 INT 타입의 주 번호를 반환합니다. 범위는 1-53입니다.

- 한 해의 첫 달 1일이 포함된 주에 해당 연도의 날짜가 4일 미만이면(예: 첫 달 1일이 수요일인 경우, 그 주에서 해당 연도에 속하는 날짜는 첫 달 1-3일로 총 3일뿐임), 그 주는 전년도에 속하며 해당 연도의 제1주는 다음 월요일부터 시작합니다.
- 한 해의 마지막 달 말에 해당하는 주의 총 일수가 4일 미만이면, 그 주는 다음 해의 첫째 주에 속합니다.
- 입력이 NULL이면 NULL을 반환합니다.

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

-- NULL input (returns NULL)
SELECT WEEKOFYEAR(NULL) AS week_null_input; 
+-----------------+
| week_null_input |
+-----------------+
|            NULL |
+-----------------+
```
