---
{
    "title": "DAY_FLOOR",
    "language": "ko",
    "description": "DAYFLOOR 함수는 지정된 날짜 또는 시간 값을 지정된 일 단위 주기의 시작 시점으로 내림하는 데 사용됩니다."
}
---

## 설명 {#description}

DAY_FLOOR 함수는 지정된 날짜 또는 시간 값을 지정된 일 단위 주기의 시작 시점으로 내림하는 데 사용됩니다. 입력 날짜 및 시간보다 늦지 않은 주기 시작 시점 중 가장 늦은 시점을 반환합니다. 주기는 period(주기 일수)와 origin(시작 기준 시각)으로 결정됩니다. 시작 기준 시각을 지정하지 않으면 기본값인 0001-01-01 00:00:00을 계산 기준으로 사용합니다.

날짜 계산 공식:

$$
\text{DAY\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$는 기준 시각부터 대상 시각까지의 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
DAY_FLOOR(<date_or_time_expr>)
DAY_FLOOR(<date_or_time_expr>, <origin>)
DAY_FLOOR(<date_or_time_expr>, <period>)
DAY_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | 유효한 날짜 표현식으로, date/datetime/timestamptz 타입을 지원합니다. Date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 각 주기의 일수를 지정하며 INT 타입입니다. 음수 또는 0이면 NULL을 반환합니다. 지정하지 않으면 기본 주기는 1일입니다. |
| `<origin>` | 주기 계산의 시작 기준 시각으로, date/datetime 타입을 지원합니다. |

## 반환 값 {#return-value}

입력값을 지정된 일 단위 주기로 내림한 결과를 나타내는 TIMESTAMPTZ, DATETIME 또는 DATE를 반환합니다.

입력이 유효하면 datetime 타입에 맞는 내림 결과를 반환합니다:

- 입력이 TIMESTAMPTZ이면 먼저 local_time으로 변환한 다음 DAY_FLOOR를 수행합니다(예: `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`에 해당하며, 이때 세션 변수 값은 `+08:00`).
- `<date_or_time_expr>`와 `<period>`에 TIMESTAMPTZ와 DATETIME이 모두 포함되어 있으면 출력은 DATETIME입니다.

특수한 경우:

- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다;
- period가 음수 또는 0이면 오류를 반환합니다;
- scale이 있는 datetime 입력의 경우 출력에도 scale이 적용되며, 소수부는 모두 0이 됩니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 뒤에 있더라도 위 공식에 따라 계산되며, 주기 k는 음수가 됩니다.

## 예제 {#examples}

```sql
-- Round down with a period of five days
select day_floor("2023-07-13 22:28:18", 5);

+-------------------------------------+
| day_floor("2023-07-13 22:28:18", 5) |
+-------------------------------------+
| 2023-07-10 00:00:00                 |
+-------------------------------------+


-- Datetime input with scale, return value has scale with all decimals as 0
mysql> select day_floor("2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_floor("2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-10 00:00:00.000                 |
+-----------------------------------------+


-- Input parameter without period, default to one day as period
select day_floor("2023-07-13 22:28:18");
+----------------------------------+
| day_floor("2023-07-13 22:28:18") |
+----------------------------------+
| 2023-07-13 00:00:00              |
+----------------------------------+

-- Only with origin date and specified date
select day_floor("2023-07-13 22:28:18", "2023-01-01 12:00:00");
+---------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", "2023-01-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-13 12:00:00                                     |
+---------------------------------------------------------+

-- Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

-- Start time is exactly at the beginning of a period, returns input date time
select day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

-- Input is DATE type, period is 3 days
select day_floor(cast("2023-07-13" as date), 3);
+------------------------------------------+
| day_floor(cast("2023-07-13" as date), 3) |
+------------------------------------------+
| 2023-07-11                               |
+------------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform DAY_FLOOR
SELECT DAY_FLOOR('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| DAY_FLOOR('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DAY_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| DAY_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-01 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Period is negative, returns error
select day_floor("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_floor of 2023-07-13 22:28:18, -2 out of range

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+----------------------------------------------------------------+
| day_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 08:00:00.000                                        |
+----------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
select day_floor(NULL, 5, "2023-01-01");
+----------------------------------+
| day_floor(NULL, 5, "2023-01-01") |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
