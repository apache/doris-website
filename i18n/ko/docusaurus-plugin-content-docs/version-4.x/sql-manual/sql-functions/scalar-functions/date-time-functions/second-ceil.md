---
{
    "title": "SECOND_CEIL",
    "language": "ko",
    "description": "SECOND_CEIL 함수는 입력 datetime 값을 지정된 초 단위 주기에 맞춰 올림합니다. origin이 지정되면 해당 값을 기준으로 사용하며, 지정되지 않으면 기본 기준은 0001-01-01 00:00:00입니다. DATETIME 타입을 처리할 수 있습니다."
}
---

## 설명 {#description}


SECOND_CEIL 함수는 입력 datetime 값을 지정된 초 단위 주기에 맞춰 올림합니다. origin이 지정되면 해당 값을 기준으로 사용하며, 지정되지 않으면 기본적으로 0001-01-01 00:00:00을 기준으로 사용합니다. 이 함수는 DATETIME 타입을 처리할 수 있습니다.

날짜 계산 수식:
$$
\begin{aligned}
&\text{second\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시간에서 목표 시간에 도달하는 데 필요한 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<datetime>` | 필수. 입력 datetime 값입니다. date/datetime/timestamptz 타입을 입력할 수 있습니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하십시오. |
| `<period>` | 선택 사항. 각 주기가 몇 초로 구성되는지 나타냅니다. 양의 정수 타입(INT)을 지원합니다. 기본값은 1초입니다. |
| `<origin_datetime>` | 선택 사항. 주기를 정렬하는 기준 시점입니다. datetime 타입과 datetime 형식에 맞는 문자열을 입력할 수 있습니다. 지정하지 않으면 기본값은 0001-01-01T00:00:00입니다. |

## 반환 값 {#return-value}

TIMESTAMPTZ, DATETIME 또는 DATE 타입의 값을 반환합니다. 입력 datetime을 기준으로 지정된 초 단위 주기에 맞춰 올림한 시간 값을 반환합니다. 반환 값의 정밀도는 입력 datetime 매개변수의 정밀도와 일치합니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음 SECOND_CEIL 연산을 수행합니다. 예를 들어 `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`를 나타냅니다(세션 변수가 `+08:00`인 경우).
- 입력 시간 값(`<datetime>` 및 `<period>`)에 TIMESTAMPTZ 타입과 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.
- `<period>`가 양수가 아닌 정수이면(≤0) 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- period를 지정하지 않으면 기본적으로 1초 주기를 사용합니다.
- `<origin>`을 지정하지 않으면 기본적으로 0001-01-01 00:00:00을 기준으로 사용합니다.
- 입력이 DATE 타입이면(연도, 월, 일만 포함) 시간 부분의 기본값은 00:00:00입니다.
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59.999999까지)를 벗어나면 오류를 반환합니다.
- scale이 있는 datetime의 경우 소수점 이하를 모두 0으로 처리합니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 뒤에 있더라도 위 수식에 따라 계산하며, 이때 주기 k는 음수가 됩니다.

## 예제 {#examples}

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_CEIL('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, upward rounding result with default starting point
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- Only with origin date and specified date
select second_ceil("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+---------------------------------------------------------------+
| second_ceil("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+---------------------------------------------------------------+
| 2023-07-13 22:28:18.123                                       |
+---------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_CEIL('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:35:00.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_CEIL('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_CEIL
SELECT SECOND_CEIL('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| SECOND_CEIL('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 02:59:59+08:00                |
+------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| SECOND_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2026-01-01 02:59:59.123                                             |
+---------------------------------------------------------------------+

-- Calculation result exceeds maximum datetime range, returns error
SELECT SECOND_CEIL('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 9999-12-31 23:59:59, 2 out of range

-- Period is non-positive, returns error
mysql> SELECT SECOND_CEIL('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_CEIL(NULL, 5), SECOND_CEIL('2025-01-23 12:34:56', NULL) AS result;
+------------------------+--------+
| second_ceil(NULL, 5)   | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
