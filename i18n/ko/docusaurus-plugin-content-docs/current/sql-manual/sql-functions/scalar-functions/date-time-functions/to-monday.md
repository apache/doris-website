---
{
    "title": "TO_MONDAY",
    "language": "ko",
    "description": "DATE, DATETIME 또는 TIMESTAMP_NS 값이 속한 주의 월요일을 반환합니다."
}
---

## 설명 {#description}

날짜 또는 날짜/시간 값을 가장 가까운 월요일로 내림합니다. 예외적으로 날짜 매개변수가 1970-01-01, 1970-01-02, 1970-01-03, 1970-01-04인 경우에는 1970-01-01을 반환합니다.

## 구문 {#syntax}

```sql
TO_MONDAY(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_date_expr>` | 입력 날짜/시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜/시간 및 날짜 형식은 [날짜/시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환값 {#return-value}

입력 날짜가 속한 주의 월요일을 나타내는 DATE 타입(형식: YYYY-MM-DD) 값을 반환합니다.

- 입력이 1970-01-01, 1970-01-02, 1970-01-03, 1970-01-04 중 하나이면 항상 1970-01-01을 반환합니다.
- 입력이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- 2022-09-10 is Saturday, returns the Monday of that week (2022-09-05)
SELECT TO_MONDAY('2022-09-10') AS result;
+------------+
| result     |
+------------+
| 2022-09-05 |
+------------+

-- input value of datetime type
SELECT TO_MONDAY('2022-09-10 12:22:15') AS result;
+------------+
| result     |
+------------+
| 2022-09-05 |
+------------+

-- Returns the Monday of the week for dates before 1970
SELECT TO_MONDAY('1022-09-10') AS result;
+------------+
| result     |
+------------+
| 1022-09-09 |
+------------+

-- Date that is already Monday: returns itself
SELECT TO_MONDAY('2023-10-09') AS result;  -- 2023-10-09 is Monday
+------------+
| result     |
+------------+
| 2023-10-09 |
+------------+

-- Special dates
SELECT TO_MONDAY('1970-01-02'),TO_MONDAY('1970-01-01'),TO_MONDAY('1970-01-03'),TO_MONDAY('1970-01-04');
+-------------------------+-------------------------+-------------------------+-------------------------+
| TO_MONDAY('1970-01-02') | TO_MONDAY('1970-01-01') | TO_MONDAY('1970-01-03') | TO_MONDAY('1970-01-04') |
+-------------------------+-------------------------+-------------------------+-------------------------+
| 1970-01-01              | 1970-01-01              | 1970-01-01              | 1970-01-01              |
+-------------------------+-------------------------+-------------------------+-------------------------+

-- Input NULL, returns NULL
SELECT TO_MONDAY(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
