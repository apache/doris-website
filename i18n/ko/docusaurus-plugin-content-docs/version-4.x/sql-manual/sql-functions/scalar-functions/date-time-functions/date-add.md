---
{
    "title": "DATE_ADD",
    "language": "ko",
    "description": "DATEADD 함수는 지정된 날짜 또는 시간 값에 지정된 시간 간격을 더하고 계산 결과를 반환하는 데 사용됩니다."
}
---

## 설명 {#description}

DATE_ADD 함수는 지정된 날짜 또는 시간 값에 지정된 시간 간격을 더하고 계산 결과를 반환하는 데 사용됩니다.

- 지원되는 입력 날짜 타입에는 DATE, DATETIME, TIMESTAMPTZ가 있습니다(예: '2023-12-31', '2023-12-31 23:59:59', '2023-12-31 23:59:59+08:00').
- 시간 간격은 숫자 값(`expr`)과 단위(`time_unit`)로 지정합니다. `expr`이 양수이면 "더하기"를 의미하고, 음수이면 해당 간격을 "빼기"하는 것과 같습니다.

이 함수는 MySQL의 [date_add 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)와 동일하게 동작합니다.

## 별칭 {#aliases}

- days_add
- adddate

## 구문 {#syntax}

```sql
DATE_ADD(<date_or_time_expr>, INTERVAL <expr> <time_unit>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | 처리할 날짜/시간 값입니다. 지원되는 타입은 datetime 또는 date이며, 초의 소수점 이하 정밀도는 최대 여섯 자리입니다(예: 2022-12-28 23:59:59.999999). 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요 |
| `<expr>` | 더할 시간 간격입니다. 단일 단위(예: `YEAR`)에는 `INT` 타입을, 복합 단위(예: `YEAR_MONTH`)에는 `STRING` 타입을 사용하며, 숫자가 아닌 모든 문자를 구분자로 허용합니다. 따라서 예를 들어 `INTERVAL 6/4 HOUR_MINUTE`는 Doris에서 6시간 4분으로 인식되며, 1시간 30분(6/4 == 1.5)으로 인식되지 않습니다. 복합 단위에서 입력한 간격 값이 너무 짧으면 더 큰 단위의 값은 0으로 설정됩니다. 이 값의 부호는 숫자가 아닌 문자 중 처음 나타나는 문자가 `-`인지 여부만으로 결정됩니다. |
| `<time_unit>` | 열거형 값: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND | 

| time_unit          | 예상 형식(숫자가 아닌 모든 문자를 구분자로 허용) |
| ------------------ | ----------------------------------------- |
| YEAR               | 'YEARS'                                   |
| QUARTER            | 'QUARTERS'                                |
| MONTH              | 'MONTHS'                                  |
| WEEK               | 'WEEKS'                                   |
| DAY                | 'DAYS'                                    |
| HOUR               | 'HOURS'                                   |
| MINUTE             | 'MINUTES'                                 |
| SECOND             | 'SECONDS'                                 |
| MICROSECOND        | 'MICROSECONDS'                            |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## 반환 값 {#return-value}

<date_or_time_expr>와 같은 타입의 결과를 반환합니다:
- DATE 타입을 입력하면 DATE를 반환합니다(날짜 부분만 포함).
- DATETIME 타입을 입력하면 DATETIME을 반환합니다(날짜와 시간 포함).
- TIMESTAMPTZ 타입을 입력하면 TIMESTAMPTZ를 반환합니다(날짜, 시간 및 시간대 오프셋 포함).
- 소수 자릿수가 있는 입력(예: '2024-01-01 12:00:00.123')은 소수 자릿수를 유지하며, 최대 여섯 자리까지 지원합니다.

특수한 경우:
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 유효하지 않은 단위 또는 숫자가 아닌 expr을 사용하면 오류를 반환합니다.
- 복합 단위에서 입력한 구성 요소의 개수가 너무 많거나 어느 한 구성 요소의 값이라도 허용되는 최댓값 922337203685477579를 초과하면 오류를 반환합니다.
- 계산 결과가 날짜 타입의 범위를 벗어나면(예: '0000-00-00 23:59:59' 이전 또는 '9999-12-31 23:59:59' 이후) 오류를 반환합니다.
- 다음 달에 입력 날짜에 해당하는 일자가 없으면 자동으로 다음 달의 마지막 날로 설정됩니다.

## 예제 {#examples}

```sql
-- Add days
select date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+

