---
{
    "title": "HOUR_FLOOR",
    "language": "ko",
    "description": "HOUR_FLOOR 함수는 입력 datetime 값을 지정한 시간 주기에 맞춰 내려 가장 가까운 주기 시작 시각으로 조정합니다. 예를 들어 주기가 5시간이면 입력 시각을 해당 주기의 시작 시각으로 조정합니다."
}
---

## 설명 {#description}

HOUR_FLOOR 함수는 입력 datetime 값을 지정한 시간 주기에 맞춰 내려 가장 가까운 주기 시작 시각으로 조정합니다. 예를 들어 주기가 5시간이면 입력 시각을 해당 주기의 시작 시각으로 조정합니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{hour\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 대상 시각까지의 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
HOUR_FLOOR(`<date_or_time_expr>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<origin>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | datetime/date/timestamptz 타입을 지원하는 유효한 날짜 표현식입니다. Date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하고, datetime/date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 주기 길이(단위: 시간)를 지정하는 선택적 매개변수로, 양의 정수(예: 2, 6, 12)여야 합니다. 기본값은 1이며, 1시간마다 한 주기가 반복됨을 나타냅니다. |
| `<origin>` | 주기의 기준이 되는 시작 시각으로, datetime/date 타입을 지원합니다. 지정하지 않으면 기본값은 0001-01-01T00:00:00입니다. |

## 반환 값 {#return-value}

내림한 결과에서 가장 가까운 주기 시작 시각을 나타내는 TIMESTAMPTZ, DATETIME 또는 DATE 타입 값을 반환합니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 후 FLOOR 계산을 수행합니다. 예를 들어 `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`에 해당합니다(세션 변수 값이 `+08:00`인 경우).
- 입력 시간 값(`<date_or_time_expr>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 함께 포함되어 있으면 출력은 DATETIME 타입입니다.
- 입력 주기가 양수가 아닌 정수이면 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 결과로 NULL을 반환합니다.
- origin 또는 datetime에 scale이 있으면 반환 결과에도 scale이 있습니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 뒤에 있으면 위 공식에 따라 계산되지만 주기 k는 음수가 됩니다.

## 예제 {#examples}

```sql

-- Round down by 5-hour period, default origin is 0001-01-01 00:00:00
mysql> select hour_floor("2023-07-13 22:28:18", 5);
+--------------------------------------+
| hour_floor("2023-07-13 22:28:18", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- Using 2023-07-13 08:00 as origin, divide by 4-hour periods
mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+---------------------+
| custom_origin       |
+---------------------+
| 2023-07-13 16:00:00 |
+---------------------+

-- Input datetime exactly at period edge, return input datetime value
select hour_floor("2023-07-13 18:00:00", 5);
+--------------------------------------+
| hour_floor("2023-07-13 18:00:00", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- Only with origin date and specified date
select hour_floor("2023-07-13 22:28:18", "2023-07-01 12:12:00");
+----------------------------------------------------------+
| hour_floor("2023-07-13 22:28:18", "2023-07-01 12:12:00") |
+----------------------------------------------------------+
| 2023-07-13 22:12:00                                      |
+----------------------------------------------------------+

-- Input date type will be converted to start time 2023-07-13 00:00:00 of the day
mysql> select hour_floor('2023-07-13 20:30:00', 4, '2023-07-13');
+----------------------------------------------------+
| hour_floor('2023-07-13 20:30:00', 4, '2023-07-13') |
+----------------------------------------------------+
| 2023-07-13 20:00:00                                |
+----------------------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform HOUR_FLOOR
SELECT HOUR_FLOOR('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| HOUR_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-01-01 02:00:00                     |
+-----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT HOUR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| HOUR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-01 02:00:00.123                                            |
+--------------------------------------------------------------------+

-- If origin or datetime has scale, the returned result has scale
mysql> select hour_floor('2023-07-13 19:30:00.123', 4, '2023-07-03 08:00:00') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.000 |
+-------------------------+

mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-03 08:00:00.123') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.123 |
+-------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select hour_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') ;
+-----------------------------------------------------------------+
| hour_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+-----------------------------------------------------------------+
| 2023-07-13 16:00:00.000                                         |
+-----------------------------------------------------------------+

-- Input any parameter as NULL (returns NULL)
mysql> select hour_floor(null, 6) as null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Period is negative, returns erro
mysql> select hour_floor('2023-12-31 23:59:59', -3);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation hour_floor of 2023-12-31 23:59:59, -3 out of range

```
