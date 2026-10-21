---
{
    "title": "MINUTE_CEIL",
    "language": "ko",
    "description": "MINUTE_CEIL 함수는 입력 날짜 및 시간 값을 지정된 분 단위 간격에 맞춰 올림합니다. origin이 지정되면 해당 값을 기준으로 사용하며, 지정되지 않으면 기본 기준값인 0001-01-01 00:00:00을 사용합니다. DATETIME 타입을 처리할 수 있습니다."
}
---

## 설명 {#description}


MINUTE_CEIL 함수는 입력 날짜 및 시간 값을 지정된 분 단위 간격에 맞춰 올림합니다. origin이 지정되면 해당 값을 기준으로 사용하며, 지정되지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다. 이 함수는 DATETIME 타입을 처리할 수 있습니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{minute\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 목표 시각에 도달하는 데 필요한 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
MINUTE_CEIL(`<date_or_time_expr>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<origin>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 올림할 날짜 및 시간 값입니다. date/datetime/timestamptz 타입의 입력을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | INT 타입의 분 단위 간격 값으로, 각 간격에 포함되는 분 수를 나타냅니다. |
| `<origin>` | 간격의 시작 시각으로, DATETIME 타입입니다. 기본값은 0001-01-01 00:00:00입니다. |

## 반환값 {#return-value}

TIMESTAMPTZ, DATETIME 또는 DATE 타입의 값을 반환합니다. 입력 날짜 및 시간 값을 지정된 분 단위 간격에 맞춰 올림한 시간 값을 반환합니다. 반환값의 정밀도는 입력 datetime 매개변수의 정밀도와 같습니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 후 MINUTE_CEIL 계산을 수행합니다(예: `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`을 나타내며, 이때 세션 변수는 `+08:00`입니다).
- 입력 시간 값(`<date_or_time_expr>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 함께 포함되어 있으면 출력은 DATETIME 타입입니다.
- `<period>`가 양수가 아니면(≤0) 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- period를 지정하지 않으면 기본값으로 1분 간격을 사용합니다.
- `<origin>`을 지정하지 않으면 기본값인 0001-01-01 00:00:00을 기준으로 사용합니다.
- 입력이 DATE 타입이면(연도, 월, 일만 포함) 시간 부분의 기본값은 00:00:00입니다.
- 계산 결과가 최대 날짜 및 시간 값인 9999-12-31 23:59:59을 초과하면 오류를 반환합니다.
- `<origin>`의 날짜 및 시간이 `<period>`보다 이후이더라도 위 공식에 따라 계산되지만, 주기 수 k는 음수가 됩니다.
- `date_or_time_expr`에 scale이 있으면 반환 결과에도 scale이 적용되며 소수 부분은 영이 됩니다.

## 예제 {#examples}

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:29:00 |
+---------------------+

-- Using five minutes as one period, rounding up with default origin point
SELECT MINUTE_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_CEIL('2023-07-13 22:30:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+-----------------------------------------------------------+
| minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+-----------------------------------------------------------+
| 2023-07-13 22:28:23                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_CEIL('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_CEIL('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:35:00 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_CEIL('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MINUTE_CEIL
SELECT MINUTE_CEIL('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MINUTE_CEIL('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 03:00:00+08:00                |
+------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT MINUTE_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MINUTE_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2026-01-01 03:00:00.123                                             |
+---------------------------------------------------------------------+

-- Calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns error
SELECT MINUTE_CEIL('9999-12-31 23:59:18', 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 9999-12-31 23:59:18, 6 out of range

-- Period is non-positive, returns error
SELECT MINUTE_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_CEIL(NULL, 5), MINUTE_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| minute_ceil(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
