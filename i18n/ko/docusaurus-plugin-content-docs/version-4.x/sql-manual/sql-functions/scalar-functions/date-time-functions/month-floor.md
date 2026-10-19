---
{
    "title": "MONTH_FLOOR",
    "language": "ko",
    "description": "monthfloor 함수는 입력 datetime 값을 지정된 월 간격을 기준으로 가장 가까운 이전 시점으로 내림합니다. origin이 지정된 경우,"
}
---

## 설명 {#description}

month_floor 함수는 입력 datetime 값을 지정된 월 간격을 기준으로 가장 가까운 이전 시점으로 내림합니다. origin이 지정되어 있으면 이를 기준으로 사용하고, 그렇지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다.

날짜 계산 수식:
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 대상 시각까지의 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
MONTH_FLOOR(`<datetime>`)
MONTH_FLOOR(`<datetime>`, `<origin>`)
MONTH_FLOOR(`<datetime>`, `<period>`)
MONTH_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<datetime>` | 내림할 datetime 값으로, DATETIME/DATE/TIMESTAMPTZ 타입을 지원합니다. Date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하고, datetime/date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | INT 타입의 월 간격 값으로, 각 간격에 포함되는 개월 수를 나타냅니다. |
| `<origin>` | 간격의 시작 시점으로, DATETIME 및 DATE 타입을 지원합니다. 기본값은 0001-01-01 00:00:00입니다. |

## 반환 값 {#return-value}

DATETIME 타입의 값을 반환하며, 이 값은 입력 datetime을 기준으로 지정된 월 간격에 맞춰 내림한 시각을 나타냅니다. 결과의 시각 부분은 00:00:00으로 설정되고, 일 부분은 01로 잘립니다.

- `<period>`가 양수가 아닌 수(≤0)이면 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- period를 지정하지 않으면 기본적으로 1개월 간격을 사용합니다.
- `<origin>`을 지정하지 않으면 기본적으로 0001-01-01 00:00:00을 기준으로 사용합니다.
- 입력값이 DATE 타입(연도, 월, 일만 포함)이면 시각 부분의 기본값은 00:00:00입니다.
- `<origin>`의 날짜와 시각이 `<period>`보다 이후인 경우에도 위 수식에 따라 계산되지만, 주기 수 k는 음수가 됩니다.
- date_or_time_expr에 scale이 있으면 반환 결과에도 scale이 있으며 소수 부분은 영이 됩니다.
- 입력값이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음(예: `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`에 해당하며, 이때 세션 변수는 `+08:00`), FLOOR 계산을 수행합니다.
- 입력 시각 값(`<datetime>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.

## 예제 {#examples}

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding down with default origin point
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_FLOOR('2023-06-01 00:00:00', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Only with origin date and specified date
 select month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00");
+-----------------------------------------------------------+
| month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-04 00:00:00                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-05-01 00:00:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_FLOOR('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT MONTH_FLOOR('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-09-03 22:20:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before performing the FLOOR operation
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 00:00:00+08:00                |
+------------------------------------------+

-- If the parameters include both TimeStampTz and Datetime types, output the DateTime type.
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2025-12-15 00:00:00.123                                             |
+---------------------------------------------------------------------+

-- Period is non-positive, returns error
SELECT MONTH_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
