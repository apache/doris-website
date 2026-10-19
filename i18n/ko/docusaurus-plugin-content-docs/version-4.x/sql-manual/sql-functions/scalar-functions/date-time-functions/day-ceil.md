---
{
    "title": "DAY_CEIL",
    "language": "ko",
    "description": "dayceil 함수는 지정된 날짜 또는 시간 값을 지정된 일 단위 주기의 가장 가까운 시작 시점으로 올림합니다."
}
---

## 설명 {#description}


day_ceil 함수는 지정된 날짜 또는 시간 값을 지정된 일 단위 주기의 가장 가까운 시작 시점으로 올림합니다. 주기 규칙은 period(일수)와 origin(기준 시각)으로 정의됩니다. origin을 지정하지 않으면 기본값은 0001-01-01 00:00:00입니다.

날짜 계산 수식:
$$
\begin{aligned}
&\text{day\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 목표 시각에 도달하는 데 필요한 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
DAY_CEIL(<date_or_time_expr>)
DAY_CEIL(<date_or_time_expr>, <origin>)
DAY_CEIL(<date_or_time_expr>, <period>)
DAY_CEIL(<date_or_time_expr>, <period>, <origin>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | date/datetime/timestamptz 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 각 주기의 일수를 지정하며, 타입은 INT입니다. 지정하지 않으면 기본 주기는 1일입니다. |
| `<origin>` | 주기 계산의 시작 기준 시각이며, date/datetime 타입을 지원합니다. |

## 반환값 {#return-value}

TIMESTAMPTZ, DATETIME 또는 DATE를 반환하며, 입력값을 지정된 일 단위 주기로 올림한 결과를 나타냅니다.

입력이 유효하면 datetime 타입에 맞는 올림 결과를 반환합니다.

- 입력이 TIMESTAMPTZ이면 먼저 local_time으로 변환한 다음 DAY_CEIL을 수행합니다. 예를 들어 `2025-12-31 23:59:59+05:00`에 해당하는 local_time은 `2026-01-01 02:59:59`이며, 이는 세션 변수의 값이 `+08:00`인 경우입니다.
- `<date_or_time_expr>`와 `<period>`에 TIMESTAMPTZ와 DATETIME이 모두 포함되어 있으면 DATETIME 타입을 반환합니다.

특수한 경우:

- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다;
- period가 음수이거나 0이면 오류를 반환합니다;
- 올림 결과가 날짜 타입의 지원 범위를 벗어나면(예: '9999-12-31' 이후) 오류가 발생합니다.
- scale이 있는 datetime 입력의 경우 출력의 모든 소수 부분이 0으로 절삭되며, 반환값에도 scale이 유지됩니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 이후여도 위 수식에 따라 계산하지만, 주기 k는 음수가 됩니다.

## 예제 {#examples}

```sql
-- Round up with a period of five days
select day_ceil( cast("2023-07-13 22:28:18" as datetime), 5);

+------------------------------------+
| day_ceil("2023-07-13 22:28:18", 5) |
+------------------------------------+
| 2023-07-15 00:00:00                |
+------------------------------------+

-- Datetime input with scale, return value has scale with all decimals as 0
select day_ceil( "2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_ceil( "2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-15 00:00:00.000                 |
+-----------------------------------------+

-- Without specifying period, default to round up by one day
select day_ceil("2023-07-13 22:28:18");

+---------------------------------+
| day_ceil("2023-07-13 22:28:18") |
+---------------------------------+
| 2023-07-14 00:00:00             |
+---------------------------------+

-- Only with origin date and specified date
select day_ceil("2023-07-13 22:28:18", "2021-07-01 12:22:34");
+--------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", "2021-07-01 12:22:34") |
+--------------------------------------------------------+
| 2023-07-14 12:22:34                                    |
+--------------------------------------------------------+

-- Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

-- Date and time is exactly at the start of the period
select day_ceil("2023-07-16 00:00:00", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

-- Input is DATE type, period is 3 days
select day_ceil(cast("2023-07-13" as date), 3);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 3) |
+-----------------------------------------+
| 2023-07-14                              |
+-----------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform DAY_CEIL
SELECT DAY_CEIL('2025-12-31 23:59:59+05:00');
+---------------------------------------+
| DAY_CEIL('2025-12-31 23:59:59+05:00') |
+---------------------------------------+
| 2026-01-02 00:00:00+08:00             |
+---------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DAY_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+------------------------------------------------------------------+
| DAY_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+------------------------------------------------------------------+
| 2026-01-02 00:00:00.123                                          |
+------------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+---------------------------------------------------------------+
| day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+---------------------------------------------------------------+
| 2023-07-17 08:00:00.000                                       |
+---------------------------------------------------------------+

-- Period time is zero, returns NULL
select day_ceil(cast("2023-07-13" as date), 0);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 0) |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+

-- Period is negative
mysql> select day_ceil("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 2023-07-13 22:28:18, -2 out of range

-- Return date exceeds maximum range, returns error
select day_ceil("9999-12-31", 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 9999-12-31 00:00:00, 5 out of range

-- Any parameter is NULL, returns NULL
select day_ceil(NULL, 5, "2023-01-01");

+---------------------------------+
| day_ceil(NULL, 5, "2023-01-01") |
+---------------------------------+
| NULL                            |
+---------------------------------+
```
