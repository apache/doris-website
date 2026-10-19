---
{
    "title": "MINUTE_FLOOR",
    "language": "ko",
    "description": "MINUTE_FLOOR는 DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값을 지정된 분 단위 주기의 가장 가까운 경계로 내림합니다."
}
---

## 설명 {#description}

MINUTE_FLOOR는 `DATE`, `DATETIME`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ` 값을 지정된 분 단위 주기의 가장 가까운 경계로 내림합니다. origin을 지정하면 이를 기준점으로 사용하며, 지정하지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다.

날짜 계산식:
$$
\begin{aligned}
&\text{minute\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각부터 대상 시각까지의 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
MINUTE_FLOOR(`<datetime>`)
MINUTE_FLOOR(`<datetime>`, `<origin>`)
MINUTE_FLOOR(`<datetime>`, `<period>`)
MINUTE_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<datetime>` | 내림할 날짜 및 시간 값입니다. DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입의 입력을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 분 단위 간격 값으로, INT 타입이며 각 간격에 포함되는 분 수를 나타냅니다. |
| `<origin>` | 간격의 시작 시점입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다. 기본값은 0001-01-01 00:00:00입니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS`를 입력하면 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위에 속하는지 검증하며, `TIMESTAMP_NS`에는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위를 적용합니다.

`<origin>`을 생략하고 `TIMESTAMP_NS`를 입력하면 문서에 명시된 기본 기준 시각은 내부 정렬 기준으로만 사용됩니다. 따라서 이 기준 시각이 저장 가능한 `TIMESTAMP_NS` 범위 안에 있을 필요는 없습니다.

TIMESTAMPTZ, TIMESTAMP_NS, DATETIME 또는 DATE 타입의 값을 반환합니다. 입력된 날짜 및 시간을 기준으로 지정된 분 단위 주기의 가장 가까운 경계로 내림한 시간 값을 반환합니다. 반환 값의 정밀도는 입력 매개변수 datetime의 정밀도와 같습니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음 MINUTE_FLOOR 계산을 수행합니다(예: `2025-12-31 23:59:59+05:00`은 세션 변수 값이 `2026-01-01 02:59:59`일 때가 아니라, 세션 변수 값이 `+08:00`일 때 앞서 표시된 local_time을 나타냅니다).
- 입력 시간 값(`<date_or_time_expr>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.
- `<period>`가 양수가 아니면(≤0) 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- period를 지정하지 않으면 기본 간격은 1분입니다.
- `<origin>`을 지정하지 않으면 기본값인 0001-01-01 00:00:00을 기준점으로 사용합니다.
- 입력이 DATE 타입이면(연도, 월, 일만 포함) 시간 부분의 기본값은 00:00:00입니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 이후여도 위 공식에 따라 계산하지만, 주기 k는 음수가 됩니다.
- `date_or_time_expr`에 scale이 있으면 반환 결과에도 scale이 유지되며 소수 부분은 영이 됩니다.

## 예제 {#examples}

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:00 |
+---------------------+

-- Using five minutes as one period, rounding down with default origin point
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_FLOOR('2023-07-13 22:25:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_floor("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+------------------------------------------------------------+
| minute_floor("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+------------------------------------------------------------+
| 2023-07-13 22:27:23                                        |
+------------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:25:00 |
+---------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_FLOOR('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MINUTE_FLOOR
SELECT MINUTE_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| MINUTE_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT MINUTE_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| MINUTE_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_FLOOR('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:30:00 |
+---------------------+

-- Period is non-positive, returns error
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_FLOOR(NULL, 5), MINUTE_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| minute_floor(NULL, 5)  | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
