---
{
    "title": "TIMESTAMPDIFF",
    "language": "ko",
    "description": "date-diff 함수와 기능이 같습니다. TIMESTAMPDIFF 함수는 두 datetime 값의 차이를 계산하고 결과를 반환합니다 "
}
---

## 설명 {#description}

[date-diff 함수](./datediff)와 기능이 같습니다.
TIMESTAMPDIFF 함수는 두 datetime 값의 차이를 계산하고 지정된 시간 단위로 결과를 반환합니다. 이 함수는 초, 분, 시간, 일, 주, 월, 연 등 다양한 시간 단위를 지원합니다.

이 함수는 MySQL의 [timestampdiff 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampdiff)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIMESTAMPDIFF(<unit>, <date_or_time_expr1>, <date_or_time_expr2>)
```

## 매개변수 {#parameters}

| 매개변수                | 설명                                                                                                                                                                                                                                                                                                                                                 |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`                 | 차이를 반환할 시간 단위를 지정합니다. 일반적으로 SECOND, MINUTE, HOUR, DAY, MONTH, QUARTER, YEAR 등을 사용합니다.                                                                                                                                                                                                                    |
| `<date_or_time_expr1>`   | 첫 번째 datetime 값으로, 시작 일시입니다. date/datetime 타입의 입력을 지원합니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>`   | 두 번째 datetime 값으로, 종료 일시입니다. date/datetime 타입의 입력을 지원합니다.                                                                                                                                                                                                                                                                                       |

## 반환 값 {#return-value}

두 datetime 값의 차이를 BIGINT 타입으로 반환합니다.

- `<date_or_time_expr2>`가 `<date_or_time_expr1>`보다 나중이면 양수를 반환합니다.
- `<date_or_time_expr2>`가 `<date_or_time_expr1>`보다 이전이면 음수를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<unit>`이 지원되지 않는 단위이면 오류를 반환합니다.
- 특정 단위로 차이를 계산할 때는 그보다 작은 단위도 고려합니다. 예를 들어, 실제 차이가 하루 이상인지 계산하며, 하루에 못 미치면 0을 반환합니다.
- 월 단위 계산의 특수한 경우: 예를 들어, 1-31부터 2-28까지의 차이는 한 달입니다.
- date 타입을 입력하면 시간 부분의 기본값은 00:00:00입니다.

## 예제 {#examples}

```sql
-- Calculate month difference between two dates
SELECT TIMESTAMPDIFF(MONTH, '2003-02-01', '2003-05-01') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Calculate year difference (end date earlier than start date, returns negative value)
SELECT TIMESTAMPDIFF(YEAR, '2002-05-01', '2001-01-01') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

-- Calculate minute difference
SELECT TIMESTAMPDIFF(MINUTE, '2003-02-01', '2003-05-01 12:05:55') AS result;
+--------+
| result |
+--------+
| 128885 |
+--------+

-- Real difference insufficient for one day
SELECT TIMESTAMPDIFF(DAY, '2023-12-31 23:59:50', '2024-01-01 00:00:05') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Invalid unit QUARTER, returns error
SELECT TIMESTAMPDIFF(QUAR, '2023-01-01', '2023-07-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: QUAR, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Special case for month calculation (end of month crossing months)
SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-28') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-27') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL (returns NULL)
SELECT TIMESTAMPDIFF(DAY, NULL, '2023-01-01'), TIMESTAMPDIFF(DAY, '2023-01-01', NULL) AS result;
+---------------------------------------+--------+
| timestampdiff(DAY, NULL, '2023-01-01') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+

-- Week difference calculation
SELECT TIMESTAMPDIFF(WEEK, '2023-01-01', '2023-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

```