-- Add quarters
mysql> select DATE_ADD(cast('2023-01-01' as date), INTERVAL 1 QUARTER);
+--------------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 QUARTER) |
+--------------------------------------------+
| 2023-04-01                                 |
+--------------------------------------------+

-- Add weeks
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 WEEK);
+-----------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 WEEK) |
+-----------------------------------------+
| 2023-01-08                              |
+-----------------------------------------+

-- Add months, since February 2023 only has 28 days, January 31 plus one month returns February 28
mysql> select DATE_ADD('2023-01-31', INTERVAL 1 MONTH);
+------------------------------------------+
| DATE_ADD('2023-01-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Negative number test
mysql> select DATE_ADD('2019-01-01', INTERVAL -3 DAY);
+-----------------------------------------+
| DATE_ADD('2019-01-01', INTERVAL -3 DAY) |
+-----------------------------------------+
| 2018-12-29                              |
+-----------------------------------------+

-- Cross-year hour addition
mysql> select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR);
+--------------------------------------------------+
| DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR) |
+--------------------------------------------------+
| 2024-01-01 01:00:00                              |
+--------------------------------------------------+

-- Add DAY_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND);
+-------------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND) |
+-------------------------------------------------------------------+
| 2025-10-24 11:12:13                                               |
+-------------------------------------------------------------------+

-- Add DAY_HOUR
mysql>  select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR);
+----------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR) |
+----------------------------------------------------------+
| 2025-10-24 12:10:10                                      |
+----------------------------------------------------------+

-- For compound units, accept all non-numeric characters as separators.
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR);
+----------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR) |
+----------------------------------------------------------------+
| 2025-10-24 12:10:10                                            |
+----------------------------------------------------------------+

-- Add MINUTE_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND);
+---------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND) |
+---------------------------------------------------------------+
| 2025-10-23 10:11:11                                           |
+---------------------------------------------------------------+

-- Add SECOND_MICROSECOND
mysql>  select date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND);
+---------------------------------------------------------------------------+
| date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND) |
+---------------------------------------------------------------------------+
| 2025-10-10 10:10:11.223456                                                |
+---------------------------------------------------------------------------+

-- For composite units, the sign of the time interval is determined only by whether the first non-digit character is `-`
-- All subsequent `-` are considered part of the delimiter
select 
        DATE_ADD('2025-10-23 10:10:10', INTERVAL '#-1:-1' MINUTE_SECOND) AS first_not_sub,
        DATE_ADD('2025-10-23 10:10:10', INTERVAL '  -1:1' MINUTE_SECOND) AS first_sub;
+---------------------+---------------------+
| first_not_sub       | first_sub           |
+---------------------+---------------------+
| 2025-10-23 10:11:11 | 2025-10-23 10:09:09 |
+---------------------+---------------------+

-- For composite units, if the input time interval is too short, the value of the larger unit will be set to 0.
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1' MINUTE_SECOND) AS minute_interval_is_zero
+-------------------------+
| minute_interval_is_zero |
+-------------------------+
| 2025-10-23 10:10:11     |
+-------------------------+

-- Example of TimestampTz type, SET time_zone = '+08:00'
select DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY);
+-------------------------------------------------------+
| DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY) |
+-------------------------------------------------------+
| 2023-01-03 04:22:33+08:00                             |
+-------------------------------------------------------+

-- If the number of time intervals input is excessive, return an error
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:2:3.4' SECOND_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_microsecond_add of 1:2:3.4 is invalid

-- For composite units, if the value of any part exceeds the maximum value of 922337203685477580
-- return an error
select DATE_ADD('2025-10-10 1:2:3', INTERVAL '922337203685477580' DAY_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_microsecond_add of 2025-10-10 01:02:03, 922337203685477580 out of range

-- Illegal unit
select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 sa);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'sa' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 50)

-- Parameter is NULL, returns NULL
mysql> select DATE_ADD(NULL, INTERVAL 1 MONTH);
+----------------------------------+
| DATE_ADD(NULL, INTERVAL 1 MONTH) |
+----------------------------------+
| NULL                             |
+----------------------------------+

-- Calculated result is not in date range [0000,9999], returns error
mysql> select DATE_ADD('0001-01-28', INTERVAL -2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 0001-01-28, -2 out of range

mysql> select DATE_ADD('9999-01-28', INTERVAL 2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 9999-01-28, 2 out of range
```
