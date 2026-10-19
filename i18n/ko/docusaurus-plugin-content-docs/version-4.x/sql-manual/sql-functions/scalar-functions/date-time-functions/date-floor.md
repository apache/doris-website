---
{
    "title": "DATE_FLOOR",
    "language": "ko",
    "description": "datefloor 함수는 지정한 날짜 또는 시간 값을 해당 값이 속한 시간 구간의 시작 시점으로 내림합니다."
}
---

## 설명 {#description}

 date_floor 함수는 지정한 날짜 또는 시간 값을 해당 값이 속한 시간 구간의 시작 시점으로 내림합니다. 구간은 period(단위 개수)와 type(단위)으로 정의되며, 고정된 기준 시점인 0001-01-01 00:00:00부터 계산됩니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{date\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시간에서 목표 시간에 도달하는 데 필요한 주기 수를 나타냅니다.

$type$은 주기의 단위를 나타냅니다.

## 구문 {#syntax}

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `date_or_time_expr` | 유효한 날짜 표현식으로, date/datetime/timestamptz 타입의 입력을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `period` | 각 주기를 구성하는 단위 수를 지정하며, `INT` 타입입니다. 시작 시점은 0001-01-01T00:00:00입니다. |
| `type` | 가능한 값: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND |

## 반환값 {#return-value}

반환 타입은 TIMESTAMPTZ, DATETIME 또는 DATE입니다. 지정한 주기에 따라 날짜를 내림한 결과를 반환하며, 타입은 `<date_or_time_expr>`와 같습니다.

`<date_or_time_expr>`의 타입에 맞는 내림 결과를 반환합니다:
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환하고(예: `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`에 해당하며, 이때 세션 변수 값은 `+08:00`), 이후 DATE_FLOOR 계산을 수행합니다.
- 입력이 DATE 타입이면 DATE(날짜 부분만)를 반환합니다;
- 입력이 DATETIME 타입이면 DATETIME(날짜와 시간 포함)을 반환합니다.
- 입력이 TIMESTAMPTZ 타입이면 TIMESTAMPTZ(날짜, 시간, 오프셋 포함)를 반환합니다.
- 입력에 소수 자릿수가 지정되어 있으면 반환값도 해당 자릿수를 유지하며, 소수 부분은 영입니다.

특수한 경우:
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다;
- period가 양의 정수가 아니거나 type이 유효하지 않으면 오류를 반환합니다;

## 예제 {#examples}

```sql
-- Floor down to the nearest 5-second interval (period starts at 00, 05, 10... seconds)
mysql> select date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND);
+------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND) |
+------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                             |
+------------------------------------------------------------------------+

-- Date time with scale will return value with scale
mysql> select date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND);
+----------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND) |
+----------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                                 |
+----------------------------------------------------------------------------+

-- The input time is exactly the start of a 5-day period
mysql> select date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY);
+---------------------------------------------------+
| date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY) |
+---------------------------------------------------+
| 2023-07-10 00:00:00                               |
+---------------------------------------------------+

-- Floor down for date type
mysql> select date_floor("2023-07-13", INTERVAL 5 YEAR);
+-------------------------------------------+
| date_floor("2023-07-13", INTERVAL 5 YEAR) |
+-------------------------------------------+
| 2021-01-01 00:00:00                       |
+-------------------------------------------+

-- TimeStampTz type example, SET time_zone = '+08:00'
-- Convert variable value to local_time(2026-01-01 02:59:59) then perform DATE_FLOOR operation
SELECT DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR);
+----------------------------------------------------------+
| DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR) |
+----------------------------------------------------------+
| 2026-01-01 00:00:00+08:00                                |
+----------------------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 HOUR, '2025-12-15 00:00:00.123') AS result;

-- period is negative, invalid returns error
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5, 0001-01-01 00:00:00 out of range

-- Unsupported type
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 MILLISECOND);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'MILLISECOND' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 52)

-- Any parameter is NULL
mysql> select date_floor(NULL, INTERVAL 5 HOUR);
+-----------------------------------+
| date_floor(NULL, INTERVAL 5 HOUR) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- Floor down every 5 weeks
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK);
+----------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK) |
+----------------------------------------------------+
| 2023-07-10 00:00:00                                |
+----------------------------------------------------+

```
