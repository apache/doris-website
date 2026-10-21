---
{
    "title": "TIMESTAMPADD",
    "language": "ko",
    "description": "dateadd 함수와 동일한 기능을 제공합니다. TIMESTAMPADD 함수는 주어진 값에 지정된 단위의 시간 간격을 더하거나 뺍니다. "
}
---

## 설명 {#description}

[date_add 함수](./date-add)와 동일한 기능을 제공합니다.
TIMESTAMPADD 함수는 주어진 datetime 값에 지정된 단위의 시간 간격을 더하거나 뺀 후, 계산된 datetime 값을 반환합니다. 이 함수는 초, 분, 시, 일, 주, 월, 년 등 다양한 시간 단위를 지원하며, 날짜와 시간의 오프셋을 유연하게 계산할 수 있습니다. 음수 간격은 해당 시간만큼 빼는 것을 의미합니다.

이 함수는 MySQL의 [timestampadd 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampadd)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
TIMESTAMPADD(<unit>, <interval>, <date_or_time_expr>)
```

## 매개변수 {#parameters}

| 매개변수             | 설명 |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`              | 더할 시간의 단위를 지정합니다. 일반적으로 사용하는 값으로는 SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR가 있습니다. |
| `<interval>`          | 더할 시간 간격입니다. 일반적으로 정수이며, 양수 또는 음수로 시간을 더하거나 뺄 수 있습니다. |
| `<date_or_time_expr>` | 유효한 대상 날짜로, date/datetime 타입의 입력을 지원합니다. 구체적인 날짜 및 시간 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환값 {#return-value}

기준 날짜 및 시간에 지정된 간격을 더한 결과를 반환합니다.

- 입력이 date 타입이고 시간 단위가 YEAR/MONTH/WEEK/DAY이면 date 타입을 반환하고, 그 외에는 datetime 타입을 반환합니다.
- 입력이 datetime 타입이면 반환값도 datetime 타입입니다.
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59.999999까지)를 벗어나면 예외가 발생합니다.
- `<datetime_expr>`이 유효하지 않은 날짜(예: 0000-00-00, 2023-13-01)이거나 `<unit>`이 지원되지 않는 단위이면 예외가 발생합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 월/년 단위로 계산할 때는 월말 날짜를 자동으로 조정합니다(예: 2023-01-31에 1개월을 더하면 윤년 여부에 따라 2023-02-28 또는 2023-02-29가 됩니다).

## 예제 {#examples}

```sql
-- Add 1 minute
SELECT TIMESTAMPADD(MINUTE, 1, '2019-01-02') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-02 00:01:00 |
+---------------------+

-- Add 1 week (7 days)
SELECT TIMESTAMPADD(WEEK, 1, '2019-01-02') AS result;
+------------+
| result     |
+------------+
| 2019-01-09 |
+------------+

-- Subtract 3 hours
SELECT TIMESTAMPADD(HOUR, -3, '2023-07-13 10:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 07:30:00 |
+---------------------+

-- End of month plus 1 month (automatically adapts to February days)
SELECT TIMESTAMPADD(MONTH, 1, '2023-01-31') AS result;
+------------+
| result     |
+------------+
| 2023-02-28 |
+------------+

-- Cross-year add 1 year
SELECT TIMESTAMPADD(YEAR, 1, '2023-12-31 23:59:59') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-12-31 23:59:59 |
+---------------------+

-- Invalid unit
SELECT TIMESTAMPADD(MIN, 5, '2023-01-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: MIN, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Any parameter is NULL
SELECT TIMESTAMPADD(YEAR,NULL, '2023-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Calculation result exceeds datetime range
SELECT TIMESTAMPADD(YEAR,10000, '2023-12-31 23:59:59') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 2023-12-31 23:59:59, 10000 out of range
```
