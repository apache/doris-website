---
{
    "title": "QUARTER",
    "language": "ko",
    "description": "이 함수는 지정된 날짜가 속한 분기(1~4)를 반환합니다. 각 분기는 세 달로 구성됩니다:"
}
---

## 설명 {#description}

이 함수는 지정된 날짜가 속한 분기(1~4)를 반환합니다. 각 분기는 세 달로 구성됩니다:
- 1분기: 일월부터 삼월까지
- 2분기: 사월부터 유월까지
- 3분기: 칠월부터 구월까지
- 4분기: 시월부터 십이월까지

이 함수는 MySQL의 [quarter 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_quarter)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
QUARTER(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 또는 날짜 및 시간 값입니다. date/datetime 타입을 지원합니다. 구체적인 날짜 및 시간 형식과 날짜 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

- 입력 날짜가 속한 분기를 나타내는 TINYINT를 반환하며, 값의 범위는 1부터 4까지입니다.
- 입력 값이 NULL이면 함수는 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Quarter 1 (January-March)
SELECT QUARTER('2025-01-16') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Including time component (does not affect result)
SELECT QUARTER('2025-01-16 01:11:10') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Quarter 2 (April-June)
SELECT QUARTER('2023-05-20') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

-- Quarter 3 (July-September)
SELECT QUARTER('2024-09-30 23:59:59') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Quarter 4 (October-December)
SELECT QUARTER('2022-12-01') AS result;
+--------+
| result |
+--------+
|      4 |
+--------+

-- Input is NULL (returns NULL)
SELECT QUARTER(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
