---
{
    "title": "YEAR_OF_WEEK",
    "language": "ko",
    "description": "YEAROFWEEK 함수는 ISO 8601 주차 달력 표준에 따라 지정된 날짜의 주차 연도(해당 주가 속한 연도)를 반환합니다."
}
---

## 설명 {#description}

YEAR_OF_WEEK 함수는 ISO 8601 주차 달력 표준에 따라 지정된 날짜의 주차 연도(해당 주가 속한 연도)를 반환합니다. 일반적인 연도와 달리 ISO 주차 연도는 주 단위로 계산됩니다. 한 해의 첫 주는 새해의 4일째 날이 포함된 주이며, 해당 연도에 속하는 날이 최소 4일 포함되어야 합니다.

입력 날짜의 연도를 그대로 반환하는 [year 함수](./year)와 달리, YEAR_OF_WEEK는 ISO 주차 달력 표준을 따릅니다.

자세한 내용은 [ISO 주차 날짜](https://en.wikipedia.org/wiki/ISO_week_date)를 참조하세요.

## 별칭 {#alias}

- `YOW`

## 구문 {#syntax}

```sql
YEAR_OF_WEEK(`<date_or_time_expr>`)
YOW(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.|

## 반환값 {#return-value}

ISO 8601 주차 달력 표준에 따라 계산된 주차 연도를 SMALLINT 타입으로 반환합니다.

- 반환값의 범위는 일반적으로 1-9999입니다.
- 입력이 NULL이면 NULL을 반환합니다.
- 입력이 DATETIME 타입이면 날짜 부분만 고려하고 시간 부분은 무시합니다.

## 예제 {#examples}

```sql
-- 2005-01-01 is Saturday, this week starts from 2004-12-27, contains more days in 2004, belongs to 2004
SELECT YEAR_OF_WEEK('2005-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2004 |
+------------+

-- Using alias YOW, same result
SELECT YOW('2005-01-01') AS yow_alias_result;
+------------------+
| yow_alias_result |
+------------------+
|             2004 |
+------------------+

-- 2005-01-03 is Monday, this week (2005-01-03 to 2005-01-09) is the first week of 2005
SELECT YEAR_OF_WEEK('2005-01-03') AS yow_result;
+------------+
| yow_result |
+------------+
|       2005 |
+------------+

-- 2023-01-01 is Sunday, this week starts from 2022-12-26, belongs to the last week of 2022
SELECT YEAR_OF_WEEK('2023-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2022 |
+------------+

-- 2023-01-02 is Monday, this week (2023-01-02 to 2023-01-08) is the first week of 2023
SELECT YEAR_OF_WEEK('2023-01-02') AS yow_result;
+------------+
| yow_result |
+------------+
|       2023 |
+------------+

-- DATETIME type input, ignoring time part
SELECT YEAR_OF_WEEK('2005-01-01 15:30:45') AS yow_datetime;
+--------------+
| yow_datetime |
+--------------+
|         2004 |
+--------------+

-- Cross-year boundary case: 2024-12-30 is Monday, belongs to the first week of 2025
SELECT YEAR_OF_WEEK('2024-12-30') AS yow_result;
+------------+
| yow_result |
+------------+
|       2025 |
+------------+

-- Input is NULL, returns NULL
SELECT YEAR_OF_WEEK(NULL) AS yow_null;
+----------+
| yow_null |
+----------+
|     NULL |
+----------+
```
