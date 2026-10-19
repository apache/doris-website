---
{
    "title": "SECOND_FLOOR",
    "language": "ko",
    "description": "SECOND_FLOOR 함수는 입력 datetime 값을 지정된 초 단위 주기에 맞춰 내림합니다. origin을 지정하면 이를 기준으로 사용하며, 지정하지 않으면 기본 기준값인 0001-01-01 00:00:00을 사용합니다. DATETIME 타입을 처리할 수 있습니다."
}
---

## 설명 {#description}

SECOND_FLOOR 함수는 입력 datetime 값을 지정된 초 단위 주기에 맞춰 내림합니다. origin을 지정하면 이를 기준으로 사용하며, 지정하지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다. 이 함수는 DATETIME 타입을 처리할 수 있습니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{second\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시간부터 대상 시간까지의 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<datetime>` | 필수입니다. 입력 datetime 값입니다. date/datetime/timestamptz 타입의 입력을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 선택 사항입니다. 각 주기를 구성하는 초 수를 나타냅니다. 양의 정수 타입(INT)을 지원합니다. 기본값은 1초입니다. |
| `<origin_datetime>` | 선택 사항입니다. 정렬 기준이 되는 시작점입니다. datetime 타입과 datetime 형식에 맞는 문자열의 입력을 지원합니다. 지정하지 않으면 기본값은 0001-01-01T00:00:00입니다. |

## 반환 값 {#return-value}

TIMESTAMPTZ, DATETIME 또는 DATE 타입의 값을 반환합니다. 입력 datetime을 기준으로 지정된 초 단위 주기에 맞춰 내림한 시간 값을 반환합니다. 반환 값의 정밀도는 입력 datetime 매개변수의 정밀도와 일치합니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 뒤 SECOND_FLOOR 계산을 수행합니다(예: `2025-12-31 23:59:59+05:00`의 local_time은 `2026-01-01 02:59:59`이며, 이는 세션 변수가 `+08:00`일 때의 값입니다).
- 입력 시간 값(`<datetime>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.
- `<period>`가 양수가 아니면(≤0) 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 주기를 지정하지 않으면 기본값으로 1초 주기를 사용합니다.
- `<origin_datetime>`을 지정하지 않으면 기본값인 0001-01-01 00:00:00을 기준으로 사용합니다.
- 입력이 DATE 타입이면(연도, 월, 일만 포함) 시간 부분의 기본값은 00:00:00입니다.
- 소수 자릿수가 있는 datetime의 경우 소수부를 버리고 모든 소수 자릿수를 0으로 설정합니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 뒤에 있더라도 위 공식에 따라 계산되며, 이때 주기 k는 음수가 됩니다.

## 예제 {#examples}

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_FLOOR('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, downward rounding result with default starting point
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:55 |
+---------------------+

-- Only with origin date and specified date
select second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+----------------------------------------------------------------+
| second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+----------------------------------------------------------------+
| 2023-07-13 22:28:17.123                                        |
+----------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_FLOOR('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:34:55.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_FLOOR('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_FLOOR
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

-- Period is non-positive, returns error
mysql> SELECT SECOND_FLOOR('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_floor of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_FLOOR(NULL, 5), SECOND_FLOOR('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| second_floor(NULL, 5)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+
```
