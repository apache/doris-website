---
{
    "title": "SECOND_CEIL",
    "language": "ko",
    "description": "SECOND_CEIL은 DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값을 지정된 초 단위 주기의 가장 가까운 경계로 올림합니다."
}
---

## 설명 {#description}


SECOND_CEIL은 `DATE`, `DATETIME`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ` 값을 지정된 초 단위 주기의 가장 가까운 경계로 올림합니다. origin이 지정되면 이를 기준으로 사용하며, 그렇지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다.

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
| `<datetime>` | 필수. 입력 날짜 및 시간 값입니다. DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입의 입력을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 선택 사항. 각 주기가 몇 초로 구성되는지 나타냅니다. 양의 정수 타입(INT)을 지원합니다. 기본값은 1초입니다. |
| `<origin_datetime>` | 선택 사항. 주기 정렬의 시작점입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다. 지정하지 않으면 기본값은 0001-01-01T00:00:00입니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 입력은 소수점 이하 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위에 속하는지 검사합니다. `TIMESTAMP_NS`에는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위가 적용됩니다.

`<origin>`이 생략된 `TIMESTAMP_NS` 입력의 경우, 문서에 명시된 기본 origin은 내부적인 주기 정렬 기준으로만 사용됩니다. 따라서 이 값이 저장 가능한 `TIMESTAMP_NS` 범위에 속할 필요는 없습니다.

TIMESTAMPTZ, TIMESTAMP_NS, DATETIME 또는 DATE 타입의 값을 반환합니다. 입력 날짜 및 시간을 기준으로 지정된 초 단위 주기의 가장 가까운 경계로 올림한 시간 값을 반환합니다. 반환 값의 정밀도는 입력 날짜 및 시간 매개변수의 정밀도와 일치합니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 후 SECOND_CEIL 계산을 수행합니다(예: `2025-12-31 23:59:59+05:00`은 세션 변수 값에 따라 local_time이 달라지며, local_time `2026-01-01 02:59:59`에 해당하는 세션 변수 값은 `+08:00`입니다).
- 입력 시간 값(`<datetime>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.
- `<period>`가 양수가 아닌 정수(≤0)이면 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- period를 지정하지 않으면 기본값으로 1초 주기를 사용합니다.
- `<origin>`을 지정하지 않으면 기본값인 0001-01-01 00:00:00을 기준으로 사용합니다.
- 입력이 DATE 타입(연도, 월, 일만 포함)이면 시간 부분의 기본값은 00:00:00입니다.
- 계산 결과가 DATETIME 타입의 유효 범위(0000-01-01 00:00:00부터 9999-12-31 23:59:59.999999까지)를 벗어나면 오류를 반환합니다.
- 소수 자릿수가 있는 datetime의 경우 소수 부분을 모두 잘라내 0으로 만듭니다.
- `<origin>`의 날짜 및 시간이 `<period>`보다 뒤이더라도 위 수식에 따라 계산되지만, 주기 k는 음수가 됩니다.

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
