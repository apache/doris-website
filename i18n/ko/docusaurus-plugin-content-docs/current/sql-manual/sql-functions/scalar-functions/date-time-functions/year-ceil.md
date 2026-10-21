---
{
    "title": "YEAR_CEIL",
    "language": "ko",
    "description": "yearceil 함수는 입력 datetime 값을 지정된 연도 간격의 시작 시각 중 가장 가까운 시각으로 올림하며, 간격 단위는 년입니다."
}
---

## 설명 {#description}


year_ceil 함수는 입력 datetime 값을 지정된 연도 간격의 시작 시각 중 가장 가까운 시각으로 올림하며, 간격 단위는 년입니다. origin을 지정하면 이를 기준으로 사용하고, 지정하지 않으면 기본값인 0000-01-01 00:00:00을 사용합니다.

날짜 계산 수식:
$$
\begin{aligned}
&\text{year\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 목표 시각에 도달하는 데 필요한 주기 수를 나타냅니다.

## 구문 {#syntax}
```sql
YEAR_CEIL(<date_or_time_expr>)
YEAR_CEIL(<date_or_time_expr>, origin)
YEAR_CEIL(<date_or_time_expr>, <period>)
YEAR_CEIL(<date_or_time_expr>, <period>, <origin>)
```
## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 올림할 datetime 값으로, DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원합니다. Date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 선택 사항으로, 각 주기를 구성하는 연도 수를 나타내며 양의 정수 타입(INT)을 지원합니다. 기본값은 1년입니다. |
| `<origin_datetime>` | 간격의 기준 시작점으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 기본값은 0000-01-01 00:00:00입니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 타입의 입력은 초 소수 부분의 자릿수가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위에 속하는지 검증하며, `TIMESTAMP_NS`의 범위는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`입니다.

`<origin>`을 생략한 `TIMESTAMP_NS` 입력에서는 문서에 명시된 기본 origin을 내부 정렬 기준으로만 사용합니다. 이 값이 저장 가능한 `TIMESTAMP_NS` 범위 안에 있을 필요는 없습니다.

입력 타입(TIMESTAMP_NS, DATETIME 또는 DATE)과 일치하는 결과를 반환하며, 이 결과는 올림 후의 연도 간격 시작 시각을 나타냅니다:

- 입력이 DATE 타입이면 DATE 타입(날짜 부분만 포함)을 반환합니다. 입력이 DATETIME 또는 올바른 형식의 문자열이면 DATETIME 타입을 반환합니다(시간 부분은 origin과 일치하며, origin이 없으면 기본값은 00:00:00).
- `<period>`가 양의 정수가 아니면(≤0) 함수는 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<date_or_time_expr>`가 간격의 시작 지점과 정확히 일치하면(`<period>` 및 `<origin>` 기준) 해당 시작 지점을 반환합니다.
- 계산 결과가 최대 datetime 값인 9999-12-31 23:59:59를 초과하면 오류를 반환합니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 뒤에 있으면 위 수식에 따라 계산되지만, 주기 k는 음수가 됩니다.
- date_or_time_expr에 scale이 있으면 반환 결과에도 scale이 적용되며, 소수 부분은 영이 됩니다.
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음 CEIL 계산을 수행합니다(예: `2025-12-31 23:59:59+05:00`이 나타내는 local_time은 `2026-01-01 02:59:59`이며, 이때 세션 변수는 `+08:00`입니다).
- 입력 시간 값(`<date_or_time_expr>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.

## 예제 {#examples}

```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds up to 2024-01-01
SELECT YEAR_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds up to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-01 00:00:00 |  
+---------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_CEIL(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2024-01-01 |
+------------+

-- Only with origin date and specified date
select year_ceil("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+---------------------------------------------------------+
| year_ceil("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+---------------------------------------------------------+
| 2024-03-13 22:13:00                                     |
+---------------------------------------------------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2024-01-01
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- input with scale
mysql> SELECT YEAR_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2026-01-01 00:00:00.000 |
+-------------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_CEIL('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_CEIL('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform YEAR_CEIL
SELECT YEAR_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2027-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT YEAR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2027-01-01 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Calculation result exceeds maximum datetime, returns error
SELECT YEAR_CEIL('9999-12-31 22:28:18', 5) AS result;
-- ERROR: Operation out of range
```
