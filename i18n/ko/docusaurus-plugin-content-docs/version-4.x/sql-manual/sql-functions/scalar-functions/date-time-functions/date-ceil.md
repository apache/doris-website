---
{
    "title": "DATE_CEIL",
    "language": "ko",
    "description": "dateceil 함수는 지정한 날짜 또는 시간 값을 지정한 시간 간격의 가장 가까운 시작 시점으로 올림합니다."
}
---

## 설명 {#description}


 date_ceil 함수는 지정한 날짜 또는 시간 값을 지정한 시간 간격의 가장 가까운 시작 시점으로 올림합니다. 주기 규칙은 period(단위 수)와 type(단위)으로 정의되며, 고정된 기준 시점인 0001-01-01 00:00:00부터 계산됩니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{date\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각이 목표 시각에 도달하는 데 필요한 주기 수를 나타냅니다.

$type$은 주기의 단위를 나타냅니다

## 구문 {#syntax}

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `date_or_time_expr` | date/datetime/timestamptz 타입의 입력을 지원하는 유효한 날짜 표현식입니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요 |
| `period` | 각 주기를 구성하는 단위 수를 지정하며, 타입은 INT입니다. 시작 시점은 0001-01-01T00:00:00입니다 |
| `type` | YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND 중 하나를 지정할 수 있습니다 |

## 반환 값 {#return-value}

반환 타입은 TIMESTAMPTZ, DATETIME 또는 DATE입니다. 입력 값을 지정한 단위로 올림한 결과를 나타내는 날짜 또는 시간 값을 반환합니다.

`<date_or_time_expr>`의 타입과 일치하는 올림 결과를 반환합니다:
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음(예: `2025-12-31 23:59:59+05:00`는 local_time `2026-01-01 02:59:59`에 해당하며, 이는 세션 변수 값이 `+08:00`일 때의 결과입니다) DATE_CEIL 계산을 수행합니다.
- 입력이 DATE이면 DATE를 반환합니다(날짜 부분만 포함).
- 입력이 DATETIME이면 DATETIME을 반환합니다(날짜와 시간 포함).
- 입력이 TIMESTAMPTZ 타입이면 TIMESTAMPTZ를 반환합니다(날짜, 시간, 오프셋 포함).
- scale이 있는 DATETIME 및 TIMESTAMPTZ의 경우 반환 값에도 scale이 적용되며, 소수 부분은 영이 됩니다.

특수한 경우:
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 올림 결과가 날짜 타입에서 지원하는 범위를 벗어나면 오류를 반환합니다(예: '9999-12-31 23:59:59' 이후).
- period 매개변수가 양의 정수가 아니면 오류가 발생합니다.

## 예제 {#examples}

```sql
-- Round up seconds to the nearest 5-second interval
mysql> select date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second);

+------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second) |
+------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000000                                             |
+------------------------------------------------------------------------+

-- Date time parameter with scale
mysql> select date_ceil(cast("2023-07-13 22:28:18.123" as datetime(3)),interval 5 second);
+-----------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18.123" as datetime(3)),interval 5 second) |
+-----------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000                                                     |
+-----------------------------------------------------------------------------+

-- Round up to the nearest 5-minute interval
select date_ceil("2023-07-13 22:28:18",interval 5 minute);
+--------------------------------------------------------------+
| minute_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+

-- Round up to the nearest 5-week interval
select date_ceil("2023-07-13 22:28:18",interval 5 WEEK);
+--------------------------------------------------+
| date_ceil("2023-07-13 22:28:18",interval 5 WEEK) |
+--------------------------------------------------+
| 2023-08-14 00:00:00                              |
+--------------------------------------------------+

-- Round up to the nearest 5-hour interval
select date_ceil("2023-07-13 22:28:18",interval 5 hour);

+--------------------------------------------------+
| date_ceil("2023-07-13 22:28:18",interval 5 hour) |
+--------------------------------------------------+
| 2023-07-13 23:00:00                   |
+--------------------------------------------------+

-- Round up to the nearest 5-day interval
select date_ceil("2023-07-13 22:28:18",interval 5 day);

+-----------------------------------------------------------+
| day_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-----------------------------------------------------------+
| 2023-07-15 00:00:00                                       |
+-----------------------------------------------------------+

-- Round up to the nearest 5-month interval
select date_ceil("2023-07-13 22:28:18",interval 5 month);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+


-- Round up to the nearest 5-year interval
select date_ceil("2023-07-13 22:28:18",interval 5 year);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+

-- TimeStampTz type example, SET time_zone = '+08:00'
-- Convert variable value to local_time(2026-01-01 02:59:59) then perform DATE_CEIL operation
SELECT DATE_CEIL('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR);
+---------------------------------------------------------+
| DATE_CEIL('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR) |
+---------------------------------------------------------+
| 2027-01-01 00:00:00+08:00                               |
+---------------------------------------------------------+

-- Exceeds the maximum year
mysql> select date_ceil("9999-07-13",interval 5 year);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 9999-07-13 00:00:00, 5 out of range

-- Any parameter is NULL
mysql> select date_ceil("9900-07-13",interval NULL year);
+--------------------------------------------+
| date_ceil("9900-07-13",interval NULL year) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+

mysql> select date_ceil(NULL,interval 5 year);
+---------------------------------+
| date_ceil(NULL,interval 5 year) |
+---------------------------------+
| NULL                            |
+---------------------------------+

-- Invalid parameter, period is negative
mysql> select date_ceil("2023-01-13 22:28:18",interval -5 month);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation month_ceil of 2023-01-13 22:28:18, -5, 0001-01-01 00:00:00 out of range
```
